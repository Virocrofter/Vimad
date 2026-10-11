// apps/web/src/api/rbac.ts
// Rewired: /admin/rbac/* does NOT exist on the backend.
// Real mounts: /v1/rbac (roles + permissions) and /v1/api-keys.
// SSO has no backend in v1 — functions kept as stubs that throw, gated by the adminSecurity flag.

import { apiClient } from './client';

export interface Permission {
  id: string;
  key?: string;
  name?: string;
  description?: string;
  category?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Array<string | Permission>;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix?: string;
  /** Full key — only present on the create response. */
  key?: string;
  scopes?: string[];
  lastUsedAt?: string | null;
  createdAt?: string;
  revokedAt?: string | null;
}

/** Backend responses are inconsistently wrapped ({ data }, bare, or { roles: [...] }). */
const unwrap = <T>(res: any): T => (res?.data?.data ?? res?.data ?? res) as T;
const asList = (d: any, key: string): any[] => (Array.isArray(d) ? d : (d?.[key] ?? []));

// ---------------------------------------------------------------------------
// Roles — /v1/rbac/roles
// ---------------------------------------------------------------------------

export async function getRoles(): Promise<Role[]> {
  const res = await apiClient.get('/v1/rbac/roles');
  return asList(unwrap<any>(res), 'roles');
}

export async function getRole(id: string): Promise<Role> {
  return unwrap(await apiClient.get(`/v1/rbac/roles/${id}`));
}

export async function createRole(input: {
  name: string;
  description?: string;
  permissions?: string[];
}): Promise<Role> {
  return unwrap(await apiClient.post('/v1/rbac/roles', input));
}

export async function updateRole(
  id: string,
  input: { name?: string; description?: string; permissions?: string[] }
): Promise<Role> {
  return unwrap(await apiClient.put(`/v1/rbac/roles/${id}`, input));
}

export async function deleteRole(id: string): Promise<void> {
  await apiClient.delete(`/v1/rbac/roles/${id}`);
}

export async function getPermissions(): Promise<Permission[]> {
  const res = await apiClient.get('/v1/rbac/permissions');
  return asList(unwrap<any>(res), 'permissions');
}

// ---------------------------------------------------------------------------
// API keys — /v1/api-keys
// ---------------------------------------------------------------------------

export async function getApiKeys(): Promise<ApiKey[]> {
  const res = await apiClient.get('/v1/api-keys');
  return asList(unwrap<any>(res), 'apiKeys');
}

export async function createApiKey(input: { name: string; scopes?: string[] }): Promise<ApiKey> {
  return unwrap(await apiClient.post('/v1/api-keys', input));
}

export async function revokeApiKey(id: string): Promise<void> {
  await apiClient.delete(`/v1/api-keys/${id}`);
}

// ---------------------------------------------------------------------------
// SSO — no backend in v1. Stubs throw loudly instead of silently 404ing.
// ---------------------------------------------------------------------------

const ssoUnavailable = (): never => {
  throw new Error('SSO is not available in v1 (no backend route). Feature flag: adminSecurity.');
};

export const getSSOConfigs = ssoUnavailable;
export const createSSOConfig = ssoUnavailable;
export const updateSSOConfig = ssoUnavailable;
export const deleteSSOConfig = ssoUnavailable;
