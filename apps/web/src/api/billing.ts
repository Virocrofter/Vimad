// apps/web/src/api/billing.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface Invoice {
  id: string;
  tenantId: string;
  customerId?: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  plan: string;
  baseAmount: number;
  overageAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: string;
  items?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    properties: number;
    rooms: number;
    users: number;
    apiCalls: number;
  };
  createdAt: string;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'pending' | 'applied' | 'refunded';
  createdAt: string;
}

export interface DunningEvent {
  id: string;
  invoiceId: string;
  attempt: number;
  status: 'sent' | 'failed' | 'resolved';
  sentAt: string;
  resolvedAt?: string;
}

export interface RevenueRecord {
  date: string;
  revenue: number;
  mrr: number;
  arr: number;
  newCustomers: number;
  churnedCustomers: number;
  upgrades: number;
  downgrades: number;
}

const client = getApiClient();

export async function getInvoices(
  params?: PaginationParams & { status?: string; tenantId?: string }
): Promise<PaginatedResponse<Invoice>> {
  return client.get('/admin/billing/invoices', params as Record<string, unknown>);
}

export async function getInvoice(id: string): Promise<Invoice> {
  return client.get(`/admin/billing/invoices/${id}`);
}

export async function createInvoice(
  data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Invoice> {
  return client.post('/admin/billing/invoices', data);
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
  return client.patch(`/admin/billing/invoices/${id}`, data);
}

export async function deleteInvoice(id: string): Promise<void> {
  return client.delete(`/admin/billing/invoices/${id}`);
}

export async function getSubscriptions(
  params?: PaginationParams
): Promise<PaginatedResponse<Subscription>> {
  return client.get('/admin/billing/subscriptions', params as Record<string, unknown>);
}

export async function getSubscription(id: string): Promise<Subscription> {
  return client.get(`/admin/billing/subscriptions/${id}`);
}

export async function updateSubscription(
  id: string,
  data: Partial<Subscription>
): Promise<Subscription> {
  return client.patch(`/admin/billing/subscriptions/${id}`, data);
}

export async function cancelSubscription(
  id: string,
  params?: { immediately?: boolean }
): Promise<Subscription> {
  return client.post(`/admin/billing/subscriptions/${id}/cancel`, params);
}

export async function getCreditNotes(invoiceId?: string): Promise<CreditNote[]> {
  return client.get('/admin/billing/credit-notes', { invoiceId });
}

export async function createCreditNote(
  data: Omit<CreditNote, 'id' | 'createdAt'>
): Promise<CreditNote> {
  return client.post('/admin/billing/credit-notes', data);
}

export async function applyCreditNote(id: string): Promise<CreditNote> {
  return client.post(`/admin/billing/credit-notes/${id}/apply`);
}

export async function getDunningEvents(invoiceId?: string): Promise<DunningEvent[]> {
  return client.get('/admin/billing/dunning', { invoiceId });
}

export async function triggerDunning(invoiceId: string): Promise<DunningEvent> {
  return client.post(`/admin/billing/invoices/${invoiceId}/dunning`);
}

export async function getRevenueAnalytics(period: string): Promise<RevenueRecord[]> {
  return client.get('/admin/billing/revenue', { period });
}

export async function getBillingDashboard(): Promise<{
  totalRevenue: number;
  mrr: number;
  outstandingInvoices: number;
  overdueAmount: number;
  activeSubscriptions: number;
  trialConversions: number;
}> {
  return client.get('/admin/billing/dashboard');
}

export async function generateInvoice(
  tenantId: string,
  periodStart: string,
  periodEnd: string
): Promise<Invoice> {
  return client.post('/admin/billing/generate', { tenantId, periodStart, periodEnd });
}

export async function markInvoicePaid(
  id: string,
  paymentDetails?: { amount?: number; method?: string; reference?: string }
): Promise<Invoice> {
  return client.post(`/admin/billing/invoices/${id}/pay`, paymentDetails);
}

export async function getInvoicePdfUrl(id: string): Promise<{ url: string }> {
  return client.get(`/admin/billing/invoices/${id}/pdf`);
}
