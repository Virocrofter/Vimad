/* apps/api/src/modules/guest-portal/my-stays.service.ts — 0.5 guest CRM 360
 * Guest-safe projection of the CRM 360 data: stay history, lifetime stats,
 * loyalty ledger, upcoming stay. Deliberately NOT a proxy of the staff
 * getGuest360 (which carries internal notes, follow-ups and flags).
 * Token convention matches the rest of the portal: reservation-scoped JWT
 * in the URL path, same scope as stay-details/digital-key.
 */
import jwt from 'jsonwebtoken';
import { prisma } from '../../common/prisma.js';
import { env } from '../../common/env.js';
import { AppError } from '../../common/errors.js';

const PORTAL_SCOPE = 'guest-portal';

interface PortalPayload {
  reservationId: string;
  tenantId: string;
  scope: string;
}

async function resolveGuest(token: string) {
  let payload: PortalPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as PortalPayload;
  } catch {
    throw new AppError(401, 'Invalid or expired portal token', 'PORTAL_TOKEN_INVALID');
  }
  if (payload.scope !== PORTAL_SCOPE) {
    throw new AppError(401, 'Invalid portal token scope', 'PORTAL_TOKEN_INVALID');
  }
  const reservation = await prisma.reservation.findFirst({
    where: { id: payload.reservationId, tenantId: payload.tenantId },
    select: { guestId: true },
  });
  if (!reservation) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  return { tenantId: payload.tenantId, guestId: reservation.guestId };
}

export async function getMyStays(token: string) {
  const { tenantId, guestId } = await resolveGuest(token);

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, tenantId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      vipStatus: true,
      loyaltyPoints: true,
      nationality: true,
    },
  });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  const reservations = await prisma.reservation.findMany({
    where: { tenantId, guestId, status: { in: ['confirmed', 'checked_in', 'checked_out'] } },
    select: {
      id: true,
      confirmationNumber: true,
      status: true,
      arrivalDate: true,
      departureDate: true,
      nights: true,
      adults: true,
      children: true,
      totalAmount: true,
      balance: true,
      property: { select: { name: true } },
    },
    orderBy: { arrivalDate: 'desc' },
    take: 50,
  });

  const stayRows = reservations.map((r) => ({
    confirmationNumber: r.confirmationNumber,
    status: r.status,
    propertyName: r.property.name,
    arrivalDate: r.arrivalDate,
    departureDate: r.departureDate,
    nights: r.nights,
    guests: r.adults + r.children,
    totalAmount: Number(r.totalAmount),
    balance: Number(r.balance),
  }));

  const completed = stayRows.filter((s) => s.status === 'checked_out');
  const stats = {
    totalStays: completed.length,
    totalNights: completed.reduce((s, x) => s + x.nights, 0),
    totalSpend: Math.round(completed.reduce((s, x) => s + x.totalAmount, 0) * 100) / 100,
    lastStayAt: completed[0]?.departureDate ?? null,
  };

  const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
    where: { tenantId, guestId },
    select: {
      type: true,
      amount: true,
      balance: true,
      description: true,
      source: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    guest: {
      firstName: guest.firstName,
      lastName: guest.lastName,
      vipStatus: guest.vipStatus,
      nationality: guest.nationality,
      loyaltyPoints: guest.loyaltyPoints,
    },
    upcoming: stayRows.filter((s) => s.status !== 'checked_out'),
    stays: stayRows.filter((s) => s.status === 'checked_out'),
    stats,
    loyalty: {
      points: guest.loyaltyPoints,
      recent: loyaltyTransactions,
    },
  };
}
