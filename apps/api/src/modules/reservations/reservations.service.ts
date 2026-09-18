import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, paginationSchema, skipTake } from '../../common/pagination.js';
import { broadcastAuditEvent } from '../audit/audit.events.js';
import {
  broadcastReservationCreated,
  broadcastReservationUpdated,
  broadcastReservationCheckedIn,
  broadcastReservationCheckedOut,
  broadcastReservationCancelled,
} from './reservation.events.js';

export const reservationCreateSchema = z.object({
  propertyId: z.string(),
  guestId: z.string(),
  arrivalDate: z.coerce.date(),
  departureDate: z.coerce.date(),
  nights: z.number().int().min(1),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  notes: z.string().optional(),
  roomTypeId: z.string().optional(),
  source: z.enum(['direct', 'bookingcom', 'expedia', 'walkin', 'phone', 'email']).default('direct'),
});

export const reservationUpdateSchema = reservationCreateSchema.partial().omit({
  propertyId: true,
  guestId: true,
});

export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;
export type ReservationUpdateInput = z.infer<typeof reservationUpdateSchema>;

function generateConfirmationNumber(): string {
  return `VMD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export async function listReservations(
  tenantId: string,
  query: {
    page: number;
    pageSize: number;
    propertyId?: string;
    guestId?: string;
    status?: string;
    arrivalFrom?: string;
    arrivalTo?: string;
  }
) {
  const pagination = paginationSchema.parse(query);
  const where: Record<string, unknown> = { tenantId };

  if (query.propertyId) where.propertyId = query.propertyId;
  if (query.guestId) where.guestId = query.guestId;
  if (query.status) where.status = query.status;
  if (query.arrivalFrom || query.arrivalTo) {
    where.arrivalDate = {};
    if (query.arrivalFrom)
      (where.arrivalDate as Record<string, Date>).gte = new Date(query.arrivalFrom);
    if (query.arrivalTo)
      (where.arrivalDate as Record<string, Date>).lte = new Date(query.arrivalTo);
  }

  const [total, items] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      include: {
        guest: { select: { id: true, firstName: true, lastName: true } },
        property: { select: { id: true, name: true, code: true } },
        stays: { include: { room: { select: { id: true, number: true } } } },
        folio: true,
      },
      orderBy: { createdAt: 'desc' },
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
      folio: { include: { items: true } },
    },
  });
  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }
  return reservation;
}

export async function createReservation(tenantId: string, input: ReservationCreateInput) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, tenantId },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'NOT_FOUND');
  }

  const guest = await prisma.guest.findFirst({
    where: { id: input.guestId, tenantId },
  });
  if (!guest) {
    throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  }

  const confirmationNumber = generateConfirmationNumber();
  const totalAmount = 0; // Will be calculated from stays

  const reservation = await prisma.reservation.create({
    data: {
      tenantId,
      propertyId: input.propertyId,
      guestId: input.guestId,
      confirmationNumber,
      status: 'confirmed',
      source: input.source,
      arrivalDate: input.arrivalDate,
      departureDate: input.departureDate,
      nights: input.nights,
      adults: input.adults,
      children: input.children,
      notes: input.notes,
      totalAmount,
      balance: totalAmount,
    },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
    },
  });

  // Audit event
  broadcastAuditEvent({
    id: `audit-res-create-${reservation.id}`,
    timestamp: new Date().toISOString(),
    actor: { id: 'system', name: 'System', role: 'system', ip: '0.0.0.0' },
    action: {
      type: 'create',
      category: 'reservation',
      label: 'Reservation Created',
      description: `Reservation ${confirmationNumber} created for ${guest.firstName} ${guest.lastName}`,
    },
    target: { type: 'reservation', id: reservation.id, name: confirmationNumber, tenantId },
    severity: 'low',
  });

  // Socket.io event
  broadcastReservationCreated(tenantId, {
    id: reservation.id,
    confirmationNumber: reservation.confirmationNumber,
    guestName: `${guest.firstName} ${guest.lastName}`,
    propertyId: reservation.propertyId,
    propertyName: property.name,
    arrivalDate: reservation.arrivalDate.toISOString(),
    departureDate: reservation.departureDate.toISOString(),
    status: reservation.status,
    source: reservation.source,
  });

  return reservation;
}

export async function updateReservation(
  tenantId: string,
  id: string,
  input: ReservationUpdateInput
) {
  const existing = await getReservation(tenantId, id);

  const reservation = await prisma.reservation.update({
    where: { id },
    data: input,
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
    },
  });

  broadcastAuditEvent({
    id: `audit-res-update-${id}`,
    timestamp: new Date().toISOString(),
    actor: { id: 'system', name: 'System', role: 'system', ip: '0.0.0.0' },
    action: {
      type: 'update',
      category: 'reservation',
      label: 'Reservation Updated',
      description: `Reservation ${reservation.confirmationNumber} updated`,
    },
    target: { type: 'reservation', id, name: reservation.confirmationNumber, tenantId },
    severity: 'low',
    metadata: { changedFields: Object.keys(input) },
  });

  broadcastReservationUpdated(tenantId, {
    id: reservation.id,
    confirmationNumber: reservation.confirmationNumber,
    guestName: `${reservation.guest.firstName} ${reservation.guest.lastName}`,
    propertyId: reservation.propertyId,
    propertyName: reservation.property.name,
    arrivalDate: reservation.arrivalDate.toISOString(),
    departureDate: reservation.departureDate.toISOString(),
    status: reservation.status,
    previousStatus: existing.status,
  });

  return reservation;
}

export async function checkInReservation(tenantId: string, id: string) {
  const reservation = await getReservation(tenantId, id);

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot check in reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: 'checked_in' },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
      stays: { include: { room: { select: { id: true, number: true } } } },
    },
  });

  broadcastAuditEvent({
    id: `audit-res-checkin-${id}`,
    timestamp: new Date().toISOString(),
    actor: { id: 'system', name: 'System', role: 'system', ip: '0.0.0.0' },
    action: {
      type: 'checkin',
      category: 'reservation',
      label: 'Guest Checked In',
      description: `Guest ${updated.guest.firstName} ${updated.guest.lastName} checked in`,
    },
    target: { type: 'reservation', id, name: updated.confirmationNumber, tenantId },
    severity: 'low',
  });

  broadcastReservationCheckedIn(tenantId, {
    id: updated.id,
    confirmationNumber: updated.confirmationNumber,
    guestName: `${updated.guest.firstName} ${updated.guest.lastName}`,
    propertyId: updated.propertyId,
    propertyName: updated.property.name,
    roomNumber: updated.stays[0]?.room?.number,
    checkedInAt: new Date().toISOString(),
  });

  return updated;
}

export async function checkOutReservation(tenantId: string, id: string) {
  const reservation = await getReservation(tenantId, id);

  if (reservation.status !== 'checked_in') {
    throw new AppError(
      409,
      `Cannot check out reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: 'checked_out' },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
    },
  });

  broadcastAuditEvent({
    id: `audit-res-checkout-${id}`,
    timestamp: new Date().toISOString(),
    actor: { id: 'system', name: 'System', role: 'system', ip: '0.0.0.0' },
    action: {
      type: 'checkout',
      category: 'reservation',
      label: 'Guest Checked Out',
      description: `Guest ${updated.guest.firstName} ${updated.guest.lastName} checked out`,
    },
    target: { type: 'reservation', id, name: updated.confirmationNumber, tenantId },
    severity: 'low',
  });

  broadcastReservationCheckedOut(tenantId, {
    id: updated.id,
    confirmationNumber: updated.confirmationNumber,
    guestName: `${updated.guest.firstName} ${updated.guest.lastName}`,
    propertyId: updated.propertyId,
    propertyName: updated.property.name,
    checkedOutAt: new Date().toISOString(),
  });

  return updated;
}

