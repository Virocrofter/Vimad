import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const roomCreateSchema = z.object({
  propertyId: z.string(),
  roomTypeId: z.string(),
  number: z.string().min(1),
  floor: z.string().optional(),
  status: z.string().default('clean'),
  housekeepingStatus: z.string().default('ready'),
});

export const roomUpdateSchema = roomCreateSchema.partial();

export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;

export async function listRooms(
  tenantId: string,
  query: {
    page: number;
    pageSize: number;
    propertyId?: string;
    roomTypeId?: string;
    status?: string;
  }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.roomTypeId) where.roomTypeId = query.roomTypeId;
  if (query.status) where.status = query.status;

  const [total, items] = await Promise.all([
    prisma.room.count({ where }),
    prisma.room.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        roomType: { select: { id: true, name: true, code: true } },
      },
      orderBy: { number: 'asc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getRoom(tenantId: string, id: string) {
  const room = await prisma.room.findFirst({
    where: { id, tenantId },
    include: {
      property: true,
      roomType: true,
      reservationStays: {
        where: {
          date: { gte: new Date() },
          reservation: { status: { in: ['confirmed', 'checked_in'] } },
        },
        include: {
          reservation: {
            include: { guest: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
        orderBy: { date: 'asc' },
      },
      housekeepingTasks: {
        where: { status: { in: ['pending', 'in_progress'] } },
        orderBy: { scheduledAt: 'asc' },
      },
    },
  });

  if (!room) {
    throw new AppError(404, 'Room not found', 'NOT_FOUND');
  }

  return room;
}

export async function createRoom(tenantId: string, input: RoomCreateInput) {
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

  const _existing = await prisma.room.findFirst({
    where: { propertyId: input.propertyId, number: input.number },
  });
  if (_existing) {
    throw new AppError(409, 'Room number already exists for this property', 'CONFLICT');
  }

  return prisma.room.create({
    data: {
      tenantId,
      ...input,
    },
  });
}

export async function updateRoom(tenantId: string, id: string, input: RoomUpdateInput) {
  const _existing = await prisma.room.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Room not found', 'NOT_FOUND');
  }

  return prisma.room.update({
    where: { id },
    data: input,
  });
}

export async function deleteRoom(tenantId: string, id: string) {
  const _existing = await prisma.room.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Room not found', 'NOT_FOUND');
  }

  return prisma.room.delete({ where: { id } });
}

export async function updateRoomStatus(
  tenantId: string,
  id: string,
  status: string,
  housekeepingStatus?: string
) {
  const _existing = await prisma.room.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Room not found', 'NOT_FOUND');
  }

  return prisma.room.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(housekeepingStatus && { housekeepingStatus }),
    },
  });
}
