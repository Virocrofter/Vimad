/* apps/api/src/modules/tomsa/tomsa.routes.ts — SA-1 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { getConfig, setConfig, postDay, summary } from './tomsa.service.js';

export const tomsaRouter = Router();
tomsaRouter.use(authMiddleware);

const configSchema = z.object({ enabled: z.boolean(), pct: z.number().min(0).max(10) });
const postSchema = z.object({
  propertyId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ctx = (req: Request) => (req as AuthenticatedRequest).auth;

tomsaRouter.get(
  '/config',
  requirePermission('property', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await getConfig(ctx(req).tenantId, req.query.propertyId as string) });
    } catch (err) {
      next(err);
    }
  }
);

tomsaRouter.put(
  '/config',
  requirePermission('property', 'update'),
  validateBody(configSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.validatedBody as z.infer<typeof configSchema>;
      res.json({
        data: await setConfig(
          ctx(req).tenantId,
          req.query.propertyId as string,
          body.enabled,
          body.pct
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

tomsaRouter.post(
  '/post-day',
  requirePermission('folio', 'update'),
  validateBody(postSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.validatedBody as z.infer<typeof postSchema>;
      res.json({ data: await postDay(ctx(req).tenantId, body.propertyId, body.date) });
    } catch (err) {
      next(err);
    }
  }
);

tomsaRouter.get(
  '/summary',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await summary(
          ctx(req).tenantId,
          req.query.propertyId as string,
          req.query.from as string,
          req.query.to as string
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);
