/* apps/web/src/hooks/useGroups.ts — G1 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addBlock,
  deleteBlock,
  importRoomingList,
  removeMember,
  postCharge,
  recordPayment,
  addEvent,
  deleteEvent,
  type CreateGroupInput,
  type UpdateGroupInput,
  type RoomingRow,
  type ListGroupsParams,
} from '../api/groups';

export function useGroups(params: ListGroupsParams = {}) {
  const query = useQuery({
    queryKey: ['groups', params],
    queryFn: () => listGroups(params),
  });
  return {
    groups: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useGroup(id?: string | null) {
  const query = useQuery({
    queryKey: ['groups', 'detail', id],
    queryFn: () => getGroup(id as string),
    enabled: !!id,
  });
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

function useGroupInvalidator() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['groups'] });
  };
}

export function useCreateGroup() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: invalidate,
  });
}

export function useUpdateGroup() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGroupInput }) => updateGroup(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteGroup() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: invalidate,
  });
}

export function useAddBlock() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { roomTypeId: string; roomsBlocked: number; rate?: number; notes?: string };
    }) => addBlock(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteBlock() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({ id, blockId }: { id: string; blockId: string }) => deleteBlock(id, blockId),
    onSuccess: invalidate,
  });
}

export function useImportRoomingList() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({ id, rows }: { id: string; rows: RoomingRow[] }) => importRoomingList(id, rows),
    onSuccess: invalidate,
  });
}

export function useRemoveMember() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({ id, reservationId }: { id: string; reservationId: string }) =>
      removeMember(id, reservationId),
    onSuccess: invalidate,
  });
}

export function usePostCharge() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { type?: string; description: string; amount: number; quantity?: number };
    }) => postCharge(id, input),
    onSuccess: invalidate,
  });
}

export function useRecordPayment() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: { method?: string; amount: number; reference?: string; note?: string };
    }) => recordPayment(id, input),
    onSuccess: invalidate,
  });
}

export function useAddEvent() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof addEvent>[1] }) =>
      addEvent(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteEvent() {
  const invalidate = useGroupInvalidator();
  return useMutation({
    mutationFn: ({ id, eventId }: { id: string; eventId: string }) => deleteEvent(id, eventId),
    onSuccess: invalidate,
  });
}
