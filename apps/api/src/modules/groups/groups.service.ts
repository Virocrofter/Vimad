/* apps/api/src/modules/groups/groups.service.ts — G1: Groups & room blocks */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { paginationSchema, skipTake, paginate } from '../../common/pagination.js';
import type { z } from 'zod';

type PaginationInput = z.infer<typeof paginationSchema>;

const ACTIVE_MEMBER_STATUSES = ['confirmed', 'checked_in'];

/* ─── Internal helpers ─── */

function nightsBetween(arrival: Date, departure: Date): number {
  const n = Math.round((departure.getTime() - arrival.getTime()) / 86_400_000);
  return Math.max(n, 1);
}

async function nextGroupCode(tenantId: string): Promise<string> {
  // Sequential human code (GRP-1001…) with retry on the unique constraint —
  // same idea as the A5 invoice counter, without needing a counter table.
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await prisma.group.count({ where: { tenantId } });
    const code = `GRP-${1001 + count + attempt}`;
    const clash = await prisma.group.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (!clash) return code;
  }
  return `GRP-${Date.now().toString(36).toUpperCase()}`;
}

function newConfirmationNumber(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GRP-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

function dec(n: unknown): number {
  return Number(n ?? 0);
}

async function assertGroup(tenantId: string, id: string) {
  const group = await prisma.group.findFirst({ where: { id, tenantId } });
  if (!group) throw new AppError(404, 'Group not found', 'GROUP_NOT_FOUND');
  return group;
}

/** Rooms of a property with NO stay overlapping [arrival, departure). */
async function availableRooms(
  tenantId: string,
  propertyId: string,
  arrival: Date,
  departure: Date
) {
  const occupied = await prisma.reservationStay.findMany({
    where: {
      date: { gte: arrival, lt: departure },
      room: { tenantId, propertyId },
    },
    select: { roomId: true },
    distinct: ['roomId'],
    // exclude this group's own holds when recomputing for the same group
  });
  const occupiedIds = occupied.map((s) => s.roomId);
  return prisma.room.findMany({
    where: {
      tenantId,
      propertyId,
      status: { not: 'out_of_service' },
      ...(occupiedIds.length > 0 ? { id: { notIn: occupiedIds } } : {}),
    },
    include: { roomType: { select: { id: true, name: true } } },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  });
}

async function memberSummaries(reservations: any[]) {
  return reservations.map((r) => ({
    id: r.id,
    confirmationNumber: r.confirmationNumber,
    status: r.status,
    guestId: r.guest.id,
    guestName: `${r.guest.firstName} ${r.guest.lastName}`,
    email: r.guest.email,
    phone: r.guest.phone,
    roomTypeId: r.roomTypeId,
    roomTypeName: r.roomType?.name ?? null,
    roomNumber: r.stays[0]?.room.number ?? null,
    arrivalDate: r.arrivalDate,
    departureDate: r.departureDate,
    nights: r.nights,
    rate: dec(r.stays[0]?.rate ?? 0),
    totalAmount: dec(r.totalAmount),
    balance: dec(r.balance),
    checkedIn: r.status === 'checked_in',
    notes: r.notes,
  }));
}

/* ─── List ─── */

export async function listGroups(
  tenantId: string,
  query: PaginationInput & {
    status?: string;
    blockType?: string;
    q?: string;
    propertyId?: string;
    upcoming?: string;
  }
) {
  const where: any = { tenantId };
  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.status) where.status = query.status;
  if (query.blockType) where.blockType = query.blockType;
  if (query.upcoming === 'true') where.arrivalDate = { gte: new Date() };
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { code: { contains: query.q, mode: 'insensitive' } },
      { company: { contains: query.q, mode: 'insensitive' } },
      { contactName: { contains: query.q, mode: 'insensitive' } },
    ];
  }

  const [total, groups] = await Promise.all([
    prisma.group.count({ where }),
    prisma.group.findMany({
      where,
      orderBy: [{ arrivalDate: 'asc' }],
      ...skipTake(query),
      include: {
        roomBlocks: { include: { roomType: { select: { id: true, name: true } } } },
        _count: { select: { reservations: { where: { status: { in: ACTIVE_MEMBER_STATUSES } } } } },
      },
    }),
  ]);

  const data = groups.map((g) => {
    const roomsBlocked = g.roomBlocks.reduce((s, b) => s + b.roomsBlocked, 0);
    const roomsPickedUp = g._count.reservations;
    return {
      id: g.id,
      code: g.code,
      name: g.name,
      company: g.company,
      contactName: g.contactName,
      contactEmail: g.contactEmail,
      status: g.status,
      blockType: g.blockType,
      arrivalDate: g.arrivalDate,
      departureDate: g.departureDate,
      cutOffDate: g.cutOffDate,
      eventSpace: g.eventSpace,
      rate: g.rate ? dec(g.rate) : null,
      roomsBlocked,
      roomsPickedUp,
      pickupPct: roomsBlocked > 0 ? Math.round((roomsPickedUp / roomsBlocked) * 100) : 0,
      memberCount: roomsPickedUp,
      propertyId: g.propertyId,
      createdAt: g.createdAt,
    };
  });

  return paginate(data, total, query);
}

