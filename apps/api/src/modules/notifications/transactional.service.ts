/* apps/api/src/modules/notifications/transactional.service.ts
 * A3 — transactional email for real. Every guest touchpoint is a real,
 * logged email: confirmation on create, pre-arrival 24h out, receipt on
 * payment settlement, folio on demand. All sends are deduped via email_logs
 * unless force=true, and every send is visible in the Email Center.
 */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { sendEmail } from '../../jobs/email.queue.js';
import { paginate, skipTake, type PaginationInput } from '../../common/pagination.js';

// ─── Helpers ───

const money = (minor: number | null | undefined, currency: string) =>
  `${currency === 'ZAR' ? 'R' : currency} ${((minor ?? 0) / 100).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const day = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit',
  capture: 'Card capture',
  refund: 'Refund',
  payment: 'Payment',
};

/** Returns true if a queued/sent log already exists for this template + entity. */
async function alreadyEmailed(
  tenantId: string,
  template: string,
  relatedType: string,
  relatedId: string
): Promise<boolean> {
  const hit = await prisma.emailLog.findFirst({
    where: { tenantId, template, relatedType, relatedId, status: { in: ['queued', 'sent'] } },
    select: { id: true },
  });
  return !!hit;
}

// ─── 1. RESERVATION CONFIRMATION (on create / resend) ───

export async function sendReservationConfirmation(
  tenantId: string,
  reservationId: string,
  opts: { force?: boolean } = {}
) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId },
    include: {
      guest: true,
      property: { select: { name: true } },
      folio: { select: { balance: true } },
      stays: {
        include: { room: { select: { number: true, roomType: { select: { name: true } } } } },
        take: 1,
      },
    },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  if (!reservation.guest.email) {
    throw new AppError(400, 'Guest has no email on file', 'EMAIL_REQUIRED');
  }
  if (
    !opts.force &&
    (await alreadyEmailed(tenantId, 'reservation-confirmation', 'reservation', reservation.id))
  ) {
    throw new AppError(409, 'Confirmation already sent — use resend to send again', 'DUPLICATE');
  }

  const stay = reservation.stays[0];
  const roomLabel = stay
    ? `${stay.room.number}${stay.room.roomType?.name ? ` — ${stay.room.roomType.name}` : ''}`
    : 'To be assigned at check-in';
  const partyLabel =
    `${reservation.adults} adult${reservation.adults === 1 ? '' : 's'}` +
    (reservation.children > 0
      ? `, ${reservation.children} child${reservation.children === 1 ? '' : 'ren'}`
      : '');

  await sendEmail({
    to: reservation.guest.email,
    subject: `Reservation confirmed — ${reservation.property.name} (${reservation.confirmationNumber})`,
    template: 'reservation-confirmation',
    payload: {
      guestName: reservation.guest.firstName,
      guestLastName: reservation.guest.lastName,
      propertyName: reservation.property.name,
      confirmationNumber: reservation.confirmationNumber,
      arrivalDate: day(reservation.arrivalDate),
      departureDate: day(reservation.departureDate),
      roomLabel,
      partyLabel,
      balanceLabel: money(
        Math.round(Number(reservation.folio?.balance ?? reservation.totalAmount) * 100),
        'ZAR'
      ),
      cancelUrl: `${process.env.WEB_URL}/booking/cancel?c=${reservation.confirmationNumber}`,
    },
    tenantId,
    relatedType: 'reservation',
    relatedId: reservation.id,
  });

  logger.info({ reservationId }, 'reservation confirmation queued');
  return { queued: true };
}

// ─── 2. PRE-ARRIVAL (24h before check-in — idempotent via preArrivalSentAt) ───

export async function sendPreArrival(tenantId: string, reservationId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId },
    include: {
      guest: true,
      property: { select: { name: true } },
      folio: { select: { balance: true } },
    },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  if (reservation.status !== 'confirmed') return { skipped: reservation.status };
  if (reservation.preArrivalSentAt) return { skipped: 'already-sent' };
  if (!reservation.guest.email) return { skipped: 'no-email' };
  if (new Date(reservation.arrivalDate).getTime() <= Date.now()) {
    return { skipped: 'arrival-passed' };
  }

  await sendEmail({
    to: reservation.guest.email,
    subject: `See you soon — ${reservation.property.name} (${reservation.confirmationNumber})`,
    template: 'pre-arrival',
    payload: {
      guestName: reservation.guest.firstName,
      propertyName: reservation.property.name,
      confirmationNumber: reservation.confirmationNumber,
      arrivalDate: day(reservation.arrivalDate),
      balanceLabel: money(Math.round(Number(reservation.folio?.balance ?? 0) * 100), 'ZAR'),
    },
    tenantId,
    relatedType: 'reservation',
    relatedId: reservation.id,
  });

  // Mark immediately so the hourly scan and manual sends can't double-fire,
  // even if the worker is briefly down (the email is already queued + logged).
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { preArrivalSentAt: new Date() },
  });

  logger.info({ reservationId }, 'pre-arrival email queued');
  return { queued: true };
}

// ─── 3. PAYMENT RECEIPT (on successful settlement — called from payment.job) ───

export async function sendPaymentReceipt(
  tenantId: string,
  paymentId: string,
  opts: { force?: boolean } = {}
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId },
    include: {
      reservation: {
        include: { guest: true, property: { select: { name: true } } },
      },
      folio: { select: { balance: true } },
    },
  });
  if (!payment) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
  if (payment.status !== 'success') return { skipped: payment.status };
  const guestEmail = payment.reservation?.guest.email;
  if (!guestEmail) return { skipped: 'no-email' };
  if (!opts.force && (await alreadyEmailed(tenantId, 'payment-receipt', 'payment', payment.id))) {
    return { skipped: 'already-sent' };
  }

  await sendEmail({
    to: guestEmail,
    subject: `Payment received — ${payment.reservation?.property.name ?? 'your stay'} (${payment.reference})`,
    template: 'payment-receipt',
    payload: {
      guestName: payment.reservation?.guest.firstName ?? 'Guest',
      propertyName: payment.reservation?.property.name ?? 'our property',
      confirmationNumber: payment.reservation?.confirmationNumber ?? '',
      amount: (payment.amountMinor / 100).toFixed(2),
      currency: payment.currency,
      typeLabel: TYPE_LABELS[payment.type] ?? payment.type,
      reference: payment.reference,
      paidAt: day(payment.postedAt ?? payment.createdAt),
      balanceLabel: money(Math.round(Number(payment.folio?.balance ?? 0) * 100), payment.currency),
    },
    tenantId,
    relatedType: 'payment',
    relatedId: payment.id,
  });

  logger.info({ paymentId }, 'payment receipt queued');
  return { queued: true };
}

// ─── 4. FOLIO ON DEMAND (from reservation detail — "Email Folio") ───

export async function sendFolioEmail(tenantId: string, reservationId: string, toOverride?: string) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId },
    include: {
      guest: true,
      property: { select: { name: true } },
      folio: {
        include: {
          items: { orderBy: { postedAt: 'asc' }, take: 100 },
        },
      },
    },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  if (!reservation.folio) throw new AppError(409, 'Reservation has no folio yet', 'NO_FOLIO');

  const to = toOverride || reservation.guest.email;
  if (!to) throw new AppError(400, 'No recipient email — guest has none on file', 'EMAIL_REQUIRED');

  const currency = 'ZAR';
  const itemsHtml = reservation.folio.items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;">${day(item.postedAt)}</td>
          <td style="padding:6px 0;">${item.description}</td>
          <td style="padding:6px 0;text-align:right;font-family:monospace;">${money(Math.round(Number(item.amount) * 100), currency)}</td>
        </tr>`
    )
    .join('');

  await sendEmail({
    to,
    subject: `Your folio — ${reservation.property.name} (${reservation.confirmationNumber})`,
    template: 'folio-email',
    payload: {
      guestName: reservation.guest.firstName,
      propertyName: reservation.property.name,
      confirmationNumber: reservation.confirmationNumber,
      itemsHtml,
      balanceLabel: money(Math.round(Number(reservation.folio.balance) * 100), currency),
    },
    tenantId,
    relatedType: 'reservation',
    relatedId: reservation.id,
  });

  logger.info({ reservationId, to }, 'folio email queued');
  return { queued: true };
}

// ─── EMAIL CENTER: list logs + resend ───

export async function listEmailLogs(
  tenantId: string,
  query: PaginationInput & {
    status?: string;
    template?: string;
    search?: string;
  }
) {
  const where = {
    tenantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.template ? { template: query.template } : {}),
    ...(query.search
      ? {
          OR: [
            { to: { contains: query.search, mode: 'insensitive' as const } },
            { subject: { contains: query.search, mode: 'insensitive' as const } },
            { relatedId: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.emailLog.count({ where }),
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...skipTake(query),
    }),
  ]);

  return paginate(items, total, query);
}

export async function resendEmailLog(tenantId: string, id: string) {
  const log = await prisma.emailLog.findFirst({ where: { id, tenantId } });
  if (!log) throw new AppError(404, 'Email log not found', 'NOT_FOUND');

  await sendEmail({
    to: log.to,
    subject: log.subject,
    template: log.template as Parameters<typeof sendEmail>[0]['template'],
    payload: (log.payload as Record<string, unknown>) ?? {},
    tenantId,
    relatedType: log.relatedType ?? undefined,
    relatedId: log.relatedId ?? undefined,
  });

  return { queued: true };
}
