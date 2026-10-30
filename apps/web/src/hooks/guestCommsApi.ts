/* apps/web/src/hooks/guestCommsApi.ts — G5 chat / reviews / announcements client */
import { getGuestToken, GuestPortalError } from './guestPortalApi';

const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';

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

export interface ChatMessageItem {
  id: string;
  authorType: 'guest' | 'staff';
  authorName: string;
  body: string;
  clientId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ChatThreadState {
  id: string;
  status: string;
  lastMessageAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  publishAt: string;
}

export interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  moderationNote: string | null;
  createdAt: string;
}

export const guestCommsApi = {
  chatThread: (token: string) =>
    request<{ thread: ChatThreadState; messages: ChatMessageItem[] }>(
      `/comms/chat/${encodeURIComponent(token)}/thread`
    ),

  chatSend: (token: string, input: { body: string; clientId: string }) =>
    request<{ message: ChatMessageItem; idempotentReplay: boolean }>(
      `/comms/chat/${encodeURIComponent(token)}/messages`,
      { method: 'POST', body: JSON.stringify(input) }
    ),

  chatClose: (token: string) =>
    request<{ id: string; status: string }>(
      `/comms/chat/${encodeURIComponent(token)}/thread/close`,
      { method: 'POST' }
    ),

  announcements: (token: string) =>
    request<{ token: string; announcements: AnnouncementItem[] }>(
      `/comms/announcements/${encodeURIComponent(token)}`
    ),

  myReview: (token: string) =>
    request<{ token: string; review: ReviewItem | null }>(
      `/comms/reviews/${encodeURIComponent(token)}/mine`
    ),

  submitReview: (token: string, input: { rating: number; title?: string; body: string }) =>
    request<{ review: ReviewItem; idempotentReplay: boolean }>(
      `/comms/reviews/${encodeURIComponent(token)}`,
      { method: 'POST', body: JSON.stringify(input) }
    ),
};
