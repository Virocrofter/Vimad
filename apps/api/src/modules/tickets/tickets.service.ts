/* apps/api/src/modules/tickets/tickets.service.ts */
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { AppError } from '../../common/errors.js';
import { sendEmail } from '../../jobs/email.queue.js';
import { skipTake, type PaginationInput } from '../../common/pagination.js';
import type {
  createTicketBodySchema,
  updateTicketBodySchema,
  listTicketsQuerySchema,
} from './tickets.schemas.js';
import type { z } from 'zod';

// ─── SLA policy (minutes) — response = first staff touch, resolve = fix ───
export const SLA_MINUTES: Record<string, { response: number; resolve: number }> = {
  urgent: { response: 15, resolve: 120 },
  high: { response: 60, resolve: 480 },
  medium: { response: 240, resolve: 1440 },
  low: { response: 480, resolve: 4320 },
};

export const TICKET_INCLUDE = {
  assignee: { select: { id: true, firstName: true, lastName: true } },
  guest: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

function guestName(g: { firstName: string; lastName: string } | null): string | null {
  return g ? `${g.firstName} ${g.lastName}`.trim() : null;
}

async function nextTicketNumber(tenantId: string): Promise<string> {
  const counter = await prisma.ticketCounter.upsert({
    where: { tenantId },
    update: { lastNumber: { increment: 1 } },
    create: { tenantId, lastNumber: 1 },
  });
  return `TKT-${new Date().getFullYear()}-${String(counter.lastNumber).padStart(4, '0')}`;
}

function slaDue(priority: string): { responseDue: Date; resolveDue: Date } {
  const sla = SLA_MINUTES[priority] ?? SLA_MINUTES.medium;
  const now = Date.now();
  return {
    responseDue: new Date(now + sla.response * 60_000),
    resolveDue: new Date(now + sla.resolve * 60_000),
  };
}

async function audit(req: any, action: string, ticketId: string, metadata?: object) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: req.auth?.tenantId,
        userId: req.auth?.userId ?? null,
        action,
        entity: 'ticket',
        entityId: ticketId,
        metadata: metadata as object,
        ipAddress: req.ip,
        userAgent: req.get?.('user-agent'),
      },
    });
  } catch (err) {
    logger.warn({ err }, 'ticket audit write failed');
  }
}

async function notifyManagers(tenantId: string, title: string, message: string, ticketId: string) {
  const managers = await prisma.user.findMany({
    where: { tenantId, status: 'active', role: { in: ['owner', 'admin', 'manager'] } },
    select: { id: true },
    take: 10,
  });
  if (managers.length === 0) return;
  await prisma.notification.createMany({
    data: managers.map((u) => ({
      tenantId,
      userId: u.id,
      type: 'ticket',
      category: 'support',
      title,
      message,
      actionUrl: `/app/support?ticket=${ticketId}`,
      entityType: 'ticket',
      entityId: ticketId,
    })),
  });
}

