import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SPAN_DAYS = 120;

export interface RoomPlanQuery {
  tenantId: string;
  propertyId: string;
  from: string;
  to: string;
}

interface BlockRow {
  id: string;
  roomId: string | null;
  roomTypeId: string | null;
  type: string;
  status: string;
  reason: string | null;
  startDate: string;
  endDate: string;
}

interface ReservationRow {
  id: string;
  confirmationNumber: string;
  status: string;
  source: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  eta: string | null;
  specialRequests: string | null;
  marketSegment: string | null;
  houseUse: boolean;
  guaranteed: boolean;
  doNotMove: boolean;
  fixedRoom: boolean;
  depositDue: string;
  depositPaid: string;
  totalAmount: string;
  balance: string;
  checkedInAt: Date | null;
  roomTypeId: string | null;
  groupId: string | null;
  guestId: string;
}

interface GuestRow {
  id: string;
  firstName: string;
  lastName: string;
  vipStatus: string | null;
  corporateAccountName: string | null;
}

function parseWindow(from: string, to: string): { fromDate: Date; toDate: Date } {
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    throw new AppError(400, 'from/to must be YYYY-MM-DD', 'VALIDATION_ERROR');
  }
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate <= fromDate) {
    throw new AppError(400, 'Invalid date window', 'VALIDATION_ERROR');
  }
  const spanDays = (toDate.getTime() - fromDate.getTime()) / 86_400_000;
  if (spanDays > MAX_SPAN_DAYS) {
    throw new AppError(400, `Window too large (max ${MAX_SPAN_DAYS} days)`, 'VALIDATION_ERROR');
  }
  return { fromDate, toDate };
}

