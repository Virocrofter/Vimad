/* apps/api/src/modules/minibar/minibar.routes.ts — T2 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  type AuthenticatedRequest,
  requirePermission,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { logMinibarConsumption, listMinibarChecks, settleMinibarCheck } from './minibar.service.js';

export const minibarRouter = Router();

minibarRouter.use(authMiddleware);
minibarRouter.use(requirePermission('minibar', 'log'));

const itemSchema = z.object({
  name: z.string().min(1).max(80),
  quantity: z.coerce.number().int().min(1).max(99),
  priceMinor: z.coerce.number().int().min(0).max(1_000_000),
});

const logSchema = z.object({
  roomId: z.string().min(1),
  items: z.array(itemSchema).min(1).max(30),
  photos: z.array(z.string().max(7_000_000)).max(4).default([]),
  note: z.string().max(500).optional(),
});

/* POST /v1/minibar — log consumption; folio charge auto-posts */
minibarRouter.post(
  '/',
  validateBody(logSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const result = await logMinibarConsumption(
        auth.tenantId,
        auth.user.id,
        req.validatedBody as z.infer<typeof logSchema>
      );
      res.status(201).json({
        data: result.check,
        posted: result.posted,
        reservation: result.reservation
          ? { id: result.reservation.id, confirmationNumber: result.reservation.confirmationNumber }
          : null,
      });
    } catch (err) {
      next(err);
    }
  }
);

/* GET /v1/minibar — list checks */
minibarRouter.get(
  '/',
  validateQuery(
    paginationSchema.extend({ roomId: z.string().optional(), status: z.string().optional() })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const q = req.validatedQuery as {
        roomId?: string;
        status?: string;
        page: number;
        pageSize: number;
      };
      res.json(await listMinibarChecks(auth.tenantId, q));
    } catch (err) {
      next(err);
    }
  }
);

/* POST /v1/minibar/:id/waive | /dispute */
minibarRouter.post(
  '/:id/waive',
  validateBody(z.object({ reason: z.string().min(1).max(500) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const { reason } = req.validatedBody as { reason: string };
      const check = await settleMinibarCheck(
        auth.tenantId,
        req.params.id,
        'waived',
        reason,
        auth.user.id
      );
      res.json({ data: check });
    } catch (err) {
      next(err);
    }
  }
);

minibarRouter.post(
  '/:id/dispute',
  validateBody(z.object({ reason: z.string().min(1).max(500) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const { reason } = req.validatedBody as { reason: string };
      const check = await settleMinibarCheck(
        auth.tenantId,
        req.params.id,
        'disputed',
        reason,
        auth.user.id
      );
      res.json({ data: check });
    } catch (err) {
      next(err);
    }
  }
);
