/* apps/api/src/modules/concierge/concierge.guest.routes.ts — T3
 * Guest-portal-facing concierge endpoints. Mounted WITHOUT the staff
 * authMiddleware; identity comes from the scoped portal JWT.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { validateBody } from '../../common/validate.js';
import { AppError } from '../../common/errors.js';
import { env } from '../../common/env.js';
import { createGuestRequest, listGuestRequests } from './concierge.service.js';

export const conciergeGuestRouter = Router();

interface GuestAuthContext {
  tenantId: string;
  guestId: string;
}

function guestPortalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    next(new AppError(401, 'Missing or invalid authorization header', 'UNAUTHORIZED'));
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as Record<string, unknown>;
    if (payload?.scope !== 'guest-portal') {
      next(new AppError(401, 'Invalid token scope', 'UNAUTHORIZED'));
      return;
    }
    (req as unknown as { guestAuth: GuestAuthContext }).guestAuth = {
      tenantId: payload.tenantId as string,
      guestId: payload.guestId as string,
    };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
  }
}

const guestRequestSchema = z.object({
  type: z.enum(['wake_up_call', 'restaurant_booking', 'activity_booking', 'special_request']),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
});

conciergeGuestRouter.use(guestPortalAuth);

// ─── POST /v1/concierge/guest/request ───
conciergeGuestRouter.post(
  '/request',
  validateBody(guestRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, guestId } = (req as unknown as { guestAuth: GuestAuthContext }).guestAuth;
      const result = await createGuestRequest(
        tenantId,
        guestId,
        req.validatedBody as {
          type: string;
          title: string;
          description?: string;
          scheduledAt?: string;
        }
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /v1/concierge/guest/mine ───
conciergeGuestRouter.get('/mine', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId, guestId } = (req as unknown as { guestAuth: GuestAuthContext }).guestAuth;
    const items = await listGuestRequests(tenantId, guestId);
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});
