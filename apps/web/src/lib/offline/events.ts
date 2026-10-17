/* apps/web/src/lib/offline/events.ts */
type Handler = (payload?: unknown) => void;

const handlers = new Map<string, Set<Handler>>();

export const offlineEvents = {
  on(event: string, fn: Handler): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(fn);
    return () => handlers.get(event)?.delete(fn);
  },
  emit(event: string, payload?: unknown): void {
    handlers.get(event)?.forEach((fn) => {
      try {
        fn(payload);
      } catch {
        /* listener errors must not break the offline layer */
      }
    });
  },
};

export const OFFLINE_EVENTS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  QUEUE_CHANGED: 'queue-changed', // pending/failed counts changed
  FLUSH_START: 'flush-start',
  FLUSH_DONE: 'flush-done',
  CONFLICT_RESOLVED: 'conflict-resolved', // server won, payload = endpoint
  AUTH_EXPIRED: 'auth-expired', // flush hit 401 — UI should force re-login
  SNAPSHOT_REFRESHED: 'snapshot-refreshed',
} as const;
