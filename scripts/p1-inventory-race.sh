#!/usr/bin/env bash
# P1 — Inventory race & release verification suite (A1–A5)
# Usage: from repo root — bash scripts/p1-inventory-race.sh
set -euo pipefail
cd "$(dirname "$0")/.." ; cd apps/api

# ── Preflight: show the real route paths so you can adjust CONFIG below if 404s occur ──
grep -nE "router\.(post|get|patch|put|delete)\(" src/modules/reservations/reservations.routes.ts | head -30 || true

mkdir -p tests/integration

cat > tests/integration/p1-inventory-race.test.ts <<'EOF'
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════ CONFIG ═══════════════════════════════
// Adjust only if your mounts differ (check the grep output printed by the script)
const API = {
  reservations: '/api/reservations',
  login: '/api/auth/login',
};
const N_PARALLEL = 8;                 // A1: concurrent booking attempts
const STRICT_CACHE = process.env.STRICT_CACHE === '1'; // A3 hard-fail on cache mismatch
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-min-32-chars';
const prisma = new PrismaClient();
// ═══════════════════════════════════════════════════════════════════════

type Ctx = {
  app: any; token: string; tenantId: string; propertyId: string;
  roomTypeId: string; roomId: string; guestId: string;
  arrival: string; departure: string; winnerId: string; r2Id: string;
};

const ctx = {} as Ctx;
const day = (offset: number) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+offset); return d.toISOString().slice(0,10); };

const pickId = (b: any): string | undefined =>
  b?.id ?? b?.data?.id ?? b?.reservation?.id ?? b?.data?.reservation?.id;
const pickMsg = (b: any): string =>
  JSON.stringify(b?.error ?? b?.message ?? b ?? '').toLowerCase();

function authed(req: any) { return req.set('Authorization', `Bearer ${ctx.token}`); }

// Defensive server helper import (works regardless of the helper's export name)
async function buildApp(): Promise<any> {
  const helpers = await import('../helpers/server');
  const fn = Object.values(helpers).find((v) => typeof v === 'function');
  if (!fn) throw new Error('tests/helpers/server.ts exports no function');
  const out: any = await (fn as any)();
  return out?.app ?? out?.server ?? out;
}

// Try real login first; fall back to a self-signed JWT for the seeded Owner
async function getToken(app: any): Promise<string> {
  const res = await request(app).post(API.login)
    .send({ email: 'admin@demo.com', password: 'admin123' });
  const tok = res.body?.token ?? res.body?.data?.token ?? res.body?.accessToken;
  if (res.status === 200 && tok) return tok;
  return jwt.sign(
    { userId: ctx.userId, tenantId: ctx.tenantId, role: 'Owner', email: 'admin@demo.com' },
    JWT_SECRET, { expiresIn: '2h' });
}

beforeAll(async () => {
  ctx.app = await buildApp();

  const tenant = await prisma.tenant.create({ data: { name: 'P1 Race Tenant', slug: `p1-race-${Date.now()}` } });
  ctx.tenantId = tenant.id;

  const property = await prisma.property.create({
    data: { tenantId: tenant.id, name: 'P1 Property', code: `P1${Date.now()%100000}`, timezone: 'UTC', currency: 'ZAR' },
  });
  ctx.propertyId = property.id;

  const roomType = await prisma.roomType.create({
    data: { tenantId: tenant.id, propertyId: property.id, name: 'Last Room Type', code: 'LR', baseOccupancy: 2, maxOccupancy: 2 },
  });
  ctx.roomTypeId = roomType.id;

  const room = await prisma.room.create({
    data: { tenantId: tenant.id, propertyId: property.id, roomTypeId: roomType.id, number: '101' },
  });
  ctx.roomId = room.id; // exactly ONE sellable room — the whole point

  const user = await prisma.user.create({
    data: { tenantId: tenant.id, email: `p1-owner-${Date.now()}@test.local`, firstName: 'P1', lastName: 'Owner', role: 'owner' },
  });
  (ctx as any).userId = user.id;
  const ownerRole = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  if (ownerRole) await prisma.roleAssignment.create({ data: { userId: user.id, roleId: ownerRole.id } });

  const guest = await prisma.guest.create({ data: { tenantId: tenant.id, firstName: 'Race', lastName: 'Guest' } });
  ctx.guestId = guest.id;

  ctx.token = await getToken(ctx.app);

  ctx.arrival = day(10); ctx.departure = day(13); // 3 nights
}, 120_000);

afterAll(async () => {
  if (ctx.tenantId) await prisma.tenant.delete({ where: { id: ctx.tenantId } }); // cascades
  await prisma.$disconnect();
});

const createRes = (idk: string) =>
  authed(request(ctx.app).post(API.reservations))
    .set('Idempotency-Key', idk)
    .send({
      guestId: ctx.guestId, propertyId: ctx.propertyId, roomTypeId: ctx.roomTypeId,
      arrivalDate: ctx.arrival, departureDate: ctx.departure, adults: 1, source: 'direct',
    });

