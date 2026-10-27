/* apps/api/src/modules/inventory/inventory.service.ts — I1
 * Sellable room inventory engine.
 *   availability = rooms − out-of-order − active holds (+ manual adjustment)
 *                  + overbooking allowance − occupied (active stays)
 * Occupied counts reservation_stays whose reservation is confirmed or
 * checked_in (cancelled / no-show / checked_out release the room).
 * Every mutation is property-scoped (C1 switcher) and audit-logged.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logAuditEvent } from '../audit/audit.service.js';

export const ALLOCATION_TYPES = [
  'group_hold',
  'channel_allotment',
  'maintenance_block',
  'comp_hold',
] as const;
export type AllocationType = (typeof ALLOCATION_TYPES)[number];

const OOO_STATUSES = ['ooo', 'out_of_order'];
const MAX_RANGE_DAYS = 62;

export const dstr = (input: Date | string) => {
  const d = input instanceof Date ? input : new Date(input);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
};
const parseDate = (s: string) => new Date(`${s}T00:00:00.000Z`);

export function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  const cur = parseDate(from);
  const end = parseDate(to);
  let guard = 0;
  while (cur <= end && guard++ <= MAX_RANGE_DAYS) {
    out.push(dstr(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** C1 property resolution: explicit header/query → user's sticky choice → first property. */
export async function resolveProperty(tenantId: string, explicit?: string, fallback?: string) {
  if (explicit) {
    const p = await prisma.property.findFirst({ where: { id: explicit, tenantId } });
    if (!p) throw new AppError(404, 'Property not found', 'PROPERTY_NOT_FOUND');
    return p;
  }
  if (fallback) {
    const p = await prisma.property.findFirst({ where: { id: fallback, tenantId } });
    if (p) return p;
  }
  const p = await prisma.property.findFirst({
    where: { tenantId, status: 'active' },
    orderBy: { createdAt: 'asc' },
  });
  if (!p) throw new AppError(404, 'No property found for tenant', 'PROPERTY_NOT_FOUND');
  return p;
}

interface CellFacts {
  dates: string[];
  types: { id: string; name: string; code: string }[];
  totalMap: Map<string, number>;
  oooMap: Map<string, number>;
  oooBlockMap: Map<string, number>; // `${roomTypeId}|${date}` — dated room_blocks type='ooo'
  occMap: Map<string, number>; // `${roomTypeId}|${date}`
  heldMap: Map<string, number>;
  restrMap: Map<
    string,
    {
      stopSell: boolean;
      closeToArrival: boolean;
      closeToDeparture: boolean;
      adjustment: number;
      notes: string | null;
    }
  >;
  obMap: Map<string, number>;
}

