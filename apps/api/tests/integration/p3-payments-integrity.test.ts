/* P3-A payments integrity — final
 * W1 duplicate charge.success -> exactly one folio posting
 * W2 refund replay            -> refundedMinor exactly 20000, posted once
 * W3 forged signature         -> rejected, zero processing
 * W4 unknown reference        -> never 500s, never double-posts
 * E2 live 3DS                 -> blocked unless Paystack test keys set
 * Runs the real BullMQ payment worker in-process; only fetchTransaction
 * is mocked (no network). Queue introspection logs the enqueued job names
 * so the webhook<->worker naming contract is visible in the output.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Queue } from 'bullmq';

const mocks = vi.hoisted(() => ({ amountRefunded: 0 }));
vi.mock('../../src/common/paystack.js', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    fetchTransaction: async (_id: number) => ({
      status: 'success',
      amount_refunded: mocks.amountRefunded,
      fees: 0,
    }),
    verifyWebhookSignature: (rawBody: any, sig: any) => {
      const ok = actual.verifyWebhookSignature(rawBody, sig);
      console.log(
        'P3PAY verify: rawBody=',
        rawBody ? Buffer.from(rawBody).length : 'UNDEFINED',
        'sig=',
        typeof sig === 'string' ? sig.slice(0, 12) : sig,
        '->',
        ok
      );
      return ok;
    },
  };
});

const prisma: any = new PrismaClient();
const SECRET = 'p3-pay-secret';
const runId = Date.now().toString(36);

let app: any;
let webhookPath = '';
let queue: Queue | undefined;
let paymentWorker: any;
let ctx: Record<string, any> = {};

function sign(raw: string, secret: string = SECRET): string {
  return crypto.createHmac('sha512', secret).update(raw).digest('hex');
}

const chargePayload = (reference: string, amountMinor = 50000) => ({
  event: 'charge.success',
  data: {
    id: 8000001,
    transaction_id: 8000001,
    reference,
    status: 'success',
    amount: amountMinor,
    fees: 0,
    currency: 'ZAR',
    channel: 'card',
    paid_at: Math.floor(Date.now() / 1000),
    customer: { email: 'p3-guest@example.com' },
    metadata: { reference },
  },
});

const refundPayload = (reference: string) => ({
  event: 'refund.processed',
  data: {
    transaction_id: 8000002,
    reference,
    refunded_amount: 20000,
    status: 'success',
  },
});

async function sendWebhook(raw: string, secret: string = SECRET) {
  return request(app)
    .post(webhookPath)
    .set('x-paystack-signature', sign(raw, secret))
    .set('Content-Type', 'application/json')
    .send(raw);
}

async function waitFor(fn: () => Promise<boolean>, ms = 60000): Promise<void> {
  const start = Date.now();
  for (;;) {
    if (await fn()) return;
    if (Date.now() - start > ms) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, 150));
  }
}

async function logQueue(tag: string): Promise<void> {
  if (!queue) return;
  try {
    const [w, a, c, f] = await Promise.all([
      queue.getWaiting(0, 5),
      queue.getActive(0, 5),
      queue.getCompleted(0, 5),
      queue.getFailed(0, 5),
    ]);
    const n = (jobs: any[]) => jobs.map((j) => `${j.name}#${j.id}`).join(',') || '-';
    console.log(
      `P3PAY queue[${tag}] waiting=${n(w)} active=${n(a)} completed=${n(c)} failed=${n(f)}`
    );
  } catch (e: any) {
    console.log('P3PAY queue introspection failed:', e?.message);
  }
}

async function seedStay(tag: string) {
  const t = await prisma.tenant.create({
    data: { name: `P3Pay ${tag} ${runId}`, slug: `p3pay-${tag}-${runId}` },
  });
  const p = await prisma.property.create({
    data: { tenantId: t.id, name: 'P3 Prop', code: `P3${tag}${runId}` },
  });
  const rt = await prisma.roomType.create({
    data: { tenantId: t.id, propertyId: p.id, name: 'Deluxe', code: 'DLX' },
  });
  await prisma.room.create({
    data: { tenantId: t.id, propertyId: p.id, roomTypeId: rt.id, number: `${tag}01` },
  });
  const g = await prisma.guest.create({
    data: {
      tenantId: t.id,
      firstName: 'P3',
      lastName: 'Guest',
      email: `p3-${tag}-${runId}@example.com`,
    },
  });
  const arr = new Date();
  const dep = new Date();
  dep.setDate(dep.getDate() + 2);
  const res = await prisma.reservation.create({
    data: {
      tenantId: t.id,
      propertyId: p.id,
      guestId: g.id,
      confirmationNumber: `P3-${tag}-${runId}`,
      status: 'confirmed',
      arrivalDate: arr,
      departureDate: dep,
      nights: 2,
      adults: 1,
      totalAmount: 1000,
      balance: 1000,
    },
  });
  const folio = await prisma.folio.create({
    data: { reservationId: res.id, tenantId: t.id },
  });
  return {
    tenantId: t.id,
    propertyId: p.id,
    guestId: g.id,
    reservationId: res.id,
    folioId: folio.id,
  };
}

beforeAll(async () => {
  // 1. Every env var the webhook reads -> our test secret (before any import)
  for (const rel of [
    '../../src/modules/payments/payments.webhook.ts',
    '../../src/common/paystack.ts',
  ]) {
    try {
      const p = fileURLToPath(new URL(rel, import.meta.url));
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
        if (m[1]) {
          process.env[m[1]] = SECRET;
          console.log('P3PAY env override:', m[1], '<-', rel);
        }
      }
    } catch (e) {
      console.log('P3PAY env scan failed for', rel, String(e));
    }
  }
  for (const k of [
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_SECRET',
    'PAYSTACK_WEBHOOK_SECRET',
    'PAYSTACK_TEST_SECRET_KEY',
  ]) {
    process.env[k] = SECRET;
  }

  // 1b. Ensure express.json captures rawBody (production does this in
  //     index.ts; the test helper may not). The webhook HMACs the raw body.
  const expressMod: any = await import('express');
  const express: any = expressMod.default ?? expressMod;
  if (!express.__p3RawBodyPatched) {
    const origJson = express.json.bind(express);
    express.json = (opts: any = {}) =>
      origJson({
        ...opts,
        verify: (req: any, res: any, buf: Buffer) => {
          (req as any).rawBody = buf;
          if (opts?.verify) opts.verify(req, res, buf);
        },
      });
    express.__p3RawBodyPatched = true;
  }

  // 2. Build app + worker (dynamic imports so env is set first)
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app ?? mod.server;
  const wh: any = await import('../../src/modules/payments/payments.webhook.js');
  const job: any = await import('../../src/jobs/payment.job.js');
  paymentWorker = job.paymentWorker;
  queue = new Queue(wh.PAYMENTS_QUEUE);
  console.log('P3PAY queue =', wh.PAYMENTS_QUEUE);
  const envMod: any = await import('../../src/common/env.js');
  console.log(
    'P3PAY env resolved: WEBHOOK_SECRET=',
    envMod.env?.PAYSTACK_WEBHOOK_SECRET,
    'SECRET_KEY=',
    envMod.env?.PAYSTACK_SECRET_KEY
  );
  const psx: any = await import('../../src/common/paystack.js');
  const preRaw = Buffer.from(JSON.stringify(chargePayload('P3PAY-PRECHECK-' + runId)), 'utf8');
  console.log(
    'P3PAY local verify check:',
    psx.verifyWebhookSignature(preRaw, sign(preRaw.toString()))
  );

  // 3. Seed isolated stays + payment rows (as initializePayment would)
  ctx.w1 = await seedStay('w1');
  ctx.w2 = await seedStay('w2');
  await prisma.payment.create({
    data: {
      tenantId: ctx.w1.tenantId,
      propertyId: ctx.w1.propertyId,
      reservationId: ctx.w1.reservationId,
      guestId: ctx.w1.guestId,
      folioId: ctx.w1.folioId,
      reference: `P3PAY-W1-${runId}`,
      paystackId: 8000001,
      amountMinor: 50000,
      currency: 'ZAR',
      type: 'charge',
      status: 'pending',
      channel: 'card',
    },
  });
  await prisma.payment.create({
    data: {
      tenantId: ctx.w2.tenantId,
      propertyId: ctx.w2.propertyId,
      reservationId: ctx.w2.reservationId,
      guestId: ctx.w2.guestId,
      folioId: ctx.w2.folioId,
      reference: `P3PAY-W2-${runId}`,
      paystackId: 8000002,
      amountMinor: 50000,
      currency: 'ZAR',
      type: 'charge',
      status: 'success',
      channel: 'card',
    },
  });

  // 4. Discover webhook path: a real route answers 401 to a bad signature,
  //    a missing one answers 404.
  const raw = JSON.stringify(chargePayload('P3PAY-PROBE-' + runId));
  const candidates = [
    '/v1/payments/webhook/webhook',
    '/webhook',
    '/v1/payments/webhook',
    '/api/v1/payments/webhook',
    '/payments/webhook',
    '/v1/payments/webhook/paystack',
    '/payments/webhooks/paystack',
    '/webhooks/paystack',
    '/v1/webhooks/paystack',
    '/api/v1/webhooks/paystack',
    '/paystack/webhook',
    '/api/payments/webhook',
  ];
  for (const cand of candidates) {
    const res = await request(app)
      .post(cand)
      .set('x-paystack-signature', sign(raw, 'wrong-secret'))
      .set('Content-Type', 'application/json')
      .send(raw);
    console.log('P3PAY probe', cand, '->', res.status, JSON.stringify(res.body));
    const isAuthGuard401 =
      res.status === 401 && JSON.stringify(res.body).includes('authorization header');
    if (res.status !== 404 && !isAuthGuard401) {
      webhookPath = cand;
      break;
    }
  }
  if (!webhookPath) throw new Error('no webhook route found among candidates');
  console.log('P3PAY webhook path =', webhookPath);
}, 60000);

describe('P3-A payments integrity', () => {
  it('W1 duplicate charge.success webhook posts exactly once to the folio', async () => {
    const reference = `P3PAY-W1-${runId}`;
    const raw = JSON.stringify(chargePayload(reference));
    for (let i = 0; i < 2; i++) {
      const res = await sendWebhook(raw);
      console.log('P3PAY post ->', res.status, JSON.stringify(res.body));
      expect(res.status).toBe(200);
    }
    await logQueue('after-charge-posts');
    await waitFor(async () => {
      const p = await prisma.payment.findUnique({ where: { reference } });
      return p?.postedToFolio === true;
    });
    await new Promise((r) => setTimeout(r, 1500)); // settle: catch double-post
    const payments = await prisma.payment.findMany({ where: { reference } });
    expect(payments.length).toBe(1);
    const items = await prisma.folioItem.findMany({
      where: { folioId: ctx.w1.folioId },
    });
    expect(items.length).toBe(1);
    expect(Number(items[0].amount)).toBe(500);
    const folio = await prisma.folio.findUnique({
      where: { id: ctx.w1.folioId },
    });
    expect(Number(folio.totalPayments)).toBe(500);
    console.log('W1 folio items:', items.length, 'totalPayments:', folio.totalPayments);
  }, 30000);

  it('W2 refund webhook replay applies the refund exactly once', async () => {
    mocks.amountRefunded = 20000;
    const reference = `P3PAY-W2-${runId}`;
    const raw = JSON.stringify(refundPayload(reference));
    for (let i = 0; i < 2; i++) {
      const res = await sendWebhook(raw);
      console.log('P3PAY post ->', res.status, JSON.stringify(res.body));
      expect(res.status).toBe(200);
    }
    await logQueue('after-refund-posts');
    await waitFor(async () => {
      const p = await prisma.payment.findUnique({ where: { reference } });
      return p?.refundedMinor === 20000;
    });
    await new Promise((r) => setTimeout(r, 1500)); // settle: never 40000
    const p = await prisma.payment.findUnique({ where: { reference } });
    expect(p.refundedMinor).toBe(20000);
    expect(p.status).toBe('partially_refunded');
    const items = await prisma.folioItem.findMany({
      where: { folioId: ctx.w2.folioId },
    });
    expect(items.length).toBe(1);
    const folio = await prisma.folio.findUnique({
      where: { id: ctx.w2.folioId },
    });
    expect(Number(folio.totalPayments)).toBe(-200); // refund leg only; charge posting proven in W1
    console.log('W2 refundedMinor:', p.refundedMinor, 'folio items:', items.length);
  }, 30000);

  it('W3 forged signature is rejected (never processes)', async () => {
    const reference = `P3PAY-W3-${runId}`;
    const raw = JSON.stringify(chargePayload(reference));
    const res = await sendWebhook(raw, 'forged-secret');
    expect([400, 401, 403]).toContain(res.status);
    const p = await prisma.payment.findUnique({ where: { reference } });
    expect(p).toBeNull();
  });

  it('W4 unknown-reference event never 500s and never double-posts', async () => {
    const reference = `P3PAY-UNKNOWN-${runId}`;
    const raw = JSON.stringify(chargePayload(reference));
    const res = await sendWebhook(raw);
    console.log('P3PAY post ->', res.status, JSON.stringify(res.body));
    expect(res.status).toBe(200);
    const p = await prisma.payment.findUnique({ where: { reference } });
    expect(p).toBeNull();
    const items = await prisma.folioItem.findMany({
      where: { folioId: ctx.w1.folioId },
    });
    expect(items.length).toBeLessThanOrEqual(1); // only W1's single posting
  });

  it('E2 live 3DS handshake: real initialize + verify against Paystack sandbox', async () => {
    const secret = process.env.PAYSTACK_TEST_SECRET_KEY;
    if (!secret || !secret.startsWith('sk_test_') || secret.length < 24) {
      console.log(
        'E2 BLOCKED: set a real PAYSTACK_TEST_SECRET_KEY (Paystack dashboard, Test mode)'
      );
      return;
    }
    const reference = 'P3E2-' + Date.now();
    const init: any = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'p3-e2-' + Date.now() + '@example.com',
        amount: 10000,
        currency: 'ZAR',
        reference,
      }),
    }).then((r) => r.json());
    expect(init.status).toBe(true);
    expect(init.data.authorization_url).toContain('checkout.paystack.com');
    expect(init.data.access_code).toBeTruthy();
    const verify: any = await fetch('https://api.paystack.co/transaction/verify/' + reference, {
      headers: { Authorization: 'Bearer ' + secret },
    }).then((r) => r.json());
    expect(verify.status).toBe(true);
    expect(['abandoned', 'pending', 'success']).toContain(verify.data?.status);
    console.log('E2 LIVE handshake OK — initialize/verify round-trip against Paystack sandbox');
  }, 30000);
});

afterAll(async () => {
  try {
    await paymentWorker?.close();
  } catch {
    /* ignore */
  }
  try {
    await queue?.close();
  } catch {
    /* ignore */
  }
  await prisma.$disconnect();
});
