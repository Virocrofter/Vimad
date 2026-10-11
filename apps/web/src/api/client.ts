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

const PREEMPTIVE_REFRESH_MS = 60_000;

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
  if (!expiry) return true;
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
// API versioning: single mount per router on the backend (legacy mounts were
// cut). Every relative request path is routed under /v1 EXCEPT /auth/*, which
// stays unversioned. Absolute URLs are left untouched.
// ─────────────────────────────────────────────────────────────────────────────

const UNVERSIONED_PATH_PATTERNS: RegExp[] = [/^\/auth(?:\/|$)/];

function normalizeApiVersion(config: InternalAxiosRequestConfig): void {
  const url = config.url;
  if (!url) return;
  if (/^https?:\/\//i.test(url)) return; // absolute URL — leave alone
  if (url.startsWith('/v1')) return; // already versioned
  if (UNVERSIONED_PATH_PATTERNS.some((re) => re.test(url))) return; // /auth/*
  config.url = `/v1${url.startsWith('/') ? url : `/${url}`}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor: Versioning + Attach JWT + Pre-emptive Refresh
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    normalizeApiVersion(config);

    const isPublicEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/forgot-password') ||
      config.url?.includes('/auth/reset-password');

    if (isPublicEndpoint) {
      return config;
    }

    const token = getAccessToken();

    if (token && isTokenExpiringSoon(token) && !config.headers['x-skip-preemptive-refresh']) {
      if (!config.url?.includes('/auth/refresh')) {
        try {
          const newToken = await performTokenRefresh();
          if (newToken && config.headers) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
          return config;
        } catch {
          // Let response interceptor handle 401
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        await handleLogout('session_expired');
        return Promise.reject(error);
      }

      originalRequest._retry = true;

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

      try {
        const newToken = await performTokenRefresh();
        onTokenRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        onTokenRefreshFailed(refreshError as Error);
        await handleLogout('session_expired');
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      console.warn('[API] Permission denied:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Token refresh logic
// ─────────────────────────────────────────────────────────────────────────────

async function performTokenRefresh(): Promise<string> {
  if (isRefreshing) {
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

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });

    const { data } = response.data;
    const newToken = data.token;
    const newRefreshToken = data.refreshToken;

    if (!newToken) {
      throw new Error('Refresh response missing token');
    }

    setTokens(newToken, newRefreshToken);
    useAuthStore.setState({
      token: newToken,
      refreshToken: newRefreshToken,
      user: data.user,
      isAuthenticated: true,
    });

    broadcastAuthEvent({ type: 'token_refreshed', token: newToken, refreshToken: newRefreshToken });

    return newToken;
  } finally {
    isRefreshing = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout handler
// ─────────────────────────────────────────────────────────────────────────────

async function handleLogout(reason: 'session_expired' | 'auth_error' = 'session_expired') {
  clearTokens();
  useAuthStore.getState().clearAuth();

  broadcastAuthEvent({ type: 'logout' });

  const currentPath = window.location.pathname;
  const isAuthPage = currentPath.startsWith('/auth/');

  if (!isAuthPage && typeof window !== 'undefined') {
    const redirectUrl = `/auth/login?reason=${reason}&redirect=${encodeURIComponent(currentPath)}`;
    window.location.replace(redirectUrl);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-tab auth synchronization
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
  const bc = getBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage(message);
    } catch {
      // ignore
    }
  }

  try {
    localStorage.setItem('vimad_auth_event', JSON.stringify({ ...message, _ts: Date.now() }));
    setTimeout(() => {
      localStorage.removeItem('vimad_auth_event');
    }, 100);
  } catch {
    // ignore
  }
}

export function setupAuthSync(): () => void {
  const listeners: Array<() => void> = [];

  const bc = getBroadcastChannel();
  if (bc) {
    const handler = (event: MessageEvent<AuthBroadcastMessage>) => {
      handleAuthBroadcast(event.data);
    };
    bc.addEventListener('message', handler);
    listeners.push(() => bc.removeEventListener('message', handler));
  }

  const storageHandler = (event: StorageEvent) => {
    if (event.key === 'vimad_auth_event' && event.newValue) {
      try {
        const data = JSON.parse(event.newValue) as AuthBroadcastMessage & { _ts: number };
        if (Date.now() - (data._ts ?? 0) < 500) {
          handleAuthBroadcast(data);
        }
      } catch {
        // ignore
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
      setTokens(message.token, message.refreshToken);
      useAuthStore.setState({
        token: message.token,
        refreshToken: message.refreshToken,
        isAuthenticated: true,
      });
      break;
    }
    case 'logout': {
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
// Convenience wrappers — params typed as `object` to accept any params shape
// ─────────────────────────────────────────────────────────────────────────────

export async function apiGet<T>(url: string, params?: object): Promise<T> {
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
// ApiError — normalized error with status + server code
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = 'ApiError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Compatibility exports
// ─────────────────────────────────────────────────────────────────────────────

export const api = {
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  put: apiPut,
  delete: apiDelete,
};

export function getApiClient() {
  return api;
}
