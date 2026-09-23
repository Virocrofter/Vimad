import { apiClient } from './client';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export async function getTickets(params?: { status?: string; page?: number }) {
  const { data } = await apiClient.get('/tickets', { params });
  return data;
}

export async function getTicket(id: string) {
  const { data } = await apiClient.get(`/tickets/${id}`);
  return data;
}

export async function createTicket(input: Partial<Ticket>) {
  const { data } = await apiClient.post('/tickets', input);
  return data;
}

export async function updateTicket(id: string, input: Partial<Ticket>) {
  const { data } = await apiClient.put(`/tickets/${id}`, input);
  return data;
}

export async function assignTicket(id: string, assigneeId: string) {
  const { data } = await apiClient.post(`/tickets/${id}/assign`, { assigneeId });
  return data;
}

export async function closeTicket(id: string) {
  const { data } = await apiClient.post(`/tickets/${id}/close`);
  return data;
}

export async function getTicketComments(ticketId: string) {
  const { data } = await apiClient.get(`/tickets/${ticketId}/comments`);
  return data;
}

export async function addComment(ticketId: string, message: string) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/comments`, { message });
  return data;
}

export async function getTicketStats() {
  const { data } = await apiClient.get('/tickets/stats');
  return data as TicketStats;
}
