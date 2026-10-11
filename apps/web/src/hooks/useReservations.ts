/* apps/web/src/hooks/useReservations.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
  deleteReservation,
  assignRoom,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  type CreateReservationInput,
  type UpdateReservationInput,
  type AssignRoomInput,
  type ReservationListParams,
} from '../api/api-reservations';

export interface UseReservationsParams extends ReservationListParams {}

export function useReservations(params?: UseReservationsParams) {
  const query = useQuery({
    queryKey: ['reservations', 'list', params],
    queryFn: () => listReservations({ pageSize: 25, ...params }),
    placeholderData: (prev) => prev,
  });

  return {
    data: query.data,
    reservations: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

// Alias for pages that expect the List-suffixed name
export const useReservationsList = useReservations;

export function useReservation(id: string) {
  const query = useQuery({
    queryKey: ['reservations', 'detail', id],
    queryFn: () => getReservation(id),
    enabled: !!id,
  });

  return {
    data: query.data?.data,
    reservation: query.data?.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

function useInvalidateReservations() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateReservation() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: (input: CreateReservationInput) => createReservation(input),
    onSuccess: invalidate,
  });
}

export function useUpdateReservation() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReservationInput }) =>
      updateReservation(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteReservation() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: (id: string) => deleteReservation(id),
    onSuccess: invalidate,
  });
}

export function useAssignRoom() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AssignRoomInput }) => assignRoom(id, input),
    onSuccess: invalidate,
  });
}

export function useCheckIn() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: (id: string) => checkInReservation(id),
    onSuccess: invalidate,
  });
}

export function useCheckOut() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: (id: string) => checkOutReservation(id),
    onSuccess: invalidate,
  });
}

export function useCancelReservation() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelReservation(id, reason),
    onSuccess: invalidate,
  });
}