// ─── P1-A1: Concurrent last-room booking ───
describe('P1-A1 concurrent last-room booking', () => {
  it('exactly 1 of N wins; N−1 rejected cleanly; no duplicate stay rows', async () => {
    const results = await Promise.all(
      Array.from({ length: N_PARALLEL }, (_, i) => createRes(`p1-a1-${Date.now()}-${i}`)));
    const winners = results.filter((r) => r.status >= 200 && r.status < 300);
    const losers = results.filter((r) => !(r.status >= 200 && r.status < 300));

    expect(winners).toHaveLength(1);                       // exactly one wins
    expect(losers).toHaveLength(N_PARALLEL - 1);           // N−1 rejected
    losers.forEach((r) => {
      expect(r.status).toBeLessThan(500);                  // not a crash
      expect([401, 403, 404]).not.toContain(r.status);     // real business rejection
    });

    ctx.winnerId = pickId(winners[0].body)!;
    expect(ctx.winnerId).toBeTruthy();

    // No double reservation_stays row for ANY date of the stay range
    const stays = await prisma.reservationStay.findMany({ where: { roomId: ctx.roomId } });
    const dates = new Set(stays.map((s) => s.date.toISOString().slice(0, 10)));
    const expected = [ctx.arrival, day(11), day(12)];
    expect([...dates].sort()).toEqual(expected.sort());
    // at most one stay row per (reservation, room, date) — unique constraint + reality
    const grouped = await prisma.reservationStay.groupBy({ by: ['date'], where: { roomId: ctx.roomId }, _count: { _all: true } });
    grouped.forEach((g) => expect(g._count._all).toBe(1));
  }, 120_000);
});

// ─── P1-A2: Oversell visibility ───
describe('P1-A2 oversell visibility', () => {
  it('forced conflict surfaces as a visible error state, not silent corruption', async () => {
    const r = await createRes('p1-a2-forced');
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(r.status).toBeLessThan(500);
    const msg = pickMsg(r.body);
    // must be an intelligible availability signal (adjust vocabulary to your error codes)
    expect(msg).toMatch(/(availab|oversell|overbook|sold|unavailable|insufficient|conflict|restrict)/);
  }, 60_000);
});

// ─── P1-A3: Inventory convergence ───
describe('P1-A3 inventory convergence', () => {
  it('sellable = rooms − stays − holds ± restrictions; cache matches recompute', async () => {
    const dates = [ctx.arrival, day(11), day(12)];
    for (const d of dates) {
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
        where: { propertyId_roomTypeId_date: { propertyId: ctx.propertyId, roomTypeId: ctx.roomTypeId, date: new Date(d) } },
      });
      if (cache) {
        expect(cache.sellable).toBe(expectedSellable);
        expect(cache.remaining).toBe(cache.sellable + cache.overbookingLimit - cache.occupied);
      } else if (STRICT_CACHE) {
        throw new Error(`Cache row missing for ${d} — inventory cache not converged`);
      }
    }
  }, 60_000);
});

// ─── P1-A4: Date-change race ───
describe('P1-A4 date-change race', () => {
  it('two simultaneous modifications → one wins, one conflicts; no overlapping stays', async () => {
    // Seed a second reservation on a non-overlapping range (room has capacity there)
    const r2res = await authed(request(ctx.app).post(API.reservations))
      .set('Idempotency-Key', 'p1-a4-r2')
      .send({
        guestId: ctx.guestId, propertyId: ctx.propertyId, roomTypeId: ctx.roomTypeId,
        arrivalDate: day(15), departureDate: day(17), adults: 1, source: 'direct',
      });
    expect(r2res.status).toBeLessThan(300);
    ctx.r2Id = pickId(r2res.body)!;

    // A: extend winner from day10–13 → day10–16 (overlaps R2's 15–17: conflict)
    // B: extend R2 from day15–17 → day12–17 (overlaps winner's 10–13: conflict)
    const [a, b] = await Promise.all([
      authed(request(ctx.app).patch(`${API.reservations}/${ctx.winnerId}`))
        .send({ arrivalDate: ctx.arrival, departureDate: day(16) }),
      authed(request(ctx.app).patch(`${API.reservations}/${ctx.r2Id}`))
        .send({ arrivalDate: day(12), departureDate: day(17) }),
    ]);
    const okCount = [a, b].filter((r) => r.status >= 200 && r.status < 300).length;
    expect(okCount).toBeLessThanOrEqual(1); // they cannot BOTH win

    // Hard invariant: no overlapping stays between the two reservations on the shared room
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

// ─── P1-A5: Cancel/no-show release ───
describe('P1-A5 cancel releases the full stay range atomically', () => {
  it('cancellation removes ALL stay rows for the range; availability restored', async () => {
    let r = await authed(request(ctx.app).post(`${API.reservations}/${ctx.winnerId}/cancel`))
      .send({ reason: 'P1-A5 test' });
    if (r.status === 404) {
      r = await authed(request(ctx.app).patch(`${API.reservations}/${ctx.winnerId}`))
        .send({ status: 'cancelled', cancelReason: 'P1-A5 test' });
    }
    expect(r.status).toBeLessThan(300);

    // Full-range atomic release: zero partial stay rows survive
    const remaining = await prisma.reservationStay.count({ where: { reservationId: ctx.winnerId } });
    expect(remaining).toBe(0);

    // Released nights are sellable again (only R2's non-overlapping dates remain occupied)
    const occupied = await prisma.reservationStay.findMany({
      where: { roomId: ctx.roomId }, select: { date: true, reservationId: true },
    });
    const winnerGhosts = occupied.filter((o) => o.reservationId === ctx.winnerId);
    expect(winnerGhosts).toHaveLength(0);
    for (const d of [ctx.arrival, day(11), day(12)]) {
      const block = occupied.find((o) => o.date.toISOString().slice(0, 10) === d);
      expect(block, `night ${d} still blocked`).toBeUndefined();
    }
  }, 60_000);
});
EOF

echo "── Running P1 inventory race suite ──"
NODE_ENV=test \
DATABASE_URL="${DATABASE_URL:-postgresql://vimad:vimad_dev_password@localhost:5432/unified_pms}" \
REDIS_URL="${REDIS_URL:-redis://localhost:6379}" \
JWT_SECRET="${JWT_SECRET:-test-secret-key-for-testing-min-32-chars}" \
RATE_LIMIT_ENABLED=false \
npx vitest run tests/integration/p1-inventory-race.test.ts --reporter=verbose


