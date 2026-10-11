/* apps/api/src/modules/payments/payment-requests.service.ts
 * Deposit automation (RoomRaccoon parity): email a guest a hosted pay-now
 * link for their deposit, chase unpaid requests automatically, and
 * auto-cancel reservations whose deposit never arrived.
 */
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import {
  newReference,
  createPaystackPaymentRequest,
  paymentRequestHostedUrl,
  ensurePaystackCustomer,
} from '../../common/paystack.js';
import { sendEmail } from '../../jobs/email.queue.js';
import { logAuditEvent } from '../audit/audit.service.js';
import { paginate, skipTake, type PaginationInput } from '../../common/pagination.js';

// ─── Defaults (per-request overrides accepted on create) ───

export const DEFAULT_DEPOSIT_PERCENT = 50;
export const DEFAULT_DUE_HOURS = 72; // 3 days to pay
export const DEFAULT_REMINDER_OFFSETS_HOURS = [72, 24, 12]; // before due date

// ─── Schemas ───

export const createPaymentRequestSchema = z.object({
  reservationId: z.string().min(1),
  depositPercent: z.number().int().min(1).max(100).optional(),
  amountMinor: z.number().int().min(100).optional(), // explicit override of percent calc
  dueInHours: z
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .optional(),
  reminderOffsetsHours: z
    .array(
      z
        .number()
        .int()
        .min(1)
        .max(24 * 60)
    )
    .max(6)
    .optional(),
  autoCancelEnabled: z.boolean().optional(),
  autoCancelHoursBeforeArrival: z
    .number()
    .int()
    .min(0)
    .max(24 * 14)
    .optional(),
  description: z.string().max(300).optional(),
});

export const listPaymentRequestsQuerySchema = z.object({
  status: z.enum(['pending', 'sent', 'paid', 'expired', 'cancelled']).optional(),
  reservationId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});

// ─── Helpers ───

const HOUR_MS = 60 * 60 * 1000;

function nextReminderAt(dueDate: Date, offsetsHours: number[], alreadySent: number): Date | null {
  const sorted = [...offsetsHours].sort((a, b) => b - a);
  for (let i = alreadySent; i < sorted.length; i++) {
    const at = new Date(dueDate.getTime() - sorted[i] * HOUR_MS);
    if (at.getTime() > Date.now()) return at;
  }
  return null;
}

async function loadRequestOr404(tenantId: string, id: string) {
  const request = await prisma.paymentRequest.findFirst({
    where: { id, tenantId },
    include: {
      reservation: { include: { guest: true, property: { select: { name: true } } } },
      payment: true,
    },
  });
  if (!request) throw new AppError(404, 'Payment request not found', 'NOT_FOUND');
  return request;
}

async function deliverRequestEmail(request: {
  id: string;
  reference: string;
  hostedUrl: string | null;
  amountMinor: number;
  currency: string;
  dueDate: Date;
  description: string | null;
  remindersSent: number;
  reservation: {
    confirmationNumber: string;
    arrivalDate: Date;
    property: { name: string };
    guest: { firstName: string; lastName: string; email: string | null };
  } | null;
}): Promise<void> {
  const email = request.reservation?.guest.email;
  if (!email) {
    throw new AppError(
      400,
      'Guest has no email on file — add one before sending a payment request',
      'EMAIL_REQUIRED'
    );
  }
  if (!request.hostedUrl) {
    throw new AppError(409, 'Payment request has no hosted pay link yet', 'PAY_LINK_MISSING');
  }

  await sendEmail({
    to: email,
    subject: `Deposit payment for your stay at ${request.reservation?.property.name ?? 'our property'}`,
    template: 'payment-request',
    payload: {
      guestName: request.reservation?.guest.firstName ?? 'Guest',
      propertyName: request.reservation?.property.name ?? 'our property',
      confirmationNumber: request.reservation?.confirmationNumber ?? '',
      arrivalDate: request.reservation?.arrivalDate.toISOString().slice(0, 10) ?? '',
      amount: (request.amountMinor / 100).toFixed(2),
      currency: request.currency,
      dueDate: request.dueDate.toISOString().slice(0, 10),
      description: request.description ?? `Deposit to secure your reservation`,
      payUrl: request.hostedUrl,
      isReminder: request.remindersSent > 0,
    },
  });
}

