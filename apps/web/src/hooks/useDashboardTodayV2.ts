import { useQuery } from '@tanstack/react-query';
import { fetchTodayV2 } from '../api/dashboardTodayV2';

export function useDashboardTodayV2(
  propertyId: string | undefined,
  opts?: { workRange?: string; page?: number; pageSize?: number }
) {
  return useQuery({
    queryKey: ['dashboard-today-v2', propertyId, opts?.workRange ?? 'today', opts?.page ?? 1],
    queryFn: () => fetchTodayV2(propertyId as string, opts),
    enabled: Boolean(propertyId),
    refetchInterval: 60_000,
    staleTime: 15_000,
  });
}
