/* apps/api/src/modules/tickets/tickets.guest.routes.ts
 * Guest Portal support endpoints. Token-scoped "guest-portal" JWT — the same
 * token the check-in / digital-key / service-request flow issues on /verify.
 * Mounted at /v1/guest-portal BEFORE the main guestPortalRouter.
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../../common/env.js';
import { AppError } from '../../common/errors.js';
import { validateBody, validateParams } from '../../common/validate.js';
import { z } from 'zod';
import {
  guestCreateTicketBodySchema,
  guestReplyBodySchema,
  rateTicketBodySchema,
} from './tickets.schemas.js';
import * as svc from './tickets.service.js';

export const ticketsGuestRouter = Router();

const IdParam = z.object({ id: z.string() });

function guestPortalAuth(req: Request, _res: Response, next: NextFunction) {
  const raw =
    (req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '') ||
    (req.headers['x-guest-token'] as string) ||
    ((req.body as any)?.token ?? '');
  if (!raw) return next(new AppError(401, 'Guest token required', 'UNAUTHORIZED'));
  try {
    const payload = jwt.verify(raw, env.JWT_SECRET) as any;
    if (payload?.scope !== 'guest-portal') throw new Error('bad scope');
    (req as any).guestAuth = {
      tenantId: payload.tenantId,
      guestId: payload.guestId,
      reservationId: payload.reservationId ?? null,
    };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired guest token', 'UNAUTHORIZED'));
  }
}

ticketsGuestRouter.use(guestPortalAuth);

const G = (req: any) =>
  (req as any).guestAuth as { tenantId: string; guestId: string; reservationId: string | null };

ticketsGuestRouter.get('/tickets', async (req, res, next) => {
  try {
    res.json({ data: await svc.listGuestTickets(G(req).tenantId, G(req).guestId) });
  } catch (e) {
    next(e);
  }
});

ticketsGuestRouter.post(
  '/tickets',
  validateBody(guestCreateTicketBodySchema),
  async (req, res, next) => {
    try {
      const g = G(req);
      const t = await svc.createGuestTicket(
        g.tenantId,
        g.guestId,
        g.reservationId,
        req.validatedBody as any
      );
      res.status(201).json({ data: t });
    } catch (e) {
      next(e);
    }
  }
);

ticketsGuestRouter.get('/tickets/:id', validateParams(IdParam), async (req, res, next) => {
  try {
    const g = G(req);
    res.json({
      data: await svc.getGuestTicket(g.tenantId, g.guestId, (req.validatedParams as any).id),
    });
  } catch (e) {
    next(e);
  }
});

ticketsGuestRouter.post(
  '/tickets/:id/messages',
  validateParams(IdParam),
  validateBody(guestReplyBodySchema),
  async (req, res, next) => {
    try {
      const g = G(req);
      res.json({
        data: await svc.guestReply(
          g.tenantId,
          g.guestId,
          (req.validatedParams as any).id,
          (req.validatedBody as any).message
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

ticketsGuestRouter.post(
  '/tickets/:id/rate',
  validateParams(IdParam),
  validateBody(rateTicketBodySchema),
  async (req, res, next) => {
    try {
      const g = G(req);
      const b = req.validatedBody as any;
      res.json({
        data: await svc.rateGuestTicket(
          g.tenantId,
          g.guestId,
          (req.validatedParams as any).id,
          b.rating,
          b.comment
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);
