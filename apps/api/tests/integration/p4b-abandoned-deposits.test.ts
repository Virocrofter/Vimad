/* P4b (part 1) — Abandoned-deposit sweep (E2x hardening).
 * S1: a pending web-deposit payment (>24h old) -> payment failed
 *    (abandoned_checkout) AND its confirmed reservation cancelled
 *    (deposit_abandoned). Fresh pending deposits untouched; pending
 *    payments that are NOT web deposits (reference does not end -deposit)
 *    untouched. Inventory is freed by cancellation (I1 counts live rows).
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

vi.mock('../../src/common/paystack.js', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    initializeTransaction: async (_input: any) => {
      const core = {
        authorization_url: 'https://checkout.paystack.com/p4b-fake-3ds',
        access_code: 'p4b-fake',
        reference:
          'P4BDEP-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      };
      return { status: true, message: 'Authorization created', data: core, ...core };
    },
    ensurePaystackCustomer: async () => 'CUS_p4btest',
    verifyTransaction: async () =>
      ({ status: 'success', amount: 0, fees: 0, currency: 'ZAR' }) as any,
    fetchTransaction: async () => ({ status: 'success', amount_refunded: 0, fees: 0 }) as any,
  };
});

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
let sweep: (now?: Date) => Promise<number>;
let app: any;

async function seedWebBooking(t: string, prefix: string, ageHours: number, refSuffix = '-deposit') {
  const prop = await prisma.property.create({
    data: {
      tenantId: t,
      name: 'P4b ' + prefix,
      code: ('P4B' + prefix + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  const rt = await prisma.roomType.create({
    data: { tenantId: t, propertyId: prop.id, name: 'P4b RT ' + prefix, code: 'RT' + prefix },
  });
  const room = await prisma.room.create({
    data: { tenantId: t, propertyId: prop.id, roomTypeId: rt.id, number: 'P4B-' + prefix },
  });
  const guest = await prisma.guest.create({
    data: {
      tenantId: t,
      firstName: 'P4b',
      lastName: prefix,
      email: 'p4b-' + prefix.toLowerCase() + '-' + runId + '@example.com',
    },
  });
  const res = await prisma.reservation.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      guestId: guest.id,
      confirmationNumber: 'P4B-' + prefix + '-' + runId.toUpperCase(),
      status: 'confirmed',
      arrivalDate: new Date(),
      departureDate: new Date(Date.now() + 86400_000),
      nights: 1,
      totalAmount: 1000,
      balance: 1000,
    },
  });
  const folio = await prisma.folio.create({ data: { tenantId: t, reservationId: res.id } });
  const pay = await prisma.payment.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      reservationId: res.id,
      guestId: guest.id,
      folioId: folio.id,
      reference: 'web-' + res.id + refSuffix,
      amountMinor: 5000,
      currency: 'ZAR',
      type: 'deposit',
      status: 'pending',
      createdAt: new Date(Date.now() - ageHours * 3600_000),
    },
  });
  return { tenantId: t, res, pay };
}

const ctx: Record<string, any> = {};

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  const job: any = await import('../../src/jobs/payment.job.js');
  sweep = job.sweepAbandonedDeposits;
  expect(typeof sweep).toBe('function');

  const agent = await mod.registerTestAgent(app);
  const tid = agent.tenantId;
  ctx.old = await seedWebBooking(tid, 'OLD', 25);
  ctx.fresh = await seedWebBooking(tid, 'FRESH', 1);
  ctx.desk = await seedWebBooking(tid, 'DESK', 25, '-manual');
  console.log('P4b seeded');
}, 120000);

describe('P4b abandoned-deposit sweep', () => {
  it('S1: stale web deposits swept; fresh and non-web untouched', async () => {
    const swept = await sweep();
    expect(swept).toBeGreaterThanOrEqual(1);

    const oldPay = await prisma.payment.findUnique({ where: { id: ctx.old.pay.id } });
    expect(oldPay.status).toBe('failed');
    expect(oldPay.failureReason).toBe('abandoned_checkout');
    const oldRes = await prisma.reservation.findUnique({ where: { id: ctx.old.res.id } });
    expect(oldRes.status).toBe('cancelled');
    expect(oldRes.cancelReason).toBe('deposit_abandoned');

    const freshPay = await prisma.payment.findUnique({ where: { id: ctx.fresh.pay.id } });
    expect(freshPay.status).toBe('pending');
    const freshRes = await prisma.reservation.findUnique({ where: { id: ctx.fresh.res.id } });
    expect(freshRes.status).toBe('confirmed');

    const deskPay = await prisma.payment.findUnique({ where: { id: ctx.desk.pay.id } });
    expect(deskPay.status).toBe('pending');
    console.log('P4b S1 OK — swept', swept);
  }, 60000);
  it('S2: same idempotency key replays one booking; distinct keys book twice', async () => {
    const t = await prisma.tenant.create({
      data: { name: 'P4b2 ' + runId, slug: 'p4b2-' + runId },
    });
    const prop = await prisma.property.create({
      data: {
        tenantId: t.id,
        name: 'P4b Bookable',
        code:
          'P4B2' +
          runId
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(-8),
      },
    });
    const rt = await prisma.roomType.create({
      data: { tenantId: t.id, propertyId: prop.id, name: 'P4b RT', code: 'P4B2RT' },
    });
    await prisma.room.create({
      data: { tenantId: t.id, propertyId: prop.id, roomTypeId: rt.id, number: 'P4B2-1' },
    });
    await prisma.room.create({
      data: { tenantId: t.id, propertyId: prop.id, roomTypeId: rt.id, number: 'P4B2-2' },
    });
    await prisma.ratePlan.create({
      data: {
        tenantId: t.id,
        propertyId: prop.id,
        roomTypeId: rt.id,
        name: 'P4b Rate',
        code: 'P4B2R',
        baseRate: 1000,
      },
    });
    const d = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const body = {
      checkIn: d(30),
      checkOut: d(32),
      adults: 2,
      children: 0,
      roomTypeId: rt.id,
      guest: {
        firstName: 'P4b',
        lastName: 'Dup',
        email: 'p4b2-' + runId + '@example.com',
        phone: '+27123456789',
      },
    };
    const key = 'p4b-dup-' + runId + '-' + crypto.randomUUID();
    const post = (k: string) =>
      request(app)
        .post('/v1/public/properties/' + prop.code + '/bookings')
        .set('idempotency-key', k)
        .send(body);

    const r1 = await post(key);
    expect(r1.status).toBe(201);
    const r2 = await post(key);
    expect(r2.status).toBe(201);
    expect(r2.body).toStrictEqual(r1.body); // replayed stored response, not a second booking

    const guest = await prisma.guest.findFirst({
      where: { tenantId: t.id, email: body.guest.email },
    });
    expect(await prisma.reservation.count({ where: { tenantId: t.id, guestId: guest.id } })).toBe(
      1
    );

    const r3 = await post('p4b-other-' + runId); // control: different key = new booking
    expect(r3.status).toBe(201);
    expect(r3.body).not.toStrictEqual(r1.body);
    expect(await prisma.reservation.count({ where: { tenantId: t.id, guestId: guest.id } })).toBe(
      2
    );
    console.log('P4b S2 OK');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