/* ─── Detail ─── */

export async function getGroupDetail(tenantId: string, id: string) {
  const group = await assertGroup(tenantId, id);

  const [blocks, reservations, charges, payments, events, freeRooms] = await Promise.all([
    prisma.groupRoomBlock.findMany({
      where: { groupId: id },
      include: { roomType: { select: { id: true, name: true, code: true } } },
    }),
    prisma.reservation.findMany({
      where: { groupId: id },
      include: {
        guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        roomType: { select: { id: true, name: true } },
        stays: {
          take: 1,
          include: { room: { select: { number: true } } },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.groupCharge.findMany({ where: { groupId: id }, orderBy: { postedAt: 'desc' } }),
    prisma.groupPayment.findMany({ where: { groupId: id }, orderBy: { receivedAt: 'desc' } }),
    prisma.groupEvent.findMany({ where: { groupId: id }, orderBy: { date: 'asc' } }),
    availableRooms(tenantId, group.propertyId, group.arrivalDate, group.departureDate),
  ]);

  const blockRows = await Promise.all(
    blocks.map(async (b) => {
      const roomsPickedUp = reservations.filter(
        (r) => r.roomTypeId === b.roomTypeId && ACTIVE_MEMBER_STATUSES.includes(r.status)
      ).length;
      const freeOfType = freeRooms.filter((r) => r.roomTypeId === b.roomTypeId).length;
      return {
        id: b.id,
        roomTypeId: b.roomTypeId,
        roomTypeName: b.roomType.name,
        roomsBlocked: b.roomsBlocked,
        rate: b.rate ? dec(b.rate) : null,
        notes: b.notes,
        roomsPickedUp,
        roomsAvailable: freeOfType,
        overblocked: b.roomsBlocked > freeOfType + roomsPickedUp,
      };
    })
  );

  const roomsBlocked = blocks.reduce((s, b) => s + b.roomsBlocked, 0);
  const roomsPickedUp = reservations.filter((r) =>
    ACTIVE_MEMBER_STATUSES.includes(r.status)
  ).length;
  const totalCharges = charges.reduce((s, c) => s + dec(c.amount) * c.quantity, 0);
  const totalPayments = payments.reduce((s, p) => s + dec(p.amount), 0);
  const nights = nightsBetween(group.arrivalDate, group.departureDate);
  const projectedRoomRevenue = blocks.reduce(
    (s, b) => s + b.roomsBlocked * dec(b.rate ?? group.rate ?? 0) * nights,
    0
  );
  const freeByType: Record<string, number> = {};
  for (const r of freeRooms) freeByType[r.roomTypeId] = (freeByType[r.roomTypeId] ?? 0) + 1;

  return {
    group: {
      id: group.id,
      code: group.code,
      name: group.name,
      company: group.company,
      contactName: group.contactName,
      contactEmail: group.contactEmail,
      contactPhone: group.contactPhone,
      blockType: group.blockType,
      status: group.status,
      arrivalDate: group.arrivalDate,
      departureDate: group.departureDate,
      cutOffDate: group.cutOffDate,
      rate: group.rate ? dec(group.rate) : null,
      eventSpace: group.eventSpace,
      notes: group.notes,
      propertyId: group.propertyId,
      createdAt: group.createdAt,
    },
    stats: {
      roomsBlocked,
      roomsPickedUp,
      pickupPct: roomsBlocked > 0 ? Math.round((roomsPickedUp / roomsBlocked) * 100) : 0,
      memberCount: reservations.length,
      nights,
      projectedRoomRevenue,
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments,
    },
    blocks: blockRows,
    freeRooms: freeRooms.map((r) => ({
      id: r.id,
      number: r.number,
      floor: r.floor,
      status: r.status,
      roomTypeId: r.roomTypeId,
      roomTypeName: r.roomType.name,
    })),
    freeByType,
    reservations: await memberSummaries(reservations),
    charges: charges.map((c) => ({
      id: c.id,
      type: c.type,
      description: c.description,
      amount: dec(c.amount),
      quantity: c.quantity,
      total: dec(c.amount) * c.quantity,
      postedAt: c.postedAt,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: dec(p.amount),
      reference: p.reference,
      note: p.note,
      receivedAt: p.receivedAt,
    })),
    events,
  };
}

/* ─── Create / update ─── */

export async function createGroup(
  tenantId: string,
  userId: string,
  input: {
    propertyId: string;
    name: string;
    company?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    blockType?: string;
    status?: string;
    arrivalDate: string;
    departureDate: string;
    cutOffDate?: string;
    rate?: number;
    eventSpace?: string;
    notes?: string;
    blocks?: { roomTypeId: string; roomsBlocked: number; rate?: number; notes?: string }[];
  }
) {
  const arrival = new Date(input.arrivalDate);
  const departure = new Date(input.departureDate);
  if (departure <= arrival) {
    throw new AppError(400, 'Departure must be after arrival', 'VALIDATION_ERROR');
  }
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) throw new AppError(404, 'Property not found', 'PROPERTY_NOT_FOUND');

  if (input.blocks?.length) {
    const typeIds = input.blocks.map((b) => b.roomTypeId);
    const count = await prisma.roomType.count({
      where: { id: { in: typeIds }, tenantId },
    });
    if (count !== typeIds.length) {
      throw new AppError(400, 'One or more room types are invalid', 'VALIDATION_ERROR');
    }
  }

  const code = await nextGroupCode(tenantId);
  const group = await prisma.group.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      code,
      name: input.name,
      company: input.company,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      blockType: input.blockType ?? 'courtesy',
      status: input.status ?? 'prospect',
      arrivalDate: arrival,
      departureDate: departure,
      cutOffDate: input.cutOffDate ? new Date(input.cutOffDate) : null,
      rate: input.rate,
      eventSpace: input.eventSpace,
      notes: input.notes,
      createdById: userId,
      roomBlocks: {
        create: (input.blocks ?? []).map((b) => ({
          roomTypeId: b.roomTypeId,
          roomsBlocked: b.roomsBlocked,
          rate: b.rate,
          notes: b.notes,
        })),
      },
    },
  });

  logger.info({ groupId: group.id, code, tenantId }, 'group created');
  return getGroupDetail(tenantId, group.id);
}

