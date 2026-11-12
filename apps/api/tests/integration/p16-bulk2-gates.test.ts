/* P16 — Bulk 2 gates (2.2 unsubscribe / 2.3 audit view / H3 pipeline).
 * S1: signed one-click unsubscribe (the REAL mechanism, /v1/public/marketing/
 *     unsubscribe?token= renders in messages) — service-level: token revokes
 *     (source=unsubscribe), repeat is idempotent, bogus token throws.
 * S2: gate 403 -> consent.suppressed audit row served by /consents/audit.
 * S3: findWinbackCandidates: inactive checked-out in, blacklisted out.
 * S4: gateAudience (H3's send gate): consented-only set; grant flips in.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
let app: any;
let agent: any;
const ctx: Record<string, any> = {};

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  const t = agent.tenantId;

  const prop = await prisma.property.create({
    data: {
      tenantId: t,
      name: 'P16',
      code: ('P16' + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  const guest = await prisma.guest.create({
    data: {
      tenantId: t,
      firstName: 'P16',
      lastName: 'Sub',
      email: 'p16-' + runId + '@example.com',
    },
  });
  const black = await prisma.guest.create({
    data: {
      tenantId: t,
      firstName: 'P16',
      lastName: 'Black',
      email: 'p16b-' + runId + '@example.com',
      blacklisted: true,
    },
  });
  const old = new Date(Date.now() - 100 * 86400_000);
  for (const g of [guest, black]) {
    await prisma.reservation.create({
      data: {
        tenantId: t,
        propertyId: prop.id,
        guestId: g.id,
        confirmationNumber: 'P16-' + g.lastName.toUpperCase() + '-' + runId.toUpperCase(),
        status: 'checked_out',
        arrivalDate: new Date(Date.now() - 103 * 86400_000),
        departureDate: old,
        nights: 3,
        totalAmount: 3000,
        balance: 0,
      },
    });
  }
  ctx.t = t;
  ctx.prop = prop;
  ctx.guest = guest;
  ctx.black = black;
  console.log('P16 seeded');
}, 90000);

describe('P16 bulk-2 gates', () => {
  it('S1: signed unsubscribe revokes (source=unsubscribe), idempotent, bogus throws', async () => {
    const svc: any = await import('../../src/modules/marketing/marketing.service.js');
    expect(typeof svc.signUnsubscribeToken).toBe('function');
    const token = svc.signUnsubscribeToken(ctx.guest.id, 'marketing', 'email');
    expect(typeof token).toBe('string');

    await svc.unsubscribeByToken(token);
    const rows = await prisma.guestConsent.findMany({
      where: {
        guestId: ctx.guest.id,
        purpose: 'marketing',
        channel: 'email',
        status: 'revoked',
        source: 'unsubscribe',
      },
    });
    expect(rows.length).toBeGreaterThanOrEqual(1);

    await svc.unsubscribeByToken(token); // idempotent repeat — must not throw
    await expect(svc.unsubscribeByToken('bogus.token.here')).rejects.toThrow();
    console.log('P16 S1 OK');
  }, 60000);

  it('S2: gate 403 -> audit row served by /consents/audit', async () => {
    await request(app)
      .post('/v1/marketing/consents/gate')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ guestId: ctx.guest.id, purpose: 'marketing', channel: 'email' }); // revoked in S1

    const res = await request(app)
      .get('/v1/marketing/consents/audit')
      .set('Authorization', 'Bearer ' + agent.token);
    expect(res.status).toBe(200);
    const hit = (res.body.data ?? []).find((r: any) => r.entityId === ctx.guest.id);
    expect(hit).toBeTruthy();
    expect(hit.metadata.reason).toBe('revoked');
    console.log('P16 S2 OK');
  }, 60000);

  it('S3: winback candidates select inactive checked-out, exclude blacklisted', async () => {
    const svc: any = await import('../../src/modules/marketing/marketing.service.js');
    const cands = await svc.findWinbackCandidates(ctx.t, { inactiveDays: 90 });
    const ids = (cands ?? []).map((g: any) => g.id);
    expect(ids).toContain(ctx.guest.id);
    expect(ids).not.toContain(ctx.black.id);
    console.log('P16 S3 OK');
  }, 60000);

  it('S4: gateAudience consented-only set; grant flips membership', async () => {
    const svc: any = await import('../../src/modules/marketing/marketing.service.js');
    const ids = [ctx.guest.id, ctx.black.id];
    const g1 = await svc.gateAudience(ctx.t, {
      guestIds: ids,
      purpose: 'marketing',
      channel: 'email',
    });
    expect(g1.suppressedGuestIds).toContain(ctx.guest.id);
    expect(g1.suppressedGuestIds).toContain(ctx.black.id);
    await svc.recordConsent(ctx.t, ctx.guest.id, {
      purpose: 'marketing',
      channel: 'email',
      granted: true,
      source: 'test',
    });
    const g2 = await svc.gateAudience(ctx.t, {
      guestIds: ids,
      purpose: 'marketing',
      channel: 'email',
    });
    expect(g2.suppressedGuestIds).not.toContain(ctx.guest.id);
    console.log('P16 S4 OK');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
