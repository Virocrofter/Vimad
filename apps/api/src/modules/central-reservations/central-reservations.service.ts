/* apps/api/src/modules/central-reservations/central-reservations.service.ts — C4
 * Central reservations desk: any property bookable from any front desk.
 * Availability math mirrors the A4 public booking engine internals. */
import { randomBytes } from 'node:crypto';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const DAY_MS = 86_400_000;
const OOO_STATUSES = ['ooo', 'out_of_order', 'maintenance', 'do_not_sell'];
const ACTIVE_RES = ['confirmed', 'checked_in'];

const dayStart = (s: string) => new Date(`${s}T00:00:00.000Z`);
const dayKeyOf = (d: Date) => d.toISOString().slice(0, 10);
const r2 = (n: number) => Math.round(n * 100) / 100;

function nightsBetween(from: string, to: string) {
  return Math.round((dayStart(to).getTime() - dayStart(from).getTime()) / DAY_MS);
}

async function getReservationDetail(tenantId: string, id: string) {
  const res = await prisma.reservation.findFirst({
    where: { id, tenantId },
    include: {
      property: { select: { id: true, name: true, code: true, city: true } },
      guest: { select: { id: true, firstName: true, lastName: true, email: true } },
      roomType: { select: { id: true, name: true } },
      stays: { select: { id: true, date: true, rate: true, roomId: true } },
    },
  });
  if (!res) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  return {
    id: res.id,
    confirmationNumber: res.confirmationNumber,
    status: res.status,
    source: res.source,
    arrivalDate: res.arrivalDate,
    departureDate: res.departureDate,
    nights: res.nights,
    adults: res.adults,
    children: res.children,
    totalAmount: Number(res.totalAmount),
    balance: Number(res.balance),
    property: res.property,
    guest: res.guest,
    roomType: res.roomType,
    stayCount: res.stays.length,
  };
}

export async function availability(tenantId: string, from: string, to: string) {
  const nights = nightsBetween(from, to);
  if (!Number.isFinite(nights) || nights < 1 || nights > 60) {
    throw new AppError(400, 'Invalid date range (1–60 nights)', 'VALIDATION_ERROR');
  }
  const fromD = dayStart(from);
  const toD = dayStart(to);

  const properties = await prisma.property.findMany({
    where: { tenantId, status: 'active' },
    orderBy: { code: 'asc' },
    include: { rooms: { include: { roomType: { select: { id: true, name: true } } } } },
  });
  const ids = properties.map((p) => p.id);

  const stays = ids.length
    ? await prisma.reservationStay.findMany({
        where: {
          date: { gte: fromD, lt: toD },
          reservation: { tenantId, propertyId: { in: ids }, status: { in: ACTIVE_RES } },
        },
        select: { roomId: true, date: true, reservation: { select: { propertyId: true } } },
      })
    : [];

  const occByPropDay = new Map<string, Map<string, Set<string>>>();
  for (const s of stays) {
    const pid = s.reservation.propertyId;
    if (!occByPropDay.has(pid)) occByPropDay.set(pid, new Map());
    const m = occByPropDay.get(pid)!;
    const dk = dayKeyOf(s.date);
    if (!m.has(dk)) m.set(dk, new Set());
    m.get(dk)!.add(s.roomId);
  }

  const days: string[] = [];
  for (let t = fromD.getTime(); t < toD.getTime(); t += DAY_MS)
    days.push(new Date(t).toISOString().slice(0, 10));

  const result = [];
  for (const p of properties) {
    const types = new Map<
      string,
      { id: string; name: string; total: number; ooo: number; roomIds: string[] }
    >();
    for (const room of p.rooms) {
      const rt = room.roomType;
      if (!types.has(rt.id))
        types.set(rt.id, { id: rt.id, name: rt.name, total: 0, ooo: 0, roomIds: [] });
      const entry = types.get(rt.id)!;
      entry.total += 1;
      if (OOO_STATUSES.includes(room.status)) entry.ooo += 1;
      entry.roomIds.push(room.id);
    }
    const occ = occByPropDay.get(p.id) ?? new Map<string, Set<string>>();
    const roomTypes = [];
    for (const t of types.values()) {
      const sellable = t.total - t.ooo;
      let minRemaining = sellable;
      for (const d of days) {
        const daySet = occ.get(d);
        let occupied = 0;
        if (daySet) for (const rid of t.roomIds) if (daySet.has(rid)) occupied += 1;
        minRemaining = Math.min(minRemaining, sellable - occupied);
      }
      const plan = await prisma.ratePlan.findFirst({
        where: { roomTypeId: t.id, status: 'active' },
        orderBy: { baseRate: 'asc' },
        select: { baseRate: true, currency: true },
      });
      roomTypes.push({
        id: t.id,
        name: t.name,
        total: t.total,
        sellable,
        minRemaining,
        available: minRemaining > 0,
        rate: plan ? Number(plan.baseRate) : null,
        currency: plan?.currency ?? p.currency,
      });
    }
    roomTypes.sort((a, b) => a.name.localeCompare(b.name));
    result.push({
      id: p.id,
      name: p.name,
      code: p.code,
      city: p.city,
      currency: p.currency,
      roomTypes,
    });
  }
  return { from, to, nights, properties: result };
}

