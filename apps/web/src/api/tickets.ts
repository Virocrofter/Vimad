// apps/web/src/api/tickets.ts
import { getApiClient } from './client';
import type { PaginatedResponse, PaginationParams } from './types';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  tenantId?: string;
  tenantName?: string;
  userId: string;
  userEmail: string;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  satisfaction?: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

const client = getApiClient();

export async function getTickets(
  params?: PaginationParams & {
    status?: string;
    priority?: string;
    category?: string;
    assigneeId?: string;
  }
): Promise<PaginatedResponse<SupportTicket>> {
  const query = params
    ? Object.entries(params).reduce<Record<string, string>>((result, [key, value]) => {
        if (value !== undefined) result[key] = String(value);
        return result;
      }, {})
    : undefined;

  return client.get('/admin/tickets', query);
}

export async function getTicket(id: string): Promise<SupportTicket> {
  return client.get(`/admin/tickets/${id}`);
}

export async function createTicket(
  data: Omit<
    SupportTicket,
    'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'closedAt'
  >
): Promise<SupportTicket> {
  return client.post('/admin/tickets', data);
}

export async function updateTicket(
  id: string,
  data: Partial<SupportTicket>
): Promise<SupportTicket> {
  return client.patch(`/admin/tickets/${id}`, data);
}

export async function assignTicket(id: string, assigneeId: string): Promise<SupportTicket> {
  return client.post(`/admin/tickets/${id}/assign`, { assigneeId });
}

export async function closeTicket(id: string, resolution: string): Promise<SupportTicket> {
  return client.post(`/admin/tickets/${id}/close`, { resolution });
}

export async function getTicketComments(ticketId: string): Promise<TicketComment[]> {
  return client.get(`/admin/tickets/${ticketId}/comments`);
}

export async function addComment(
  ticketId: string,
  message: string,
  isInternal?: boolean
): Promise<TicketComment> {
  return client.post(`/admin/tickets/${ticketId}/comments`, { message, isInternal });
}

export async function getTicketStats(): Promise<{
  totalOpen: number;
  totalInProgress: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
}> {
  return client.get('/admin/tickets/stats');
}
