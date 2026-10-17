/* apps/web/src/api/communications.ts */
import { apiGet, apiPost } from './client';

export interface EmailLogRow {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: 'queued' | 'sent' | 'failed';
  error: string | null;
  relatedType: string | null;
  relatedId: string | null;
  createdAt: string;
  sentAt: string | null;
}

export const communicationsApi = {
  logs: (params: Record<string, unknown>) =>
    apiGet('/v1/communications/email-logs', params) as Promise<{
      data: EmailLogRow[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>,
  resend: (id: string) =>
    apiPost(`/v1/communications/email-logs/${id}/resend`, {}) as Promise<{
      data: { queued: boolean };
    }>,
  sendConfirmation: (reservationId: string, force = false) =>
    apiPost('/v1/communications/send/confirmation', { reservationId, force }) as Promise<{
      data: unknown;
    }>,
  sendPreArrival: (reservationId: string) =>
    apiPost('/v1/communications/send/pre-arrival', { reservationId }) as Promise<{ data: unknown }>,
  sendFolio: (reservationId: string, to?: string) =>
    apiPost('/v1/communications/send/folio', { reservationId, to }) as Promise<{ data: unknown }>,
};
