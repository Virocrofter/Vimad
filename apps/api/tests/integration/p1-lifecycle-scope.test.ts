import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// ═══════════════════════════════ CONFIG ═══════════════════════════════
const API = {
  reservations: '/v1/reservations',
  users: '/v1/users',
  login: '/auth/login',
};
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-min-32-chars';
const prisma = new PrismaClient();
// ═══════════════════════════════════════════════════════════════════════

type Ctx = {
  app: any;
  runId: string;
  tenantA: string;
  propA1: string;
  propA2: string;
  tenantB: string;
  propB: string;
  roomTypeId: string;
  roomId: string;
  guestA: string;
  ownerId: string;
  tokenA: string;
  tokenStaff: string;
  tokenDisabled: string;
  disabledUserId: string;
  tokenScoped: string;
  scopedUserId: string;
  resRoom: string; // confirmed, room assigned (C1)
  noRoom1: string;
  noRoom2: string;
  noRoom3: string; // roomType-level (C2/C3)
  resB: string;
  resA2: string;
  confA2: string;
  confB: string;
};
const ctx = {} as Ctx;

const day = (o: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + o);
  return d.toISOString().slice(0, 10);
};
const pickId = (b: any): string | undefined => b?.id ?? b?.data?.id ?? b?.reservation?.id;
const authed = (t: string) => (req: any) => req.set('Authorization', `Bearer ${t}`);

async function buildApp(): Promise<any> {
  const helpers = await import('../helpers/server');
  const fn = Object.values(helpers).find((v) => typeof v === 'function');
  const out: any = await (fn as any)();
  return out?.app ?? out?.server ?? out;
}

async function login(app: any, email: string, password: string): Promise<string> {
  const r = await request(app).post(API.login).send({ email, password, tenantSlug: 'demo-hotel' });
  const tok = r.body?.token ?? r.body?.data?.token ?? r.body?.accessToken;
  if (r.status !== 200 || !tok)
    throw new Error(`login failed for ${email}: ${r.status} ${JSON.stringify(r.body)}`);
  return tok;
}

const createRes = (
  token: string,
  suffix: string,
  arrival: string,
  departure: string,
  nights: number,
  roomId?: string
) =>
  authed(token)(request(ctx.app).post(API.reservations))
    .set('Idempotency-Key', `${ctx.runId}-${suffix}`)
    .send({
      guestId: ctx.guestA,
      propertyId: ctx.propA1,
      ...(roomId ? { roomId } : { roomTypeId: ctx.roomTypeId }),
      arrivalDate: arrival,
      departureDate: departure,
      nights,
      adults: 1,
      source: 'direct',
    });

