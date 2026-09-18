// apps/web/src/api/backups.ts
import { apiClient } from './client';

export interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  sizeBytes: number;
  sizeFormatted: string;
  durationMs?: number;
  durationFormatted?: string;
  tables: string[];
  errorMessage?: string;
  createdBy: string;
  storageLocation: string;
  retentionDays: number;
}

export interface BackupSchedule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'full' | 'incremental' | 'differential';
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  cronExpression: string;
  timeZone: string;
  retentionDays: number;
  tables: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
}

export interface RestoreJob {
  id: string;
  backupId: string;
  backupName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  targetEnvironment: string;
  tablesRestored: string[];
  errorMessage?: string;
  verified: boolean;
}

const client = apiClient;

export async function getBackups(params?: {
  status?: string;
  type?: string;
}): Promise<BackupJob[]> {
  return client.get('/admin/backups', { params });
}

export async function getBackupById(id: string): Promise<BackupJob> {
  return client.get(`/admin/backups/${id}`);
}

export async function createBackup(data: {
  name: string;
  type: 'full' | 'incremental' | 'differential';
  tables?: string[];
  retentionDays?: number;
}): Promise<BackupJob> {
  return client.post('/admin/backups', data);
}

export async function deleteBackup(id: string): Promise<void> {
  return client.delete(`/admin/backups/${id}`);
}

export async function getBackupSchedules(): Promise<BackupSchedule[]> {
  return client.get('/admin/backups/schedules');
}

export async function createBackupSchedule(
  data: Omit<BackupSchedule, 'id' | 'lastRunAt' | 'nextRunAt' | 'createdAt'>
): Promise<BackupSchedule> {
  return client.post('/admin/backups/schedules', data);
}

export async function updateBackupSchedule(
  id: string,
  data: Partial<BackupSchedule>
): Promise<BackupSchedule> {
  return client.patch(`/admin/backups/schedules/${id}`, data);
}

export async function deleteBackupSchedule(id: string): Promise<void> {
  return client.delete(`/admin/backups/schedules/${id}`);
}

export async function getRestores(): Promise<RestoreJob[]> {
  return client.get('/admin/backups/restores');
}

export async function restoreBackup(data: {
  backupId: string;
  targetEnvironment: string;
  tables?: string[];
  verifyAfterRestore?: boolean;
}): Promise<RestoreJob> {
  return client.post('/admin/backups/restores', data);
}

export async function testRestoreBackup(data: {
  backupId: string;
  tables?: string[];
}): Promise<{ success: boolean; validationResults: Record<string, boolean>; message: string }> {
  return client.post('/admin/backups/test-restore', data);
}

export async function getBackupStats(): Promise<{
  totalBackups: number;
  totalSize: string;
  lastBackupAt?: string;
  successRate: number;
  storageUsed: string;
  storageAvailable: string;
}> {
  return client.get('/admin/backups/stats');
}
