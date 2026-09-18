import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  completeTask,
  inspectTask,
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
    date?: string;
  }
) {
  return useQuery({
    queryKey: [HK_KEY, 'list', params],
    queryFn: () => listTasks(params),
    staleTime: 1000 * 15,
  });
}

export function useHousekeepingTask(id: string) {
  return useQuery({
    queryKey: [HK_KEY, id],
    queryFn: () => getTask(id),
    enabled: !!id,
  });
}

export function useCreateHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
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
    },
  });
}

export function useDeleteHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
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

export function useCompleteHousekeepingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes, issues }: { id: string; notes?: string; issues?: string[] }) =>
      completeTask(id, { notes, issues }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [HK_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [HK_KEY, 'list'] });
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
    },
  });
}
