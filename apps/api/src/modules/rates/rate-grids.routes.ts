/* apps/api/src/modules/rates/rate-grids.routes.ts
 * E1x: day-of-week + seasonal rate grids (Wave 1 monetization).
 * Both persist as pricing_rules (the engine already accepts them — R3),
 * and the seasonal grid additionally materializes per-date rate_overrides
 * rows so quotes, channels and the rate calendar see it without re-evaluating.
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';

import { requirePermission } from '../auth/auth.middleware.js';
export const rateGridsRouter = Router();
rateGridsRouter.use(authMiddleware, tenantScope);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validationError(res: Response, message: string): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
}

function eachDateInRange(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) out.push(new Date(d));
  return out;
}

// POST /v1/rates/day-of-week
// { name, roomTypeId, ratePlanId, daysOfWeek: number[], adjustmentPercent }
rateGridsRouter.post(
  '/day-of-week',
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response) => {
    const { name, roomTypeId, ratePlanId, daysOfWeek, adjustmentPercent } = (req.body ?? {}) as any;
    if (!name || typeof name !== 'string') return validationError(res, 'name is required');
    const days = Array.isArray(daysOfWeek) ? daysOfWeek : [];
    if (days.length === 0 || days.some((d: any) => !Number.isInteger(d) || d < 0 || d > 6)) {
      return validationError(res, 'daysOfWeek must be an array of integers 0 (Sun) - 6 (Sat)');
    }
    const pct = Number(adjustmentPercent);
    if (!Number.isFinite(pct) || pct < -90 || pct > 500) {
      return validationError(res, 'adjustmentPercent must be a number between -90 and 500');
    }
    const plan = ratePlanId
      ? await prisma.ratePlan.findUnique({ where: { id: String(ratePlanId) } })
      : null;
    if (!plan)
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'ratePlan not found' } });

    const rule = await prisma.pricingRule.create({
      data: {
        tenantId: plan.tenantId,
        propertyId: plan.propertyId,
        name: name.slice(0, 120),
        type: 'day_of_week',
        conditions: { roomTypeId: roomTypeId ?? plan.roomTypeId, daysOfWeek: days },
        adjustment: { kind: 'percent', value: pct },
        priority: 50,
        isActive: true,
      },
    });
    logger.info({ ruleId: rule.id, daysOfWeek: days, pct }, 'day-of-week rate grid created');
    res.status(201).json({ data: rule });
  }
);

// POST /v1/rates/seasonal
// { name, roomTypeId, ratePlanId, startDate, endDate, rate }
rateGridsRouter.post(
  '/seasonal',
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response) => {
    const { name, roomTypeId, ratePlanId, startDate, endDate, rate } = (req.body ?? {}) as any;
    if (!name || typeof name !== 'string') return validationError(res, 'name is required');
    if (
      !ISO_DATE.test(startDate ?? '') ||
      !ISO_DATE.test(endDate ?? '') ||
      Number.isNaN(Date.parse(startDate)) ||
      Number.isNaN(Date.parse(endDate))
    ) {
      return validationError(res, 'startDate and endDate must be YYYY-MM-DD');
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return validationError(res, 'startDate must be on or before endDate');
    const nights = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    if (nights > 370) return validationError(res, 'seasonal grid range exceeds 370 days');
    const amount = Number(rate);
    if (!Number.isFinite(amount) || amount <= 0)
      return validationError(res, 'rate must be a positive number');

    const plan = ratePlanId
      ? await prisma.ratePlan.findUnique({ where: { id: String(ratePlanId) } })
      : null;
    if (!plan)
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'ratePlan not found' } });

    const rule = await prisma.pricingRule.create({
      data: {
        tenantId: plan.tenantId,
        propertyId: plan.propertyId,
        name: name.slice(0, 120),
        type: 'seasonal',
        conditions: { roomTypeId: roomTypeId ?? plan.roomTypeId, startDate, endDate },
        adjustment: { kind: 'fixed_rate', value: amount },
        priority: 50,
        isActive: true,
      },
    });

    const base = Number(plan.baseRate);
    const dates = eachDateInRange(start, end);
    await prisma.$transaction(
      dates.map((date) =>
        prisma.rateOverride.upsert({
          where: { ratePlanId_date: { ratePlanId: plan.id, date } },
          update: {
            tenantId: plan.tenantId,
            propertyId: plan.propertyId,
            baseRate: base,
            effectiveRate: amount,
            ruleId: rule.id,
          },
          create: {
            tenantId: plan.tenantId,
            propertyId: plan.propertyId,
            ratePlanId: plan.id,
            date,
            baseRate: base,
            effectiveRate: amount,
            ruleId: rule.id,
          },
        })
      )
    );

    logger.info({ ruleId: rule.id, nights, rate: amount }, 'seasonal rate grid created');
    res.status(201).json({ data: rule, materializedDates: dates.length });
  }
);
