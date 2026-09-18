/* apps/web/src/api/quotas.ts */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// ─── Types ───

export interface QuotaRule {
  id: string;
  name: string;
  description: string;
  resource: 'api_calls' | 'storage' | 'reservations' | 'users' | 'properties' | 'bandwidth';
  scope: 'tenant' | 'plan' | 'global';
  scopeTarget: string;
  limit: number;
  unit: string;
  period: 'hourly' | 'daily' | 'monthly';
  action: 'throttle' | 'block' | 'notify';
  throttleRate: number | null;
  overageEnabled: boolean;
  overageRate: number;
  overageCap: number;
  warnThreshold: number;
  hardLimit: number;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export interface QuotaUsage {
  id: string;
  tenantId: string;
  tenantName: string;
  resource: string;
  limit: number;
  used: number;
  unit: string;
  period: string;
  resetAt: string;
  lastUpdated: string;
}

export interface OverageEntry {
  id: string;
  tenantId: string;
  tenantName: string;
  resource: string;
  period: string;
  excessAmount: number;
  rate: number;
  charge: number;
  status: 'projected' | 'billed' | 'waived' | 'disputed';
  invoiceId: string | null;
  createdAt: string;
}

export interface ThrottleEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  resource: string;
  timestamp: string;
  reason: string;
  duration: number;
  resolved: boolean;
}

export interface QuotaStats {
  totalRules: number;
  activeRules: number;
  throttledTenants: number;
  monthlyOverages: number;
  activeThrottles: number;
}

// ─── Helper ───

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ─── API Functions ───

export async function fetchQuotaRules(): Promise<QuotaRule[]> {
  const res = await fetch(`${API_BASE}/v1/quotas/rules`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ data: QuotaRule[] }>(res);
  return data.data;
}

export async function createQuotaRule(
  input: Omit<QuotaRule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<QuotaRule> {
  const res = await fetch(`${API_BASE}/v1/quotas/rules`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ data: QuotaRule }>(res);
  return data.data;
}

export async function updateQuotaRule(id: string, input: Partial<QuotaRule>): Promise<QuotaRule> {
  const res = await fetch(`${API_BASE}/v1/quotas/rules/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ data: QuotaRule }>(res);
  return data.data;
}

export async function deleteQuotaRule(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/quotas/rules/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
}

export async function fetchQuotaUsage(params?: {
  resource?: string;
  tenantId?: string;
}): Promise<QuotaUsage[]> {
  const searchParams = new URLSearchParams();
  if (params?.resource) searchParams.set('resource', params.resource);
  if (params?.tenantId) searchParams.set('tenantId', params.tenantId);

  const res = await fetch(`${API_BASE}/v1/quotas/usage?${searchParams}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ data: QuotaUsage[] }>(res);
  return data.data;
}

export async function fetchOverages(params?: {
  status?: string;
  tenantId?: string;
}): Promise<OverageEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.tenantId) searchParams.set('tenantId', params.tenantId);

  const res = await fetch(`${API_BASE}/v1/quotas/overages?${searchParams}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ data: OverageEntry[] }>(res);
  return data.data;
}

export async function updateOverageStatus(
  id: string,
  status: 'waived' | 'disputed' | 'billed'
): Promise<OverageEntry> {
  const res = await fetch(`${API_BASE}/v1/quotas/overages/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  const data = await handleResponse<{ data: OverageEntry }>(res);
  return data.data;
}

export async function fetchThrottleEvents(params?: {
  resource?: string;
  tenantId?: string;
}): Promise<ThrottleEvent[]> {
  const searchParams = new URLSearchParams();
  if (params?.resource) searchParams.set('resource', params.resource);
  if (params?.tenantId) searchParams.set('tenantId', params.tenantId);

  const res = await fetch(`${API_BASE}/v1/quotas/throttles?${searchParams}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ data: ThrottleEvent[] }>(res);
  return data.data;
}

export async function fetchQuotaStats(): Promise<QuotaStats> {
  const res = await fetch(`${API_BASE}/v1/quotas/stats`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ data: QuotaStats }>(res);
  return data.data;
}
