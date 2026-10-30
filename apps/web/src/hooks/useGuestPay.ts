/* apps/web/src/hooks/useGuestPay.ts
 * G2 — React Query wrappers over the guest pay/split endpoints.
 * All reads invalidate together after a successful verify so folio + payments
 * + requests stay in sync.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  guestPortalApi,
  getGuestToken,
  type GuestPayPaymentItem,
  type GuestPayRequestItem,
  type GuestSplitItem,
  type PayInitializeResult,
  type PayVerifyResult,
} from './guestPortalApi';

const tk = () => getGuestToken() ?? '';

export function useGuestPayPayments() {
  return useQuery<{ token: string; payments: GuestPayPaymentItem[] }>({
    queryKey: ['gp-pay', 'payments'],
    queryFn: () => guestPortalApi.payPayments(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useGuestPayRequests() {
  return useQuery<{ token: string; requests: GuestPayRequestItem[] }>({
    queryKey: ['gp-pay', 'requests'],
    queryFn: () => guestPortalApi.payRequests(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useGuestSplits() {
  return useQuery<{ token: string; splits: GuestSplitItem[] }>({
    queryKey: ['gp-pay', 'splits'],
    queryFn: () => guestPortalApi.splits(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function usePayInitialize() {
  return useMutation<
    PayInitializeResult,
    Error,
    { amountMinor?: number; idempotencyKey: string; paymentRequestId?: string }
  >({
    mutationFn: (input) => guestPortalApi.payInitialize(tk(), input),
  });
}

export function usePayVerify() {
  const queryClient = useQueryClient();
  return useMutation<PayVerifyResult, Error, string>({
    mutationFn: (reference) => guestPortalApi.payVerify(tk(), reference),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useSplitCreate() {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string; status: string; amount: number; currency: string },
    Error,
    { toName: string; toEmail?: string; toPhone?: string; amount: number; note?: string }
  >({
    mutationFn: (input) => guestPortalApi.splitCreate(tk(), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp-pay', 'splits'] });
    },
  });
}

export function useSplitRespond() {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string; status: string },
    Error,
    { splitId: string; action: 'accept' | 'decline'; note?: string }
  >({
    mutationFn: ({ splitId, action, note }) =>
      guestPortalApi.splitRespond(tk(), splitId, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp-pay', 'splits'] });
    },
  });
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `gp-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
