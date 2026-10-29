/* apps/api/src/modules/public/public.routes.ts
 * A4 — public booking engine routes. Unauthenticated (guests have no login),
 * validated with zod, rate-limited at the mount point (publicLimiter in index.ts).
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  availabilityQuerySchema,
  publicBookingSchema,
  publicCancellationSchema,
  getPublicProperty,
  getAvailability,
  createPublicBooking,
  cancelPublicBooking,
  unsubscribeQuerySchema,
  unsubscribeByToken,
} from './public.service.js';
import { validateBody, validateQuery } from '../../common/validate.js';

export const publicRouter = Router();

/* GET /properties/:code — header info for the booking page */
publicRouter.get('/properties/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await getPublicProperty(req.params.code) });
  } catch (err) {
    next(err);
  }
});

/* GET /properties/:code/availability?checkIn&checkOut&adults&children */
publicRouter.get(
  '/properties/:code/availability',
  validateQuery(availabilityQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getAvailability(req.params.code, req.validatedQuery as any);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* POST /properties/:code/bookings — the booking itself */
publicRouter.post(
  '/properties/:code/bookings',
  validateBody(publicBookingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createPublicBooking(req.params.code, req.validatedBody as any);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* POST /cancellations — public cancel by confirmation number + email */
publicRouter.post(
  '/cancellations',
  validateBody(publicCancellationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await cancelPublicBooking(req.validatedBody as any);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* GET /marketing/unsubscribe?token= — one-click unsubscribe, no login (E5) */
publicRouter.get(
  '/marketing/unsubscribe',
  validateQuery(unsubscribeQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await unsubscribeByToken((req.validatedQuery as { token: string }).token);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