async function loadCellFacts(
  propertyId: string,
  from: string,
  to: string,
  roomTypeId?: string
): Promise<CellFacts> {
  const dates = eachDate(from, to);
  const types = await prisma.roomType.findMany({
    where: { propertyId, status: 'active', ...(roomTypeId ? { id: roomTypeId } : {}) },
    orderBy: { code: 'asc' },
    select: { id: true, name: true, code: true },
  });

  const [totals, ooo, occ, held, restrictions, overbooking] = await Promise.all([
    prisma.room.groupBy({
      by: ['roomTypeId'],
      where: { propertyId },
      _count: { _all: true },
    }),
    prisma.room.groupBy({
      by: ['roomTypeId'],
      where: { propertyId, OR: [{ status: { in: OOO_STATUSES } }, { serviceStatus: 'ooo' }] },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ roomTypeId: string; date: string; count: bigint }[]>`
      SELECT r."roomTypeId", s.date::text AS date, COUNT(*)::bigint AS count
      FROM reservation_stays s
      JOIN rooms r ON r.id = s."roomId"
      JOIN reservations res ON res.id = s."reservationId"
      WHERE r."propertyId" = ${propertyId}
        AND res.status IN ('confirmed','checked_in')
        AND s.date >= ${parseDate(from)}::date
        AND s.date <= ${parseDate(to)}::date
      GROUP BY r."roomTypeId", s.date
    `,
    prisma.inventoryAllocation.groupBy({
      by: ['roomTypeId', 'date'],
      where: { propertyId, status: 'active', date: { gte: parseDate(from), lte: parseDate(to) } },
      _sum: { quantity: true },
    }),
    prisma.inventoryRestriction.findMany({
      where: {
        propertyId,
        ...(roomTypeId ? { roomTypeId } : {}),
        date: { gte: parseDate(from), lte: parseDate(to) },
      },
    }),
    prisma.inventoryOverbooking.findMany({
      where: roomTypeId ? { roomTypeId } : { roomType: { propertyId } },
    }),
  ]);

  const totalMap = new Map(totals.map((t) => [t.roomTypeId, t._count._all]));
  const oooMap = new Map(ooo.map((t) => [t.roomTypeId, t._count._all]));
  const occMap = new Map(occ.map((o) => [`${o.roomTypeId}|${o.date}`, Number(o.count)]));
  const heldMap = new Map(
    held.map((h) => [`${h.roomTypeId}|${dstr(h.date)}`, h._sum.quantity ?? 0])
  );
  const restrMap = new Map(
    restrictions.map((r) => [
      `${r.roomTypeId}|${dstr(r.date)}`,
      {
        stopSell: r.stopSell,
        closeToArrival: r.closeToArrival,
        closeToDeparture: r.closeToDeparture,
        adjustment: r.adjustment,
        notes: r.notes,
      },
    ])
  );
  const obMap = new Map(overbooking.map((o) => [o.roomTypeId, o.limit]));

  const oooBlocks = await prisma.$queryRaw<{ rt: string; date: string; count: bigint }[]>`
    SELECT COALESCE(b."roomTypeId", r."roomTypeId") AS rt, s.d::date AS date, COUNT(*)::bigint AS count
    FROM room_blocks b
    LEFT JOIN rooms r ON r.id = b."roomId"
    CROSS JOIN LATERAL generate_series(
      GREATEST(b."startDate", ${parseDate(from)}::date),
      LEAST(b."endDate", ${parseDate(to)}::date),
      interval '1 day'
    ) s(d)
    WHERE b."propertyId" = ${propertyId}
      AND b.type = 'ooo'
      AND b.status = 'active'
    GROUP BY 1, 2
  `;
  const oooBlockMap = new Map(oooBlocks.map((b) => [`${b.rt}|${dstr(b.date)}`, Number(b.count)]));

  return { dates, types, totalMap, oooMap, oooBlockMap, occMap, heldMap, restrMap, obMap };
}

function buildCell(f: CellFacts, roomTypeId: string, date: string) {
  const total = f.totalMap.get(roomTypeId) ?? 0;
  const ooo = (f.oooMap.get(roomTypeId) ?? 0) + (f.oooBlockMap.get(`${roomTypeId}|${date}`) ?? 0);
  const occupied = f.occMap.get(`${roomTypeId}|${date}`) ?? 0;
  const held = f.heldMap.get(`${roomTypeId}|${date}`) ?? 0;
  const restr = f.restrMap.get(`${roomTypeId}|${date}`);
  const adjustment = restr?.adjustment ?? 0;
  const sellable = Math.max(total - ooo - held + adjustment, 0);
  const overbookingLimit = f.obMap.get(roomTypeId) ?? 0;
  return {
    date,
    total,
    ooo,
    occupied,
    held,
    adjustment,
    sellable,
    overbookingLimit,
    remaining: sellable + overbookingLimit - occupied,
    stopSell: restr?.stopSell ?? false,
    closeToArrival: restr?.closeToArrival ?? false,
    closeToDeparture: restr?.closeToDeparture ?? false,
    oversold: occupied > sellable,
    notes: restr?.notes ?? null,
  };
}

export async function getGrid(
  tenantId: string,
  propertyId: string,
  from: string,
  to: string,
  roomTypeId?: string
) {
  const f = await loadCellFacts(propertyId, from, to, roomTypeId);
  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId },
    select: { id: true, name: true, code: true },
  });

  let oversoldCells = 0;
  let stopSoldCells = 0;

  const roomTypes = f.types.map((t) => {
    const cells = f.dates.map((d) => buildCell(f, t.id, d));
    for (const c of cells) {
      if (c.oversold) oversoldCells += 1;
      if (c.stopSell) stopSoldCells += 1;
    }
    const alerts = cells
      .filter((c) => c.oversold || c.remaining <= 2 || c.stopSell)
      .map((c) => ({
        date: c.date,
        kind: c.oversold
          ? ('oversold' as const)
          : c.stopSell
            ? ('stop_sell' as const)
            : ('low' as const),
        remaining: c.remaining,
        sellable: c.sellable,
      }));
    return {
      ...t,
      totalRooms: f.totalMap.get(t.id) ?? 0,
      oooRooms: f.oooMap.get(t.id) ?? 0,
      overbookingLimit: f.obMap.get(t.id) ?? 0,
      cells,
      alerts,
    };
  });

  const dayTotals = roomTypes.reduce(
    (acc, t) => {
      const c = t.cells[0];
      if (!c) return acc;
      acc.sellable += c.sellable + c.overbookingLimit;
      acc.occupied += c.occupied;
      acc.held += c.held;
      acc.ooo += c.ooo;
      return acc;
    },
    { sellable: 0, occupied: 0, held: 0, ooo: 0 }
  );

  return {
    property,
    from,
    to,
    roomTypes,
    totals: {
      ...dayTotals,
      physicalRooms: roomTypes.reduce((a, t) => a + t.totalRooms, 0),
      oversoldCells,
      stopSoldCells,
      lowCells: roomTypes.reduce(
        (a, t) => a + t.cells.filter((c) => !c.oversold && !c.stopSell && c.remaining <= 2).length,
        0
      ),
    },
  };
}

