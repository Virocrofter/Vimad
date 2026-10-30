/* apps/api/src/modules/guest-portal/guest-portal.service.ts */
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { env } from '../../common/env.js';

export const verifyIdentitySchema = z.object({
  confirmationNumber: z.string(),
  lastName: z.string(),
  documentNumber: z.string().optional(),
});

export const checkInSchema = z.object({
  token: z.string(),
  estimatedArrivalTime: z.string().optional(),
  idDocument: z.string().optional(),
  signature: z.string().optional(),
});

export const serviceRequestSchema = z.object({
  token: z.string(),
  type: z.enum(['housekeeping', 'maintenance', 'concierge', 'amenity']),
  message: z.string(),
  requestedAt: z.string().optional(),
});

export const modifyBookingSchema = z.object({
  token: z.string(),
  arrivalDate: z.string(),
  departureDate: z.string(),
  adults: z.number().int().min(1).optional(),
  children: z.number().int().min(0).optional(),
});

export const cancelBookingSchema = z.object({
  token: z.string(),
  reason: z.string().max(500).optional(),
});

export const addDocumentSchema = z.object({
  token: z.string(),
  type: z.string().min(2).max(50),
  number: z.string().min(1).max(100),
});

export type ModifyBookingInput = z.infer<typeof modifyBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type AddDocumentInput = z.infer<typeof addDocumentSchema>;

export type VerifyIdentityInput = z.infer<typeof verifyIdentitySchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

// ─── Portal access tokens ───
// Stateless JWT scoped to a single reservation. Expires at end of the
// departure day so a guest can't use the portal after their stay.

const PORTAL_TOKEN_SCOPE = 'guest-portal';

interface PortalTokenPayload {
  scope: typeof PORTAL_TOKEN_SCOPE;
  reservationId: string;
  guestId: string;
  tenantId: string;
}

function issuePortalToken(reservation: {
  id: string;
  guestId: string;
  tenantId: string;
  departureDate: Date;
}): string {
  const departureEnd = new Date(reservation.departureDate);
  departureEnd.setHours(23, 59, 59, 999);
  const expiresInSeconds = Math.max(3600, Math.floor((departureEnd.getTime() - Date.now()) / 1000));

  return jwt.sign(
    {
      scope: PORTAL_TOKEN_SCOPE,
      reservationId: reservation.id,
      guestId: reservation.guestId,
      tenantId: reservation.tenantId,
    } satisfies PortalTokenPayload,
    env.JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );
}

export async function resolveToken(token: string) {
  let payload: PortalTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as PortalTokenPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired portal token', 'PORTAL_TOKEN_INVALID');
  }

  if (payload.scope !== PORTAL_TOKEN_SCOPE) {
    throw new AppError(401, 'Invalid portal token scope', 'PORTAL_TOKEN_INVALID');
  }

  const reservation = await prisma.reservation.findFirst({
    where: { id: payload.reservationId, tenantId: payload.tenantId },
    include: {
      guest: true,
      property: { select: { id: true, name: true } },
      roomType: { select: { name: true } },
      stays: {
        include: { room: { select: { id: true, number: true } } },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }

  return reservation;
}

function dateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─── Lookup (step 1: does this reservation exist?) ───

export async function lookupReservation(confirmationNumber: string, lastName: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { confirmationNumber },
    include: { guest: { select: { firstName: true, lastName: true } } },
  });

  // Constant-shape response whether found or not — don't leak which
  // confirmation numbers exist.
  if (!reservation || reservation.guest.lastName.toLowerCase() !== lastName.trim().toLowerCase()) {
    return {
      found: false,
      confirmationNumber,
      guestName: '',
      arrivalDate: '',
      departureDate: '',
    };
  }

  return {
    found: true,
    confirmationNumber: reservation.confirmationNumber,
    guestName: `${reservation.guest.lastName}, ${reservation.guest.firstName}`,
    arrivalDate: dateOnly(reservation.arrivalDate),
    departureDate: dateOnly(reservation.departureDate),
  };
}

// ─── Verify identity (step 2: issue portal token) ───

