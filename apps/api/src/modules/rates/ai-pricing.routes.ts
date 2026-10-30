import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateParams } from '../../common/validate.js';
import {
  generateSuggestions,
  listSuggestions,
  applySuggestion,
  dismissSuggestion,
} from './ai-pricing.service.js';

export const aiPricingRouter = Router();
aiPricingRouter.use(authMiddleware);

const ctx = (req: Request) => (req as AuthenticatedRequest).auth;
const IdParam = z.object({ id: z.string() });
const rangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

aiPricingRouter.post(
  '/suggestions/generate',
  validateBody(rangeSchema),
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const b = req.validatedBody as z.infer<typeof rangeSchema>;
      res.json({
        data: await generateSuggestions(
          ctx(req).tenantId,
          req.query.propertyId as string,
          b.from,
          b.to
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

aiPricingRouter.get(
  '/suggestions',
  requirePermission('rate_plan', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await listSuggestions(
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

aiPricingRouter.post(
  '/suggestions/:id/apply',
  validateParams(IdParam),
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await applySuggestion(
          ctx(req).tenantId,
          ctx(req).user.id,
          (req.validatedParams as any).id
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

aiPricingRouter.post(
  '/suggestions/:id/dismiss',
  validateParams(IdParam),
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await dismissSuggestion(ctx(req).tenantId, (req.validatedParams as any).id),
      });
    } catch (err) {
      next(err);
    }
  }
);
