import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const propertyCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().default('UTC'),
  currency: z.string().default('ZAR'),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

export async function listProperties(tenantId: string, query: { page: number; pageSize: number }) {
  const pagination = paginationSchema.parse(query);
  const where = { tenantId };

  const [total, items] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      include: {
        _count: {
          select: { rooms: true, roomTypes: true, reservations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getProperty(tenantId: string, id: string) {
  const property = await prisma.property.findFirst({
    where: { id, tenantId },
    include: {
      roomTypes: true,
      rooms: { include: { roomType: true } },
      ratePlans: { include: { roomType: true } },
      _count: {
        select: { reservations: true },
      },
    },
  });

  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  return property;
}

export async function createProperty(tenantId: string, input: PropertyCreateInput) {
  const _existing = await prisma.property.findFirst({
    where: { tenantId, code: input.code },
  });
  if (_existing) {
    throw new AppError(409, 'Property code already exists', 'CONFLICT');
  }

  return prisma.property.create({
    data: {
      tenantId,
      ...input,
    },
  });
}

export async function updateProperty(tenantId: string, id: string, input: PropertyUpdateInput) {
  const _existing = await prisma.property.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  return prisma.property.update({
    where: { id },
    data: input,
  });
}

export async function deleteProperty(tenantId: string, id: string) {
  const _existing = await prisma.property.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  return prisma.property.delete({ where: { id } });
}
