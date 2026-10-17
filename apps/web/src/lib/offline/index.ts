/* apps/web/src/lib/offline/index.ts
 * One-call initialization from main.tsx:
 *
 *   initOffline({ apiClient, getAuthHeaders, apiFetchForRefresh });
 *
 * Also exposes window.__vimadOffline for support/debugging:
 *   __vimadOffline.testEnqueue()  — queue a fake mutation (tests IDB+banner)
 *   __vimadOffline.counts()       — pending/failed/conflicted counts
 *   __vimadOffline.flush()        — force a flush
 *   __vimadOffline.events         — the offline event bus (debug watching)
 *   __vimadOffline.EVENTS         — event name constants
 */
import type { AxiosInstance } from 'axios';
import {
  configureQueue,
  flushQueue,
  getMutationCounts,
  enqueueMutation,
  hasQueuedMutationFor,
} from './queue.js';
import { installOfflineInterceptors } from './axios.js';
import { resetFailedMutations } from './db.js';
import { offlineEvents, OFFLINE_EVENTS } from './events.js';

interface OfflineInitOptions {
  /** The shared axios instance from api/client.ts. */
  apiClient: AxiosInstance;
  /** Must return fresh headers — token may rotate while the app is open. */
  getAuthHeaders: () => Record<string, string>;
  /** Authenticated GET used to re-pull snapshots after sync/conflicts. */
  apiFetchForRefresh: (path: string) => Promise<unknown>;
  /** API origin for flushing relative queued URLs. Defaults to VITE_API_URL. */
  baseUrl?: string;
}

let initialized = false;

export function initOffline(opts: OfflineInitOptions): void {
  if (initialized) return;
  initialized = true;

  installOfflineInterceptors(opts.apiClient);
  configureQueue({
    getAuthHeaders: opts.getAuthHeaders,
    apiFetchForRefresh: opts.apiFetchForRefresh,
    baseUrl: opts.baseUrl ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  });

  // ─── Connectivity wiring ───
  window.addEventListener('online', () => {
    offlineEvents.emit(OFFLINE_EVENTS.ONLINE);
    void flushQueue();
  });
  window.addEventListener('offline', () => offlineEvents.emit(OFFLINE_EVENTS.OFFLINE));

  navigator.serviceWorker?.addEventListener?.('message', (event) => {
    if (event.data?.type === 'FLUSH') void flushQueue();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) void flushQueue();
  });

  // ─── Service worker registration (production only; the axios queue works
  // in dev too, so offline flows are testable on the dev server) ───
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            worker?.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                worker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        })
        .catch(() => {
          /* SW registration failed — axios offline layer still works */
        });
    });
  }

  // Boot flush: anything queued from a previous session goes out on launch.
  if (navigator.onLine) void flushQueue();

  // Support/debug probe — harmless in production, invaluable in the field.
  (window as unknown as Record<string, unknown>).__vimadOffline = {
    testEnqueue: () =>
      enqueueMutation({
        endpoint: `${opts.baseUrl ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/v1/__offline_probe__`,
        method: 'POST',
        body: { probe: true, at: new Date().toISOString() },
      }).then((r) => r.json()),
    counts: getMutationCounts,
    flush: flushQueue,
    resetFailed: resetFailedMutations,
    hasQueued: hasQueuedMutationFor,
    events: offlineEvents,
    EVENTS: OFFLINE_EVENTS,
    version: 'a6-v4',
  };
}

export { getMutationCounts, flushQueue, resetFailedMutations, hasQueuedMutationFor };
export { offlineEvents, OFFLINE_EVENTS };
export type { OfflineInitOptions };
