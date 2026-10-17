/* apps/web/src/api/salesCatering.ts — S&C API client on the shared axios transport
 * (auth, token refresh, x-property-id and offline interceptors come from apiClient) */
import { apiClient } from './client';

const BASE = '/v1/sales-catering';

const qs = (params: Record<string, string>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return s ? `?${s}` : '';
};

export const scApi = {
  // Catalogs (routes return { data: [...] } — unwrap to the array)
  catalog: <T = any>(kind: string) =>
    apiClient.get<{ data: T[] }>(`${BASE}/catalog/${kind}`).then((r) => r.data.data),
  createCatalogItem: (kind: string, data: any) =>
    apiClient.post(`${BASE}/catalog/${kind}`, data).then((r) => r.data),
  updateCatalogItem: (kind: string, id: string, data: any) =>
    apiClient.patch(`${BASE}/catalog/${kind}/${id}`, data).then((r) => r.data),
  deleteCatalogItem: (kind: string, id: string) =>
    apiClient.delete(`${BASE}/catalog/${kind}/${id}`).then((r) => r.data),

  stats: () => apiClient.get(`${BASE}/stats`).then((r) => r.data),

  // Clients
  clients: (q = '') =>
    apiClient.get<{ data: any[] }>(`${BASE}/clients${qs({ q })}`).then((r) => r.data),
  client: (id: string) => apiClient.get(`${BASE}/clients/${id}`).then((r) => r.data),
  createClient: (data: any) => apiClient.post(`${BASE}/clients`, data).then((r) => r.data),
  updateClient: (id: string, data: any) =>
    apiClient.patch(`${BASE}/clients/${id}`, data).then((r) => r.data),
  deleteClient: (id: string) => apiClient.delete(`${BASE}/clients/${id}`).then((r) => r.data),

  // Events
  events: (params: Record<string, string> = {}) =>
    apiClient.get<{ data: any[] }>(`${BASE}/events${qs(params)}`).then((r) => r.data),
  event: (id: string) => apiClient.get(`${BASE}/events/${id}`).then((r) => r.data),
  createEvent: (data: any) => apiClient.post(`${BASE}/events`, data).then((r) => r.data),
  updateEvent: (id: string, data: any) =>
    apiClient.patch(`${BASE}/events/${id}`, data).then((r) => r.data),
  deleteEvent: (id: string) => apiClient.delete(`${BASE}/events/${id}`).then((r) => r.data),

  // BEOs
  beos: (params: Record<string, string> = {}) =>
    apiClient.get<{ data: any[] }>(`${BASE}/beos${qs(params)}`).then((r) => r.data),
  beo: (id: string) => apiClient.get(`${BASE}/beos/${id}`).then((r) => r.data),
  saveBeo: (data: any) => apiClient.post(`${BASE}/beos`, data).then((r) => r.data),
  submitBeo: (id: string) => apiClient.post(`${BASE}/beos/${id}/submit`, {}).then((r) => r.data),
  approveBeo: (id: string) => apiClient.post(`${BASE}/beos/${id}/approve`, {}).then((r) => r.data),
  requestChanges: (id: string) =>
    apiClient.post(`${BASE}/beos/${id}/request-changes`, {}).then((r) => r.data),
  signBeo: (id: string, signer: { name: string; role?: string }) =>
    apiClient.post(`${BASE}/beos/${id}/sign`, signer).then((r) => r.data),

  // Activity
  addActivity: (data: any) => apiClient.post(`${BASE}/activities`, data).then((r) => r.data),
};
