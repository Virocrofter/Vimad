// Demo Access API client — built on the shared client so the auth store's
// token is attached exactly like every other admin page.
import { apiGet, apiPost } from './client';

const unwrap = (p: Promise<any>) => p.then((r: any) => r?.data ?? r);

export const getDemoStats = () => unwrap(apiGet('/admin/demo-access/stats'));
export const listDemoSessions = (q: Record<string, string> = {}) => {
  const sp = new URLSearchParams(Object.entries(q).filter(([, v]) => v)).toString();
  return unwrap(apiGet(`/admin/demo-access/sessions${sp ? `?${sp}` : ''}`));
};
export const getDemoSession = (id: string) => unwrap(apiGet(`/admin/demo-access/sessions/${id}`));
export const approveDemo = (id: string, body: object) =>
  unwrap(apiPost(`/admin/demo-access/sessions/${id}/approve`, body));
export const rejectDemo = (id: string, body: object) =>
  unwrap(apiPost(`/admin/demo-access/sessions/${id}/reject`, body));
export const inviteDemo = (id: string) =>
  unwrap(apiPost(`/admin/demo-access/sessions/${id}/invite`));
export const extendDemo = (id: string, body: object) =>
  unwrap(apiPost(`/admin/demo-access/sessions/${id}/extend`, body));
export const convertDemo = (id: string) =>
  unwrap(apiPost(`/admin/demo-access/sessions/${id}/convert`));
export const revokeDemo = (id: string, body: object) =>
  unwrap(apiPost(`/admin/demo-access/sessions/${id}/revoke`, body));
export const resetDemo = (id: string) => unwrap(apiPost(`/admin/demo-access/sessions/${id}/reset`));
export const requestDemo = (body: object) =>
  unwrap(apiPost('/v1/public/demo-access/request', body));
export const enterDemo = (token: string) =>
  unwrap(apiPost('/v1/public/demo-access/enter', { token }));
