/* apps/web/src/lib/offline/axios.ts
 * Axios integration for the offline layer.
 * NOTE: request interceptors run in REVERSE registration order, so the
 * request interceptor here runs BEFORE the auth interceptor in client.ts —
 * URLs are seen RAW (no /v1 prefix yet). Skip rules mirror
 * normalizeApiVersion: skip /auth/* and absolute URLs, queue the rest.
 */
import type { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { enqueueMutation } from './queue.js';
import { captureSnapshot, snapshotResponse } from './snapshot.js';

const MUTATING = new Set(['post', 'put', 'patch', 'delete']);

const SKIP_PATH = /^\/auth(?:\/|$)/;

export function buildFullUrl(config: InternalAxiosRequestConfig): string {
  const base = (config.baseURL ?? window.location.origin).replace(/\/$/, '');
  const path = config.url ?? '';
  let full = /^https?:\/\//i.test(path)
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  if (config.params && typeof config.params === 'object') {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(config.params as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      qs.append(k, String(v));
    }
    const s = qs.toString();
    if (s) full += `?${s}`;
  }
  return full;
}

async function queuedResponse(
  config: InternalAxiosRequestConfig,
  method: string
): Promise<AxiosResponse> {
  const synthetic = await enqueueMutation({
    endpoint: buildFullUrl(config),
    method: method.toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: config.data ?? null,
  });
  const data = await synthetic.json().catch(() => ({ queued: true }));
  return {
    data,
    status: synthetic.status,
    statusText: 'Accepted (queued offline)',
    headers: {},
    config,
  } as AxiosResponse;
}

export function installOfflineInterceptors(apiClient: AxiosInstance): void {
  // Fast path: browser KNOWS it's offline (real outage, navigator.onLine false).
  apiClient.interceptors.request.use(async (config) => {
    const method = (config.method ?? 'get').toLowerCase();
    if (!MUTATING.has(method)) return config;

    const url = config.url ?? '';
    if (/^https?:\/\//i.test(url)) return config;
    if (SKIP_PATH.test(url)) return config;
    if (typeof navigator !== 'undefined' && navigator.onLine) return config;

    return {
      ...config,
      adapter: () => queuedResponse(config, method),
    } as InternalAxiosRequestConfig;
  });

  // Safety net: any mutating /v1 request that dies with ERR_NETWORK queues here
  // (covers throttling, dead gateways, race between outage and onLine flipping).
  apiClient.interceptors.response.use(
    (response) => {
      const method = (response.config.method ?? 'get').toUpperCase();
      if (method === 'GET' && response.config.url?.startsWith('/v1/')) {
        captureSnapshot(buildFullUrl(response.config), response.status, response.data);
      }
      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig | undefined;
      if (!config) return Promise.reject(error);

      const method = (config.method ?? 'get').toUpperCase();
      const isNetworkFailure = !error.response && Boolean(error.request);
      if (!isNetworkFailure || !config.url?.startsWith('/v1/')) {
        return Promise.reject(error);
      }

      if (MUTATING.has(method.toLowerCase())) {
        console.info('[offline] queued via response interceptor', method, config.url);
        return queuedResponse(config, method);
      }

      if (method === 'GET') {
        const cached = await snapshotResponse(buildFullUrl(config));
        if (cached) {
          const body = await cached.json().catch(() => null);
          if (body !== null) {
            return {
              data: body,
              status: cached.status,
              statusText: 'OK (offline snapshot)',
              headers: {},
              config,
              fromOfflineCache: true,
            } as AxiosResponse;
          }
        }
      }

      return Promise.reject(error);
    }
  );
}