// ─── Staff: list ───
export async function listTickets(tenantId: string, query: z.infer<typeof listTicketsQuerySchema>) {
  const { page, pageSize } = query as PaginationInput;
  const where: any = { tenantId };
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.category) where.category = query.category;
  if (query.assigneeId) where.assigneeId = query.assigneeId;
  if (query.guestId) where.guestId = query.guestId;
  if (query.q) {
    where.OR = [
      { subject: { contains: query.q, mode: 'insensitive' } },
      { number: { contains: query.q, mode: 'insensitive' } },
      { guest: { firstName: { contains: query.q, mode: 'insensitive' } } },
      { guest: { lastName: { contains: query.q, mode: 'insensitive' } } },
    ];
  }
  if (query.sla === 'breached') where.slaBreached = true;
  if (query.sla === 'due_soon') {
    where.slaBreached = false;
    where.OR = [
      { slaResponseDueAt: { lte: new Date(Date.now() + 60 * 60_000), gte: new Date() } },
      { slaResolveDueAt: { lte: new Date(Date.now() + 60 * 60_000), gte: new Date() } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      include: TICKET_INCLUDE,
      orderBy: [{ slaBreached: 'desc' }, { priority: 'desc' }, { lastMessageAt: 'desc' }],
      ...skipTake({ page, pageSize } as PaginationInput),
    }),
  ]);

  const withLast = await Promise.all(
    rows.map(async (t) => {
      const last = await prisma.ticketMessage.findFirst({
        where: { ticketId: t.id, isInternal: false },
        orderBy: { createdAt: 'desc' },
        select: { body: true },
      });
      return {
        ...t,
        guestName: guestName(t.guest),
        assigneeName: t.assignee
          ? `${t.assignee.firstName ?? ''} ${t.assignee.lastName ?? ''}`.trim()
          : null,
        lastMessage: last?.body.slice(0, 140) ?? null,
      };
    })
  );

  return {
    data: withLast,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

// ─── Staff: stats ───
export async function getStats(tenantId: string) {
  const [byStatus, unassigned, breached, rated] = await Promise.all([
    prisma.ticket.groupBy({ by: ['status'], where: { tenantId }, _count: { _all: true } }),
    prisma.ticket.count({
      where: { tenantId, assigneeId: null, status: { in: ['open', 'in_progress'] } },
    }),
    prisma.ticket.count({
      where: {
        tenantId,
        slaBreached: true,
        status: { in: ['open', 'in_progress', 'waiting_guest'] },
      },
    }),
    prisma.ticket.aggregate({
      where: { tenantId, satisfactionRating: { not: null } },
      _avg: { satisfactionRating: true },
      _count: { _all: true },
    }),
  ]);
  const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  const avgRating = rated._avg.satisfactionRating
    ? Math.round(rated._avg.satisfactionRating * 10) / 10
    : null;
  return {
    total: byStatus.reduce((a, s) => a + s._count._all, 0),
    open: counts.open ?? 0,
    inProgress: counts.in_progress ?? 0,
    waitingGuest: counts.waiting_guest ?? 0,
    resolved: counts.resolved ?? 0,
    closed: counts.closed ?? 0,
    unassigned,
    slaBreached: breached,
    avgSatisfaction: avgRating,
    satisfactionCount: rated._count._all,
  };
}

// ─── Staff: get one (with full thread) ───
export async function getTicket(tenantId: string, id: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id, tenantId },
    include: {
      ...TICKET_INCLUDE,
      messages: { orderBy: { createdAt: 'asc' } },
      property: { select: { id: true, name: true } },
      reservation: {
        select: { id: true, confirmationNumber: true, roomType: { select: { name: true } } },
      },
    },
  });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
  return {
    ...ticket,
    guestName: guestName(ticket.guest),
    assigneeName: ticket.assignee
      ? `${ticket.assignee.firstName ?? ''} ${ticket.assignee.lastName ?? ''}`.trim()
      : null,
  };
}

// ─── Staff: create on behalf ───
export async function createTicket(
  tenantId: string,
  userId: string,
  body: z.infer<typeof createTicketBodySchema>,
  req: any
) {
  const { responseDue, resolveDue } = slaDue(body.priority);
  const number = await nextTicketNumber(tenantId);

  const ticket = await prisma.ticket.create({
    data: {
      tenantId,
      number,
      source: 'staff',
      subject: body.subject,
      description: body.description,
      category: body.category,
      priority: body.priority,
      guestId: body.guestId ?? null,
      reservationId: body.reservationId ?? null,
      propertyId: body.propertyId ?? null,
      createdById: userId,
      slaResponseDueAt: responseDue,
      slaResolveDueAt: resolveDue,
      messages: {
        create: [
          {
            authorType: 'staff',
            authorId: userId,
            authorName: 'Front Desk',
            body: body.description,
          },
          ...(body.message
            ? [
                {
                  authorType: 'staff' as const,
                  authorId: userId,
                  authorName: 'Front Desk',
                  body: body.message,
                  isInternal: true,
                },
              ]
            : []),
        ],
      },
    },
    include: TICKET_INCLUDE,
  });

  await audit(req, 'ticket.create', ticket.id, { number, subject: body.subject });
  logger.info({ ticketId: ticket.id, number }, 'staff ticket created');
  return ticket;
}

