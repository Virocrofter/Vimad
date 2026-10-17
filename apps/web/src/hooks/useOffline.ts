/* apps/web/src/hooks/useOffline.ts */
import { useCallback, useEffect, useState } from 'react';
import { offlineEvents, OFFLINE_EVENTS, getMutationCounts, flushQueue } from '../lib/offline';

interface OfflineState {
  isOnline: boolean;
  pending: number;
  failed: number;
  conflicted: number;
  flushing: boolean;
}

const INITIAL: OfflineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pending: 0,
  failed: 0,
  conflicted: 0,
  flushing: false,
};

export function useOffline() {
  const [state, setState] = useState<OfflineState>(INITIAL);

  useEffect(() => {
    let mounted = true;
    const patch = (p: Partial<OfflineState>) => {
      if (mounted) setState((s) => ({ ...s, ...p }));
    };

    // Hydrate counts from IndexedDB once.
    void getMutationCounts().then((c) => patch(c));

    const unsubs = [
      offlineEvents.on(OFFLINE_EVENTS.ONLINE, () => patch({ isOnline: true, flushing: true })),
      offlineEvents.on(OFFLINE_EVENTS.OFFLINE, () => patch({ isOnline: false })),
      offlineEvents.on(OFFLINE_EVENTS.QUEUE_CHANGED, (c) => patch(c as Partial<OfflineState>)),
      offlineEvents.on(OFFLINE_EVENTS.FLUSH_START, () => patch({ flushing: true })),
      offlineEvents.on(OFFLINE_EVENTS.FLUSH_DONE, () => patch({ flushing: false })),
    ];

    // navigator.onLine is the OS-level signal — catches real outages even
    // when requests aren't being attempted at all.
    const onOnline = () => patch({ isOnline: true, flushing: true });
    const onOffline = () => patch({ isOnline: false });
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      mounted = false;
      unsubs.forEach((u) => u());
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const syncNow = useCallback(() => {
    void flushQueue();
  }, []);

  return { ...state, syncNow };
}
