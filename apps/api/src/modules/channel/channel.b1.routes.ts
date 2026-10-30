/* B1 routes: public HMAC-signed webhook + staff push endpoints */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { AppError } from '../../common/errors.js';
import { verifySignature, intakeBooking, pushNow, pushLog } from './channel.b1.service.js';
import { prisma } from '../../common/prisma.js';

export const channelWebhookRouter = Router();

const bookingPushSchema = z.object({
  hotelId: z.string().min(1),
  externalReference: z.string().min(3),
  guest: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().optional(),
  }),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roomTypeCode: z.string().min(1),
  totalAmount: z.string().or(z.number()),
  adults: z.string().or(z.number()).optional(),
  children: z.string().or(z.number()).optional(),
});

channelWebhookRouter.post(
  '/webhooks/:provider',
  validateBody(bookingPushSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = req.params.provider;
      const b = req.body as Record<string, unknown>;
      const connection = await prisma.channelConnection.findFirst({
        where: { provider, hotelId: String((b as any).hotelId) },
      });
      if (!connection?.apiSecret) throw new AppError(404, 'Unknown hotel/channel', 'NOT_FOUND');
      const sig = String(req.headers['x-channel-signature'] ?? '');
      if (!verifySignature(connection.apiSecret, req.body, sig)) {
        res
          .status(401)
          .json({ error: { code: 'BAD_SIGNATURE', message: 'Invalid webhook signature' } });
        return;
      }
      res.json({ data: await intakeBooking(provider, req.body as Record<string, unknown>) });
    } catch (err) {
      next(err);
    }
  }
);

export const channelPushRouter = Router();

const ctx = (req: Request) => (req as AuthenticatedRequest).auth;

channelPushRouter.post(
  '/connections/:id/push-now',
  authMiddleware,
  requirePermission('channel', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await pushNow(ctx(req).tenantId, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);

channelPushRouter.get(
  '/connections/:id/push-log',
  authMiddleware,
  requirePermission('channel', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await pushLog(ctx(req).tenantId, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);
