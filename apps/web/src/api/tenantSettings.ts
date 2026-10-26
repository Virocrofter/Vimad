/* apps/web/src/api/tenantSettings.ts — tenant self-service settings client.
 * Backend: /v1/tenant/settings/* (tenant-settings.routes.ts, self-contained).
 */
import { apiClient } from './client';

export interface TenantProfile {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    createdAt: string;
  };
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
  properties: number;
  members: number;
  usage: Record<string, number>;
}

export interface PlatformInvoice {
  id: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  plan: string;
  baseAmount: number | string;
  overageAmount: number | string;
  totalAmount: number | string;
  currency: string;
  status: string;
  paidAt: string | null;
}

export interface Diagnostics {
  app: string;
  version: string;
  environment: string;
  node: string;
  tenantId: string;
  serverTime: string;
  db: string;
  redis: string;
}

export async function getTenantProfile() {
  const { data } = await apiClient.get('/tenant/settings/profile');
  return data as { data: TenantProfile };
}

export async function listMyInvoices(page = 1, pageSize = 10) {
  const { data } = await apiClient.get('/tenant/settings/invoices', {
    params: { page, pageSize },
  });
  return data as {
    data: PlatformInvoice[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  };
}

export async function requestPlanChange(plan: string, note?: string) {
  const { data } = await apiClient.post('/tenant/settings/plan-request', { plan, note });
  return data as { data: { requested: string; caseNumber: string; message: string } };
}

export async function requestCardCaptureLink() {
  const { data } = await apiClient.post('/tenant/settings/support-request', {
    kind: 'card_capture',
  });
  return data as { data: { caseNumber: string; message: string } };
}

export async function getDiagnostics() {
  const { data } = await apiClient.get('/tenant/settings/diagnostics');
  return data as { data: Diagnostics };
}
