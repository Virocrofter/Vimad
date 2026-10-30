import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';
import { broadcastAuditEvent } from '../audit/audit.events.js';
import { sendReservationConfirmation } from '../notifications/transactional.service.js';
import { assertSellable } from '../inventory/inventory.service.js';
import { refreshInventoryCache } from '../inventory/inventory.cache.js';
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
  // R1 completeness fields
  ratePlanId: z.string().optional(),
  eta: z.string().optional(),
  specialRequests: z.string().optional(),
  marketSegment: z.string().optional(),
  guaranteed: z.boolean().optional(),
  houseUse: z.boolean().optional(),
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
  ratePlanId: z.string().optional(),
  eta: z.string().optional(),
  specialRequests: z.string().optional(),
  marketSegment: z.string().optional(),
  guaranteed: z.boolean().optional(),
  houseUse: z.boolean().optional(),
  doNotMove: z.boolean().optional(),
  fixedRoom: z.boolean().optional(),
});

export const assignRoomSchema = z.object({
  roomId: z.string().min(1),
  rate: z.number().min(0).optional(),
});

export const createTraceSchema = z.object({
  body: z.string().min(1),
  department: z.string().default('front_desk'),
  dueAt: z.coerce.date().optional(),
});

export const addCompanionSchema = z.object({
  guestId: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  relationship: z.string().optional(),
  sharesFolio: z.boolean().default(true),
});

export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>;
export type AssignRoomInput = z.infer<typeof assignRoomSchema>;

/* ─── Audit actor (B2 fix) — real user attribution on every event ─── */
export interface AuditActor {
  id: string;
  name: string;
  role: string;
}

import type { Prisma, PrismaClient } from '@prisma/client';

const SYSTEM_ACTOR: AuditActor = { id: 'system', name: 'System', role: 'system' };

export interface ReservationListQuery {
  page: number;
  pageSize: number;
  propertyId?: string;
  propertyIds?: string[];
  guestId?: string;
  status?: string;
  source?: string;
  search?: string;
  arrivalFrom?: string;
  arrivalTo?: string;
  departureFrom?: string;
  departureTo?: string;
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
  // P1-D2/D4: property-scope enforcement for scoped roles (null = global,
  // handled by routes). A scoped user naming a property outside their set
  // gets an empty result instead of a 403 -- existence stays hidden.
  if (query.propertyIds) {
    if (query.propertyId && !query.propertyIds.includes(query.propertyId)) {
      where.propertyId = '__outside_scope__';
    } else {
      where.propertyId = { in: query.propertyIds };
    }
  }
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
        { guest: { email: { contains: s, mode: 'insensitive' } } },
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

export async function getReservation(
  tenantId: string,
  id: string,
  client: Prisma.TransactionClient | PrismaClient = prisma
) {
  const reservation = await client.reservation.findFirst({
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
      traces: { orderBy: { createdAt: 'desc' } },
      companions: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }
  return reservation;
}

async function audit(
  id: string,
  type: string,
  label: string,
  description: string,
  targetId: string,
  targetName: string,
  tenantId: string,
  severity: 'low' | 'medium' | 'high' = 'low',
  metadata?: unknown,
  actor: AuditActor = SYSTEM_ACTOR
) {
  // Persist to the audit trail first — the DB row is the durable record;
  // the broadcast below is only a live UI pulse. This helper previously
  // only broadcast, so all twelve reservation lifecycle call sites left no
  // audit trail (found by 0.3 live smoke: check-in 200, audit_logs empty).
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: actor?.id ?? null,
      action: type,
      entity: 'reservation',
      entityId: targetId,
      metadata: metadata ? (metadata as Prisma.InputJsonObject) : undefined,
      ipAddress: '0.0.0.0',
    },
  });

  broadcastAuditEvent({
    id,
    timestamp: new Date().toISOString(),
    actor: { id: actor.id, name: actor.name, role: actor.role, ip: '0.0.0.0' },
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
  excludeReservationId: string | null,
  client: Prisma.TransactionClient | PrismaClient = prisma
) {
  const dates = stayDates(arrival, nights);
  const conflict = await client.reservationStay.findFirst({
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

async function rebuildStays(
  reservationId: string,
  roomId: string,
  arrival: Date,
  nights: number,
  rate: number,
  client: Prisma.TransactionClient | PrismaClient = prisma
) {
  // Sequential (not the batch-transaction form) so this can run inside an
  // interactive transaction when the caller holds an inventory lock.
  await client.reservationStay.deleteMany({ where: { reservationId } });
  for (const d of stayDates(arrival, nights)) {
    await client.reservationStay.create({
      data: { reservationId, roomId, date: d, rate },
    });
  }
}

/* Recalculate reservation total/balance from stay rows + folio payments,
 * then mirror the balance onto the folio. Single write path for both.
 * Pass a transaction client to run inside an existing transaction. */
async function syncReservationTotals(
  reservationId: string,
  client: Prisma.TransactionClient | PrismaClient = prisma
) {
  const reservation = await client.reservation.findUniqueOrThrow({
    where: { id: reservationId },
    include: { stays: true, folio: true },
  });
  const staysTotal =
    Math.round(reservation.stays.reduce((sum, s) => sum + Number(s.rate), 0) * 100) / 100;
  const fallback = Math.round(Number(reservation.totalAmount) * 100) / 100;
  const totalAmount = reservation.stays.length > 0 ? staysTotal : fallback;
  const totalPayments = reservation.folio ? Number(reservation.folio.totalPayments) : 0;
  const balance = Math.round((totalAmount - totalPayments) * 100) / 100;

  if (client === prisma) {
    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservationId },
        data: { totalAmount, balance },
      }),
      ...(reservation.folio
        ? [prisma.folio.update({ where: { reservationId }, data: { balance } })]
        : []),
    ]);
  } else {
    await client.reservation.update({
      where: { id: reservationId },
      data: { totalAmount, balance },
    });
    if (reservation.folio) {
      await client.folio.update({ where: { reservationId }, data: { balance } });
    }
  }
  return { totalAmount, balance };
}

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

