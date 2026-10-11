/* apps/api/src/modules/public/public.service.ts
 * A4 — booking engine v1 (public, unauthenticated).
 * Flow: availability lookup (with occupancy filtering + nightly rate
 * breakdown) → guest find-or-create → createReservation (the SAME service the
 * front desk uses — folio, stay rows, inventory assertion and the A3
 * confirmation email all come free) → deposit checkout link via the A1 payment
 * service. Plus public cancellation by confirmation number + email.
 */
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { createReservation } from '../reservations/reservations.service.js';
import { initializePayment } from '../payments/payments.service.js';
import { sendEmail } from '../../jobs/email.queue.js';

// ─── Validation ───

export const availabilityQuerySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be YYYY-MM-DD'),
  adults: z.coerce.number().int().min(1).max(16).default(2),
  children: z.coerce.number().int().min(0).max(16).default(0),
});

export const publicBookingSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.coerce.number().int().min(1).max(16),
  children: z.coerce.number().int().min(0).max(16).default(0),
  roomTypeId: z.string().min(1),
  guest: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email().max(160),
    phone: z.string().min(7).max(32),
  }),
  notes: z.string().max(1000).optional(),
  website: z.string().max(0).optional(), // honeypot — bots fill it, humans never see it
});

export const publicCancellationSchema = z.object({
  confirmationNumber: z.string().min(4).max(32),
  email: z.string().email().max(160),
});

// ─── Date helpers (mirror reservations.service.ts — stay rows are UTC-midnight dates) ───

