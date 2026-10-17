/* apps/web/src/lib/offline/db.ts
 * IndexedDB for the offline layer. Three stores:
 *   snapshots  — last good GET responses for operational endpoints (key = url)
 *   mutations  — queued writes, keyPath id, index on status
 *   meta       — key/value (lastSyncAt, conflict counters)
 * Raw IDB, no dependency. All calls promisified, all failures non-fatal:
 * the PMS must never crash because storage is unavailable.
 */

export const DB_NAME = 'vimad-offline';
export const DB_VERSION = 1;

export interface SnapshotRecord<T = unknown> {
  key: string; // request URL (method assumed GET)
  status: number;
  body: T;
  fetchedAt: number;
}

export type MutationStatus = 'queued' | 'retrying' | 'conflicted' | 'failed';

export interface MutationRecord {
  id?: number; // auto-increment
  endpoint: string; // e.g. /v1/reservations/rsv-123/check-in
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body: unknown;
  idempotencyKey: string; // replay-safe against the API's idempotency middleware
  status: MutationStatus;
  attempts: number;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface MetaRecord {
  key: string;
  value: unknown;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('snapshots')) {
        db.createObjectStore('snapshots', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('mutations')) {
        const store = db.createObjectStore('mutations', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked by another tab'));
  });
  return dbPromise;
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const request = run(t.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

// ─── Snapshots ───

export async function putSnapshot(record: SnapshotRecord): Promise<void> {
  try {
    await tx('snapshots', 'readwrite', (s) => s.put(record));
  } catch {
    /* non-fatal */
  }
}

export async function getSnapshot<T = unknown>(key: string): Promise<SnapshotRecord<T> | null> {
  try {
    const rec = await tx('snapshots', 'readonly', (s) => s.get(key));
    return (rec as SnapshotRecord<T> | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function clearSnapshots(): Promise<void> {
  try {
    await tx('snapshots', 'readwrite', (s) => s.clear());
  } catch {
    /* non-fatal */
  }
}

// ─── Mutations ───

export async function addMutation(record: Omit<MutationRecord, 'id'>): Promise<number | null> {
  try {
    const id = await tx('mutations', 'readwrite', (s) => s.add(record));
    return id as number;
  } catch {
    return null;
  }
}

export async function updateMutation(id: number, patch: Partial<MutationRecord>): Promise<void> {
  try {
    const existing = (await tx('mutations', 'readonly', (s) => s.get(id))) as
      MutationRecord | undefined;
    if (!existing) return;
    await tx('mutations', 'readwrite', (s) =>
      s.put({ ...existing, ...patch, updatedAt: Date.now() })
    );
  } catch {
    /* non-fatal */
  }
}

export async function deleteMutation(id: number): Promise<void> {
  try {
    await tx('mutations', 'readwrite', (s) => s.delete(id));
  } catch {
    /* non-fatal */
  }
}

export async function getPendingMutations(): Promise<MutationRecord[]> {
  try {
    const all = (await tx('mutations', 'readonly', (s) => s.getAll())) as MutationRecord[];
    return all
      .filter((m) => m.status === 'queued' || m.status === 'retrying')
      .sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    return [];
  }
}

export async function getMutationCounts(): Promise<{
  pending: number;
  failed: number;
  conflicted: number;
}> {
  try {
    const all = (await tx('mutations', 'readonly', (s) => s.getAll())) as MutationRecord[];
    return {
      pending: all.filter((m) => m.status === 'queued' || m.status === 'retrying').length,
      failed: all.filter((m) => m.status === 'failed').length,
      conflicted: all.filter((m) => m.status === 'conflicted').length,
    };
  } catch {
    return { pending: 0, failed: 0, conflicted: 0 };
  }
}

/** Manual retry: reset failed mutations back to queued. */
export async function resetFailedMutations(): Promise<void> {
  try {
    const all = (await tx('mutations', 'readonly', (s) => s.getAll())) as MutationRecord[];
    for (const m of all.filter((x) => x.status === 'failed')) {
      await updateMutation(m.id!, {
        status: 'queued',
        attempts: 0,
        lastError: null,
      });
    }
  } catch {
    /* non-fatal */
  }
}

// ─── Meta ───

export async function setMeta(key: string, value: unknown): Promise<void> {
  try {
    await tx('meta', 'readwrite', (s) => s.put({ key, value } satisfies MetaRecord));
  } catch {
    /* non-fatal */
  }
}

export async function getMeta<T = unknown>(key: string): Promise<T | null> {
  try {
    const rec = (await tx('meta', 'readonly', (s) => s.get(key))) as MetaRecord | undefined;
    return rec ? (rec.value as T) : null;
  } catch {
    return null;
  }
}
