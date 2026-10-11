/* apps/web/src/hooks/useDashboard.ts */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const DASHBOARD_KEY = 'dashboard' as const;

// ─── Types (mirror apps/api/src/modules/dashboard/dashboard.service.ts) ──────

export interface DashboardStats {
  businessDate: string;
  property: { id: string; name: string; currency: string };
  occupancyRate: number;
  adr: number;
  revpar: number;
  totalRevenue: number;
  monthToDateRevenue: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouseGuests: number;
  availableRooms: number;
  occupiedRooms: number;
  outOfOrderRooms: number;
  dirtyRooms: number;
  totalRooms: number;
  pendingTasks: number;
  newReservationsToday: number;
  nightAudit: { status: string; completedAt: string | null } | null;
  revenueByDay: Array<{ date: string; revenue: number }>;
  recentReservations: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    arrivalDate: string;
    departureDate: string;
    status: string;
    roomNumber: string | null;
    totalAmount: number;
  }>;
}

export interface FrontDeskSnapshot {
  rooms: Array<{
    id: string;
    number: string;
    floor: string | null;
    status: string;
    housekeepingStatus: string;
    currentGuest: { firstName: string; lastName: string } | null;
    currentReservation: {
      id: string;
      departureDate: string;
      confirmationNumber: string;
    } | null;
  }>;
  arrivals: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    arrivalDate: string;
    roomType: string | null;
    roomNumber: string | null;
    status: string;
    balance: number;
  }>;
  departures: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    departureDate: string;
    roomNumber: string | null;
    status: string;
    balance: number;
  }>;
}

export interface DashboardActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  user: string | null;
  time: string;
  metadata: unknown;
}

export interface DashboardAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  source: string;
  actionUrl: string | null;
  timestamp: string;
  acknowledged: boolean;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashboardStats(propertyId?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'stats', propertyId],
    queryFn: async () => {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats', {
        params: propertyId ? { propertyId } : undefined,
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useFrontDeskSnapshot(propertyId?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'front-desk', propertyId],
    queryFn: async () => {
      const response = await apiClient.get<FrontDeskSnapshot>('/dashboard/front-desk', {
        params: propertyId ? { propertyId } : undefined,
      });
      return response.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useActivityFeed(propertyId?: string, take = 20) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'activity', propertyId, take],
    queryFn: async () => {
      const response = await apiClient.get<{ data: DashboardActivityItem[] }>(
        '/dashboard/activity',
        { params: { ...(propertyId ? { propertyId } : {}), take } }
      );
      return response.data.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useDashboardAlerts(propertyId?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'alerts', propertyId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: DashboardAlert[] }>('/dashboard/alerts', {
        params: propertyId ? { propertyId } : undefined,
      });
      return response.data.data;
    },
    staleTime: 1000 * 60,
  });
}
