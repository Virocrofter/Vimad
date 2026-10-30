/* Guest booking API — [G1a] de-mocked My Bookings */
import { getGuestToken } from './guestPortalApi';

const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';

async function request(path: string, init?: RequestInit) {
  const token = getGuestToken();
  if (!token) throw new Error('No portal session');
  const res = await fetch(API_BASE + path.replace(':token', encodeURIComponent(token)), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message ?? 'Request failed');
  return body?.data;
}

export interface CancellationQuote {
  hoursToArrival: number;
  tier: 'free' | 'half_first_night' | 'full_first_night';
  feePct: number;
  feeAmount: number;
  currency: string;
  refundableAmount: number;
  policyText: string;
}

export interface GuestBooking {
  reservation: {
    id: string;
    confirmationNumber: string;
    status: string;
    arrivalDate: string;
    departureDate: string;
    nights: number;
    adults: number;
    children: number;
    totalAmount: number;
    currency: string;
    property: { name: string; address?: string; city?: string; timezone: string };
    roomType: { name: string; code: string } | null;
    roomNumber: string | null;
    guest: { firstName: string; lastName: string };
    checkedInAt: string | null;
    cancelledAt: string | null;
    cancelReason: string | null;
  };
  cancellation: CancellationQuote;
  modifications: { id: string; type: string; payload: any; status: string; createdAt: string }[];
}

export const guestBookingApi = {
  get: (): Promise<GuestBooking> => request('/v1/guest-portal/booking/:token'),
  modify: (input: {
    newArrivalDate?: string;
    newDepartureDate?: string;
    roomTypeCode?: string;
    note?: string;
  }): Promise<{ request: any; deduped: boolean }> =>
    request('/v1/guest-portal/booking/:token/modify', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  cancel: (reason?: string): Promise<{ cancelled: boolean; cancellation: CancellationQuote }> =>
    request('/v1/guest-portal/booking/:token/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
