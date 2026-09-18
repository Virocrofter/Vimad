import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listGuests, getGuest, createGuest, updateGuest, deleteGuest } from '../api/guests';
import type { CreateGuestInput, UpdateGuestInput } from '../api/guests';
import type { PaginationParams } from '../api/types';

const GUESTS_KEY = 'guests' as const;

export function useGuestsList(params?: PaginationParams & { search?: string }) {
  return useQuery({
    queryKey: [GUESTS_KEY, 'list', params],
    queryFn: () => listGuests(params),
    staleTime: 1000 * 30,
  });
}

export function useGuest(id: string) {
  return useQuery({
    queryKey: [GUESTS_KEY, id],
    queryFn: () => getGuest(id),
    enabled: !!id,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGuestInput) => createGuest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'list'] });
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGuestInput }) => updateGuest(id, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'list'] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'list'] });
    },
  });
}
