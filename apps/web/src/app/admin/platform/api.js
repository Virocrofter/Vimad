// Platform API adapter - same transport as billing (VITE_API_URL + Bearer).
import { getAccessToken } from '../../../stores/authStores';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001';

async function req(path, { method = 'GET', body } = {}) {
  const token = getAccessToken();
  const res = await fetch(API_BASE + '/admin' + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const raw = (data && (data.error || data.message)) || res.statusText;
    throw new Error(typeof raw === 'string' ? raw : JSON.stringify(raw));
  }
  return data;
}

export const getKpis = () => req('/kpis');
export const getHealth = () => req('/health');
