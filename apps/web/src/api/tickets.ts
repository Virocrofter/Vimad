/* apps/web/src/api/tickets.ts — staff Support Desk client */
import { apiClient } from './client';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_guest' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory =
  | 'general'
  | 'billing'
  | 'housekeeping'
  | 'maintenance'
  | 'technology'
  | 'room_service'
  | 'concierge';

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorType: 'guest' | 'staff' | 'system';
  authorId: string | null;
  authorName: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  number: string;
  source: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  guestId: string | null;
  guestName: string | null;
  reservationId: string | null;
  propertyId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  slaResponseDueAt: string | null;
  slaResolveDueAt: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  slaBreached: boolean;
  escalationLevel: number;
  satisfactionRating: number | null;
  lastMessageAt: string;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  property?: { id: string; name: string } | null;
  reservation?: {
    id: string;
    confirmationNumber: string;
    roomType?: { name: string } | null;
  } | null;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingGuest: number;
  resolved: number;
  closed: number;
  unassigned: number;
  slaBreached: number;
  avgSatisfaction: number | null;
  satisfactionCount: number;
}

export interface TicketListParams {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigneeId?: string;
  guestId?: string;
  q?: string;
  sla?: 'ok' | 'breached' | 'due_soon';
  page?: number;
  pageSize?: number;
}

export async function getTickets(params?: TicketListParams) {
  const { data } = await apiClient.get('/tickets', { params });
  return data as {
    data: Ticket[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  };
}

export async function getTicket(id: string) {
  const { data } = await apiClient.get(`/tickets/${id}`);
  return data as { data: Ticket };
}

export async function createTicket(input: {
  subject: string;
  description: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  guestId?: string;
  reservationId?: string;
  propertyId?: string;
  message?: string;
}) {
  const { data } = await apiClient.post('/tickets', input);
  return data as { data: Ticket };
}

export async function updateTicket(
  id: string,
  input: Partial<Pick<Ticket, 'subject' | 'category' | 'priority' | 'status' | 'description'>>
) {
  const { data } = await apiClient.put(`/tickets/${id}`, input);
  return data as { data: Ticket };
}

export async function assignTicket(id: string, assigneeId: string | null) {
  const { data } = await apiClient.post(`/tickets/${id}/assign`, { assigneeId });
  return data as { data: Ticket };
}

export async function addTicketComment(id: string, message: string, isInternal = false) {
  const { data } = await apiClient.post(`/tickets/${id}/comments`, { message, isInternal });
  return data as { data: Ticket };
}

export async function closeTicket(id: string) {
  const { data } = await apiClient.post(`/tickets/${id}/close`);
  return data as { data: Ticket };
}

export async function getTicketStats() {
  const { data } = await apiClient.get('/tickets/stats');
  return data as { data: TicketStats };
}
