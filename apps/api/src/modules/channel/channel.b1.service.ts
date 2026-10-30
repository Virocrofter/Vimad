/* apps/api/src/modules/channel/channel.b1.service.ts — B1 channel depth:
 * HMAC-signed OTA booking webhooks (replay-safe) + sub-60s availability push logging. */
import crypto from 'node:crypto';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const r2 = (n: number) => Math.round(n * 100) / 100;
const sod = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const dayMs = 86400000;

/* Canonical JSON — both sides (server + sender) sign this exact string. */
function stable(v: any): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  return (
    '{' +
    Object.keys(v)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + stable(v[k]))
      .join(',') +
    '}'
  );
}

export function verifySignature(secret: string, body: unknown, signature: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(stable(body)).digest();
  const given = Buffer.from(String(signature || ''), 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export async function intakeBooking(provider: string, body: Record<string, unknown>) {
  const b = body as any;
  const connection = await prisma.channelConnection.findFirst({
    where: { provider, hotelId: String(b.hotelId), status: 'active' },
  });
  if (!connection) throw new AppError(404, 'Unknown hotel/channel', 'NOT_FOUND');
  const externalRef = String(b.externalReference ?? '');

  // Replay safety: confirmationNumber carries the external reference (unique).
  const existing = await prisma.reservation.findFirst({
    where: { tenantId: connection.tenantId, confirmationNumber: externalRef },
  });
  if (existing) return { received: true, duplicate: true, reservationId: existing.id };

  const roomType = await prisma.roomType.findFirst({
    where: { propertyId: connection.propertyId, code: String(b.roomTypeCode) },
  });
  if (!roomType) throw new AppError(400, 'Unknown room type code', 'BAD_MAPPING');

  const arrival = sod(new Date(String(b.arrivalDate)));
  const departure = sod(new Date(String(b.departureDate)));
  const nights = Math.round((departure.getTime() - arrival.getTime()) / dayMs);
  if (!(nights > 0 && nights < 60))
    throw new AppError(400, 'invalid stay dates', 'VALIDATION_ERROR');

  // Per-night room assignment: no OOO/OOS, no stay that night, honor channel holds.
  const rooms = await prisma.room.findMany({
    where: { roomTypeId: roomType.id },
    select: { id: true, status: true, serviceStatus: true },
  });
  const saleableRooms = rooms.filter(
    (r) => !/ooo|out_?of_?order/i.test(r.status) && r.serviceStatus !== 'ooo'
  );
  const assigned: { roomId: string; date: Date }[] = [];
  for (let i = 0; i < nights; i++) {
    const date = new Date(arrival.getTime() + i * dayMs);
    const busy = new Set(
      (
        await prisma.reservationStay.findMany({
          where: { room: { roomTypeId: roomType.id }, date },
          select: { roomId: true },
        })
      ).map((s) => s.roomId)
    );
    const held = (
      await prisma.inventoryAllocation.findMany({
        where: { roomTypeId: roomType.id, date, status: 'active' },
        select: { quantity: true },
      })
    ).reduce((sum, a) => sum + a.quantity, 0);
    const freeRoom = saleableRooms.find((r) => !busy.has(r.id));
    const freeCount = saleableRooms.length - busy.size - held;
    if (!freeRoom || freeCount < 1) {
      throw new AppError(
        409,
        'no availability on ' + date.toISOString().slice(0, 10),
        'NO_AVAILABILITY'
      );
    }
    assigned.push({ roomId: freeRoom.id, date });
    busy.add(freeRoom.id);
  }

  const total = Number(b.totalAmount);
  const email = String(b.guest?.email ?? '').toLowerCase();
  let guest = email
    ? await prisma.guest.findFirst({ where: { tenantId: connection.tenantId, email } })
    : null;
  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        tenantId: connection.tenantId,
        firstName: String(b.guest?.firstName ?? 'Channel'),
        lastName: String(b.guest?.lastName ?? 'Guest'),
        email: email || null,
      },
    });
  }

  const nightly = r2(total / nights);
  const reservation = await prisma.reservation.create({
    data: {
      tenantId: connection.tenantId,
      propertyId: connection.propertyId,
      guestId: guest.id,
      roomTypeId: roomType.id,
      confirmationNumber: externalRef,
      status: 'confirmed',
      source: provider,
      arrivalDate: arrival,
      departureDate: departure,
      nights,
      adults: Number(b.adults ?? 2),
      children: Number(b.children ?? 0),
      totalAmount: total,
      balance: total,
      stays: { create: assigned.map((a) => ({ roomId: a.roomId, date: a.date, rate: nightly })) },
      folio: {
        create: {
          tenantId: connection.tenantId,
          totalCharges: total,
          totalPayments: 0,
          balance: total,
          items: {
            create: Array.from({ length: nights }).map((_, i) => ({
              type: 'room_charge',
              description: 'Room charge - Night ' + (i + 1) + ' (' + provider + ')',
              amount: nightly,
            })),
          },
        },
      },
    },
  });

  // Channel holds so the public engine sees the inventory drop immediately.
  for (const a of assigned) {
    await prisma.inventoryAllocation.upsert({
      where: {
        tenantId_dedupeKey: {
          tenantId: connection.tenantId,
          dedupeKey: externalRef + ':' + a.date.toISOString().slice(0, 10),
        },
      },
      update: { status: 'active' },
      create: {
        tenantId: connection.tenantId,
        propertyId: connection.propertyId,
        roomTypeId: roomType.id,
        date: a.date,
        type: 'channel',
        name: provider,
        quantity: 1,
        status: 'active',
        dedupeKey: externalRef + ':' + a.date.toISOString().slice(0, 10),
      },
    });
  }

  return { received: true, duplicate: false, reservationId: reservation.id };
}

