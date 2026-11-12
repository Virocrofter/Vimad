/* P12 — Exception engine (audit §6, Phase 4).
 * S1 detection: all four MVP detector types surface with correct severity,
 *    recommended action and deep link; a second GET does not duplicate
 *    (idempotent upsert by dedupeKey).
 * S2 lifecycle: ack (open -> acknowledged, owner set) -> resolve with note;
 *    invalid transitions 409; dismiss without reason 400; dismiss with
 *    reason writes an audit row; assign works.
 * S3 decisions persist: a resolved exception whose source condition still
 *    holds stays resolved after re-detection; another tenant cannot touch it.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
const propCode =
  'P12' +
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
    data: { tenantId: t.id, name: 'P12 Exceptions Hotel', code: propCode },
  });
  ctx.propertyId = prop.id;
  const g = await prisma.guest.create({
    data: {
      tenantId: t.id,
      firstName: 'P12',
      lastName: 'Guest',
      email: 'p12-' + runId + '@example.com',
    },
  });
  ctx.guestId = g.id;
  const rt = await prisma.roomType.create({
    data: { tenantId: t.id, propertyId: prop.id, name: 'P12 Type', code: 'P12RT' },
  });
  const room = await prisma.room.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      roomTypeId: rt.id,
      number: 'P12-1',
      housekeepingStatus: 'dirty',
    },
  });
  ctx.roomId = room.id;
  // Arrival TODAY assigned to a dirty room -> room_readiness
  const res = await prisma.reservation.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      guestId: g.id,
      confirmationNumber: 'P12-ARR-' + runId.toUpperCase(),
      status: 'confirmed',
      arrivalDate: new Date(),
      departureDate: new Date(Date.now() + 86400_000),
      nights: 1,
      totalAmount: 1000,
      balance: 1000,
    },
  });
  ctx.reservationId = res.id;
  await prisma.reservationStay.create({
    data: { reservationId: res.id, roomId: room.id, date: new Date(), rate: 1000 },
  });
  // Failed payment -> payment_failed
  ctx.pay = await prisma.payment.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      reservationId: res.id,
      guestId: g.id,
      reference: 'P12-FAIL-' + runId.toUpperCase(),
      amountMinor: 5000,
      currency: 'ZAR',
      type: 'card',
      status: 'failed',
      failureReason: 'card declined',
    },
  });
  // Overdue task -> overdue_request
  ctx.task = await prisma.task.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      department: 'housekeeping',
      title: 'P12 overdue inspection',
      status: 'open',
      dueAt: new Date(Date.now() - 3600_000),
      slaMinutes: 60,
      slaBreached: true,
    },
  });
  // Channel connection with failed sync -> channel_sync
  ctx.conn = await prisma.channelConnection.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      provider: 'channex',
      hotelId: 'P12-HOTEL',
      apiKey: 'p12-key',
      status: 'active',
      lastSyncStatus: 'failed',
      lastSyncAt: new Date(Date.now() - 3600_000),
    },
  });
  console.log('P12 seeded', propCode);
}, 90000);

describe('P12 exception engine', () => {
  // ownerId/assigneeId are plain strings (no FK); the test token may carry no
  // resolvable actor, so pass explicit ids — exercises the contract fallback.
  const ownerOf = async () =>
    (await prisma.user.findFirst({ where: { tenantId: agent.tenantId } }))?.id ?? 'p12-test-owner';

  it('S1: all four detectors fire; idempotent on re-read', async () => {
    const res = await request(app)
      .get('/v1/exceptions')
      .set('Authorization', 'Bearer ' + agent.token);
    expect(res.status).toBe(200);
    const items = res.body.data.items;
    const types = items.map((i: any) => i.type);
    for (const ty of ['payment_failed', 'room_readiness', 'overdue_request', 'channel_sync']) {
      expect(types).toContain(ty);
    }
    const pay = items.find((i: any) => i.type === 'payment_failed');
    expect(pay.severity).toBe('critical');
    expect(pay.recommendedAction).toContain('payment link');
    expect(pay.actionUrl).toBe('/app/billing');
    expect(pay.paymentId).toBe(ctx.pay.id);
    const room = items.find((i: any) => i.type === 'room_readiness');
    expect(room.severity).toBe('high');
    expect(room.roomId).toBe(ctx.roomId);
    const chan = items.find((i: any) => i.type === 'channel_sync');
    expect(chan.severity).toBe('critical');

    const again = await request(app)
      .get('/v1/exceptions')
      .set('Authorization', 'Bearer ' + agent.token);
    expect(again.body.data.items.length).toBe(items.length); // no duplicates
    console.log('P12 detected', items.length, 'items');
  }, 60000);

  it('S2: lifecycle — ack, assign, resolve; guards and audited dismiss', async () => {
    const list = await request(app)
      .get('/v1/exceptions?status=open')
      .set('Authorization', 'Bearer ' + agent.token);
    const ids = Object.fromEntries(list.body.data.items.map((i: any) => [i.type, i.id]));
    expect(Object.keys(ids).length).toBeGreaterThanOrEqual(4);

    const ownerId = await ownerOf();
    const ack = await request(app)
      .post('/v1/exceptions/' + ids.overdue_request + '/ack')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ ownerId });
    expect(ack.status).toBe(200);
    expect(ack.body.data.status).toBe('acknowledged');
    expect(ack.body.data.ownerId).toBeTruthy();

    const ackAgain = await request(app)
      .post('/v1/exceptions/' + ids.overdue_request + '/ack')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({});
    expect(ackAgain.status).toBe(409); // not open anymore

    const assign = await request(app)
      .post('/v1/exceptions/' + ids.payment_failed + '/assign')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ assigneeId: ownerId });
    expect(assign.status).toBe(200);
    expect(assign.body.data.assigneeId).toBeTruthy();

    const resolve = await request(app)
      .post('/v1/exceptions/' + ids.payment_failed + '/resolve')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ note: 'guest paid by EFT' });
    expect(resolve.status).toBe(200);
    expect(resolve.body.data.status).toBe('resolved');
    expect(resolve.body.data.resolutionNote).toBe('guest paid by EFT');

    const noReason = await request(app)
      .post('/v1/exceptions/' + ids.room_readiness + '/dismiss')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({});
    expect(noReason.status).toBe(400);
    expect(noReason.body.error.code).toBe('REASON_REQUIRED');

    const dismissed = await request(app)
      .post('/v1/exceptions/' + ids.channel_sync + '/dismiss')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ reason: 'provider outage — monitoring' });
    expect(dismissed.status).toBe(200);

    const audit = await prisma.auditLog.findFirst({
      where: { action: 'exception.dismiss', entityId: ids.channel_sync },
    });
    expect(audit).toBeTruthy();
    expect((audit.metadata as any).reason).toBe('provider outage — monitoring');
    console.log('P12 lifecycle OK');
  }, 60000);

  it('S3: resolved/dismissed survive re-detection; tenant isolation', async () => {
    // Conditions still hold (payment still failed, connection still failed) —
    // but human decisions must stand.
    const res = await request(app)
      .get('/v1/exceptions?status=all')
      .set('Authorization', 'Bearer ' + agent.token);
    const byType = Object.fromEntries(res.body.data.items.map((i: any) => [i.type, i]));
    expect(byType.payment_failed.status).toBe('resolved');
    expect(byType.channel_sync.status).toBe('dismissed');
    expect(byType.overdue_request.status).toBe('acknowledged');

    const mod: any = await import('../helpers/server.js');
    const outsider = await mod.registerTestAgent(app);
    const poke = await request(app)
      .post('/v1/exceptions/' + byType.payment_failed.id + '/ack')
      .set('Authorization', 'Bearer ' + outsider.token)
      .send({});
    expect(poke.status).toBe(404);
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