const GROUP_STATUSES = ['prospect', 'tentative', 'definite', 'cancelled', 'completed'];

export async function updateGroup(tenantId: string, id: string, input: Record<string, unknown>) {
  await assertGroup(tenantId, id);
  if (input.status && !GROUP_STATUSES.includes(input.status as string)) {
    throw new AppError(
      400,
      `Invalid status. Use: ${GROUP_STATUSES.join(', ')}`,
      'VALIDATION_ERROR'
    );
  }
  if (input.arrivalDate || input.departureDate) {
    const current = await prisma.group.findUniqueOrThrow({ where: { id } });
    const arrival = input.arrivalDate ? new Date(input.arrivalDate as string) : current.arrivalDate;
    const departure = input.departureDate
      ? new Date(input.departureDate as string)
      : current.departureDate;
    if (departure <= arrival) {
      throw new AppError(400, 'Departure must be after arrival', 'VALIDATION_ERROR');
    }
  }
  const data: any = {};
  for (const key of [
    'name',
    'company',
    'contactName',
    'contactEmail',
    'contactPhone',
    'blockType',
    'status',
    'eventSpace',
    'notes',
    'rate',
  ]) {
    if (input[key] !== undefined) data[key] = input[key];
  }
  if (input.arrivalDate) data.arrivalDate = new Date(input.arrivalDate as string);
  if (input.departureDate) data.departureDate = new Date(input.departureDate as string);
  if (input.cutOffDate !== undefined) {
    data.cutOffDate = input.cutOffDate ? new Date(input.cutOffDate as string) : null;
  }
  await prisma.group.update({ where: { id }, data });
  return getGroupDetail(tenantId, id);
}

/* ─── Blocks ─── */

