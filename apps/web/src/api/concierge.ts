/* apps/web/src/api/concierge.ts — T3 concierge board client */
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:3001'
).replace(/\/$/, '');

function getToken(): string {
  for (const key of ['vimad.token', 'vimad_access_token', 'access_token', 'token', 'auth']) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string' && parsed) return parsed;
      if (parsed?.accessToken) return parsed.accessToken;
      if (parsed?.token) return parsed.token;
      if (parsed?.state?.token) return parsed.state.token;
    } catch {
      if (raw.startsWith('eyJ')) return raw;
    }
  }
  return '';
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/v1/concierge${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}

export const conciergeApi = {
  board: (date: string, propertyId?: string) =>
    req<{ date: string; overdue: any[]; counts: any; sections: Record<string, any[]> }>(
      `/board?date=${date}${propertyId ? `&propertyId=${propertyId}` : ''}`
    ),

  create: (input: Record<string, unknown>) =>
    req<{ id: string }>('/', { method: 'POST', body: JSON.stringify(input) }),

  update: (id: string, patch: Record<string, unknown>) =>
    req<{ updated: boolean }>(`/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  postToFolio: (id: string) =>
    req<{ folioItemId: string; alreadyPosted: boolean }>(`/${id}/post-to-folio`, {
      method: 'POST',
    }),
};

export const CONCIERGE_TYPES = [
  { value: 'transfer', label: 'Transfer' },
  { value: 'special_request', label: 'Special request' },
  { value: 'wake_up_call', label: 'Wake-up call' },
  { value: 'restaurant_booking', label: 'Restaurant booking' },
  { value: 'activity_booking', label: 'Activity booking' },
  { value: 'upsell', label: 'Upsell' },
  { value: 'gesture', label: 'Guest gesture' },
] as const;

export const TRIP_FLOW = ['requested', 'confirmed', 'assigned', 'en_route', 'completed'] as const;

export const fmtRand = (minor: number) =>
  `R ${(minor / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