beforeAll(async () => {
  ctx.runId = `p1cd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  ctx.app = await buildApp();

  // ── Tenant A + property A1 (one room) ──
  const tA = await prisma.tenant.create({ data: { name: 'P1CD A', slug: `${ctx.runId}-a` } });
  ctx.tenantA = tA.id;
  const p1 = await prisma.property.create({
    data: {
      tenantId: tA.id,
      name: 'P1CD Prop A1',
      code: `${ctx.runId.slice(-6)}A`.toUpperCase(),
      timezone: 'UTC',
      currency: 'ZAR',
    },
  });
  ctx.propA1 = p1.id;
  const rt = await prisma.roomType.create({
    data: {
      tenantId: tA.id,
      propertyId: p1.id,
      name: 'CD Type',
      code: 'CD',
      baseOccupancy: 2,
      maxOccupancy: 2,
    },
  });
  ctx.roomTypeId = rt.id;
  const room = await prisma.room.create({
    data: { tenantId: tA.id, propertyId: p1.id, roomTypeId: rt.id, number: '101' },
  });
  ctx.roomId = room.id;

  // Owner in tenant A — JWT self-signed (middleware re-loads the user from DB)
  const owner = await prisma.user.create({
    data: {
      tenantId: tA.id,
      email: `${ctx.runId}@t.local`,
      firstName: 'P1',
      lastName: 'Owner',
      role: 'owner',
    },
  });
  ctx.ownerId = owner.id;
  const ownerRole = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  if (ownerRole)
    await prisma.roleAssignment.create({ data: { userId: owner.id, roleId: ownerRole.id } });
  ctx.tokenA = jwt.sign({ userId: owner.id, tenantId: tA.id, role: 'owner' }, JWT_SECRET, {
    expiresIn: '2h',
  });

  // Property-scoped Staff user (assigned to propA1 only) for D2/D4
  const scoped = await prisma.user.create({
    data: {
      tenantId: tA.id,
      email: `${ctx.runId}-s@t.local`,
      firstName: 'Scoped',
      lastName: 'Staff',
      role: 'staff',
    },
  });
  ctx.scopedUserId = scoped.id;
  const staffRole = await prisma.role.findFirst({ where: { name: 'Staff', tenantId: null } });
  if (staffRole)
    await prisma.roleAssignment.create({
      data: { userId: scoped.id, roleId: staffRole.id, propertyId: p1.id },
    });
  ctx.tokenScoped = jwt.sign({ userId: scoped.id, tenantId: tA.id, role: 'staff' }, JWT_SECRET, {
    expiresIn: '2h',
  });

  // A user we will disable mid-test (D5)
  const du = await prisma.user.create({
    data: {
      tenantId: tA.id,
      email: `${ctx.runId}-d@t.local`,
      firstName: 'Dis',
      lastName: 'Abled',
      role: 'staff',
    },
  });
  ctx.disabledUserId = du.id;
  ctx.tokenDisabled = jwt.sign({ userId: du.id, tenantId: tA.id, role: 'staff' }, JWT_SECRET, {
    expiresIn: '2h',
  });

  const g = await prisma.guest.create({
    data: { tenantId: tA.id, firstName: 'CD', lastName: 'Guest' },
  });
  ctx.guestA = g.id;

  // ── Property A2 (same tenant, for cross-property tests) ──
  const p2 = await prisma.property.create({
    data: {
      tenantId: tA.id,
      name: 'P1CD Prop A2',
      code: `${ctx.runId.slice(-6)}B`.toUpperCase(),
      timezone: 'UTC',
      currency: 'ZAR',
    },
  });
  ctx.propA2 = p2.id;
  const gA2 = await prisma.guest.create({
    data: { tenantId: tA.id, firstName: 'A2', lastName: 'Guest' },
  });
  const rA2 = await prisma.reservation.create({
    data: {
      tenantId: tA.id,
      propertyId: p2.id,
      guestId: gA2.id,
      confirmationNumber: `VMDCD-${ctx.runId.slice(-6)}-A2`,
      status: 'confirmed',
      arrivalDate: new Date(day(40)),
      departureDate: new Date(day(42)),
      nights: 2,
      adults: 1,
      totalAmount: 100,
      balance: 100,
    },
  });
  ctx.resA2 = rA2.id;
  ctx.confA2 = rA2.confirmationNumber;

  // ── Tenant B + reservation B (cross-tenant target) ──
  const tB = await prisma.tenant.create({ data: { name: 'P1CD B', slug: `${ctx.runId}-b` } });
  ctx.tenantB = tB.id;
  const pB = await prisma.property.create({
    data: {
      tenantId: tB.id,
      name: 'P1CD Prop B',
      code: `${ctx.runId.slice(-6)}C`.toUpperCase(),
      timezone: 'UTC',
      currency: 'ZAR',
    },
  });
  ctx.propB = pB.id;
  const gB = await prisma.guest.create({
    data: { tenantId: tB.id, firstName: 'B', lastName: 'Guest' },
  });
  const rB = await prisma.reservation.create({
    data: {
      tenantId: tB.id,
      propertyId: pB.id,
      guestId: gB.id,
      confirmationNumber: `VMDCD-${ctx.runId.slice(-6)}-B`,
      status: 'confirmed',
      arrivalDate: new Date(day(40)),
      departureDate: new Date(day(42)),
      nights: 2,
      adults: 1,
      totalAmount: 100,
      balance: 100,
    },
  });
  ctx.resB = rB.id;
  ctx.confB = rB.confirmationNumber;

  // ── Seed reservations for C-column ──
  const mk = async (suffix: string, arr: string, dep: string, n: number, roomId?: string) => {
    const r = await createRes(ctx.tokenA, suffix, arr, dep, n, roomId);
    expect(r.status, `${suffix}: ${r.status} ${JSON.stringify(r.body)}`).toBeLessThan(300);
    return pickId(r.body)!;
  };
  ctx.resRoom = await mk('c1', day(5), day(7), 2, ctx.roomId); // occupied 5,6
  ctx.noRoom1 = await mk('c2a', day(25), day(27), 2); // 25,26
  ctx.noRoom2 = await mk('c2b', day(26), day(28), 2); // 26,27 overlaps
  ctx.noRoom3 = await mk('c3', day(30), day(31), 1); // no room

  // Staff token from the seeded demo tenant (D3)
  ctx.tokenStaff = await login(ctx.app, 'frontdesk@demo.com', 'frontdesk123');
}, 120_000);

afterAll(async () => {
  for (const t of [ctx.tenantA, ctx.tenantB]) {
    if (t) await prisma.tenant.delete({ where: { id: t } }).catch(() => {});
  }
  await prisma.$disconnect();
});

// ─── P1-C1: Check-in double-submit ───
describe('P1-C1 check-in double-submit', () => {
  it('same check-in POSTed twice concurrently → one transition, one audit row', async () => {
    const [a, b] = await Promise.all([
      authed(ctx.tokenA)(request(ctx.app).post(`${API.reservations}/${ctx.resRoom}/check-in`)),
      authed(ctx.tokenA)(request(ctx.app).post(`${API.reservations}/${ctx.resRoom}/check-in`)),
    ]);
    const oks = [a, b].filter((r) => r.status >= 200 && r.status < 300);
    expect(oks, `statuses ${a.status}/${b.status}`).toHaveLength(1);
    const rej = [a, b].find((r) => !(r.status >= 200 && r.status < 300))!;
    expect(rej.status).toBe(409);

    const res = await prisma.reservation.findUniqueOrThrow({ where: { id: ctx.resRoom } });
    expect(res.status).toBe('checked_in');
    expect(res.checkedInAt).toBeTruthy();
    const auditRows = await prisma.auditLog.count({
      where: { entity: 'reservation', entityId: ctx.resRoom, action: 'checkin' },
    });
    expect(auditRows).toBe(1);
  }, 60_000);
});

// ─── P1-C2: Room assignment conflict ───
describe('P1-C2 room assignment conflict', () => {
  it('assigning room 101 to two overlapping stays → second rejected', async () => {
    const first = await authed(ctx.tokenA)(
      request(ctx.app).post(`${API.reservations}/${ctx.noRoom1}/assign-room`)
    ).send({ roomId: ctx.roomId });
    expect(first.status, JSON.stringify(first.body)).toBeLessThan(300);

    const second = await authed(ctx.tokenA)(
      request(ctx.app).post(`${API.reservations}/${ctx.noRoom2}/assign-room`)
    ).send({ roomId: ctx.roomId });
    expect(second.status).toBeGreaterThanOrEqual(400);
    expect(second.status).toBeLessThan(500);

    // DB truth: only noRoom1 occupies 26
    const on26 = await prisma.reservationStay.findMany({
      where: { roomId: ctx.roomId, date: new Date(day(26)) },
      select: { reservationId: true },
    });
    expect(on26.map((s) => s.reservationId)).toEqual([ctx.noRoom1]);
  }, 60_000);
});

// ─── P1-C3: Invalid transitions blocked ───
describe('P1-C3 invalid transitions blocked', () => {
  it('check-in without a room → 409', async () => {
    const r = await authed(ctx.tokenA)(
      request(ctx.app).post(`${API.reservations}/${ctx.noRoom3}/check-in`)
    );
    expect(r.status).toBe(409);
  }, 60_000);

  it('assigning an out-of-order room → rejected', async () => {
    await prisma.room.update({
      where: { id: ctx.roomId },
      data: { serviceStatus: 'out_of_order' },
    });
    await prisma.roomBlock
      .create({
        data: {
          tenantId: ctx.tenantA,
          propertyId: ctx.propA1,
          roomId: ctx.roomId,
          type: 'ooo',
          status: 'active',
          reason: 'P1-C3 test',
          startDate: new Date(day(29)),
          endDate: new Date(day(35)),
        },
      })
      .catch(() => {});
    const r = await authed(ctx.tokenA)(
      request(ctx.app).post(`${API.reservations}/${ctx.noRoom3}/assign-room`)
    ).send({ roomId: ctx.roomId });
    await prisma.room.update({ where: { id: ctx.roomId }, data: { serviceStatus: 'active' } });
    expect(
      r.status,
      `assign to OOO room returned ${r.status}: ${JSON.stringify(r.body)}`
    ).toBeGreaterThanOrEqual(400);
    expect(r.status).toBeLessThan(500);
  }, 60_000);
});

// ─── P1-D1: Cross-tenant read blocked ───
describe('P1-D1 cross-tenant read blocked', () => {
  it('tenant A token reading tenant B reservation by ID → 404/403, no data', async () => {
    const r = await authed(ctx.tokenA)(request(ctx.app).get(`${API.reservations}/${ctx.resB}`));
    expect([403, 404]).toContain(r.status);
    expect(JSON.stringify(r.body)).not.toContain(ctx.confB);
  }, 60_000);
});

// ─── P1-D2: Cross-property isolation ───
describe('P1-D2 cross-property isolation', () => {
  it('property-scoped user blocked from another property by ID (404, no leak)', async () => {
    const r = await authed(ctx.tokenScoped)(
      request(ctx.app).get(`${API.reservations}/${ctx.resA2}`)
    );
    expect([403, 404]).toContain(r.status);
    expect(JSON.stringify(r.body)).not.toContain(ctx.confA2);
  }, 60_000);

  it('global Owner retains cross-property access (intended semantics)', async () => {
    const r = await authed(ctx.tokenA)(request(ctx.app).get(`${API.reservations}/${ctx.resA2}`));
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).toContain(ctx.confA2);
  }, 60_000);
});

// ─── P1-D3: Role enforcement ───
describe('P1-D3 role enforcement', () => {
  it('Staff token attempting user create → 403', async () => {
    const r = await authed(ctx.tokenStaff)(request(ctx.app).post(API.users)).send({
      email: `${ctx.runId}-x@demo.com`,
      firstName: 'X',
      lastName: 'Y',
      role: 'staff',
    });
    expect(r.status).toBe(403);
  }, 60_000);
});

// ─── P1-D4: Leak surfaces swept ───
describe('P1-D4 list/search respect property scope', () => {
  it('global owner: propertyId-filtered list returns only that property', async () => {
    const list = await authed(ctx.tokenA)(
      request(ctx.app).get(`${API.reservations}?propertyId=${ctx.propA1}&pageSize=100`)
    );
    expect(list.status).toBe(200);
    const items =
      [list.body?.items, list.body?.data?.items, list.body?.data].find(Array.isArray) ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(it.propertyId ?? it.property?.id).toBe(ctx.propA1);
    }
  }, 60_000);

  it('scoped user: unfiltered list and cross-property search stay inside their property', async () => {
    const list = await authed(ctx.tokenScoped)(
      request(ctx.app).get(`${API.reservations}?pageSize=100`)
    );
    expect(list.status).toBe(200);
    const items =
      [list.body?.items, list.body?.data?.items, list.body?.data].find(Array.isArray) ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      expect(it.propertyId ?? it.property?.id).toBe(ctx.propA1);
    }
    const search = await authed(ctx.tokenScoped)(
      request(ctx.app).get(`${API.reservations}?search=${encodeURIComponent(ctx.confA2)}`)
    );
    const hits =
      [search.body?.items, search.body?.data?.items, search.body?.data].find(Array.isArray) ?? [];
    const leaked = hits.filter(
      (h: any) =>
        (h.id ?? h.confirmationNumber) === ctx.resA2 || h.confirmationNumber === ctx.confA2
    );
    expect(leaked).toHaveLength(0);
  }, 60_000);
});

// ─── P1-D5: Revoked access ───
describe('P1-D5 revoked access', () => {
  it("disabled user's token stops working immediately", async () => {
    await prisma.user.update({ where: { id: ctx.disabledUserId }, data: { status: 'disabled' } });
    const r = await authed(ctx.tokenDisabled)(
      request(ctx.app).get(`${API.reservations}?pageSize=1`)
    );
    expect([401, 403]).toContain(r.status);
  }, 60_000);
});
