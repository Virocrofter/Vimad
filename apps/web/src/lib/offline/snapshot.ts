/* apps/web/src/lib/offline/snapshot.ts
 * Captures the "today" operational read set into IndexedDB on every
 * successful online read (stale-while-revalidate at the data layer).
 * On boot/restore while offline, the data layer can seed from here so
 * the front desk shows this morning's arrivals, in-house list and room
 * statuses instead of empty screens.
 */
import { getSnapshot, putSnapshot } from './db.js';
import { offlineEvents, OFFLINE_EVENTS } from './events.js';

/** Read endpoints that make up the operational snapshot. */
export const SNAPSHOT_ENDPOINTS = [
  '/v1/reservations',
  '/v1/rooms',
  '/v1/dashboard/stats',
  '/v1/housekeeping',
] as const;

const isSnapshotGet = (method: string, url: string): boolean => {
  if (method !== 'GET') return false;
  const path = new URL(url, window.location.origin).pathname;
  return SNAPSHOT_ENDPOINTS.some((p) => path.startsWith(p));
};

const MAX_SNAPSHOT_AGE_MS = 1000 * 60 * 60 * 24; // 24h — "today's snapshot" only

/** Called by the fetch wrapper after a successful GET. Fire-and-forget. */
export function captureSnapshot(url: string, status: number, body: unknown): void {
  if (!isSnapshotGet('GET', url)) return;
  void putSnapshot({ key: url, status, body, fetchedAt: Date.now() });
}

/** Serve a cached snapshot as a synthetic Response (offline fallback). */
export async function snapshotResponse(url: string): Promise<Response | null> {
  const rec = await getSnapshot(url);
  if (!rec || rec.status !== 200) return null;
  if (Date.now() - rec.fetchedAt > MAX_SNAPSHOT_AGE_MS) return null;
  return new Response(JSON.stringify(rec.body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'x-vimad-offline': 'snapshot',
      'x-vimad-snapshot-age': String(Date.now() - rec.fetchedAt),
    },
  });
}

/**
 * Re-pull the core snapshot after coming back online / after a flush.
 * Called with the app's fetch + auth so responses re-enter captureSnapshot.
 */
export async function refreshSnapshot(apiFetch: (path: string) => Promise<unknown>): Promise<void> {
  await Promise.allSettled(
    SNAPSHOT_ENDPOINTS.map(async (p) => {
      await apiFetch(p);
    })
  );
  offlineEvents.emit(OFFLINE_EVENTS.SNAPSHOT_REFRESHED);
}
