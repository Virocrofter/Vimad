/* apps/web/src/hooks/useRoomTypes.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listRoomTypes,
  getRoomType,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  type RoomType,
  type CreateRoomTypeInput,
  type UpdateRoomTypeInput,
} from '../api/room-types';

export function useRoomTypes(propertyId?: string) {
  const query = useQuery({
    queryKey: ['room-types', propertyId],
    queryFn: () => listRoomTypes(propertyId),
  });

  return {
    roomTypes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useRoomType(id: string) {
  return useQuery({
    queryKey: ['room-types', id],
    queryFn: () => getRoomType(id),
    enabled: !!id,
  });
}

export function useCreateRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoomTypeInput) => {
      const data = await createRoomType(input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });
}

export function useUpdateRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoomTypeInput }) => {
      const data = await updateRoomType(id, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });
}

export function useDeleteRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoomType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-types'] });
    },
  });
}

export type { RoomType };
