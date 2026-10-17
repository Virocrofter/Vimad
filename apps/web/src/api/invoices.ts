/* apps/web/src/api/invoices.ts — [A5] thin auth'd client (mirrors api/client.ts conventions) */
import { apiGet, apiPost, apiClient } from './client';

export const invoicesApi = {
  list: (params: Record<string, unknown> = {}) => apiGet('/v1/invoices', params) as Promise<any[]>,
  issue: (folioId: string, send = false) =>
    apiPost('/v1/invoices', { folioId, send }) as Promise<any>,
  send: (id: string) => apiPost(`/v1/invoices/${id}/send`, {}) as Promise<{ sent: boolean }>,

  /**
   * Download an invoice PDF. Goes through the axios instance (auth
   * interceptor attached) with responseType 'blob' — a raw <a href> to
   * /v1/invoices/:id/pdf would 401 because browser navigations carry no
   * Authorization header.
   */
  downloadPdf: async (id: string): Promise<void> => {
    const response = await apiClient.get(`/v1/invoices/${encodeURIComponent(id)}/pdf`, {
      responseType: 'blob',
    });
    const blobUrl = URL.createObjectURL(response.data as Blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `invoice-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  },
};
