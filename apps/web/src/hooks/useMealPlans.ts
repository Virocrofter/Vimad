/* apps/web/src/hooks/useMealPlans.ts — T7 */
import { useCallback, useEffect, useState } from 'react';
import { mealPlansApi, type MealPlanRow } from '../api/meal-plans';

const fmtError = (e: unknown): string =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'Request failed';

export function useMealPlans(params: Record<string, unknown>) {
  const key = JSON.stringify(params);
  const [state, setState] = useState<{
    data: MealPlanRow[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
    loading: boolean;
    error: string | null;
  }>({
    data: [],
    meta: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    mealPlansApi
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
      const res = await mealPlansApi.list(JSON.parse(key));
      setState({ data: res.data, meta: res.meta, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, error: fmtError(e) }));
    }
  }, [key]);

  return { ...state, refetch };
}

export function useMealPlanSummary(propertyId?: string) {
  const [summary, setSummary] = useState<{
    activePlans: number;
    activeAssignments: number;
    postedToday: number;
    failedToday: number;
    monthRevenue: number;
    currency: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await mealPlansApi.summary(propertyId);
      setSummary(res.data);
    } catch {
      /* non-fatal — cards stay empty */
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, reload: load };
}
