/* P10 — Room board read-model (addendum 5.3, slice #3).
 * S1 shape: rooms with state, validTransitions from the P5 room matrix,
 *    server-computed assignable, stats + arrivals/departures/stayovers cards.
 * S2 consistency: the EXISTING /housekeeping/rooms/:id/status endpoint is the
 *    enforcement authority — the suite PROBES which transitions it accepts
 *    (logging rejection bodies), then asserts the board reflects the new
 *    state and serves exactly the matrix transitions for that state.
 * S3 history: status events recorded by the transition endpoint appear in
 *    the drawer detail with from/to values.
 * S4 tenant isolation.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
const propCode =
  'P10' +
  runId
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-6);

let app: any;
let agent: any;
const ctx: Record<string, any> = {};

/** Mirrors the route's P5 matrix — the consistency target for S2. */
const HK_MATRIX: Record<string, string[]> = {
  dirty: ['in_progress'],
  in_progress: ['clean', 'dirty'],
  clean: ['inspected', 'dirty'],
  inspected: ['ready', 'dirty'],
  ready: ['dirty', 'inspected'],
};

const today = () => new Date().toISOString().slice(0, 10);

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  const t = await prisma.tenant.findUnique({ where: { id: agent.tenantId } });
  const prop = await prisma.property.create({
    data: { tenantId: t.id, name: 'P10 Board Hotel', code: propCode },
  });
  ctx.propertyId = prop.id;
  const rt = await prisma.roomType.create({
    data: { tenantId: t.id, propertyId: prop.id, name: 'P10 Type', code: 'P10RT' },
  });
  ctx.roomTypeId = rt.id;
  ctx.rooms = [];
  for (const num of ['P10-1', 'P10-2', 'P10-3']) {
    ctx.rooms.push(
      await prisma.room.create({
        data: { tenantId: t.id, propertyId: prop.id, roomTypeId: rt.id, number: num },
      })
    );
  }
  const g = await prisma.guest.create({
    data: {
      tenantId: t.id,
      firstName: 'P10',
      lastName: 'Guest',
      email: 'p10-' + runId + '@example.com',
    },
  });
  const res = await prisma.reservation.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      guestId: g.id,
      confirmationNumber: 'P10-STAY-' + runId.toUpperCase(),
      status: 'checked_in',
      arrivalDate: new Date(),
      departureDate: new Date(Date.now() + 2 * 86400_000),
      nights: 2,
      totalAmount: 2000,
      balance: 0,
    },
  });
  await prisma.reservationStay.create({
    data: { reservationId: res.id, roomId: ctx.rooms[0].id, date: new Date(), rate: 1000 },
  });
  await prisma.reservationStay.create({
    data: {
      reservationId: res.id,
      roomId: ctx.rooms[0].id,
      date: new Date(Date.now() + 86400_000),
      rate: 1000,
    },
  });
  console.log('P10 seeded', propCode);
}, 90000);