async function pickRoom(
  propertyId: string,
  roomTypeId: string | undefined,
  fromD: Date,
  toD: Date,
  excludeReservationId?: string
) {
  const rooms = await prisma.room.findMany({
    where: {
      propertyId,
      ...(roomTypeId ? { roomTypeId } : {}),
      status: { notIn: OOO_STATUSES },
    },
    orderBy: { number: 'asc' },
  });
  for (const room of rooms) {
    const clash = await prisma.reservationStay.findFirst({
      where: {
        roomId: room.id,
        date: { gte: fromD, lt: toD },
        reservation: {
          status: { in: ACTIVE_RES },
          ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
        },
      },
      select: { id: true },
    });
    if (!clash) return room;
  }
  return null;
}

export async function createBooking(
  tenantId: string,
  body: {
    propertyId: string;
    roomTypeId?: string;
    ratePlanId?: string;
    arrivalDate: string;
    departureDate: string;
    adults: number;
    children: number;
    guestId?: string;
    guest?: { firstName: string; lastName: string; email?: string; phone?: string };
    notes?: string;
  }
) {
  const nights = nightsBetween(body.arrivalDate, body.departureDate);
  if (!Number.isFinite(nights) || nights < 1 || nights > 60) {
    throw new AppError(400, 'Invalid date range (1–60 nights)', 'VALIDATION_ERROR');
  }
  const property = await prisma.property.findFirst({ where: { id: body.propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');
  if (body.roomTypeId) {
    const rt = await prisma.roomType.findFirst({
      where: { id: body.roomTypeId, propertyId: property.id },
    });
    if (!rt) throw new AppError(404, 'Room type not found at this property', 'NOT_FOUND');
  }

  const fromD = dayStart(body.arrivalDate);
  const toD = dayStart(body.departureDate);
  const room = await pickRoom(property.id, body.roomTypeId, fromD, toD);
  if (!room) {
    throw new AppError(
      409,
      'No availability for the selected room type and dates',
      'NO_AVAILABILITY'
    );
  }

  let guest;
  if (body.guestId) {
    guest = await prisma.guest.findFirst({ where: { id: body.guestId, tenantId } });
    if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  } else if (body.guest?.email) {
    const email = body.guest.email.trim().toLowerCase();
    guest =
      (await prisma.guest.findFirst({ where: { tenantId, email } })) ??
      (await prisma.guest.create({
        data: {
          tenantId,
          firstName: body.guest.firstName,
          lastName: body.guest.lastName,
          email,
          phone: body.guest.phone ?? null,
        },
      }));
  } else if (body.guest) {
    guest = await prisma.guest.create({
      data: {
        tenantId,
        firstName: body.guest.firstName,
        lastName: body.guest.lastName,
        phone: body.guest.phone ?? null,
      },
    });
  } else {
    throw new AppError(400, 'guestId or guest is required', 'VALIDATION_ERROR');
  }

  let plan = null;
  if (body.ratePlanId) {
    plan = await prisma.ratePlan.findFirst({
      where: { id: body.ratePlanId, propertyId: property.id, status: 'active' },
    });
    if (!plan) throw new AppError(404, 'Rate plan not found', 'NOT_FOUND');
  } else {
    plan = await prisma.ratePlan.findFirst({
      where: { roomTypeId: room.roomTypeId, status: 'active' },
      orderBy: { baseRate: 'asc' },
    });
  }
  const rate = plan ? Number(plan.baseRate) : 0;
  const total = r2(rate * nights);
  const dayList: Date[] = [];
  for (let t = fromD.getTime(); t < toD.getTime(); t += DAY_MS) dayList.push(new Date(t));

  let reservation = null;
  for (let attempt = 0; attempt < 3 && !reservation; attempt++) {
    const confirmationNumber = `VMD-${randomBytes(4).toString('hex').toUpperCase()}`;
    try {
      reservation = await prisma.reservation.create({
        data: {
          tenantId,
          propertyId: property.id,
          guestId: guest.id,
          confirmationNumber,
          status: 'confirmed',
          source: 'central_desk',
          arrivalDate: fromD,
          departureDate: toD,
          nights,
          adults: body.adults,
          children: body.children,
          notes: body.notes ?? null,
          roomTypeId: room.roomTypeId,
          ratePlanId: plan?.id ?? null,
          totalAmount: total,
          balance: total,
          stays: { create: dayList.map((date) => ({ roomId: room.id, date, rate })) },
          folio: {
            create: {
              tenantId,
              totalCharges: total,
              balance: total,
              items: {
                create: dayList.map((_, i) => ({
                  type: 'room_charge',
                  description: `Room charge - Night ${i + 1}`,
                  amount: rate,
                })),
              },
            },
          },
        },
      });
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err;
    }
  }
  if (!reservation)
    throw new AppError(500, 'Could not allocate a confirmation number', 'INTERNAL_ERROR');
  return getReservationDetail(tenantId, reservation.id);
}

export async function moveReservation(
  tenantId: string,
  reservationId: string,
  propertyId: string,
  roomTypeId?: string
) {
  const res = await prisma.reservation.findFirst({ where: { id: reservationId, tenantId } });
  if (!res) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  if (!ACTIVE_RES.includes(res.status)) {
    throw new AppError(
      409,
      'Only confirmed or in-house reservations can be moved',
      'INVALID_STATUS'
    );
  }
  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Target property not found', 'NOT_FOUND');
  if (roomTypeId) {
    const rt = await prisma.roomType.findFirst({
      where: { id: roomTypeId, propertyId: property.id },
    });
    if (!rt) throw new AppError(404, 'Room type not found at target property', 'NOT_FOUND');
  }

  const fromD = res.arrivalDate;
  const toD = res.departureDate;
  const room = await pickRoom(property.id, roomTypeId, fromD, toD, res.id);
  if (!room) {
    throw new AppError(
      409,
      'No availability at the target property for these dates',
      'NO_AVAILABILITY'
    );
  }
  const rate = res.nights > 0 ? Number(res.totalAmount) / res.nights : 0;
  const dayList: Date[] = [];
  for (let t = fromD.getTime(); t < toD.getTime(); t += DAY_MS) dayList.push(new Date(t));

  await prisma.$transaction([
    prisma.reservationStay.deleteMany({ where: { reservationId: res.id } }),
    prisma.reservation.update({
      where: { id: res.id },
      data: { propertyId: property.id, roomTypeId: room.roomTypeId },
    }),
    prisma.reservationStay.createMany({
      data: dayList.map((date) => ({ reservationId: res.id, roomId: room.id, date, rate })),
    }),
  ]);
  return getReservationDetail(tenantId, res.id);
}

export async function listReservations(tenantId: string) {
  const reservations = await prisma.reservation.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      property: { select: { id: true, name: true, code: true } },
      guest: { select: { id: true, firstName: true, lastName: true } },
      roomType: { select: { id: true, name: true } },
      _count: { select: { stays: true } },
    },
  });
  return reservations.map((r) => ({
    id: r.id,
    confirmationNumber: r.confirmationNumber,
    status: r.status,
    source: r.source,
    arrivalDate: r.arrivalDate,
    departureDate: r.departureDate,
    nights: r.nights,
    adults: r.adults,
    children: r.children,
    totalAmount: Number(r.totalAmount),
    property: r.property,
    guest: r.guest,
    roomType: r.roomType,
    stayCount: r._count.stays,
    createdAt: r.createdAt,
  }));
}
