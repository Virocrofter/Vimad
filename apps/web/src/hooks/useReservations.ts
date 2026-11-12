import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listReservations,
  getReservation,
  getReservationWorkspace,
  createReservation,
  updateReservation,
  deleteReservation,
  assignRoom,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  noShowReservation,
  resendConfirmation,
  updateStayRate,
  listTraces,
  createTrace,
  resolveTrace,
  listCompanions,
  addCompanion,
  removeCompanion,
  type CreateReservationInput,
  type UpdateReservationInput,
  type AssignRoomInput,
  type ReservationListParams,
  type CreateTraceInput,
  type AddCompanionInput,
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

export const useReservationsList = useReservations;

export function useReservationWorkspace(id?: string) {
  const query = useQuery({
    queryKey: ['reservations', 'workspace', id],
    queryFn: () => getReservationWorkspace(id as string),
    enabled: !!id,
  });
  return {
    data: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

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

export function useNoShow() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: (id: string) => noShowReservation(id),
    onSuccess: invalidate,
  });
}

export function useResendConfirmation() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: (id: string) => resendConfirmation(id),
    onSuccess: invalidate,
  });
}

export function useUpdateStayRate() {
  const invalidate = useInvalidateReservations();
  return useMutation({
    mutationFn: ({ stayId, rate }: { stayId: string; rate: number }) =>
      updateStayRate(stayId, rate),
    onSuccess: invalidate,
  });
}

/* ─── Traces ─── */
export function useTraces(reservationId: string) {
  const query = useQuery({
    queryKey: ['reservations', 'traces', reservationId],
    queryFn: () => listTraces(reservationId),
    enabled: !!reservationId,
  });
  return {
    traces: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useCreateTrace(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTraceInput) => createTrace(reservationId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['reservations', 'traces', reservationId] }),
  });
}

export function useResolveTrace(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (traceId: string) => resolveTrace(traceId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['reservations', 'traces', reservationId] }),
  });
}

/* ─── Companions ─── */
export function useCompanions(reservationId: string) {
  const query = useQuery({
    queryKey: ['reservations', 'companions', reservationId],
    queryFn: () => listCompanions(reservationId),
    enabled: !!reservationId,
  });
  return {
    companions: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useAddCompanion(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCompanionInput) => addCompanion(reservationId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['reservations', 'companions', reservationId] }),
  });
}

export function useRemoveCompanion(reservationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companionId: string) => removeCompanion(companionId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['reservations', 'companions', reservationId] }),
  });
}