export async function getRoomPlan({ tenantId, propertyId, from, to }: RoomPlanQuery) {
  const { fromDate, toDate } = parseWindow(from, to);

  const property = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!property) throw new AppError(404, 'Property not found', 'NOT_FOUND');

  const [rooms, roomTypes] = await Promise.all([
    prisma.room.findMany({
      where: { propertyId },
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      select: {
        id: true,
        number: true,
        floor: true,
        status: true,
        housekeepingStatus: true,
        roomTypeId: true,
        roomType: { select: { id: true, name: true, code: true, baseOccupancy: true } },
      },
    }),
    prisma.roomType.findMany({
      where: { propertyId },
      select: { id: true, name: true, code: true, baseOccupancy: true, maxOccupancy: true },
      orderBy: { code: 'asc' },
    }),
  ]);

  const reservations = await prisma.$queryRaw<ReservationRow[]>`
    SELECT r.id, r."confirmationNumber", r.status, r.source,
           to_char(r."arrivalDate",   'YYYY-MM-DD') AS "arrivalDate",
           to_char(r."departureDate", 'YYYY-MM-DD') AS "departureDate",
           r.nights, r.adults, r.children, r.eta, r."specialRequests",
           r."marketSegment", r."houseUse", r.guaranteed, r."doNotMove", r."fixedRoom",
           r."depositDue", r."depositPaid", r."totalAmount", r.balance,
           r."checkedInAt", r."roomTypeId", r."groupId", r."guestId"
    FROM reservations r
    WHERE r."propertyId" = ${propertyId}
      AND r."tenantId"   = ${tenantId}
      AND r.status IN ('confirmed', 'checked_in', 'checked_out')
      AND r."arrivalDate"   < ${toDate}
      AND r."departureDate" > ${fromDate}
    ORDER BY r."arrivalDate" ASC
  `;

  const reservationIds = reservations.map((r) => r.id);
  const guestIds = [...new Set(reservations.map((r) => r.guestId).filter(Boolean))];
  const groupIds = [...new Set(reservations.map((r) => r.groupId).filter(Boolean))] as string[];

  const [
    stays,
    restrictions,
    allocations,
    guests,
    groups,
    traceCounts,
    companionCounts,
    taskCounts,
  ] = await Promise.all([
    reservationIds.length
      ? prisma.reservationStay.findMany({
          where: { reservationId: { in: reservationIds }, date: { gte: fromDate, lt: toDate } },
          select: { reservationId: true, roomId: true, date: true, rate: true },
        })
      : Promise.resolve(
          [] as { reservationId: string; roomId: string; date: Date; rate: unknown }[]
        ),
    prisma.inventoryRestriction.findMany({
      where: { propertyId, date: { gte: fromDate, lt: toDate } },
      select: {
        roomTypeId: true,
        date: true,
        stopSell: true,
        closeToArrival: true,
        closeToDeparture: true,
        adjustment: true,
      },
    }),
    prisma.inventoryAllocation.findMany({
      where: { propertyId, status: 'active', date: { gte: fromDate, lt: toDate } },
      select: { id: true, roomTypeId: true, date: true, type: true, name: true, quantity: true },
    }),
    guestIds.length
      ? prisma.$queryRaw<GuestRow[]>`
            SELECT g.id, g."firstName", g."lastName", g."vipStatus",
                   ca.name AS "corporateAccountName"
            FROM guests g
            LEFT JOIN corporate_accounts ca ON ca.id = g."corporateAccountId"
            WHERE g.id IN (${Prisma.join(guestIds)})
          `
      : Promise.resolve([] as GuestRow[]),
    groupIds.length
      ? prisma.$queryRaw<{ id: string; code: string; name: string }[]>`
            SELECT id, code, name FROM "groups" WHERE id IN (${Prisma.join(groupIds)})
          `
      : Promise.resolve([] as { id: string; code: string; name: string }[]),
    reservationIds.length
      ? prisma.$queryRaw<{ id: string; c: bigint }[]>`
            SELECT "reservationId" AS id, COUNT(*) AS c
            FROM reservation_traces
            WHERE "resolvedAt" IS NULL AND "reservationId" IN (${Prisma.join(reservationIds)})
            GROUP BY 1
          `
      : Promise.resolve([] as { id: string; c: bigint }[]),
    reservationIds.length
      ? prisma.$queryRaw<{ id: string; c: bigint }[]>`
            SELECT "reservationId" AS id, COUNT(*) AS c
            FROM reservation_companions
            WHERE "reservationId" IN (${Prisma.join(reservationIds)})
            GROUP BY 1
          `
      : Promise.resolve([] as { id: string; c: bigint }[]),
    reservationIds.length
      ? prisma.$queryRaw<{ id: string; c: bigint }[]>`
            SELECT "reservationId" AS id, COUNT(*) AS c
            FROM tasks
            WHERE status NOT IN ('completed', 'cancelled')
              AND "reservationId" IN (${Prisma.join(reservationIds)})
            GROUP BY 1
          `
      : Promise.resolve([] as { id: string; c: bigint }[]),
  ]);

  let blocks: BlockRow[] = [];
  try {
    blocks = await prisma.$queryRaw<BlockRow[]>`
      SELECT id, "roomId", "roomTypeId", type, status, reason,
             to_char("startDate", 'YYYY-MM-DD') AS "startDate",
             to_char("endDate",   'YYYY-MM-DD') AS "endDate"
      FROM room_blocks
      WHERE "tenantId" = ${tenantId}
        AND "propertyId" = ${propertyId}
        AND status = 'active'
        AND "startDate" < ${toDate}
        AND "endDate"   > ${fromDate}
      ORDER BY "startDate" ASC
    `;
  } catch {
    blocks = [];
  }

  const guestById = new Map(guests.map((g) => [g.id, g]));
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const traceById = new Map(traceCounts.map((t) => [t.id, Number(t.c)]));
  const companionById = new Map(companionCounts.map((t) => [t.id, Number(t.c)]));
  const taskById = new Map(taskCounts.map((t) => [t.id, Number(t.c)]));

  const staysByReservation = new Map<string, { roomId: string; date: Date; rate: number }[]>();
  for (const s of stays) {
    if (!staysByReservation.has(s.reservationId)) staysByReservation.set(s.reservationId, []);
    staysByReservation.get(s.reservationId)!.push({
      roomId: s.roomId,
      date: s.date,
      rate: Number(s.rate),
    });
  }

  const roomsByType = new Map<string, number>();
  for (const r of rooms) roomsByType.set(r.roomTypeId, (roomsByType.get(r.roomTypeId) ?? 0) + 1);

  const dayCount = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
  const dayKeys: string[] = [];
  for (let i = 0; i < dayCount; i++) {
    dayKeys.push(new Date(fromDate.getTime() + i * 86_400_000).toISOString().slice(0, 10));
  }

  const oooByTypeByDay = new Map<string, Map<string, number>>();
  const oooByRoomByDay = new Map<string, Set<string>>();
  for (const b of blocks) {
    if (b.type !== 'ooo' && b.type !== 'oos') continue;
    const start = b.startDate <= dayKeys[0] ? dayKeys[0] : b.startDate;
    const end = b.endDate >= dayKeys[dayKeys.length - 1] ? dayKeys[dayKeys.length - 1] : b.endDate;
    for (const day of dayKeys) {
      if (day < start || day >= end) continue;
      if (b.roomId) {
        if (!oooByRoomByDay.has(day)) oooByRoomByDay.set(day, new Set());
        oooByRoomByDay.get(day)!.add(b.roomId);
      }
      if (b.roomTypeId) {
        if (!oooByTypeByDay.has(day)) oooByTypeByDay.set(day, new Map());
        const m = oooByTypeByDay.get(day)!;
        m.set(b.roomTypeId, (m.get(b.roomTypeId) ?? 0) + 1);
      }
    }
  }

  const occupiedByDay = new Map<string, number>();
  const revenueByDay = new Map<string, number>();
  for (const s of stays) {
    const day = s.date.toISOString().slice(0, 10);
    occupiedByDay.set(day, (occupiedByDay.get(day) ?? 0) + 1);
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(s.rate));
  }

  const arrivalsByDay = new Map<string, number>();
  const departuresByDay = new Map<string, number>();
  for (const r of reservations) {
    if (dayKeys.includes(r.arrivalDate))
      arrivalsByDay.set(r.arrivalDate, (arrivalsByDay.get(r.arrivalDate) ?? 0) + 1);
    if (dayKeys.includes(r.departureDate))
      departuresByDay.set(r.departureDate, (departuresByDay.get(r.departureDate) ?? 0) + 1);
  }

  const adjustmentByTypeByDay = new Map<string, Map<string, number>>();
  for (const r of restrictions) {
    const day = r.date.toISOString().slice(0, 10);
    if (!adjustmentByTypeByDay.has(day)) adjustmentByTypeByDay.set(day, new Map());
    const m = adjustmentByTypeByDay.get(day)!;
    m.set(r.roomTypeId, (m.get(r.roomTypeId) ?? 0) + r.adjustment);
  }

  const dayStats = dayKeys.map((day) => {
    let sellable = 0;
    for (const rt of roomTypes) {
      const total = roomsByType.get(rt.id) ?? 0;
      const ooo = oooByTypeByDay.get(day)?.get(rt.id) ?? 0;
      const adj = adjustmentByTypeByDay.get(day)?.get(rt.id) ?? 0;
      sellable += Math.max(0, total - ooo + adj);
    }
    const occupied = occupiedByDay.get(day) ?? 0;
    const revenue = revenueByDay.get(day) ?? 0;
    return {
      date: day,
      sellable,
      occupied,
      ooo: oooByRoomByDay.get(day)?.size ?? 0,
      arrivals: arrivalsByDay.get(day) ?? 0,
      departures: departuresByDay.get(day) ?? 0,
      occupancyPct: sellable > 0 ? Math.round((occupied / sellable) * 1000) / 10 : 0,
      adr: occupied > 0 ? Math.round((revenue / occupied) * 100) / 100 : 0,
    };
  });

  const mappedReservations = reservations.map((r) => {
    const g = guestById.get(r.guestId);
    const resStays = staysByReservation.get(r.id) ?? [];
    const sorted = [...resStays].sort((a, b) => a.date.getTime() - b.date.getTime());
    const anchor =
      sorted.find((s) => s.date.toISOString().slice(0, 10) === r.arrivalDate) ?? sorted[0];
    return {
      id: r.id,
      confirmationNumber: r.confirmationNumber,
      status: r.status,
      source: r.source,
      arrivalDate: r.arrivalDate,
      departureDate: r.departureDate,
      nights: r.nights,
      adults: r.adults,
      children: r.children,
      eta: r.eta,
      specialRequests: r.specialRequests,
      marketSegment: r.marketSegment,
      houseUse: r.houseUse,
      guaranteed: r.guaranteed,
      doNotMove: r.doNotMove,
      fixedRoom: r.fixedRoom,
      depositDue: Number(r.depositDue),
      depositPaid: Number(r.depositPaid),
      totalAmount: Number(r.totalAmount),
      balance: Number(r.balance),
      checkedInAt: r.checkedInAt,
      roomId: anchor?.roomId ?? null,
      roomTypeId: r.roomTypeId,
      groupId: r.groupId,
      groupCode: r.groupId ? (groupById.get(r.groupId)?.code ?? null) : null,
      guestId: r.guestId,
      guestName: g ? `${g.firstName} ${g.lastName}`.trim() : 'Unknown guest',
      vipStatus: g?.vipStatus ?? null,
      corporateAccountName: g?.corporateAccountName ?? null,
      openTraces: traceById.get(r.id) ?? 0,
      companionsCount: companionById.get(r.id) ?? 0,
      pendingTasks: taskById.get(r.id) ?? 0,
    };
  });

  return {
    property: { id: property.id, name: property.name, currency: property.currency },
    rooms,
    roomTypes,
    reservations: mappedReservations,
    stays: stays.map((s) => ({
      reservationId: s.reservationId,
      roomId: s.roomId,
      date: s.date.toISOString().slice(0, 10),
      rate: Number(s.rate),
    })),
    blocks,
    restrictions: restrictions.map((r) => ({
      roomTypeId: r.roomTypeId,
      date: r.date.toISOString().slice(0, 10),
      stopSell: r.stopSell,
      closeToArrival: r.closeToArrival,
      closeToDeparture: r.closeToDeparture,
      adjustment: r.adjustment,
    })),
    holds: allocations.map((a) => ({
      id: a.id,
      roomTypeId: a.roomTypeId,
      date: a.date.toISOString().slice(0, 10),
      type: a.type,
      name: a.name,
      quantity: a.quantity,
    })),
    dayStats,
  };
}

