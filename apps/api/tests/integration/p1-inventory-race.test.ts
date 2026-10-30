import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════ CONFIG ═══════════════════════════════
const API = {
  reservations: '/v1/reservations',
  login: '/auth/login',
};
const N_PARALLEL = 8;
const STRICT_CACHE = process.env.STRICT_CACHE !== '0'; // hard gate: mutations now refresh cache synchronously
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-min-32-chars';
const prisma = new PrismaClient();
// ═══════════════════════════════════════════════════════════════════════

type Ctx = {
  app: any;
  token: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  roomId: string;
  guestId: string;
  userId: string;
  arrival: string;
  departure: string;
  winnerId: string;
  r2Id: string;
  runId: string;
};

const ctx = {} as Ctx;
const day = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const pickId = (b: any): string | undefined =>
  b?.id ?? b?.data?.id ?? b?.reservation?.id ?? b?.data?.reservation?.id;

function authed(req: any) {
  return req.set('Authorization', `Bearer ${ctx.token}`);
}

async function buildApp(): Promise<any> {
  const helpers = await import('../helpers/server');
  const fn = Object.values(helpers).find((v) => typeof v === 'function');
  if (!fn) throw new Error('tests/helpers/server.ts exports no function');
  const out: any = await (fn as any)();
  return out?.app ?? out?.server ?? out;
}

