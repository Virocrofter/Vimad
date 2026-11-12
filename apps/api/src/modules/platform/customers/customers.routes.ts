import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../../common/errors.js';
import { requirePlatformRole, requireStepUp } from '../platform.middleware.js';
import * as svc from './customers.service.js';

export const customersRouter = Router();
const OPS = ['platform_super_admin', 'platform_support'] as const;

function parseBody(schema: any, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new AppError(
      400,
      result.error.issues[0]?.message ?? 'Validation failed',
      'VALIDATION_ERROR'
    );
  return result.data;
}

const suspendSchema = z.object({ reason: z.string().min(3), confirmImpact: z.literal(true) });
const planSchema = z.object({ plan: z.string().min(2), reason: z.string().min(3) });
const listQuery = z.object({
  status: z.string().optional(),
  plan: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

customersRouter.get(
  '/tenants',
  requirePlatformRole(...OPS, 'platform_finance', 'platform_read_only'),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.listTenants(parseBody(listQuery, req.query ?? {})) });
    } catch (e) {
      next(e);
    }
  }
);
customersRouter.get('/tenants/search', requirePlatformRole(...OPS), async (req, res, next) => {
  try {
    res.json({ data: await svc.globalSearch(String((req.query ?? {}).q ?? '')) });
  } catch (e) {
    next(e);
  }
});
customersRouter.get(
  '/tenants/:id',
  requirePlatformRole(...OPS, 'platform_finance', 'platform_read_only'),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.tenantDetail(req.params.id) });
    } catch (e) {
      next(e);
    }
  }
);
customersRouter.get(
  '/tenants/:id/timeline',
  requirePlatformRole(...OPS),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.tenantTimeline(req.params.id) });
    } catch (e) {
      next(e);
    }
  }
);
customersRouter.post(
  '/tenants/:id/suspend',
  requirePlatformRole(...OPS),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(suspendSchema, req.body ?? {});
      res.json({ data: await svc.suspendTenant(req.params.id, b.reason, req.platform!.email) });
    } catch (e) {
      next(e);
    }
  }
);
customersRouter.post(
  '/tenants/:id/reactivate',
  requirePlatformRole(...OPS),
  requireStepUp,
  async (req, res, next) => {
    try {
      res.json({ data: await svc.reactivateTenant(req.params.id, req.platform!.email) });
    } catch (e) {
      next(e);
    }
  }
);
customersRouter.put(
  '/tenants/:id/plan',
  requirePlatformRole(...OPS, 'platform_finance'),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(planSchema, req.body ?? {});
      res.json({
        data: await svc.setTenantPlan(req.params.id, b.plan, b.reason, req.platform!.email),
      });
    } catch (e) {
      next(e);
    }
  }
);
