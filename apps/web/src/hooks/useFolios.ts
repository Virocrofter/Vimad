import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listFolios,
  getFolio,
  createFolio,
  postCharge,
  postPayment,
  reverseCharge,
  transferToCityLedger,
  deleteFolio,
} from '../api/folio';
import type { ChargeInput, PaymentInput } from '../api/folio';
import type { PaginationParams } from '../api/types';

const FOLIOS_KEY = 'folios' as const;

export function useFoliosList(
  params?: PaginationParams & { reservationId?: string; status?: string }
) {
  return useQuery({
    queryKey: [FOLIOS_KEY, 'list', params],
    queryFn: () => listFolios(params),
    staleTime: 1000 * 30,
  });
}

export function useFolio(id: string) {
  return useQuery({
    queryKey: [FOLIOS_KEY, id],
    queryFn: () => getFolio(id),
    enabled: !!id,
  });
}

export function useCreateFolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      reservationId: string;
      type?: 'guest' | 'master' | 'split';
      name?: string;
    }) => createFolio(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, 'list'] });
    },
  });
}

export function usePostCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folioId, input }: { folioId: string; input: ChargeInput }) =>
      postCharge(folioId, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, vars.folioId] });
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, 'list'] });
    },
  });
}

export function usePostPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folioId, input }: { folioId: string; input: PaymentInput }) =>
      postPayment(folioId, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, vars.folioId] });
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, 'list'] });
    },
  });
}

export function useReverseCharge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      folioId,
      chargeId,
      reason,
    }: {
      folioId: string;
      chargeId: string;
      reason: string;
    }) => reverseCharge(folioId, chargeId, reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, vars.folioId] });
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, 'list'] });
    },
  });
}

export function useTransferToCityLedger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folioId: string) => transferToCityLedger(folioId),
    onSuccess: (_, folioId) => {
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, folioId] });
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, 'list'] });
    },
  });
}

export function useDeleteFolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FOLIOS_KEY, 'list'] });
    },
  });
}
