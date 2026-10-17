/* apps/api/src/modules/concierge/concierge.service.ts — T3
 * Live board of today's concierge work: transfers (TR1 trip states),
 * special requests, wake-up calls, restaurant/activity bookings, upsells,
 * gestures. Every fulfilment is one tap away from a folio charge.
 * Guest portal requests land here too (source = 'guest').
 */
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { AppError } from '../../common/errors.js';

// ─── Type & state vocabularies ───

export const CONCIERGE_TYPES = [
  'transfer',
  'special_request',
  'wake_up_call',
  'restaurant_booking',
  'activity_booking',
  'upsell',
  'gesture',
] as const;
export type ConciergeType = (typeof CONCIERGE_TYPES)[number];

// TR1 — transfer trip state machine
export const TRIP_STATUSES = [
  'requested',
  'confirmed',
  'assigned',
  'en_route',
  'completed',
  'cancelled',
] as const;

const TRIP_TRANSITIONS: Record<string, string[]> = {
  requested: ['confirmed', 'cancelled'],
  confirmed: ['assigned', 'cancelled'],
  assigned: ['en_route', 'cancelled'],
  en_route: ['completed'],
  completed: [],
  cancelled: [],
};

const ITEM_INCLUDE = {
  guest: { select: { id: true, firstName: true, lastName: true, vipStatus: true } },
  reservation: {
    select: { id: true, confirmationNumber: true, arrivalDate: true, departureDate: true },
  },
  room: { select: { id: true, number: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
} as const;

// ─── Local audit writer (direct prisma.auditLog — no cross-module API) ───

async function logAudit(
  tenantId: string,
  userId: string,
  action: string,
  entityId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog
    .create({
      data: {
        tenantId,
        userId,
        action,
        entity: 'concierge_item',
        entityId,
        metadata: metadata as object,
      },
    })
    .catch((err) => logger.warn({ err }, 'concierge audit log failed'));
}

// ─── Board ───

export async function getBoard(
  tenantId: string,
  date: string,
  propertyId?: string
): Promise<Record<string, unknown>> {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const scope = { tenantId, ...(propertyId ? { propertyId } : {}) };

  const [dueToday, overdueOpen] = await Promise.all([
    prisma.conciergeItem.findMany({
      where: {
        ...scope,
        status: { in: ['open', 'in_progress'] },
        OR: [
          // Scheduled today…
          { scheduledAt: { gte: dayStart, lt: dayEnd } },
          // …or never scheduled (manual items) — they belong on today's board
          { scheduledAt: null },
        ],
      },
      include: ITEM_INCLUDE,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.conciergeItem.findMany({
      where: {
        ...scope,
        status: { in: ['open', 'in_progress'] },
        scheduledAt: { lt: dayStart },
      },
      include: ITEM_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
      take: 50,
    }),
  ]);

  const group = (type: string) => dueToday.filter((i) => i.type === type);

  return {
    date,
    overdue: overdueOpen,
    counts: {
      total: dueToday.length,
      overdue: overdueOpen.length,
      postedValueMinor: dueToday.reduce((s, i) => s + (i.postedToFolio ? 0 : i.priceMinor), 0),
    },
    sections: {
      transfers: group('transfer'),
      specialRequests: group('special_request'),
      wakeUpCalls: group('wake_up_call'),
      bookings: [...group('restaurant_booking'), ...group('activity_booking')].sort((a, b) =>
        String(a.scheduledAt).localeCompare(String(b.scheduledAt))
      ),
      upsells: group('upsell'),
      gestures: group('gesture'),
    },
  };
}

// ─── CRUD ───

export async function createItem(
  tenantId: string,
  userId: string,
  input: Record<string, unknown>
): Promise<{ id: string }> {
  const type = input.type as ConciergeType;
  if (!CONCIERGE_TYPES.includes(type)) {
    throw new AppError(400, `Unknown concierge type "${type}"`, 'VALIDATION_ERROR');
  }

  // Resolve links for display convenience
  let guestId = (input.guestId as string | undefined) ?? null;
  let roomId = (input.roomId as string | undefined) ?? null;
  const reservationId = (input.reservationId as string | undefined) ?? null;

  if (reservationId) {
    const res = await prisma.reservation.findFirst({ where: { id: reservationId, tenantId } });
    if (!res) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
    guestId = guestId ?? res.guestId;
    const stay = await prisma.reservationStay.findFirst({
      where: { reservationId },
      orderBy: { date: 'asc' },
    });
    roomId = roomId ?? stay?.roomId ?? null;
  }

  const item = await prisma.conciergeItem.create({
    data: {
      tenantId,
      propertyId: input.propertyId as string,
      type,
      title: input.title as string,
      description: (input.description as string | undefined) ?? null,
      guestId,
      reservationId,
      roomId,
      assigneeId: (input.assigneeId as string | undefined) ?? null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt as string) : null,
      priceMinor: Math.max(0, Math.round(Number(input.priceMinor ?? 0))),
      currency: (input.currency as string | undefined) ?? 'ZAR',
      flightNumber: (input.flightNumber as string | undefined) ?? null,
      tripStatus:
        type === 'transfer' ? ((input.tripStatus as string | undefined) ?? 'requested') : null,
      dedupeKey: (input.dedupeKey as string | undefined) ?? null,
      source: (input.source as string | undefined) ?? 'manual',
      metadata: (input.metadata as object | undefined) ?? undefined,
    },
  });

  await logAudit(tenantId, userId, 'concierge.create', item.id, {
    title: item.title,
    type: item.type,
  });

  logger.info({ itemId: item.id, type }, 'concierge item created');
  return { id: item.id };
}

export async function updateItem(
  tenantId: string,
  userId: string,
  id: string,
  input: Record<string, unknown>
): Promise<void> {
  const existing = await prisma.conciergeItem.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError(404, 'Concierge item not found', 'NOT_FOUND');

  const patch: Record<string, unknown> = {};
  for (const key of ['title', 'description', 'assigneeId', 'flightNumber', 'currency'] as const) {
    if (input[key] !== undefined) patch[key] = input[key];
  }
  if (input.scheduledAt !== undefined)
    patch.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt as string) : null;
  if (input.priceMinor !== undefined)
    patch.priceMinor = Math.max(0, Math.round(Number(input.priceMinor)));
  if (input.status !== undefined) {
    if (!['open', 'in_progress', 'done', 'cancelled'].includes(input.status as string)) {
      throw new AppError(400, 'Invalid status', 'VALIDATION_ERROR');
    }
    patch.status = input.status;
    if (input.status === 'done') patch.completedAt = new Date();
  }

  // TR1 — trip state transition validation
  if (input.tripStatus !== undefined && existing.type === 'transfer') {
    const next = input.tripStatus as string;
    const allowed = TRIP_TRANSITIONS[existing.tripStatus ?? 'requested'] ?? [];
    if (!allowed.includes(next) && next !== existing.tripStatus) {
      throw new AppError(
        409,
        `Trip cannot move from "${existing.tripStatus}" to "${next}". Allowed: ${allowed.join(', ') || 'none'}`,
        'INVALID_TRANSITION'
      );
    }
    patch.tripStatus = next;
  }

  await prisma.conciergeItem.update({ where: { id }, data: patch });
  await logAudit(tenantId, userId, 'concierge.update', id, { patch });
}

// ─── One-tap folio posting (the revenue surface) ───

export async function postToFolio(
  tenantId: string,
  userId: string,
  id: string
): Promise<{ folioItemId: string; alreadyPosted: boolean }> {
  const item = await prisma.conciergeItem.findFirst({
    where: { id, tenantId },
    include: { reservation: { include: { folio: true } } },
  });
  if (!item) throw new AppError(404, 'Concierge item not found', 'NOT_FOUND');
  if (item.postedToFolio && item.folioItemId) {
    return { folioItemId: item.folioItemId, alreadyPosted: true };
  }
  if (item.priceMinor <= 0) {
    throw new AppError(400, 'Set a price before posting to the folio', 'NO_PRICE');
  }
  if (!item.reservation) {
    throw new AppError(
      409,
      'Item is not linked to a reservation — cannot post to folio',
      'NO_RESERVATION'
    );
  }

  const folio = item.reservation.folio;
  if (!folio) throw new AppError(404, 'No folio exists for this reservation', 'NO_FOLIO');

  const amount = item.priceMinor / 100;

  const folioItem = await prisma.$transaction(async (tx) => {
    const fi = await tx.folioItem.create({
      data: {
        folioId: folio.id,
        type: 'concierge',
        description: `[Concierge] ${item.title}`,
        amount,
        quantity: 1,
      },
    });

    await tx.folio.update({
      where: { id: folio.id },
      data: {
        totalCharges: { increment: amount },
        balance: { increment: amount },
      },
    });

    await tx.conciergeItem.update({
      where: { id: item.id },
      data: { postedToFolio: true, folioItemId: fi.id, postedAt: new Date() },
    });

    return fi;
  });

  await logAudit(tenantId, userId, 'concierge.post_to_folio', item.id, {
    folioItemId: folioItem.id,
    title: item.title,
    amount,
    folioId: folio.id,
  });

  logger.info(
    { itemId: item.id, folioItemId: folioItem.id, amount },
    'concierge charge posted to folio'
  );
  return { folioItemId: folioItem.id, alreadyPosted: false };
}

// ─── Guest portal requests (source = 'guest') ───
// tenantId + guestId come from the portal token claims — never from the body.

const GUEST_REQUEST_TYPES = [
  'wake_up_call',
  'restaurant_booking',
  'activity_booking',
  'special_request',
];

export async function createGuestRequest(
  tenantId: string,
  guestId: string,
  input: {
    type: string;
    title: string;
    description?: string;
    scheduledAt?: string;
  }
): Promise<{ id: string }> {
  if (!GUEST_REQUEST_TYPES.includes(input.type)) {
    throw new AppError(400, 'Unsupported request type', 'VALIDATION_ERROR');
  }

  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  // Attach to the guest's active stay so it lands on the right property/room
  const reservation = await prisma.reservation.findFirst({
    where: { tenantId, guestId: guest.id, status: 'checked_in' },
    orderBy: { arrivalDate: 'desc' },
  });
  const stay = reservation
    ? await prisma.reservationStay.findFirst({
        where: { reservationId: reservation.id },
        orderBy: { date: 'asc' },
      })
    : null;

  let propertyId = reservation?.propertyId ?? null;
  if (!propertyId) {
    const firstProperty = await prisma.property.findFirst({
      where: { tenantId },
      select: { id: true },
    });
    if (!firstProperty) throw new AppError(404, 'No property for this account', 'NOT_FOUND');
    propertyId = firstProperty.id;
  }

  const item = await prisma.conciergeItem.create({
    data: {
      tenantId,
      propertyId,
      type: input.type,
      title: input.title.slice(0, 200),
      description: input.description?.slice(0, 2000) ?? null,
      guestId: guest.id,
      reservationId: reservation?.id ?? null,
      roomId: stay?.roomId ?? null,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      priceMinor: 0,
      source: 'guest',
    },
  });

  logger.info(
    { itemId: item.id, guestId: guest.id, type: item.type },
    'guest concierge request created'
  );
  return { id: item.id };
}

export async function listGuestRequests(tenantId: string, guestId: string) {
  const guest = await prisma.guest.findFirst({ where: { id: guestId, tenantId } });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

  return prisma.conciergeItem.findMany({
    where: { tenantId, guestId: guest.id, source: 'guest' },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      status: true,
      scheduledAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
}

// ─── Generators (invoked by the tasks-queue worker, every 15 min) ───
// All writes are dedupe-keyed — the scanner can run forever and never
// double-fires, same guarantee as the T1 task rules.

export async function runConciergeGenerators(tenantId: string): Promise<void> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // 1. Special request on booking → route to concierge (next 48h arrivals with notes)
  const arrivingWithNotes = await prisma.reservation.findMany({
    where: {
      tenantId,
      status: { in: ['confirmed', 'checked_in'] },
      notes: { not: null },
      arrivalDate: { gte: todayStart, lte: in48h },
    },
    select: {
      id: true,
      propertyId: true,
      guestId: true,
      confirmationNumber: true,
      notes: true,
      guest: { select: { firstName: true, lastName: true } },
    },
    take: 100,
  });

  for (const r of arrivingWithNotes) {
    await prisma.conciergeItem
      .upsert({
        where: { tenantId_dedupeKey: { tenantId, dedupeKey: `sr-${r.id}` } },
        update: {},
        create: {
          tenantId,
          propertyId: r.propertyId,
          type: 'special_request',
          title: `Special request — ${r.guest.firstName} ${r.guest.lastName}`,
          description: r.notes,
          guestId: r.guestId,
          reservationId: r.id,
          source: 'rule',
          dedupeKey: `sr-${r.id}`,
        },
      })
      .catch(() => {});
  }

  // 2. Flight number → transfer confirm at T-24h (TR1 requested → confirmed)
  const dueTransfers = await prisma.conciergeItem.findMany({
    where: {
      tenantId,
      type: 'transfer',
      tripStatus: 'requested',
      reservation: { arrivalDate: { gte: now, lte: in24h } },
    },
    select: { id: true },
    take: 100,
  });
  for (const t of dueTransfers) {
    await prisma.conciergeItem
      .update({
        where: { id: t.id },
        data: { tripStatus: 'confirmed', status: 'in_progress' },
      })
      .catch(() => {});
  }

  // 3. Check-out day → transport-booking offer (upsell, one per stay)
  const departingToday = await prisma.reservation.findMany({
    where: {
      tenantId,
      status: 'checked_in',
      departureDate: { gte: todayStart, lt: todayEnd },
    },
    select: {
      id: true,
      propertyId: true,
      guestId: true,
      guest: { select: { firstName: true, lastName: true } },
    },
    take: 100,
  });

  for (const r of departingToday) {
    await prisma.conciergeItem
      .upsert({
        where: { tenantId_dedupeKey: { tenantId, dedupeKey: `transport-offer-${r.id}` } },
        update: {},
        create: {
          tenantId,
          propertyId: r.propertyId,
          type: 'upsell',
          title: `Transport booking offer — ${r.guest.firstName} ${r.guest.lastName}`,
          description: 'Guest checks out today. Offer airport transfer / onward transport.',
          guestId: r.guestId,
          reservationId: r.id,
          scheduledAt: todayEnd,
          source: 'rule',
          dedupeKey: `transport-offer-${r.id}`,
        },
      })
      .catch(() => {});
  }

  // 4. Birthday / anniversary flag → gesture task
  const birthdayGuests = await prisma.$queryRaw<
    { id: string; property_id: string; first_name: string; last_name: string }[]
  >`
    SELECT g.id, g."tenantId", g."firstName", g."lastName",
           (SELECT p.id FROM properties p WHERE p."tenantId" = g."tenantId" LIMIT 1) AS property_id
    FROM guests g
    WHERE g."tenantId" = ${tenantId}
      AND g."dateOfBirth" IS NOT NULL
      AND EXTRACT(MONTH FROM g."dateOfBirth") = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM g."dateOfBirth") = EXTRACT(DAY FROM CURRENT_DATE)
    LIMIT 50
  `;

  const year = now.getFullYear();
  for (const g of birthdayGuests) {
    if (!g.property_id) continue;
    await prisma.conciergeItem
      .upsert({
        where: { tenantId_dedupeKey: { tenantId, dedupeKey: `bday-${g.id}-${year}` } },
        update: {},
        create: {
          tenantId,
          propertyId: g.property_id,
          type: 'gesture',
          title: `Birthday gesture — ${g.first_name} ${g.last_name}`,
          description: 'Guest birthday today. Arrange a card / amenity / dessert gesture.',
          guestId: g.id,
          scheduledAt: todayEnd,
          source: 'rule',
          dedupeKey: `bday-${g.id}-${year}`,
        },
      })
      .catch(() => {});
  }

  logger.info(
    {
      tenantId,
      special: arrivingWithNotes.length,
      transfers: dueTransfers.length,
      offers: departingToday.length,
      birthdays: birthdayGuests.length,
    },
    'concierge generators ran'
  );
}
