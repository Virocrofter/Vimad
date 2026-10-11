/* apps/web/src/hooks/usePaymentRequests.ts */
import { useCallback, useEffect, useState } from 'react';
import { paymentRequestsApi, type PaymentRequestRow } from '../api/payment-requests';

const fmtError = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'Request failed';

interface ListState {
  data: PaymentRequestRow[];
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

export function usePaymentRequests(params: Record<string, unknown>) {
  const key = JSON.stringify(params);
  const [state, setState] = useState<ListState>(INITIAL_STATE);

  // Initial load + reload on param change. All setState calls happen inside
  // promise callbacks (async), never synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;
    paymentRequestsApi
      .list(JSON.parse(key))
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
      const res = await paymentRequestsApi.list(JSON.parse(key));
      setState({ data: res.data, meta: res.meta, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, error: fmtError(e) }));
    }
  }, [key]);

  return { ...state, refetch };
}

export function usePaymentRequestSummary() {
  const [summary, setSummary] = useState<{
    pending: { count: number; amountMinor: number };
    overdue: { count: number; amountMinor: number };
    paidThisMonth: { count: number; amountMinor: number };
    collectionRate: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    paymentRequestsApi
      .summary()
      .then((res) => {
        if (!cancelled) setSummary(res.data);
      })
      .catch(() => {
        /* non-fatal — cards stay empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await paymentRequestsApi.summary();
      setSummary(res.data);
    } catch {
      /* non-fatal */
    }
  }, []);

  return { summary, refetch };
}

export function usePaymentRequestMutations(onDone: () => void) {
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
    create: (body: Record<string, unknown>) => run('create', () => paymentRequestsApi.create(body)),
    send: (id: string) => run(`send-${id}`, () => paymentRequestsApi.send(id)),
    cancel: (id: string, note?: string) =>
      run(`cancel-${id}`, () => paymentRequestsApi.cancel(id, note)),
  };
}
