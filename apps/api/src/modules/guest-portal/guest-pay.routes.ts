/* apps/api/src/modules/guest-portal/guest-pay.routes.ts
 * [G2] Guest checkout + split billing — portal-token auth, reservation-bound.
 *
 * Money path (reuse, never rebuild):
 *   POST /pay/:token              → Paystack hosted checkout (card data never touches us)
 *   GET  /pay/:token/verify/:ref  → server-side verify → folio credit via payments.service
 *   POST /v1/payments/webhook     → (existing) queue → postPaymentToFolio → A5 receipt + email
 *
 * Idempotency: Payment.idempotencyKey is unique (replay returns the same checkout
 * session); postPaymentToFolio guards on postedToFolio, so a double webhook and a
 * verify-callback race cannot double-credit the folio.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../common/prisma.js';
import { env } from '../../common/env.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { resolveToken } from './guest-portal.service.js';
import { initializeTransaction, verifyTransaction, newReference } from '../../common/paystack.js';
import { postPaymentToFolio } from '../payments/payments.service.js';

export const guestPayRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ data });

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

// These endpoints mint payment sessions — stricter than the generic portal limit.
const payInitLimiter = env.RATE_LIMIT_ENABLED
  ? rateLimit({
      windowMs: 60_000,
      max: 15,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: { code: 'RATE_LIMITED', message: 'Too many attempts — try again shortly' },
      },
    })
  : (_req: Request, _res: Response, next: NextFunction) => next();

// ─── Schemas ───

const initializeSchema = z.object({
  amountMinor: z.number().int().positive().max(10_000_000).optional(),
  idempotencyKey: z.string().min(8).max(128),
  paymentRequestId: z.string().optional(),
});

const splitSchema = z
  .object({
    toName: z.string().min(1).max(120),
    toEmail: z.string().email().optional(),
    toPhone: z.string().min(7).max(30).optional(),
    amount: z.number().positive().max(1_000_000),
    note: z.string().max(500).optional(),
  })
  .refine((v) => Boolean(v.toEmail || v.toPhone), {
    message: 'An email or phone number is required so the front desk can send the pay link',
  });

const respondSchema = z.object({
  action: z.enum(['accept', 'decline']),
  note: z.string().max(500).optional(),
});

const fmt = (amount: number) => `R ${amount.toFixed(2)}`;

// ─── POST /:token — initialize a hosted checkout for this reservation ───

guestPayRouter.post(
  '/:token',
  payInitLimiter,
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = initializeSchema.parse(req.body ?? {});

    let amountMinor: number;
    let folioId: string | null = null;
    let type: 'balance_charge' | 'deposit' = 'balance_charge';
    let paymentRequestId: string | null = null;

    if (input.paymentRequestId) {
      const pr = await prisma.paymentRequest.findFirst({
        where: {
          id: input.paymentRequestId,
          tenantId: reservation.tenantId,
          reservationId: reservation.id,
        },
      });
      if (!pr) throw new AppError(404, 'Payment request not found', 'NOT_FOUND');
      if (pr.paidAt) throw new AppError(409, 'This request has already been paid', 'ALREADY_PAID');
      amountMinor = pr.amountMinor;
      folioId = pr.folioId;
      type = 'deposit';
      paymentRequestId = pr.id;
    } else {
      const folio = await prisma.folio.findFirst({ where: { reservationId: reservation.id } });
      folioId = folio?.id ?? null;
      const balanceMinor = folio ? Math.round(Number(folio.balance) * 100) : 0;
      amountMinor = input.amountMinor ?? balanceMinor;
      if (amountMinor <= 0) {
        throw new AppError(409, 'There is nothing to pay on this folio', 'NOTHING_TO_PAY');
      }
    }

    // Idempotency — same key returns the existing checkout session.
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      return ok(res, {
        reference: existing.reference,
        authorizationUrl:
          (existing.metadata as { authorizationUrl?: string } | null)?.authorizationUrl ?? null,
        amountMinor: existing.amountMinor,
        currency: existing.currency,
        idempotentReplay: true,
      });
    }

    const reference = newReference('GP');
    const email = reservation.guest.email ?? `guest-${reservation.guestId}@vimad.local`;
    const callbackUrl = `${env.WEB_URL.replace(/\/$/, '')}/guest-portal/billing`;

    const checkout = await initializeTransaction({
      email,
      amountMinor,
      currency: env.PAYSTACK_CURRENCY,
      reference,
      callbackUrl,
      metadata: {
        tenantId: reservation.tenantId,
        type,
        source: 'guest_portal',
        reservationId: reservation.id,
        paymentRequestId,
      },
    });

    await prisma.payment.create({
      data: {
        tenantId: reservation.tenantId,
        propertyId: reservation.propertyId,
        reservationId: reservation.id,
        guestId: reservation.guestId,
        folioId,
        reference,
        amountMinor,
        currency: env.PAYSTACK_CURRENCY,
        type,
        status: 'pending',
        idempotencyKey: input.idempotencyKey,
        metadata: {
          authorizationUrl: checkout.authorization_url,
          source: 'guest_portal',
          paymentRequestId,
        },
      },
    });

    logger.info(
      { reservationId: reservation.id, reference, amountMinor, paymentRequestId },
      'guest portal checkout initialized'
    );

    return ok(res, {
      reference,
      authorizationUrl: checkout.authorization_url,
      amountMinor,
      currency: env.PAYSTACK_CURRENCY,
      idempotentReplay: false,
    });
  })
);

// ─── GET /:token/verify/:reference — server-side confirm (return URL + polling) ───

guestPayRouter.get(
  '/:token/verify/:reference',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const payment = await prisma.payment.findFirst({
      where: { reference: String(req.params.reference), tenantId: reservation.tenantId },
    });
    if (!payment || payment.reservationId !== reservation.id) {
      throw new AppError(404, 'Payment not found', 'NOT_FOUND');
    }

    // Already settled — cheap idempotent replay.
    if (!(payment.status === 'success' && payment.postedToFolio)) {
      const tx = await verifyTransaction(payment.reference);
      if (tx.status === 'success' && tx.amount === payment.amountMinor) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'success',
            paystackId: BigInt(tx.id),
            authorizationCode: tx.authorization?.authorization_code ?? null,
            cardLast4: tx.authorization?.last4 ?? null,
            cardBrand: tx.authorization?.brand ?? null,
            channel: tx.channel ?? 'card',
            feeMinor: tx.fees ?? 0,
            failureReason: null,
          },
        });
        // Single writer — folio item, A5 tax receipt, receipt email. No-op if the
        // webhook already posted it (postedToFolio guard).
        await postPaymentToFolio(payment.id);

        const prId = (payment.metadata as { paymentRequestId?: string } | null)?.paymentRequestId;
        if (prId) {
          await prisma.paymentRequest
            .update({ where: { id: prId }, data: { paidAt: new Date() } })
            .catch(() => {});
        }
      } else if (tx.status === 'failed' || tx.status === 'abandoned') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            failureReason: (tx.gateway_response ?? tx.message ?? 'payment failed').slice(0, 500),
          },
        });
      }
    }

    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
    const folio = await prisma.folio.findFirst({ where: { reservationId: reservation.id } });

    return ok(res, {
      reference: fresh!.reference,
      status: fresh!.status,
      amountMinor: fresh!.amountMinor,
      currency: fresh!.currency,
      postedToFolio: fresh!.postedToFolio,
      cardLast4: fresh!.cardLast4,
      cardBrand: fresh!.cardBrand,
      balance: folio ? Number(folio.balance) : null,
    });
  })
);

// ─── GET /:token/payments — payment history for this reservation ───

guestPayRouter.get(
  '/:token/payments',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const payments = await prisma.payment.findMany({
      where: { tenantId: reservation.tenantId, reservationId: reservation.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        reference: true,
        type: true,
        status: true,
        amountMinor: true,
        currency: true,
        channel: true,
        cardLast4: true,
        cardBrand: true,
        postedToFolio: true,
        failureReason: true,
        createdAt: true,
      },
    });

    return ok(res, { token: String(req.params.token), payments });
  })
);

// ─── GET /:token/requests — staff-issued payment requests (pay links) ───

guestPayRouter.get(
  '/:token/requests',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const requests = await prisma.paymentRequest.findMany({
      where: { tenantId: reservation.tenantId, reservationId: reservation.id },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        reference: true,
        amountMinor: true,
        currency: true,
        status: true,
        description: true,
        dueDate: true,
        hostedUrl: true,
        paidAt: true,
        createdAt: true,
      },
    });

    return ok(res, { token: String(req.params.token), requests });
  })
);

// ─── POST /:token/split — offer to split part of the folio with another guest ───

guestPayRouter.post(
  '/:token/split',
  payInitLimiter,
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = splitSchema.parse(req.body ?? {});

    const folio = await prisma.folio.findFirst({ where: { reservationId: reservation.id } });

    const split = await prisma.folioSplitRequest.create({
      data: {
        tenantId: reservation.tenantId,
        reservationId: reservation.id,
        folioId: folio?.id ?? null,
        fromGuestId: reservation.guestId,
        toName: input.toName,
        toEmail: input.toEmail ?? null,
        toPhone: input.toPhone ?? null,
        amount: input.amount,
        currency: 'ZAR',
        note: input.note ?? null,
      },
    });

    // Front-desk task so a human sends the pay link / sets up the second folio.
    await prisma.task
      .create({
        data: {
          tenantId: reservation.tenantId,
          propertyId: reservation.propertyId,
          department: 'front_desk',
          title: `Split bill — send ${fmt(input.amount)} pay link to ${input.toName}`,
          description: [
            `${reservation.guest.lastName}, ${reservation.guest.firstName} wants to split ${fmt(input.amount)} from folio ${folio?.id ?? 'n/a'} (${reservation.confirmationNumber}).`,
            input.toEmail ? `Email: ${input.toEmail}` : null,
            input.toPhone ? `Phone: ${input.toPhone}` : null,
            input.note ? `Note: ${input.note}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
          status: 'open',
          priority: 'normal',
          reservationId: reservation.id,
          dedupeKey: `split-offer-${split.id}`,
          source: 'guest_portal',
        },
      })
      .catch(() => {});

    logger.info(
      { reservationId: reservation.id, splitId: split.id, amount: input.amount },
      'guest portal split request created'
    );

    return ok(res, { id: split.id, status: split.status, amount: input.amount, currency: 'ZAR' });
  })
);

// ─── GET /:token/splits — split requests on this reservation ───

guestPayRouter.get(
  '/:token/splits',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const splits = await prisma.folioSplitRequest.findMany({
      where: { tenantId: reservation.tenantId, reservationId: reservation.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        toName: true,
        toEmail: true,
        toPhone: true,
        amount: true,
        currency: true,
        status: true,
        note: true,
        createdAt: true,
        respondedAt: true,
        appliedAt: true,
      },
    });

    return ok(res, { token: String(req.params.token), splits });
  })
);

// ─── POST /:token/split/:splitId/respond — accept / decline (portal token of same reservation) ───

guestPayRouter.post(
  '/:token/split/:splitId/respond',
  payInitLimiter,
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = respondSchema.parse(req.body ?? {});

    const split = await prisma.folioSplitRequest.findFirst({
      where: {
        id: String(req.params.splitId),
        tenantId: reservation.tenantId,
        reservationId: reservation.id,
      },
    });
    if (!split) throw new AppError(404, 'Split request not found', 'NOT_FOUND');
    if (split.status !== 'pending') {
      throw new AppError(409, `Split request is already ${split.status}`, 'ALREADY_RESPONDED');
    }

    const status = input.action === 'accept' ? 'accepted' : 'declined';

    const updated = await prisma.folioSplitRequest.update({
      where: { id: split.id },
      data: { status, respondedAt: new Date() },
    });

    if (input.action === 'accept') {
      // Folio.reservationId is unique — staff moves the charges to a second folio.
      await prisma.task
        .create({
          data: {
            tenantId: reservation.tenantId,
            propertyId: reservation.propertyId,
            department: 'front_desk',
            title: `Apply folio split — move ${fmt(Number(split.amount))} to ${split.toName}`,
            description: [
              `${split.toName} accepted the split for ${fmt(Number(split.amount))} (${reservation.confirmationNumber}).`,
              split.toEmail ? `Email: ${split.toEmail}` : null,
              split.toPhone ? `Phone: ${split.toPhone}` : null,
              input.note ? `Note: ${input.note}` : null,
              'Move the agreed folio items to a separate folio and send the pay link.',
            ]
              .filter(Boolean)
              .join('\n'),
            status: 'open',
            priority: 'high',
            reservationId: reservation.id,
            dedupeKey: `split-apply-${split.id}`,
            source: 'guest_portal',
          },
        })
        .catch(() => {});
    }

    return ok(res, { id: updated.id, status: updated.status });
  })
);

// ─── Errors → { error: { code, message } } (matches the portal client) ───

guestPayRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
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
  logger.warn({ err }, 'guest-pay unexpected error');
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
});
