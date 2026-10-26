/* apps/web/src/api/ar.ts */
import { api } from './client';

const unwrap = <T>(p: Promise<{ data: T }>): Promise<T> => p.then((r) => r.data);

// ─── Accounts ───

export interface ArAccount {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  taxNumber: string | null;
  billingContact: string | null;
  billingEmail: string | null;
  billingAddress: string | null;
  creditLimit: number | null;
  paymentTermsDays: number;
  negotiatedRate: number | null;
  notes: string | null;
  isActive: boolean;
  outstanding?: number;
  availableCredit?: number | null;
  creditUtilization?: number | null;
  overdueInvoices?: number;
}

export interface ArAccountInput {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  taxNumber?: string;
  billingContact?: string;
  billingEmail?: string;
  billingAddress?: string;
  creditLimit?: number;
  paymentTermsDays?: number;
  negotiatedRate?: number;
  notes?: string;
}

export const listArAccounts = (params?: Record<string, unknown>) =>
  unwrap(api.get('/ar/accounts', { params }));

export const getArAccount = (id: string) => unwrap(api.get(`/ar/accounts/${id}`));

export const createArAccount = (input: ArAccountInput) => unwrap(api.post('/ar/accounts', input));

export const updateArAccount = (
  id: string,
  input: Partial<ArAccountInput> & { isActive?: boolean }
) => unwrap(api.put(`/ar/accounts/${id}`, input));

// ─── Invoices ───

export interface ArInvoiceItemInput {
  description: string;
  amount: number;
  date?: string;
  folioId?: string;
  reservationId?: string;
  guestId?: string;
}

export const listArInvoices = (params?: Record<string, unknown>) =>
  unwrap(api.get('/ar/invoices', { params }));

export const getArInvoice = (id: string) => unwrap(api.get(`/ar/invoices/${id}`));

export const createArInvoice = (input: {
  corporateAccountId: string;
  propertyId?: string;
  vatRate?: number;
  dueDate?: string;
  notes?: string;
  items: ArInvoiceItemInput[];
}) => unwrap(api.post('/ar/invoices', input));

export const sendArInvoice = (id: string) => unwrap(api.post(`/ar/invoices/${id}/send`));

export const cancelArInvoice = (id: string, reason?: string) =>
  unwrap(api.post(`/ar/invoices/${id}/cancel`, { reason }));

// ─── Payments ───

export const listArPayments = (params?: Record<string, unknown>) =>
  unwrap(api.get('/ar/payments', { params }));

export const recordArPayment = (input: {
  corporateAccountId: string;
  invoiceId?: string;
  amount: number;
  method?: string;
  reference?: string;
  note?: string;
}) => unwrap(api.post('/ar/payments', input));

export const reverseArPayment = (id: string, reason?: string) =>
  unwrap(api.post(`/ar/payments/${id}/reverse`, { reason }));

// ─── Summary & Statements ───

export const getArSummary = () => unwrap(api.get('/ar/summary'));

export const getArStatement = (accountId: string, params?: Record<string, unknown>) =>
  unwrap(api.get(`/ar/accounts/${accountId}/statement`, { params }));

export const getArStatementCsvUrl = (accountId: string, params?: Record<string, unknown>) => {
  const qs = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => v != null && v !== '') as [string, string][]
  ).toString();
  return `/api/v1/ar/accounts/${accountId}/statement.csv${qs ? `?${qs}` : ''}`;
};
