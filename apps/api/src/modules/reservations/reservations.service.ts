import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';
import { broadcastAuditEvent } from '../audit/audit.events.js';
import { sendReservationConfirmation } from '../notifications/transactional.service.js';
import { assertSellable } from '../inventory/inventory.service.js';
import {
  broadcastReservationCreated,
  broadcastReservationUpdated,
  broadcastReservationCheckedIn,
  broadcastReservationCheckedOut,
  broadcastReservationCancelled,
  type ReservationEventPayload,
} from './reservation.events.js';

export const reservationCreateSchema = z.object({
  propertyId: z.string(),
  guestId: z.string(),
  arrivalDate: z.coerce.date(),
  departureDate: z.coerce.date(),
  nights: z.number().int().min(1),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  roomTypeId: z.string().optional(),
  roomId: z.string().optional(),
  rate: z.number().min(0).optional(),
  source: z.enum(['direct', 'bookingcom', 'expedia', 'walkin', 'phone', 'email']).default('direct'),
});

export const reservationUpdateSchema = z.object({
  arrivalDate: z.coerce.date().optional(),
  departureDate: z.coerce.date().optional(),
  adults: z.number().int().min(1).optional(),
  children: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  source: z.enum(['direct', 'bookingcom', 'expedia', 'walkin', 'phone', 'email']).optional(),
  roomId: z.string().optional(),
  rate: z.number().min(0).optional(),
});

export const assignRoomSchema = z.object({
  roomId: z.string().min(1),
  rate: z.number().min(0).optional(),
});

export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>;
export type AssignRoomInput = z.infer<typeof assignRoomSchema>;

export interface ReservationListQuery {
  page: number;
  pageSize: number;
  propertyId?: string;
  guestId?: string;
  status?: string;
  source?: string;
  search?: string;
  arrivalFrom?: string;
  arrivalTo?: string;
  departureFrom?: string;
  departureTo?: string;
  /** Overlap filter: reservations active anywhere in [from, to) — used by the room plan */
  from?: string;
  to?: string;
}

