/* apps/api/src/modules/guest-portal/my-stays.routes.ts — 0.5 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { getMyStays } from './my-stays.service.js';

export const guestPortalMyStaysRouter = Router();

// GET /v1/guest-portal/my-stays/:token — guest-safe CRM 360 (stay history + loyalty)
guestPortalMyStaysRouter.get(
  '/my-stays/:token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await getMyStays(req.params.token);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);
