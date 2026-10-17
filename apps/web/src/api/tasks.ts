/* apps/web/src/api/tasks.ts — T1 + T5 */
import { apiClient } from './client';

export interface TaskListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  department?: string;
  priority?: string;
  assigneeId?: string;
  ruleId?: string;
  ruleKey?: string;
  slaBreached?: string;
  openOnly?: string;
  q?: string;
}

export const listTasks = (params?: TaskListParams) =>
  apiClient.get('/tasks', { params }).then((r) => r.data);

export const getTaskSummary = () => apiClient.get('/tasks/summary').then((r) => r.data.data);

export const createTask = (input: Record<string, unknown>) =>
  apiClient.post('/tasks', input).then((r) => r.data.data);

export const updateTask = (id: string, input: Record<string, unknown>) =>
  apiClient.patch(`/tasks/${id}`, input).then((r) => r.data.data);

export const completeTask = (id: string) =>
  apiClient.post(`/tasks/${id}/complete`).then((r) => r.data.data);

export const cancelTask = (id: string, reason?: string) =>
  apiClient.post(`/tasks/${id}/cancel`, { reason }).then((r) => r.data.data);

// [T5] Push the one-tap link to the assignee's phone (SMS or WhatsApp)
export const pushTask = (id: string, channel?: 'sms' | 'whatsapp') =>
  apiClient.post(`/tasks/${id}/push`, channel ? { channel } : {}).then((r) => r.data);

export const listTaskRules = () => apiClient.get('/tasks/rules/list').then((r) => r.data.data);

export const createTaskRule = (input: Record<string, unknown>) =>
  apiClient.post('/tasks/rules', input).then((r) => r.data.data);

export const updateTaskRule = (id: string, input: Record<string, unknown>) =>
  apiClient.patch(`/tasks/rules/${id}`, input).then((r) => r.data.data);

export const deleteTaskRule = (id: string) =>
  apiClient.delete(`/tasks/rules/${id}`).then((r) => r.data);

export const runTaskRuleNow = (id: string) =>
  apiClient.post(`/tasks/rules/${id}/run-now`).then((r) => r.data.data);