// ─── Restrictions: stop-sell / CTA / CTD / adjustment ───

export async function upsertRestriction(
  tenantId: string,
  propertyId: string,
  userId: string,
  req: unknown,
  input: {
    roomTypeId: string;
    date: string;
    stopSell?: boolean;
    closeToArrival?: boolean;
    closeToDeparture?: boolean;
    adjustment?: number;
    notes?: string | null;
  }
) {
  const rt = await prisma.roomType.findFirst({
    where: { id: input.roomTypeId, propertyId, tenantId },
    select: { id: true, name: true, code: true },
  });
  if (!rt) throw new AppError(404, 'Room type not found', 'ROOM_TYPE_NOT_FOUND');

  const date = parseDate(input.date);

  const data = await prisma.inventoryRestriction.upsert({
    where: { roomTypeId_date: { roomTypeId: rt.id, date } },
    create: {
      tenantId,
      propertyId,
      roomTypeId: rt.id,
      date,
      stopSell: input.stopSell ?? false,
      closeToArrival: input.closeToArrival ?? false,
      closeToDeparture: input.closeToDeparture ?? false,
      adjustment: input.adjustment ?? 0,
      notes: input.notes ?? null,
      updatedById: userId,
    },
    update: {
      ...(input.stopSell !== undefined && { stopSell: input.stopSell }),
      ...(input.closeToArrival !== undefined && { closeToArrival: input.closeToArrival }),
      ...(input.closeToDeparture !== undefined && { closeToDeparture: input.closeToDeparture }),
      ...(input.adjustment !== undefined && { adjustment: input.adjustment }),
      ...(input.notes !== undefined && { notes: input.notes }),
      updatedById: userId,
    },
  });

  await logAuditEvent({
    tenantId,
    action: 'inventory.adjust',
    category: 'inventory',
    label: input.stopSell
      ? 'Stop-sell set'
      : input.adjustment !== undefined
        ? 'Inventory adjusted'
        : 'Inventory restriction updated',
    description: `${rt.name} (${rt.code}) on ${input.date}`,
    entityType: 'inventory',
    entityId: `${rt.id}:${input.date}`,
    req: req as never,
    metadata: { ...input, roomType: rt.code },
  });

  return data;
}

// ─── Overbooking limits ───

export async function listOverbooking(tenantId: string, propertyId: string) {
  const types = await prisma.roomType.findMany({
    where: { propertyId, tenantId },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      inventoryOverbooking: { select: { limit: true, updatedAt: true } },
    },
  });
  return types.map((t) => ({
    roomTypeId: t.id,
    name: t.name,
    code: t.code,
    limit: t.inventoryOverbooking?.limit ?? 0,
    updatedAt: t.inventoryOverbooking?.updatedAt ?? null,
  }));
}

