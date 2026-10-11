/* apps/web/src/hooks/guestPortalApi.ts
 * Guest Portal API client. Public, token-based:
 *   1. POST /lookup   (confirmationNumber + lastName)
 *   2. POST /verify   (→ JWT scoped "guest-portal", stored in sessionStorage)
 *   3. token-gated: stay details, check-in, digital key, service requests, preferences
 */

const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';

const TOKEN_KEY = 'gp_token';

export function getGuestToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setGuestToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

export function clearGuestToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export class GuestPortalError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/guest-portal${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GuestPortalError(
      res.status,
      body?.error?.code ?? 'REQUEST_FAILED',
      body?.error?.message ?? `Request failed (${res.status})`
    );
  }
  return body.data as T;
}

/* ─── Types (mirror the OpenAPI response schemas) ─── */
export interface LookupResult {
  found: boolean;
  confirmationNumber: string;
  guestName: string;
  arrivalDate: string;
  departureDate: string;
}

export interface VerifyResult {
  verified: boolean;
  token: string;
  guestName: string;
}

export interface StayDetails {
  token: string;
  guestName: string;
  roomNumber: string;
  arrivalDate: string;
  departureDate: string;
  checkedIn: boolean;
  digitalKeyReady: boolean;
}

export interface CheckInResult {
  success: boolean;
  token: string;
  checkedIn: boolean;
  estimatedArrivalTime?: string;
}

export interface DigitalKey {
  token: string;
  keyCode: string;
  activeFrom: string;
  activeUntil: string;
}

export interface ServiceRequestResult {
  id: string;
  token: string;
  type: 'housekeeping' | 'maintenance' | 'concierge' | 'amenity';
  message: string;
  status: string;
  createdAt: string;
}

export interface PreferencesResult {
  token: string;
  preferences: Record<string, string>;
  updatedAt: string;
}

/* ─── Calls ─── */
export const guestPortalApi = {
  lookup: (confirmationNumber: string, lastName: string) =>
    request<LookupResult>('/lookup', {
      method: 'POST',
      body: JSON.stringify({ confirmationNumber, lastName }),
    }),

  verify: (confirmationNumber: string, lastName: string, documentNumber?: string) =>
    request<VerifyResult>('/verify', {
      method: 'POST',
      body: JSON.stringify({ confirmationNumber, lastName, documentNumber }),
    }),

  stay: (token: string) => request<StayDetails>(`/stay/${encodeURIComponent(token)}`),

  checkIn: (input: {
    token: string;
    estimatedArrivalTime?: string;
    idDocument?: string;
    signature?: string;
  }) => request<CheckInResult>('/check-in', { method: 'POST', body: JSON.stringify(input) }),

  digitalKey: (token: string) => request<DigitalKey>(`/digital-key/${encodeURIComponent(token)}`),

  serviceRequest: (input: {
    token: string;
    type: ServiceRequestResult['type'];
    message: string;
    requestedAt?: string;
  }) =>
    request<ServiceRequestResult>('/service-request', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updatePreferences: (token: string, preferences: Record<string, string>) =>
    request<PreferencesResult>(`/preferences/${encodeURIComponent(token)}`, {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }),
};
