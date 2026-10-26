/* apps/web/src/api/chainBilling.ts — C5 chain corporate billing */
import { apiGet, apiPost } from './client';

export interface ChainAccount {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  billingEmail?: string | null;
  creditLimit: number | null;
  paymentTermsDays: number;
  outstanding: number;
  folioCount: number;
  perProperty: {
    propertyId: string;
    propertyName: string;
    folioCount: number;
    outstanding: number;
  }[];
}
export interface ChainFolio {
  id: string;
  status: string;
  balance: number;
  totalCharges: number;
  totalPayments: number;
  invariantOk: boolean;
  property: { id: string; name: string };
  guest: { id: string; firstName: string; lastName: string };
  confirmationNumber: string;
  reservationId: string;
  updatedAt: string;
}
export interface ChainInvoice {
  id: string;
  number: string;
  status: string;
  currency: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  amountPaid: number;
  issueDate: string;
  dueDate: string;
  accountName: string | null;
  properties: string[];
  items: {
    id: string;
    description: string;
    amount: number;
    folioId: string | null;
    reservationId: string | null;
    propertyName: string | null;
    date: string;
  }[];
}
export interface ChainTransferItem {
  id: string;
  type: string;
  description: string;
  amount: number;
  postedAt: string;
  folioId: string;
  propertyName: string;
  guestName: string;
  confirmationNumber: string;
}

export async function listChainAccounts(): Promise<ChainAccount[]> {
  const res = await apiGet<{ data: ChainAccount[] }>('/v1/chain-billing/accounts');
  return res.data;
}
export async function listChainFolios(): Promise<ChainFolio[]> {
  const res = await apiGet<{ data: ChainFolio[] }>('/v1/chain-billing/folios');
  return res.data;
}
export async function listChainInvoices(accountId: string): Promise<ChainInvoice[]> {
  const res = await apiGet<{ data: ChainInvoice[] }>(
    `/v1/chain-billing/accounts/${accountId}/invoices`
  );
  return res.data;
}
export async function createConsolidatedInvoice(
  accountId: string,
  input: { periodStart: string; periodEnd: string; guestIds?: string[] }
): Promise<ChainInvoice> {
  const res = await apiPost<{ data: ChainInvoice }>(
    `/v1/chain-billing/accounts/${accountId}/invoices`,
    input
  );
  return res.data;
}
export async function transferFolio(input: {
  fromFolioId: string;
  toFolioId: string;
  amount: number;
  reason?: string;
}): Promise<{ from: ChainFolio; to: ChainFolio }> {
  const res = await apiPost<{ data: { from: ChainFolio; to: ChainFolio } }>(
    '/v1/chain-billing/folios/transfer',
    input
  );
  return res.data;
}
export async function recentTransfers(): Promise<ChainTransferItem[]> {
  const res = await apiGet<{ data: ChainTransferItem[] }>('/v1/chain-billing/transfers');
  return res.data;
}
