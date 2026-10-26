/* apps/web/src/hooks/useDashboardDeltas.ts */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface KpiDeltas {
  yesterday: {
    date: string;
    occupancyRate: number | null;
    revenue: number;
  };
  averages: {
    occupancyRate7d: number | null;
    revenue7d: number | null;
  };
}

export function useDashboardDeltas(propertyId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'deltas', propertyId],
    queryFn: async () => {
      const response = await apiClient.get<KpiDeltas>('/dashboard/deltas', {
        params: propertyId ? { propertyId } : undefined,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
