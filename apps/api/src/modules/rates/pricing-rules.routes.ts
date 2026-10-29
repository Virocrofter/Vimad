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
  createDerivedPlan,
  bulkUpdate,
  createVoucher,
  listVouchers,
  getQuote,
  listSuggestions,
  applySuggestion,
  dismissSuggestion,
} from './pricing-rules.service.js';

export const pricingRulesRouter = Router();
pricingRulesRouter.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['occupancy', 'date_range', 'restriction']),
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

pricingRulesRouter.post(
  '/derived-plans',
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res
        .status(201)
        .json({
          data: await createDerivedPlan(
            ctx(req).tenantId,
            req.query.propertyId as string,
            req.body as Record<string, unknown>
          ),
        });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.post(
  '/bulk-update',
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await bulkUpdate(
          ctx(req).tenantId,
          req.query.propertyId as string,
          ctx(req).user.id,
          req.body as Record<string, unknown>
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.post(
  '/vouchers',
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res
        .status(201)
        .json({
          data: await createVoucher(
            ctx(req).tenantId,
            req.query.propertyId as string,
            req.body as Record<string, unknown>
          ),
        });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.get(
  '/vouchers',
  requirePermission('rate_plan', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await listVouchers(ctx(req).tenantId, req.query.propertyId as string) });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.get(
  '/quote',
  requirePermission('rate_plan', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await getQuote(
          ctx(req).tenantId,
          req.query.propertyId as string,
          req.query.roomTypeId as string,
          req.query.from as string,
          req.query.to as string,
          req.query.ratePlanId as string
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.get(
  '/restrictions-review',
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

pricingRulesRouter.post(
  '/restrictions-review/:id/apply',
  requirePermission('inventory', 'adjust'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await applySuggestion(ctx(req).tenantId, ctx(req).user.id, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.post(
  '/restrictions-review/:id/dismiss',
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await dismissSuggestion(ctx(req).tenantId, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);

pricingRulesRouter.put(
  '/plans/:id/commission',
  requirePermission('rate_plan', 'update'),
  validateBody(z.object({ commissionPct: z.number().min(0).max(50) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../../common/prisma.js');
      const auth = (req as AuthenticatedRequest).auth;
      const body = req.validatedBody as { commissionPct: number };
      const plan = await prisma.ratePlan.findFirst({
        where: { id: req.params.id, tenantId: auth.tenantId },
      });
      if (!plan) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rate plan not found' } });
        return;
      }
      await prisma.ratePlan.update({
        where: { id: plan.id },
        data: { commissionPct: body.commissionPct },
      });
      res.json({ data: { id: plan.id, commissionPct: body.commissionPct } });
    } catch (err) {
      next(err);
    }
  }
);

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
      res.status(201).json({
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
