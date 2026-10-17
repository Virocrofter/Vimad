/* apps/web/src/api/minibar.js — T2 api client */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Token lives under vimad_access_token (fallbacks: vimad_token, auth-storage persist)
function unwrap(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'string') return parsed;
    return (
      parsed?.token ??
      parsed?.accessToken ??
      parsed?.state?.token ??
      parsed?.state?.accessToken ??
      null
    );
  } catch {
    return value; // already a raw JWT
  }
}

export function getToken() {
  for (const key of ['vimad_access_token', 'vimad_token', 'token', 'auth-storage']) {
    const t = unwrap(localStorage.getItem(key));
    if (t) return t;
  }
  return null;
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  return json;
}

// ─── T2 endpoints ───
export const fetchSupervisorBoard = (department = 'housekeeping') =>
  api(`/v1/housekeeping/supervisor/board?department=${department}`);
export const reassignTask = (id, assigneeId, note) =>
  api(`/v1/housekeeping/supervisor/tasks/${id}/reassign`, {
    method: 'POST',
    body: { assigneeId, note },
  });
export const overrideTask = (id, action, note) =>
  api(`/v1/housekeeping/supervisor/tasks/${id}/override`, {
    method: 'POST',
    body: { action, note },
  });
export const fetchTaskAudit = (id) => api(`/v1/housekeeping/supervisor/tasks/${id}/audit`);

export const logMinibar = (payload) => api('/v1/minibar', { method: 'POST', body: payload });
export const fetchMinibarChecks = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return api(`/v1/minibar?${qs}`);
};
export const waiveMinibar = (id, reason) =>
  api(`/v1/minibar/${id}/waive`, { method: 'POST', body: { reason } });
