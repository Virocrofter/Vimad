/* apps/api/src/modules/guest-portal/guest-loyalty.routes.ts
 * [G3] Guest loyalty — portal-token auth, reservation-bound.
 *   GET  /loyalty/:token              → balance, tier, tier progress, earn/redeem config
 *   GET  /loyalty/:token/transactions → points history
 *   GET  /loyalty/:token/rewards      → rewards catalog (loyalty_rewards, active)
 *   POST /loyalty/:token/redeem       → deduct points (transactional) → concierge fulfilment
 *
 * Reuse: adjustPoints-equivalent inline transaction (same rules as staff side),
 * concierge createItem for staff fulfilment. Idempotent via loyalty_redemptions.idempotencyKey.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { resolveToken } from './guest-portal.service.js';
import { createItem } from '../concierge/concierge.service.js';

export const guestLoyaltyRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ data });

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

interface TierDef {
  name: string;
  minPoints: number;
}

const DEFAULT_TIERS: TierDef[] = [
  { name: 'Bronze', minPoints: 0 },
  { name: 'Silver', minPoints: 1000 },
  { name: 'Gold', minPoints: 5000 },
  { name: 'Platinum', minPoints: 10000 },
];

async function tiersFor(tenantId: string): Promise<TierDef[]> {
  const config = await prisma.loyaltyConfig.findUnique({ where: { tenantId } });
  const raw = config?.tiers as unknown;
  if (Array.isArray(raw) && raw.length > 0) {
    const parsed = raw
      .map((t) => ({
        name: String((t as Record<string, unknown>).name ?? ''),
        minPoints: Number((t as Record<string, unknown>).minPoints ?? 0),
      }))
      .filter((t) => t.name.length > 0);
    if (parsed.length > 0) return parsed.sort((a, b) => a.minPoints - b.minPoints);
  }
  return DEFAULT_TIERS;
}

function tierProgress(balance: number, tiers: TierDef[]) {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0] ?? { name: 'Member', minPoints: 0 };
  let next: TierDef | null = null;
  for (const t of sorted) {
    if (balance >= t.minPoints) current = t;
  }
  next = sorted.find((t) => t.minPoints > balance) ?? null;
  return {
    current,
    next,
    pointsToNext: next ? Math.max(0, next.minPoints - balance) : 0,
  };
}

// ─── GET /:token — loyalty summary ───

guestLoyaltyRouter.get(
  '/:token',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const config = await prisma.loyaltyConfig.findUnique({
      where: { tenantId: reservation.tenantId },
    });
    const balance = reservation.guest.loyaltyPoints;
    const tiers = await tiersFor(reservation.tenantId);
    const progress = tierProgress(balance, tiers);

    return ok(res, {
      token: String(req.params.token),
      balance,
      currency: 'ZAR',
      tier: progress.current,
      nextTier: progress.next,
      pointsToNext: progress.pointsToNext,
      earnRate: Number(config?.earnRate ?? 1),
      redeemValue: Number(config?.redeemValue ?? 0.1),
      memberSince: reservation.guest.createdAt,
    });
  })
);

// ─── GET /:token/transactions — points history ───

guestLoyaltyRouter.get(
  '/:token/transactions',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { tenantId: reservation.tenantId, guestId: reservation.guestId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        amount: true,
        balance: true,
        description: true,
        source: true,
        createdAt: true,
      },
    });

    return ok(res, { token: String(req.params.token), transactions });
  })
);

// ─── GET /:token/rewards — catalog ───

guestLoyaltyRouter.get(
  '/:token/rewards',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const rewards = await prisma.loyaltyReward.findMany({
      where: { tenantId: reservation.tenantId, status: 'active' },
      orderBy: { pointsCost: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        pointsCost: true,
        status: true,
      },
    });

    return ok(res, { token: String(req.params.token), rewards });
  })
);

// ─── POST /:token/redeem ───

const redeemSchema = z.object({
  rewardId: z.string().min(1),
  idempotencyKey: z.string().min(8).max(128),
  note: z.string().max(300).optional(),
});

guestLoyaltyRouter.post(
  '/:token/redeem',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = redeemSchema.parse(req.body ?? {});

    const reward = await prisma.loyaltyReward.findFirst({
      where: { id: input.rewardId, tenantId: reservation.tenantId, status: 'active' },
    });
    if (!reward) throw new AppError(404, 'Reward not found', 'NOT_FOUND');

    // Idempotent replay — same key returns the original redemption.
    const existing = await prisma.loyaltyRedemption.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      if (existing.guestId !== reservation.guestId) {
        throw new AppError(403, 'Idempotency key belongs to another guest', 'FORBIDDEN');
      }
      return ok(res, {
        id: existing.id,
        status: existing.status,
        rewardName: existing.rewardName,
        pointsCost: existing.pointsCost,
        newBalance: reservation.guest.loyaltyPoints,
        conciergeItemId: existing.conciergeItemId,
        idempotentReplay: true,
      });
    }

    const guest = await prisma.guest.findFirst({
      where: { id: reservation.guestId, tenantId: reservation.tenantId },
    });
    if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');
    if (guest.loyaltyPoints < reward.pointsCost) {
      throw new AppError(
        409,
        `Insufficient points — this reward costs ${reward.pointsCost} points and you have ${guest.loyaltyPoints}`,
        'INSUFFICIENT_POINTS'
      );
    }

    // Points deduction + redemption row, atomically (same rules as staff adjustPoints).
    const newBalance = guest.loyaltyPoints - reward.pointsCost;
    const [redemption] = await prisma.$transaction([
      prisma.loyaltyRedemption.create({
        data: {
          tenantId: reservation.tenantId,
          guestId: guest.id,
          reservationId: reservation.id,
          rewardId: reward.id,
          rewardName: reward.name,
          pointsCost: reward.pointsCost,
          status: 'pending',
          idempotencyKey: input.idempotencyKey,
        },
      }),
      prisma.loyaltyTransaction.create({
        data: {
          tenantId: reservation.tenantId,
          guestId: guest.id,
          type: 'redemption',
          amount: reward.pointsCost,
          balance: newBalance,
          description: `Redeemed: ${reward.name}`,
          source: 'Guest Portal',
        },
      }),
      prisma.guest.update({
        where: { id: guest.id },
        data: { loyaltyPoints: newBalance },
      }),
    ]);

    // Fulfilment lands on the concierge board (staff deliver the reward).
    let conciergeItemId: string | null = null;
    try {
      const item = await createItem(reservation.tenantId, guest.id, {
        type: 'special_request',
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        guestId: guest.id,
        title: `Loyalty reward: ${reward.name} — ${guest.lastName}, ${guest.firstName}`,
        description: [
          `${guest.firstName} ${guest.lastName} redeemed "${reward.name}" for ${reward.pointsCost} points (${reservation.confirmationNumber}).`,
          reward.description ? `Reward: ${reward.description}` : null,
          input.note ? `Guest note: ${input.note}` : null,
          'Fulfil and mark the redemption complete.',
        ]
          .filter(Boolean)
          .join('\n'),
        dedupeKey: `loyalty-redeem-${redemption.id}`,
        source: 'guest_portal',
        metadata: {
          rewardId: reward.id,
          pointsCost: reward.pointsCost,
          redemptionId: redemption.id,
        },
      });
      conciergeItemId = item.id;
      await prisma.loyaltyRedemption.update({
        where: { id: redemption.id },
        data: { conciergeItemId },
      });
    } catch (err) {
      // Points stay deducted; fulfilment can be queued manually. Log loudly.
      logger.error({ err, redemptionId: redemption.id }, 'guest reward fulfilment queue failed');
    }

    logger.info(
      {
        guestId: guest.id,
        rewardId: reward.id,
        pointsCost: reward.pointsCost,
        redemptionId: redemption.id,
      },
      'guest portal reward redeemed'
    );

    return ok(res, {
      id: redemption.id,
      status: redemption.status,
      rewardName: reward.name,
      pointsCost: reward.pointsCost,
      newBalance,
      conciergeItemId,
      idempotentReplay: false,
    });
  })
);

// ─── Errors → { error: { code, message } } ───

guestLoyaltyRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const e = err as { statusCode?: number; status?: number; code?: string; message?: string };
  if (err instanceof AppError || e.statusCode || e.status) {
    return res
      .status(e.statusCode ?? e.status ?? 500)
      .json({ error: { code: e.code ?? 'ERROR', message: e.message ?? 'Request failed' } });
  }
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.issues[0]?.message ?? 'Invalid input' },
    });
  }
  logger.warn({ err }, 'guest-loyalty unexpected error');
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
});