export async function verifyIdentity(input: VerifyIdentityInput) {
  const reservation = await prisma.reservation.findUnique({
    where: { confirmationNumber: input.confirmationNumber },
    include: { guest: { include: { documents: true } } },
  });

  if (
    !reservation ||
    reservation.guest.lastName.toLowerCase() !== input.lastName.trim().toLowerCase()
  ) {
    throw new AppError(401, 'Identity verification failed', 'VERIFY_FAILED');
  }

  if (['cancelled', 'no_show'].includes(reservation.status)) {
    throw new AppError(
      403,
      `Reservation is ${reservation.status} — portal access not available`,
      'RESERVATION_INACTIVE'
    );
  }

  // Optional document check: match against passport number or any stored
  // guest document. Compared in constant time to avoid leaking partial matches.
  if (input.documentNumber) {
    const candidate = input.documentNumber.trim();
    const known = [
      reservation.guest.passportNumber,
      ...reservation.guest.documents.map((d) => d.number),
    ].filter((n): n is string => Boolean(n));

    const matches = known.some((n) => {
      const a = Buffer.from(n);
      const b = Buffer.from(candidate);
      return a.length === b.length && timingSafeEqual(a, b);
    });

    if (!matches) {
      logger.warn({ reservationId: reservation.id }, 'guest portal document verification failed');
      throw new AppError(401, 'Identity verification failed', 'VERIFY_FAILED');
    }
  }

  const token = issuePortalToken(reservation);

  logger.info(
    { reservationId: reservation.id, guestId: reservation.guestId },
    'guest portal token issued'
  );

  return {
    verified: true,
    token,
    guestName: `${reservation.guest.lastName}, ${reservation.guest.firstName}`,
  };
}

// ─── Stay details ───

export async function getStayDetails(token: string) {
  const reservation = await resolveToken(token);
  const room = reservation.stays[0]?.room;

  return {
    token,
    guestName: `${reservation.guest.lastName}, ${reservation.guest.firstName}`,
    roomNumber: room?.number ?? 'Unassigned',
    arrivalDate: dateOnly(reservation.arrivalDate),
    departureDate: dateOnly(reservation.departureDate),
    checkedIn: reservation.status === 'checked_in',
    digitalKeyReady: reservation.status === 'checked_in' && Boolean(room),
    status: reservation.status,
    confirmationNumber: reservation.confirmationNumber,
    propertyName: reservation.property.name,
    roomTypeName: reservation.roomType?.name ?? null,
    nights: reservation.nights,
    adults: reservation.adults,
    children: reservation.children,
    totalAmount: Number(reservation.totalAmount),
    balance: Number(reservation.balance),
    currency: 'ZAR',
  };
}

// ─── Check-in ───

