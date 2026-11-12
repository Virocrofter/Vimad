import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const ratePlanCreateSchema = z.object({
  propertyId: z.string(),
  roomTypeId: z.string(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  baseRate: z.coerce.number(),
  currency: z.string().default('ZAR'),
  calculationMethod: z.enum(['fixed', 'percent', 'amount']).default('fixed'),
  calculationValue: z.coerce.number().optional(),
  advanceDays: z.number().int().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minStay: z.number().int().optional(),
  maxStay: z.number().int().optional(),
  closeToArrival: z.boolean().default(false),
  closeToDeparture: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const ratePlanUpdateSchema = ratePlanCreateSchema.partial();

export type RatePlanCreateInput = z.infer<typeof ratePlanCreateSchema>;
export type RatePlanUpdateInput = z.infer<typeof ratePlanUpdateSchema>;

const ACTIVE_RESERVATION_STATUSES = ['confirmed', 'checked_in', 'in_house'];

export async function listRatePlans(
  tenantId: string,
  query: {
    page: number;
    pageSize: number;
    propertyId?: string;
    roomTypeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  propertyIds?: string[]
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (propertyIds?.length) where.propertyId = { in: propertyIds };

  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.roomTypeId) where.roomTypeId = query.roomTypeId;
  if (query.status) where.status = query.status;
  if (query.dateFrom || query.dateTo) {
    // Plans whose validity window overlaps the requested range
    where.AND = [
      { OR: [{ endDate: null }, { endDate: { gte: new Date(query.dateFrom ?? '1970-01-01') } }] },
      { OR: [{ startDate: null }, { startDate: { lte: new Date(query.dateTo ?? '2999-12-31') } }] },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.ratePlan.count({ where }),
    prisma.ratePlan.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        roomType: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getRatePlan(tenantId: string, id: string) {
  const ratePlan = await prisma.ratePlan.findFirst({
    where: { id, tenantId },
    include: {
      property: true,
      roomType: true,
    },
  });

  if (!ratePlan) {
    throw new AppError(404, 'Rate plan not found', 'NOT_FOUND');
  }

  return ratePlan;
}

export async function createRatePlan(tenantId: string, input: RatePlanCreateInput) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const roomType = await prisma.roomType.findFirst({
    where: { id: input.roomTypeId, tenantId },
  });
  if (!roomType) {
    throw new AppError(404, 'Room type not found', 'NOT_FOUND');
  }

  const _existing = await prisma.ratePlan.findFirst({
    where: { propertyId: input.propertyId, code: input.code },
  });
  if (_existing) {
    throw new AppError(409, 'Rate plan code already exists for this property', 'CONFLICT');
  }

  return prisma.ratePlan.create({
    data: {
      tenantId,
      ...input,
    },
  });
}

export async function updateRatePlan(tenantId: string, id: string, input: RatePlanUpdateInput) {
  const _existing = await prisma.ratePlan.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Rate plan not found', 'NOT_FOUND');
  }

  return prisma.ratePlan.update({
    where: { id },
    data: input,
  });
}

export async function deleteRatePlan(tenantId: string, id: string) {
  const _existing = await prisma.ratePlan.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Rate plan not found', 'NOT_FOUND');
  }

  return prisma.ratePlan.delete({ where: { id } });
}

/**
 * Per-room-type availability for a date range, computed from physical rooms
 * minus rooms with an active reservation stay that night.
 * Returns one row per room type with a `days` map keyed by ISO date.
 */
export async function getAvailability(
  tenantId: string,
  query: { from: string; to: string; propertyId?: string }
) {
  const from = new Date(query.from);
  const to = new Date(query.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw new AppError(400, 'Invalid date range', 'VALIDATION');
  }

  const [roomTypes, rooms, stays] = await Promise.all([
    prisma.roomType.findMany({
      where: { tenantId, ...(query.propertyId ? { propertyId: query.propertyId } : {}) },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
    prisma.room.findMany({
      where: { tenantId, ...(query.propertyId ? { propertyId: query.propertyId } : {}) },
      select: { id: true, roomTypeId: true },
    }),
    prisma.reservationStay.findMany({
      where: {
        date: { gte: from, lte: to },
        reservation: {
          tenantId,
          status: { in: ACTIVE_RESERVATION_STATUSES },
        },
      },
      select: {
        date: true,
        roomId: true,
      },
    }),
  ]);

  // occupied roomIds per date
  const occupiedByDate = new Map<string, Set<string>>();
  for (const s of stays) {
    const key = s.date.toISOString().slice(0, 10);
    if (!occupiedByDate.has(key)) occupiedByDate.set(key, new Set());
    occupiedByDate.get(key)!.add(s.roomId);
  }

  const roomsByType = new Map<string, string[]>();
  for (const r of rooms) {
    if (!roomsByType.has(r.roomTypeId)) roomsByType.set(r.roomTypeId, []);
    roomsByType.get(r.roomTypeId)!.push(r.id);
  }

  // enumerate all dates in range
  const days: string[] = [];
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }

  const data = roomTypes.map((rt) => {
    const typeRoomIds = roomsByType.get(rt.id) ?? [];
    const dayMap: Record<string, { total: number; booked: number; available: number }> = {};
    for (const day of days) {
      const occupied = occupiedByDate.get(day) ?? new Set<string>();
      const booked = typeRoomIds.filter((id) => occupied.has(id)).length;
      dayMap[day] = { total: typeRoomIds.length, booked, available: typeRoomIds.length - booked };
    }
    return { roomType: rt, days: dayMap };
  });

  return { from: query.from, to: query.to, days, data };
}