export async function addBlock(
  tenantId: string,
  groupId: string,
  input: { roomTypeId: string; roomsBlocked: number; rate?: number; notes?: string }
) {
  const group = await assertGroup(tenantId, groupId);
  const rt = await prisma.roomType.findFirst({ where: { id: input.roomTypeId, tenantId } });
  if (!rt) throw new AppError(400, 'Invalid room type', 'VALIDATION_ERROR');
  await prisma.groupRoomBlock.create({
    data: {
      groupId,
      roomTypeId: input.roomTypeId,
      roomsBlocked: input.roomsBlocked,
      rate: input.rate,
      notes: input.notes,
    },
  });
  return getGroupDetail(tenantId, group.id);
}

export async function updateBlock(
  tenantId: string,
  groupId: string,
  blockId: string,
  input: { roomsBlocked?: number; rate?: number; notes?: string }
) {
  await assertGroup(tenantId, groupId);
  const block = await prisma.groupRoomBlock.findFirst({ where: { id: blockId, groupId } });
  if (!block) throw new AppError(404, 'Room block not found', 'BLOCK_NOT_FOUND');
  await prisma.groupRoomBlock.update({
    where: { id: blockId },
    data: {
      ...(input.roomsBlocked !== undefined ? { roomsBlocked: input.roomsBlocked } : {}),
      ...(input.rate !== undefined ? { rate: input.rate } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
  return getGroupDetail(tenantId, groupId);
}

export async function deleteBlock(tenantId: string, groupId: string, blockId: string) {
  await assertGroup(tenantId, groupId);
  const block = await prisma.groupRoomBlock.findFirst({ where: { id: blockId, groupId } });
  if (!block) throw new AppError(404, 'Room block not found', 'BLOCK_NOT_FOUND');
  await prisma.groupRoomBlock.delete({ where: { id: blockId } });
  return getGroupDetail(tenantId, groupId);
}

/* ─── Members (rooming list) ─── */

interface MemberRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  roomTypeId?: string;
  roomId?: string;
  arrivalDate?: string;
  departureDate?: string;
  adults?: number;
  children?: number;
  notes?: string;
}

async function createMemberReservation(group: any, row: MemberRow) {
  const arrival = row.arrivalDate ? new Date(row.arrivalDate) : group.arrivalDate;
  const departure = row.departureDate ? new Date(row.departureDate) : group.departureDate;
  if (departure <= arrival) {
    throw new AppError(
      400,
      `Departure must be after arrival for ${row.firstName} ${row.lastName}`,
      'VALIDATION_ERROR'
    );
  }
  const nights = nightsBetween(arrival, departure);

  const block = row.roomTypeId
    ? await prisma.groupRoomBlock.findFirst({
        where: { groupId: group.id, roomTypeId: row.roomTypeId },
      })
    : null;
  const rate = dec(block?.rate ?? group.rate ?? 0);
  const total = rate * nights;

  // Guest: reuse by email when present, otherwise create.
  let guest = row.email
    ? await prisma.guest.findFirst({
        where: { tenantId: group.tenantId, email: { equals: row.email, mode: 'insensitive' } },
      })
    : null;
  guest ??= await prisma.guest.create({
    data: {
      tenantId: group.tenantId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
    },
  });

  // Optional pre-assigned room must exist, belong to the property, be free.
  let room = null;
  if (row.roomId) {
    room = await prisma.room.findFirst({
      where: { id: row.roomId, tenantId: group.tenantId, propertyId: group.propertyId },
      include: { roomType: true },
    });
    if (!room)
      throw new AppError(400, `Room ${row.roomId} not found in property`, 'VALIDATION_ERROR');
    const clash = await prisma.reservationStay.findFirst({
      where: { roomId: room.id, date: { gte: arrival, lt: departure } },
    });
    if (clash)
      throw new AppError(
        409,
        `Room ${room.number} is not available for those dates`,
        'ROOM_NOT_AVAILABLE'
      );
  }

  const roomTypeId = row.roomTypeId ?? room?.roomTypeId ?? null;

  return prisma.reservation.create({
    data: {
      tenantId: group.tenantId,
      propertyId: group.propertyId,
      guestId: guest.id,
      groupId: group.id,
      roomTypeId,
      confirmationNumber: newConfirmationNumber(),
      status: 'confirmed',
      source: 'group',
      arrivalDate: arrival,
      departureDate: departure,
      nights,
      adults: row.adults ?? 2,
      children: row.children ?? 0,
      notes: row.notes,
      totalAmount: total,
      balance: total,
      ...(room
        ? {
            stays: {
              create: Array.from({ length: nights }).map((_, i) => ({
                roomId: room!.id,
                date: new Date(arrival.getTime() + i * 86_400_000),
                rate,
              })),
            },
            folio: {
              create: {
                tenantId: group.tenantId,
                totalCharges: total,
                balance: total,
                items: {
                  create: Array.from({ length: nights }).map((_, i) => ({
                    type: 'room_charge',
                    description: `Room charge - Night ${i + 1} (${group.code})`,
                    amount: rate,
                  })),
                },
              },
            },
          }
        : {}),
    },
  });
}

export async function addMember(tenantId: string, groupId: string, row: MemberRow) {
  const group = await assertGroup(tenantId, groupId);
  if (group.status === 'cancelled') {
    throw new AppError(409, 'Cannot add members to a cancelled group', 'GROUP_CANCELLED');
  }
  await createMemberReservation(group, row);
  return getGroupDetail(tenantId, groupId);
}

export async function importRoomingList(tenantId: string, groupId: string, rows: MemberRow[]) {
  const group = await assertGroup(tenantId, groupId);
  if (rows.length === 0) throw new AppError(400, 'No rows supplied', 'VALIDATION_ERROR');
  if (rows.length > 500) throw new AppError(400, 'Maximum 500 rows per import', 'VALIDATION_ERROR');
  let created = 0;
  for (const row of rows) {
    await createMemberReservation(group, row); // throws on first bad row → atomic-ish by caller choice
    created++;
  }
  logger.info({ groupId, created, tenantId }, 'rooming list imported');
  return getGroupDetail(tenantId, groupId);
}

export async function linkReservation(tenantId: string, groupId: string, reservationId: string) {
  await assertGroup(tenantId, groupId);
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'RESERVATION_NOT_FOUND');
  if (reservation.groupId && reservation.groupId !== groupId) {
    throw new AppError(409, 'Reservation already belongs to another group', 'RESERVATION_IN_GROUP');
  }
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { groupId, source: 'group' },
  });
  return getGroupDetail(tenantId, groupId);
}

