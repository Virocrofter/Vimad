/* apps/web/src/api/client.ts */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  getAccessToken,
  getRefreshToken,
  clearTokens,
  setTokens,
  useAuthStore,
} from '../stores/authStores';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// ─────────────────────────────────────────────────────────────────────────────
// Token refresh deduplication (queue + single-flight)
// ─────────────────────────────────────────────────────────────────────────────

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

let isRefreshing = false;
let refreshQueue: QueuedRequest[] = [];

function subscribeTokenRefresh(cb: QueuedRequest): void {
  refreshQueue.push(cb);
}

function onTokenRefreshed(token: string): void {
  refreshQueue.forEach((cb) => cb.resolve(token));
  refreshQueue = [];
}

function onTokenRefreshFailed(error: Error): void {
  refreshQueue.forEach((cb) => cb.reject(error));
  refreshQueue = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Token expiration helpers
// ─────────────────────────────────────────────────────────────────────────────

const PREEMPTIVE_REFRESH_MS = 60_000; // refresh 1 minute before expiry

interface DecodedToken {
  exp: number;
  iat: number;
}

function getTokenExpiry(token: string): number | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isTokenExpiringSoon(token: string, bufferMs: number = PREEMPTIVE_REFRESH_MS): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true; // treat un-decodable as expired
  return Date.now() + bufferMs >= expiry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor: Attach JWT + Pre-emptive Refresh
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auth for public endpoints
    const isPublicEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/reset-password');

    if (isPublicEndpoint) {
      return config;
    }

    const token = getAccessToken();

    // ─── Pre-emptive refresh: rotate before expiry ───
    if (token && isTokenExpiringSoon(token) && !config.headers['x-skip-preemptive-refresh']) {
      // Prevent recursive refresh loops by marking the refresh request itself
      if (!config.url?.includes('/auth/refresh')) {
        try {
          const newToken = await performTokenRefresh();
          if (newToken && config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          return config;
        } catch {
          // Let the request proceed with current token; response interceptor
          // will handle the 401 if it's truly expired
        }
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor: Handle 401 → Refresh → Retry
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // ─── Handle 401 Unauthorized ───
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If this was the refresh token endpoint itself → session dead
      if (originalRequest.url?.includes('/auth/refresh')) {
        await handleLogout('session_expired');
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // ─── Queue this request if a refresh is already in flight ───
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: Error) => {
              reject(err);
            },
          });
        });
      }

      // ─── Single-flight token refresh ───
      try {
        const newToken = await performTokenRefresh();

        onTokenRefreshed(newToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        onTokenRefreshFailed(refreshError as Error);
        await handleLogout('session_expired');
        return Promise.reject(refreshError);
      }
    }

    // ─── Handle 403 Forbidden ───
    if (error.response?.status === 403) {
      console.warn('[API] Permission denied:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Token refresh logic (extracted for reuse by request + response interceptors)
// ─────────────────────────────────────────────────────────────────────────────

async function performTokenRefresh(): Promise<string> {
  if (isRefreshing) {
    // Another caller already started; wait for it
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Use a raw axios instance (no interceptors) to avoid infinite loops
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { data } = response.data;
    const newToken = data.token;
    const newRefreshToken = data.refreshToken;

    if (!newToken) {
      throw new Error('Refresh response missing token');
    }

    // Persist to storage + sync across tabs
    setTokens(newToken, newRefreshToken);
    useAuthStore.setState({
      token: newToken,
      refreshToken: newRefreshToken,
      user: data.user,
      isAuthenticated: true,
    });

    // Broadcast auth change to other tabs
    broadcastAuthEvent({ type: 'token_refreshed', token: newToken, refreshToken: newRefreshToken });

    return newToken;
  } finally {
    isRefreshing = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout handler (centralized redirect)
// ─────────────────────────────────────────────────────────────────────────────

async function handleLogout(reason: 'session_expired' | 'auth_error' = 'session_expired') {
  clearTokens();
  useAuthStore.getState().clearAuth();

  // Broadcast logout to other tabs
  broadcastAuthEvent({ type: 'logout' });

  const currentPath = window.location.pathname;
  const isAuthPage = currentPath.startsWith('/auth/');

  if (!isAuthPage && typeof window !== 'undefined') {
    const redirectUrl = `/auth/login?reason=${reason}&redirect=${encodeURIComponent(currentPath)}`;
    window.location.replace(redirectUrl);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-tab auth synchronization (BroadcastChannel + storage fallback)
// ─────────────────────────────────────────────────────────────────────────────

type AuthBroadcastMessage =
  { type: 'token_refreshed'; token: string; refreshToken: string } | { type: 'logout' };

let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!broadcastChannel && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('vimad_auth_sync');
  }
  return broadcastChannel;
}

function broadcastAuthEvent(message: AuthBroadcastMessage): void {
  // BroadcastChannel (instant, same-origin)
  const bc = getBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage(message);
    } catch {
      // ignore
    }
  }

  // localStorage fallback (works across all same-origin contexts)
  try {
    localStorage.setItem('vimad_auth_event', JSON.stringify({ ...message, _ts: Date.now() }));
    // Clean up to avoid stale events on next read
    setTimeout(() => {
      localStorage.removeItem('vimad_auth_event');
    }, 100);
  } catch {
    // ignore (e.g. private mode)
  }
}

// ─── Setup cross-tab listeners (call once on app init) ───
export function setupAuthSync(): () => void {
  const listeners: Array<() => void> = [];

  // BroadcastChannel listener
  const bc = getBroadcastChannel();
  if (bc) {
    const handler = (event: MessageEvent<AuthBroadcastMessage>) => {
      handleAuthBroadcast(event.data);
    };
    bc.addEventListener('message', handler);
    listeners.push(() => bc.removeEventListener('message', handler));
  }

  // localStorage fallback listener
  const storageHandler = (event: StorageEvent) => {
    if (event.key === 'vimad_auth_event' && event.newValue) {
      try {
        const data = JSON.parse(event.newValue) as AuthBroadcastMessage & { _ts: number };
        // Ignore our own events (dedup via timestamp proximity)
        if (Date.now() - (data._ts ?? 0) < 500) {
          handleAuthBroadcast(data);
        }
      } catch {
        // ignore parse errors
      }
    }
  };
  window.addEventListener('storage', storageHandler);
  listeners.push(() => window.removeEventListener('storage', storageHandler));

  return () => listeners.forEach((fn) => fn());
}

function handleAuthBroadcast(message: AuthBroadcastMessage): void {
  switch (message.type) {
    case 'token_refreshed': {
      // Another tab refreshed — adopt the new tokens
      setTokens(message.token, message.refreshToken);
      useAuthStore.setState({
        token: message.token,
        refreshToken: message.refreshToken,
        isAuthenticated: true,
      });
      break;
    }
    case 'logout': {
      // Another tab logged out — clear our state too
      clearTokens();
      useAuthStore.getState().clearAuth();
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/auth/')) {
        window.location.replace('/auth/login?reason=session_expired');
      }
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers
// ─────────────────────────────────────────────────────────────────────────────

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get(url, { params });
  return response.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post(url, data);
  return response.data;
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.patch(url, data);
  return response.data;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put(url, data);
  return response.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiClient.delete(url);
  return response.data;
}
// ─────────────────────────────────────────────────────────────────────────────
// Compatibility exports (used by api/*.ts modules and admin pages)
// ─────────────────────────────────────────────────────────────────────────────

/** Normalized API error with status + server message */
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(error: AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    super(data?.message ?? error.message);
    this.name = 'ApiError';
    this.status = error.response?.status ?? 0;
    this.data = error.response?.data;
  }
}

/** Object-style wrapper so callers can do api.get(url, params) — returns data directly */
export const api = {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  put: apiPut,
  delete: apiDelete,
};

/** Back-compat for api modules that call getApiClient() — returns the same wrapper */
export function getApiClient() {
  return api;
}
