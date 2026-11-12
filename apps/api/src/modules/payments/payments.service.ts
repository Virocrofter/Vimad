import { isDemoTenantId } from '../../common/demo-guard.js';
/* apps/api/src/modules/payments/payments.service.ts */
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { env } from '../../common/env.js';
import { skipTake, paginate, type PaginationInput } from '../../common/pagination.js';
import {
  initializeTransaction,
  verifyTransaction,
  chargeAuthorization,
  createRefund,
  newReference,
  type PaystackTransaction,
} from '../../common/paystack.js';
import { sendPaymentReceipt } from '../notifications/transactional.service.js';
// [A5] immutable SARS receipt on every successful posting
import { recordReceipt } from '../invoices/invoices.service.js';

// ─── Schemas ───

export const initializePaymentSchema = z.object({
  guestId: z.string().optional(),
  reservationId: z.string().optional(),
  folioId: z.string().optional(),
  email: z.string().email(),
  amountMinor: z.number().int().positive().max(100_000_000),
  type: z.enum(['deposit', 'balance_charge', 'no_show_fee']),
  idempotencyKey: z.string().min(8).max(128),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const chargeSavedCardSchema = z.object({
  paymentMethodId: z.string(),
  reservationId: z.string().optional(),
  folioId: z.string().optional(),
  amountMinor: z.number().int().positive().max(100_000_000),
  type: z.enum(['balance_charge', 'no_show_fee', 'deposit']),
  idempotencyKey: z.string().min(8).max(128),
});

export const refundPaymentSchema = z.object({
  amountMinor: z.number().int().positive().optional(), // omit = full refund
  reason: z.string().max(500).optional(),
});

export const vccChargeSchema = z.object({
  reservationId: z.string().optional(),
  folioId: z.string().optional(),
  ota: z.enum(['bookingcom', 'expedia', 'airbnb', 'agoda', 'tripcom', 'vrbo', 'other']),
  cardLast4: z.string().regex(/^\d{4}$/),
  expMonth: z.string().regex(/^\d{2}$/),
  expYear: z.string().regex(/^\d{2,4}$/),
  amountMinor: z.number().int().positive().max(100_000_000),
  currency: z.string().length(3).default('ZAR'),
  note: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(128),
});

export const listPaymentsQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  guestId: z.string().optional(),
  reservationId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});

const minorToMajor = (minor: number) => Math.round(minor) / 100;

// ─── Folio posting (single writer — service + job both call this) ───

export async function postPaymentToFolio(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== 'success' || payment.postedToFolio) return;

  const folio = await resolveFolio(payment.tenantId, payment.reservationId, payment.folioId);
  if (!folio) {
    logger.warn({ paymentId }, 'payment success but no folio to post to — skipping');
    return;
  }

  const amountMajor = new Prisma.Decimal(minorToMajor(payment.amountMinor));

  await prisma.$transaction(async (tx) => {
    // Atomic idempotency claim: a duplicate/late webhook processed by a
    // concurrent worker can only lose this flip — the loser returns without
    // touching the folio. Same-transaction, so a later failure rolls the
    // claim back and the next attempt can retry.
    const claim = await tx.payment.updateMany({
      where: { id: payment.id, postedToFolio: false },
      data: { postedToFolio: true, postedAt: new Date() },
    });
    if (claim.count === 0) return;

    await tx.folioItem.create({
      data: {
        folioId: folio.id,
        type: 'payment',
        description:
          payment.type === 'deposit'
            ? `Deposit via Paystack •••• ${payment.cardLast4 ?? ''} (${payment.reference})`
            : payment.type === 'no_show_fee'
              ? `No-show fee via Paystack (${payment.reference})`
              : `Card payment via Paystack •••• ${payment.cardLast4 ?? ''} (${payment.reference})`,
        amount: amountMajor,
        quantity: 1,
      },
    });

    const updated = await tx.folio.update({
      where: { id: folio.id },
      data: {
        totalPayments: { increment: amountMajor },
        balance: { decrement: amountMajor },
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { folioId: folio.id },
    });

    // depositPaid was a dead column — nothing wrote it, the room plan read it.
    // A posted deposit IS paid by definition; keep the reservation in sync here.
    if (payment.type === 'deposit' && payment.reservationId) {
      await tx.reservation.update({
        where: { id: payment.reservationId },
        data: { depositPaid: { increment: amountMajor } },
      });
    }

    logger.info(
      { paymentId, folioId: folio.id, balance: updated.balance.toString() },
      'payment posted to folio'
    );
  });

  // [A3] guest receipt — one trigger point for every flow that posts a
  // successful payment (desk card payments, saved-card charges, VCC captures,
  // and webhook settlements via payment.job). The transactional service
  // dedupes via email_logs, so idempotent re-runs never double-email.
  // Fire-and-forget: an email failure must never fail folio posting.
  const fresh = await prisma.payment.findUnique({
    where: { id: payment.id },
    select: { id: true, status: true, tenantId: true },
  });
  if (fresh?.status === 'success') {
    void sendPaymentReceipt(fresh.tenantId, fresh.id).catch((err) =>
      logger.warn({ err, paymentId: payment.id }, 'payment receipt email failed')
    );
    // [A5] immutable SARS receipt (PDF + guest email) — idempotent per payment
    void recordReceipt(payment.id).catch((err) =>
      logger.warn({ err, paymentId: payment.id }, 'receipt issuance failed')
    );
  }
}

