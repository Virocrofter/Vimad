/* apps/web/src/api/public.ts
 * A4 — public booking API client. No auth header: these endpoints are for
 * guests who don't have an account.
 * NOTE: base URL convention — check `apps/web/src/api/client.ts` and align
 * API_BASE with how apiGet/apiPost resolve theirs.
 */
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:3001';

async function pubGet(path: string, params?: Record<string, unknown>) {
  const qs = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  const res = await fetch(`${API_BASE}${path}${qs}`, { headers: { Accept: 'application/json' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body.data ?? body;
}

async function pubPost(path: string, payload: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body.data ?? body;
}

export const publicBookingApi = {
  property: (code: string) => pubGet(`/v1/public/properties/${code}`),
  availability: (code: string, params: Record<string, unknown>) =>
    pubGet(`/v1/public/properties/${code}/availability`, params),
  book: (code: string, payload: unknown) =>
    pubPost(`/v1/public/properties/${code}/bookings`, payload),
  cancel: (payload: { confirmationNumber: string; email: string }) =>
    pubPost('/v1/public/cancellations', payload),
};
