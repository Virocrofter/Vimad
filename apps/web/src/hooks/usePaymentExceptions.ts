/* apps/web/src/hooks/usePaymentExceptions.ts — payment exception worklist (slice #4). */
import { useQuery } from '@tanstack/react-query';
import { listPaymentExceptions, type PaymentExceptionItem } from '../api/payments';

export interface PaymentExceptionsData {
  generatedAt: string;
  items: PaymentExceptionItem[];
}

export function usePaymentExceptions() {
  return useQuery<PaymentExceptionsData>({
    queryKey: ['payment-exceptions'],
    queryFn: async () => (await listPaymentExceptions()).data,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}
