/* apps/web/src/hooks/useChainLoyalty.ts */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chainLoyaltyApi } from '../api/chainLoyalty';

export function useChainLoyaltyConfig() {
  return useQuery({ queryKey: ['chain-loyalty', 'config'], queryFn: chainLoyaltyApi.config });
}

export function useChainBoard() {
  return useQuery({
    queryKey: ['chain-loyalty', 'chain'],
    queryFn: chainLoyaltyApi.chain,
    staleTime: 15_000,
  });
}

export function useChainGuests() {
  return useQuery({
    queryKey: ['chain-loyalty', 'guests'],
    queryFn: chainLoyaltyApi.guests,
    staleTime: 60_000,
  });
}

export function useChainProperties() {
  return useQuery({
    queryKey: ['chain-loyalty', 'properties'],
    queryFn: chainLoyaltyApi.properties,
    staleTime: 60_000,
  });
}

export function useChainGuestView(guestId: string | null) {
  return useQuery({
    queryKey: ['chain-loyalty', 'guest', guestId],
    queryFn: () => chainLoyaltyApi.guestView(guestId as string),
    enabled: !!guestId,
  });
}

export function useChainLoyaltyActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['chain-loyalty'] });
    qc.invalidateQueries({ queryKey: ['guests'] });
  };
  return {
    saveConfig: useMutation({
      mutationFn: (payload: Parameters<typeof chainLoyaltyApi.saveConfig>[0]) =>
        chainLoyaltyApi.saveConfig(payload),
      onSuccess: invalidate,
    }),
    earn: useMutation({
      mutationFn: (payload: Parameters<typeof chainLoyaltyApi.earn>[0]) =>
        chainLoyaltyApi.earn(payload),
      onSuccess: invalidate,
    }),
    redeem: useMutation({
      mutationFn: (payload: Parameters<typeof chainLoyaltyApi.redeem>[0]) =>
        chainLoyaltyApi.redeem(payload),
      onSuccess: invalidate,
    }),
  };
}