export async function removeMember(tenantId: string, groupId: string, reservationId: string) {
  await assertGroup(tenantId, groupId);
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, tenantId, groupId },
  });
  if (!reservation)
    throw new AppError(404, 'Member reservation not found in this group', 'RESERVATION_NOT_FOUND');
  await prisma.reservation.update({
    where: { id: reservationId },
    data: { groupId: null },
  });
  return getGroupDetail(tenantId, groupId);
}

/* ─── Master folio ledger ─── */

export async function postCharge(
  tenantId: string,
  groupId: string,
  input: { type?: string; description: string; amount: number; quantity?: number }
) {
  await assertGroup(tenantId, groupId);
  if (input.amount <= 0) throw new AppError(400, 'Amount must be positive', 'VALIDATION_ERROR');
  await prisma.groupCharge.create({
    data: {
      groupId,
      type: input.type ?? 'misc',
      description: input.description,
      amount: input.amount,
      quantity: input.quantity ?? 1,
    },
  });
  return getGroupDetail(tenantId, groupId);
}

export async function recordPayment(
  tenantId: string,
  groupId: string,
  input: { method?: string; amount: number; reference?: string; note?: string }
) {
  await assertGroup(tenantId, groupId);
  if (input.amount <= 0) throw new AppError(400, 'Amount must be positive', 'VALIDATION_ERROR');
  await prisma.groupPayment.create({
    data: {
      groupId,
      method: input.method ?? 'bank_transfer',
      amount: input.amount,
      reference: input.reference,
      note: input.note,
    },
  });
  return getGroupDetail(tenantId, groupId);
}

/* ─── Events (BEO-lite) ─── */

export async function addEvent(
  tenantId: string,
  groupId: string,
  input: {
    name: string;
    venue?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    guests?: number;
    status?: string;
    tags?: string[];
    notes?: string;
  }
) {
  await assertGroup(tenantId, groupId);
  await prisma.groupEvent.create({
    data: {
      groupId,
      name: input.name,
      venue: input.venue,
      date: new Date(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      guests: input.guests ?? 0,
      status: input.status ?? 'tentative',
      tags: input.tags ?? [],
      notes: input.notes,
    },
  });
  return getGroupDetail(tenantId, groupId);
}

export async function deleteEvent(tenantId: string, groupId: string, eventId: string) {
  await assertGroup(tenantId, groupId);
  const event = await prisma.groupEvent.findFirst({ where: { id: eventId, groupId } });
  if (!event) throw new AppError(404, 'Event not found', 'EVENT_NOT_FOUND');
  await prisma.groupEvent.delete({ where: { id: eventId } });
  return getGroupDetail(tenantId, groupId);
}
