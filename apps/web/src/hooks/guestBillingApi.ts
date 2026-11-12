/* Guest billing API — [G1b] de-mocked Billing / Invoice / Split */
import { getGuestToken } from './guestPortalApi';

const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';

export interface GuestFolioView {
  folio: {
    id: string;
    status: string;
    currency: string;
    totalCharges: number;
    totalPayments: number;
    balance: number;
  };
  items: {
    id: string;
    type: string;
    description: string;
    amount: number;
    quantity: number;
    postedAt: string;
  }[];
  payments: {
    id: string;
    reference: string;
    amountMinor: number;
    currency: string;
    status: string;
    channel: string;
    createdAt: string;
  }[];
  invoices: {
    id: string;
    number: string;
    type: string;
    status: string;
    totalInclVat: number;
    amountPaid: number;
    issueDate: string;
    pdfAvailable: boolean;
  }[];
  property: { name: string; vatNumber?: string; currency: string };
  guestName: string;
  confirmationNumber: string;
}

export const guestBillingApi = {
  get: async (): Promise<GuestFolioView> => {
    const token = getGuestToken();
    if (!token) throw new Error('No portal session');
    const res = await fetch(API_BASE + '/v1/guest-portal/folio/' + encodeURIComponent(token));
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error?.message ?? 'Request failed');
    return body.data;
  },
  invoicePdfUrl: (invoiceId: string): string => {
    const token = getGuestToken() ?? '';
    return (
      API_BASE +
      '/v1/guest-portal/invoice/' +
      encodeURIComponent(token) +
      '/' +
      encodeURIComponent(invoiceId) +
      '/pdf'
    );
  },
};