// Advisory-lock key shared by EVERY reservation-create path (web booking
// engine, front-desk API, internal callers). Locking per property+roomType
// makes the last-room check-and-insert atomic across all of them — the web
// engine and the front desk can no longer oversell each other.
export function inventoryLockKey(propertyId: string, roomTypeId: string | null): string {
  return `public-booking:${propertyId}:${roomTypeId ?? 'none'}`;
}

/* The cache is a derived artifact: a failed rebuild must never fail the
 * booking — the scheduler will converge it. Awaited (not voided) so that
 * post-commit readers (tests, webhooks, availability grids) observe
 * converged rows immediately. */
async function refreshCacheAfterMutation(propertyId: string): Promise<void> {
  try {
    await refreshInventoryCache(propertyId);
  } catch (err) {
    logger.warn({ err, propertyId }, 'inventory cache refresh failed; scheduler will converge');
  }
}

export async function createReservation(
  tenantId: string,
  input: ReservationCreateInput,
  actor: AuditActor = SYSTEM_ACTOR,
  client: Prisma.TransactionClient | PrismaClient = prisma
) {
  if (client !== prisma) {
    // Caller already holds the inventory lock on this transaction (the public
    // booking engine) — create directly so the lock is taken exactly once.
    return createReservationInner(tenantId, input, actor, client);
  }
  const created = await prisma.$transaction(
    async (tx) => {
      let roomTypeId = input.roomTypeId ?? null;
      if (!roomTypeId && input.roomId) {
        const room = await tx.room.findFirst({
          where: { id: input.roomId },
          select: { roomTypeId: true },
        });
        roomTypeId = room?.roomTypeId ?? null;
      }
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${inventoryLockKey(input.propertyId, roomTypeId)}))`;
      return createReservationInner(tenantId, input, actor, tx);
    },
    { maxWait: 15000, timeout: 15000 }
  );
  await refreshCacheAfterMutation(input.propertyId);
  return created;
}

async function createReservationInner(
  tenantId: string,
  input: ReservationCreateInput,
  actor: AuditActor = SYSTEM_ACTOR,
  client: Prisma.TransactionClient | PrismaClient = prisma
) {
  if (input.departureDate <= input.arrivalDate) {
    throw new AppError(400, 'Departure date must be after arrival date', 'VALIDATION_ERROR');
  }

  const property = await client.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const guest = await client.guest.findFirst({
    where: { id: input.guestId, tenantId },
  });
  if (!guest) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  if (input.ratePlanId) {
    const ratePlan = await client.ratePlan.findFirst({
      where: { id: input.ratePlanId, propertyId: property.id },
    });
    if (!ratePlan) {
      throw new AppError(404, 'Rate plan not found in this property', 'NOT_FOUND');
    }
  }

  let rate = input.rate ?? 0;
  // Denormalised onto the reservation for reporting joins: room-level bookings
  // would otherwise leave roomTypeId NULL (the null that made a DB-truth query
  // silently return zero rows during race verification).
  let resolvedRoomTypeId: string | null = input.roomTypeId ?? null;
  if (input.roomId) {
    const room = await client.room.findFirst({
      where: { id: input.roomId, propertyId: property.id, status: { not: 'inactive' } },
      include: { roomType: { include: { ratePlans: { where: { status: 'active' }, take: 1 } } } },
    });
    if (!room) {
      throw new AppError(404, 'Room not found in this property', 'NOT_FOUND');
    }
    if (input.rate === undefined) {
      rate = Number(room.roomType.ratePlans[0]?.baseRate ?? 0);
    }
    resolvedRoomTypeId = room.roomType.id;
    await assertRoomFree(tenantId, input.roomId, input.arrivalDate, input.nights, null, client);
    await enforceTypeInventory(
      tenantId,
      property.id,
      room.roomType.id,
      input.arrivalDate,
      input.departureDate
    );
  }

  if (!input.roomId && input.roomTypeId) {
    const requestedType = await client.roomType.findFirst({
      where: { id: input.roomTypeId, propertyId: property.id },
    });
    if (!requestedType) {
      throw new AppError(404, 'Room type not found in this property', 'NOT_FOUND');
    }
    resolvedRoomTypeId = requestedType.id;
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

  const reservation = await client.reservation.create({
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
      roomTypeId: resolvedRoomTypeId,
      ratePlanId: input.ratePlanId ?? null,
      eta: input.eta ?? null,
      specialRequests: input.specialRequests ?? null,
      marketSegment: input.marketSegment ?? null,
      guaranteed: input.guaranteed ?? false,
      houseUse: input.houseUse ?? false,
      totalAmount,
      balance: totalAmount,
    },
  });

  await client.folio.create({
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
    await rebuildStays(reservation.id, input.roomId, input.arrivalDate, input.nights, rate, client);
  }

  const full = await getReservation(tenantId, reservation.id, client);

  await audit(
    `audit-res-create-${reservation.id}`,
    'create',
    'Reservation Created',
    `Reservation ${confirmationNumber} created for ${guest.firstName} ${guest.lastName}`,
    reservation.id,
    confirmationNumber,
    tenantId,
    'low',
    undefined,
    actor
  );

  broadcastReservationCreated(toEventPayload(full));

  void sendReservationConfirmation(tenantId, full.id).catch((err) =>
    logger.warn({ err, reservationId: full.id }, 'reservation confirmation email failed')
  );

  return full;
}

export async function assignRoom(
  tenantId: string,
  id: string,
  input: AssignRoomInput,
  actor: AuditActor = SYSTEM_ACTOR
) {
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

  // Serialize with create/update on the same property+roomType: the lock makes
  // assert-then-rebuild atomic, so a booking racing this assignment cannot
  // slip between the check and the stay writes.
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${inventoryLockKey(reservation.propertyId, room.roomTypeId)}))`;
      await assertRoomFree(
        tenantId,
        input.roomId,
        reservation.arrivalDate,
        reservation.nights,
        id,
        tx
      );
      await rebuildStays(id, input.roomId, reservation.arrivalDate, reservation.nights, rate, tx);
      await syncReservationTotals(id, tx);
    },
    { maxWait: 15000, timeout: 15000 }
  );

  const updated = await getReservation(tenantId, id);

  await audit(
    `audit-res-assign-${id}`,
    'update',
    'Room Assigned',
    `Room ${room.number} assigned to ${updated.confirmationNumber}`,
    id,
    updated.confirmationNumber,
    tenantId,
    'low',
    { roomId: room.id },
    actor
  );

  broadcastReservationUpdated(toEventPayload(updated));
  await refreshCacheAfterMutation(reservation.propertyId);

  return updated;
}