export async function submitCheckIn(input: CheckInInput) {
  const reservation = await resolveToken(input.token);

  if (reservation.status === 'checked_in') {
    return {
      success: true,
      token: input.token,
      checkedIn: true,
      estimatedArrivalTime: input.estimatedArrivalTime,
    };
  }

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot check in a reservation with status "${reservation.status}"`,
      'CHECKIN_NOT_ALLOWED'
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'checked_in',
        notes: input.estimatedArrivalTime
          ? [reservation.notes, `ETA: ${input.estimatedArrivalTime}`].filter(Boolean).join('\n')
          : reservation.notes,
      },
    });

    if (input.idDocument) {
      await tx.guestDocument.create({
        data: {
          guestId: reservation.guestId,
          type: 'id_card',
          number: input.idDocument,
        },
      });
    }
  });

  logger.info({ reservationId: reservation.id }, 'guest checked in via portal');

  return {
    success: true,
    token: input.token,
    checkedIn: true,
    estimatedArrivalTime: input.estimatedArrivalTime,
  };
}

// ─── Digital key ───
// Deterministic HMAC key code bound to reservation + room + stay dates.
// No key material is stored; rotating JWT_SECRET invalidates all keys.

export async function getDigitalKey(token: string) {
  const reservation = await resolveToken(token);

  if (reservation.status !== 'checked_in') {
    throw new AppError(409, 'Digital key is available after check-in', 'KEY_NOT_READY');
  }

  const room = reservation.stays[0]?.room;
  if (!room) {
    throw new AppError(409, 'No room assigned yet — digital key unavailable', 'KEY_NOT_READY');
  }

  const keyMaterial = [
    reservation.id,
    room.id,
    dateOnly(reservation.arrivalDate),
    dateOnly(reservation.departureDate),
  ].join('|');

  const keyCode = createHmac('sha256', env.JWT_SECRET)
    .update(keyMaterial)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();

  const activeFrom = new Date(reservation.arrivalDate);
  activeFrom.setHours(15, 0, 0, 0); // standard check-in time
  const activeUntil = new Date(reservation.departureDate);
  activeUntil.setHours(11, 0, 0, 0); // standard check-out time

  logger.info({ reservationId: reservation.id, roomId: room.id }, 'digital key issued via portal');

  return {
    token,
    keyCode,
    activeFrom: activeFrom.toISOString(),
    activeUntil: activeUntil.toISOString(),
  };
}

// ─── Service requests ───

export async function requestService(input: ServiceRequestInput) {
  const reservation = await resolveToken(input.token);
  const room = reservation.stays[0]?.room;

  // Housekeeping/maintenance become real tasks on the housekeeping board when
  // the underlying Prisma model is available. If that model is not generated in
  // the current client, fall back to recording the request on the reservation.
  if ((input.type === 'housekeeping' || input.type === 'maintenance') && room) {
    const housekeepingTaskModel = (prisma as any).housekeepingTask;

    if (housekeepingTaskModel) {
      const task = await housekeepingTaskModel.create({
        data: {
          tenantId: reservation.tenantId,
          propertyId: reservation.propertyId,
          roomId: room.id,
          type: input.type === 'maintenance' ? 'maintenance' : 'cleaning',
          priority: 'normal',
          status: 'pending',
          notes: `Guest portal request: ${input.message}`,
          scheduledAt: input.requestedAt ? new Date(input.requestedAt) : new Date(),
        },
      });

      return {
        id: task.id,
        token: input.token,
        type: input.type,
        message: input.message,
        status: 'received',
        createdAt: task.createdAt.toISOString(),
      };
    }
  }

  // Concierge/amenity (or unassigned room): record on the reservation so
  // front-desk staff can action it.
  const note = `[${new Date().toISOString()}] Guest ${input.type} request: ${input.message}`;
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { notes: [reservation.notes, note].filter(Boolean).join('\n') },
  });

  return {
    id: `req-${reservation.id.slice(-8)}`,
    token: input.token,
    type: input.type,
    message: input.message,
    status: 'received',
    createdAt: new Date().toISOString(),
  };
}

// ─── Preferences ───

export async function updatePreferences(token: string, preferences: Record<string, string>) {
  const reservation = await resolveToken(token);

  await prisma.$transaction(
    Object.entries(preferences).map(([key, value]) =>
      prisma.guestPreference.upsert({
        where: {
          // GuestPreference has no natural unique key — emulate upsert with
          // delete+create guarded in the transaction below instead.
          id: `${reservation.guestId}-portal-${key}`,
        },
        create: {
          id: `${reservation.guestId}-portal-${key}`,
          guestId: reservation.guestId,
          category: 'portal',
          key,
          value,
        },
        update: { value },
      })
    )
  );

  return {
    token,
    preferences,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Preferences (read) ───

export async function getGuestPreferences(token: string) {
  const reservation = await resolveToken(token);

  const preferences = await prisma.guestPreference.findMany({
    where: { guestId: reservation.guestId },
    select: { key: true, value: true },
  });

  return {
    token,
    preferences: Object.fromEntries(preferences.map((p) => [p.key, p.value])),
  };
}

// ─── Documents (guest vault) ───

export async function getGuestDocuments(token: string) {
  const reservation = await resolveToken(token);

  const documents = await prisma.guestDocument.findMany({
    where: { guestId: reservation.guestId },
    select: {
      id: true,
      type: true,
      number: true,
      issuedBy: true,
      issueDate: true,
      expiryDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    token,
    documents: documents.map((d) => ({
      ...d,
      issueDate: d.issueDate ? dateOnly(d.issueDate) : null,
      expiryDate: d.expiryDate ? dateOnly(d.expiryDate) : null,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

export async function addGuestDocument(input: AddDocumentInput) {
  const reservation = await resolveToken(input.token);

  const document = await prisma.guestDocument.create({
    data: {
      guestId: reservation.guestId,
      type: input.type,
      number: input.number,
    },
    select: { id: true, type: true, number: true, createdAt: true },
  });

  logger.info(
    { reservationId: reservation.id, guestId: reservation.guestId, type: input.type },
    'guest document added via portal'
  );

  return {
    token: input.token,
    document: { ...document, createdAt: document.createdAt.toISOString() },
  };
}

// ─── Booking: modify & cancel ───

function computeCancellationQuote(reservation: {
  arrivalDate: Date;
  totalAmount: unknown;
  status: string;
}) {
  const now = new Date();
  const arrival = new Date(reservation.arrivalDate);
  const hoursBefore = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);
  const total = Number(reservation.totalAmount);

  if (hoursBefore >= 72) {
    return {
      type: 'free',
      fee: 0,
      feePercent: 0,
      label: 'Free Cancellation',
      description: 'Cancel at least 72 hours before arrival for a full refund.',
    };
  }
  if (hoursBefore >= 24) {
    return {
      type: 'partial',
      fee: Math.round(total * 0.5 * 100) / 100,
      feePercent: 50,
      label: 'Partial Refund',
      description: 'Cancel at least 24 hours before arrival for a 50% refund.',
    };
  }
  return {
    type: 'non-refundable',
    fee: total,
    feePercent: 100,
    label: 'Non-Refundable',
    description: 'Cancellations within 24 hours of arrival are non-refundable.',
  };
}

export async function getCancelQuote(token: string) {
  const reservation = await resolveToken(token);

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot cancel a reservation with status "${reservation.status}" — contact the front desk`,
      'CANCEL_NOT_ALLOWED'
    );
  }

  const folio = await prisma.folio.findUnique({
    where: { reservationId: reservation.id },
    select: { totalPayments: true },
  });
  const paid = folio ? Number(folio.totalPayments) : 0;
  const quote = computeCancellationQuote(reservation);

  return {
    token,
    confirmationNumber: reservation.confirmationNumber,
    status: reservation.status,
    policy: quote,
    paid: Math.round(paid * 100) / 100,
    refund: Math.max(0, Math.round((paid - quote.fee) * 100) / 100),
    arrivalDate: dateOnly(reservation.arrivalDate),
    departureDate: dateOnly(reservation.departureDate),
  };
}

