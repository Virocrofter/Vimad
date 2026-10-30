/* apps/api/src/modules/guest-portal/guest-comms.routes.ts
 * [G5] Guest communication — portal-token auth, reservation-bound.
 *   GET  /chat/:token/thread          → thread (auto-created) + last 50 messages
 *   POST /chat/:token/messages        → guest message (clientId dedupe → optimistic UI)
 *   POST /chat/:token/thread/close
 *   GET  /announcements/:token        → published feed for this property
 *   GET  /reviews/:token/mine         → my review + status
 *   POST /reviews/:token              → post-stay review (checked_out), one per stay
 *
 * Chat round-trip: REST + polling (<2s with 1.5s client interval). Threads are
 * persisted, so swapping to sockets later doesn't change the data model.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { env } from '../../common/env.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { resolveToken } from './guest-portal.service.js';
import { emitToTenant } from '../../common/socket.js';

export const guestCommsRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ data });

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

// ─── Post-stay resolver: same as resolveToken, but checked_out stays get access ───

const PORTAL_TOKEN_SCOPE = 'guest-portal';

async function resolveTokenPostStay(token: string) {
  let payload: { scope?: string; reservationId?: string; tenantId?: string };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as {
      scope?: string;
      reservationId?: string;
      tenantId?: string;
    };
  } catch {
    throw new AppError(401, 'Invalid or expired portal token', 'PORTAL_TOKEN_INVALID');
  }
  if (payload.scope !== PORTAL_TOKEN_SCOPE) {
    throw new AppError(401, 'Invalid portal token scope', 'PORTAL_TOKEN_INVALID');
  }
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: payload.reservationId,
      tenantId: payload.tenantId,
      status: { notIn: ['cancelled', 'no_show'] },
    },
    include: {
      guest: true,
      property: { select: { id: true, name: true } },
    },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  return reservation;
}

async function getOrCreateThread(reservation: {
  id: string;
  tenantId: string;
  propertyId: string;
  guestId: string;
}) {
  let thread = await prisma.chatThread.findFirst({ where: { reservationId: reservation.id } });
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: {
        tenantId: reservation.tenantId,
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        guestId: reservation.guestId,
      },
    });
  }
  return thread;
}

const messageSelect = {
  id: true,
  authorType: true,
  authorName: true,
  body: true,
  clientId: true,
  readAt: true,
  createdAt: true,
} as const;

// ─── Chat ───

guestCommsRouter.get(
  '/chat/:token/thread',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const thread = await getOrCreateThread(reservation);

    const messages = await prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: messageSelect,
    });

    if (thread.unreadForGuest > 0) {
      await prisma.chatThread.update({
        where: { id: thread.id },
        data: { unreadForGuest: 0 },
      });
    }

    return ok(res, {
      thread: { id: thread.id, status: thread.status, lastMessageAt: thread.lastMessageAt },
      messages,
    });
  })
);

const guestMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  clientId: z.string().min(8).max(64),
});

guestCommsRouter.post(
  '/chat/:token/messages',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = guestMessageSchema.parse(req.body ?? {});
    const thread = await getOrCreateThread(reservation);

    if (thread.status === 'closed') {
      throw new AppError(
        409,
        'This conversation is closed — open a support ticket instead',
        'THREAD_CLOSED'
      );
    }

    // Optimistic-send dedupe: same clientId returns the original message.
    const dup = await prisma.chatMessage.findFirst({
      where: { threadId: thread.id, clientId: input.clientId },
    });
    if (dup) return ok(res, { message: dup, idempotentReplay: true });

    const guestName = `${reservation.guest.firstName} ${reservation.guest.lastName}`;
    const message = await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        authorType: 'guest',
        authorId: reservation.guestId,
        authorName: guestName,
        body: input.body,
        clientId: input.clientId,
      },
    });

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: message.createdAt, unreadForStaff: { increment: 1 } },
    });

    // Notify front-office leads (notification centre; push module picks these up).
    const staff = await prisma.user.findMany({
      where: {
        tenantId: reservation.tenantId,
        status: 'active',
        role: { in: ['owner', 'admin', 'manager'] },
      },
      select: { id: true },
      take: 10,
    });
    for (const u of staff) {
      await prisma.notification
        .create({
          data: {
            tenantId: reservation.tenantId,
            userId: u.id,
            type: 'chat_message',
            category: 'chat',
            title: `Guest message — ${guestName}`,
            message: input.body.slice(0, 140),
            entityType: 'chat_thread',
            entityId: thread.id,
          },
        })
        .catch(() => {});
    }

    emitToTenant(reservation.tenantId, 'chat:guest_message', {
      threadId: thread.id,
      reservationId: reservation.id,
      message,
    });

    return ok(res, { message, idempotentReplay: false });
  })
);

guestCommsRouter.post(
  '/chat/:token/thread/close',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const thread = await getOrCreateThread(reservation);
    const updated = await prisma.chatThread.update({
      where: { id: thread.id },
      data: { status: 'closed' },
    });
    return ok(res, { id: updated.id, status: updated.status });
  })
);

// ─── POST /telemetry/:token — guest analytics event (metered, fire-and-forget) ───

const telemetrySchema = z.object({
  event: z.string().min(1).max(60),
  meta: z.record(z.unknown()).optional(),
});

guestCommsRouter.post(
  '/telemetry/:token',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = telemetrySchema.parse(req.body ?? {});

    await prisma.usageRecord
      .create({
        data: {
          tenantId: reservation.tenantId,
          metric: 'guest_portal_event',
          metadata: {
            event: input.event,
            reservationId: reservation.id,
            meta: JSON.parse(JSON.stringify(input.meta ?? {})),
          },
        },
      })
      .catch(() => {});

    return ok(res, { ok: true });
  })
);

// ─── Announcements feed ───

guestCommsRouter.get(
  '/announcements/:token',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const announcements = await prisma.announcement.findMany({
      where: {
        tenantId: reservation.tenantId,
        status: 'published',
        publishAt: { lte: new Date() },
        OR: [{ propertyId: null }, { propertyId: reservation.propertyId }],
      },
      orderBy: { publishAt: 'desc' },
      take: 20,
      select: { id: true, title: true, body: true, publishAt: true },
    });

    return ok(res, { token: String(req.params.token), announcements });
  })
);

// ─── Reviews (post-stay) ───

guestCommsRouter.get(
  '/reviews/:token/mine',
  asyncRoute(async (req, res) => {
    const reservation = await resolveTokenPostStay(String(req.params.token));

    const review = await prisma.review.findUnique({ where: { reservationId: reservation.id } });

    return ok(res, { token: String(req.params.token), review });
  })
);

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
});

guestCommsRouter.post(
  '/reviews/:token',
  asyncRoute(async (req, res) => {
    const reservation = await resolveTokenPostStay(String(req.params.token));
    const input = reviewSchema.parse(req.body ?? {});

    if (reservation.status !== 'checked_out') {
      throw new AppError(409, 'Reviews open after check-out', 'REVIEW_NOT_READY');
    }

    const existing = await prisma.review.findUnique({ where: { reservationId: reservation.id } });
    if (existing && existing.status !== 'rejected') {
      return ok(res, { review: existing, idempotentReplay: true });
    }

    const guestName = `${reservation.guest.firstName} ${reservation.guest.lastName}`;
    const review = await prisma.review.upsert({
      where: { reservationId: reservation.id },
      update: {
        rating: input.rating,
        title: input.title ?? null,
        body: input.body,
        status: 'pending',
        moderatedAt: null,
        moderatedById: null,
        moderationNote: null,
      },
      create: {
        tenantId: reservation.tenantId,
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        guestId: reservation.guestId,
        guestName,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body,
        status: 'pending',
      },
    });

    logger.info({ reviewId: review.id, rating: input.rating }, 'guest review submitted');

    return ok(res, { review, idempotentReplay: false });
  })
);

// ─── Errors ───

guestCommsRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const e = err as { statusCode?: number; status?: number; code?: string; message?: string };
  if (err instanceof AppError || e.statusCode || e.status) {
    return res
      .status(e.statusCode ?? e.status ?? 500)
      .json({ error: { code: e.code ?? 'ERROR', message: e.message ?? 'Request failed' } });
  }
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.issues[0]?.message ?? 'Invalid input' },
    });
  }
  logger.warn({ err }, 'guest-comms unexpected error');
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
});
