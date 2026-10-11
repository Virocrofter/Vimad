/* apps/api/src/modules/loyalty/loyalty.service.ts */
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

// ─── Tier logic (thresholds mirror the web tierMeta.req values) ───
export const TIERS = [
  { key: 'bronze', label: 'Bronze', req: 0 },
  { key: 'silver', label: 'Silver', req: 1000 },
  { key: 'gold', label: 'Gold', req: 5000 },
  { key: 'platinum', label: 'Platinum', req: 10000 },
] as const;

export type TierKey = (typeof TIERS)[number]['key'];

export function tierForPoints(points: number): TierKey {
  let tier: TierKey = 'bronze';
  for (const t of TIERS) {
    if (points >= t.req) tier = t.key;
  }
  return tier;
}

export function nextTierProgress(points: number): number {
  const idx = TIERS.findIndex((t) => t.req > points);
  if (idx === -1) return 100; // already top tier
  const prev = TIERS[idx - 1]?.req ?? 0;
  const next = TIERS[idx].req;
  return Math.round(((points - prev) / (next - prev)) * 100);
}

// ─── Schemas ───
export const pointsAdjustSchema = z.object({
  guestId: z.string().min(1),
  type: z.enum(['accrual', 'redemption', 'bonus', 'adjustment']),
  amount: z.number().int().positive(),
  description: z.string().min(1),
  source: z.string().optional(),
});

export type PointsAdjustInput = z.infer<typeof pointsAdjustSchema>;

// ─── Member shaping ───
function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

async function aggregateStays(tenantId: string, guestIds: string[]) {
  if (guestIds.length === 0)
    return new Map<string, { stays: number; nights: number; ltv: number; lastStay: Date | null }>();
  const rows = await prisma.reservation.groupBy({
    by: ['guestId'],
    where: {
      tenantId,
      guestId: { in: guestIds },
      status: { not: 'cancelled' },
    },
    _count: { _all: true },
    _sum: { nights: true, totalAmount: true },
    _max: { departureDate: true },
  });
  return new Map(
    rows.map((r) => [
      r.guestId,
      {
        stays: r._count._all,
        nights: r._sum.nights ?? 0,
        ltv: Number(r._sum.totalAmount ?? 0),
        lastStay: r._max.departureDate ?? null,
      },
    ])
  );
}

function shapeMember(
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    loyaltyPoints: number;
    createdAt: Date;
  },
  agg: { stays: number; nights: number; ltv: number; lastStay: Date | null } | undefined
) {
  return {
    id: guest.id,
    name: `${guest.firstName} ${guest.lastName}`,
    email: guest.email ?? '',
    phone: guest.phone ?? '',
    tier: tierForPoints(guest.loyaltyPoints),
    points: guest.loyaltyPoints,
    lifetimeValue: agg?.ltv ?? 0,
    totalStays: agg?.stays ?? 0,
    totalNights: agg?.nights ?? 0,
    joined: guest.createdAt.toISOString().slice(0, 10),
    lastStay: agg?.lastStay ? agg.lastStay.toISOString().slice(0, 10) : null,
    nextTierProgress: nextTierProgress(guest.loyaltyPoints),
    avatar: initials(guest.firstName, guest.lastName),
  };
}

// ─── Queries ───
export async function listMembers(
  tenantId: string,
  query: { page: number; pageSize: number; search?: string; tier?: string }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, guests] = await Promise.all([
    prisma.guest.count({ where }),
    prisma.guest.findMany({
      where,
      orderBy: { loyaltyPoints: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  const agg = await aggregateStays(
    tenantId,
    guests.map((g) => g.id)
  );
  let members = guests.map((g) => shapeMember(g, agg.get(g.id)));

  // Tier filter is applied post-aggregation (tier is derived, not stored)
  if (query.tier && query.tier !== 'all') {
    members = members.filter((m) => m.tier === query.tier);
  }

  return paginate(members, total, pagination);
}

export async function getMember(tenantId: string, id: string) {
  const guest = await prisma.guest.findFirst({ where: { id, tenantId } });
  if (!guest) throw new AppError(404, 'Member not found', 'NOT_FOUND');

  const [agg, transactions] = await Promise.all([
    aggregateStays(tenantId, [id]),
    prisma.loyaltyTransaction.findMany({
      where: { tenantId, guestId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return { ...shapeMember(guest, agg.get(id)), transactions };
}

export async function listTransactions(
  tenantId: string,
  query: { page: number; pageSize: number; guestId?: string; type?: string }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };
  if (query.guestId) where.guestId = query.guestId;
  if (query.type) where.type = query.type;

  const [total, items] = await Promise.all([
    prisma.loyaltyTransaction.count({ where }),
    prisma.loyaltyTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  const guestIds = [...new Set(items.map((t) => t.guestId))];
  const guests = await prisma.guest.findMany({
    where: { id: { in: guestIds }, tenantId },
    select: { id: true, firstName: true, lastName: true },
  });
  const nameById = new Map(guests.map((g) => [g.id, `${g.firstName} ${g.lastName}`]));

  const shaped = items.map((t) => ({
    ...t,
    memberName: nameById.get(t.guestId) ?? 'Unknown',
    amount: t.type === 'redemption' ? -Math.abs(t.amount) : t.amount,
    date: t.createdAt.toISOString().slice(0, 10),
  }));

  return paginate(shaped, total, pagination);
}

export async function getLoyaltyStats(tenantId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [totalMembers, pointsAgg, redemptions, guests] = await Promise.all([
    prisma.guest.count({ where: { tenantId } }),
    prisma.guest.aggregate({ where: { tenantId }, _sum: { loyaltyPoints: true } }),
    prisma.loyaltyTransaction.count({
      where: { tenantId, type: 'redemption', createdAt: { gte: monthStart } },
    }),
    prisma.guest.findMany({ where: { tenantId }, select: { loyaltyPoints: true } }),
  ]);

  const tierDistribution: Record<string, number> = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const g of guests) {
    tierDistribution[tierForPoints(g.loyaltyPoints)] += 1;
  }

  const totalPoints = pointsAgg._sum.loyaltyPoints ?? 0;
  return {
    totalMembers,
    totalPoints,
    avgPoints: totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0,
    redemptions,
    tierDistribution,
  };
}

export async function adjustPoints(
  tenantId: string,
  input: PointsAdjustInput,
  createdById?: string
) {
  return prisma.$transaction(async (tx) => {
    const guest = await tx.guest.findFirst({ where: { id: input.guestId, tenantId } });
    if (!guest) throw new AppError(404, 'Member not found', 'NOT_FOUND');

    const delta = input.type === 'redemption' ? -Math.abs(input.amount) : Math.abs(input.amount);
    const newBalance = guest.loyaltyPoints + delta;
    if (newBalance < 0) {
      throw new AppError(400, 'Insufficient points balance', 'INSUFFICIENT_POINTS');
    }

    const txn = await tx.loyaltyTransaction.create({
      data: {
        tenantId,
        guestId: guest.id,
        type: input.type,
        amount: Math.abs(input.amount),
        balance: newBalance,
        description: input.description,
        source: input.source ?? 'Manual',
        createdById,
      },
    });

    await tx.guest.update({
      where: { id: guest.id },
      data: { loyaltyPoints: newBalance },
    });

    return { ...txn, tier: tierForPoints(newBalance) };
  });
}
