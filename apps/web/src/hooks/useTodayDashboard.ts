/* apps/web/src/hooks/useTodayDashboard.ts
 * Today-cockpit v2 data hook (addendum F) on the frozen P6 contract:
 * GET /v1/dashboard/today?propertyId=... → { data: TodayDashboard }.
 * Never-false-zero is the component's job; this hook just never swallows
 * errors (react-query surfaces isError).
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface CriticalItem {
  id: string;
  label: string;
  link: string;
}
export interface CriticalRegion {
  type: string;
  severity: 'critical' | 'high';
  count: number;
  items: CriticalItem[];
  recommendedAction: string;
}
export interface WorklistItem {
  id: string;
  confirmationNumber: string;
  guestName: string;
  status: string;
  eta?: string | null;
  balance?: number;
  flags: string[];
  validActions: string[];
  link: string;
}
export interface TodayDashboard {
  property: { id: string; name: string; code: string; timezone: string; currency: string };
  businessDate: string;
  generatedAt: string;
  critical: CriticalRegion[];
  today: {
    arrivals: number;
    dueOut: number;
    inHouse: number;
    dayUse: number;
    checkedOutToday: number;
    roomsReady: number;
    roomsTotal: number;
    openTasks: number;
    overdueTasks: number;
  };
  frontDesk: { arrivals: WorklistItem[]; dueOut: WorklistItem[] };
  revenue: {
    roomRevenueToday: number;
    occupiedTonight: number;
    roomsTotal: number;
    occupancyPct: number;
    adr: number;
    revpar: number;
    definitions: string;
    computedAt: string;
  };
  activity: Array<{
    at: string;
    actor: string | null;
    action: string;
    entity: string;
    entityId: string | null;
  }>;
}

export function useTodayDashboard(propertyId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'today', propertyId],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/today', {
        params: propertyId ? { propertyId } : undefined,
      });
      return (response.data as { data: TodayDashboard }).data;
    },
    staleTime: 1000 * 45,
    refetchInterval: 1000 * 60,
  });
}
