import { apiClient } from './client';

export interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    required: boolean;
    methods: ('authenticator' | 'sms' | 'email')[];
    enforceForRoles: string[];
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expiryDays: number;
    preventReuse: number;
  };
  sessionSecurity: {
    maxConcurrentSessions: number;
    idleTimeoutMinutes: number;
    absoluteTimeoutHours: number;
    requireReauthForSensitive: boolean;
  };
  ipRestrictions: {
    enabled: boolean;
    allowedIPs: string[];
    blockedIPs: string[];
  };
  auditRetention: {
    days: number;
    archiveAfterDays: number;
  };
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  details?: Record<string, unknown>;
}

export async function fetchSecuritySettings(): Promise<SecuritySettings> {
  const response = await apiClient.get<{ data: SecuritySettings }>('/v1/admin/security/settings');
  return response.data;
}

export async function updateSecuritySettings(
  payload: Partial<SecuritySettings>
): Promise<SecuritySettings> {
  const response = await apiClient.patch<{ data: SecuritySettings }>(
    '/v1/admin/security/settings',
    payload
  );
  return response.data;
}

export async function fetchSecurityAuditLogs(params: {
  page: number;
  pageSize: number;
  userId?: string;
  action?: string;
  status?: 'success' | 'failure';
  startDate?: string;
  endDate?: string;
}): Promise<{
  data: SecurityAuditLog[];
  meta: { total: number; page: number; totalPages: number };
}> {
  const response = await apiClient.get('/v1/admin/security/audit-logs', { params });
  return response.data;
}

export async function enableTwoFactor(userId: string): Promise<{ qrCode: string; secret: string }> {
  const response = await apiClient.post<{ data: { qrCode: string; secret: string } }>(
    `/v1/admin/security/2fa/enable`,
    { userId }
  );
  return response.data;
}

export async function disableTwoFactor(userId: string): Promise<void> {
  await apiClient.post(`/v1/admin/security/2fa/disable`, { userId });
}
