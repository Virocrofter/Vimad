/* P7 — E5 consent enforcement, verified at SEND TIME (roadmap gate).
 * E1 no consent -> gate blocks (403 CONSENT_REQUIRED)
 * E2 grant -> gate allows, verdict + history auditable
 * E3 revoke (append-only) -> gate blocks (403 CONSENT_REVOKED), newest wins
 * E4 purpose isolation: newsletter grant does not unlock marketing
 * E5 channel isolation: email grant does not unlock sms
 * E6 operational exemption: transactional sends never gated on marketing consent
 * E7 campaign batch filter returns only latest-wins granted ids
 * E8 tenant isolation: another tenant cannot read/resolve our guests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);

let app: any;
let agent: any;
let base = ''; // discovered route base
const g: Record<string, string> = {};

function authed(verb: 'get' | 'post', path: string, body?: any) {
  const r = (request(app) as any)[verb](base + path).set('Authorization', 'Bearer ' + agent.token);
  return body === undefined ? r : r.send(body);
}

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);

  const t = await prisma.tenant.findUnique({ where: { id: agent.tenantId } });
  const mk = async (tag: string) => {
    const guest = await prisma.guest.create({
      data: {
        tenantId: t.id,
        firstName: 'P7',
        lastName: tag,
        email: 'p7-' + tag + '-' + runId + '@example.com',
      },
    });
    g[tag] = guest.id;
    return guest.id;
  };
  await mk('plain'); // never consents
  await mk('granted'); // grants marketing/email
  await mk('revoked'); // grants then revokes
  await mk('newsletter'); // grants newsletter only
  await mk('sms'); // grants marketing/sms only
  await mk('ops'); // no consent; receives operational mail

  // Discovery: existing marketing router may own other paths.
  for (const c of ['/v1/marketing/consents', '/v1/consents']) {
    const res = await request(app)
      .get(c + '?guestId=' + g.plain)
      .set('Authorization', 'Bearer ' + agent.token);
    console.log('P7 probe', c, '->', res.status);
    if (res.status !== 404) {
      base = c.replace(/\/consents$/, '');
      break;
    }
  }
  expect(base, 'consent base discovered').toBeTruthy();
  console.log('P7 base =', base);
}, 90000);

describe('P7 E5 consent enforcement', () => {
  it('E1 no consent on file -> send gate blocks with CONSENT_REQUIRED', async () => {
    const res = await authed('post', '/consents/gate', {
      guestId: g.plain,
      purpose: 'marketing',
      channel: 'email',
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CONSENT_REQUIRED');
    const hist = await authed('get', '/consents?guestId=' + g.plain);
    expect(hist.status).toBe(200);
    expect(hist.body.data).toEqual([]); // auditable: nothing recorded, nothing hidden
  });

  it('E2 grant -> gate allows; verdict and history auditable', async () => {
    const grant = await authed('post', '/consents', {
      guestId: g.granted,
      purpose: 'marketing',
      channel: 'email',
      status: 'granted',
      source: 'front_desk',
    });
    expect(grant.status).toBe(201);
    expect(grant.body.data.status).toBe('granted');

    const gate = await authed('post', '/consents/gate', {
      guestId: g.granted,
      purpose: 'marketing',
      channel: 'email',
    });
    expect(gate.status).toBe(200);
    expect(gate.body.data.allowed).toBe(true);
    expect(gate.body.data.consent.source).toBe('front_desk');

    const hist = await authed('get', '/consents?guestId=' + g.granted);
    expect(hist.body.data.length).toBe(1);
    expect(hist.body.data[0].capturedAt).toBeTruthy();
  });

  it('E3 revoke is append-only and newest-wins -> gate blocks CONSENT_REVOKED', async () => {
    await authed('post', '/consents', {
      guestId: g.revoked,
      purpose: 'marketing',
      channel: 'email',
      status: 'granted',
      source: 'booking',
    });
    const unsub = await authed('post', '/consents', {
      guestId: g.revoked,
      purpose: 'marketing',
      channel: 'email',
      status: 'revoked',
      source: 'unsubscribe',
    });
    expect(unsub.status).toBe(201);

    const gate = await authed('post', '/consents/gate', {
      guestId: g.revoked,
      purpose: 'marketing',
      channel: 'email',
    });
    expect(gate.status).toBe(403);
    expect(gate.body.error.code).toBe('CONSENT_REVOKED');
    expect(gate.body.error.consent.source).toBe('unsubscribe');

    const hist = await authed('get', '/consents?guestId=' + g.revoked);
    expect(hist.body.data.length).toBe(2); // both rows retained — history, not overwrite
    expect(hist.body.data[0].status).toBe('revoked'); // newest first
    expect(hist.body.data[1].status).toBe('granted');
  });

  it('E4 purpose isolation: newsletter grant does not unlock marketing (and vice versa)', async () => {
    await authed('post', '/consents', {
      guestId: g.newsletter,
      purpose: 'newsletter',
      channel: 'email',
      status: 'granted',
      source: 'guest_portal',
    });
    const m = await authed('post', '/consents/gate', {
      guestId: g.newsletter,
      purpose: 'marketing',
      channel: 'email',
    });
    expect(m.status).toBe(403);
    expect(m.body.error.code).toBe('CONSENT_REQUIRED');
    const n = await authed('post', '/consents/gate', {
      guestId: g.newsletter,
      purpose: 'newsletter',
      channel: 'email',
    });
    expect(n.status).toBe(200);
  });

  it('E5 channel isolation: email grant does not unlock sms', async () => {
    await authed('post', '/consents', {
      guestId: g.sms,
      purpose: 'marketing',
      channel: 'sms',
      status: 'granted',
      source: 'guest_portal',
    });
    const emailGate = await authed('post', '/consents/gate', {
      guestId: g.sms,
      purpose: 'marketing',
      channel: 'email',
    });
    expect(emailGate.status).toBe(403);
    const smsGate = await authed('post', '/consents/gate', {
      guestId: g.sms,
      purpose: 'marketing',
      channel: 'sms',
    });
    expect(smsGate.status).toBe(200);
  });

  it('E6 operational exemption: transactional sends are never gated on marketing consent', async () => {
    const gate = await authed('post', '/consents/gate', {
      guestId: g.ops,
      purpose: 'operational',
      channel: 'email',
    });
    expect(gate.status).toBe(200);
    expect(gate.body.data.reason).toBe('operational_exempt');
    // and operational cannot be "consented" — it is not a marketing purpose
    const rec = await authed('post', '/consents', {
      guestId: g.ops,
      purpose: 'operational',
      channel: 'email',
      status: 'granted',
      source: 'manual',
    });
    expect(rec.status).toBe(400);
  });

  it('E7 campaign batch filter: only latest-wins granted ids pass', async () => {
    const res = await authed('post', '/consents/filter', {
      guestIds: [g.granted, g.revoked, g.newsletter, g.sms, g.plain],
      purpose: 'marketing',
      channel: 'email',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.allowed.sort()).toEqual([g.granted].sort());
  });

  it('E8 tenant isolation: another tenant cannot resolve or gate our guests', async () => {
    const mod: any = await import('../helpers/server.js');
    const outsider = await mod.registerTestAgent(app);
    const gate = await request(app)
      .post(base + '/consents/gate')
      .set('Authorization', 'Bearer ' + outsider.token)
      .send({ guestId: g.granted, purpose: 'marketing', channel: 'email' });
    expect(gate.status).toBe(404);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