function generateConfirmationNumber(): string {
  return `VMD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

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

function nightsBetween(arrival: Date, departure: Date): number {
  return Math.round((day(departure).getTime() - day(arrival).getTime()) / 86_400_000);
}

function stayDates(arrival: Date, nights: number): Date[] {
  const start = day(arrival);
  return Array.from({ length: nights }, (_, i) => addDays(start, i));
}

const ACTIVE_STATUSES = ['confirmed', 'checked_in'];

/* ─── Event payload helper (single-arg broadcast API) ─── */
type ReservationRow = {
  id: string;
  tenantId: string;
  propertyId: string;
  guestId: string;
  confirmationNumber: string;
  status: string;
  arrivalDate: Date;
  departureDate: Date;
  nights: number;
  adults: number;
  children: number;
  totalAmount: unknown;
  balance: unknown;
  source: string;
  createdAt: Date;
  updatedAt: Date;
};

function toEventPayload(r: ReservationRow): ReservationEventPayload {
  return {
    id: r.id,
    tenantId: r.tenantId,
    propertyId: r.propertyId,
    guestId: r.guestId,
    confirmationNumber: r.confirmationNumber,
    status: r.status,
    arrivalDate: r.arrivalDate.toISOString(),
    departureDate: r.departureDate.toISOString(),
    nights: r.nights,
    adults: r.adults,
    children: r.children,
    totalAmount: Number(r.totalAmount),
    balance: Number(r.balance),
    source: r.source,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listReservations(tenantId: string, query: ReservationListQuery) {
  const pagination = paginationSchema.parse(query);

  const where: Record<string, unknown> = { tenantId };
  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.guestId) where.guestId = query.guestId;
  if (query.status) where.status = query.status;
  if (query.source) where.source = query.source;

  if (query.arrivalFrom || query.arrivalTo) {
    where.arrivalDate = {};
    if (query.arrivalFrom)
      (where.arrivalDate as Record<string, Date>).gte = new Date(query.arrivalFrom);
    if (query.arrivalTo)
      (where.arrivalDate as Record<string, Date>).lte = new Date(query.arrivalTo);
  }
  if (query.departureFrom || query.departureTo) {
    where.departureDate = {};
    if (query.departureFrom)
      (where.departureDate as Record<string, Date>).gte = new Date(query.departureFrom);
    if (query.departureTo)
      (where.departureDate as Record<string, Date>).lte = new Date(query.departureTo);
  }

  // Overlap filter for the room plan: arrival < to AND departure > from
  if (query.from || query.to) {
    const and: Record<string, unknown>[] = [];
    if (query.to) and.push({ arrivalDate: { lt: day(new Date(query.to)) } });
    if (query.from) and.push({ departureDate: { gt: day(new Date(query.from)) } });
    if (and.length > 0) where.AND = and;
  }

  if (query.search) {
    const s = query.search.trim();
    if (s) {
      where.OR = [
        { confirmationNumber: { contains: s, mode: 'insensitive' } },
        { guest: { firstName: { contains: s, mode: 'insensitive' } } },
        { guest: { lastName: { contains: s, mode: 'insensitive' } } },
      ];
    }
  }

  const [total, rows] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: {
        guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        property: { select: { id: true, name: true, code: true } },
        stays: {
          orderBy: { date: 'asc' },
          include: {
            room: { select: { id: true, number: true, roomType: { select: { name: true } } } },
          },
        },
        folio: true,
      },
      orderBy: { createdAt: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  const items = rows.map((r) => {
    const firstStay = r.stays[0];
    const avgRate =
      r.stays.length > 0 ? r.stays.reduce((sum, s) => sum + Number(s.rate), 0) / r.stays.length : 0;
    return {
      ...r,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      guestEmail: r.guest.email ?? null,
      guestPhone: r.guest.phone ?? null,
      roomId: firstStay?.room.id ?? null,
      roomNumber: firstStay?.room.number ?? null,
      roomTypeName: firstStay?.room.roomType.name ?? null,
      rate: Math.round(avgRate * 100) / 100,
      balance: r.folio ? Number(r.folio.balance) : Number(r.balance),
    };
  });

  return paginate(items, total, pagination);
}

export async function getReservation(tenantId: string, id: string) {
  const reservation = await prisma.reservation.findFirst({
    where: { id, tenantId },
    include: {
      guest: true,
      property: { select: { id: true, name: true, code: true, currency: true } },
      stays: {
        orderBy: { date: 'asc' },
        include: {
          room: { include: { roomType: { select: { id: true, name: true, code: true } } } },
        },
      },
      folio: { include: { items: { orderBy: { postedAt: 'desc' } } } },
    },
  });
  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }
  return reservation;
}

function audit(
  id: string,
  type: string,
  label: string,
  description: string,
  targetId: string,
  targetName: string,
  tenantId: string,
  severity: 'low' | 'medium' | 'high' = 'low',
  metadata?: unknown
) {
  broadcastAuditEvent({
    id,
    timestamp: new Date().toISOString(),
    actor: { id: 'system', name: 'System', role: 'system', ip: '0.0.0.0' },
    action: { type, category: 'reservation', label, description },
    target: { type: 'reservation', id: targetId, name: targetName, tenantId },
    severity,
    ...(metadata ? { metadata: metadata as Record<string, unknown> } : {}),
  });
}

async function assertRoomFree(
  tenantId: string,
  roomId: string,
  arrival: Date,
  nights: number,
  excludeReservationId: string | null
) {
  const dates = stayDates(arrival, nights);
  const conflict = await prisma.reservationStay.findFirst({
    where: {
      roomId,
      date: { in: dates },
      reservation: {
        tenantId,
        status: { in: ACTIVE_STATUSES },
        ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
      },
    },
    include: { reservation: { select: { confirmationNumber: true } } },
  });
  if (conflict) {
    throw new AppError(
      409,
      `Room is already occupied on ${conflict.date.toISOString().slice(0, 10)} by ${conflict.reservation.confirmationNumber}`,
      'ROOM_CONFLICT'
    );
  }
}

/** Replace all stay rows for a reservation with a fresh set. Caller must have validated availability. */
async function rebuildStays(
  reservationId: string,
  roomId: string,
  arrival: Date,
  nights: number,
  rate: number
) {
  await prisma.$transaction([
    prisma.reservationStay.deleteMany({ where: { reservationId } }),
    ...stayDates(arrival, nights).map((d) =>
      prisma.reservationStay.create({
        data: { reservationId, roomId, date: d, rate },
      })
    ),
  ]);
}

/* ─── [I1] Room-type level inventory enforcement (front-desk parity with the
 * public engine): group holds, stop-sell dates and overbooking caps block
 * reservations even when a physical room looks free. Desk override: raise the
 * manual adjustment on the Inventory page — that raises the sellable total. ─── */
async function enforceTypeInventory(
  tenantId: string,
  propertyId: string,
  roomTypeId: string,
  arrival: Date,
  departure: Date,
  excludeReservationId?: string
) {
  try {
    await assertSellable(
      tenantId,
      propertyId,
      roomTypeId,
      arrival,
      departure,
      excludeReservationId
    );
  } catch (err) {
    if (err instanceof AppError && err.code === 'INVENTORY_SOLD_OUT') {
      throw new AppError(
        409,
        'Inventory is blocked for these dates (stop-sell, group hold, or overbooking cap). ' +
          String(err.message) +
          ' — raise the adjustment on the Inventory page to override.',
        'INVENTORY_BLOCKED'
      );
    }
    throw err;
  }
}

export async function createReservation(tenantId: string, input: ReservationCreateInput) {
  if (input.departureDate <= input.arrivalDate) {
    throw new AppError(400, 'Departure date must be after arrival date', 'VALIDATION_ERROR');
  }

  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const guest = await prisma.guest.findFirst({
    where: { id: input.guestId, tenantId },
  });
  if (!guest) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  let rate = input.rate ?? 0;
  if (input.roomId) {
    const room = await prisma.room.findFirst({
      where: { id: input.roomId, propertyId: property.id, status: { not: 'inactive' } },
      include: { roomType: { include: { ratePlans: { where: { status: 'active' }, take: 1 } } } },
    });
    if (!room) {
      throw new AppError(404, 'Room not found in this property', 'NOT_FOUND');
    }
    if (input.rate === undefined) {
      rate = Number(room.roomType.ratePlans[0]?.baseRate ?? 0);
    }
    await assertRoomFree(tenantId, input.roomId, input.arrivalDate, input.nights, null);
    await enforceTypeInventory(
      tenantId,
      property.id,
      room.roomType.id,
      input.arrivalDate,
      input.departureDate
    );
  }

  // [I1] reservation without a pre-assigned room still consumes room-type inventory
  if (!input.roomId && input.roomTypeId) {
    const requestedType = await prisma.roomType.findFirst({
      where: { id: input.roomTypeId, propertyId: property.id },
    });
    if (!requestedType) {
      throw new AppError(404, 'Room type not found in this property', 'NOT_FOUND');
    }
    await enforceTypeInventory(
      tenantId,
      property.id,
      requestedType.id,
      input.arrivalDate,
      input.departureDate
    );
  }

  const confirmationNumber = generateConfirmationNumber();
  const totalAmount = Math.round(rate * input.nights * 100) / 100;

  const reservation = await prisma.reservation.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      guestId: input.guestId,
      confirmationNumber,
      status: 'confirmed',
      source: input.source,
      arrivalDate: day(input.arrivalDate),
      departureDate: day(input.departureDate),
      nights: input.nights,
      adults: input.adults,
      children: input.children,
      notes: input.notes,
      totalAmount,
      balance: totalAmount,
    },
  });

  await prisma.folio.create({
    data: {
      tenantId,
      reservationId: reservation.id,
      status: 'open',
      totalCharges: 0,
      totalPayments: 0,
      balance: totalAmount,
    },
  });

  if (input.roomId) {
    await rebuildStays(reservation.id, input.roomId, input.arrivalDate, input.nights, rate);
  }

  const full = await getReservation(tenantId, reservation.id);

  audit(
    `audit-res-create-${reservation.id}`,
    'create',
    'Reservation Created',
    `Reservation ${confirmationNumber} created for ${guest.firstName} ${guest.lastName}`,
    reservation.id,
    confirmationNumber,
    tenantId
  );

  broadcastReservationCreated(toEventPayload(full));

  // [A3] transactional email — confirmation to the guest. Async, logged in
  // email_logs, deduped. Failure must not fail the booking.
  void sendReservationConfirmation(tenantId, full.id).catch((err) =>
    logger.warn({ err, reservationId: full.id }, 'reservation confirmation email failed')
  );

  return full;
}

export async function assignRoom(tenantId: string, id: string, input: AssignRoomInput) {
  const reservation = await getReservation(tenantId, id);

  if (!['confirmed', 'checked_in'].includes(reservation.status)) {
    throw new AppError(
      409,
      `Cannot assign a room to a reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  const room = await prisma.room.findFirst({
    where: { id: input.roomId, propertyId: reservation.propertyId },
  });
  if (!room) {
    throw new AppError(404, 'Room not found in this property', 'NOT_FOUND');
  }

  await assertRoomFree(tenantId, input.roomId, reservation.arrivalDate, reservation.nights, id);
  await enforceTypeInventory(
    tenantId,
    reservation.propertyId,
    room.roomTypeId,
    reservation.arrivalDate,
    reservation.departureDate,
    id
  );

  const rate =
    input.rate ??
    (reservation.nights > 0 ? Number(reservation.totalAmount) / reservation.nights : 0);

  await rebuildStays(id, input.roomId, reservation.arrivalDate, reservation.nights, rate);

  const totalAmount = Math.round(rate * reservation.nights * 100) / 100;
  const folio = await prisma.folio.findUnique({ where: { reservationId: id } });
  const totalPayments = folio ? Number(folio.totalPayments) : 0;
  const balance = Math.round((totalAmount - totalPayments) * 100) / 100;

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id },
      data: { totalAmount, balance },
    }),
    // Confirmed reservations have no folio yet (folio is created at check-in) —
    // only update it when it exists. This was the Sentry P2025 crash.
    ...(folio ? [prisma.folio.update({ where: { reservationId: id }, data: { balance } })] : []),
  ]);

  const updated = await getReservation(tenantId, id);

  audit(
    `audit-res-assign-${id}`,
    'update',
    'Room Assigned',
    `Room ${room.number} assigned to ${updated.confirmationNumber}`,
    id,
    updated.confirmationNumber,
    tenantId
  );

  broadcastReservationUpdated(toEventPayload(updated));

  return updated;
}

