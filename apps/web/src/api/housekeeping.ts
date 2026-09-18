import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface HousekeepingTask {
  id: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  type: 'cleaning' | 'inspection' | 'maintenance' | 'turndown' | 'deep_clean';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'inspected' | 'skipped';
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  notes?: string;
  checklist: string[];
  assigneeId?: string;
  inspectorId?: string;
  createdAt: string;
  updatedAt: string;
  room?: { id: string; number: string };
  assignee?: { id: string; firstName: string; lastName: string };
}

export interface CreateTaskInput {
  propertyId: string;
  roomId: string;
  type: HousekeepingTask['type'];
  priority?: HousekeepingTask['priority'];
  scheduledAt?: string;
  estimatedDuration?: number;
  notes?: string;
  checklist?: string[];
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export async function listTasks(
  params?: PaginationParams & {
    propertyId?: string;
    roomId?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    date?: string;
  }
): Promise<PaginatedResponse<HousekeepingTask>> {
  const response = await apiClient.get<PaginatedResponse<HousekeepingTask>>('/housekeeping', {
    params,
  });
  return response.data;
}

export async function getTask(id: string): Promise<{ data: HousekeepingTask }> {
  const response = await apiClient.get<{ data: HousekeepingTask }>(`/housekeeping/${id}`);
  return response.data;
}

export async function createTask(input: CreateTaskInput): Promise<{ data: HousekeepingTask }> {
  const response = await apiClient.post<{ data: HousekeepingTask }>('/housekeeping', input);
  return response.data;
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<{ data: HousekeepingTask }> {
  const response = await apiClient.patch<{ data: HousekeepingTask }>(`/housekeeping/${id}`, input);
  return response.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/housekeeping/${id}`);
}

export async function assignTask(
  id: string,
  assigneeId: string
): Promise<{ data: HousekeepingTask }> {
  const response = await apiClient.post<{ data: HousekeepingTask }>(`/housekeeping/${id}/assign`, {
    assigneeId,
  });
  return response.data;
}

export async function completeTask(
  id: string,
  input?: { notes?: string; issues?: string[] }
): Promise<{ data: HousekeepingTask }> {
  const response = await apiClient.post<{ data: HousekeepingTask }>(
    `/housekeeping/${id}/complete`,
    input ?? {}
  );
  return response.data;
}

export async function inspectTask(
  id: string,
  input: { passed: boolean; notes?: string }
): Promise<{ data: HousekeepingTask }> {
  const response = await apiClient.post<{ data: HousekeepingTask }>(
    `/housekeeping/${id}/inspect`,
    input
  );
  return response.data;
}