// ─── Staff: update fields / status ───
export async function updateTicket(
  tenantId: string,
  id: string,
  body: z.infer<typeof updateTicketBodySchema>,
  req: any
) {
  const existing = await prisma.ticket.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND');

  const now = new Date();
  const data: any = { ...body };
  if (body.priority && body.priority !== existing.priority) {
    const { responseDue, resolveDue } = slaDue(body.priority);
    data.slaResponseDueAt = existing.firstResponseAt ? existing.slaResponseDueAt : responseDue;
    data.slaResolveDueAt = resolveDue;
  }
  if (body.status) {
    if (body.status === 'resolved' && existing.status !== 'resolved') data.resolvedAt = now;
    if (body.status === 'closed' && existing.status !== 'closed') data.closedAt = now;
    if (['open', 'in_progress', 'waiting_guest'].includes(body.status)) {
      data.resolvedAt = null;
      data.closedAt = null;
    }
  }

  const ticket = await prisma.ticket.update({ where: { id }, data, include: TICKET_INCLUDE });
  await audit(req, 'ticket.update', id, body);
  return ticket;
}

// ─── Staff: assign ───
export async function assignTicket(
  tenantId: string,
  id: string,
  assigneeId: string | null,
  req: any
) {
  const existing = await prisma.ticket.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND');

  if (assigneeId) {
    const user = await prisma.user.findFirst({
      where: { id: assigneeId, tenantId, status: 'active' },
    });
    if (!user)
      throw new AppError(400, 'Assignee must be an active user of this tenant', 'INVALID_ASSIGNEE');
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: { assigneeId, status: existing.status === 'open' ? 'in_progress' : existing.status },
    include: TICKET_INCLUDE,
  });

  if (assigneeId) {
    const name = `${ticket.assignee?.firstName ?? ''} ${ticket.assignee?.lastName ?? ''}`.trim();
    await prisma.notification.create({
      data: {
        tenantId,
        userId: assigneeId,
        type: 'ticket',
        category: 'support',
        title: `Ticket ${ticket.number} assigned to you`,
        message: ticket.subject,
        actionUrl: `/app/support?ticket=${ticket.id}`,
        entityType: 'ticket',
        entityId: ticket.id,
      },
    });
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (assignee?.email) {
      await sendEmail({
        to: assignee.email,
        subject: `[Vimad] Ticket ${ticket.number} assigned to you`,
        template: 'generic',
        payload: { message: `${ticket.subject}\n\nOpen: /app/support?ticket=${ticket.id}` },
      });
    }
    void name;
  }

  await audit(req, 'ticket.assign', id, { assigneeId });
  return ticket;
}

// ─── Staff: reply / internal note ───
export async function addComment(
  tenantId: string,
  id: string,
  userId: string,
  userName: string,
  message: string,
  isInternal: boolean,
  req: any
) {
  const ticket = await prisma.ticket.findFirst({ where: { id, tenantId } });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
  if (ticket.status === 'closed')
    throw new AppError(409, 'Ticket is closed — reopen it first', 'TICKET_CLOSED');

  const now = new Date();
  const [, updated] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorType: 'staff',
        authorId: userId,
        authorName: userName,
        body: message,
        isInternal,
      },
    }),
    prisma.ticket.update({
      where: { id },
      data: {
        lastMessageAt: now,
        ...(isInternal
          ? {}
          : {
              firstResponseAt: ticket.firstResponseAt ?? now,
              status: ticket.status === 'open' ? 'in_progress' : ticket.status,
            }),
      },
    }),
  ]);

  // Notify the guest by email on any public staff reply
  if (!isInternal && ticket.guestId) {
    const guest = await prisma.guest.findUnique({ where: { id: ticket.guestId } });
    if (guest?.email) {
      await sendEmail({
        to: guest.email,
        subject: `Re: ${ticket.subject} (${ticket.number})`,
        template: 'generic',
        payload: { message: `${userName} replied to your request:\n\n${message}` },
      });
    }
  }

  await audit(req, 'ticket.comment', id, { isInternal });
  return updated;
}