export async function pushNow(tenantId: string, connectionId: string) {
  const started = Date.now();
  const connection = await prisma.channelConnection.findFirst({
    where: { id: connectionId, tenantId, status: 'active' },
  });
  if (!connection) throw new AppError(404, 'Channel connection not found', 'NOT_FOUND');
  const from = sod(new Date());
  const days = Array.from({ length: 3 }).map((_, i) => new Date(from.getTime() + i * dayMs));
  const roomTypes = await prisma.roomType.findMany({
    where: { propertyId: connection.propertyId },
    select: { id: true, code: true },
  });
  const availability: Record<string, unknown>[] = [];
  for (const rt of roomTypes) {
    const cells = [];
    for (const d of days) {
      const total = await prisma.room.count({ where: { roomTypeId: rt.id } });
      const ooo = await prisma.room.count({
        where: {
          roomTypeId: rt.id,
          OR: [{ status: { in: ['ooo', 'out_of_order'] } }, { serviceStatus: 'ooo' }],
        },
      });
      const occupied = await prisma.reservationStay.count({
        where: { room: { roomTypeId: rt.id }, date: d },
      });
      const held = (
        await prisma.inventoryAllocation.findMany({
          where: { roomTypeId: rt.id, date: d, status: 'active' },
          select: { quantity: true },
        })
      ).reduce((sum, a) => sum + a.quantity, 0);
      cells.push({
        date: d.toISOString().slice(0, 10),
        sellable: Math.max(total - ooo, 0),
        remaining: Math.max(total - ooo - occupied - held, 0),
      });
    }
    availability.push({ roomType: rt.code, cells });
  }
  const latencyMs = Date.now() - started;
  await prisma.channelPushLog.create({
    data: {
      tenantId,
      connectionId,
      payload: JSON.parse(JSON.stringify({ availability })),
      latencyMs,
      status: latencyMs < 60000 ? 'ok' : 'slow',
    },
  });
  return { availability, latencyMs, pushedTo: connection.provider };
}

export async function pushLog(tenantId: string, connectionId: string) {
  return prisma.channelPushLog.findMany({
    where: { tenantId, connectionId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
