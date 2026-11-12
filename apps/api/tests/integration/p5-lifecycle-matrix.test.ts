/* P5 — canonical lifecycle/status matrix (roadmap ticket #9).
 * M0: matrix internal integrity (declared states, no orphan edges, terminals).
 * M1: drift lock — the status strings the codebase actually writes appear
 *     in the matrix (seed roster, payment.job.ts, ticket + T2 migrations).
 * M2: reservation lifecycle through the real API: public booking (confirmed)
 *     -> staff check-in (checked_in) -> check-out (checked_out), DB-verified.
 * M3: invalid transitions rejected: check-out before check-in, check-in of
 *     cancelled and of already-checked-out stays (addendum: no duplicate
 *     transitions).
 * M5/M6: addendum UX-01/UX-02 vocabulary present; payment axis matches the
 *     refund progression proven behaviorally by P3-A W2.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

vi.mock('../../src/common/paystack.js', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    initializeTransaction: async (_input: any) => {
      const core = {
        authorization_url: 'https://checkout.paystack.com/p5-fake',
        access_code: 'p5-fake',
        reference:
          'P5DEP-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      };
      return { status: true, message: 'ok', data: core, ...core };
    },
    ensurePaystackCustomer: async () => 'CUS_p5test',
    verifyTransaction: async () => ({ status: 'success', amount: 0, fees: 0 }) as any,
    fetchTransaction: async () => ({ status: 'success', amount_refunded: 0, fees: 0 }) as any,
  };
});

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
const propCode =
  'P5' +
  runId
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-6);

let app: any;
let agent: any;
let lc: any;
const ctx: Record<string, any> = {};

function todayPlus(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function bookStay(tag: string, inOffset = 0, nights = 1) {
  const email = 'p5-' + tag + '-' + runId + '@example.com';
  const res = await request(app)
    .post('/v1/public/properties/' + propCode + '/bookings')
    .send({
      checkIn: todayPlus(inOffset),
      checkOut: todayPlus(inOffset + nights),
      adults: 1,
      children: 0,
      roomTypeId: ctx.roomTypeId,
      guest: { firstName: 'P5', lastName: tag, email, phone: '+27123456789' },
    });
  expect(res.status).toBe(201);
  const guest = await prisma.guest.findFirst({ where: { email } });
  const reservation = await prisma.reservation.findFirst({
    where: { guestId: guest.id },
    orderBy: { createdAt: 'desc' },
  });
  return { reservation, email };
}

/* Probe candidate staff routes with the agent token; the codebase's exact
 * verb spelling is discovered, not assumed (webhook-saga lesson). */
async function tryStaffAction(id: string, action: string) {
  const candidates = [
    '/v1/reservations/' + id + '/' + action,
    '/v1/reservations/' + id + '/' + action.replace('-', ''),
  ];
  for (const c of candidates) {
    const res = await request(app)
      .post(c)
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ roomId: ctx.roomId });
    console.log('P5 probe', action, c, '->', res.status, JSON.stringify(res.body).slice(0, 120));
    if (res.status !== 404) return res;
  }
  return null;
}

beforeAll(async () => {
  process.env.PAYSTACK_SECRET_KEY = 'p3-pay-secret';
  process.env.PAYSTACK_WEBHOOK_SECRET = 'p3-pay-secret';

  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  lc = await import('../../src/common/lifecycle.js');

  const t = await prisma.tenant.findUnique({ where: { id: agent.tenantId } });
  const prop = await prisma.property.create({
    data: { tenantId: t.id, name: 'P5 Lifecycle Hotel', code: propCode },
  });
  const rt = await prisma.roomType.create({
    data: { tenantId: t.id, propertyId: prop.id, name: 'P5 Type', code: 'P5RT' },
  });
  const room = await prisma.room.create({
    data: { tenantId: t.id, propertyId: prop.id, roomTypeId: rt.id, number: 'P5-1' },
  });
  // M3 books two same-night stays while M2's room is still occupied — one
  // room would legitimately 409 SOLD_OUT on the second booking (the atomic
  // re-check working as designed), so the property needs two rooms.
  await prisma.room.create({
    data: { tenantId: t.id, propertyId: prop.id, roomTypeId: rt.id, number: 'P5-2' },
  });
  await prisma.ratePlan.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      roomTypeId: rt.id,
      name: 'P5 Rate',
      code: 'P5RATE',
      baseRate: 1000,
    },
  });
  ctx.roomTypeId = rt.id;
  ctx.roomId = room.id;
  console.log('P5 seeded', propCode, 'agent', agent.email);
}, 60000);

