import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const guestCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  passportNumber: z.string().optional(),
  vipStatus: z.string().optional(),
  notes: z.string().optional(),
});

export const guestUpdateSchema = guestCreateSchema.partial();

export type GuestCreateInput = z.infer<typeof guestCreateSchema>;
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;

export async function listGuests(
  tenantId: string,
  query: { page: number; pageSize: number; search?: string }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.guest.count({ where }),
    prisma.guest.findMany({
      where,
      include: {
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            confirmationNumber: true,
            status: true,
            arrivalDate: true,
            departureDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getGuest(tenantId: string, id: string) {
  const guest = await prisma.guest.findFirst({
    where: { id, tenantId },
    include: {
      preferences: true,
      documents: true,
      reservations: {
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, name: true } },
          stays: { include: { room: true } },
        },
      },
    },
  });

  if (!guest) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  return guest;
}

export async function createGuest(tenantId: string, input: GuestCreateInput) {
  return prisma.guest.create({
    data: {
      tenantId,
      ...input,
    },
  });
}

export async function updateGuest(tenantId: string, id: string, input: GuestUpdateInput) {
  const _existing = await prisma.guest.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  return prisma.guest.update({
    where: { id },
    data: input,
  });
}

export async function deleteGuest(tenantId: string, id: string) {
  const _existing = await prisma.guest.findFirst({ where: { id, tenantId } });
  if (!_existing) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  return prisma.guest.delete({ where: { id } });
}
