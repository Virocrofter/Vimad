/* apps/web/src/components/OfflineBanner.tsx
 * Fixed banner for offline/queue state. Behavior:
 *   offline            → red, "Offline — N changes queued"
 *   back online        → green, "Syncing N changes…"
 *   flush done clean   → green, "All changes synced" → auto-hides after 10s
 *   permanent failures → amber, "N changes failed to sync" + Sync now
 */
import { useEffect, useRef, useState } from 'react';
import { useOffline } from '../hooks/useOffline';

const SYNCED_DISPLAY_MS = 10_000;

export function OfflineBanner() {
  const { isOnline, pending, failed, flushing, syncNow } = useOffline();
  const [synced, setSynced] = useState(false);
  const prevFlushing = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Unmount-only cleanup.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  // Detect flush completion → show "synced" state, auto-hide after 10s.
  useEffect(() => {
    if (prevFlushing.current && !flushing && isOnline && pending === 0 && failed === 0) {
      setSynced(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSynced(false), SYNCED_DISPLAY_MS);
    }
    prevFlushing.current = flushing;
  }, [flushing, isOnline, pending, failed]);

  if (isOnline && pending === 0 && failed === 0 && !synced) return null;

  const tone = !isOnline
    ? 'bg-danger/10 text-danger border-danger/20'
    : failed > 0
      ? 'bg-warning/10 text-warning border-warning/20'
      : flushing || synced
        ? 'bg-success/10 text-success border-success/20'
        : 'bg-info/10 text-info border-info/20';

  const label = !isOnline
    ? `Offline — ${pending} change${pending === 1 ? '' : 's'} queued`
    : flushing
      ? `Syncing ${pending} change${pending === 1 ? '' : 's'}…`
      : failed > 0
        ? `${failed} change${failed === 1 ? '' : 's'} failed to sync`
        : synced
          ? 'All changes synced'
          : `${pending} change${pending === 1 ? '' : 's'} pending`;

  const pulse = !isOnline || flushing;

  return (
    <div
      role="status"
      aria-live="polite"
      data-offline={!isOnline || undefined}
      className={`fixed bottom-4 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-lg border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur ${tone}`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          !isOnline
            ? 'animate-pulse bg-danger'
            : pulse
              ? 'animate-ping bg-success'
              : failed > 0
                ? 'bg-warning'
                : 'bg-success'
        }`}
      />
      <span>{label}</span>
      {isOnline && !flushing && !synced && (pending > 0 || failed > 0) && (
        <button
          type="button"
          onClick={syncNow}
          className="rounded-md border border-current px-2 py-0.5 text-xs font-semibold uppercase tracking-wide hover:opacity-75"
        >
          Sync now
        </button>
      )}
    </div>
  );
}
