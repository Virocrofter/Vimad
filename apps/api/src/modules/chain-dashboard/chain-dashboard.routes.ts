/* apps/api/src/modules/chain-dashboard/chain-dashboard.routes.ts — C2 */
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import { validateParams, validateQuery } from '../../common/validate.js';
import * as service from './chain-dashboard.service.js';

export const chainDashboardRouter = Router();

chainDashboardRouter.use(authMiddleware);

const chainParams = z.object({ chainId: z.string().min(1) });
const dateRangeQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
});
const exceptionsQuery = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
});

const tenantOf = (req: any) => req.auth?.tenantId ?? req.user?.tenantId;

chainDashboardRouter.get(
  '/chains/:chainId/tape-chart',
  requirePermission('property', 'read'),
  validateParams(chainParams),
  validateQuery(dateRangeQuery),
  async (req, res, next) => {
    try {
      const { chainId } = req.validatedParams as any;
      const { from, to } = req.validatedQuery as any;
      res.json({ data: await service.getChainTapeChart(tenantOf(req), chainId, from, to) });
    } catch (err) {
      next(err);
    }
  }
);

chainDashboardRouter.get(
  '/chains/:chainId/rollup',
  requirePermission('property', 'read'),
  validateParams(chainParams),
  validateQuery(dateRangeQuery),
  async (req, res, next) => {
    try {
      const { chainId } = req.validatedParams as any;
      const { from, to } = req.validatedQuery as any;
      res.json({ data: await service.getChainRollup(tenantOf(req), chainId, from, to) });
    } catch (err) {
      next(err);
    }
  }
);

chainDashboardRouter.get(
  '/chains/:chainId/exceptions',
  requirePermission('property', 'read'),
  validateParams(chainParams),
  validateQuery(exceptionsQuery),
  async (req, res, next) => {
    try {
      const { chainId } = req.validatedParams as any;
      const { days } = req.validatedQuery as any;
      res.json({ data: await service.getChainExceptions(tenantOf(req), chainId, days) });
    } catch (err) {
      next(err);
    }
  }
);