export async function postRefundToFolio(paymentId: string, refundMinor: number): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment?.folioId) return;

  const amountMajor = new Prisma.Decimal(minorToMajor(refundMinor));

  await prisma.$transaction(async (tx) => {
    await tx.folioItem.create({
      data: {
        folioId: payment.folioId!,
        type: 'refund',
        description: `Refund to card •••• ${payment.cardLast4 ?? ''} (${payment.reference})`,
        amount: amountMajor.negated(),
        quantity: 1,
      },
    });
    await tx.folio.update({
      where: { id: payment.folioId! },
      data: {
        totalPayments: { decrement: amountMajor },
        balance: { increment: amountMajor },
      },
    });
  });
}

async function resolveFolio(
  tenantId: string,
  reservationId: string | null,
  folioId: string | null
) {
  if (folioId) {
    return prisma.folio.findFirst({ where: { id: folioId, tenantId } });
  }
  if (!reservationId) return null;

  const existing = await prisma.folio.findUnique({
    where: { reservationId },
  });
  if (existing) return existing;

  // Auto-create the folio the first time money arrives.
  return prisma.folio.create({
    data: { reservationId, tenantId, status: 'open' },
  });
}

// ─── Save tokenized card after a successful charge ───

async function maybeSaveCard(
  tenantId: string,
  payment: { guestId: string | null; authorizationCode: string | null },
  txData: PaystackTransaction
): Promise<void> {
  const auth = txData.authorization;
  if (!payment.guestId || !auth?.reusable || !auth.authorization_code) return;

  await prisma.guestPaymentMethod.upsert({
    where: {
      guestId_authorizationCode: {
        guestId: payment.guestId,
        authorizationCode: auth.authorization_code,
      },
    },
    update: {
      cardExpMonth: auth.exp_month,
      cardExpYear: auth.exp_year,
      isActive: true,
    },
    create: {
      tenantId,
      guestId: payment.guestId,
      paystackCustomerCode: txData.customer?.customer_code,
      authorizationCode: auth.authorization_code,
      cardType: auth.card_type || auth.brand,
      cardLast4: auth.last4 ?? '0000',
      cardExpMonth: auth.exp_month,
      cardExpYear: auth.exp_year,
      bank: auth.bank,
      channel: auth.channel,
      reusable: true,
    },
  });
}

function applyTxSuccess(
  payment: { id: string; guestId: string | null; authorizationCode: string | null },
  txData: PaystackTransaction
) {
  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'success',
      paystackId: BigInt(txData.id),
      authorizationCode: txData.authorization?.authorization_code ?? null,
      cardLast4: txData.authorization?.last4 ?? null,
      cardBrand: txData.authorization?.brand ?? null,
      channel: txData.channel ?? 'card',
      feeMinor: txData.fees ?? 0,
      failureReason: null,
    },
  });
}

// ─── Initialize (hosted checkout) ───

