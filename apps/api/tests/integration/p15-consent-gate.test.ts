/* P15 — E5 send-time consent gate, verified against the live endpoints.
 * S1: no consent row -> 403 CONSENT_REQUIRED + consent.suppressed audit row.
 * S2: grant -> gate allowed; grant-then-revoke -> 403 CONSENT_REVOKED + audit.
 * S3: operational purpose -> allowed (exempt), no audit row written.
 * S4: cross-tenant: outsider token querying our guest 404s (tenant scoping).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
let app: any;
let agent: any;
let outsider: any;
const ctx: Record<string, any> = {};

async function auditCount(tenantId: string, guestId: string) {
  return prisma.auditLog.count({
    where: { tenantId, action: 'consent.suppressed', entityId: guestId },
  });
}

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  outsider = await mod.registerTestAgent(app);
  const t = agent.tenantId;

  const prop = await prisma.property.create({
    data: {
      tenantId: t,
      name: 'P15',
      code: ('P15' + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  const guest = await prisma.guest.create({
    data: {
      tenantId: t,
      firstName: 'P15',
      lastName: 'Gate',
      email: 'p15-' + runId + '@example.com',
    },
  });
  ctx.t = t;
  ctx.prop = prop;
  ctx.guest = guest;
  console.log('P15 seeded');
}, 90000);

describe('P15 consent gate (E5 send-time enforcement)', () => {
  const gate = (body: any, token?: string) =>
    request(app)
      .post('/v1/marketing/consents/gate')
      .set('Authorization', 'Bearer ' + (token ?? agent.token))
      .send(body);

  it('S1: no consent -> 403 CONSENT_REQUIRED + suppression audit', async () => {
    const before = await auditCount(ctx.t, ctx.guest.id);
    const res = await gate({ guestId: ctx.guest.id, purpose: 'marketing', channel: 'email' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CONSENT_REQUIRED');
    expect(await auditCount(ctx.t, ctx.guest.id)).toBe(before + 1);
    console.log('P15 S1 OK');
  }, 60000);

  it('S2: grant -> allowed; revoke -> CONSENT_REVOKED + audit', async () => {
    const grant = await request(app)
      .post('/v1/marketing/consents')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({
        guestId: ctx.guest.id,
        purpose: 'marketing',
        channel: 'email',
        status: 'granted',
        source: 'manual',
      });
    if (grant.status !== 201)
      console.log('S2 grant debug', grant.status, JSON.stringify(grant.body).slice(0, 300));
    expect(grant.status).toBe(201);

    const ok = await gate({ guestId: ctx.guest.id, purpose: 'marketing', channel: 'email' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.allowed).toBe(true);
    expect(ok.body.data.reason).toBe('granted');

    const before = await auditCount(ctx.t, ctx.guest.id);
    await request(app)
      .post('/v1/marketing/consents')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({
        guestId: ctx.guest.id,
        purpose: 'marketing',
        channel: 'email',
        status: 'revoked',
        source: 'manual',
      });

    const revoked = await gate({ guestId: ctx.guest.id, purpose: 'marketing', channel: 'email' });
    expect(revoked.status).toBe(403);
    expect(revoked.body.error.code).toBe('CONSENT_REVOKED');
    expect(await auditCount(ctx.t, ctx.guest.id)).toBe(before + 1);
    console.log('P15 S2 OK');
  }, 60000);

  it('S3: operational purpose exempt, no audit written', async () => {
    const before = await auditCount(ctx.t, ctx.guest.id);
    const res = await gate({ guestId: ctx.guest.id, purpose: 'operational', channel: 'email' });
    expect(res.status).toBe(200);
    expect(res.body.data.reason).toBe('operational_exempt');
    expect(await auditCount(ctx.t, ctx.guest.id)).toBe(before);
    console.log('P15 S3 OK');
  }, 60000);

  it('S4: cross-tenant token querying our guest -> 404 (tenant scoping)', async () => {
    const res = await gate(
      { guestId: ctx.guest.id, purpose: 'marketing', channel: 'email' },
      outsider.token
    );
    expect(res.status).toBe(404);
    console.log('P15 S4 OK');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
