/* apps/api/src/modules/rates/ai-pricing.service.ts — D5 pricing suggestions.
 * Transparent occupancy-band model with written rationale — no black box.
 * Applying a suggestion writes a MANUAL rate_override (ruleId manual:ai:*),
 * so the C1' evaluate loop can never overwrite a human-accepted rate.
 */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const r2 = (n: number) => Math.round(n * 100) / 100;
const dayMs = 86400000;

export async function generateSuggestions(
  tenantId: string,
  propertyId: string,
  from: string,
  to: string
) {
  const fromD = new Date(from + 'T00:00:00.000Z');
  const toD = new Date(to + 'T00:00:00.000Z');
  if (toD.getTime() - fromD.getTime() > 92 * dayMs)
    throw new AppError(400, 'max 92 days', 'VALIDATION_ERROR');
  const roomTypes = await prisma.roomType.findMany({
    where: { propertyId, status: 'active' },
    select: { id: true, code: true },
  });
  const plans = await prisma.ratePlan.findMany({
    where: { propertyId, status: 'active' },
    select: { id: true, roomTypeId: true, baseRate: true },
  });
  const planByType = new Map(plans.map((p) => [p.roomTypeId, p]));
  const generated: number[] = [];
  for (let t = fromD.getTime(); t <= toD.getTime(); t += dayMs) {
    const date = new Date(t);
    for (const rt of roomTypes) {
      const total = await prisma.room.count({ where: { roomTypeId: rt.id } });
      const ooo = await prisma.room.count({
        where: {
          roomTypeId: rt.id,
          OR: [{ status: { in: ['ooo', 'out_of_order'] } }, { serviceStatus: 'ooo' }],
        },
      });
      const sellable = Math.max(total - ooo, 0);
      const sold = await prisma.reservationStay.count({
        where: { room: { roomTypeId: rt.id }, date },
      });
      const occ = sellable ? (sold / sellable) * 100 : 0;
      const plan = planByType.get(rt.id);
      const override = plan
        ? await prisma.rateOverride.findUnique({
            where: { ratePlanId_date: { ratePlanId: plan.id, date } },
          })
        : null;
      const current = Number(override?.effectiveRate ?? plan?.baseRate ?? 0);
      let delta = 0;
      const why: string[] = [];
      if (occ >= 85) {
        delta += 12;
        why.push('occupancy ' + r2(occ) + '% >= 85% -> +12%');
      } else if (occ >= 70) {
        delta += 6;
        why.push('occupancy ' + r2(occ) + '% >= 70% -> +6%');
      }
      if (occ <= 40 && sellable > 0) {
        delta -= 8;
        why.push('occupancy ' + r2(occ) + '% <= 40% -> -8% fill');
      }
      if (!why.length) why.push('occupancy ' + r2(occ) + '% in neutral band -> hold');
      const suggested = r2(current * (1 + delta / 100));
      const rec = await prisma.pricingSuggestion.upsert({
        where: { roomTypeId_date: { roomTypeId: rt.id, date } },
        update: {
          currentRate: current,
          suggestedRate: suggested,
          occupancyPct: r2(occ),
          rationale: why.join('; '),
          status: 'pending',
          tenantId,
          propertyId,
        },
        create: {
          tenantId,
          propertyId,
          roomTypeId: rt.id,
          date,
          currentRate: current,
          suggestedRate: suggested,
          occupancyPct: r2(occ),
          rationale: why.join('; '),
        },
      });
      generated.push(Number(rec.suggestedRate));
    }
  }
  return { generated: generated.length };
}

export async function listSuggestions(
  tenantId: string,
  propertyId: string,
  from: string,
  to: string
) {
  return prisma.pricingSuggestion.findMany({
    where: {
      tenantId,
      propertyId,
      date: { gte: new Date(from + 'T00:00:00.000Z'), lte: new Date(to + 'T00:00:00.000Z') },
    },
    orderBy: { date: 'asc' },
    take: 3000,
  });
}

export async function applySuggestion(tenantId: string, actorId: string, suggestionId: string) {
  const s = await prisma.pricingSuggestion.findFirst({ where: { id: suggestionId, tenantId } });
  if (!s) throw new AppError(404, 'Suggestion not found', 'NOT_FOUND');
  if (s.status === 'applied') return { applied: true, already: true };
  const plan = await prisma.ratePlan.findFirst({
    where: { roomTypeId: s.roomTypeId, propertyId: s.propertyId, status: 'active' },
  });
  if (!plan) throw new AppError(400, 'No active rate plan for room type', 'NO_PLAN');
  const base = Number(plan.baseRate);
  await prisma.rateOverride.upsert({
    where: { ratePlanId_date: { ratePlanId: plan.id, date: s.date } },
    update: { baseRate: base, effectiveRate: Number(s.suggestedRate), ruleId: 'manual:ai:' + s.id },
    create: {
      tenantId,
      propertyId: s.propertyId,
      ratePlanId: plan.id,
      date: s.date,
      baseRate: base,
      effectiveRate: Number(s.suggestedRate),
      ruleId: 'manual:ai:' + actorId.slice(-6),
    },
  });
  await prisma.pricingSuggestion.update({ where: { id: s.id }, data: { status: 'applied' } });
  return { applied: true, rate: Number(s.suggestedRate) };
}

export async function dismissSuggestion(tenantId: string, suggestionId: string) {
  const s = await prisma.pricingSuggestion.findFirst({ where: { id: suggestionId, tenantId } });
  if (!s) throw new AppError(404, 'Suggestion not found', 'NOT_FOUND');
  await prisma.pricingSuggestion.update({ where: { id: s.id }, data: { status: 'dismissed' } });
  return { dismissed: true };
}
