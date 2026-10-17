/* apps/web/src/lib/offline/queue.ts
 * Offline mutation queue. Rules:
 *   - Every queued write carries an Idempotency-Key; replay after reconnect
 *     is safe even if the server actually processed it while we saw a timeout.
 *   - Sequential flush, oldest first.
 *   - Conflict policy: SERVER WINS ON INVENTORY. 409/422 means the server
 *     state moved under us — the mutation is dropped, snapshots re-pulled,
 *     UI told to refresh. We never blindly overwrite.
 *   - Network errors → exponential backoff, max 5 attempts, then 'failed'.
 *   - 401 → stop flushing; auth-expired event (don't lose the write).
 *   - No Authorization header → flush/refresh skipped silently.
 */
import {
  addMutation,
  deleteMutation,
  getMutationCounts,
  getPendingMutations,
  updateMutation,
  type MutationRecord,
} from './db.js';
import { offlineEvents, OFFLINE_EVENTS } from './events.js';
import { refreshSnapshot } from './snapshot.js';

const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 2000;
const CONFLICT_STATUSES = new Set([409, 422]);
const PERMANENT_STATUSES = new Set([400, 404]);

type AuthProvider = () => Record<string, string>;

let getAuthHeaders: AuthProvider = () => ({});
let apiFetchForRefresh: ((path: string) => Promise<unknown>) | null = null;
let apiBaseUrl = 'http://localhost:3001';
let flushing = false;
let scheduled = false;

export function configureQueue(deps: {
  getAuthHeaders: AuthProvider;
  apiFetchForRefresh: (path: string) => Promise<unknown>;
  baseUrl?: string;
}): void {
  getAuthHeaders = deps.getAuthHeaders;
  apiFetchForRefresh = deps.apiFetchForRefresh;
  if (deps.baseUrl) apiBaseUrl = deps.baseUrl.replace(/\/$/, '');
}

async function emitCounts(): Promise<void> {
  offlineEvents.emit(OFFLINE_EVENTS.QUEUE_CHANGED, await getMutationCounts());
}

