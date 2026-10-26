/* apps/web/src/hooks/useAr.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listArAccounts,
  getArAccount,
  createArAccount,
  updateArAccount,
  listArInvoices,
  getArInvoice,
  createArInvoice,
  sendArInvoice,
  cancelArInvoice,
  listArPayments,
  recordArPayment,
  reverseArPayment,
  getArSummary,
} from '../api/ar';
import type { ArAccountInput } from '../api/ar';

const AR = 'ar' as const;

export function useArSummary() {
  return useQuery({ queryKey: [AR, 'summary'], queryFn: getArSummary, staleTime: 1000 * 30 });
}

export function useArAccounts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [AR, 'accounts', params],
    queryFn: () => listArAccounts(params),
    staleTime: 1000 * 30,
  });
}

export function useArAccount(id: string | null) {
  return useQuery({
    queryKey: [AR, 'account', id],
    queryFn: () => getArAccount(id as string),
    enabled: !!id,
  });
}

export function useArInvoices(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [AR, 'invoices', params],
    queryFn: () => listArInvoices(params),
    staleTime: 1000 * 30,
  });
}

export function useArInvoice(id: string | null) {
  return useQuery({
    queryKey: [AR, 'invoice', id],
    queryFn: () => getArInvoice(id as string),
    enabled: !!id,
  });
}

export function useArPayments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [AR, 'payments', params],
    queryFn: () => listArPayments(params),
    staleTime: 1000 * 30,
  });
}

function useInvalidateAr() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [AR] });
  };
}

export function useCreateArAccount() {
  const invalidate = useInvalidateAr();
  return useMutation({
    mutationFn: (input: ArAccountInput) => createArAccount(input),
    onSuccess: invalidate,
  });
}

export function useUpdateArAccount() {
  const invalidate = useInvalidateAr();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateArAccount>[1] }) =>
      updateArAccount(id, input),
    onSuccess: invalidate,
  });
}

export function useCreateArInvoice() {
  const invalidate = useInvalidateAr();
  return useMutation({
    mutationFn: (input: Parameters<typeof createArInvoice>[0]) => createArInvoice(input),
    onSuccess: invalidate,
  });
}

export function useSendArInvoice() {
  const invalidate = useInvalidateAr();
  return useMutation({
    mutationFn: (id: string) => sendArInvoice(id),
    onSuccess: invalidate,
  });
}

export function useCancelArInvoice() {
  const invalidate = useInvalidateAr();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelArInvoice(id, reason),
    onSuccess: invalidate,
  });
}

export function useRecordArPayment() {
  const invalidate = useInvalidateAr();
  return useMutation({
    mutationFn: (input: Parameters<typeof recordArPayment>[0]) => recordArPayment(input),
    onSuccess: invalidate,
  });
}

export function useReverseArPayment() {
  const invalidate = useInvalidateAr();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => reverseArPayment(id, reason),
    onSuccess: invalidate,
  });
}