export async function setOverbooking(
  tenantId: string,
  propertyId: string,
  userId: string,
  req: unknown,
  roomTypeId: string,
  limit: number
) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 50) {
    throw new AppError(
      400,
      'Overbooking limit must be an integer between 0 and 50',
      'VALIDATION_ERROR'
    );
  }
  const rt = await prisma.roomType.findFirst({
    where: { id: roomTypeId, propertyId, tenantId },
    select: { id: true, name: true, code: true },
  });
  if (!rt) throw new AppError(404, 'Room type not found', 'ROOM_TYPE_NOT_FOUND');

  const row = await prisma.inventoryOverbooking.upsert({
    where: { roomTypeId: rt.id },
    create: { roomTypeId: rt.id, limit, updatedById: userId },
    update: { limit, updatedById: userId },
  });

  await logAuditEvent({
    tenantId,
    action: 'inventory.adjust',
    category: 'inventory',
    label: 'Overbooking limit set',
    description: `${rt.name} (${rt.code}): ${limit} extra units`,
    entityType: 'inventory',
    entityId: rt.id,
    req: req as never,
    metadata: { roomTypeId: rt.id, limit },
  });

  return row;
}

// ─── Allocations / holds (with live pickup tracking) ───

export async function listAllocations(
  tenantId: string,
  propertyId: string,
  query: { status?: string; type?: string; roomTypeId?: string; from?: string; to?: string }
) {
  const rows = await prisma.inventoryAllocation.findMany({
    where: {
      propertyId,
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.roomTypeId ? { roomTypeId: query.roomTypeId } : {}),
      ...(query.from ? { date: { gte: parseDate(query.from) } } : {}),
      ...(query.to ? { date: { lte: parseDate(query.to) } } : {}),
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    include: { roomType: { select: { name: true, code: true } } },
    take: 500,
  });
  if (rows.length === 0) return rows;

  // Pickup: rooms of this type actually occupied on the hold's date.
  // Capped at the held quantity — pickup can never exceed the block.
  const dates = [...new Set(rows.map((r) => dstr(r.date)))];
  const occupied = await prisma.$queryRaw<{ roomTypeId: string; date: string; count: bigint }[]>`
    SELECT r."roomTypeId", s.date::text AS date, COUNT(*)::bigint AS count
    FROM reservation_stays s
    JOIN rooms r ON r.id = s."roomId"
    JOIN reservations res ON res.id = s."reservationId"
    WHERE r."propertyId" = ${propertyId}
      AND res.status IN ('confirmed','checked_in')
      AND s.date::text IN (${Prisma.join(dates)})
    GROUP BY r."roomTypeId", s.date
  `;
  const occMap = new Map(occupied.map((o) => [`${o.roomTypeId}|${o.date}`, Number(o.count)]));
  return rows.map((r) => ({
    ...r,
    pickedUp: Math.min(occMap.get(`${r.roomTypeId}|${dstr(r.date)}`) ?? 0, r.quantity),
  }));
}

export async function createAllocation(
  tenantId: string,
  propertyId: string,
  userId: string,
  req: unknown,
  input: {
    roomTypeId: string;
    type: AllocationType;
    name: string;
    quantity: number;
    date: string;
    endDate?: string;
    notes?: string;
    dedupeKey?: string;
  }
) {
  const rt = await prisma.roomType.findFirst({
    where: { id: input.roomTypeId, propertyId, tenantId },
    select: { id: true, name: true, code: true },
  });
  if (!rt) throw new AppError(404, 'Room type not found', 'ROOM_TYPE_NOT_FOUND');
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 500) {
    throw new AppError(400, 'Quantity must be an integer between 1 and 500', 'VALIDATION_ERROR');
  }

  const dates = eachDate(input.date, input.endDate ?? input.date);
  const dedupeKey = input.dedupeKey ?? `manual:${userId}:${Date.now()}`;

  let rows;
  try {
    rows = await prisma.$transaction(
      dates.map((d) =>
        prisma.inventoryAllocation.create({
          data: {
            tenantId,
            propertyId,
            roomTypeId: rt.id,
            date: parseDate(d),
            type: input.type,
            name: input.name.slice(0, 120),
            quantity: input.quantity,
            notes: input.notes?.slice(0, 500) ?? null,
            dedupeKey,
            createdById: userId,
          },
        })
      )
    );
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      throw new AppError(409, 'A hold with this dedupe key already exists', 'HOLD_EXISTS');
    }
    throw err;
  }

  await logAuditEvent({
    tenantId,
    action: 'inventory.adjust',
    category: 'inventory',
    label: 'Inventory hold created',
    description: `${input.name} — ${rt.name} (${rt.code}) x ${input.quantity} for ${dates.length} day(s)`,
    entityType: 'inventory',
    entityId: rows[0]?.id,
    req: req as never,
    metadata: {
      roomTypeId: rt.id,
      type: input.type,
      name: input.name,
      quantity: input.quantity,
      dates,
      dedupeKey,
    },
  });

  return { created: rows.length, allocations: rows };
}

