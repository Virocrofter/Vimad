/* apps/api/src/modules/rates/pricing-rules.routes.ts — C1' */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import {
  createRule,
  listRules,
  deleteRule,
  setRuleActive,
  evaluate,
  getEffectiveRates,
} from './pricing-rules.service.js';

export const pricingRulesRouter = Router();
pricingRulesRouter.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['occupancy', 'date_range']),
  conditions: z.record(z.string(), z.unknown()).default({}),
  adjustment: z.record(z.string(), z.unknown()).default({}),
  priority: z.number().int().min(0).max(1000).default(50),
  isActive: z.boolean().default(true),
});
const evaluateSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const toggleSchema = z.object({ isActive: z.boolean() });

const ctx = (req: Request) => (req as AuthenticatedRequest).auth;

pricingRulesRouter.get(
  '/plans',
  requirePermission('rate_plan', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../../common/prisma.js');
      const plans = await prisma.ratePlan.findMany({
        where: { propertyId: req.query.propertyId as string, status: 'active' },
        select: {
          id: true,
          name: true,
          code: true,
          baseRate: true,
          calculationMethod: true,
          calculationValue: true,
          roomTypeId: true,
        },
        orderBy: { code: 'asc' },
      });
      res.json({ data: plans });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.get(
  '/rules',
  requirePermission('rate_plan', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await listRules(ctx(req).tenantId, req.query.propertyId as string) });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.post(
  '/rules',
  requirePermission('rate_plan', 'update'),
  validateBody(createSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res
        .status(201)
        .json({
          data: await createRule(
            ctx(req).tenantId,
            req.query.propertyId as string,
            ctx(req).user.id,
            req.validatedBody as Record<string, unknown>
          ),
        });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.delete(
  '/rules/:id',
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await deleteRule(ctx(req).tenantId, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.post(
  '/rules/:id/toggle',
  requirePermission('rate_plan', 'update'),
  validateBody(toggleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await setRuleActive(
          ctx(req).tenantId,
          req.params.id,
          (req.validatedBody as z.infer<typeof toggleSchema>).isActive
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.post(
  '/rules/evaluate',
  requirePermission('rate_plan', 'update'),
  validateBody(evaluateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { from, to } = req.validatedBody as z.infer<typeof evaluateSchema>;
      res.json({
        data: await evaluate(ctx(req).tenantId, req.query.propertyId as string, from, to),
      });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.get(
  '/effective',
  requirePermission('rate_plan', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await getEffectiveRates(
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
