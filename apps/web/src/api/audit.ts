// apps/web/src/api/audit.ts
import { getApiClient } from './client';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
  action?: string;
  entity?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchAuditLogs(filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
  const res = await getApiClient().get<{ data: PaginatedAuditLogs }>('/admin/audit-logs', {
    params: filters,
  });
  return res.data;
}

export async function fetchAuditLogById(id: string): Promise<AuditLogEntry> {
  const res = await getApiClient().get<{ data: AuditLogEntry }>(`/admin/audit-logs/${id}`);
  return res.data;
}
