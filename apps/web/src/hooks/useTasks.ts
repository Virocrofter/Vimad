import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTasks,
  getTaskSummary,
  createTask,
  updateTask,
  completeTask,
  cancelTask,
  pushTask,
  listTaskRules,
  createTaskRule,
  updateTaskRule,
  deleteTaskRule,
  runTaskRuleNow,
  type TaskListParams,
} from '../api/tasks';

const KEY = 'tasks' as const;

export function useTaskList(params?: TaskListParams) {
  return useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => listTasks(params),
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 30,
  });
}

export function useTaskSummary() {
  return useQuery({
    queryKey: [KEY, 'summary'],
    queryFn: getTaskSummary,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}

export function useTaskRules() {
  return useQuery({
    queryKey: [KEY, 'rules'],
    queryFn: listTaskRules,
    staleTime: 1000 * 30,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [KEY] });
  };
}

export function useCreateTask() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createTask, onSuccess: invalidate });
}

export function useUpdateTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      updateTask(id, input),
    onSuccess: invalidate,
  });
}

export function useCompleteTask() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: completeTask, onSuccess: invalidate });
}

export function useCancelTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelTask(id, reason),
    onSuccess: invalidate,
  });
}

// [T5] Push one-tap link to the assignee's phone
export function usePushTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, channel }: { id: string; channel?: 'sms' | 'whatsapp' }) =>
      pushTask(id, channel),
    onSuccess: invalidate,
  });
}

export function useCreateTaskRule() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createTaskRule, onSuccess: invalidate });
}

export function useUpdateTaskRule() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      updateTaskRule(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTaskRule() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteTaskRule, onSuccess: invalidate });
}

export function useRunTaskRuleNow() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: runTaskRuleNow, onSuccess: invalidate });
}
