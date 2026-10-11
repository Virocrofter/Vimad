/* apps/web/src/hooks/useLoyalty.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listLoyaltyMembers,
  getLoyaltyMember,
  listLoyaltyTransactions,
  getLoyaltyStats,
  adjustLoyaltyPoints,
} from '../api/loyalty';
import type { AdjustPointsInput } from '../api/loyalty';
import type { PaginationParams } from '../api/types';

const LOYALTY_KEY = 'loyalty' as const;

export function useLoyaltyMembers(params?: PaginationParams & { search?: string; tier?: string }) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'members', params],
    queryFn: () => listLoyaltyMembers(params),
    staleTime: 1000 * 30,
  });
}

export function useLoyaltyMember(id: string) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'members', id],
    queryFn: () => getLoyaltyMember(id),
    enabled: !!id,
  });
}

export function useLoyaltyTransactions(
  params?: PaginationParams & { guestId?: string; type?: string }
) {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'transactions', params],
    queryFn: () => listLoyaltyTransactions(params),
    staleTime: 1000 * 30,
  });
}

export function useLoyaltyStats() {
  return useQuery({
    queryKey: [LOYALTY_KEY, 'stats'],
    queryFn: () => getLoyaltyStats(),
    staleTime: 1000 * 60,
  });
}

export function useAdjustLoyaltyPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustPointsInput) => adjustLoyaltyPoints(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOYALTY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
