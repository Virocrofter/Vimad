import { apiClient } from './client';

// ─── Types ───

export interface SecuritySettings {
  id?: string;
  twoFactorRequired: boolean;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
  allowedCountries: string[];
  blockedCountries: string[];
  requireEmailVerification: boolean;
  allowSocialLogin: boolean;
  auditLogRetentionDays: number;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  lastSecurityAudit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSecuritySettingsRequest {
  twoFactorRequired?: boolean;
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSymbols?: boolean;
  passwordExpiryDays?: number;
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  sessionTimeoutMinutes?: number;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  allowedCountries?: string[];
  blockedCountries?: string[];
  requireEmailVerification?: boolean;
  allowSocialLogin?: boolean;
  auditLogRetentionDays?: number;
  encryptionAtRest?: boolean;
  encryptionInTransit?: boolean;
}

// ─── API Functions ───

const BASE_PATH = '/admin/security';

export async function fetchSecuritySettings(): Promise<SecuritySettings> {
  const response = await apiClient.get<{ data: SecuritySettings }>(`${BASE_PATH}/settings`);
  return response.data.data;
}

export async function updateSecuritySettings(
  data: UpdateSecuritySettingsRequest
): Promise<SecuritySettings> {
  const response = await apiClient.patch<{ data: SecuritySettings }>(`${BASE_PATH}/settings`, data);
  return response.data.data;
}

export async function getSecurityAuditLog(params?: {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}): Promise<{
  data: Array<{
    id: string;
    action: string;
    userId: string;
    userEmail: string;
    ipAddress: string;
    userAgent: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, unknown>;
    createdAt: string;
  }>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> {
  const response = await apiClient.get(`${BASE_PATH}/audit-log`, { params });
  return response.data;
}

export async function getActiveThreats(): Promise<{
  data: Array<{
    id: string;
    type: 'brute_force' | 'suspicious_ip' | 'unusual_activity' | 'failed_logins';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    description: string;
    detectedAt: string;
    status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  }>;
}> {
  const response = await apiClient.get(`${BASE_PATH}/threats`);
  return response.data;
}

export async function resolveThreat(
  id: string,
  status: 'resolved' | 'false_positive'
): Promise<void> {
  await apiClient.patch(`${BASE_PATH}/threats/${id}`, { status });
}

export async function blockIp(ipAddress: string, reason?: string): Promise<void> {
  await apiClient.post(`${BASE_PATH}/block-ip`, { ipAddress, reason });
}

export async function unblockIp(ipAddress: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/block-ip/${encodeURIComponent(ipAddress)}`);
}

export async function getBlockedIps(): Promise<{
  data: Array<{
    ipAddress: string;
    reason?: string;
    blockedAt: string;
    blockedBy: string;
  }>;
}> {
  const response = await apiClient.get(`${BASE_PATH}/blocked-ips`);
  return response.data;
}
