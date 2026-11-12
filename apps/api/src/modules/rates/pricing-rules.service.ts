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
  type: (v: unknown) => v === 'occupancy' || v === 'date_range' || v === 'restriction',
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
  // E1x grid dialect: day_of_week + seasonal (created directly via rate-grids
  // routes, bypassing ruleSchema). Same ledger, one mechanism.
  if (rule.type === 'day_of_week') {
    const days = (c as any).daysOfWeek;
    return Array.isArray(days) && days.includes(date.getUTCDay());
  }
  if (rule.type === 'seasonal') {
    const day = dstr(date);
    const from = (c as any).startDate as string | undefined;
    const to = (c as any).endDate as string | undefined;
    if (from && day < from) return false;
    if (to && day > to) return false;
    return Boolean(from || to);
  }
  return false;
}

function apply(base: number, adj: Rule['adjustment']): number {
  const method = adj.method ?? (adj as any).kind ?? 'percent';
  const value = adj.value ?? 0;
  if (method === 'fixed' || method === 'fixed_rate') return round2(value);
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
    where: {
      tenantId,
      propertyId,
      date: { gte: fromD, lte: toD },
      ruleId: { not: { startsWith: 'manual:' } },
    },
  });

  // Manual (bulk) overrides are authoritative: rules never clobber them
  const manualCells = new Set(
    (
      await prisma.rateOverride.findMany({
        where: {
          tenantId,
          propertyId,
          date: { gte: fromD, lte: toD },
          ruleId: { startsWith: 'manual:' },
        },
        select: { ratePlanId: true, date: true },
      })
    ).map((m) => `${m.ratePlanId}|${dstr(m.date)}`)
  );

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
      parentRatePlanId: true,
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

  // Parent/child derived rates: resolve the base through the chain (depth <= 2)
  const baseCache = new Map<string, number>();
  const resolveBase = async (plan: (typeof ratePlans)[number]): Promise<number> => {
    const cached = baseCache.get(plan.id);
    if (cached != null) return cached;
    let base = Number(plan.baseRate);
    if (plan.calculationMethod !== 'fixed' && plan.parentRatePlanId) {
      const parent = await prisma.ratePlan.findUnique({
        where: { id: plan.parentRatePlanId },
        select: { baseRate: true },
      });
      if (parent) {
        const parentBase = Number(parent.baseRate);
        base =
          plan.calculationMethod === 'percent'
            ? round2(parentBase * (1 + Number(plan.calculationValue ?? 0) / 100))
            : round2(parentBase + Number(plan.calculationValue ?? 0));
      }
    }
    baseCache.set(plan.id, base);
    return base;
  };

  const allRoomTypeIds = (
    await prisma.roomType.findMany({ where: { propertyId }, select: { id: true } })
  ).map((t) => t.id);

  let evaluated = 0;
  for (let t = fromD.getTime(); t <= toD.getTime(); t += dayMs) {
    const date = new Date(t);
    const stays = await prisma.reservationStay.count({
      where: { date, room: { propertyId } },
    });
    const occupancyPct = sellable > 0 ? (stays / sellable) * 100 : 0;

    // Restriction rules with no-exceptions occupancy threshold -> review queue
    for (const r of rules.filter((x) => x.type === 'restriction')) {
      const gte = r.conditions.occupancyGte ?? 100;
      if (occupancyPct < gte) continue;
      if (
        r.conditions.daysWithin != null &&
        date.getTime() > Date.now() + r.conditions.daysWithin * dayMs
      )
        continue;
      const scope = r.conditions.roomTypeIds?.length ? r.conditions.roomTypeIds : allRoomTypeIds;
      for (const rtId of scope) {
        await prisma.rateRestrictionSuggestion.upsert({
          where: { roomTypeId_date_kind: { roomTypeId: rtId, date, kind: 'stop_sell' } },
          update: {},
          create: {
            tenantId,
            propertyId,
            roomTypeId: rtId,
            date,
            kind: 'stop_sell',
            reason: `auto: ${r.name}`,
            ruleId: r.id,
          },
        });
      }
    }

    const winning = rules.find((r) => {
      if (r.conditions.roomTypeIds?.length || (r.conditions as any).roomTypeId) {
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
          (!(r.conditions as any).roomTypeId ||
            (r.conditions as any).roomTypeId === plan.roomTypeId) &&
          matches(r, date, occupancyPct)
      );
      const rule = scoped ?? winning;
      if (!rule) continue;
      if (manualCells.has(`${plan.id}|${dstr(date)}`)) continue;
      const base = await resolveBase(plan);
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

/* ─── C1' slices: derived plans, bulk update, vouchers, quote, review ─── */

export async function createDerivedPlan(
  tenantId: string,
  propertyId: string,
  input: Record<string, unknown>
) {
  const parent = await prisma.ratePlan.findFirst({
    where: { id: input.parentRatePlanId as string, propertyId },
  });
  if (!parent) throw new AppError(404, 'Parent rate plan not found', 'NOT_FOUND');
  const method = input.calculationMethod as string;
  if (!['percent', 'amount'].includes(method))
    throw new AppError(400, 'calculationMethod must be percent|amount', 'VALIDATION_ERROR');
  return prisma.ratePlan.create({
    data: {
      tenantId,
      propertyId,
      roomTypeId: parent.roomTypeId,
      parentRatePlanId: parent.id,
      name: (input.name as string) ?? `${parent.name} (derived)`,
      code: `${parent.code}-D${Date.now().toString(36).toUpperCase().slice(-4)}`,
      baseRate: parent.baseRate,
      calculationMethod: method,
      calculationValue: (input.calculationValue as number) ?? 0,
      status: 'active',
    },
  });
}

export async function bulkUpdate(
  tenantId: string,
  propertyId: string,
  actorId: string,
  input: Record<string, unknown>
) {
  const { ratePlanId, from, to, method } = input as {
    ratePlanId: string;
    from: string;
    to: string;
    method: string;
  };
  if (method === 'clear') {
    const del = await prisma.rateOverride.deleteMany({
      where: { tenantId, propertyId, ratePlanId, ruleId: { startsWith: 'manual:' } },
    });
    return { cleared: del.count };
  }
  const plan = await prisma.ratePlan.findFirst({ where: { id: ratePlanId, propertyId } });
  if (!plan) throw new AppError(404, 'Rate plan not found', 'NOT_FOUND');
  const fromD = new Date(`${from}T00:00:00.000Z`);
  const toD = new Date(`${to}T00:00:00.000Z`);
  let written = 0;
  for (let t = fromD.getTime(); t <= toD.getTime(); t += dayMs) {
    const date = new Date(t);
    const base = Number(plan.baseRate);
    const value = Number((input.value as number) ?? 0);
    const effective =
      method === 'fixed'
        ? round2(value)
        : method === 'amount'
          ? round2(base + value)
          : round2(base * (1 + value / 100));
    await prisma.rateOverride.upsert({
      where: { ratePlanId_date: { ratePlanId, date } },
      update: { baseRate: base, effectiveRate: effective, ruleId: `manual:bulk:${actorId}` },
      create: {
        tenantId,
        propertyId,
        ratePlanId,
        date,
        baseRate: base,
        effectiveRate: effective,
        ruleId: `manual:bulk:${actorId}`,
      },
    });
    written++;
  }
  return { written };
}

export async function createVoucher(
  tenantId: string,
  propertyId: string,
  input: Record<string, unknown>
) {
  const code = `VCH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const discountPercent = Number(input.discountPercent ?? 10);
  if (discountPercent < 1 || discountPercent > 90)
    throw new AppError(400, 'discountPercent 1-90', 'VALIDATION_ERROR');
  const voucher = await prisma.voucher.create({
    data: {
      tenantId,
      propertyId,
      code,
      discountPercent,
      maxUses: Number(input.maxUses ?? 100),
      expiresAt: input.expiresAt ? new Date(input.expiresAt as string) : null,
    },
  });
  const { env } = await import('../../common/env.js');
  return {
    ...voucher,
    deepLink: `${env.WEB_URL}/booking?property=${propertyId}&voucher=${code}`,
  };
}

export async function listVouchers(tenantId: string, propertyId: string) {
  return prisma.voucher.findMany({
    where: { tenantId, propertyId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getQuote(
  tenantId: string,
  propertyId: string,
  roomTypeId: string,
  from: string,
  to: string,
  ratePlanId?: string
) {
  const plan = ratePlanId
    ? await prisma.ratePlan.findFirst({ where: { id: ratePlanId, propertyId, status: 'active' } })
    : await prisma.ratePlan.findFirst({
        where: { propertyId, roomTypeId, status: 'active' },
        orderBy: { code: 'asc' },
        select: {
          id: true,
          baseRate: true,
          calculationMethod: true,
          calculationValue: true,
          parentRatePlanId: true,
        },
      });
  if (!plan) throw new AppError(404, 'No active rate plan for room type', 'NOT_FOUND');
  let base = Number(plan.baseRate);
  if (plan.calculationMethod !== 'fixed' && plan.parentRatePlanId) {
    const parent = await prisma.ratePlan.findUnique({
      where: { id: plan.parentRatePlanId },
      select: { baseRate: true },
    });
    if (parent) {
      const parentBase = Number(parent.baseRate);
      base =
        plan.calculationMethod === 'percent'
          ? round2(parentBase * (1 + Number(plan.calculationValue ?? 0) / 100))
          : round2(parentBase + Number(plan.calculationValue ?? 0));
    }
  }
  const fromD = new Date(`${from}T00:00:00.000Z`);
  const toD = new Date(`${to}T00:00:00.000Z`);
  const overrides = await prisma.rateOverride.findMany({
    where: { tenantId, propertyId, ratePlanId: plan.id, date: { gte: fromD, lte: toD } },
  });
  const oMap = new Map(overrides.map((o) => [dstr(o.date), Number(o.effectiveRate)]));
  const nightly: { date: string; rate: number; source: 'rule' | 'manual' | 'base' }[] = [];
  for (let t = fromD.getTime(); t < toD.getTime(); t += dayMs) {
    const date = dstr(new Date(t));
    const o = oMap.get(date);
    nightly.push({
      date,
      rate: o ?? base,
      source: o
        ? oMap.get(date) !== undefined
          ? overrides.find((x) => dstr(x.date) === date)?.ruleId.startsWith('manual:')
            ? 'manual'
            : 'rule'
          : 'base'
        : 'base',
    });
  }
  return {
    ratePlanId: plan.id,
    baseRate: base,
    nightly,
    total: round2(nightly.reduce((s, n) => s + n.rate, 0)),
  };
}

export async function listSuggestions(
  tenantId: string,
  propertyId: string,
  from: string,
  to: string
) {
  return prisma.rateRestrictionSuggestion.findMany({
    where: {
      tenantId,
      propertyId,
      date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
    },
    orderBy: { date: 'asc' },
  });
}

export async function applySuggestion(tenantId: string, actorId: string, suggestionId: string) {
  const s = await prisma.rateRestrictionSuggestion.findFirst({
    where: { id: suggestionId, tenantId },
  });
  if (!s) throw new AppError(404, 'Suggestion not found', 'NOT_FOUND');
  if (s.status === 'applied') return { applied: true, already: true };
  await prisma.$transaction([
    prisma.rateRestrictionSuggestion.update({ where: { id: s.id }, data: { status: 'applied' } }),
    prisma.inventoryRestriction.upsert({
      where: { roomTypeId_date: { roomTypeId: s.roomTypeId, date: s.date } },
      update: { stopSell: true, updatedById: actorId },
      create: {
        tenantId,
        propertyId: s.propertyId,
        roomTypeId: s.roomTypeId,
        date: s.date,
        stopSell: true,
        notes: `applied from pricing review: ${s.reason ?? ''}`,
        updatedById: actorId,
      },
    }),
  ]);
  return { applied: true };
}

export async function dismissSuggestion(tenantId: string, suggestionId: string) {
  const s = await prisma.rateRestrictionSuggestion.findFirst({
    where: { id: suggestionId, tenantId },
  });
  if (!s) throw new AppError(404, 'Suggestion not found', 'NOT_FOUND');
  await prisma.rateRestrictionSuggestion.update({
    where: { id: s.id },
    data: { status: 'dismissed' },
  });
  return { dismissed: true };
}
