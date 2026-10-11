/* apps/web/src/hooks/useRooms.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  type Room,
  type CreateRoomInput,
  type UpdateRoomInput,
} from '../api/rooms';

export interface UseRoomsParams {
  propertyId?: string;
  roomTypeId?: string;
  status?: string;
}

export function useRooms(params?: UseRoomsParams) {
  const query = useQuery({
    queryKey: ['rooms', 'list', params],
    queryFn: async () => {
      const response = await listRooms({ pageSize: 200, ...params });
      return response.data;
    },
    placeholderData: (prev) => prev,
  });

  return {
    rooms: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useRoom(id: string) {
  const query = useQuery({
    queryKey: ['rooms', 'detail', id],
    queryFn: async () => {
      const { data } = await getRoom(id);
      return data;
    },
    enabled: !!id,
  });

  return {
    room: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useRoomMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      const { data } = await createRoom(input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoomInput }) => {
      const { data } = await updateRoom(id, input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await deleteRoom(id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  return { create, update, remove };
}

export type { Room };
