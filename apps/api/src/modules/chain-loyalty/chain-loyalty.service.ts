/* apps/api/src/modules/chain-loyalty/chain-loyalty.service.ts
 * C7 — Chain loyalty: points and status are valid at any chain property.
 * Guests and loyalty transactions are tenant-scoped already, so a guest who
 * earns at Umhlanga can redeem at Ballito today. C7 makes it explicit and
 * visible: property-stamped transactions, chain-wide tiers + config, and a
 * chain board.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';

export interface LoyaltyTier {
  name: string;
  threshold: number;
}

export interface LoyaltyConfigOut {
  tenantId: string;
  chainId: string | null;
  earnRate: number;
  redeemValue: number;
  tiers: LoyaltyTier[];
}

const DEFAULT_TIERS: LoyaltyTier[] = [
  { name: 'silver', threshold: 1000 },
  { name: 'gold', threshold: 5000 },
  { name: 'platinum', threshold: 10000 },
];

function normalizeConfig(row: {
  tenantId: string;
  chainId: string | null;
  earnRate: Prisma.Decimal;
  redeemValue: Prisma.Decimal;
  tiers: Prisma.JsonValue;
}): LoyaltyConfigOut {
  const tiers = (row.tiers as unknown as LoyaltyTier[] | null) ?? [];
  return {
    tenantId: row.tenantId,
    chainId: row.chainId,
    earnRate: Number(row.earnRate),
    redeemValue: Number(row.redeemValue),
    tiers: tiers.length ? [...tiers].sort((a, b) => a.threshold - b.threshold) : DEFAULT_TIERS,
  };
}

export async function getConfig(tenantId: string): Promise<LoyaltyConfigOut> {
  const row = await prisma.loyaltyConfig.findUnique({ where: { tenantId } });
  if (!row) {
    return { tenantId, chainId: null, earnRate: 1, redeemValue: 0.1, tiers: DEFAULT_TIERS };
  }
  return normalizeConfig(row);
}

export async function saveConfig(
  tenantId: string,
  input: { earnRate?: number; redeemValue?: number; tiers?: LoyaltyTier[] }
): Promise<LoyaltyConfigOut> {
  if (input.earnRate !== undefined && !(input.earnRate > 0)) {
    throw new AppError(400, 'earnRate must be a positive number', 'VALIDATION_ERROR');
  }
  if (input.redeemValue !== undefined && !(input.redeemValue > 0)) {
    throw new AppError(400, 'redeemValue must be a positive number', 'VALIDATION_ERROR');
  }
  if (input.tiers !== undefined) {
    if (!Array.isArray(input.tiers) || input.tiers.some((t) => !t.name || !(t.threshold >= 0))) {
      throw new AppError(400, 'tiers must be [{ name, threshold }]', 'VALIDATION_ERROR');
    }
  }
  const data = {
    ...(input.earnRate !== undefined ? { earnRate: input.earnRate } : {}),
    ...(input.redeemValue !== undefined ? { redeemValue: input.redeemValue } : {}),
    ...(input.tiers !== undefined
      ? { tiers: input.tiers as unknown as Prisma.InputJsonValue }
      : {}),
  };
  const row = await prisma.loyaltyConfig.upsert({
    where: { tenantId },
    update: data,
    create: { tenantId, ...data },
  });
  logger.info({ tenantId, input }, 'chain loyalty config saved');
  return normalizeConfig(row);
}

export function tierFor(points: number, tiers: LoyaltyTier[]): string {
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  let tier = 'member';
  for (const t of sorted) {
    if (points >= t.threshold) tier = t.name;
  }
  return tier;
}

async function postTransaction(
  tenantId: string,
  userId: string | undefined,
  input: {
    guestId: string;
    delta: number;
    type: string;
    description: string;
    propertyId?: string;
    source: string;
  }
) {
  const guest = await prisma.guest.findFirst({ where: { id: input.guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  if (input.delta < 0) {
    // Atomic guard: balance must cover the redemption.
    const res = await prisma.guest.updateMany({
      where: { id: guest.id, tenantId, loyaltyPoints: { gte: -input.delta } },
      data: { loyaltyPoints: { decrement: -input.delta } },
    });
    if (res.count === 0) {
      throw new AppError(
        409,
        `Insufficient balance: ${guest.loyaltyPoints} points available`,
        'INSUFFICIENT_POINTS'
      );
    }
  } else {
    await prisma.guest.update({
      where: { id: guest.id },
      data: { loyaltyPoints: { increment: input.delta } },
    });
  }

  const fresh = await prisma.guest.findUniqueOrThrow({
    where: { id: guest.id },
    select: { loyaltyPoints: true },
  });
  const balance = fresh.loyaltyPoints;
  const config = await getConfig(tenantId);

  const transaction = await prisma.loyaltyTransaction.create({
    data: {
      tenantId,
      guestId: guest.id,
      type: input.type,
      amount: input.delta,
      balance,
      description: input.description.slice(0, 255),
      source: input.source,
      createdById: userId ?? null,
      propertyId: input.propertyId ?? null,
    },
  });

  return { transaction, balance, tier: tierFor(balance, config.tiers) };
}

export async function earn(
  tenantId: string,
  userId: string | undefined,
  input: { guestId: string; amount: number; propertyId?: string; description?: string }
) {
  if (!(input.amount > 0))
    throw new AppError(400, 'amount must be a positive ZAR value', 'VALIDATION_ERROR');
  const config = await getConfig(tenantId);
  const points = Math.floor(input.amount * config.earnRate);
  if (points <= 0)
    throw new AppError(
      400,
      'amount too small to earn any points at the current earn rate',
      'VALIDATION_ERROR'
    );

  return postTransaction(tenantId, userId, {
    guestId: input.guestId,
    delta: points,
    type: 'earn',
    description:
      input.description?.trim() || `Earned ${points} pts on ${input.amount.toFixed(2)} spend`,
    propertyId: input.propertyId,
    source: 'Chain',
  });
}

export async function redeem(
  tenantId: string,
  userId: string | undefined,
  input: { guestId: string; points: number; propertyId?: string; description?: string }
) {
  if (!(input.points > 0))
    throw new AppError(400, 'points must be a positive number', 'VALIDATION_ERROR');
  const config = await getConfig(tenantId);
  const value = Math.round(input.points * config.redeemValue * 100) / 100;

  const out = await postTransaction(tenantId, userId, {
    guestId: input.guestId,
    delta: -Math.floor(input.points),
    type: 'redeem',
    description:
      input.description?.trim() ||
      `Redeemed ${Math.floor(input.points)} pts (R${value.toFixed(2)} value)`,
    propertyId: input.propertyId,
    source: 'Chain',
  });
  return { ...out, valueRedeemed: value };
}

// ─── Chain-wide board ───

export async function chainBoard(tenantId: string) {
  const config = await getConfig(tenantId);

  const [members, liability, totals, recent, byPropertyRows, topGuests, memberPoints] =
    await Promise.all([
      prisma.guest.count({ where: { tenantId, loyaltyPoints: { gt: 0 } } }),
      prisma.guest.aggregate({ where: { tenantId }, _sum: { loyaltyPoints: true } }),
      prisma.loyaltyTransaction.groupBy({
        by: ['type'],
        where: { tenantId },
        _sum: { amount: true },
      }),
      prisma.loyaltyTransaction.groupBy({
        by: ['type'],
        where: { tenantId, createdAt: { gte: new Date(Date.now() - 30 * 86400_000) } },
        _sum: { amount: true },
      }),
      prisma.loyaltyTransaction.groupBy({
        by: ['propertyId', 'type'],
        where: { tenantId, propertyId: { not: null } },
        _sum: { amount: true },
      }),
      prisma.guest.findMany({
        where: { tenantId, loyaltyPoints: { gt: 0 } },
        orderBy: { loyaltyPoints: 'desc' },
        take: 10,
        select: { id: true, firstName: true, lastName: true, loyaltyPoints: true, vipStatus: true },
      }),
      prisma.guest.findMany({
        where: { tenantId, loyaltyPoints: { gt: 0 } },
        select: { loyaltyPoints: true },
      }),
    ]);

  const sumFor = (
    rows: { type: string; _sum?: { amount: number | null } | null }[],
    type: string
  ) => rows.find((r) => r.type === type)?._sum?.amount ?? 0;

  const properties = await prisma.property.findMany({
    where: { tenantId },
    select: { id: true, name: true, code: true },
  });
  const propName = new Map(properties.map((p) => [p.id, p.name]));

  const byPropertyMap = new Map<string, { property: string; earned: number; redeemed: number }>();
  for (const row of byPropertyRows) {
    const key = row.propertyId as string;
    const entry = byPropertyMap.get(key) ?? {
      property: propName.get(key) ?? key,
      earned: 0,
      redeemed: 0,
    };
    if (row.type === 'redeem') entry.redeemed += -(row._sum?.amount ?? 0);
    else entry.earned += row._sum?.amount ?? 0;
    byPropertyMap.set(key, entry);
  }

  const tierBuckets = new Map<string, number>();
  for (const t of config.tiers) tierBuckets.set(t.name, 0);
  tierBuckets.set('member', 0);
  for (const g of memberPoints) {
    tierBuckets.set(
      tierFor(g.loyaltyPoints, config.tiers),
      (tierBuckets.get(tierFor(g.loyaltyPoints, config.tiers)) ?? 0) + 1
    );
  }

  return {
    config,
    members,
    liability: liability._sum.loyaltyPoints ?? 0,
    lifetimeEarned: sumFor(totals as never, 'earn'),
    lifetimeRedeemed: -sumFor(totals as never, 'redeem'),
    earned30d: sumFor(recent as never, 'earn'),
    redeemed30d: -sumFor(recent as never, 'redeem'),
    tierDistribution: [...tierBuckets.entries()].map(([tier, count]) => ({ tier, count })),
    byProperty: [...byPropertyMap.values()].sort((a, b) => b.earned - a.earned),
    topGuests: topGuests.map((g) => ({
      ...g,
      tier: tierFor(g.loyaltyPoints, config.tiers),
    })),
  };
}

// ─── Guest chain view ───

export async function guestChainView(tenantId: string, guestId: string) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  const config = await getConfig(tenantId);
  const transactions = await prisma.loyaltyTransaction.findMany({
    where: { tenantId, guestId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { property: { select: { name: true, code: true } } },
  });

  return {
    guest: {
      id: guest.id,
      name: `${guest.firstName} ${guest.lastName}`,
      email: guest.email,
      vipStatus: guest.vipStatus,
      points: guest.loyaltyPoints,
      tier: tierFor(guest.loyaltyPoints, config.tiers),
      tierValue: Math.round(guest.loyaltyPoints * config.redeemValue * 100) / 100,
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.createdAt,
      type: t.type,
      points: t.amount,
      balance: t.balance,
      description: t.description,
      property: t.property?.name ?? null,
      source: t.source,
    })),
  };
}