export async function updateReservation(
  tenantId: string,
  id: string,
  input: ReservationUpdateInput
) {
  const existing = await getReservation(tenantId, id);

  const newArrival = input.arrivalDate ? day(input.arrivalDate) : day(existing.arrivalDate);
  const newDeparture = input.departureDate ? day(input.departureDate) : day(existing.departureDate);

  if (newDeparture <= newArrival) {
    throw new AppError(400, 'Departure date must be after arrival date', 'VALIDATION_ERROR');
  }

  const newNights = nightsBetween(newArrival, newDeparture);
  const currentRoomId = existing.stays[0]?.roomId ?? null;
  const targetRoomId = input.roomId ?? currentRoomId;

  const datesChanged =
    newArrival.getTime() !== day(existing.arrivalDate).getTime() ||
    newDeparture.getTime() !== day(existing.departureDate).getTime();
  const roomChanged = targetRoomId !== currentRoomId;
  const rateProvided = input.rate !== undefined;

  // Only active reservations hold inventory — date/room changes on inactive ones just update fields
  const holdsInventory = ACTIVE_STATUSES.includes(existing.status);

  let rate =
    input.rate ??
    (existing.stays.length > 0
      ? existing.stays.reduce((sum, s) => sum + Number(s.rate), 0) / existing.stays.length
      : existing.nights > 0
        ? Number(existing.totalAmount) / existing.nights
        : 0);
  rate = Math.round(rate * 100) / 100;

  if (targetRoomId && (datesChanged || roomChanged || rateProvided) && holdsInventory) {
    const room = await prisma.room.findFirst({
      where: { id: targetRoomId, propertyId: existing.propertyId },
    });
    if (!room) {
      throw new AppError(404, 'Room not found in this property', 'NOT_FOUND');
    }
    await assertRoomFree(tenantId, targetRoomId, newArrival, newNights, id);
    await rebuildStays(id, targetRoomId, newArrival, newNights, rate);
  } else if (targetRoomId && (datesChanged || roomChanged) && !holdsInventory) {
    // Keep stay rows in sync even for inactive reservations so history stays coherent
    await rebuildStays(id, targetRoomId, newArrival, newNights, rate);
  }

  const totalAmount = Math.round(rate * newNights * 100) / 100;
  const folio = await prisma.folio.findUnique({ where: { reservationId: id } });
  const totalPayments = folio ? Number(folio.totalPayments) : 0;
  const newBalance = Math.round((totalAmount - totalPayments) * 100) / 100;

  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      ...(input.arrivalDate ? { arrivalDate: newArrival } : {}),
      ...(input.departureDate ? { departureDate: newDeparture } : {}),
      nights: newNights,
      ...(input.adults !== undefined ? { adults: input.adults } : {}),
      ...(input.children !== undefined ? { children: input.children } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      totalAmount,
      balance: newBalance,
    },
  });

  if (folio) {
    await prisma.folio.update({
      where: { reservationId: id },
      data: { balance: newBalance },
    });
  }

  audit(
    `audit-res-update-${id}`,
    'update',
    'Reservation Updated',
    `Reservation ${reservation.confirmationNumber} updated`,
    id,
    reservation.confirmationNumber,
    tenantId,
    'low',
    { changedFields: Object.keys(input) }
  );

  const full = await getReservation(tenantId, id);
  broadcastReservationUpdated(toEventPayload(full));

  return full;
}