export async function modifyBooking(input: ModifyBookingInput) {
  const reservation = await resolveToken(input.token);

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot modify a reservation with status "${reservation.status}" — contact the front desk`,
      'MODIFY_NOT_ALLOWED'
    );
  }

  const arrival = new Date(input.arrivalDate);
  const departure = new Date(input.departureDate);
  if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) {
    throw new AppError(400, 'Invalid dates', 'VALIDATION_ERROR');
  }
  if (departure <= arrival) {
    throw new AppError(400, 'Check-out must be after check-in', 'VALIDATION_ERROR');
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (arrival < today) {
    throw new AppError(400, 'Check-in cannot be in the past', 'VALIDATION_ERROR');
  }

  const nights = Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
  const oldTotal = Number(reservation.totalAmount);
  const nightlyRate = reservation.nights > 0 ? oldTotal / reservation.nights : oldTotal;
  const newTotal = Math.round(nightlyRate * nights * 100) / 100;
  const delta = Math.round((newTotal - oldTotal) * 100) / 100;
  const newBalance = Math.max(0, Math.round((Number(reservation.balance) + delta) * 100) / 100);

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      arrivalDate: arrival,
      departureDate: departure,
      nights,
      adults: input.adults ?? reservation.adults,
      children: input.children ?? reservation.children,
      totalAmount: newTotal,
      balance: newBalance,
      notes: [
        reservation.notes,
        `[${new Date().toISOString()}] Guest portal modification: ${dateOnly(
          reservation.arrivalDate
        )}→${dateOnly(arrival)}, ${dateOnly(reservation.departureDate)}→${dateOnly(
          departure
        )}${delta !== 0 ? `, total ${oldTotal}→${newTotal} (${delta > 0 ? '+' : ''}${delta})` : ''}`,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  });

  logger.info(
    { reservationId: reservation.id, delta, nights },
    'guest modified reservation via portal'
  );

  return {
    token: input.token,
    confirmationNumber: reservation.confirmationNumber,
    arrivalDate: dateOnly(arrival),
    departureDate: dateOnly(departure),
    nights,
    adults: input.adults ?? reservation.adults,
    children: input.children ?? reservation.children,
    previousTotal: oldTotal,
    totalAmount: newTotal,
    delta,
    balance: newBalance,
    currency: 'ZAR',
  };
}

export async function cancelBooking(input: CancelBookingInput) {
  const reservation = await resolveToken(input.token);

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot cancel a reservation with status "${reservation.status}" — contact the front desk`,
      'CANCEL_NOT_ALLOWED'
    );
  }

  const quote = computeCancellationQuote(reservation);

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status: 'cancelled',
      notes: [
        reservation.notes,
        `[${new Date().toISOString()}] Cancelled by guest via portal${
          input.reason ? ` — reason: ${input.reason}` : ''
        } (${quote.label})`,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  });

  logger.info(
    { reservationId: reservation.id, policy: quote.type },
    'guest cancelled reservation via portal'
  );

  return {
    token: input.token,
    confirmationNumber: reservation.confirmationNumber,
    status: 'cancelled',
    policy: quote,
    cancelledAt: new Date().toISOString(),
  };
}

