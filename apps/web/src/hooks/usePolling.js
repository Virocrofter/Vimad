'use client';
import { useEffect, useRef } from 'react';

/**
 * Auto-refetch hook for polling data at intervals.
 * @param {Function} refetch - Function to call for refresh
 * @param {number} intervalMs - Polling interval in milliseconds
 * @param {boolean} enabled - Whether polling is active
 */
export function usePolling(refetch, intervalMs = 30000, enabled = true) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      refetch();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetch, intervalMs, enabled]);
}
