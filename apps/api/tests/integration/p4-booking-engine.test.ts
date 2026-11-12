/* P4 — booking engine end-to-end verification (roadmap E2/E2x).
 * Walks the public funnel: property header -> availability (inventory layer)
 * -> booking (atomic re-check + advisory lock, race-tested live) -> deposit
 * payment -> signed charge.success x2 -> folio posting idempotency -> public
 * cancellation by confirmation number + email.
 * Live Paystack 3DS redirect stays blocked without test keys (B7).
 * Mocked seams (no network): initializeTransaction, ensurePaystackCustomer,
 * fetchTransaction. Everything else runs real code.
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
      // Hybrid shape: covers both `res.reference` and `res.data.reference`
      // access patterns in initializePayment.
      const core = {
        authorization_url: 'https://checkout.paystack.com/p4-fake-3ds-page',
        access_code: 'p4-fake',
        reference:
          'P4DEP-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      };
      return { status: true, message: 'Authorization created', data: core, ...core };
    },
    ensurePaystackCustomer: async (_email: string, _name?: string) => 'CUS_p4test',
    verifyTransaction: async (_reference: string) =>
      ({ status: 'success', amount: 0, fees: 0, currency: 'ZAR' }) as any,
    fetchTransaction: async (_id: number) =>
      ({ status: 'success', amount_refunded: 0, fees: 0 }) as any,
  };
});

const prisma: any = new PrismaClient();
const SECRET = 'p3-pay-secret';
const runId = Date.now().toString(36);
const propCode =
  'P4' +
  runId
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-6);

let app: any;
let paymentWorker: any;
let webhookPath = '';
const ctx: Record<string, any> = {};

function sign(raw: string, secret: string = SECRET): string {
  return crypto.createHmac('sha512', secret).update(raw).digest('hex');
}

const chargePayload = (reference: string, amountMinor: number) => ({
  event: 'charge.success',
  data: {
    id: 9000001,
    transaction_id: 9000001,
    reference,
    status: 'success',
    amount: amountMinor,
    fees: 0,
    currency: 'ZAR',
    channel: 'card',
    paid_at: Math.floor(Date.now() / 1000),
    customer: { email: 'p4-guest@example.com' },
    metadata: { reference },
  },
});

async function sendWebhook(raw: string, secret: string = SECRET) {
  return request(app)
    .post(webhookPath)
    .set('x-paystack-signature', sign(raw, secret))
    .set('Content-Type', 'application/json')
    .send(raw);
}

async function waitFor(fn: () => Promise<boolean>, ms = 25000): Promise<void> {
  const start = Date.now();
  for (;;) {
    if (await fn()) return;
    if (Date.now() - start > ms) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, 150));
  }
}

const bookingBody = (over: Record<string, any> = {}) => ({
  checkIn: ctx.inA,
  checkOut: ctx.outA,
  adults: 2,
  children: 0,
  roomTypeId: ctx.typeA,
  guest: {
    firstName: 'P4',
    lastName: 'Guest',
    email: `p4-${runId}@example.com`,
    phone: '+27123456789',
  },
  ...over,
});

beforeAll(async () => {
  for (const k of ['PAYSTACK_SECRET_KEY', 'PAYSTACK_SECRET', 'PAYSTACK_WEBHOOK_SECRET']) {
    process.env[k] = SECRET;
  }

  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app ?? mod.server;
  const job: any = await import('../../src/jobs/payment.job.js');
  paymentWorker = job.paymentWorker;

  // Webhook path — verified live in the P3-A round; probe it once to confirm.
  webhookPath = '/v1/payments/webhook';
  const probeRaw = JSON.stringify(chargePayload('P4PAY-PROBE-' + runId, 1000));
  const probe = await request(app)
    .post(webhookPath)
    .set('x-paystack-signature', sign(probeRaw, 'wrong-secret'))
    .set('Content-Type', 'application/json')
    .send(probeRaw);
  console.log('P4 probe', webhookPath, '->', probe.status, JSON.stringify(probe.body));
  if (!(probe.status === 401 && JSON.stringify(probe.body).includes('signature'))) {
    throw new Error('webhook route probe failed: ' + JSON.stringify(probe.body));
  }

  // Seed isolated property: two room types, ONE room each (B4 races type B).
  const t = await prisma.tenant.create({
    data: { name: `P4 ${runId}`, slug: `p4-${runId}` },
  });
  const prop = await prisma.property.create({
    data: { tenantId: t.id, name: 'P4 Beach Hotel', code: propCode },
  });
  const mkType = async (tag: string, name: string) => {
    const rt = await prisma.roomType.create({
      data: { tenantId: t.id, propertyId: prop.id, name, code: `P4${tag}` },
    });
    await prisma.room.create({
      data: { tenantId: t.id, propertyId: prop.id, roomTypeId: rt.id, number: `${tag}1` },
    });
    await prisma.ratePlan.create({
      data: {
        tenantId: t.id,
        propertyId: prop.id,
        roomTypeId: rt.id,
        name: `P4 Rate ${tag}`,
        code: `P4R${tag}`,
        baseRate: 1000,
      },
    });
    return rt.id;
  };
  ctx.tenantId = t.id;
  ctx.propertyId = prop.id;
  ctx.typeA = await mkType('A', 'P4 Deluxe A');
  ctx.typeB = await mkType('B', 'P4 Deluxe B');
  const d = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  ctx.inA = d(10);
  ctx.outA = d(12);
  ctx.inB = d(10);
  ctx.outB = d(12);
  ctx.inSold = d(20);
  ctx.outSold = d(23);
  ctx.soldDate = d(21);
  console.log('P4 seeded property', propCode);
}, 60000);

describe('P4 booking engine end-to-end', () => {
  it('B0 property header is publicly readable', async () => {
    const res = await request(app).get(`/v1/public/properties/${propCode}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toContain('P4 Beach Hotel');
  });

  it('B1 availability lists the room type with a nightly rate', async () => {
    const res = await request(app).get(
      `/v1/public/properties/${propCode}/availability?checkIn=${ctx.inA}&checkOut=${ctx.outA}&adults=2`
    );
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).toContain('P4 Deluxe A');
    expect(body).toContain('1000');
  });

  it('B2 inventory layer blocks booking a stop-sold date (409, not 500)', async () => {
    await prisma.inventoryRestriction.create({
      data: {
        tenantId: ctx.tenantId,
        propertyId: ctx.propertyId,
        roomTypeId: ctx.typeA,
        date: new Date(ctx.soldDate),
        stopSell: true,
      },
    });
    const res = await request(app)
      .post(`/v1/public/properties/${propCode}/bookings`)
      .send(
        bookingBody({
          checkIn: ctx.inSold,
          checkOut: ctx.outSold,
          guest: {
            firstName: 'P4',
            lastName: 'SoldOut',
            email: `p4-sold-${runId}@example.com`,
            phone: '+27123456789',
          },
        })
      );
    expect(res.status).toBe(409);
    expect(JSON.stringify(res.body)).toContain('SOLD_OUT');
  });

  it('B3 booking creates guest + reservation + deposit payment atomically', async () => {
    const res = await request(app)
      .post(`/v1/public/properties/${propCode}/bookings`)
      .send(bookingBody());
    expect(res.status).toBe(201);

    const guest = await prisma.guest.findFirst({
      where: { tenantId: ctx.tenantId, email: `p4-${runId}@example.com` },
    });
    expect(guest).not.toBeNull();
    const reservation = await prisma.reservation.findFirst({
      where: { tenantId: ctx.tenantId, guestId: guest.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(reservation).not.toBeNull();
    expect(reservation.nights).toBe(2);
    expect(reservation.notes).toContain('[WEB]');
    ctx.reservationId = reservation.id;
    ctx.confirmationNumber = reservation.confirmationNumber;

    const deposit = await prisma.payment.findFirst({
      where: { reservationId: reservation.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(deposit).not.toBeNull();
    expect(deposit.amountMinor).toBeGreaterThan(0);
    ctx.depRef = deposit.reference;
    ctx.depMinor = deposit.amountMinor;
    console.log('P4 deposit', ctx.depRef, ctx.depMinor, 'res', ctx.confirmationNumber);
  });

  it('B4 concurrent bookings for the last room: exactly one wins (advisory lock)', async () => {
    const race = (email: string) =>
      request(app)
        .post(`/v1/public/properties/${propCode}/bookings`)
        .send(
          bookingBody({
            roomTypeId: ctx.typeB,
            guest: { firstName: 'P4', lastName: 'Race', email, phone: '+27123456789' },
          })
        );
    const email = `p4-race-${runId}@example.com`;
    const [r1, r2] = await Promise.all([race(email), race(email)]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 409]);
    const guest = await prisma.guest.findFirst({
      where: { tenantId: ctx.tenantId, email },
    });
    const count = await prisma.reservation.count({
      where: { tenantId: ctx.tenantId, guestId: guest.id },
    });
    expect(count).toBe(1);
  });

  it('B5 deposit webhook posts to the folio exactly once (duplicate callback idempotent)', async () => {
    const raw = JSON.stringify(chargePayload(ctx.depRef, ctx.depMinor));
    for (let i = 0; i < 2; i++) {
      const res = await sendWebhook(raw);
      console.log('P4 webhook post ->', res.status);
      expect(res.status).toBe(200);
    }
    await waitFor(async () => {
      const p = await prisma.payment.findUnique({ where: { reference: ctx.depRef } });
      return p?.status === 'success' && p?.postedToFolio === true;
    });
    await new Promise((r) => setTimeout(r, 1500));
    const pays = await prisma.payment.findMany({ where: { reference: ctx.depRef } });
    expect(pays.length).toBe(1);
    const folio = await prisma.folio.findFirst({
      where: { reservationId: ctx.reservationId },
    });
    const items = await prisma.folioItem.findMany({ where: { folioId: folio.id } });
    console.log(
      'P4 folio totalPayments',
      folio.totalPayments,
      'items',
      items.length,
      JSON.stringify(
        items.map((i: any) => ({ amt: Number(i.amount), type: i.type, at: i.postedAt }))
      ),
      'payment.postedAt',
      pays[0].postedAt
    );
    expect(Number(folio.totalPayments)).toBeCloseTo(ctx.depMinor / 100, 2);
    expect(items.length).toBe(1);
  }, 30000);

  it('B6 public cancellation by confirmation number + email', async () => {
    const res = await request(app)
      .post('/v1/public/cancellations')
      .send({
        confirmationNumber: ctx.confirmationNumber,
        email: `p4-${runId}@example.com`,
      });
    expect(res.status).toBe(200);
    const reservation = await prisma.reservation.findUnique({
      where: { id: ctx.reservationId },
    });
    expect(reservation.status).toBe('cancelled');
  });

  it('B7 live 3DS redirect: hosted checkout page resolves (sandbox)', async () => {
    const secret = process.env.PAYSTACK_TEST_SECRET_KEY;
    if (!secret || !secret.startsWith('sk_test_') || secret.length < 24) {
      console.log('B7 BLOCKED: set PAYSTACK_TEST_SECRET_KEY (Paystack dashboard, Test mode)');
      return;
    }
    const init: any = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'p4-b7-' + Date.now() + '@example.com',
        amount: 5000,
        currency: 'ZAR',
      }),
    }).then((r) => r.json());
    expect(init.status).toBe(true);
    const page = await fetch(init.data.authorization_url, { redirect: 'follow' });
    expect(page.ok).toBe(true);
    console.log('B7 LIVE redirect OK — hosted checkout URL resolves against sandbox');
  }, 30000);
});

afterAll(async () => {
  try {
    await paymentWorker?.close();
  } catch {
    /* ignore */
  }
  await prisma.$disconnect();
});
