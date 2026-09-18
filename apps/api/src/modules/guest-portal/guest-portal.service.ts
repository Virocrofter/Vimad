/* apps/api/src/modules/guest-portal/guest-portal.service.ts */
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { env } from '../../common/env.js';

export const verifyIdentitySchema = z.object({
  confirmationNumber: z.string(),
  lastName: z.string(),
  documentNumber: z.string().optional(),
});

export const checkInSchema = z.object({
  token: z.string(),
  estimatedArrivalTime: z.string().optional(),
  idDocument: z.string().optional(),
  signature: z.string().optional(),
});

export const serviceRequestSchema = z.object({
  token: z.string(),
  type: z.enum(['housekeeping', 'maintenance', 'concierge', 'amenity']),
  message: z.string(),
  requestedAt: z.string().optional(),
});

export type VerifyIdentityInput = z.infer<typeof verifyIdentitySchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

// ─── Portal access tokens ───
// Stateless JWT scoped to a single reservation. Expires at end of the
// departure day so a guest can't use the portal after their stay.

const PORTAL_TOKEN_SCOPE = 'guest-portal';

interface PortalTokenPayload {
  scope: typeof PORTAL_TOKEN_SCOPE;
  reservationId: string;
  guestId: string;
  tenantId: string;
}

function issuePortalToken(reservation: {
  id: string;
  guestId: string;
  tenantId: string;
  departureDate: Date;
}): string {
  const departureEnd = new Date(reservation.departureDate);
  departureEnd.setHours(23, 59, 59, 999);
  const expiresInSeconds = Math.max(3600, Math.floor((departureEnd.getTime() - Date.now()) / 1000));

  return jwt.sign(
    {
      scope: PORTAL_TOKEN_SCOPE,
      reservationId: reservation.id,
      guestId: reservation.guestId,
      tenantId: reservation.tenantId,
    } satisfies PortalTokenPayload,
    env.JWT_SECRET,
    { expiresIn: expiresInSeconds }
  );
}

async function resolveToken(token: string) {
  let payload: PortalTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as PortalTokenPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired portal token', 'PORTAL_TOKEN_INVALID');
  }

  if (payload.scope !== PORTAL_TOKEN_SCOPE) {
    throw new AppError(401, 'Invalid portal token scope', 'PORTAL_TOKEN_INVALID');
  }

  const reservation = await prisma.reservation.findFirst({
    where: { id: payload.reservationId, tenantId: payload.tenantId },
    include: {
      guest: true,
      property: { select: { id: true, name: true } },
      stays: {
        include: { room: { select: { id: true, number: true } } },
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!reservation) {
    throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }

  return reservation;
}

function dateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ─── Lookup (step 1: does this reservation exist?) ───

export async function lookupReservation(confirmationNumber: string, lastName: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { confirmationNumber },
    include: { guest: { select: { firstName: true, lastName: true } } },
  });

  // Constant-shape response whether found or not — don't leak which
  // confirmation numbers exist.
  if (!reservation || reservation.guest.lastName.toLowerCase() !== lastName.trim().toLowerCase()) {
    return {
      found: false,
      confirmationNumber,
      guestName: '',
      arrivalDate: '',
      departureDate: '',
    };
  }

  return {
    found: true,
    confirmationNumber: reservation.confirmationNumber,
    guestName: `${reservation.guest.lastName}, ${reservation.guest.firstName}`,
    arrivalDate: dateOnly(reservation.arrivalDate),
    departureDate: dateOnly(reservation.departureDate),
  };
}

// ─── Verify identity (step 2: issue portal token) ───

export async function verifyIdentity(input: VerifyIdentityInput) {
  const reservation = await prisma.reservation.findUnique({
    where: { confirmationNumber: input.confirmationNumber },
    include: { guest: { include: { documents: true } } },
  });

  if (
    !reservation ||
    reservation.guest.lastName.toLowerCase() !== input.lastName.trim().toLowerCase()
  ) {
    throw new AppError(401, 'Identity verification failed', 'VERIFY_FAILED');
  }

  if (['cancelled', 'no_show', 'checked_out'].includes(reservation.status)) {
    throw new AppError(
      403,
      `Reservation is ${reservation.status} — portal access not available`,
      'RESERVATION_INACTIVE'
    );
  }

  // Optional document check: match against passport number or any stored
  // guest document. Compared in constant time to avoid leaking partial matches.
  if (input.documentNumber) {
    const candidate = input.documentNumber.trim();
    const known = [
      reservation.guest.passportNumber,
      ...reservation.guest.documents.map((d) => d.number),
    ].filter((n): n is string => Boolean(n));

    const matches = known.some((n) => {
      const a = Buffer.from(n);
      const b = Buffer.from(candidate);
      return a.length === b.length && timingSafeEqual(a, b);
    });

    if (!matches) {
      logger.warn({ reservationId: reservation.id }, 'guest portal document verification failed');
      throw new AppError(401, 'Identity verification failed', 'VERIFY_FAILED');
    }
  }

  const token = issuePortalToken(reservation);

  logger.info(
    { reservationId: reservation.id, guestId: reservation.guestId },
    'guest portal token issued'
  );

  return {
    verified: true,
    token,
    guestName: `${reservation.guest.lastName}, ${reservation.guest.firstName}`,
  };
}

// ─── Stay details ───