// ─── Staff: close ───
export async function closeTicket(tenantId: string, id: string, req: any) {
  const ticket = await prisma.ticket
    .update({
      where: { id },
      data: { status: 'closed', closedAt: new Date() },
      include: TICKET_INCLUDE,
    })
    .catch(() => null);
  if (!ticket || ticket.tenantId !== tenantId)
    throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
  await audit(req, 'ticket.close', id);
  return ticket;
}

// ─── Guest portal ───
export async function listGuestTickets(tenantId: string, guestId: string) {
  const tickets = await prisma.ticket.findMany({
    where: { tenantId, guestId },
    include: TICKET_INCLUDE,
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  });
  return Promise.all(
    tickets.map(async (t) => {
      const last = await prisma.ticketMessage.findFirst({
        where: { ticketId: t.id, isInternal: false },
        orderBy: { createdAt: 'desc' },
        select: { body: true },
      });
      return { ...t, lastMessage: last?.body.slice(0, 140) ?? null };
    })
  );
}

export async function createGuestTicket(
  tenantId: string,
  guestId: string,
  reservationId: string | null,
  body: { subject: string; message: string; category: string; priority: string }
) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'GUEST_NOT_FOUND');

  const { responseDue, resolveDue } = slaDue(body.priority);
  const number = await nextTicketNumber(tenantId);
  const name = guestName(guest) ?? guest.email ?? 'Guest';

  const ticket = await prisma.ticket.create({
    data: {
      tenantId,
      number,
      source: 'guest_portal',
      subject: body.subject,
      description: body.message,
      category: body.category,
      priority: body.priority,
      guestId,
      reservationId,
      propertyId: null,
      slaResponseDueAt: responseDue,
      slaResolveDueAt: resolveDue,
      messages: {
        create: [{ authorType: 'guest', authorId: guestId, authorName: name, body: body.message }],
      },
    },
  });

  await notifyManagers(
    tenantId,
    `New support ticket ${number}`,
    `${name}: ${body.subject}`,
    ticket.id
  );
  logger.info({ ticketId: ticket.id, number, guestId }, 'guest ticket created');
  return ticket;
}

export async function getGuestTicket(tenantId: string, guestId: string, id: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id, tenantId, guestId },
    include: { messages: { where: { isInternal: false }, orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
  return ticket;
}

export async function guestReply(tenantId: string, guestId: string, id: string, message: string) {
  const ticket = await prisma.ticket.findFirst({ where: { id, tenantId, guestId } });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
  if (ticket.status === 'closed') throw new AppError(409, 'This ticket is closed', 'TICKET_CLOSED');

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  const name = guestName(guest) ?? 'Guest';

  await prisma.$transaction([
    prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorType: 'guest',
        authorId: guestId,
        authorName: name,
        body: message,
      },
    }),
    prisma.ticket.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        status: ticket.status === 'waiting_guest' ? 'in_progress' : ticket.status,
      },
    }),
  ]);

  if (ticket.assigneeId) {
    await prisma.notification.create({
      data: {
        tenantId,
        userId: ticket.assigneeId,
        type: 'ticket',
        category: 'support',
        title: `Guest replied — ${ticket.number}`,
        message: message.slice(0, 120),
        actionUrl: `/app/support?ticket=${ticket.id}`,
        entityType: 'ticket',
        entityId: ticket.id,
      },
    });
  }
  return { ok: true };
}

export async function rateGuestTicket(
  tenantId: string,
  guestId: string,
  id: string,
  rating: number,
  comment?: string
) {
  const ticket = await prisma.ticket.findFirst({ where: { id, tenantId, guestId } });
  if (!ticket) throw new AppError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
  if (!['resolved', 'closed'].includes(ticket.status)) {
    throw new AppError(409, 'You can rate a ticket after it is resolved', 'TICKET_NOT_RESOLVED');
  }
  return prisma.ticket.update({
    where: { id },
    data: { satisfactionRating: rating, satisfactionComment: comment ?? null },
  });
}
