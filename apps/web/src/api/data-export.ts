// apps/web/src/api/data-export.ts
import { apiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface ExportJob {
  id: string;
  tenantId: string;
  name: string;
  type: 'full' | 'partial' | 'gdpr_export' | 'gdpr_anonymize' | 'gdpr_delete';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  entityTypes: string[];
  filters?: Record<string, unknown>;
  format: 'json' | 'csv' | 'sql' | 'parquet';
  destination: 'download' | 's3' | 'gdpr_portal';
  fileSize?: number;
  fileUrl?: string;
  recordCount?: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  requestedBy: string;
  createdAt: string;
}

export interface DataRetentionPolicy {
  id: string;
  tenantId: string;
  entityType: string;
  retentionDays: number;
  action: 'archive' | 'delete' | 'anonymize';
  autoApply: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
}

export interface ErasureRequest {
  id: string;
  tenantId: string;
  type: 'guest' | 'user' | 'reservation';
  targetId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  requestedBy: string;
  reason?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AnonymizationConfig {
  id: string;
  tenantId: string;
  entityType: string;
  fields: {
    field: string;
    strategy: 'hash' | 'mask' | 'randomize' | 'nullify' | 'tokenize';
    preserveFormat: boolean;
  }[];
  createdAt: string;
}

const client = apiClient;

export async function getExportJobs(
  params?: PaginationParams & { status?: string; type?: string }
): Promise<PaginatedResponse<ExportJob>> {
  return client.get('/admin/data-export/jobs', params as Record<string, unknown>);
}

export async function getExportJob(id: string): Promise<ExportJob> {
  return client.get(`/admin/data-export/jobs/${id}`);
}

export async function createExportJob(
  data: Omit<
    ExportJob,
    | 'id'
    | 'createdAt'
    | 'status'
    | 'startedAt'
    | 'completedAt'
    | 'fileSize'
    | 'fileUrl'
    | 'recordCount'
  >
): Promise<ExportJob> {
  return client.post('/admin/data-export/jobs', data);
}

export async function cancelExportJob(id: string): Promise<ExportJob> {
  return client.post(`/admin/data-export/jobs/${id}/cancel`);
}

export async function retryExportJob(id: string): Promise<ExportJob> {
  return client.post(`/admin/data-export/jobs/${id}/retry`);
}

export async function getExportJobDownloadUrl(
  id: string
): Promise<{ url: string; expiresAt: string }> {
  return client.get(`/admin/data-export/jobs/${id}/download`);
}

export async function getRetentionPolicies(): Promise<DataRetentionPolicy[]> {
  return client.get('/admin/data-export/retention');
}

export async function getRetentionPolicy(id: string): Promise<DataRetentionPolicy> {
  return client.get(`/admin/data-export/retention/${id}`);
}

export async function createRetentionPolicy(
  data: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'lastRunAt' | 'nextRunAt'>
): Promise<DataRetentionPolicy> {
  return client.post('/admin/data-export/retention', data);
}

export async function updateRetentionPolicy(
  id: string,
  data: Partial<DataRetentionPolicy>
): Promise<DataRetentionPolicy> {
  return client.patch(`/admin/data-export/retention/${id}`, data);
}

export async function deleteRetentionPolicy(id: string): Promise<void> {
  return client.delete(`/admin/data-export/retention/${id}`);
}

export async function runRetentionPolicy(id: string): Promise<{ processed: number }> {
  return client.post(`/admin/data-export/retention/${id}/run`);
}

export async function getErasureRequests(
  params?: PaginationParams & { status?: string }
): Promise<PaginatedResponse<ErasureRequest>> {
  return client.get('/admin/data-export/erasure', params as Record<string, unknown>);
}

export async function getErasureRequest(id: string): Promise<ErasureRequest> {
  return client.get(`/admin/data-export/erasure/${id}`);
}

export async function createErasureRequest(
  data: Omit<ErasureRequest, 'id' | 'createdAt' | 'status' | 'completedAt'>
): Promise<ErasureRequest> {
  return client.post('/admin/data-export/erasure', data);
}

export async function getAnonymizationConfigs(): Promise<AnonymizationConfig[]> {
  return client.get('/admin/data-export/anonymization');
}

export async function getAnonymizationConfig(id: string): Promise<AnonymizationConfig> {
  return client.get(`/admin/data-export/anonymization/${id}`);
}

export async function createAnonymizationConfig(
  data: Omit<AnonymizationConfig, 'id' | 'createdAt'>
): Promise<AnonymizationConfig> {
  return client.post('/admin/data-export/anonymization', data);
}

export async function updateAnonymizationConfig(
  id: string,
  data: Partial<AnonymizationConfig>
): Promise<AnonymizationConfig> {
  return client.patch(`/admin/data-export/anonymization/${id}`, data);
}

export async function previewAnonymization(
  entityType: string,
  configId: string,
  sampleSize?: number
): Promise<{ sample: Record<string, unknown>[]; fields: string[] }> {
  return client.post('/admin/data-export/anonymization/preview', {
    entityType,
    configId,
    sampleSize,
  });
}

export async function getDataExportDashboard(): Promise<{
  activeJobs: number;
  completedToday: number;
  storageUsed: number;
  pendingErasure: number;
  retentionPoliciesActive: number;
}> {
  return client.get('/admin/data-export/dashboard');
}

export async function getEntityTypes(): Promise<
  { type: string; count: number; sizeEstimate: number }[]
> {
  return client.get('/admin/data-export/entity-types');
}

export async function validateExportFilters(
  entityTypes: string[],
  filters: Record<string, unknown>
): Promise<{ valid: boolean; errors: string[]; estimatedRecords: number }> {
  return client.post('/admin/data-export/validate', { entityTypes, filters });
}