export async function checkInReservation(tenantId: string, id: string) {
  const reservation = await getReservation(tenantId, id);

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot check in reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  if (reservation.stays.length === 0) {
    throw new AppError(409, 'Assign a room before check-in', 'NO_ROOM_ASSIGNED');
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: 'checked_in' },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
      stays: { include: { room: { select: { id: true, number: true } } } },
    },
  });

  audit(
    `audit-res-checkin-${id}`,
    'checkin',
    'Guest Checked In',
    `Guest ${updated.guest.firstName} ${updated.guest.lastName} checked in`,
    id,
    updated.confirmationNumber,
    tenantId
  );

  broadcastReservationCheckedIn(toEventPayload(updated));

  return updated;
}

export async function checkOutReservation(tenantId: string, id: string) {
  const reservation = await getReservation(tenantId, id);

  if (reservation.status !== 'checked_in') {
    throw new AppError(
      409,
      `Cannot check out reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  const today = day(new Date());

  const [updated] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id },
      data: { status: 'checked_out' },
      include: {
        guest: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true } },
      },
    }),
    prisma.folio.updateMany({
      where: { reservationId: id, status: 'open' },
      data: { status: 'closed' },
    }),
    prisma.room.updateMany({
      where: {
        reservationStays: {
          some: { reservationId: id, date: today },
        },
      },
      data: { housekeepingStatus: 'dirty' },
    }),
  ]);

  audit(
    `audit-res-checkout-${id}`,
    'checkout',
    'Guest Checked Out',
    `Guest ${updated.guest.firstName} ${updated.guest.lastName} checked out`,
    id,
    updated.confirmationNumber,
    tenantId
  );

  broadcastReservationCheckedOut(toEventPayload(updated));

  return updated;
}

export async function cancelReservation(tenantId: string, id: string, reason?: string) {
  const reservation = await getReservation(tenantId, id);

  if (['checked_out', 'cancelled', 'no_show'].includes(reservation.status)) {
    throw new AppError(
      409,
      `Cannot cancel reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: 'cancelled' },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
    },
  });

  await prisma.reservationStay.deleteMany({ where: { reservationId: id } });

  audit(
    `audit-res-cancel-${id}`,
    'cancel',
    'Reservation Cancelled',
    `Reservation ${updated.confirmationNumber} cancelled${reason ? `: ${reason}` : ''}`,
    id,
    updated.confirmationNumber,
    tenantId,
    'medium'
  );

  broadcastReservationCancelled(toEventPayload(updated));

  return updated;
}

export async function deleteReservation(tenantId: string, id: string) {
  const reservation = await getReservation(tenantId, id);

  if (reservation.status === 'checked_in') {
    throw new AppError(409, 'Cannot delete a checked-in reservation', 'CONFLICT');
  }

  await prisma.$transaction([
    prisma.folioItem.deleteMany({ where: { folio: { reservationId: id } } }),
    prisma.folio.deleteMany({ where: { reservationId: id } }),
    prisma.reservationStay.deleteMany({ where: { reservationId: id } }),
    prisma.reservation.deleteMany({ where: { id, tenantId } }),
  ]);

  audit(
    `audit-res-delete-${id}`,
    'delete',
    'Reservation Deleted',
    `Reservation ${reservation.confirmationNumber} deleted`,
    id,
    reservation.confirmationNumber,
    tenantId,
    'high'
  );

  return { success: true };
}
