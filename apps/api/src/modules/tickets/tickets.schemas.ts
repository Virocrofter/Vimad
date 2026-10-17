/* apps/api/src/modules/tickets/tickets.schemas.ts */
import { z } from 'zod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { paginationSchema } from '../../common/pagination.js';

export const registry = new OpenAPIRegistry();

const TICKET_STATUSES = ['open', 'in_progress', 'waiting_guest', 'resolved', 'closed'] as const;
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const TICKET_CATEGORIES = [
  'general',
  'billing',
  'housekeeping',
  'maintenance',
  'technology',
  'room_service',
  'concierge',
] as const;

export const ticketStatusSchema = z.enum(TICKET_STATUSES);
export const ticketPrioritySchema = z.enum(TICKET_PRIORITIES);
export const ticketCategorySchema = z.enum(TICKET_CATEGORIES);

export const ticketMessageSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  authorType: z.enum(['guest', 'staff', 'system']),
  authorId: z.string().nullable(),
  authorName: z.string(),
  body: z.string(),
  isInternal: z.boolean(),
  createdAt: z.string(),
});

export const ticketSchema = z.object({
  id: z.string(),
  number: z.string(),
  source: z.string(),
  subject: z.string(),
  description: z.string(),
  category: ticketCategorySchema,
  status: ticketStatusSchema,
  priority: ticketPrioritySchema,
  guestId: z.string().nullable(),
  guestName: z.string().nullable(),
  reservationId: z.string().nullable(),
  propertyId: z.string().nullable(),
  assigneeId: z.string().nullable(),
  assigneeName: z.string().nullable(),
  createdById: z.string().nullable(),
  slaResponseDueAt: z.string().nullable(),
  slaResolveDueAt: z.string().nullable(),
  firstResponseAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  slaBreached: z.boolean(),
  escalationLevel: z.number().int(),
  satisfactionRating: z.number().int().nullable(),
  lastMessageAt: z.string(),
  lastMessage: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(ticketMessageSchema).optional(),
});

export const listTicketsQuerySchema = paginationSchema.extend({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  category: ticketCategorySchema.optional(),
  assigneeId: z.string().optional(),
  guestId: z.string().optional(),
  q: z.string().optional(),
  sla: z.enum(['ok', 'breached', 'due_soon']).optional(),
});

export const createTicketBodySchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(1).max(5000),
  category: ticketCategorySchema.default('general'),
  priority: ticketPrioritySchema.default('medium'),
  guestId: z.string().optional(),
  reservationId: z.string().optional(),
  propertyId: z.string().optional(),
  message: z.string().optional(), // opening staff note
});

export const updateTicketBodySchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  category: ticketCategorySchema.optional(),
  priority: ticketPrioritySchema.optional(),
  status: ticketStatusSchema.optional(),
  description: z.string().max(5000).optional(),
});

export const assignTicketBodySchema = z.object({
  assigneeId: z.string().nullable(),
});

export const addCommentBodySchema = z.object({
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
});

export const guestCreateTicketBodySchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(1).max(5000),
  category: ticketCategorySchema.default('general'),
  priority: ticketPrioritySchema.default('medium'),
});

export const guestReplyBodySchema = z.object({
  message: z.string().min(1).max(5000),
});

export const rateTicketBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

registry.register('Ticket', ticketSchema);
registry.register('TicketMessage', ticketMessageSchema);
registry.register('TicketListQuery', listTicketsQuerySchema);
registry.register('CreateTicketRequest', createTicketBodySchema);
registry.register('UpdateTicketRequest', updateTicketBodySchema);
registry.register('AddTicketCommentRequest', addCommentBodySchema);
