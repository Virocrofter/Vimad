import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const roomTypeCreateSchema = z.object({
  propertyId: z.string(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  baseOccupancy: z.number().int().min(1).default(2),
  maxOccupancy: z.number().int().min(1).default(4),
});

export const roomTypeUpdateSchema = roomTypeCreateSchema.partial();

export type RoomTypeCreateInput = z.infer<typeof roomTypeCreateSchema>;
export type RoomTypeUpdateInput = z.infer<typeof roomTypeUpdateSchema>;

export async function listRoomTypes(
  tenantId: string,
  query: { page: number; pageSize: number; propertyId?: string }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (query.propertyId) where.propertyId = query.propertyId;

  const [total, items] = await Promise.all([
    prisma.roomType.count({ where }),
    prisma.roomType.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
        _count: {
          select: { rooms: true, ratePlans: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getRoomType(tenantId: string, id: string) {
  const roomType = await prisma.roomType.findFirst({
    where: { id, tenantId },
    include: {
      property: true,
      rooms: true,
      ratePlans: true,
    },
  });

  if (!roomType) {
    throw new AppError(404, 'Room type not found', 'NOT_FOUND');
  }

  return roomType;
}

export async function createRoomType(tenantId: string, input: RoomTypeCreateInput) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const _existing = await prisma.roomType.findFirst({
    where: { propertyId: input.propertyId, code: input.code },
  });
  if (_existing) {
    throw new AppError(409, 'Room type code already exists for this property', 'CONFLICT');
  }

  return prisma.roomType.create({
    data: {
      tenantId,
      ...input,
    },
  });
}

export async function updateRoomType(tenantId: string, id: string, input: RoomTypeUpdateInput) {
  const _existing = await prisma.roomType.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Room type not found', 'NOT_FOUND');
  }

  return prisma.roomType.update({
    where: { id },
    data: input,
  });
}

export async function deleteRoomType(tenantId: string, id: string) {
  const _existing = await prisma.roomType.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Room type not found', 'NOT_FOUND');
  }

  return prisma.roomType.delete({ where: { id } });
}
