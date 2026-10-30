/* staff-facing review queue */
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateParams } from '../../common/validate.js';
import { reviewList, approveSession } from './checkin.service.js';

export const checkinReviewRouter = Router();
checkinReviewRouter.use(authMiddleware);

const IdParam = z.object({ id: z.string() });
const ctx = (req: Request) => (req as AuthenticatedRequest).auth;

checkinReviewRouter.get(
  '/sessions',
  requirePermission('reservation', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await reviewList(
          ctx(req).tenantId,
          req.query.propertyId as string,
          req.query.status as string
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

checkinReviewRouter.post(
  '/sessions/:id/approve',
  validateParams(IdParam),
  requirePermission('reservation', 'checkin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await approveSession(
          ctx(req).tenantId,
          ctx(req).user.id,
          (req.validatedParams as any).id
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);
