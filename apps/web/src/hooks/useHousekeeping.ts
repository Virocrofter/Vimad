import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  startTask,
  completeTask,
  inspectTask,
  skipTask,
  bulkAssign,
  getStats,
  getStaff,
} from '../api/housekeeping';
import type { CreateTaskInput, UpdateTaskInput } from '../api/housekeeping';
import type { PaginationParams } from '../api/types';

const HK_KEY = 'housekeeping' as const;

export function useHousekeepingList(
  params?: PaginationParams & {
    propertyId?: string;
    roomId?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    type?: string;
    floor?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  return useQuery({
    queryKey: [HK_KEY, 'list', params],
    queryFn: () => listTasks(params),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30, // Poll every 30s for real-time feel
  });
}

export function useHousekeepingTask(id: string) {
  return useQuery({
    queryKey: [HK_KEY, id],
    queryFn: () => getTask(id),
    enabled: !!id,
  });
}

export function useHousekeepingStats(propertyId?: string, date?: string) {
  return useQuery({
    queryKey: [HK_KEY, 'stats', propertyId, date],
    queryFn: () => getStats(propertyId, date),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useHousekeepingStaff() {
  return useQuery({
    queryKey: [HK_KEY, 'staff'],
    queryFn: () => getStaff(),
    staleTime: 1000 * 60,
  });
}

export function useCreateHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY] });
    },
  });
}

export function useUpdateHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => updateTask(id, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'stats'] });
    },
  });
}

export function useDeleteHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY] });
    },
  });
}

export function useAssignHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: string; assigneeId: string }) =>
      assignTask(id, assigneeId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
    },
  });
}

export function useStartHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, id] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'stats'] });
    },
  });
}

export function useCompleteHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      notes,
      actualDuration,
    }: {
      id: string;
      notes?: string;
      actualDuration?: number;
    }) => completeTask(id, { notes, actualDuration }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'stats'] });
    },
  });
}

export function useInspectHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, passed, notes }: { id: string; passed: boolean; notes?: string }) =>
      inspectTask(id, { passed, notes }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'stats'] });
    },
  });
}

export function useSkipHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => skipTask(id, reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
    },
  });
}

export function useBulkAssignHousekeeping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskIds, assigneeId }: { taskIds: string[]; assigneeId: string }) =>
      bulkAssign(taskIds, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY] });
    },
  });
}

// ─── T2+ Space Status hooks ───
import { getSpaceStatus, transitionRoomStatus, runHkRuleNow } from '../api/housekeeping';
import type { RoomStatusTransitionInput } from '../api/housekeeping';

export function useSpaceStatus(propertyId?: string, date?: string) {
  return useQuery({
    queryKey: [HK_KEY, 'space', propertyId, date],
    queryFn: () => getSpaceStatus(propertyId, date),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}

export function useRoomStatusTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RoomStatusTransitionInput }) =>
      transitionRoomStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'space'] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'stats'] });
    },
  });
}

export function useRunHkRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => runHkRuleNow(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'space'] });
    },
  });
}
