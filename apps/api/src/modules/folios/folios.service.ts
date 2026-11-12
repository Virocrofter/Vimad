import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const folioCreateSchema = z.object({
  reservationId: z.string(),
  type: z.enum(['guest', 'master', 'split']).default('guest'),
  name: z.string().optional(),
});

export const chargeSchema = z.object({
  type: z.enum(['room_charge', 'tax', 'service', 'incidental', 'adjustment', 'penalty']),
  description: z.string().min(1),
  amount: z.coerce.number(),
  quantity: z.number().int().min(1).default(1),
  postedAt: z.coerce.date().optional(),
});

export const paymentSchema = z.object({
  type: z.enum(['cash', 'card', 'bank_transfer', 'check', 'voucher', 'refund']),
  description: z.string().optional(),
  amount: z.coerce.number(),
  reference: z.string().optional(),
  processedAt: z.coerce.date().optional(),
});

export type FolioCreateInput = z.infer<typeof folioCreateSchema>;

export async function listFolios(
  tenantId: string,
  query: { page: number; pageSize: number; reservationId?: string; status?: string },
  propertyIds?: string[]
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (propertyIds?.length) where.reservation = { is: { propertyId: { in: propertyIds } } };

  if (query.reservationId) where.reservationId = query.reservationId;
  if (query.status) where.status = query.status;

  const [total, items] = await Promise.all([
    prisma.folio.count({ where }),
    prisma.folio.findMany({
      where,
      include: {
        reservation: {
          select: {
            id: true,
            confirmationNumber: true,
            guest: { select: { firstName: true, lastName: true } },
          },
        },
        items: { orderBy: { postedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getFolio(tenantId: string, id: string) {
  const folio = await prisma.folio.findFirst({
    where: { id, tenantId },
    include: {
      reservation: {
        include: {
          guest: true,
          property: { select: { id: true, name: true } },
          stays: { include: { room: true } },
        },
      },
      items: { orderBy: { postedAt: 'desc' } },
    },
  });
  if (!folio) {
    throw new AppError(404, 'Folio not found', 'NOT_FOUND');
  }
  return folio;
}

export async function createFolio(tenantId: string, input: FolioCreateInput) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: input.reservationId, tenantId },
  });
  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }

  const _existing = await prisma.folio.findUnique({
    where: { reservationId: input.reservationId },
  });
  if (_existing) {
    throw new AppError(409, 'Folio already exists for this reservation', 'CONFLICT');
  }

  return prisma.folio.create({
    data: {
      tenantId,
      reservationId: input.reservationId,
      totalCharges: 0,
      totalPayments: 0,
      balance: 0,
    },
  });
}

export async function postCharge(
  tenantId: string,
  folioId: string,
  input: z.infer<typeof chargeSchema>
) {
  const folio = await getFolio(tenantId, folioId);

  if (folio.status !== 'open') {
    throw new AppError(409, 'Cannot post charges to a closed folio', 'CONFLICT');
  }

  const amount = input.amount * input.quantity;

  const [item] = await prisma.$transaction([
    prisma.folioItem.create({
      data: {
        folioId,
        type: input.type,
        description: input.description,
        amount,
        quantity: input.quantity,
        postedAt: input.postedAt ?? new Date(),
      },
    }),
    prisma.folio.update({
      where: { id: folioId },
      data: {
        totalCharges: { increment: amount },
        balance: { increment: amount },
      },
    }),
  ]);

  return item;
}

export async function reverseCharge(
  tenantId: string,
  folioId: string,
  chargeId: string,
  reason: string
) {
  const folio = await getFolio(tenantId, folioId);
  const charge = folio.items.find((i) => i.id === chargeId);

  if (!charge) {
    throw new AppError(404, 'Charge not found', 'NOT_FOUND');
  }
  if (charge.type === 'adjustment') {
    throw new AppError(409, 'Cannot reverse an adjustment', 'CONFLICT');
  }

  const [reversal] = await prisma.$transaction([
    prisma.folioItem.create({
      data: {
        folioId,
        type: 'adjustment',
        description: `Reversal: ${charge.description} — ${reason}`,
        amount: -charge.amount,
        quantity: 1,
        postedAt: new Date(),
      },
    }),
    prisma.folio.update({
      where: { id: folioId },
      data: {
        totalCharges: { decrement: charge.amount },
        balance: { decrement: charge.amount },
      },
    }),
  ]);

  return reversal;
}

export async function postPayment(
  tenantId: string,
  folioId: string,
  input: z.infer<typeof paymentSchema>
) {
  const folio = await getFolio(tenantId, folioId);

  if (folio.status !== 'open') {
    throw new AppError(409, 'Cannot post payments to a closed folio', 'CONFLICT');
  }

  const amount = Math.abs(input.amount);

  const [item] = await prisma.$transaction([
    prisma.folioItem.create({
      data: {
        folioId,
        type: input.type === 'refund' ? 'refund' : 'payment',
        description: input.description ?? `${input.type} payment`,
        amount: input.type === 'refund' ? -amount : -amount,
        quantity: 1,
        postedAt: input.processedAt ?? new Date(),
      },
    }),
    prisma.folio.update({
      where: { id: folioId },
      data: {
        totalPayments: input.type === 'refund' ? { decrement: amount } : { increment: amount },
        balance: input.type === 'refund' ? { increment: amount } : { decrement: amount },
      },
    }),
  ]);

  return item;
}

export async function transferToCityLedger(tenantId: string, folioId: string) {
  const folio = await getFolio(tenantId, folioId);

  if (folio.status !== 'open') {
    throw new AppError(409, 'Folio must be open to transfer', 'CONFLICT');
  }

  return prisma.folio.update({
    where: { id: folioId },
    data: {
      status: 'transferred',
    },
  });
}

export async function deleteFolio(tenantId: string, id: string) {
  const folio = await getFolio(tenantId, id);

  if (folio.items.length > 0) {
    throw new AppError(409, 'Cannot delete folio with posted items', 'CONFLICT');
  }

  return prisma.folio.delete({ where: { id } });
}
