/* apps/web/src/hooks/useReservations.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  type CreateReservationInput,
  type UpdateReservationInput,
} from '../api/reservations';

export function useReservations(params?: {
  status?: string;
  propertyId?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = useQuery({
    queryKey: ['reservations', params],
    queryFn: () => listReservations(params),
  });

  return {
    reservations: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

// Alias for pages that expect the List-suffixed name
export const useReservationsList = useReservations;

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservations', id],
    queryFn: () => getReservation(id),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReservationInput) => createReservation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationInput }) =>
      updateReservation(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkInReservation({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkOutReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}
