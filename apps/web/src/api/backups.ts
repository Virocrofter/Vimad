/* apps/web/src/api/backups.ts — Backups & DR API.
 * Wired through the SHARED axios client (api/client.ts) so tokens auto-refresh —
 * raw fetch left sessions dying silently every 15 minutes. */
import { apiGet, apiPost, apiPatch, apiPut, apiDelete, apiClient } from './client';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const body = await apiGet<{ data: T }>(path);
  return body.data;
}
async function post<T>(path: string, data?: unknown): Promise<T> {
  const body = await apiPost<{ data: T }>(path, data);
  return body.data;
}
async function postLong<T>(path: string, data?: unknown, timeoutMs = 10 * 60_000): Promise<T> {
  // restores/test-restores run a full scratch pg_restore — can exceed the 30s client timeout
  const response = await apiClient.post(path, data, { timeout: timeoutMs });
  return (response.data as { data: T }).data;
}
async function patch<T>(path: string, data?: unknown): Promise<T> {
  const body = await apiPatch<{ data: T }>(path, data);
  return body.data;
}
async function put<T>(path: string, data?: unknown): Promise<T> {
  const body = await apiPut<{ data: T }>(path, data);
  return body.data;
}
async function del<T>(path: string): Promise<T> {
  const body = (await apiDelete<{ data: T }>(path)) as { data: T } | undefined;
  return body?.data as T;
}

export interface BackupRun {
  id: string;
  name: string | null;
  kind: string;
  type: string;
  status: string;
  destination: string;
  sizeBytes: number | null;
  checksum: string | null;
  actor: string | null;
  restoreTestedAt: string | null;
  restoreTestedStatus: string | null;
  verified: boolean;
  retentionDays: number;
  storage: string;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  tables: string[];
}
export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  storageUsed: number;
  lastBackupAt: string | null;
  successRate: number | null;
  lastVerified: { restoreTestedAt: string; restoreTestedStatus: string } | null;
  rpoTargetMinutes: number;
  rtoTargetHours: number;
  rpoActualMinutes: number | null;
  rtoActualSeconds: number | null;
  running: number;
}
export interface BackupSchedule {
  id: string;
  name: string;
  type: string;
  cron: string;
  timezone: string;
  tables: string[];
  retentionDays: number;
  storage: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}
export interface RestoreJob {
  id: string;
  backupId: string;
  target: string;
  status: string;
  checks: { check: string; passed: boolean; detail: string }[] | null;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  createdBy: string | null;
}
export interface DrDrill {
  id: string;
  status: string;
  backupId: string | null;
  rtoSeconds: number | null;
  checks: { check: string; passed: boolean; detail: string }[] | null;
  notes: string | null;
  startedAt: string;
  finishedAt: string | null;
}
export interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  properties: number;
  guests: number;
  reservations: number;
}
export interface Coverage {
  tenants: number;
  properties: number;
  guests: number;
  reservations: number;
  folios: number;
  payments: number;
  users: number;
  coreTables: number;
}

export const getBackups = () => get<BackupRun[]>('/admin/backups');
export const getBackupStats = () => get<BackupStats>('/admin/backups/stats');
export const getBackupCoverage = () => get<Coverage>('/admin/backups/coverage');
export const getBackupRetention = () =>
  get<{ tier: string; cadence: string; keepFor: string; enforcement: string }[]>(
    '/admin/backups/retention'
  );
export const createBackup = (payload: {
  name?: string;
  type?: string;
  tables?: string[];
  retentionDays?: number;
  storage?: string;
}) => post<{ id: string }>('/admin/backups', payload);
export const deleteBackup = (id: string) => del<void>(`/admin/backups/${id}`);
export const getBackupSchedules = () => get<BackupSchedule[]>('/admin/backups/schedules');
export const createBackupSchedule = (payload: Partial<BackupSchedule>) =>
  post<{ id: string }>('/admin/backups/schedules', payload);
export const updateBackupSchedule = (id: string, payload: Partial<BackupSchedule>) =>
  patch<{ id: string }>(`/admin/backups/schedules/${id}`, payload);
export const deleteBackupSchedule = (id: string) => del<void>(`/admin/backups/schedules/${id}`);
export const runBackupSchedule = (id: string) =>
  post<{ id: string }>(`/admin/backups/schedules/${id}/run`);
export const getRestoreJobs = () => get<RestoreJob[]>('/admin/backups/restores');
export const createRestore = (payload: { backupId: string; target: string; verify?: boolean }) =>
  postLong<{
    jobId: string;
    checks: { check: string; passed: boolean; detail: string }[];
    passed: boolean;
  }>('/admin/backups/restores', payload);
export const testRestoreBackup = (backupId: string) =>
  postLong<{
    jobId: string;
    checks: { check: string; passed: boolean; detail: string }[];
    passed: boolean;
  }>('/admin/backups/test-restore', { backupId });
export const getDrDrills = () => get<DrDrill[]>('/admin/backups/drills');
export const runDrDrill = () => post<{ id: string }>('/admin/backups/drills/run');
export const getBackupTenants = () => get<TenantRow[]>('/admin/backups/tenants');
export const exportTenant = (tenantId: string) =>
  post<{ file: string; path: string; tables: number }>(`/admin/backups/tenants/${tenantId}/export`);
export const detectStaleBackups = () =>
  post<{ stale: boolean; ageMin: number; targetMin: number }>('/admin/backups/detect-stale');
export const getBackupSettings = () =>
  get<{ rpoTargetMinutes: number; rtoTargetHours: number }>('/admin/backups/settings');
export const updateBackupSettings = (payload: {
  rpoTargetMinutes: number;
  rtoTargetHours: number;
}) => put('/admin/backups/settings', payload);

/** Download URL only — the caller must send the Authorization header (page.jsx does). */
export function backupDownloadUrl(id: string): string {
  return `${BASE}/admin/backups/${id}/download`;
}