export async function releaseAllocation(
  tenantId: string,
  _userId: string,
  req: unknown,
  id: string
) {
  const res = await prisma.inventoryAllocation.updateMany({
    where: { id, tenantId, status: 'active' },
    data: { status: 'released', releasedAt: new Date() },
  });
  if (res.count === 0) throw new AppError(404, 'Active hold not found', 'HOLD_NOT_FOUND');

  await logAuditEvent({
    tenantId,
    action: 'inventory.adjust',
    category: 'inventory',
    label: 'Inventory hold released',
    description: `Hold ${id} released`,
    entityType: 'inventory',
    entityId: id,
    req: req as never,
    metadata: { holdId: id },
  });

  return { released: true };
}

// ─── Adjustment history (audit-trail backed) ───

export async function listHistory(tenantId: string) {
  const logs = await prisma.auditLog.findMany({
    where: { tenantId, entity: 'inventory' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const userIds = [...new Set(logs.map((l) => l.userId).filter((v): v is string => Boolean(v)))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  return logs.map((l) => {
    const m = (l.metadata ?? {}) as Record<string, unknown>;
    return {
      id: l.id,
      at: l.createdAt,
      action: l.action,
      label: (m.label as string) ?? l.action,
      description: (m.description as string) ?? null,
      roomType: (m.roomType as string) ?? null,
      date: (m.date as string) ?? null,
      rooms:
        typeof m.adjustment === 'number'
          ? m.adjustment
          : typeof m.quantity === 'number'
            ? m.quantity
            : typeof m.limit === 'number'
              ? m.limit
              : null,
      reason: (m.notes as string) ?? (m.name as string) ?? (m.reason as string) ?? null,
      stopSell: typeof m.stopSell === 'boolean' ? m.stopSell : null,
      user: userMap.get(l.userId ?? '') ?? null,
    };
  });
}

// ─── Booking-time enforcement (call from reservation / booking creation) ───

export async function assertSellable(
  _tenantId: string,
  propertyId: string,
  roomTypeId: string,
  arrivalInput: Date | string,
  departureInput: Date | string,
  excludeReservationId?: string
) {
  const arrivalDate = arrivalInput instanceof Date ? arrivalInput : new Date(arrivalInput);
  const departureDate = departureInput instanceof Date ? departureInput : new Date(departureInput);
  const from = dstr(arrivalDate);
  const to = dstr(new Date(departureDate.getTime() - 86400_000));
  if (parseDate(to) < parseDate(from)) return;

  const f = await loadCellFacts(propertyId, from, to, roomTypeId);
  const soldOut: string[] = [];

  for (const date of f.dates) {
    const cell = buildCell(f, roomTypeId, date);
    if (cell.stopSell) {
      soldOut.push(date);
      continue;
    }
    let occupied = cell.occupied;
    if (excludeReservationId) {
      const own = await prisma.reservationStay.count({
        where: {
          date: parseDate(date),
          room: { roomTypeId },
          reservation: { id: excludeReservationId },
        },
      });
      occupied -= own;
    }
    if (occupied >= cell.sellable + cell.overbookingLimit) soldOut.push(date);
  }

  if (soldOut.length > 0) {
    throw new AppError(
      409,
      `Room type is sold out for: ${soldOut.join(', ')}`,
      'INVENTORY_SOLD_OUT',
      { dates: soldOut }
    );
  }
}