export async function initializePayment(
  tenantId: string,
  userId: string,
  input: z.infer<typeof initializePaymentSchema>
) {
  if (await isDemoTenantId(tenantId))
    throw new AppError(403, 'Payments are disabled in demo mode', 'PAYMENTS_DEMO_BLOCKED');
  if (input.reservationId) {
    const res = await prisma.reservation.findFirst({
      where: { id: input.reservationId, tenantId },
    });
    if (!res) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }
  if (input.guestId) {
    const guest = await prisma.guest.findFirst({ where: { id: input.guestId, tenantId } });
    if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  // Idempotency: same key returns the existing pending payment + checkout URL.
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return {
      reference: existing.reference,
      authorizationUrl: (existing.metadata as { authorizationUrl?: string } | null)
        ?.authorizationUrl,
    };
  }

  const reference = newReference();
  const callbackUrl = `${env.WEB_URL.replace(/\/$/, '')}/app/billing/payments?verified=1`;

  const checkout = await initializeTransaction({
    email: input.email,
    amountMinor: input.amountMinor,
    currency: env.PAYSTACK_CURRENCY,
    reference,
    callbackUrl,
    metadata: { tenantId, type: input.type, ...input.metadata },
  });

  await prisma.payment.create({
    data: {
      tenantId,
      propertyId: null,
      reservationId: input.reservationId ?? null,
      guestId: input.guestId ?? null,
      folioId: input.folioId ?? null,
      reference,
      amountMinor: input.amountMinor,
      currency: env.PAYSTACK_CURRENCY,
      type: input.type,
      status: 'pending',
      idempotencyKey: input.idempotencyKey,
      createdById: userId,
      metadata: { authorizationUrl: checkout.authorization_url, ...input.metadata },
    },
  });

  return { reference, authorizationUrl: checkout.authorization_url };
}

// ─── Verify (called from callback + webhook path) ───

export async function verifyPaymentByReference(tenantId: string, reference: string) {
  const payment = await prisma.payment.findFirst({ where: { reference, tenantId } });
  if (!payment) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
  if (payment.status === 'success' && payment.postedToFolio) return payment;

  const txData = await verifyTransaction(reference);

  if (txData.status === 'success' && txData.amount === payment.amountMinor) {
    const updated = await applyTxSuccess(payment, txData);
    await maybeSaveCard(tenantId, updated, txData);
    await postPaymentToFolio(payment.id);
    return prisma.payment.findUnique({ where: { id: payment.id } });
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: txData.status === 'failed' ? 'failed' : 'pending',
      failureReason: txData.gateway_response ?? txData.message ?? 'verification failed',
    },
  });
}

// ─── Charge a saved card (guest not present) ───

export async function chargeSavedCard(
  tenantId: string,
  userId: string,
  input: z.infer<typeof chargeSavedCardSchema>
) {
  const method = await prisma.guestPaymentMethod.findFirst({
    where: { id: input.paymentMethodId, tenantId, isActive: true },
    include: { guest: true },
  });
  if (!method) throw new AppError(404, 'Saved card not found', 'NOT_FOUND');
  if (!method.reusable) {
    throw new AppError(409, 'This card is not reusable (one-time token)', 'CARD_NOT_REUSABLE');
  }

  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return existing;

  const reference = newReference();
  const payment = await prisma.payment.create({
    data: {
      tenantId,
      reservationId: input.reservationId ?? null,
      folioId: input.folioId ?? null,
      guestId: method.guestId,
      reference,
      amountMinor: input.amountMinor,
      currency: env.PAYSTACK_CURRENCY,
      type: input.type,
      status: 'pending',
      idempotencyKey: input.idempotencyKey,
      createdById: userId,
    },
  });

  try {
    const txData = await chargeAuthorization({
      authorizationCode: method.authorizationCode,
      email: method.guest.email ?? `guest-${method.guestId}@vimad.local`,
      amountMinor: input.amountMinor,
      currency: env.PAYSTACK_CURRENCY,
      reference,
      metadata: { tenantId, type: input.type, paymentMethodId: method.id },
    });

    if (txData.status !== 'success') throw new Error(txData.gateway_response ?? 'charge failed');

    const updated = await applyTxSuccess(payment, txData);
    await postPaymentToFolio(payment.id);
    return updated;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed', failureReason: message.slice(0, 500) },
    });
  }
}

// ─── Refund ───

