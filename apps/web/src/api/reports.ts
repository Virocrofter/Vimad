import { apiClient } from './client';

// ─── Types ───

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: 'system' | 'custom';
  config: Record<string, unknown>;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel';
  parameters: Record<string, unknown>;
  nextRunAt: string;
  lastRunAt?: string;
  status: 'active' | 'paused' | 'error';
  createdAt: string;
}

export interface ReportRun {
  id: string;
  reportId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  rowCount: number;
  createdAt: string;
}

export interface ReportDashboard {
  totalReports: number;
  scheduledActive: number;
  runsThisMonth: number;
  averageRuntime: number;
  popularTemplates: Array<{
    id: string;
    name: string;
    runCount: number;
  }>;
}

export interface BuildReportRequest {
  name: string;
  description?: string;
  category?: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
  }>;
  config: Record<string, unknown>;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category?: string;
  type?: 'system' | 'custom';
  config: Record<string, unknown>;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
  }>;
}

export interface CreateScheduledReportRequest {
  templateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel';
  parameters: Record<string, unknown>;
  nextRunAt: string;
}

export interface UpdateScheduledReportRequest {
  name?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients?: string[];
  format?: 'pdf' | 'csv' | 'excel';
  parameters?: Record<string, unknown>;
  nextRunAt?: string;
  status?: 'active' | 'paused' | 'error';
}

// ─── API Functions ───

const BASE_PATH = '/admin/reports';

export async function getReportDashboard(): Promise<ReportDashboard> {
  const response = await apiClient.get<{ data: ReportDashboard }>(`${BASE_PATH}/dashboard`);
  return response.data.data;
}

export async function getTemplates(params?: {
  page?: number;
  pageSize?: number;
  category?: string;
}): Promise<{
  data: ReportTemplate[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const response = await apiClient.get<{
    data: ReportTemplate[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>(`${BASE_PATH}/templates`, { params });
  return response.data;
}

export async function getTemplate(id: string): Promise<ReportTemplate> {
  const response = await apiClient.get<{ data: ReportTemplate }>(`${BASE_PATH}/templates/${id}`);
  return response.data.data;
}

export async function createTemplate(data: CreateTemplateRequest): Promise<ReportTemplate> {
  const response = await apiClient.post<{ data: ReportTemplate }>(`${BASE_PATH}/templates`, data);
  return response.data.data;
}

export async function updateTemplate(
  id: string,
  data: Partial<CreateTemplateRequest>
): Promise<ReportTemplate> {
  const response = await apiClient.patch<{ data: ReportTemplate }>(
    `${BASE_PATH}/templates/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/templates/${id}`);
}

export async function getScheduledReports(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{
  data: ScheduledReport[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const response = await apiClient.get<{
    data: ScheduledReport[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>(`${BASE_PATH}/scheduled`, { params });
  return response.data;
}

export async function createScheduledReport(
  data: CreateScheduledReportRequest
): Promise<ScheduledReport> {
  const response = await apiClient.post<{ data: ScheduledReport }>(`${BASE_PATH}/scheduled`, data);
  return response.data.data;
}

export async function updateScheduledReport(
  id: string,
  data: UpdateScheduledReportRequest
): Promise<ScheduledReport> {
  const response = await apiClient.patch<{ data: ScheduledReport }>(
    `${BASE_PATH}/scheduled/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteScheduledReport(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/scheduled/${id}`);
}

export async function runScheduledReport(id: string): Promise<ReportRun> {
  const response = await apiClient.post<{ data: ReportRun }>(`${BASE_PATH}/scheduled/${id}/run`);
  return response.data.data;
}

export async function getReportRuns(params?: {
  page?: number;
  pageSize?: number;
  reportId?: string;
}): Promise<{
  data: ReportRun[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const response = await apiClient.get<{
    data: ReportRun[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>(`${BASE_PATH}/runs`, { params });
  return response.data;
}

export async function getReportRun(id: string): Promise<ReportRun> {
  const response = await apiClient.get<{ data: ReportRun }>(`${BASE_PATH}/runs/${id}`);
  return response.data.data;
}

export async function executeReport(data: {
  templateId: string;
  parameters: Record<string, unknown>;
}): Promise<ReportRun> {
  const response = await apiClient.post<{ data: ReportRun }>(`${BASE_PATH}/execute`, data);
  return response.data.data;
}

export async function buildCustomReport(data: BuildReportRequest): Promise<ReportRun> {
  const response = await apiClient.post<{ data: ReportRun }>(`${BASE_PATH}/build`, data);
  return response.data.data;
}

export async function exportReport(
  id: string,
  format: 'pdf' | 'csv' | 'excel'
): Promise<{ downloadUrl: string }> {
  const response = await apiClient.post<{ data: { downloadUrl: string } }>(
    `${BASE_PATH}/runs/${id}/export`,
    { format }
  );
  return response.data.data;
}

export async function shareReport(id: string, emails: string[]): Promise<{ shared: boolean }> {
  const response = await apiClient.post<{ data: { shared: boolean } }>(
    `${BASE_PATH}/runs/${id}/share`,
    { emails }
  );
  return response.data.data;
}

export async function getCategories(): Promise<string[]> {
  const response = await apiClient.get<{ data: string[] }>(`${BASE_PATH}/categories`);
  return response.data.data;
}

export async function getDataSources(): Promise<
  Array<{ id: string; name: string; description: string }>
> {
  const response = await apiClient.get<{
    data: Array<{ id: string; name: string; description: string }>;
  }>(`${BASE_PATH}/data-sources`);
  return response.data.data;
}
