// apps/web/src/api/rbac.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface Role {
  id: string;
  name: string;
  description?: string;
  type: 'system' | 'custom';
  isDefault: boolean;
  isLocked: boolean;
  tenantId?: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
  category: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: 'active' | 'revoked';
  environment: string;
  rateLimit: string;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
  createdBy: string;
}

export interface SSOConfig {
  id: string;
  provider: string;
  clientId: string;
  domain?: string;
  enabled: boolean;
  autoProvision: boolean;
  defaultRole: string;
  createdAt: string;
  updatedAt: string;
}

const client = getApiClient();

export async function getRoles(
  params?: PaginationParams & { type?: string }
): Promise<PaginatedResponse<Role>> {
  return client.get('/admin/rbac/roles', params);
}

export async function getRole(id: string): Promise<Role> {
  return client.get(`/admin/rbac/roles/${id}`);
}

export async function createRole(
  data: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'userCount'>
): Promise<Role> {
  return client.post('/admin/rbac/roles', data);
}

export async function updateRole(id: string, data: Partial<Role>): Promise<Role> {
  return client.patch(`/admin/rbac/roles/${id}`, data);
}

export async function deleteRole(id: string): Promise<void> {
  return client.delete(`/admin/rbac/roles/${id}`);
}

export async function getPermissions(): Promise<Permission[]> {
  return client.get('/admin/rbac/permissions');
}

export async function getApiKeys(
  params?: PaginationParams & { status?: string }
): Promise<PaginatedResponse<ApiKey>> {
  return client.get('/admin/rbac/api-keys', params);
}

export async function createApiKey(data: {
  name: string;
  scopes: string[];
  environment?: string;
  expiresAt?: string;
}): Promise<{ apiKey: ApiKey; secret: string }> {
  return client.post('/admin/rbac/api-keys', data);
}

export async function revokeApiKey(id: string, reason: string): Promise<ApiKey> {
  return client.post(`/admin/rbac/api-keys/${id}/revoke`, { reason });
}

export async function getSSOConfigs(): Promise<SSOConfig[]> {
  return client.get('/admin/rbac/sso');
}

export async function createSSOConfig(
  data: Omit<SSOConfig, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SSOConfig> {
  return client.post('/admin/rbac/sso', data);
}

export async function updateSSOConfig(id: string, data: Partial<SSOConfig>): Promise<SSOConfig> {
  return client.patch(`/admin/rbac/sso/${id}`, data);
}

export async function deleteSSOConfig(id: string): Promise<void> {
  return client.delete(`/admin/rbac/sso/${id}`);
}