export interface CreateBlockInput {
  tenantId: string;
  propertyId: string;
  roomId?: string;
  roomTypeId?: string;
  type: string;
  reason?: string;
  startDate: string;
  endDate: string;
  createdById?: string;
}

export async function createRoomBlock(input: CreateBlockInput) {
  if (!input.roomId && !input.roomTypeId) {
    throw new AppError(400, 'roomId or roomTypeId is required', 'VALIDATION_ERROR');
  }
  const { fromDate, toDate } = parseWindow(input.startDate, input.endDate);
  const id = `rb_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await prisma.$executeRaw`
    INSERT INTO room_blocks (id, "tenantId", "propertyId", "roomId", "roomTypeId", type, reason, "startDate", "endDate", "createdById", "createdAt", "updatedAt")
    VALUES (${id}, ${input.tenantId}, ${input.propertyId}, ${input.roomId ?? null}, ${input.roomTypeId ?? null},
            ${input.type}, ${input.reason ?? null}, ${fromDate}, ${toDate}, ${input.createdById ?? null},
            NOW(), NOW())
  `;
  return { id };
}

export async function returnRoomBlock(tenantId: string, blockId: string) {
  const result = await prisma.$executeRaw`
    UPDATE room_blocks SET status = 'returned', "updatedAt" = NOW()
    WHERE id = ${blockId} AND "tenantId" = ${tenantId} AND status = 'active'
  `;
  if (Number(result) === 0) {
    throw new AppError(404, 'Block not found or already returned', 'NOT_FOUND');
  }
  return { id: blockId, status: 'returned' };
}