// ─── CREATE ───

export async function createPaymentRequest(
  tenantId: string,
  createdById: string,
  input: z.infer<typeof createPaymentRequestSchema>
) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: input.reservationId, tenantId },
    include: { guest: true, folio: true, property: { select: { name: true, currency: true } } },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot request a deposit for a ${reservation.status} reservation`,
      'INVALID_STATUS'
    );
  }
  if (!reservation.guest.email) {
    throw new AppError(
      400,
      'Guest has no email on file — add one before sending a payment request',
      'EMAIL_REQUIRED'
    );
  }

  const baseMinor = reservation.folio
    ? Math.round(Number(reservation.folio.balance) * 100)
    : Math.round(Number(reservation.totalAmount) * 100);
  const depositPercent = input.depositPercent ?? DEFAULT_DEPOSIT_PERCENT;
  const computed = Math.round((baseMinor * depositPercent) / 100);
  const amountMinor = input.amountMinor ?? Math.max(100, computed);

  const dueDate = new Date(Date.now() + (input.dueInHours ?? DEFAULT_DUE_HOURS) * HOUR_MS);
  const offsets = input.reminderOffsetsHours ?? DEFAULT_REMINDER_OFFSETS_HOURS;
  const reference = newReference('PRQ');

  // Auto-cancel rule: cancel the booking N hours before arrival if still unpaid.
  const autoCancelEnabled = input.autoCancelEnabled ?? true; // RoomRaccoon default behaviour
  const autoCancelHours = input.autoCancelHoursBeforeArrival ?? 48;
  const autoCancelAt = autoCancelEnabled
    ? new Date(
        Math.min(
          dueDate.getTime(),
          new Date(reservation.arrivalDate).getTime() - autoCancelHours * HOUR_MS
        )
      )
    : null;

  const description =
    input.description ??
    `${depositPercent}% deposit — Reservation ${reservation.confirmationNumber}`;

  // 1. Reserve the Payment row now so the webhook (metadata.reference) lands
  //    on an existing record the moment the guest pays.
  const payment = await prisma.payment.create({
    data: {
      tenantId,
      reservationId: reservation.id,
      guestId: reservation.guestId,
      folioId: reservation.folio?.id,
      reference,
      amountMinor,
      currency: reservation.property.currency ?? 'ZAR',
      type: 'deposit',
      status: 'pending',
      idempotencyKey: reference,
    },
  });

  // 2. Create the request row (status pending until Paystack confirms).
  let request: any = await prisma.paymentRequest.create({
    data: {
      tenantId,
      reservationId: reservation.id,
      guestId: reservation.guestId,
      folioId: reservation.folio?.id,
      paymentId: payment.id,
      reference,
      amountMinor,
      currency: payment.currency,
      status: 'pending',
      description,
      depositPercent,
      dueDate,
      reminderOffsetsHours: offsets,
      nextReminderAt: nextReminderAt(dueDate, offsets, 0),
      autoCancelEnabled,
      autoCancelAt,
      createdById,
    },
  });

  // 3. Create the hosted Payment Request on Paystack. Roll back our rows on
  //    failure so we never have orphaned local state.
  try {
    // Payment Requests only accept an existing customer CODE — ensure first.
    const customerCode = await ensurePaystackCustomer(
      reservation.guest.email,
      `${reservation.guest.firstName} ${reservation.guest.lastName}`
    );

    const pr = await createPaystackPaymentRequest({
      customerEmail: customerCode,
      amountMinor,
      currency: payment.currency,
      dueDate,
      description,
      reference,
      metadata: {
        paymentRequestId: request.id,
        reservationId: reservation.id,
        confirmationNumber: reservation.confirmationNumber,
      },
    });

    const hostedUrl = paymentRequestHostedUrl(pr.offline_reference);
    request = await prisma.paymentRequest.update({
      where: { id: request.id },
      data: {
        paystackRequestCode: pr.request_code,
        paystackOfflineRef: pr.offline_reference,
        hostedUrl,
        status: 'sent',
        sentAt: new Date(),
      },
      include: {
        reservation: { include: { guest: true, property: { select: { name: true } } } },
        payment: true,
      },
    });
  } catch (err) {
    await prisma.paymentRequest.delete({ where: { id: request.id } }).catch(() => {});
    await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
    throw err;
  }

  // 4. Email the guest the pay-now link (queued → retried → DLQ if SMTP down).
  await deliverRequestEmail(request);

  await logAuditEvent({
    tenantId,
    action: 'payment_request.create',
    category: 'billing',
    label: 'Payment Request Sent',
    description: `${(amountMinor / 100).toFixed(2)} ${payment.currency} deposit request for ${reservation.confirmationNumber}`,
    entityType: 'payment_request',
    entityId: request.id,
    metadata: { reference, amountMinor, reservationId: reservation.id },
  });

  logger.info(
    { requestId: request.id, reference, amountMinor, reservationId: reservation.id },
    'payment request created and emailed'
  );

  return request;
}

// ─── LIST / GET ───

export async function listPaymentRequests(
  tenantId: string,
  query: PaginationInput & {
    status?: string;
    reservationId?: string;
    search?: string;
  }
) {
  const where = {
    tenantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.reservationId ? { reservationId: query.reservationId } : {}),
    ...(query.search
      ? {
          OR: [
            { reference: { contains: query.search, mode: 'insensitive' as const } },
            {
              reservation: {
                confirmationNumber: { contains: query.search, mode: 'insensitive' as const },
              },
            },
            {
              reservation: {
                guest: { firstName: { contains: query.search, mode: 'insensitive' as const } },
              },
            },
            {
              reservation: {
                guest: { lastName: { contains: query.search, mode: 'insensitive' as const } },
              },
            },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.paymentRequest.count({ where }),
    prisma.paymentRequest.findMany({
      where,
      include: {
        reservation: {
          select: {
            id: true,
            confirmationNumber: true,
            arrivalDate: true,
            departureDate: true,
            status: true,
            guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        payment: { select: { id: true, reference: true, status: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      ...skipTake(query),
    }),
  ]);

  return paginate(items, total, query);
}

export async function getPaymentRequest(tenantId: string, id: string) {
  return loadRequestOr404(tenantId, id);
}

// ─── SUMMARY (dashboard stat cards) ───

export async function getPaymentRequestSummary(tenantId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pendingAgg, overdueAgg, paidAgg, activeBase, paidBase] = await Promise.all([
    prisma.paymentRequest.aggregate({
      where: { tenantId, status: { in: ['pending', 'sent'] }, dueDate: { gte: now } },
      _count: true,
      _sum: { amountMinor: true },
    }),
    prisma.paymentRequest.aggregate({
      where: { tenantId, status: { in: ['pending', 'sent'] }, dueDate: { lt: now } },
      _count: true,
      _sum: { amountMinor: true },
    }),
    prisma.paymentRequest.aggregate({
      where: { tenantId, status: 'paid', paidAt: { gte: monthStart } },
      _count: true,
      _sum: { amountMinor: true },
    }),
    prisma.paymentRequest.count({
      where: { tenantId, status: { in: ['pending', 'sent', 'paid'] } },
    }),
    prisma.paymentRequest.count({ where: { tenantId, status: 'paid' } }),
  ]);

  return {
    pending: { count: pendingAgg._count, amountMinor: pendingAgg._sum.amountMinor ?? 0 },
    overdue: { count: overdueAgg._count, amountMinor: overdueAgg._sum.amountMinor ?? 0 },
    paidThisMonth: { count: paidAgg._count, amountMinor: paidAgg._sum.amountMinor ?? 0 },
    collectionRate: activeBase > 0 ? Math.round((paidBase / activeBase) * 100) : 0,
  };
}

// ─── SEND REMINDER (manual or scheduled) ───

export async function sendPaymentRequest(
  tenantId: string,
  id: string,
  opts: { force?: boolean } = {}
) {
  const request = await loadRequestOr404(tenantId, id);
  if (!['pending', 'sent'].includes(request.status)) {
    throw new AppError(409, `Cannot send a ${request.status} payment request`, 'INVALID_STATUS');
  }
  if (request.remindersSent >= request.reminderOffsetsHours.length && !opts.force) {
    throw new AppError(409, 'All scheduled reminders already sent', 'REMINDERS_EXHAUSTED');
  }

  await deliverRequestEmail(request);

  const remindersSent = request.remindersSent + 1;
  return prisma.paymentRequest.update({
    where: { id: request.id },
    data: {
      status: 'sent',
      sentAt: request.sentAt ?? new Date(),
      remindersSent,
      nextReminderAt: nextReminderAt(request.dueDate, request.reminderOffsetsHours, remindersSent),
    },
    include: {
      reservation: { include: { guest: true, property: { select: { name: true } } } },
      payment: true,
    },
  });
}

// ─── CANCEL ───

export async function cancelPaymentRequest(tenantId: string, id: string, note?: string) {
  const request = await loadRequestOr404(tenantId, id);
  if (!['pending', 'sent'].includes(request.status)) {
    throw new AppError(409, `Cannot cancel a ${request.status} payment request`, 'INVALID_STATUS');
  }

  // Void the reserved Payment so a late webhook can't post to the folio.
  if (request.paymentId) {
    await prisma.payment.updateMany({
      where: { id: request.paymentId, status: 'pending' },
      data: { status: 'cancelled', failureReason: note ?? 'payment request cancelled' },
    });
  }

  const updated = await prisma.paymentRequest.update({
    where: { id: request.id },
    data: { status: 'cancelled', nextReminderAt: null },
    include: {
      reservation: { include: { guest: true, property: { select: { name: true } } } },
      payment: true,
    },
  });

  await logAuditEvent({
    tenantId,
    action: 'payment_request.cancel',
    category: 'billing',
    label: 'Payment Request Cancelled',
    description: note ?? `Request ${request.reference} cancelled`,
    entityType: 'payment_request',
    entityId: request.id,
    severity: 'medium',
    metadata: { reference: request.reference, note },
  });

  return updated;
}

// ─── WEBHOOK SETTLEMENT (called from payment.job after folio posting) ───

export async function settlePaymentRequestForPayment(paymentId: string): Promise<void> {
  const request = await prisma.paymentRequest.findFirst({ where: { paymentId } });
  if (!request) return; // not a payment-request payment
  if (!['pending', 'sent'].includes(request.status)) return; // cancelled/expired — ignore

  await prisma.paymentRequest.update({
    where: { id: request.id },
    data: { status: 'paid', paidAt: new Date(), nextReminderAt: null },
  });

  await logAuditEvent({
    tenantId: request.tenantId,
    action: 'payment_request.paid',
    category: 'billing',
    label: 'Deposit Paid',
    description: `Payment request ${request.reference} settled`,
    entityType: 'payment_request',
    entityId: request.id,
    metadata: { reference: request.reference, amountMinor: request.amountMinor },
  });

  logger.info({ requestId: request.id, paymentId }, 'payment request settled');
}

// ─── EXPIRY + AUTO-CANCEL (called from the scheduler worker) ───

export async function expirePaymentRequest(requestId: string): Promise<void> {
  const request = await prisma.paymentRequest.findUnique({
    where: { id: requestId },
    include: { reservation: true },
  });
  if (!request || !['pending', 'sent'].includes(request.status)) return;

  let reservationCancelled = false;

  // Auto-cancel rule: unpaid deposit → cancel the booking.
  if (
    request.autoCancelEnabled &&
    request.reservation &&
    request.reservation.status === 'confirmed' &&
    request.autoCancelAt &&
    request.autoCancelAt.getTime() <= Date.now()
  ) {
    await prisma.reservation.update({
      where: { id: request.reservation.id },
      data: {
        status: 'cancelled',
        notes:
          `${request.reservation.notes ?? ''}\n[Auto-cancelled] Deposit unpaid — payment request ${request.reference} expired.`.trim(),
      },
    });
    reservationCancelled = true;

    await logAuditEvent({
      tenantId: request.tenantId,
      action: 'reservation.auto_cancel',
      category: 'reservation',
      label: 'Reservation Auto-Cancelled',
      description: `Unpaid deposit — request ${request.reference} expired`,
      entityType: 'reservation',
      entityId: request.reservation.id,
      severity: 'high',
      metadata: { reference: request.reference },
    });
  }

  if (request.paymentId) {
    await prisma.payment.updateMany({
      where: { id: request.paymentId, status: 'pending' },
      data: { status: 'failed', failureReason: 'payment request expired' },
    });
  }

  await prisma.paymentRequest.update({
    where: { id: request.id },
    data: { status: 'expired', nextReminderAt: null, reservationCancelled },
  });

  logger.info({ requestId: request.id, reservationCancelled }, 'payment request expired');
}