// ─── Billing: guest-safe folio ───

export async function getGuestFolio(token: string) {
  const reservation = await resolveToken(token);

  const folio = await prisma.folio.findUnique({
    where: { reservationId: reservation.id },
    include: {
      items: { orderBy: { postedAt: 'desc' } },
      payments: { orderBy: { createdAt: 'desc' } },
      taxInvoices: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!folio) {
    return {
      token,
      confirmationNumber: reservation.confirmationNumber,
      folio: null,
      items: [],
      payments: [],
      invoices: [],
      roomRate: {
        nights: reservation.nights,
        total: Number(reservation.totalAmount),
        currency: 'ZAR',
      },
    };
  }

  const lodgingItems = folio.items.filter((i) => i.type === 'lodging');
  const roomRateTotal = lodgingItems.reduce((s, i) => s + Number(i.amount) * i.quantity, 0);

  return {
    token,
    confirmationNumber: reservation.confirmationNumber,
    folio: {
      id: folio.id,
      status: folio.status,
      totalCharges: Number(folio.totalCharges),
      totalPayments: Number(folio.totalPayments),
      balance: Number(folio.balance),
      currency: 'ZAR',
      closedAt: folio.closedAt ? folio.closedAt.toISOString() : null,
    },
    items: folio.items.map((i) => ({
      id: i.id,
      type: i.type,
      description: i.description,
      amount: Number(i.amount),
      quantity: i.quantity,
      postedAt: i.postedAt.toISOString(),
    })),
    payments: folio.payments.map((p) => ({
      id: p.id,
      reference: p.reference,
      channel: p.channel,
      cardLast4: p.cardLast4,
      cardBrand: p.cardBrand,
      amount: p.amountMinor / 100,
      currency: p.currency,
      type: p.type,
      createdAt: p.createdAt.toISOString(),
    })),
    invoices: folio.taxInvoices.map((t) => ({
      id: t.id,
      number: t.number,
      type: t.type,
      status: t.status,
      currency: t.currency,
      totalInclVat: Number(t.totalInclVat),
      createdAt: t.createdAt.toISOString(),
    })),
    roomRate: {
      nights: reservation.nights,
      total: Math.round(roomRateTotal * 100) / 100,
      currency: 'ZAR',
    },
  };
}

export async function getGuestInvoice(token: string, invoiceId: string) {
  const reservation = await resolveToken(token);

  const invoice = await prisma.taxInvoice.findFirst({
    where: { id: invoiceId, reservationId: reservation.id, tenantId: reservation.tenantId },
    select: {
      id: true,
      number: true,
      type: true,
      status: true,
      currency: true,
      subtotalExVat: true,
      totalInclVat: true,
      vatAmount: true,
      createdAt: true,
    },
  });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  }

  return {
    token,
    invoice: {
      ...invoice,
      subtotalExVat: Number(invoice.subtotalExVat),
      totalInclVat: Number(invoice.totalInclVat),
      vatAmount: Number(invoice.vatAmount),
      createdAt: invoice.createdAt.toISOString(),
    },
  };
}
