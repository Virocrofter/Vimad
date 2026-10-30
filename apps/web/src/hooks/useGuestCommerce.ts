/* apps/web/src/hooks/useGuestCommerce.ts — G4 menu / orders / upsells / timeline */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  guestPortalApi,
  getGuestToken,
  type GuestOrder,
  type GuestTimelineEvent,
  type MenuItem,
  type UpsellProductItem,
} from './guestPortalApi';

const tk = () => getGuestToken() ?? '';

export function useGuestMenu() {
  return useQuery<{ token: string; now: string; timezone: string; menu: MenuItem[] }>({
    queryKey: ['gp-commerce', 'menu'],
    queryFn: () => guestPortalApi.commerceMenu(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useGuestOrders() {
  return useQuery<{ token: string; orders: GuestOrder[] }>({
    queryKey: ['gp-commerce', 'orders'],
    queryFn: () => guestPortalApi.commerceOrders(tk()),
    enabled: Boolean(getGuestToken()),
    refetchInterval: 10_000,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation<
    { order: GuestOrder; idempotentReplay: boolean },
    Error,
    { items: { menuItemId: string; quantity: number }[]; note?: string; idempotencyKey: string }
  >({
    mutationFn: (input) => guestPortalApi.commerceOrder(tk(), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp-commerce'] });
      queryClient.invalidateQueries({ queryKey: ['guest-folio'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string; status: string }, Error, string>({
    mutationFn: (orderId) => guestPortalApi.commerceCancelOrder(tk(), orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp-commerce'] });
      queryClient.invalidateQueries({ queryKey: ['guest-folio'] });
    },
  });
}

export function useGuestUpsells() {
  return useQuery<{ token: string; products: UpsellProductItem[] }>({
    queryKey: ['gp-commerce', 'upsells'],
    queryFn: () => guestPortalApi.commerceUpsells(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function usePurchaseUpsell() {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string; folioItemId: string; total: number },
    Error,
    { productId: string; quantity: number }
  >({
    mutationFn: ({ productId, quantity }) =>
      guestPortalApi.commercePurchaseUpsell(tk(), productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-folio'] });
    },
  });
}

export function useGuestTimeline() {
  return useQuery<{ token: string; events: GuestTimelineEvent[] }>({
    queryKey: ['gp-timeline'],
    queryFn: () => guestPortalApi.guestTimeline(tk()),
    enabled: Boolean(getGuestToken()),
  });
}