export async function cancelReservation(tenantId: string, id: string, reason?: string) {
  const reservation = await getReservation(tenantId, id);

  if (['checked_out', 'cancelled', 'no_show'].includes(reservation.status)) {
    throw new AppError(
      409,
      `Cannot cancel reservation with status "${reservation.status}"`,
      'CONFLICT'
    );
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: 'cancelled' },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { id: true, name: true } },
    },
  });

  broadcastAuditEvent({
    id: `audit-res-cancel-${id}`,
    timestamp: new Date().toISOString(),
    actor: { id: 'system', name: 'System', role: 'system', ip: '0.0.0.0' },
    action: {
      type: 'cancel',
      category: 'reservation',
      label: 'Reservation Cancelled',
      description: `Reservation ${updated.confirmationNumber} cancelled${reason ? `: ${reason}` : ''}`,
    },
    target: { type: 'reservation', id, name: updated.confirmationNumber, tenantId },
    severity: 'medium',
    metadata: reason ? { cancellationReason: reason } : undefined,
  });

  broadcastReservationCancelled(tenantId, {
    id: updated.id,
    confirmationNumber: updated.confirmationNumber,
    guestName: `${updated.guest.firstName} ${updated.guest.lastName}`,
    propertyId: updated.propertyId,
    propertyName: updated.property.name,
    cancelledAt: new Date().toISOString(),
    reason,
  });

  return updated;
}

export async function deleteReservation(tenantId: string, id: string) {
  const reservation = await getReservation(tenantId, id);
  await prisma.reservation.delete({ where: { id } });

  broadcastAuditEvent({
    id: `audit-res-delete-${id}`,
    timestamp: new Date().toISOString(),
    actor: { id: 'system', name: 'System', role: 'system', ip: '0.0.0.0' },
    action: {
      type: 'delete',
      category: 'reservation',
      label: 'Reservation Deleted',
      description: `Reservation ${reservation.confirmationNumber} deleted`,
    },
    target: { type: 'reservation', id, name: reservation.confirmationNumber, tenantId },
    severity: 'high',
  });

  return reservation;
}
