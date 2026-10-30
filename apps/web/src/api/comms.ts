/* apps/web/src/api/comms.ts — staff comms desk (chat inbox, reviews, announcements) */
import { apiClient } from './client';

export interface CommsThread {
  id: string;
  reservationId: string;
  guestId: string;
  guestName: string;
  confirmationNumber: string;
  status: 'open' | 'closed';
  unreadForStaff: number;
  lastMessageAt: string;
  lastMessage: { body: string; authorType: string; createdAt: string } | null;
}

export interface CommsMessage {
  id: string;
  authorType: 'guest' | 'staff';
  authorName: string;
  body: string;
  createdAt: string;
}

export interface CommsReview {
  id: string;
  guestName: string;
  confirmationNumber?: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  moderationNote: string | null;
  createdAt: string;
}

export const commsApi = {
  inbox: (status = 'open') =>
    apiClient.get('/comms/chat/inbox', { params: { status } }).then((r) => r.data),
  messages: (threadId: string) =>
    apiClient.get(`/comms/chat/threads/${threadId}/messages`).then((r) => r.data),
  reply: (threadId: string, body: string) =>
    apiClient.post(`/comms/chat/threads/${threadId}/messages`, { body }).then((r) => r.data),
  setStatus: (threadId: string, status: 'open' | 'closed') =>
    apiClient.patch(`/comms/chat/threads/${threadId}`, { status }).then((r) => r.data),
  reviews: (status = 'pending') =>
    apiClient.get('/comms/reviews', { params: { status } }).then((r) => r.data),
  moderateReview: (id: string, status: 'approved' | 'rejected', note?: string) =>
    apiClient.patch(`/comms/reviews/${id}`, { status, moderationNote: note }).then((r) => r.data),
};