function day(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function nightsBetween(a: Date, b: Date): number {
  return Math.round((day(b).getTime() - day(a).getTime()) / 86_400_000);
}

function stayDates(arrival: Date, nights: number): Date[] {
  const start = day(arrival);
  return Array.from({ length: nights }, (_, i) => addDays(start, i));
}

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const ACTIVE_STATUSES = ['confirmed', 'checked_in'];
const CANCELLATION_CUTOFF_HOURS = 48;

const money = (major: number, currency: string) =>
  `${currency === 'ZAR' ? 'R' : currency} ${major.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─── Property lookup (public — by code, e.g. /book/ocean-view) ───

export async function getPublicProperty(code: string) {
  const property = await prisma.property.findFirst({
    where: { code },
    select: { id: true, tenantId: true, name: true, code: true, currency: true },
  });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');
  return property;
}

// ─── Availability: real rooms minus overlapping active stays, occupancy-filtered ───

export async function getAvailability(
  code: string,
  query: z.infer<typeof availabilityQuerySchema>
) {
  const property = await getPublicProperty(code);

  const checkIn = new Date(query.checkIn + 'T00:00:00Z');
  const checkOut = new Date(query.checkOut + 'T00:00:00Z');
  if (checkOut <= checkIn) {
    throw new AppError(400, 'Check-out must be after check-in', 'VALIDATION_ERROR');
  }
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1 || nights > 30) {
    throw new AppError(400, 'Stay must be between 1 and 30 nights', 'VALIDATION_ERROR');
  }
  if (day(checkIn).getTime() < day(new Date()).getTime()) {
    throw new AppError(400, 'Check-in cannot be in the past', 'VALIDATION_ERROR');
  }

  const nightsArr = stayDates(checkIn, nights);
  const partySize = query.adults + query.children;

  const rooms = await prisma.room.findMany({
    where: { propertyId: property.id, status: { not: 'inactive' } },
    select: {
      id: true,
      roomTypeId: true,
      roomType: {
        select: {
          id: true,
          name: true,
          baseOccupancy: true,
          maxOccupancy: true,
          ratePlans: { where: { status: 'active' }, take: 1, select: { baseRate: true } },
        },
      },
    },
  });

  const occupied = await prisma.reservationStay.findMany({
    where: {
      date: { in: nightsArr },
      reservation: {
        tenantId: property.tenantId,
        propertyId: property.id,
        status: { in: ACTIVE_STATUSES },
      },
    },
    select: { roomId: true },
  });
  const occupiedRoomIds = new Set(occupied.map((s) => s.roomId));

  // Group by room type: total rooms, rooms free for ALL nights, rate, occupancy
  const byType = new Map<
    string,
    {
      name: string;
      baseOccupancy: number;
      maxOccupancy: number;
      total: number;
      free: number;
      rate: number;
    }
  >();
  for (const room of rooms) {
    const typeId = room.roomTypeId;
    const entry = byType.get(typeId) ?? {
      name: room.roomType.name,
      baseOccupancy: room.roomType.baseOccupancy,
      maxOccupancy: room.roomType.maxOccupancy,
      total: 0,
      free: 0,
      rate: Number(room.roomType.ratePlans[0]?.baseRate ?? 0),
    };
    entry.total += 1;
    if (!occupiedRoomIds.has(room.id)) entry.free += 1;
    byType.set(typeId, entry);
  }

  const roomTypes = [...byType.entries()]
    // Occupancy filter: the whole party must fit in one room
    .filter(([, v]) => v.free > 0 && v.rate > 0 && v.maxOccupancy >= partySize)
    .map(([roomTypeId, v]) => ({
      roomTypeId,
      name: v.name,
      baseOccupancy: v.baseOccupancy,
      maxOccupancy: v.maxOccupancy,
      availableRooms: v.free,
      ratePerNight: v.rate,
      nights,
      // Per-night breakdown — today every night carries the flat rack rate;
      // the shape already supports seasonal/dynamic rates later.
      nightly: nightsArr.map((d) => ({ date: toISODate(d), rate: v.rate })),
      total: Math.round(v.rate * nights * 100) / 100,
    }));

  return {
    property: {
      id: property.id,
      name: property.name,
      code: property.code,
      currency: property.currency,
    },
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    nights,
    adults: query.adults,
    children: query.children,
    roomTypes,
  };
}

// ─── Public booking: availability re-check → guest upsert → reservation → deposit link ───

export async function createPublicBooking(
  code: string,
  input: z.infer<typeof publicBookingSchema>
) {
  const property = await getPublicProperty(code);
  const tenantId = property.tenantId;

  const checkIn = new Date(input.checkIn + 'T00:00:00Z');
  const checkOut = new Date(input.checkOut + 'T00:00:00Z');
  if (checkOut <= checkIn) {
    throw new AppError(400, 'Check-out must be after check-in', 'VALIDATION_ERROR');
  }
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1 || nights > 30) {
    throw new AppError(400, 'Stay must be between 1 and 30 nights', 'VALIDATION_ERROR');
  }

  // Re-check availability at booking time (the availability page may be stale).
  const nightsArr = stayDates(checkIn, nights);
  const typeRooms = await prisma.room.findMany({
    where: {
      propertyId: property.id,
      roomTypeId: input.roomTypeId,
      status: { not: 'inactive' },
    },
    select: { id: true, number: true },
  });
  if (typeRooms.length === 0) {
    throw new AppError(404, 'Room type not found at this property', 'NOT_FOUND');
  }
  const occupied = await prisma.reservationStay.findMany({
    where: {
      date: { in: nightsArr },
      reservation: { tenantId, propertyId: property.id, status: { in: ACTIVE_STATUSES } },
    },
    select: { roomId: true },
  });
  const occupiedRoomIds = new Set(occupied.map((s) => s.roomId));
  const room = typeRooms.find((r) => !occupiedRoomIds.has(r.id));
  if (!room) {
    throw new AppError(409, 'Sorry — that room type just sold out for your dates.', 'SOLD_OUT');
  }

  // Guest find-or-create by email (a returning web guest reuses their profile)
  const email = input.guest.email.toLowerCase().trim();
  let guest = await prisma.guest.findFirst({ where: { tenantId, email } });
  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        tenantId,
        firstName: input.guest.firstName.trim(),
        lastName: input.guest.lastName.trim(),
        email,
        phone: input.guest.phone.trim(),
      },
    });
  }

  // The SAME path the front desk uses: folio, stay rows, inventory assertion,
  // A3 confirmation email to the guest — all automatic.
  let reservation;
  try {
    reservation = await createReservation(tenantId, {
      propertyId: property.id,
      guestId: guest.id,
      arrivalDate: checkIn,
      departureDate: checkOut,
      nights,
      adults: input.adults,
      children: input.children,
      notes: input.notes
        ? `[WEB] ${input.notes.trim()}`
        : '[WEB] Booked via the website booking engine',
      roomId: room.id,
      source: 'direct',
    });
  } catch (err) {
    // Lost the race between our check and the insert — another booking took the room
    if (err instanceof AppError && err.code === 'ROOM_CONFLICT') {
      throw new AppError(409, 'Sorry — that room type just sold out for your dates.', 'SOLD_OUT');
    }
    throw err;
  }

  // Deposit: one night's rate, payable via Paystack hosted checkout (A1).
  // The A1 webhook posts it to the folio and the A3 receipt email fires — existing code.
  const ratePerNight =
    nights > 0 ? Math.round((Number(reservation.totalAmount) / nights) * 100) / 100 : 0;
  const depositAmountMinor = Math.round(ratePerNight * 100);

  let deposit: {
    amountMinor: number;
    amountLabel: string;
    currency: string;
    authorizationUrl: string | null;
    reference: string;
  } | null = null;

  if (depositAmountMinor > 0) {
    const payment = await initializePayment(tenantId, 'system:public-booking', {
      guestId: guest.id,
      reservationId: reservation.id,
      email,
      amountMinor: depositAmountMinor,
      type: 'deposit',
      idempotencyKey: `web-${reservation.id}-deposit`,
      metadata: {
        channel: 'website',
        confirmationNumber: reservation.confirmationNumber,
      },
    });
    deposit = {
      amountMinor: depositAmountMinor,
      amountLabel: money(ratePerNight, property.currency),
      currency: property.currency,
      authorizationUrl: payment.authorizationUrl ?? null,
      reference: payment.reference,
    };
  }

  logger.info(
    {
      reservationId: reservation.id,
      confirmationNumber: reservation.confirmationNumber,
      room: room.number,
    },
    'public booking created'
  );

  return {
    confirmationNumber: reservation.confirmationNumber,
    reservationId: reservation.id,
    propertyName: property.name,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights,
    roomNumber: room.number,
    guestEmail: email,
    totalLabel: money(Number(reservation.totalAmount), property.currency),
    deposit,
  };
}

// ─── Public cancellation: confirmation number + email, free until 48h before arrival ───

export async function cancelPublicBooking(input: z.infer<typeof publicCancellationSchema>) {
  const reservation = await prisma.reservation.findFirst({
    where: { confirmationNumber: input.confirmationNumber.trim() },
    include: { guest: true, property: { select: { name: true } } },
  });

  // Same 404 for "no such booking" and "email doesn't match" — never leak existence
  if (
    !reservation ||
    (reservation.guest.email ?? '').toLowerCase() !== input.email.toLowerCase().trim()
  ) {
    throw new AppError(
      404,
      'No booking found for that confirmation number and email.',
      'NOT_FOUND'
    );
  }

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      'This booking can no longer be cancelled online — please contact the property.',
      'CONFLICT'
    );
  }

  const cutoff = new Date(Date.now() + CANCELLATION_CUTOFF_HOURS * 3_600_000);
  if (reservation.arrivalDate <= cutoff) {
    throw new AppError(
      409,
      `Free online cancellation closes 48 hours before check-in. Please contact ${reservation.property.name} directly.`,
      'CANCELLATION_CLOSED'
    );
  }

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'cancelled' },
    }),
    prisma.reservationStay.deleteMany({ where: { reservationId: reservation.id } }),
  ]);

  // Cancellation confirmation email — logged in the Email Center like everything else
  void sendEmail({
    to: reservation.guest.email!,
    subject: `Booking cancelled — ${reservation.property.name} (${reservation.confirmationNumber})`,
    template: 'booking-cancelled',
    payload: {
      guestName: reservation.guest.firstName,
      propertyName: reservation.property.name,
      confirmationNumber: reservation.confirmationNumber,
      arrivalDate: toISODate(reservation.arrivalDate),
    },
    tenantId: reservation.tenantId,
    relatedType: 'reservation',
    relatedId: reservation.id,
  }).catch((err) => logger.warn({ err }, 'cancellation email failed'));

  logger.info(
    { confirmationNumber: reservation.confirmationNumber, reservationId: reservation.id },
    'public booking cancelled'
  );

  return { cancelled: true, confirmationNumber: reservation.confirmationNumber };
}
