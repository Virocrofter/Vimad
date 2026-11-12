/* apps/api/src/modules/public/public.service.ts
 * A4 — booking engine v1 (public, unauthenticated).
 * Flow: availability lookup (with occupancy filtering + nightly rate
 * breakdown) → guest find-or-create → createReservation (the SAME service the
 * front desk uses — folio, stay rows, inventory assertion and the A3
 * confirmation email all come free) → deposit checkout link via the A1 payment
 * service. Plus public cancellation by confirmation number + email.
 * I1: availability feed honours the inventory engine — OOO rooms excluded,
 * holds subtracted, adjustments applied, overbooking limits honoured,
 * stop-sell / close-to-arrival respected; booking re-checks assertSellable.
 */
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { createReservation, inventoryLockKey } from '../reservations/reservations.service.js';
import { initializePayment } from '../payments/payments.service.js';
import { assertSellable } from '../inventory/inventory.service.js';
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
// I1: rooms in these statuses are never sellable — online or at the desk
const UNSALEABLE_ROOM_STATUSES = ['inactive', 'ooo', 'out_of_order'];
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

// ─── Availability: rooms − OOO − occupied − holds (+ adjustments, + overbooking) ───

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
    where: { propertyId: property.id, status: { notIn: UNSALEABLE_ROOM_STATUSES } },
    select: {
      id: true,
      roomTypeId: true,
      roomType: {
        select: {
          id: true,
          name: true,
          baseOccupancy: true,
          maxOccupancy: true,
          ratePlans: { where: { status: 'active' }, take: 1, select: { id: true, baseRate: true } },
        },
      },
    },
  });

  // C1' pricing ledger: rule-derived nightly rates take precedence over base
  const rateOverrides = await prisma.rateOverride.findMany({
    where: { propertyId: property.id, date: { gte: day(checkIn), lt: day(checkOut) } },
    select: { ratePlanId: true, date: true, effectiveRate: true },
  });
  const overrideMap = new Map(
    rateOverrides.map((o) => [`${o.ratePlanId}|${toISODate(o.date)}`, Number(o.effectiveRate)])
  );

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

  // ─── I1 inventory layer: holds, adjustments, stop-sell/CTA, overbooking ───
  const [allocations, restrictions, overbooking] = await Promise.all([
    prisma.inventoryAllocation.groupBy({
      by: ['roomTypeId', 'date'],
      where: {
        propertyId: property.id,
        status: 'active',
        date: { gte: day(checkIn), lt: day(checkOut) },
      },
      _sum: { quantity: true },
    }),
    prisma.inventoryRestriction.findMany({
      where: { propertyId: property.id, date: { gte: day(checkIn), lt: day(checkOut) } },
    }),
    prisma.inventoryOverbooking.findMany({
      where: { roomType: { propertyId: property.id } },
    }),
  ]);
  const heldMap = new Map(
    allocations.map((a) => [`${a.roomTypeId}|${toISODate(a.date)}`, a._sum.quantity ?? 0])
  );
  const restrMap = new Map(
    restrictions.map((r) => [
      `${r.roomTypeId}|${toISODate(r.date)}`,
      { stopSell: r.stopSell, closeToArrival: r.closeToArrival, adjustment: r.adjustment },
    ])
  );
  const obMap = new Map(overbooking.map((o) => [o.roomTypeId, o.limit]));

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
      ratePlanId: string | undefined;
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
      ratePlanId: room.roomType.ratePlans[0]?.id,
    };
    entry.total += 1;
    if (!occupiedRoomIds.has(room.id)) entry.free += 1;
    byType.set(typeId, entry);
  }

  const roomTypes = [...byType.entries()]
    .map(([roomTypeId, v]) => {
      // Available-for-sale per night: rooms free for the whole stay, minus
      // holds, plus manual adjustments (floor 0), plus the overbooking cap.
      const nightlyRates = nightsArr.map((d) => {
        const o = v.ratePlanId ? overrideMap.get(`${v.ratePlanId}|${toISODate(d)}`) : undefined;
        return o ?? v.rate;
      });
      const perNight = nightsArr.map((d) => {
        const key = `${roomTypeId}|${toISODate(d)}`;
        return (
          Math.max(v.free - (heldMap.get(key) ?? 0) + (restrMap.get(key)?.adjustment ?? 0), 0) +
          (obMap.get(roomTypeId) ?? 0)
        );
      });
      const availableRooms = Math.max(Math.min(...perNight), 0);
      // Stop-sell on any night, or close-to-arrival on the check-in night,
      // removes the type from sale entirely.
      const blocked = nightsArr.some(
        (d) => restrMap.get(`${roomTypeId}|${toISODate(d)}`)?.stopSell
      );
      const arrivalBlocked = restrMap.get(`${roomTypeId}|${toISODate(checkIn)}`)?.closeToArrival;
      return {
        roomTypeId,
        name: v.name,
        baseOccupancy: v.baseOccupancy,
        maxOccupancy: v.maxOccupancy,
        availableRooms,
        ratePerNight: v.rate,
        nights,
        nightly: nightsArr.map((d, i) => ({ date: toISODate(d), rate: nightlyRates[i] })),
        total: Math.round(nightlyRates.reduce((sum, r) => sum + r, 0) * 100) / 100,
        _blocked: blocked || arrivalBlocked,
      };
    })
    // Occupancy filter: the whole party must fit in one room
    .filter(
      (v) =>
        !v._blocked && v.availableRooms > 0 && v.ratePerNight > 0 && v.maxOccupancy >= partySize
    )
    .map(({ _blocked, ...v }) => v);

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
      status: { notIn: UNSALEABLE_ROOM_STATUSES },
    },
    select: { id: true, number: true },
  });
  if (typeRooms.length === 0) {
    throw new AppError(404, 'Room type not found at this property', 'NOT_FOUND');
  }

  // ─── I1 inventory-layer enforcement: holds, adjustments, stop-sell and the
  // overbooking cap apply at room-type level even when a physical room looks
  // free. Without this a web booking could eat into a group block or a
  // stop-sold date. (Rooms going OOO between search and book are caught here
  // too — they no longer count towards the sellable total.)
  try {
    await assertSellable(tenantId, property.id, input.roomTypeId, checkIn, checkOut);
  } catch (err) {
    if (err instanceof AppError && err.code === 'INVENTORY_SOLD_OUT') {
      throw new AppError(409, 'Sorry — that room type just sold out for your dates.', 'SOLD_OUT');
    }
    throw err;
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
  // Atomic guest resolution: the (tenantId, email) unique index turns a
  // concurrent same-email booking into a conflict; the P2002 retry fetches
  // the winner. Closes the duplicate-guest race found by P4-B4.
  // Atomic guest resolution: the (tenantId, email) unique index turns a
  // concurrent same-email booking into a conflict; the P2002 retry
  // fetches the winner. Closes the duplicate-guest race (P4-B4).
  let guest = await prisma.guest.findFirst({ where: { tenantId, email } });
  if (!guest) {
    try {
      guest = await prisma.guest.create({
        data: {
          tenantId,
          firstName: input.guest.firstName.trim(),
          lastName: input.guest.lastName.trim(),
          email,
          phone: input.guest.phone.trim(),
        },
      });
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err;
      guest = await prisma.guest.findFirstOrThrow({ where: { tenantId, email } });
    }
  }

  // The SAME path the front desk uses: folio, stay rows, inventory assertion,
  // A3 confirmation email to the guest — all automatic.
  //
  // B3: the availability re-check and the insert must be atomic, or N concurrent
  // bookings all pass the check and oversell the type (race test: 10/4). Serialize
  // per property+roomType with a transaction-scoped advisory lock, re-pick the
  // room inside the lock, and create on the tx client.
  let reservation;
  try {
    reservation = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${inventoryLockKey(property.id, input.roomTypeId)}))`;

        // Re-check occupancy INSIDE the lock — the pre-check above may be stale.
        const occupiedNow = await tx.reservationStay.findMany({
          where: {
            date: { in: nightsArr },
            reservation: { tenantId, propertyId: property.id, status: { in: ACTIVE_STATUSES } },
          },
          select: { roomId: true },
        });
        const takenRoomIds = new Set(occupiedNow.map((st) => st.roomId));
        const roomNow = typeRooms.find((r) => !takenRoomIds.has(r.id));
        if (!roomNow) {
          throw new AppError(
            409,
            'Sorry — that room type just sold out for your dates.',
            'SOLD_OUT'
          );
        }

        return createReservation(
          tenantId,
          {
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
            roomId: roomNow.id,
            source: 'direct',
          },
          { id: 'system', name: 'System', role: 'system' },
          tx
        );
      },
      { maxWait: 15000, timeout: 15000 }
    );
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
    let payment;
    try {
      payment = await initializePayment(tenantId, 'system:public-booking', {
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
    } catch (err) {
      // Deposit init failed AFTER the reservation committed. An orphan confirmed
      // booking would consume inventory with no way for the guest to pay — race
      // test showed exactly that (5 confirmed, zero payment rows). Release it.
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: 'system:deposit-init',
          cancelReason: 'deposit_init_failed',
        },
      });
      logger.error(
        { err, reservationId: reservation.id },
        'public booking deposit init failed; reservation released'
      );
      throw new AppError(
        502,
        'Payment could not be initialized. No reservation was held — please try again.',
        'PAYMENT_INIT_FAILED'
      );
    }
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
    // Never leave a live deposit request on a cancelled booking — the guest
    // could still complete checkout for a stay that no longer exists.
    prisma.payment.updateMany({
      where: { reservationId: reservation.id, status: 'pending' },
      data: { status: 'failed', failureReason: 'reservation_cancelled' },
    }),
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

// ─── E5 public unsubscribe (one-click, no login) ───
export const unsubscribeQuerySchema = z.object({ token: z.string().min(10) });

export async function unsubscribeByToken(token: string) {
  const { unsubscribeByToken: revoke } = await import('../marketing/marketing.service.js');
  return revoke(token);
}
