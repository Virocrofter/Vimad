/* apps/web/src/hooks/useOpsToday.ts */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const DASHBOARD_KEY = 'dashboard' as const;

// ─── Types (mirror apps/api/src/modules/dashboard/ops-today.service.ts) ──────

export interface OpsToday {
  businessDate: string;
  arrivals: { total: number; done: number };
  departures: { total: number; done: number };
  rooms: {
    turnedToday: number;
    dirty: number;
    inspected: number;
    turnaroundTarget: number;
  };
  tasks: {
    open: number;
    inProgress: number;
    slaBreached: number;
    byDepartment: Array<{ department: string; count: number; slaBreached: number }>;
    top: Array<{ id: string; title: string; department: string; priority: string }>;
  };
  vipArrivals: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    vipStatus: string | null;
    roomType: string | null;
    notes: string | null;
    status: string;
  }>;
  exceptions?: Array<{
    id: string;
    type: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    detail: string;
    count: number;
    entityType: string;
    entityId: string | null;
    taskId?: string | null;
  }>;
  unsettledDepartures: {
    count: number;
    totalBalance: number;
    items: Array<{
      id: string;
      confirmationNumber: string;
      guestName: string;
      roomNumber: string | null;
      balance: number;
    }>;
  };
}

export function useOpsToday(propertyId?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'ops-today', propertyId],
    queryFn: async () => {
      const response = await apiClient.get<OpsToday>('/dashboard/ops-today', {
        params: propertyId ? { propertyId } : undefined,
      });
      return response.data;
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });
}