describe('P5 canonical lifecycle matrix', () => {
  it('M0 matrix integrity: edges reference declared states; terminals have no outgoing edges', () => {
    for (const def of Object.values<any>(lc.LIFECYCLE)) {
      for (const e of def.edges) {
        expect(def.states[e.from], def.domain + ' edge from ' + e.from).toBeTruthy();
        expect(def.states[e.to], def.domain + ' edge to ' + e.to).toBeTruthy();
        expect(
          def.states[e.from].terminal,
          def.domain + ' terminal ' + e.from + ' has outgoing edge to ' + e.to
        ).toBeFalsy();
      }
      expect(Object.keys(def.states).length).toBeGreaterThan(1);
    }
    expect(lc.canTransition('reservation', 'confirmed', 'checked_in')).toBe(true);
    expect(lc.canTransition('reservation', 'checked_out', 'confirmed')).toBe(false);
    expect(lc.nextStates('payment', 'success').sort()).toEqual(['partially_refunded', 'refunded']);
  });

  it('M1 drift lock: status strings written by the code exist in the matrix', () => {
    const read = (rel: string) =>
      fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
    const seed = read('../../prisma/seed.ts');
    for (const s of ['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']) {
      expect(seed, 'seed uses ' + s).toContain("'" + s + "'");
      expect(lc.isKnownState('reservation', s), 'matrix knows reservation:' + s).toBe(true);
    }
    const payjob = read('../../src/jobs/payment.job.ts');
    for (const s of ['success', 'refunded', 'partially_refunded']) {
      expect(payjob, 'payment.job.ts writes ' + s).toContain("'" + s + "'");
      expect(lc.isKnownState('payment', s), 'matrix knows payment:' + s).toBe(true);
    }
    const tickets = read(
      '../../prisma/migrations/20261017020000_add_support_tickets/migration.sql'
    );
    for (const s of ['open', 'in_progress', 'waiting_guest', 'resolved', 'closed']) {
      expect(tickets, 'ticket migration documents ' + s).toContain(s);
      expect(lc.isKnownState('ticket', s), 'matrix knows ticket:' + s).toBe(true);
    }
    const t2 = read('../../prisma/migrations/20261027193000_t2_hk_space_status/migration.sql');
    for (const s of ['clean', 'ready', 'dirty', 'inspected']) {
      expect(t2, 'T2 rules mention ' + s).toContain(s);
      expect(lc.isKnownState('roomHk', s), 'matrix knows roomHk:' + s).toBe(true);
    }
    const schema = read('../../prisma/schema.prisma');
    expect(schema).toContain('serviceStatus');
    expect(schema).toContain('closedAt');
  });

  it('M2 reservation lifecycle via real API: confirmed -> checked_in -> checked_out', async () => {
    const { reservation } = await bookStay('happy');
    expect(reservation.status).toBe('confirmed');
    ctx.confirmedId = reservation.id;

    const ci = await tryStaffAction(reservation.id, 'check-in');
    expect(ci, 'check-in route discovered').not.toBeNull();
    expect(ci!.status, 'check-in accepted').toBeGreaterThanOrEqual(200);
    expect(ci!.status).toBeLessThan(300);
    let r = await prisma.reservation.findUnique({ where: { id: reservation.id } });
    expect(r.status).toBe('checked_in');
    expect(r.checkedInAt).not.toBeNull();

    const co = await tryStaffAction(reservation.id, 'check-out');
    expect(co, 'check-out route discovered').not.toBeNull();
    expect(co!.status, 'check-out accepted').toBeGreaterThanOrEqual(200);
    expect(co!.status).toBeLessThan(300);
    r = await prisma.reservation.findUnique({ where: { id: reservation.id } });
    expect(r.status).toBe('checked_out');
    expect(r.checkedOutAt).not.toBeNull();
    console.log('P5 lifecycle: confirmed -> checked_in -> checked_out OK');
  }, 60000);

  it('M3 invalid transitions rejected (no duplicate/impossible transitions)', async () => {
    // check-out before check-in
    const a = await bookStay('earlyout');
    const co = await tryStaffAction(a.reservation.id, 'check-out');
    expect(co, 'check-out route exists').not.toBeNull();
    expect(co!.status).toBeGreaterThanOrEqual(400);
    expect(co!.status).toBeLessThan(500);

    // check-in of a cancelled stay
    // Future-dated stay: same-day arrival sits inside the property's
    // cancellation-policy window (public cancel 409s there — correct
    // product behavior); the invalid-transition case needs a cancellable stay.
    const b = await bookStay('cancelled', 3, 2);
    const cancel = await request(app).post('/v1/public/cancellations').send({
      confirmationNumber: b.reservation.confirmationNumber,
      email: b.email,
    });
    console.log('P5 cancel ->', cancel.status, JSON.stringify(cancel.body).slice(0, 200));
    expect(cancel.status).toBe(200);
    const ciCancelled = await tryStaffAction(b.reservation.id, 'check-in');
    expect(ciCancelled).not.toBeNull();
    expect(ciCancelled!.status).toBeGreaterThanOrEqual(400);
    expect(ciCancelled!.status).toBeLessThan(500);

    // check-in of an already-checked-out stay
    const ciAgain = await tryStaffAction(ctx.confirmedId, 'check-in');
    expect(ciAgain).not.toBeNull();
    expect(ciAgain!.status).toBeGreaterThanOrEqual(400);
    expect(ciAgain!.status).toBeLessThan(500);
  }, 90000);

  it('M5 addendum vocabulary reserved: Due Out view, Day Use, check-out reasons', () => {
    expect(lc.isKnownState('bookingType', 'overnight')).toBe(true);
    expect(lc.isKnownState('bookingType', 'day_use')).toBe(true);
    expect(lc.canTransition('bookingType', 'day_use', 'overnight')).toBe(true);
    expect(lc.CHECKOUT_REASONS).toContain('early_departure');
    expect(lc.CHECKOUT_REASONS).toContain('day_use_complete');
    expect(lc.STAY_VIEWS.dueOutToday).toContain('checked_in');
    expect(lc.STAY_VIEWS.checkedOut).toContain('checked_out');
  });

  it('M6 payment axis matches the refund progression proven by P3-A W2', () => {
    expect(lc.canTransition('payment', 'success', 'partially_refunded')).toBe(true);
    expect(lc.canTransition('payment', 'partially_refunded', 'partially_refunded')).toBe(true);
    expect(lc.canTransition('payment', 'partially_refunded', 'refunded')).toBe(true);
    expect(lc.canTransition('payment', 'refunded', 'success')).toBe(false);
    expect(lc.LIFECYCLE.payment.states.refunded.terminal).toBe(true);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