export async function updateReservation(
  tenantId: string,
  id: string,
  input: ReservationUpdateInput,
  actor: AuditActor = SYSTEM_ACTOR
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

  let rate =
    input.rate ??
    (existing.stays.length > 0
      ? existing.stays.reduce((sum, s) => sum + Number(s.rate), 0) / existing.stays.length
      : existing.nights > 0
        ? Number(existing.totalAmount) / existing.nights
        : 0);
  rate = Math.round(rate * 100) / 100;

  const reservationData = {
    ...(input.arrivalDate ? { arrivalDate: newArrival } : {}),
    ...(input.departureDate ? { departureDate: newDeparture } : {}),
    nights: newNights,
    ...(input.adults !== undefined ? { adults: input.adults } : {}),
    ...(input.children !== undefined ? { children: input.children } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.source !== undefined ? { source: input.source } : {}),
    ...(input.ratePlanId !== undefined ? { ratePlanId: input.ratePlanId } : {}),
    ...(input.eta !== undefined ? { eta: input.eta } : {}),
    ...(input.specialRequests !== undefined ? { specialRequests: input.specialRequests } : {}),
    ...(input.marketSegment !== undefined ? { marketSegment: input.marketSegment } : {}),
    ...(input.guaranteed !== undefined ? { guaranteed: input.guaranteed } : {}),
    ...(input.houseUse !== undefined ? { houseUse: input.houseUse } : {}),
    ...(input.doNotMove !== undefined ? { doNotMove: input.doNotMove } : {}),
    ...(input.fixedRoom !== undefined ? { fixedRoom: input.fixedRoom } : {}),
  };

  const needsStayRebuild = Boolean(targetRoomId && (datesChanged || roomChanged || rateProvided));
  let inventoryChanged = false;

  if (needsStayRebuild) {
    const room = await prisma.room.findFirst({
      where: { id: targetRoomId!, propertyId: existing.propertyId },
    });
    if (!room) {
      throw new AppError(404, 'Room not found in this property', 'NOT_FOUND');
    }

    // Serialize with create/assign-room: lock → fresh status check →
    // availability assert → rebuild stays → row update → totals, all in one
    // transaction. Without this, two concurrent date edits on the same
    // reservation interleaved deleteMany/insert and either 500'd with P2002
    // or lost nights (P1 hardening; regression: P1-A4b).
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${inventoryLockKey(existing.propertyId, room.roomTypeId)}))`;

        const fresh = await tx.reservation.findFirst({
          where: { id, tenantId },
          select: { status: true },
        });
        const holdsInventory = !!fresh && ACTIVE_STATUSES.includes(fresh.status);

        if (holdsInventory) {
          await assertRoomFree(tenantId, targetRoomId!, newArrival, newNights, id, tx);
        }
        await rebuildStays(id, targetRoomId!, newArrival, newNights, rate, tx);
        await tx.reservation.update({ where: { id }, data: reservationData });
        await syncReservationTotals(id, tx);
      },
      { maxWait: 15000, timeout: 15000 }
    );
    inventoryChanged = true;
  } else {
    await prisma.reservation.update({ where: { id }, data: reservationData });
    await syncReservationTotals(id);
  }

  await audit(
    `audit-res-update-${id}`,
    'update',
    'Reservation Updated',
    `Reservation ${existing.confirmationNumber} updated`,
    id,
    existing.confirmationNumber,
    tenantId,
    'low',
    { changedFields: Object.keys(input) },
    actor
  );

  const full = await getReservation(tenantId, id);
  broadcastReservationUpdated(toEventPayload(full));
  if (inventoryChanged) await refreshCacheAfterMutation(existing.propertyId);

  return full;
}

export async function checkInReservation(
  tenantId: string,
  id: string,
  actor: AuditActor = SYSTEM_ACTOR
) {
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

  // P1-C1: atomic transition guard. The status predicate lives INSIDE the
  // UPDATE, so a concurrent double-submit can flip at most one row — a
  // read-then-update here let both requests through (two transitions, two
  // audit rows). count === 0 means another request won the race.
  const guard = await prisma.reservation.updateMany({
    where: { id, tenantId, status: 'confirmed' },
    data: { status: 'checked_in', checkedInAt: new Date(), checkedInBy: actor.id },
  });
  if (guard.count === 0) {
    throw new AppError(409, 'Reservation was already checked in by another request', 'CONFLICT');
  }

  const updated = await prisma.reservation.findUniqueOrThrow({
    where: { id },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
      stays: { include: { room: { select: { id: true, number: true } } } },
    },
  });

  await audit(
    `audit-res-checkin-${id}`,
    'checkin',
    'Guest Checked In',
    `Guest ${updated.guest.firstName} ${updated.guest.lastName} checked in`,
    id,
    updated.confirmationNumber,
    tenantId,
    'low',
    undefined,
    actor
  );

  broadcastReservationCheckedIn(toEventPayload(updated));

  return updated;
}

export async function checkOutReservation(
  tenantId: string,
  id: string,
  actor: AuditActor = SYSTEM_ACTOR
) {
  const reservation = await getReservation(tenantId, id);

  if (reservation.status !== 'checked_in') {
    throw new AppError(
      409,
      `Cannot check out reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  // P1-C1: atomic transition guard — same pattern as check-in.
  const guard = await prisma.reservation.updateMany({
    where: { id, tenantId, status: 'checked_in' },
    data: { status: 'checked_out', checkedOutAt: new Date(), checkedOutBy: actor.id },
  });
  if (guard.count === 0) {
    throw new AppError(409, 'Reservation was already checked out by another request', 'CONFLICT');
  }

  const today = day(new Date());

  await prisma.$transaction([
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

  const updated = await prisma.reservation.findUniqueOrThrow({
    where: { id },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
    },
  });

  await audit(
    `audit-res-checkout-${id}`,
    'checkout',
    'Guest Checked Out',
    `Guest ${updated.guest.firstName} ${updated.guest.lastName} checked out`,
    id,
    updated.confirmationNumber,
    tenantId,
    'low',
    undefined,
    actor
  );

  broadcastReservationCheckedOut(toEventPayload(updated));

  return updated;
}

