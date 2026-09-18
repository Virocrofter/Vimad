import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
  deleteReservation,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
} from '../api/reservations';
import type { CreateReservationInput, UpdateReservationInput } from '../api/reservations';
import type { PaginationParams } from '../api/types';

const RESERVATIONS_KEY = 'reservations' as const;

export function useReservationsList(
  params?: PaginationParams & { status?: string; propertyId?: string; guestId?: string }
) {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, 'list', params],
    queryFn: () => listReservations(params),
    staleTime: 1000 * 30,
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: [RESERVATIONS_KEY, id],
    queryFn: () => getReservation(id),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReservationInput) => createReservation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, 'list'] });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationInput }) =>
      updateReservation(id, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, 'list'] });
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, 'list'] });
    },
  });
}

export function useCheckInReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roomId }: { id: string; roomId?: string }) =>
      checkInReservation({ id, roomId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, 'list'] });
    },
  });
}

export function useCheckOutReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => checkOutReservation({ id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, 'list'] });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelReservation({ id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [RESERVATIONS_KEY, 'list'] });
    },
  });
}
