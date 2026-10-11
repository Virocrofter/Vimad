/* apps/web/src/hooks/useEmailLogs.ts */
import { useCallback, useEffect, useState } from 'react';
import { communicationsApi, type EmailLogRow } from '../api/communications';

const fmtError = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'Request failed';

interface ListState {
  data: EmailLogRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ListState = {
  data: [],
  meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  loading: true,
  error: null,
};

export function useEmailLogs(params: Record<string, unknown>) {
  const key = JSON.stringify(params);
  const [state, setState] = useState<ListState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    communicationsApi
      .logs(JSON.parse(key))
      .then((res) => {
        if (cancelled) return;
        setState({ data: res.data, meta: res.meta, loading: false, error: null });
      })
      .catch((e) => {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: fmtError(e) }));
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const refetch = useCallback(async () => {
    try {
      const res = await communicationsApi.logs(JSON.parse(key));
      setState({ data: res.data, meta: res.meta, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, error: fmtError(e) }));
    }
  }, [key]);

  return { ...state, refetch };
}

export function useEmailLogMutations(onDone: () => void) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, fn: () => Promise<unknown>) => {
      setBusy(key);
      setError(null);
      try {
        await fn();
        onDone();
      } catch (e) {
        setError(fmtError(e));
      } finally {
        setBusy(null);
      }
    },
    [onDone]
  );

  return {
    busy,
    error,
    resend: (id: string) => run(`resend-${id}`, () => communicationsApi.resend(id)),
    sendFolio: (reservationId: string, to?: string) =>
      run('send-folio', () => communicationsApi.sendFolio(reservationId, to)),
    sendConfirmation: (reservationId: string) =>
      run('send-confirmation', () => communicationsApi.sendConfirmation(reservationId, true)),
  };
}