export async function refundPayment(
  tenantId: string,
  userId: string,
  paymentId: string,
  input: z.infer<typeof refundPaymentSchema>
) {
  const payment = await prisma.payment.findFirst({ where: { id: paymentId, tenantId } });
  if (!payment) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
  if (payment.status !== 'success' && payment.status !== 'partially_refunded') {
    throw new AppError(409, `Cannot refund a payment with status "${payment.status}"`, 'CONFLICT');
  }
  if (!payment.paystackId) {
    throw new AppError(409, 'Payment has no Paystack transaction id', 'NOT_REFUNDABLE');
  }

  const outstanding = payment.amountMinor - payment.refundedMinor;
  const refundMinor = input.amountMinor ?? outstanding;
  if (refundMinor > outstanding) {
    throw new AppError(
      400,
      `Refund exceeds outstanding amount (${outstanding} minor units)`,
      'VALIDATION_ERROR'
    );
  }

  const refund = await createRefund({
    transactionId: Number(payment.paystackId),
    amountMinor: refundMinor,
  });

  const newRefunded = payment.refundedMinor + refundMinor;
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      refundedMinor: newRefunded,
      status: newRefunded >= payment.amountMinor ? 'refunded' : 'partially_refunded',
      metadata: {
        ...(payment.metadata as object),
        lastRefund: {
          refundId: refund.refundId,
          amountMinor: refundMinor,
          by: userId,
          at: new Date().toISOString(),
          reason: input.reason,
        },
      } as Prisma.InputJsonValue,
    },
  });

  await postRefundToFolio(payment.id, refundMinor);
  return updated;
}

// ─── VCC capture (OTA virtual card — funds arrive from the OTA) ───

export async function recordVccCharge(
  tenantId: string,
  userId: string,
  input: z.infer<typeof vccChargeSchema>
) {
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) return existing;

  const reference = newReference('VCC');

  const payment = await prisma.payment.create({
    data: {
      tenantId,
      reservationId: input.reservationId ?? null,
      folioId: input.folioId ?? null,
      reference,
      amountMinor: input.amountMinor,
      currency: input.currency,
      type: 'vcc_charge',
      status: 'success',
      channel: 'vcc',
      cardLast4: input.cardLast4,
      cardBrand: `${input.ota.toUpperCase()} VCC`,
      idempotencyKey: input.idempotencyKey,
      createdById: userId,
      metadata: {
        ota: input.ota,
        expMonth: input.expMonth,
        expYear: input.expYear,
        note: input.note,
      },
    },
  });

  await postPaymentToFolio(payment.id);
  return payment;
}

// ─── Queries ───

export async function listPayments(
  tenantId: string,
  query: z.infer<typeof listPaymentsQuerySchema>
) {
  const { page, pageSize } = query as PaginationInput;
  const where: Prisma.PaymentWhereInput = {
    tenantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.guestId ? { guestId: query.guestId } : {}),
    ...(query.reservationId ? { reservationId: query.reservationId } : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          createdAt: {
            ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
            ...(query.dateTo ? { lte: new Date(query.dateTo + 'T23:59:59') } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { reference: { contains: query.search, mode: 'insensitive' } },
            { cardLast4: { contains: query.search } },
            { guest: { firstName: { contains: query.search, mode: 'insensitive' } } },
            { guest: { lastName: { contains: query.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        guest: { select: { id: true, firstName: true, lastName: true } },
        reservation: { select: { id: true, confirmationNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...skipTake({ page, pageSize }),
    }),
  ]);

  // Summary strip for the page header
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [collectedToday, refundedTotal, pendingCount] = await Promise.all([
    prisma.payment.aggregate({
      where: { tenantId, status: 'success', type: { not: 'refund' }, createdAt: { gte: dayAgo } },
      _sum: { amountMinor: true },
    }),
    prisma.payment.aggregate({
      where: { tenantId, refundedMinor: { gt: 0 } },
      _sum: { refundedMinor: true },
    }),
    prisma.payment.count({ where: { tenantId, status: 'pending' } }),
  ]);

  return {
    ...paginate(items, total, { page, pageSize }),
    summary: {
      collectedTodayMinor: collectedToday._sum.amountMinor ?? 0,
      refundedTotalMinor: refundedTotal._sum.refundedMinor ?? 0,
      pendingCount,
    },
  };
}

export async function listGuestPaymentMethods(tenantId: string, guestId: string) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  return prisma.guestPaymentMethod.findMany({
    where: { tenantId, guestId, isActive: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function deactivatePaymentMethod(tenantId: string, methodId: string) {
  const method = await prisma.guestPaymentMethod.findFirst({ where: { id: methodId, tenantId } });
  if (!method) throw new AppError(404, 'Saved card not found', 'NOT_FOUND');
  return prisma.guestPaymentMethod.update({
    where: { id: methodId },
    data: { isActive: false },
  });
}