describe('P10 room board', () => {
  it('S1: aggregate shape, matrix transitions, assignable, cards', async () => {
    const res = await request(app)
      .get('/v1/room-board?propertyId=' + ctx.propertyId + '&date=' + today())
      .set('Authorization', 'Bearer ' + agent.token);
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.rooms.length).toBe(3);
    expect(d.stats.total).toBe(3);
    expect(d.stats.assignable).toBe(3);

    const r1 = d.rooms.find((r: any) => r.number === 'P10-1');
    expect(r1.assignable).toBe(true);
    expect(r1.occupant?.confirmationNumber).toContain('P10-STAY');
    const labels = r1.validTransitions.map((t: any) => t.label);
    expect(labels).toContain('Mark dirty');
    expect(labels).toContain('Re-inspect');
    expect(labels).toContain('Out of order');
    expect(r1.validTransitions.find((t: any) => t.to === 'ooo').reasonRequired).toBe(true);
    expect(d.rooms.find((r: any) => r.number === 'P10-2').occupant).toBeNull();

    expect(d.cards.stayovers).toBeGreaterThanOrEqual(1);
    console.log('P10 board OK', JSON.stringify(d.stats), JSON.stringify(d.cards));
  }, 60000);

  it('S2: enforcement endpoint drives state; board stays consistent with the matrix', async () => {
    const post = async (roomId: string, body: any) => {
      const r = await request(app)
        .post('/v1/housekeeping/rooms/' + roomId + '/status')
        .set('Authorization', 'Bearer ' + agent.token)
        .send(body);
      if (r.status >= 400) {
        console.log(
          'TRANSITION REJECTED',
          JSON.stringify(body),
          '->',
          r.status,
          JSON.stringify(r.body)
        );
      }
      return r;
    };

    // Enforcement contract: reason-less dirty must be rejected (locks the rule).
    const noReason = await post(ctx.rooms[1].id, {
      housekeepingStatus: 'dirty',
      note: 'no reason',
    });
    expect(noReason.status).toBe(400);
    expect(noReason.body?.error?.code).toBe('REASON_REQUIRED');

    let applied: string | null = null;
    for (const to of ['dirty', 'clean', 'inspected', 'in_progress']) {
      const r = await post(ctx.rooms[1].id, {
        housekeepingStatus: to,
        ...(to === 'dirty' ? { reason: 'p10 soil' } : { note: 'p10 probe' }),
      });
      if (r.status < 400) {
        applied = to;
        break;
      }
    }
    expect(
      applied,
      'enforcement endpoint must accept at least one HK transition from ready'
    ).toBeTruthy();

    let svcApplied: string | null = null;
    for (const to of ['oos', 'ooo']) {
      const r = await post(ctx.rooms[2].id, { serviceStatus: to, reason: 'leaking AC' });
      if (r.status < 400) {
        svcApplied = to;
        break;
      }
    }
    expect(svcApplied, 'enforcement endpoint must accept a service block with reason').toBeTruthy();
    ctx.svcApplied = svcApplied;

    const res = await request(app)
      .get('/v1/room-board?propertyId=' + ctx.propertyId + '&date=' + today())
      .set('Authorization', 'Bearer ' + agent.token);
    const d = res.body.data;

    const r2 = d.rooms.find((r: any) => r.number === 'P10-2');
    expect(r2.housekeepingStatus).toBe(applied);
    expect(r2.assignable).toBe(false);
    const hkServed = r2.validTransitions
      .filter((t: any) => t.field === 'housekeepingStatus')
      .map((t: any) => t.to);
    expect(hkServed).toEqual(HK_MATRIX[applied as string]);

    const r3 = d.rooms.find((r: any) => r.number === 'P10-3');
    expect(r3.serviceStatus).toBe(svcApplied);
    expect(r3.blocked).toBe(true);
    expect(r3.serviceReason).toBe('leaking AC');
    const svcServed = r3.validTransitions
      .filter((t: any) => t.field === 'serviceStatus')
      .map((t: any) => t.label);
    expect(svcServed).toEqual(['Return to service']);
    // Housekeeping transitions remain available during a service block —
    // housekeeping work continues while the room is OOS/OOO.
    expect(r3.housekeepingStatus).toBe('ready');

    expect(d.stats.assignable).toBe(1); // only room 1 (ready + active, occupied)
    expect(d.stats.blocked).toBe(1);
    console.log('P10 transitions OK — HK:', applied, 'service:', svcApplied);
  }, 60000);

  it('S3: history records from/to after transitions', async () => {
    const res = await request(app)
      .get('/v1/room-board/' + ctx.rooms[2].id)
      .set('Authorization', 'Bearer ' + agent.token);
    expect(res.status).toBe(200);
    const h = res.body.data.history;
    const evt = h.find((e: any) => e.field === 'serviceStatus' && e.to === ctx.svcApplied);
    expect(evt, 'a serviceStatus event must be recorded').toBeTruthy();
    expect(evt.from).toBe('active');
    expect(evt.reason).toBe('leaking AC');
    console.log('P10 history OK');
  }, 60000);

  it('S4: another tenant cannot read the board', async () => {
    const mod: any = await import('../helpers/server.js');
    const outsider = await mod.registerTestAgent(app);
    const res = await request(app)
      .get('/v1/room-board?propertyId=' + ctx.propertyId)
      .set('Authorization', 'Bearer ' + outsider.token);
    expect(res.status).toBe(400);
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