async function getToken(app: any): Promise<string> {
  const res = await request(app)
    .post(API.login)
    .send({ email: 'admin@demo.com', password: 'admin123' });
  const tok = res.body?.token ?? res.body?.data?.token ?? res.body?.accessToken;
  if (res.status === 200 && tok) return tok;
  return jwt.sign(
    { userId: ctx.userId, tenantId: ctx.tenantId, role: 'Owner', email: 'admin@demo.com' },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

beforeAll(async () => {
  ctx.runId = `p1-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  ctx.app = await buildApp();

  const tenant = await prisma.tenant.create({
    data: { name: 'P1 Race Tenant', slug: `${ctx.runId}-t` },
  });
  ctx.tenantId = tenant.id;

  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      name: 'P1 Property',
      code: `${ctx.runId.slice(-8)}P`.toUpperCase(),
      timezone: 'UTC',
      currency: 'ZAR',
    },
  });
  ctx.propertyId = property.id;

  const roomType = await prisma.roomType.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      name: 'Last Room Type',
      code: 'LR',
      baseOccupancy: 2,
      maxOccupancy: 2,
    },
  });
  ctx.roomTypeId = roomType.id;

  const room = await prisma.room.create({
    data: { tenantId: tenant.id, propertyId: property.id, roomTypeId: roomType.id, number: '101' },
  });
  ctx.roomId = room.id; // exactly ONE sellable room — the whole point

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: `${ctx.runId}@test.local`,
      firstName: 'P1',
      lastName: 'Owner',
      role: 'owner',
    },
  });
  ctx.userId = user.id;
  const ownerRole = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  if (ownerRole)
    await prisma.roleAssignment.create({ data: { userId: user.id, roleId: ownerRole.id } });

  const guest = await prisma.guest.create({
    data: { tenantId: tenant.id, firstName: 'Race', lastName: 'Guest' },
  });
  ctx.guestId = guest.id;

  ctx.token = await getToken(ctx.app);
  ctx.arrival = day(10);
  ctx.departure = day(13); // 3 nights
}, 120_000);

afterAll(async () => {
  if (ctx.tenantId) await prisma.tenant.delete({ where: { id: ctx.tenantId } }); // cascades
  await prisma.$disconnect();
});

// NOTE: explicit roomId is required — roomType-only bookings write no
// reservation_stays rows at all (see createReservationInner).
const createRes = (suffix: string, arrival: string, departure: string, nights: number) =>
  authed(request(ctx.app).post(API.reservations))
    .set('Idempotency-Key', `${ctx.runId}-${suffix}`)
    .send({
      guestId: ctx.guestId,
      propertyId: ctx.propertyId,
      roomId: ctx.roomId,
      arrivalDate: arrival,
      departureDate: departure,
      nights,
      adults: 1,
      source: 'direct',
    });

// ─── P1-A1: Concurrent last-room booking ───
describe('P1-A1 concurrent last-room booking', () => {
  it('exactly 1 of N wins; N−1 rejected cleanly; no duplicate stay rows', async () => {
    const results = await Promise.all(
      Array.from({ length: N_PARALLEL }, (_, i) =>
        createRes(`a1-${i}`, ctx.arrival, ctx.departure, 3)
      )
    );
    const winners = results.filter((r) => r.status >= 200 && r.status < 300);
    const losers = results.filter((r) => !(r.status >= 200 && r.status < 300));

    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(N_PARALLEL - 1);
    losers.forEach((r) => {
      expect(r.status).toBeLessThan(500);
      expect([401, 403, 404]).not.toContain(r.status);
    });

    ctx.winnerId = pickId(winners[0].body)!;
    expect(ctx.winnerId).toBeTruthy();

    const stays = await prisma.reservationStay.findMany({ where: { roomId: ctx.roomId } });
    const dates = new Set(stays.map((s) => s.date.toISOString().slice(0, 10)));
    const expected = [ctx.arrival, day(11), day(12)];
    expect([...dates].sort()).toEqual(expected.sort());
    const grouped = await prisma.reservationStay.groupBy({
      by: ['date'],
      where: { roomId: ctx.roomId },
      _count: { _all: true },
    });
    grouped.forEach((g) => expect(g._count._all).toBe(1));
  }, 120_000);
});

// ─── P1-A2: Oversell visibility ───
describe('P1-A2 oversell visibility', () => {
  it('forced conflict surfaces as a visible error state, not silent corruption', async () => {
    const r = await createRes('a2-forced', ctx.arrival, ctx.departure, 3);
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.status).toBeLessThan(500);
    const msg = JSON.stringify(r.body?.error ?? r.body ?? '').toLowerCase();
    expect(msg).toMatch(/(conflict|occupied|availab|sold|unavailable|inventory)/);
  }, 60_000);
});

// ─── P1-A3: Inventory convergence ───
describe('P1-A3 inventory convergence', () => {
  it('sellable = rooms − stays − holds ± restrictions; cache matches recompute', async () => {
    for (const d of [ctx.arrival, day(11), day(12)]) {
      const totalRooms = await prisma.room.count({ where: { roomTypeId: ctx.roomTypeId } });
      const occupied = await prisma.reservationStay.count({
        where: { roomId: ctx.roomId, date: new Date(d) },
      });
      const holds = await prisma.inventoryAllocation.count({
        where: { roomTypeId: ctx.roomTypeId, date: new Date(d), status: 'active' },
      });
      const restriction = await prisma.inventoryRestriction.findUnique({
        where: { roomTypeId_date: { roomTypeId: ctx.roomTypeId, date: new Date(d) } },
      });
      const expectedSellable = totalRooms - occupied - holds + (restriction?.adjustment ?? 0);
      expect(expectedSellable).toBe(0); // 1 room, 1 stay → sold out

      const cache = await prisma.inventoryDailyCache.findUnique({
        where: {
          propertyId_roomTypeId_date: {
            propertyId: ctx.propertyId,
            roomTypeId: ctx.roomTypeId,
            date: new Date(d),
          },
        },
      });
      if (cache) {
        console.log(
          `A3 ${d}: recompute sellable=${expectedSellable} (total=${totalRooms} occ=${occupied} held=${holds} adj=${restriction?.adjustment ?? 0}) | cache=${JSON.stringify(cache)}`
        );
        expect(cache.remaining - cache.overbookingLimit).toBe(expectedSellable);
        expect(cache.remaining).toBe(cache.sellable + cache.overbookingLimit - cache.occupied);
      } else if (STRICT_CACHE) {
        throw new Error(`Cache row missing for ${d}`);
      }
    }
  }, 60_000);
});

// ─── P1-A4: Date-change race ───
describe('P1-A4 date-change race', () => {
  it('two simultaneous modifications → ≤1 wins, no overlapping stays', async () => {
    const r2res = await createRes('a4-r2', day(15), day(17), 2);
    expect(r2res.status).toBeLessThan(300);
    ctx.r2Id = pickId(r2res.body)!;

    // A: extend winner 10–13 → 10–16 (hits R2's 15) | B: extend R2 15–17 → 12–17 (hits winner's 12)
    const [a, b] = await Promise.all([
      authed(request(ctx.app).patch(`${API.reservations}/${ctx.winnerId}`)).send({
        arrivalDate: ctx.arrival,
        departureDate: day(16),
      }),
      authed(request(ctx.app).patch(`${API.reservations}/${ctx.r2Id}`)).send({
        arrivalDate: day(12),
        departureDate: day(17),
      }),
    ]);
    const okCount = [a, b].filter((r) => r.status >= 200 && r.status < 300).length;
    expect(okCount).toBeLessThanOrEqual(1); // they cannot BOTH win

    const stays = await prisma.reservationStay.findMany({
      where: { roomId: ctx.roomId, reservationId: { in: [ctx.winnerId, ctx.r2Id] } },
    });
    const perDate: Record<string, Set<string>> = {};
    for (const s of stays) {
      const k = s.date.toISOString().slice(0, 10);
      (perDate[k] ??= new Set()).add(s.reservationId);
    }
    for (const [d, set] of Object.entries(perDate)) {
      expect(set.size, `date ${d} has overlapping stays`).toBe(1);
    }
  }, 120_000);
});

// ─── P1-A4b: Concurrent individually-valid edits on the same reservation ───
describe('P1-A4b concurrent valid edits serialize', () => {
  it('two valid simultaneous date edits → coherent final state (no P2002 500, no lost nights)', async () => {
    const r3res = await createRes('a4b-r3', day(18), day(20), 2);
    expect(r3res.status).toBeLessThan(300);
    const r3Id = pickId(r3res.body)!;

    // Both extensions are individually valid: A adds night 20, B adds night 17.
    // Without the advisory lock, deleteMany/insert interleaving produced P2002 (500);
    // with it, both succeed and the final state must be coherent either way.
    const [a, b] = await Promise.all([
      authed(request(ctx.app).patch(`${API.reservations}/${r3Id}`)).send({
        arrivalDate: day(18),
        departureDate: day(21),
      }),
      authed(request(ctx.app).patch(`${API.reservations}/${r3Id}`)).send({
        arrivalDate: day(17),
        departureDate: day(20),
      }),
    ]);
    for (const r of [a, b]) {
      expect(r.status, `request failed: ${r.status} ${JSON.stringify(r.body)}`).toBeLessThan(500);
    }

    const res = await prisma.reservation.findUniqueOrThrow({ where: { id: r3Id } });
    const stays = await prisma.reservationStay.findMany({
      where: { reservationId: r3Id },
      orderBy: { date: 'asc' },
    });
    expect(stays).toHaveLength(res.nights);

    const arr = res.arrivalDate.toISOString().slice(0, 10);
    const dep = res.departureDate.toISOString().slice(0, 10);
    const expectedDates: string[] = [];
    for (
      let d = new Date(arr + 'T00:00:00Z');
      d.toISOString().slice(0, 10) < dep;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      expectedDates.push(d.toISOString().slice(0, 10));
    }
    expect(stays.map((s) => s.date.toISOString().slice(0, 10))).toEqual(expectedDates);

    const mine = new Set(stays.map((s) => s.date.toISOString().slice(0, 10)));
    const others = await prisma.reservationStay.findMany({
      where: {
        roomId: ctx.roomId,
        reservationId: { not: r3Id },
        reservation: { status: { in: ['confirmed', 'checked_in'] } },
      },
    });
    for (const o of others) {
      expect(
        mine.has(o.date.toISOString().slice(0, 10)),
        `overlap on ${o.date.toISOString().slice(0, 10)}`
      ).toBe(false);
    }
  }, 120_000);
});

// ─── P1-A5: Cancel release ───
describe('P1-A5 cancel releases the full stay range atomically', () => {
  it('cancellation removes ALL stay rows for the range; nights sellable again', async () => {
    const r = await authed(
      request(ctx.app).post(`${API.reservations}/${ctx.winnerId}/cancel`)
    ).send({ reason: 'P1-A5 test' });
    expect(r.status).toBeLessThan(300);

    const remaining = await prisma.reservationStay.count({
      where: { reservationId: ctx.winnerId },
    });
    expect(remaining).toBe(0); // no partial release

    const occupied = await prisma.reservationStay.findMany({
      where: { roomId: ctx.roomId },
      select: { date: true, reservationId: true },
    });
    expect(occupied.filter((o) => o.reservationId === ctx.winnerId)).toHaveLength(0);
    for (const d of [ctx.arrival, day(11), day(12)]) {
      const block = occupied.find((o) => o.date.toISOString().slice(0, 10) === d);
      expect(block, `night ${d} still blocked`).toBeUndefined();
    }
  }, 60_000);
});
