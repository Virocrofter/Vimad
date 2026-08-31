import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';

export const reservationCreateSchema = z.object({
  propertyId: z.string(),
  guestId: z.string(),
  arrivalDate: z.coerce.date(),
  departureDate: z.coerce.date(),
  nights: z.number().int().min(1),
  roomTypeId: z.string().optional(),
  roomId: z.string().optional(),
  rate: z.coerce.number().min(0),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  source: z.string().default('direct'),
  notes: z.string().optional(),
});

export const reservationUpdateSchema = z.object({
  status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
  roomId: z.string().optional(),
  notes: z.string().optional(),
});

export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>;

function generateConfirmationNumber(): string {
  return `RES-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
}

export async function listReservations(
  tenantId: string,
  query: { page: number; pageSize: number; status?: string; propertyId?: string; guestId?: string }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (query.status) where.status = query.status;
  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.guestId) where.guestId = query.guestId;

  const [total, items] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: { guest: true, property: true },
      orderBy: { arrivalDate: 'asc' },
      ...skipTake(pagination),
    }),
  ]);

  return paginate(items, total, pagination);
}

export async function getReservation(tenantId: string, id: string) {
  const reservation = await prisma.reservation.findFirst({
    where: { id, tenantId },
    include: {
      guest: true,
      property: true,
      stays: { include: { room: true } },
      folio: { include: { items: { orderBy: { postedAt: 'desc' } } } },
    },
  });
  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }
  return reservation;
}

export async function createReservation(tenantId: string, input: ReservationCreateInput) {
  const totalAmount = input.rate * input.nights;
  const balance = totalAmount;

  const reservation = await prisma.$transaction(async (tx) => {
    const guest = await tx.guest.findFirst({ where: { id: input.guestId, tenantId } });
    if (!guest) {
      throw new AppError(404, 'Guest not found', 'NOT_FOUND');
    }

    const property = await tx.property.findFirst({ where: { id: input.propertyId, tenantId } });
    if (!property) {
      throw new AppError(404, 'Property not found', 'NOT_FOUND');
    }

    const created = await tx.reservation.create({
      data: {
        tenantId,
        propertyId: input.propertyId,
        guestId: input.guestId,
        confirmationNumber: generateConfirmationNumber(),
        status: 'confirmed',
        source: input.source,
        arrivalDate: input.arrivalDate,
        departureDate: input.departureDate,
        nights: input.nights,
        adults: input.adults,
        children: input.children,
        totalAmount,
        balance,
        notes: input.notes,
        folio: {
          create: {
            totalCharges: totalAmount,
            totalPayments: 0,
            balance,
          },
        },
      },
      include: { folio: true },
    });

    // Create nightly room charges on folio
    const folio = created.folio;
    if (!folio) {
      throw new AppError(500, 'Folio creation failed', 'INTERNAL_ERROR');
    }

    await tx.folioItem.createMany({
      data: Array.from({ length: input.nights }).map((_, i) => ({
        folioId: folio.id,
        type: 'room_charge',
        description: `Room charge - Night ${i + 1}`,
        amount: input.rate,
      })),
    });

    return created;
  });

  return getReservation(tenantId, reservation.id);
}

export async function updateReservation(
  tenantId: string,
  id: string,
  input: ReservationUpdateInput
) {
  const existing = await getReservation(tenantId, id);

  return prisma.reservation.update({
    where: { id },
    data: {
      status: input.status ?? existing.status,
      notes: input.notes ?? existing.notes,
    },
    include: {
      guest: true,
      property: true,
      stays: { include: { room: true } },
      folio: { include: { items: true } },
    },
  });
}

export async function deleteReservation(tenantId: string, id: string) {
  await getReservation(tenantId, id);
  return prisma.reservation.delete({ where: { id } });
}
