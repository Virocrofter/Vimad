// apps/web/src/api/shadow.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface ShadowUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  tenantName: string;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
  createdAt: string;
}

export interface ShadowSession {
  id: string;
  shadowUserId: string;
  targetUserId: string;
  targetUserName: string;
  targetTenantId: string;
  targetTenantName: string;
  status: 'active' | 'expired' | 'terminated';
  startedAt: string;
  endedAt?: string;
  terminatedBy?: string;
  actions: {
    action: string;
    entity: string;
    entityId?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }[];
}

export interface ShadowAuditLog {
  id: string;
  sessionId: string;
  action: 'login' | 'logout' | 'view' | 'create' | 'update' | 'delete' | 'export';
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ShadowConfig {
  id: string;
  maxSessionDuration: number;
  requireApproval: boolean;
  approvers: string[];
  allowedTenants: string[];
  blockedTenants: string[];
  allowedActions: string[];
  auditLevel: 'minimal' | 'standard' | 'comprehensive';
  createdAt: string;
  updatedAt: string;
}

const client = getApiClient();

export async function getShadowUsers(
  params?: PaginationParams & { tenantId?: string; status?: string }
): Promise<PaginatedResponse<ShadowUser>> {
  return client.get('/admin/shadow/users', params as Record<string, string> | undefined);
}

export async function getShadowUser(id: string): Promise<ShadowUser> {
  return client.get(`/admin/shadow/users/${id}`);
}

export async function createShadowUser(
  data: Omit<ShadowUser, 'id' | 'createdAt' | 'lastLoginAt'>
): Promise<ShadowUser> {
  return client.post('/admin/shadow/users', data);
}

export async function updateShadowUser(id: string, data: Partial<ShadowUser>): Promise<ShadowUser> {
  return client.patch(`/admin/shadow/users/${id}`, data);
}

export async function deleteShadowUser(id: string): Promise<void> {
  return client.delete(`/admin/shadow/users/${id}`);
}

export async function getActiveSessions(): Promise<ShadowSession[]> {
  return client.get('/admin/shadow/sessions/active');
}

export async function getSessions(
  params?: PaginationParams & { shadowUserId?: string; status?: string }
): Promise<PaginatedResponse<ShadowSession>> {
  return client.get('/admin/shadow/sessions', params as Record<string, string> | undefined);
}

export async function getSession(id: string): Promise<ShadowSession> {
  return client.get(`/admin/shadow/sessions/${id}`);
}

export async function startShadowSession(
  targetUserId: string,
  reason: string
): Promise<ShadowSession> {
  return client.post('/admin/shadow/sessions', { targetUserId, reason });
}

export async function endShadowSession(id: string): Promise<ShadowSession> {
  return client.post(`/admin/shadow/sessions/${id}/end`, {});
}

export async function terminateShadowSession(id: string, reason: string): Promise<ShadowSession> {
  return client.post(`/admin/shadow/sessions/${id}/terminate`, { reason });
}

export async function getSessionAuditLog(sessionId: string): Promise<ShadowAuditLog[]> {
  return client.get(`/admin/shadow/sessions/${sessionId}/audit`);
}

export async function getAuditLogs(
  params?: PaginationParams & {
    sessionId?: string;
    action?: string;
    resource?: string;
    from?: string;
    to?: string;
  }
): Promise<PaginatedResponse<ShadowAuditLog>> {
  return client.get('/admin/shadow/audit', params as Record<string, string> | undefined);
}

export async function getShadowConfig(): Promise<ShadowConfig> {
  return client.get('/admin/shadow/config');
}

export async function updateShadowConfig(data: Partial<ShadowConfig>): Promise<ShadowConfig> {
  return client.patch('/admin/shadow/config', data);
}

export async function getShadowDashboard(): Promise<{
  activeSessions: number;
  totalUsers: number;
  sessionsToday: number;
  alerts: number;
  complianceScore: number;
}> {
  return client.get('/admin/shadow/dashboard');
}

export async function requestApproval(
  targetUserId: string,
  reason: string
): Promise<{ requestId: string; status: string }> {
  return client.post('/admin/shadow/approvals', { targetUserId, reason });
}

export async function getPendingApprovals(): Promise<
  { id: string; requester: string; targetUser: string; reason: string; requestedAt: string }[]
> {
  return client.get('/admin/shadow/approvals/pending');
}

export async function approveRequest(
  requestId: string
): Promise<{ approved: boolean; sessionId?: string }> {
  return client.post(`/admin/shadow/approvals/${requestId}/approve`, {});
}

export async function rejectRequest(
  requestId: string,
  reason: string
): Promise<{ rejected: boolean }> {
  return client.post(`/admin/shadow/approvals/${requestId}/reject`, { reason });
}

export async function getShadowTenants(): Promise<
  { id: string; name: string; accessible: boolean }[]
> {
  return client.get('/admin/shadow/tenants');
}
