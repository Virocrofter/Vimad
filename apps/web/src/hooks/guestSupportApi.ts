/* apps/web/src/hooks/guestSupportApi.ts — guest portal support tickets.
 * Same scoped "guest-portal" JWT as guestPortalApi (sessionStorage gp_token).
 */
import { getGuestToken } from './guestPortalApi';

const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';

export interface GuestTicketMessage {
  id: string;
  authorType: 'guest' | 'staff' | 'system';
  authorName: string;
  body: string;
  createdAt: string;
}

export interface GuestTicket {
  id: string;
  number: string;
  subject: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'waiting_guest' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  satisfactionRating: number | null;
  lastMessageAt: string;
  lastMessage?: string | null;
  createdAt: string;
  messages?: GuestTicketMessage[];
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getGuestToken();
  const res = await fetch(`${API_BASE}/guest-portal/support${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body.data as T;
}

export const guestSupportApi = {
  list: () => req<GuestTicket[]>('/tickets'),

  create: (input: { subject: string; message: string; category: string; priority: string }) =>
    req<GuestTicket>('/tickets', { method: 'POST', body: JSON.stringify(input) }),

  get: (id: string) => req<GuestTicket>(`/tickets/${encodeURIComponent(id)}`),

  reply: (id: string, message: string) =>
    req<{ ok: boolean }>(`/tickets/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  rate: (id: string, rating: number, comment?: string) =>
    req<GuestTicket>(`/tickets/${encodeURIComponent(id)}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    }),
};
