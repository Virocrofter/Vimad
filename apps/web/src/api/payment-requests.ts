/* apps/web/src/api/payment-requests.ts */
import { apiGet, apiPost } from './client';

export interface PaymentRequestRow {
  id: string;
  reference: string;
  status: 'pending' | 'sent' | 'paid' | 'expired' | 'cancelled';
  amountMinor: number;
  currency: string;
  depositPercent: number;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
  remindersSent: number;
  reminderOffsetsHours: number[];
  autoCancelEnabled: boolean;
  autoCancelAt: string | null;
  reservationCancelled: boolean;
  hostedUrl: string | null;
  description: string | null;
  reservation: {
    id: string;
    confirmationNumber: string;
    arrivalDate: string;
    departureDate: string;
    status: string;
    guest: { id: string; firstName: string; lastName: string; email: string | null };
  } | null;
  payment: { id: string; reference: string; status: string } | null;
}

export const paymentRequestsApi = {
  list: (params: Record<string, unknown>) =>
    apiGet('/v1/payment-requests', { params }) as Promise<{
      data: PaymentRequestRow[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>,
  summary: () =>
    apiGet('/v1/payment-requests/summary') as Promise<{
      data: {
        pending: { count: number; amountMinor: number };
        overdue: { count: number; amountMinor: number };
        paidThisMonth: { count: number; amountMinor: number };
        collectionRate: number;
      };
    }>,
  create: (body: Record<string, unknown>) =>
    apiPost('/v1/payment-requests', body) as Promise<{ data: PaymentRequestRow }>,
  send: (id: string) =>
    apiPost(`/v1/payment-requests/${id}/send`, {}) as Promise<{ data: PaymentRequestRow }>,
  cancel: (id: string, note?: string) =>
    apiPost(`/v1/payment-requests/${id}/cancel`, { note }) as Promise<{ data: PaymentRequestRow }>,
};
