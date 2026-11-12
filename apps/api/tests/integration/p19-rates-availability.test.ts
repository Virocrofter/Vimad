/* P19 — Rates availability route gate (mount repair).
 * Row shape (service contract): { roomType: {id,name,code},
 *   days: { 'YYYY-MM-DD': { total, booked, available } } }, envelope
 * { from, to, days, data }.
 * S1: 2 rooms of one type; in-range stay occupies 1 -> that night shows
 *     {total:2, booked:1, available:1}; a night with no stays shows
 *     available:2; the out-of-range stay never appears in any window.
 * S2: missing from/to -> 400; from > to -> 400 (service AppError).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
let app: any;
let agent: any;
const ctx: Record<string, any> = {};

const iso = (d: Date) => d.toISOString().slice(0, 10);

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  const t = agent.tenantId;

  const prop = await prisma.property.create({
    data: {
      tenantId: t,
      name: 'P19',
      code: ('P19' + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  const rt = await prisma.roomType.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      name: 'P19 RT',
      code: 'P19RT' + runId.toUpperCase().slice(-4),
    },
  });
  const rooms = await Promise.all(
    [1, 2].map((n) =>
      prisma.room.create({
        data: { tenantId: t, propertyId: prop.id, roomTypeId: rt.id, number: 'P19-' + n },
      })
    )
  );
  const guest = await prisma.guest.create({
    data: { tenantId: t, firstName: 'P19', lastName: 'Avail' },
  });

  const inRange = new Date(Date.now() + 2 * 86400_000);
  const outRange = new Date(Date.now() + 40 * 86400_000);
  const mkRes = (arr: Date, dep: Date, cn: string) =>
    prisma.reservation.create({
      data: {
        tenantId: t,
        propertyId: prop.id,
        guestId: guest.id,
        confirmationNumber: cn,
        status: 'checked_in',
        arrivalDate: arr,
        departureDate: dep,
        nights: 1,
        totalAmount: 100,
        balance: 0,
      },
    });

  const r1 = await mkRes(
    inRange,
    new Date(inRange.getTime() + 86400_000),
    'P19A-' + runId.toUpperCase()
  );
  await prisma.reservationStay.create({
    data: { reservationId: r1.id, roomId: rooms[0].id, date: inRange, rate: 100 },
  });
  const r2 = await mkRes(
    outRange,
    new Date(outRange.getTime() + 86400_000),
    'P19B-' + runId.toUpperCase()
  );
  await prisma.reservationStay.create({
    data: { reservationId: r2.id, roomId: rooms[1].id, date: outRange, rate: 100 },
  });

  ctx.t = t;
  ctx.rt = rt;
  ctx.in = iso(inRange);
  ctx.out = iso(outRange);
  console.log('P19 seeded');
}, 90000);

describe('P19 rates availability', () => {
  const H = () => ({ Authorization: 'Bearer ' + agent.token });

  it('S1: occupied night shows reduced availability; clean nights full; out-of-range excluded', async () => {
    const clean = new Date(Date.now() + 5 * 86400_000);
    const res = await request(app)
      .get('/v1/rates/availability')
      .set(H())
      .query({ from: ctx.in, to: iso(clean) });
    expect(res.status).toBe(200);

    const row = (res.body.data ?? []).find((r: any) => r.roomType?.id === ctx.rt.id);
    expect(row).toBeTruthy();
    expect(row.days[ctx.in]).toEqual({ total: 2, booked: 1, available: 1 });
    expect(row.days[iso(clean)]).toEqual({ total: 2, booked: 0, available: 2 });
    expect(row.days[ctx.out]).toBeUndefined();
    console.log('P19 S1 OK');
  }, 60000);

  it('S2: missing params and inverted range rejected', async () => {
    const missing = await request(app)
      .get('/v1/rates/availability')
      .set(H())
      .query({ from: ctx.in });
    expect(missing.status).toBe(400);

    const inverted = await request(app)
      .get('/v1/rates/availability')
      .set(H())
      .query({ from: ctx.out, to: ctx.in });
    expect(inverted.status).toBe(400);
    console.log('P19 S2 OK');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
