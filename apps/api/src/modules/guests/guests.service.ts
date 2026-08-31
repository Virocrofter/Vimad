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
    const term = { contains: query.search, mode: 'insensitive' };
    where.OR = [{ firstName: term }, { lastName: term }, { email: term }, { phone: term }];
  }

  const [total, items] = await Promise.all([
    prisma.guest.count({ where }),
    prisma.guest.findMany({
      where,
      orderBy: { lastName: 'asc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getGuest(tenantId: string, id: string) {
  const guest = await prisma.guest.findFirst({
    where: { id, tenantId },
    include: { preferences: true, documents: true },
  });
  if (!guest) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }
  return guest;
}

export async function createGuest(tenantId: string, input: GuestCreateInput) {
  return prisma.guest.create({
    data: { ...input, tenantId },
  });
}

export async function updateGuest(tenantId: string, id: string, input: GuestUpdateInput) {
  await getGuest(tenantId, id);
  return prisma.guest.update({
    where: { id },
    data: input,
  });
}

export async function deleteGuest(tenantId: string, id: string) {
  await getGuest(tenantId, id);
  return prisma.guest.delete({ where: { id } });
}