export async function getStayDetails(token: string) {
  const reservation = await resolveToken(token);
  const room = reservation.stays[0]?.room;

  return {
    token,
    guestName: `${reservation.guest.lastName}, ${reservation.guest.firstName}`,
    roomNumber: room?.number ?? 'Unassigned',
    arrivalDate: dateOnly(reservation.arrivalDate),
    departureDate: dateOnly(reservation.departureDate),
    checkedIn: reservation.status === 'checked_in',
    digitalKeyReady: reservation.status === 'checked_in' && Boolean(room),
  };
}

// ─── Check-in ───

export async function submitCheckIn(input: CheckInInput) {
  const reservation = await resolveToken(input.token);

  if (reservation.status === 'checked_in') {
    return {
      success: true,
      token: input.token,
      checkedIn: true,
      estimatedArrivalTime: input.estimatedArrivalTime,
    };
  }

  if (reservation.status !== 'confirmed') {
    throw new AppError(
      409,
      `Cannot check in a reservation with status "${reservation.status}"`,
      'CHECKIN_NOT_ALLOWED'
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'checked_in',
        notes: input.estimatedArrivalTime
          ? [reservation.notes, `ETA: ${input.estimatedArrivalTime}`].filter(Boolean).join('\n')
          : reservation.notes,
      },
    });

    if (input.idDocument) {
      await tx.guestDocument.create({
        data: {
          guestId: reservation.guestId,
          type: 'id_card',
          number: input.idDocument,
        },
      });
    }
  });

  logger.info({ reservationId: reservation.id }, 'guest checked in via portal');

  return {
    success: true,
    token: input.token,
    checkedIn: true,
    estimatedArrivalTime: input.estimatedArrivalTime,
  };
}

// ─── Digital key ───
// Deterministic HMAC key code bound to reservation + room + stay dates.
// No key material is stored; rotating JWT_SECRET invalidates all keys.

export async function getDigitalKey(token: string) {
  const reservation = await resolveToken(token);

  if (reservation.status !== 'checked_in') {
    throw new AppError(409, 'Digital key is available after check-in', 'KEY_NOT_READY');
  }

  const room = reservation.stays[0]?.room;
  if (!room) {
    throw new AppError(409, 'No room assigned yet — digital key unavailable', 'KEY_NOT_READY');
  }

  const keyMaterial = [
    reservation.id,
    room.id,
    dateOnly(reservation.arrivalDate),
    dateOnly(reservation.departureDate),
  ].join('|');

  const keyCode = createHmac('sha256', env.JWT_SECRET)
    .update(keyMaterial)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();

  const activeFrom = new Date(reservation.arrivalDate);
  activeFrom.setHours(15, 0, 0, 0); // standard check-in time
  const activeUntil = new Date(reservation.departureDate);
  activeUntil.setHours(11, 0, 0, 0); // standard check-out time

  logger.info({ reservationId: reservation.id, roomId: room.id }, 'digital key issued via portal');

  return {
    token,
    keyCode,
    activeFrom: activeFrom.toISOString(),
    activeUntil: activeUntil.toISOString(),
  };
}

// ─── Service requests ───

export async function requestService(input: ServiceRequestInput) {
  const reservation = await resolveToken(input.token);
  const room = reservation.stays[0]?.room;

  // Housekeeping/maintenance become real tasks on the housekeeping board when
  // the underlying Prisma model is available. If that model is not generated in
  // the current client, fall back to recording the request on the reservation.
  if ((input.type === 'housekeeping' || input.type === 'maintenance') && room) {
    const housekeepingTaskModel = (prisma as any).housekeepingTask;

    if (housekeepingTaskModel) {
      const task = await housekeepingTaskModel.create({
        data: {
          tenantId: reservation.tenantId,
          propertyId: reservation.propertyId,
          roomId: room.id,
          type: input.type === 'maintenance' ? 'maintenance' : 'cleaning',
          priority: 'normal',
          status: 'pending',
          notes: `Guest portal request: ${input.message}`,
          scheduledAt: input.requestedAt ? new Date(input.requestedAt) : new Date(),
        },
      });

      return {
        id: task.id,
        token: input.token,
        type: input.type,
        message: input.message,
        status: 'received',
        createdAt: task.createdAt.toISOString(),
      };
    }
  }

  // Concierge/amenity (or unassigned room): record on the reservation so
  // front-desk staff can action it.
  const note = `[${new Date().toISOString()}] Guest ${input.type} request: ${input.message}`;
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { notes: [reservation.notes, note].filter(Boolean).join('\n') },
  });

  return {
    id: `req-${reservation.id.slice(-8)}`,
    token: input.token,
    type: input.type,
    message: input.message,
    status: 'received',
    createdAt: new Date().toISOString(),
  };
}

// ─── Preferences ───

export async function updatePreferences(token: string, preferences: Record<string, string>) {
  const reservation = await resolveToken(token);

  await prisma.$transaction(
    Object.entries(preferences).map(([key, value]) =>
      prisma.guestPreference.upsert({
        where: {
          // GuestPreference has no natural unique key — emulate upsert with
          // delete+create guarded in the transaction below instead.
          id: `${reservation.guestId}-portal-${key}`,
        },
        create: {
          id: `${reservation.guestId}-portal-${key}`,
          guestId: reservation.guestId,
          category: 'portal',
          key,
          value,
        },
        update: { value },
      })
    )
  );

  return {
    token,
    preferences,
    updatedAt: new Date().toISOString(),
  };
}
