/* apps/api/src/modules/rates/pricing-rules.service.ts — C1' pricing rules
 * Rules-as-rows dynamic pricing. Each rule: type occupancy|date_range,
 * conditions, adjustment (percent|fixed|amount), priority. Evaluation is
 * per (rate plan, day): rules sorted by priority desc, FIRST match wins
 * (no-exceptions priority). Results land in rate_overrides — one row per
 * cell, upserted per run, so re-running is the reversal: rules off → the
 * ledger recomputes empty and base rates rule again.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const ruleSchema = {
  name: (v: unknown) => typeof v === 'string' && v.length >= 2,
  type: (v: unknown) => v === 'occupancy' || v === 'date_range',
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const dstr = (d: Date) => d.toISOString().slice(0, 10);
const dayMs = 86400_000;

type Rule = {
  id: string;
  name: string;
  type: string;
  priority: number;
  conditions: {
    occupancyGte?: number;
    daysWithin?: number;
    dateFrom?: string;
    dateTo?: string;
    roomTypeIds?: string[];
  };
  adjustment: { method?: string; value?: number };
};

function matches(rule: Rule, date: Date, occupancyPct: number): boolean {
  const c = rule.conditions;
  if (rule.type === 'occupancy') {
    if (c.occupancyGte != null && occupancyPct < c.occupancyGte) return false;
    if (c.daysWithin != null && date.getTime() > Date.now() + c.daysWithin * dayMs) return false;
    return true;
  }
  if (rule.type === 'date_range') {
    const day = dstr(date);
    if (c.dateFrom && day < c.dateFrom) return false;
    if (c.dateTo && day > c.dateTo) return false;
    return true;
  }
  return false;
}

function apply(base: number, adj: Rule['adjustment']): number {
  const method = adj.method ?? 'percent';
  const value = adj.value ?? 0;
  if (method === 'fixed') return round2(value);
  if (method === 'amount') return round2(base + value);
  return round2(base * (1 + value / 100));
}

export async function createRule(
  tenantId: string,
  propertyId: string,
  actorId: string,
  input: Record<string, unknown>
) {
  if (!ruleSchema.name(input.name) || !ruleSchema.type(input.type)) {
    throw new AppError(400, 'name and type (occupancy|date_range) required', 'VALIDATION_ERROR');
  }
  return prisma.pricingRule.create({
    data: {
      tenantId,
      propertyId,
      name: input.name as string,
      type: input.type as string,
      conditions: (input.conditions ?? {}) as Prisma.InputJsonValue,
      adjustment: (input.adjustment ?? {}) as Prisma.InputJsonValue,
      priority: typeof input.priority === 'number' ? input.priority : 50,
      isActive: input.isActive !== false,
      createdBy: actorId,
    },
  });
}

export async function listRules(tenantId: string, propertyId: string) {
  return prisma.pricingRule.findMany({
    where: { tenantId, propertyId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function deleteRule(tenantId: string, ruleId: string) {
  const rule = await prisma.pricingRule.findFirst({ where: { id: ruleId, tenantId } });
  if (!rule) throw new AppError(404, 'Rule not found', 'NOT_FOUND');
  await prisma.pricingRule.delete({ where: { id: ruleId } });
  return { deleted: true };
}

export async function setRuleActive(tenantId: string, ruleId: string, isActive: boolean) {
  const rule = await prisma.pricingRule.findFirst({ where: { id: ruleId, tenantId } });
  if (!rule) throw new AppError(404, 'Rule not found', 'NOT_FOUND');
  await prisma.pricingRule.update({ where: { id: ruleId }, data: { isActive } });
  return { id: ruleId, isActive };
}

export async function evaluate(tenantId: string, propertyId: string, from: string, to: string) {
  const fromD = new Date(`${from}T00:00:00.000Z`);
  const toD = new Date(`${to}T00:00:00.000Z`);
  if (isNaN(fromD.getTime()) || isNaN(toD.getTime()) || fromD > toD) {
    throw new AppError(400, 'valid from/to dates required', 'VALIDATION_ERROR');
  }
  if (toD.getTime() - fromD.getTime() > 370 * dayMs) {
    throw new AppError(400, 'range too large (max 370 days)', 'VALIDATION_ERROR');
  }

  // Reversal: clear the ledger for this range; only matching rules re-fill it
  await prisma.rateOverride.deleteMany({
    where: { tenantId, propertyId, date: { gte: fromD, lte: toD } },
  });

  const rules = (await prisma.pricingRule.findMany({
    where: { tenantId, propertyId, isActive: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  })) as Rule[];
  const ratePlans = await prisma.ratePlan.findMany({
    where: { propertyId, status: 'active' },
    select: {
      id: true,
      baseRate: true,
      calculationMethod: true,
      calculationValue: true,
      roomTypeId: true,
    },
  });
  if (ratePlans.length === 0 || rules.length === 0) return { evaluated: 0, dates: 0 };

  const [totalRooms, oooRooms] = await Promise.all([
    prisma.room.count({ where: { propertyId } }),
    prisma.room.count({
      where: {
        propertyId,
        OR: [{ status: { in: ['ooo', 'out_of_order'] } }, { serviceStatus: 'ooo' }],
      },
    }),
  ]);
  const sellable = Math.max(totalRooms - oooRooms, 0);

  let evaluated = 0;
  for (let t = fromD.getTime(); t <= toD.getTime(); t += dayMs) {
    const date = new Date(t);
    const stays = await prisma.reservationStay.count({
      where: { date, room: { propertyId } },
    });
    const occupancyPct = sellable > 0 ? (stays / sellable) * 100 : 0;
    const winning = rules.find((r) => {
      if (r.conditions.roomTypeIds?.length) {
        // roomType-scoped rule only applies to matching plans
        return false; // per-plan check below
      }
      return matches(r, date, occupancyPct);
    });

    for (const plan of ratePlans) {
      const scoped = rules.find(
        (r) =>
          (!r.conditions.roomTypeIds?.length ||
            r.conditions.roomTypeIds.includes(plan.roomTypeId)) &&
          matches(r, date, occupancyPct)
      );
      const rule = scoped ?? winning;
      if (!rule) continue;
      const base = Number(plan.baseRate);
      const effective = apply(base, rule.adjustment);
      await prisma.rateOverride.upsert({
        where: { ratePlanId_date: { ratePlanId: plan.id, date } },
        update: { baseRate: base, effectiveRate: effective, ruleId: rule.id },
        create: {
          tenantId,
          propertyId,
          ratePlanId: plan.id,
          date,
          baseRate: base,
          effectiveRate: effective,
          ruleId: rule.id,
        },
      });
      evaluated++;
    }
  }
  const days = Math.round((toD.getTime() - fromD.getTime()) / dayMs) + 1;
  return { evaluated, dates: days };
}

export async function getEffectiveRates(
  tenantId: string,
  propertyId: string,
  from: string,
  to: string
) {
  return prisma.rateOverride.findMany({
    where: {
      tenantId,
      propertyId,
      date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
    },
    orderBy: { date: 'asc' },
  });
}
