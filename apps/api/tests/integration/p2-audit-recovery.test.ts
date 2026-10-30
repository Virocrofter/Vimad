import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// P2-B — Audit-trail live smokes (0.3) + offline recovery gate (A6)
const API = { reservations: '/v1/reservations' };
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-min-32-chars';
const prisma = new PrismaClient();

type Ctx = {
  app: any;
  runId: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  roomId: string;
  guestId: string;
  ownerId: string;
  token: string;
};
const ctx = {} as Ctx;
const day = (o: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + o);
  return d.toISOString().slice(0, 10);
};
const pickId = (b: any): string | undefined => b?.id ?? b?.data?.id;
const authed = (req: any) => req.set('Authorization', `Bearer ${ctx.token}`);

async function buildApp(): Promise<any> {
  const helpers = await import('../helpers/server');
  const fn = Object.values(helpers).find((v) => typeof v === 'function');
  const out: any = await (fn as any)();
  return out?.app ?? out?.server ?? out;
}

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

beforeAll(async () => {
  ctx.runId = `p2b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  ctx.app = await buildApp();
  const t = await prisma.tenant.create({ data: { name: 'P2B Tenant', slug: `${ctx.runId}-t` } });
  ctx.tenantId = t.id;
  const p = await prisma.property.create({
    data: {
      tenantId: t.id,
      name: 'P2B Prop',
      code: ctx.runId.slice(-8).toUpperCase(),
      timezone: 'UTC',
      currency: 'ZAR',
    },
  });
  ctx.propertyId = p.id;
  const rt = await prisma.roomType.create({
    data: {
      tenantId: t.id,
      propertyId: p.id,
      name: 'P2B Type',
      code: 'P2',
      baseOccupancy: 2,
      maxOccupancy: 2,
    },
  });
  ctx.roomTypeId = rt.id;
  const room = await prisma.room.create({
    data: { tenantId: t.id, propertyId: p.id, roomTypeId: rt.id, number: '101' },
  });
  ctx.roomId = room.id;
  const owner = await prisma.user.create({
    data: {
      tenantId: t.id,
      email: `${ctx.runId}@t.local`,
      firstName: 'P2',
      lastName: 'Owner',
      role: 'owner',
    },
  });
  ctx.ownerId = owner.id;
  const ownerRole = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  if (ownerRole)
    await prisma.roleAssignment.create({ data: { userId: owner.id, roleId: ownerRole.id } });
  const g = await prisma.guest.create({
    data: { tenantId: t.id, firstName: 'P2', lastName: 'Guest' },
  });
  ctx.guestId = g.id;
  ctx.token = jwt.sign({ userId: owner.id, tenantId: t.id, role: 'owner' }, JWT_SECRET, {
    expiresIn: '2h',
  });
}, 120_000);

afterAll(async () => {
  if (ctx.tenantId) await prisma.tenant.delete({ where: { id: ctx.tenantId } }).catch(() => {});
  await prisma.$disconnect();
});

const auditCount = (entityId: string, action: string) =>
  prisma.auditLog.count({
    where: { tenantId: ctx.tenantId, entity: 'reservation', entityId, action },
  });

// ─── P2-B1: audit attribution across the lifecycle ───
describe('P2-B1 audit-trail live smoke', () => {
  it('create/update/check-in/check-out/cancel each write exactly one row with the real actor', async () => {
    const mk = async (suffix: string, arr: string, dep: string, n: number) => {
      const r = await createRes(suffix, arr, dep, n);
      expect(r.status, `${suffix}: ${r.status} ${JSON.stringify(r.body)}`).toBeLessThan(300);
      return pickId(r.body)!;
    };

    const res1 = await mk('b1-main', day(40), day(42), 2);
    expect(await auditCount(res1, 'create')).toBe(1);

    const upd = await authed(request(ctx.app).patch(`${API.reservations}/${res1}`)).send({
      arrivalDate: day(41),
      departureDate: day(43),
    });
    expect(upd.status).toBeLessThan(300);
    expect(await auditCount(res1, 'update')).toBe(1);

    const ci = await authed(request(ctx.app).post(`${API.reservations}/${res1}/check-in`));
    expect(ci.status).toBeLessThan(300);
    expect(await auditCount(res1, 'checkin')).toBe(1);

    const co = await authed(request(ctx.app).post(`${API.reservations}/${res1}/check-out`));
    expect(co.status).toBeLessThan(300);
    expect(await auditCount(res1, 'checkout')).toBe(1);

    const res2 = await mk('b1-cancel', day(50), day(52), 2);
    const cx = await authed(request(ctx.app).post(`${API.reservations}/${res2}/cancel`)).send({
      reason: 'P2-B1',
    });
    expect(cx.status).toBeLessThan(300);
    expect(await auditCount(res2, 'cancel')).toBe(1);

    // actor attribution + tenant isolation on every row we just created
    const rows = await prisma.auditLog.findMany({
      where: { tenantId: ctx.tenantId, entity: 'reservation', entityId: { in: [res1, res2] } },
    });
    // res1: create+update+checkin+checkout = 4 ; res2: create+cancel = 2
    expect(rows.length).toBe(6);
    for (const row of rows) {
      expect(row.userId).toBe(ctx.ownerId);
      expect(row.tenantId).toBe(ctx.tenantId);
    }
  }, 120_000);
});

// ─── P2-B2: A6 — client loses the response mid check-in, then retries ───
describe('P2-B2 offline recovery (A6)', () => {
  it('check-in retry after a lost response → single transition, single audit row, clean 409', async () => {
    const r = await createRes('b2', day(55), day(57), 2);
    expect(r.status).toBeLessThan(300);
    const id = pickId(r.body)!;

    const first = await authed(request(ctx.app).post(`${API.reservations}/${id}/check-in`));
    expect(first.status).toBeLessThan(300);

    // The client's network dropped before the response arrived; it retries
    // the identical request.
    const retry = await authed(request(ctx.app).post(`${API.reservations}/${id}/check-in`));
    expect(retry.status).toBe(409);

    const row = await prisma.reservation.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe('checked_in');
    expect(row.checkedInAt).toBeTruthy();
    expect(await auditCount(id, 'checkin')).toBe(1);
  }, 60_000);
});

// ─── P2-B3: reservation-create replay is idempotent ───
describe('P2-B3 idempotent create replay', () => {
  it('re-POSTing the same Idempotency-Key returns the same reservation, never a duplicate', async () => {
    const key = `${ctx.runId}-replay`;
    const body = {
      guestId: ctx.guestId,
      propertyId: ctx.propertyId,
      roomId: ctx.roomId,
      arrivalDate: day(60),
      departureDate: day(61),
      nights: 1,
      adults: 1,
      source: 'direct',
    };
    const first = await authed(request(ctx.app).post(API.reservations))
      .set('Idempotency-Key', key)
      .send(body);
    expect(first.status).toBeLessThan(300);
    const id1 = pickId(first.body)!;

    const replay = await authed(request(ctx.app).post(API.reservations))
      .set('Idempotency-Key', key)
      .send(body);
    expect(replay.status).toBeLessThan(500);
    expect(pickId(replay.body)).toBe(id1);

    const dupes = await prisma.reservation.count({
      where: {
        guestId: ctx.guestId,
        propertyId: ctx.propertyId,
        arrivalDate: new Date(day(60)),
        departureDate: new Date(day(61)),
      },
    });
    expect(dupes).toBe(1);
    const stays = await prisma.reservationStay.count({ where: { reservationId: id1 } });
    expect(stays).toBe(1);
  }, 60_000);
});
