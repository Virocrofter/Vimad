/* apps/api/src/modules/guest-portal/guest-booking.routes.ts — G1a
 * Guest-facing booking management: view, modify (dates/guests), cancel
 * with a live policy quote. Portal-token auth (same JWT convention as
 * the rest of the guest portal). Mounted BEFORE the main portal router.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../../common/validate.js';
import {
  modifyBookingSchema,
  cancelBookingSchema,
  modifyBooking,
  cancelBooking,
  getCancelQuote,
} from './guest-portal.service.js';

export const guestBookingRouter = Router();

const ModifyInputSchema = modifyBookingSchema;
const CancelInputSchema = cancelBookingSchema;

const CancelQuoteParamsSchema = z.object({ token: z.string() });

guestBookingRouter.get(
  '/cancel-quote/:token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = CancelQuoteParamsSchema.parse(req.params);
      const data = await getCancelQuote(token);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

guestBookingRouter.post(
  '/modify',
  validateBody(ModifyInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await modifyBooking(req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

guestBookingRouter.post(
  '/cancel',
  validateBody(CancelInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await cancelBooking(req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);
