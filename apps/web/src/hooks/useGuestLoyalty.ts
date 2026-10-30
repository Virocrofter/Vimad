/* apps/web/src/hooks/useGuestLoyalty.ts — G3 loyalty queries + redeem */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  guestPortalApi,
  getGuestToken,
  type GuestLoyaltyReward,
  type GuestLoyaltySummary,
  type GuestLoyaltyTransaction,
  type GuestRedeemResult,
} from './guestPortalApi';

const tk = () => getGuestToken() ?? '';

export function useGuestLoyalty() {
  return useQuery<GuestLoyaltySummary>({
    queryKey: ['gp-loyalty', 'summary'],
    queryFn: () => guestPortalApi.loyalty(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useGuestLoyaltyTransactions() {
  return useQuery<{ token: string; transactions: GuestLoyaltyTransaction[] }>({
    queryKey: ['gp-loyalty', 'transactions'],
    queryFn: () => guestPortalApi.loyaltyTransactions(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useGuestLoyaltyRewards() {
  return useQuery<{ token: string; rewards: GuestLoyaltyReward[] }>({
    queryKey: ['gp-loyalty', 'rewards'],
    queryFn: () => guestPortalApi.loyaltyRewards(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useLoyaltyRedeem() {
  const queryClient = useQueryClient();
  return useMutation<
    GuestRedeemResult,
    Error,
    { rewardId: string; idempotencyKey: string; note?: string }
  >({
    mutationFn: (input) => guestPortalApi.loyaltyRedeem(tk(), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp-loyalty'] });
    },
  });
}
