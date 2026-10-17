/* apps/web/src/api/audit.ts */
import { apiClient } from './client';

export interface AuditChange {
  field: string;
  old: string;
  new: string;
}

export type AuditSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AuditEntry {
  id: string;
  timestamp: string;
  severity: AuditSeverity;
  user: { name: string; role: string; ip: string };
  action: { type: string; category: string; label: string; description: string };
  resource: { type: string; id: string; name: string };
  category: string;
  description: string;
  changes: AuditChange[];
  sessionId: string;
}

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  severity?: AuditSeverity;
  category?: string;
  userId?: string;
}

export interface AuditLogResponse {
  data: AuditEntry[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

// ─── Platform admin (unchanged — consumed by app/admin/audit) ───

export async function fetchAuditLogs(params: AuditLogParams = {}): Promise<AuditLogResponse> {
  const { data } = await apiClient.get('/admin/audit-logs', { params });
  return data;
}

// ─── Tenant staff (app/app/users/audit-logs) ───

export interface TenantAuditParams {
  page?: number;
  pageSize?: number;
  severity?: AuditSeverity;
  category?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
}

export async function fetchTenantAuditLogs(
  params: TenantAuditParams = {}
): Promise<AuditLogResponse> {
  const { data } = await apiClient.get('/audit-logs', { params });
  return data;
}

/** Compliance export — streams the CSV and triggers a browser download. */
export async function exportTenantAuditLogsCsv(params: TenantAuditParams = {}): Promise<void> {
  const response = await apiClient.get('/audit-logs/export', {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const AUDIT_SEVERITIES: { value: AuditSeverity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'info', label: 'Info' },
];
export interface AuditStats {
  totalEvents: number;
  criticalEvents: number;
  eventsLast24h: number;
  uniqueUsers: number;
}

export async function fetchAuditStats(): Promise<AuditStats> {
  const res = await apiClient.get<{ data: AuditStats }>('/admin/audit-logs/stats');
  return res.data;
}
