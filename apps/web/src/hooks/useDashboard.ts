import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

const DASHBOARD_KEY = 'dashboard' as const;

export interface DashboardStats {
  occupancyRate: number;
  adr: number; // Average Daily Rate
  revPAR: number; // Revenue Per Available Room
  totalRevenue: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouseGuests: number;
  availableRooms: number;
  occupiedRooms: number;
  outOfOrderRooms: number;
  pendingTasks: number;
  recentReservations: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    arrivalDate: string;
    departureDate: string;
    status: string;
    roomNumber?: string;
  }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
}

export function useDashboardStats(propertyId?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'stats', propertyId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: DashboardStats }>('/dashboard/stats', {
        params: propertyId ? { propertyId } : undefined,
      });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export interface FrontDeskSnapshot {
  rooms: Array<{
    id: string;
    number: string;
    status: string;
    housekeepingStatus: string;
    currentGuest?: { firstName: string; lastName: string };
    currentReservation?: { id: string; departureDate: string };
  }>;
  arrivals: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    arrivalDate: string;
    roomType: string;
    status: string;
  }>;
  departures: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    departureDate: string;
    roomNumber?: string;
    status: string;
  }>;
}

export function useFrontDeskSnapshot(propertyId?: string) {
  return useQuery({
    queryKey: [DASHBOARD_KEY, 'front-desk', propertyId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: FrontDeskSnapshot }>('/dashboard/front-desk', {
        params: propertyId ? { propertyId } : undefined,
      });
      return response.data.data;
    },
    staleTime: 1000 * 30,
  });
}
