/* P11 — Payment exception worklist (addendum 5.3, slice #4).
 * S1 shape: failed + stale-pending surface with correct validActions
 *    (failed gets retry; stale does NOT); fresh pending and dismissed
 *    failures stay off the list.
 * S2 dismiss: reason mandatory (400 without), dismissal removes the item
 *    from the list, and an audit row is written. Unknown id -> 404.
 * S3 tenant isolation: another tenant neither sees nor can dismiss.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
const propCode =
  'P11' +
  runId
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-6);

let app: any;
let agent: any;
const ctx: Record<string, any> = {};

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  const t = await prisma.tenant.findUnique({ where: { id: agent.tenantId } });
  const prop = await prisma.property.create({
    data: { tenantId: t.id, name: 'P11 Exceptions Hotel', code: propCode },
  });
  ctx.propertyId = prop.id;
  const g = await prisma.guest.create({
    data: {
      tenantId: t.id,
      firstName: 'P11',
      lastName: 'Guest',
      email: 'p11-' + runId + '@example.com',
    },
  });
  ctx.guestId = g.id;
  const res = await prisma.reservation.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      guestId: g.id,
      confirmationNumber: 'P11-RES-' + runId.toUpperCase(),
      status: 'confirmed',
      arrivalDate: new Date(),
      departureDate: new Date(Date.now() + 86400_000),
      nights: 1,
      totalAmount: 5000,
      balance: 5000,
    },
  });
  ctx.reservationId = res.id;
  const folio = await prisma.folio.create({
    data: { tenantId: t.id, reservationId: res.id, balance: 5000, totalCharges: 5000 },
  });
  ctx.folioId = folio.id;

  const mk = (over: any) =>
    prisma.payment.create({
      data: {
        tenantId: t.id,
        propertyId: prop.id,
        reservationId: res.id,
        guestId: g.id,
        folioId: folio.id,
        reference: 'P11-' + over.tag + '-' + runId.toUpperCase(),
        amountMinor: 5000,
        currency: 'ZAR',
        type: 'card',
        status: 'pending',
        ...over.data,
      },
    });
  ctx.failed = await mk({
    tag: 'FAIL',
    data: { status: 'failed', failureReason: 'insufficient funds' },
  });
  ctx.stale = await mk({ tag: 'STALE', data: { createdAt: new Date(Date.now() - 3 * 3600_000) } });
  ctx.fresh = await mk({ tag: 'FRESH', data: {} });
  ctx.dismissed = await mk({
    tag: 'DISMISSED',
    data: {
      status: 'failed',
      failureReason: 'duplicate',
      metadata: { exception: { dismissedAt: new Date().toISOString() } },
    },
  });
  console.log('P11 seeded', propCode);
}, 90000);

describe('P11 payment exceptions', () => {
  it('S1: failed + stale surface with guardrailed actions', async () => {
    const res = await request(app)
      .get('/v1/payment-exceptions')
      .set('Authorization', 'Bearer ' + agent.token);
    expect(res.status).toBe(200);
    const items = res.body.data.items;
    const refs = items.map((i: any) => i.reference);
    expect(refs).toContain(ctx.failed.reference);
    expect(refs).toContain(ctx.stale.reference);
    expect(refs).not.toContain(ctx.fresh.reference);
    expect(refs).not.toContain(ctx.dismissed.reference);

    const f = items.find((i: any) => i.reference === ctx.failed.reference);
    expect(f.type).toBe('failed');
    expect(f.severity).toBe('critical');
    expect(f.failureReason).toBe('insufficient funds');
    expect(f.validActions).toEqual(['verify', 'retry', 'send-payment-link', 'dismiss']);
    expect(f.confirmationNumber).toContain('P11-RES');

    const s = items.find((i: any) => i.reference === ctx.stale.reference);
    expect(s.type).toBe('stale_pending');
    expect(s.validActions).toEqual(['verify', 'dismiss']); // NO retry on pending
    console.log('P11 exceptions OK', items.length, 'items');
  }, 60000);

  it('S2: dismiss requires a reason, removes the item, writes audit', async () => {
    const noReason = await request(app)
      .post('/v1/payment-exceptions/dismiss')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ paymentId: ctx.stale.id });
    expect(noReason.status).toBe(400);
    expect(noReason.body.error.code).toBe('REASON_REQUIRED');

    const missing = await request(app)
      .post('/v1/payment-exceptions/dismiss')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ paymentId: 'nope', reason: 'x' });
    expect(missing.status).toBe(404);

    const ok = await request(app)
      .post('/v1/payment-exceptions/dismiss')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ paymentId: ctx.stale.id, reason: 'guest settling on arrival' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.dismissed).toBe(true);

    const list = await request(app)
      .get('/v1/payment-exceptions')
      .set('Authorization', 'Bearer ' + agent.token);
    expect(list.body.data.items.map((i: any) => i.reference)).not.toContain(ctx.stale.reference);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'payment_exception.dismiss', entityId: ctx.stale.id },
    });
    expect(audit).toBeTruthy();
    expect((audit.metadata as any).reason).toBe('guest settling on arrival');
    console.log('P11 dismiss OK');
  }, 60000);

  it('S3: another tenant neither sees nor can dismiss', async () => {
    const mod: any = await import('../helpers/server.js');
    const outsider = await mod.registerTestAgent(app);
    const list = await request(app)
      .get('/v1/payment-exceptions')
      .set('Authorization', 'Bearer ' + outsider.token);
    expect(list.body.data.items.map((i: any) => i.reference)).not.toContain(ctx.failed.reference);
    const dismiss = await request(app)
      .post('/v1/payment-exceptions/dismiss')
      .set('Authorization', 'Bearer ' + outsider.token)
      .send({ paymentId: ctx.failed.id, reason: 'x' });
    expect(dismiss.status).toBe(404);
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