export async function cancelReservation(
  tenantId: string,
  id: string,
  reason?: string,
  actor: AuditActor = SYSTEM_ACTOR
) {
  const reservation = await getReservation(tenantId, id);

  if (['checked_out', 'cancelled', 'no_show'].includes(reservation.status)) {
    throw new AppError(
      409,
      `Cannot cancel reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  // Atomic: the status flip and the stay release commit together. A crash
  // between two separate statements used to leave a cancelled reservation
  // still blocking its room-nights (P1-A5 hardening).
  const [updated] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: actor.id,
        cancelReason: reason ?? null,
      },
      include: {
        guest: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true } },
      },
    }),
    prisma.reservationStay.deleteMany({ where: { reservationId: id } }),
  ]);

  await audit(
    `audit-res-cancel-${id}`,
    'cancel',
    'Reservation Cancelled',
    `Reservation ${updated.confirmationNumber} cancelled${reason ? `: ${reason}` : ''}`,
    id,
    updated.confirmationNumber,
    tenantId,
    'medium',
    { reason: reason ?? null },
    actor
  );

  broadcastReservationCancelled(toEventPayload(updated));
  await refreshCacheAfterMutation(reservation.propertyId);

  return updated;
}

export async function markNoShow(tenantId: string, id: string, actor: AuditActor = SYSTEM_ACTOR) {
  const reservation = await getReservation(tenantId, id);

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot mark no-show on reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  // Atomic: status flip + room-night release commit together (see cancelReservation).
  const [updated] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id },
      data: {
        status: 'no_show',
        noShowAt: new Date(),
      },
      include: {
        guest: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true } },
      },
    }),
    prisma.reservationStay.deleteMany({ where: { reservationId: id } }),
  ]);

  await audit(
    `audit-res-noshow-${id}`,
    'no_show',
    'No-Show Recorded',
    `Reservation ${updated.confirmationNumber} marked as no-show`,
    id,
    updated.confirmationNumber,
    tenantId,
    'medium',
    undefined,
    actor
  );

  broadcastReservationCancelled(toEventPayload(updated));
  await refreshCacheAfterMutation(reservation.propertyId);

  return updated;
}

export async function resendConfirmation(
  tenantId: string,
  id: string,
  actor: AuditActor = SYSTEM_ACTOR
) {
  const reservation = await getReservation(tenantId, id);
  if (reservation.status === 'cancelled') {
    throw new AppError(409, 'Cannot send confirmation for a cancelled reservation', 'CONFLICT');
  }

  await sendReservationConfirmation(tenantId, reservation.id, { force: true });

  await prisma.reservation.update({
    where: { id },
    data: { confirmationSentAt: new Date() },
  });

  await audit(
    `audit-res-resend-${id}`,
    'update',
    'Confirmation Resent',
    `Confirmation email resent for ${reservation.confirmationNumber}`,
    id,
    reservation.confirmationNumber,
    tenantId,
    'low',
    undefined,
    actor
  );

  return { success: true };
}

/* ─── Per-night rate editing ─── */
export async function updateStayRate(
  tenantId: string,
  stayId: string,
  rate: number,
  actor: AuditActor = SYSTEM_ACTOR
) {
  const stay = await prisma.reservationStay.findFirst({
    where: { id: stayId, reservation: { tenantId } },
    include: { reservation: { select: { id: true, confirmationNumber: true } } },
  });
  if (!stay) {
    throw new AppError(404, 'Stay not found', 'NOT_FOUND');
  }
  if (rate < 0) {
    throw new AppError(400, 'Rate cannot be negative', 'VALIDATION_ERROR');
  }

  await prisma.reservationStay.update({
    where: { id: stayId },
    data: { rate },
  });

  const { totalAmount, balance } = await syncReservationTotals(stay.reservationId);

  await audit(
    `audit-res-stayrate-${stayId}`,
    'update',
    'Night Rate Updated',
    `Night ${stay.date.toISOString().slice(0, 10)} rate set to ${rate} on ${stay.reservation.confirmationNumber}`,
    stay.reservationId,
    stay.reservation.confirmationNumber,
    tenantId,
    'low',
    { stayId, rate, totalAmount, balance },
    actor
  );

  return getReservation(tenantId, stay.reservationId);
}

/* ─── Traces (Opera-style internal alarm notes) ─── */
export async function listTraces(tenantId: string, reservationId: string) {
  await getReservation(tenantId, reservationId);
  return prisma.reservationTrace.findMany({
    where: { tenantId, reservationId },
    orderBy: [{ resolvedAt: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createTrace(
  tenantId: string,
  reservationId: string,
  input: z.infer<typeof createTraceSchema>,
  actor: AuditActor = SYSTEM_ACTOR
) {
  const reservation = await getReservation(tenantId, reservationId);

  const trace = await prisma.reservationTrace.create({
    data: {
      tenantId,
      reservationId,
      body: input.body,
      department: input.department,
      dueAt: input.dueAt ?? null,
      createdById: actor.id,
    },
  });

  await audit(
    `audit-res-trace-${trace.id}`,
    'update',
    'Trace Added',
    `Trace added to ${reservation.confirmationNumber}`,
    reservationId,
    reservation.confirmationNumber,
    tenantId,
    'low',
    { body: input.body, department: input.department },
    actor
  );

  return trace;
}

export async function resolveTrace(
  tenantId: string,
  traceId: string,
  actor: AuditActor = SYSTEM_ACTOR
) {
  const trace = await prisma.reservationTrace.findFirst({
    where: { id: traceId, tenantId },
  });
  if (!trace) {
    throw new AppError(404, 'Trace not found', 'NOT_FOUND');
  }

  const updated = await prisma.reservationTrace.update({
    where: { id: traceId },
    data: { resolvedAt: new Date(), resolvedBy: actor.id },
  });

  return updated;
}

/* ─── Companions (share-with) ─── */
export async function listCompanions(tenantId: string, reservationId: string) {
  await getReservation(tenantId, reservationId);
  return prisma.reservationCompanion.findMany({
    where: { tenantId, reservationId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addCompanion(
  tenantId: string,
  reservationId: string,
  input: z.infer<typeof addCompanionSchema>,
  actor: AuditActor = SYSTEM_ACTOR
) {
  const reservation = await getReservation(tenantId, reservationId);

  if (input.guestId) {
    const guest = await prisma.guest.findFirst({ where: { id: input.guestId, tenantId } });
    if (!guest) {
      throw new AppError(404, 'Guest not found', 'NOT_FOUND');
    }
  }

  const companion = await prisma.reservationCompanion.create({
    data: {
      tenantId,
      reservationId,
      guestId: input.guestId ?? null,
      firstName: input.firstName,
      lastName: input.lastName,
      relationship: input.relationship ?? null,
      sharesFolio: input.sharesFolio,
    },
  });

  await audit(
    `audit-res-companion-${companion.id}`,
    'update',
    'Companion Added',
    `Companion ${input.firstName} ${input.lastName} added to ${reservation.confirmationNumber}`,
    reservationId,
    reservation.confirmationNumber,
    tenantId,
    'low',
    undefined,
    actor
  );

  return companion;
}

export async function removeCompanion(
  tenantId: string,
  companionId: string,
  actor: AuditActor = SYSTEM_ACTOR
) {
  void actor; // companion removal audited at reservation level
  const companion = await prisma.reservationCompanion.findFirst({
    where: { id: companionId, tenantId },
  });
  if (!companion) {
    throw new AppError(404, 'Companion not found', 'NOT_FOUND');
  }

  await prisma.reservationCompanion.delete({ where: { id: companionId } });

  return { success: true };
}

export async function deleteReservation(
  tenantId: string,
  id: string,
  actor: AuditActor = SYSTEM_ACTOR
) {
  const reservation = await getReservation(tenantId, id);

  if (reservation.status === 'checked_in') {
    throw new AppError(409, 'Cannot delete a checked-in reservation', 'CONFLICT');
  }

  await prisma.$transaction([
    prisma.reservationTrace.deleteMany({ where: { reservationId: id } }),
    prisma.reservationCompanion.deleteMany({ where: { reservationId: id } }),
    prisma.folioItem.deleteMany({ where: { folio: { reservationId: id } } }),
    prisma.folio.deleteMany({ where: { reservationId: id } }),
    prisma.reservationStay.deleteMany({ where: { reservationId: id } }),
    prisma.reservation.deleteMany({ where: { id, tenantId } }),
  ]);

  await audit(
    `audit-res-delete-${id}`,
    'delete',
    'Reservation Deleted',
    `Reservation ${reservation.confirmationNumber} deleted`,
    id,
    reservation.confirmationNumber,
    tenantId,
    'high',
    undefined,
    actor
  );

  return { success: true };
}