export function newIdempotencyKey(): string {
  return `off-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Enqueue a mutation made while offline. Returns a synthetic 202 Response. */
export async function enqueueMutation(input: {
  endpoint: string;
  method: MutationRecord['method'];
  body: unknown;
}): Promise<Response> {
  console.info('[offline] enqueue', input.method, input.endpoint);
  const id = await addMutation({
    endpoint: input.endpoint,
    method: input.method,
    body: input.body ?? null,
    idempotencyKey: newIdempotencyKey(),
    status: 'queued',
    attempts: 0,
    lastError: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  console.info('[offline] enqueued id=', id);

  // Background-sync registration is fire-and-forget. In dev there is no
  // service worker, and `navigator.serviceWorker.ready` NEVER resolves
  // without one — awaiting it here hung the mutation forever (dim button).
  void (async () => {
    try {
      const ready = navigator.serviceWorker?.ready ?? Promise.resolve(null);
      const reg = (await Promise.race([
        ready,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ])) as ServiceWorkerRegistration | null;
      const sync = (reg as { sync?: { register: (tag: string) => Promise<void> } } | null)?.sync;
      await sync?.register('vimad-mutations');
    } catch {
      /* sync unsupported — online listener covers it */
    }
  })();

  await emitCounts();
  return new Response(JSON.stringify({ queued: true, offline: true }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function executeMutation(m: MutationRecord): Promise<{ ok: true } | { ok: false }> {
  const url = /^https?:\/\//i.test(m.endpoint)
    ? m.endpoint
    : `${apiBaseUrl}${m.endpoint.startsWith('/') ? m.endpoint : `/${m.endpoint}`}`;

  console.info('[offline] flush', m.method, url, 'attempt', m.attempts + 1);
  const res = await fetch(url, {
    method: m.method,
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': m.idempotencyKey,
      ...getAuthHeaders(),
    },
    body: JSON.stringify(m.body ?? {}),
  }).catch((err: Error) => ({ networkError: err }) as const);

  // ─── Network failure: backoff and stop this flush cycle ───
  if ('networkError' in res) {
    const attempts = m.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await updateMutation(m.id!, {
        status: 'failed',
        attempts,
        lastError: res.networkError.message,
      });
    } else {
      await updateMutation(m.id!, {
        status: 'retrying',
        attempts,
        lastError: res.networkError.message,
      });
      scheduleRetry(attempts);
    }
    await emitCounts();
    return { ok: false };
  }

  // ─── Success ───
  if (res.ok || res.status === 201) {
    console.info('[offline] flushed ok', m.method, url);
    await deleteMutation(m.id!);
    await emitCounts();
    return { ok: true };
  }

  // ─── 401: token died while we were offline. Keep the write; stop. ───
  if (res.status === 401) {
    offlineEvents.emit(OFFLINE_EVENTS.AUTH_EXPIRED);
    return { ok: false };
  }

  // ─── Conflict: SERVER WINS ON INVENTORY. ───
  if (CONFLICT_STATUSES.has(res.status)) {
    const detail = await res.text().catch(() => '');
    console.info('[offline] conflict — server wins', m.method, url, res.status);
    offlineEvents.emit(OFFLINE_EVENTS.CONFLICT_RESOLVED, {
      endpoint: m.endpoint,
      status: res.status,
      detail: detail.slice(0, 300),
    });
    await deleteMutation(m.id!);
    await refreshSnapshotsFromServer();
    await emitCounts();
    return { ok: true };
  }

  // ─── Permanent client errors: don't retry forever ───
  if (PERMANENT_STATUSES.has(res.status)) {
    const detail = await res.text().catch(() => '');
    await updateMutation(m.id!, {
      status: 'failed',
      attempts: m.attempts + 1,
      lastError: `${res.status}: ${detail.slice(0, 300)}`,
    });
    await emitCounts();
    return { ok: true };
  }

  // ─── Other server errors (5xx): backoff, retry later ───
  const attempts = m.attempts + 1;
  await updateMutation(m.id!, {
    status: attempts >= MAX_ATTEMPTS ? 'failed' : 'retrying',
    attempts,
    lastError: `HTTP ${res.status}`,
  });
  if (attempts < MAX_ATTEMPTS) scheduleRetry(attempts);
  await emitCounts();
  return { ok: false };
}

async function refreshSnapshotsFromServer(): Promise<void> {
  if (!apiFetchForRefresh) return;
  if (!getAuthHeaders().Authorization) return; // logged out — nothing to refresh
  try {
    await refreshSnapshot(apiFetchForRefresh);
  } catch {
    /* refresh is best-effort; next online cycle will re-pull */
  }
}

function scheduleRetry(attempts: number): void {
  if (scheduled) return;
  scheduled = true;
  const delay = BASE_BACKOFF_MS * 2 ** Math.min(attempts, 4);
  setTimeout(() => {
    scheduled = false;
    void flushQueue();
  }, delay);
}

/** Flush all pending mutations, oldest first. Safe to call repeatedly. */
export async function flushQueue(): Promise<void> {
  if (flushing) return;
  if (!navigator.onLine) return;
  if (!getAuthHeaders().Authorization) return; // no session — queued writes wait for login
  flushing = true;
  offlineEvents.emit(OFFLINE_EVENTS.FLUSH_START);
  try {
    for (;;) {
      const pending = await getPendingMutations();
      if (pending.length === 0) break;
      const result = await executeMutation(pending[0]);
      if (!result.ok) break; // network/auth failure — backoff handles the rest
    }
    const counts = await getMutationCounts();
    if (counts.pending === 0) await refreshSnapshotsFromServer();
  } finally {
    flushing = false;
    offlineEvents.emit(OFFLINE_EVENTS.FLUSH_DONE, await getMutationCounts());
  }
}

export { getMutationCounts };
export async function hasQueuedMutationFor(substring: string): Promise<boolean> {
  const pending = await getPendingMutations();
  return pending.some((m) => m.endpoint.includes(substring));
}
