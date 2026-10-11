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
  startedAt?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;
  estimatedDuration?: number | null;
  actualDuration?: number | null;
  notes?: string | null;
  checklist: string[];
  assigneeId?: string | null;
  inspectorId?: string | null;
  createdAt: string;
  updatedAt: string;
  room?: {
    id: string;
    number: string;
    floor?: string | null;
    housekeepingStatus: string;
    roomType: { id: string; name: string; code: string };
  };
  assignee?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
  } | null;
  inspector?: { id: string; firstName: string | null; lastName: string | null } | null;
}

export interface HousekeepingStats {
  today: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    inspected: number;
    completionRate: number;
  };
  overdue: number;
  staffOnDuty: number;
  avgCleaningDuration: number;
  byPriority: { priority: string; count: number }[];
  byType: { type: string; count: number }[];
  recentCompleted: {
    id: string;
    room: { number: string };
    assignee: { firstName: string | null; lastName: string | null } | null;
    completedAt: string | null;
  }[];
}

export interface HousekeepingStaff {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  todayTaskCount: number;
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
  assigneeId?: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export async function listTasks(
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

export async function startTask(id: string): Promise<{ data: HousekeepingTask }> {
  const response = await apiClient.post<{ data: HousekeepingTask }>(`/housekeeping/${id}/start`);
  return response.data;
}

export async function completeTask(
  id: string,
  input?: { notes?: string; actualDuration?: number }
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

export async function skipTask(id: string, reason?: string): Promise<{ data: HousekeepingTask }> {
  const response = await apiClient.post<{ data: HousekeepingTask }>(`/housekeeping/${id}/skip`, {
    reason,
  });
  return response.data;
}

export async function bulkAssign(
  taskIds: string[],
  assigneeId: string
): Promise<{ data: { updated: number } }> {
  const response = await apiClient.post<{ data: { updated: number } }>(
    '/housekeeping/bulk-assign',
    { taskIds, assigneeId }
  );
  return response.data;
}

export async function getStats(
  propertyId?: string,
  date?: string
): Promise<{ data: HousekeepingStats }> {
  const response = await apiClient.get<{ data: HousekeepingStats }>('/housekeeping/stats', {
    params: { propertyId, date },
  });
  return response.data;
}

export async function getStaff(): Promise<{ data: HousekeepingStaff[] }> {
  const response = await apiClient.get<{ data: HousekeepingStaff[] }>('/housekeeping/staff');
  return response.data;
}
