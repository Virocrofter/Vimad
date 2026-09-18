import { apiClient } from './client';

export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'occupancy' | 'revenue' | 'guest' | 'financial' | 'custom';
  format: 'csv' | 'pdf' | 'xlsx';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[];
  };
  lastRun?: string;
  lastRunStatus?: 'success' | 'failure';
  createdAt: string;
  createdBy: string;
}

export interface ReportRun {
  id: string;
  reportId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}

export async function fetchReports(): Promise<Report[]> {
  const response = await apiClient.get<{ data: Report[] }>('/v1/admin/reports');
  return response.data;
}

export async function fetchReport(id: string): Promise<Report> {
  const response = await apiClient.get<{ data: Report }>(`/v1/admin/reports/${id}`);
  return response.data;
}

export async function createReport(
  payload: Omit<Report, 'id' | 'createdAt' | 'createdBy'>
): Promise<Report> {
  const response = await apiClient.post<{ data: Report }>('/v1/admin/reports', payload);
  return response.data;
}

export async function updateReport(id: string, payload: Partial<Report>): Promise<Report> {
  const response = await apiClient.patch<{ data: Report }>(`/v1/admin/reports/${id}`, payload);
  return response.data;
}

export async function deleteReport(id: string): Promise<void> {
  await apiClient.delete(`/v1/admin/reports/${id}`);
}

export async function runReport(
  id: string,
  params?: { startDate?: string; endDate?: string }
): Promise<ReportRun> {
  const response = await apiClient.post<{ data: ReportRun }>(`/v1/admin/reports/${id}/run`, params);
  return response.data;
}

export async function fetchReportRuns(reportId: string): Promise<ReportRun[]> {
  const response = await apiClient.get<{ data: ReportRun[] }>(`/v1/admin/reports/${reportId}/runs`);
  return response.data;
}

export async function downloadReport(runId: string): Promise<Blob> {
  const response = await apiClient.get(`/v1/admin/reports/runs/${runId}/download`, {
    responseType: 'blob',
  });
  return response.data;
}
