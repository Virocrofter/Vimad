/* P8 — H3 win-back automation, end to end (roadmap: first campaign
 * workflow, gated on E5 which P7 verified).
 * Seeded guests: lapsed+consented (sends), lapsed+no-consent (E5 blocks),
 * lapsed+revoked (E5 blocks), too-recent, lapsed-but-returned-since,
 * blacklisted, already-contacted (duplicate-send rule), no email.
 * W1 run counts per branch; W2 send handoff row exact; W3 duplicate-send
 * rule holds across runs; W4 dryRun changes nothing; W5 tenant isolation.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);

let app: any;
let agent: any;
let base = '';
const g: Record<string, any> = {};

function monthsAgo(m: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d;
}

async function seedStay(tenantId: string, propertyId: string, guestId: string, departed: Date) {
  const arr = new Date(departed);
  arr.setDate(arr.getDate() - 2);
  return prisma.reservation.create({
    data: {
      tenantId,
      propertyId,
      guestId,
      confirmationNumber:
        'P8-' + runId + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      status: 'checked_out',
      arrivalDate: arr,
      departureDate: departed,
      nights: 2,
      totalAmount: 2000,
      balance: 0,
      checkedInAt: arr,
      checkedOutAt: departed,
    },
  });
}

async function grantConsent(guestId: string) {
  await prisma.guestConsent.create({
    data: {
      tenantId: agent.tenantId,
      guestId,
      purpose: 'marketing',
      channel: 'email',
      status: 'granted',
      source: 'booking',
    },
  });
}

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);

  const t = await prisma.tenant.findUnique({ where: { id: agent.tenantId } });
  const prop = await prisma.property.create({
    data: {
      tenantId: t.id,
      name: 'P8 Winback Hotel',
      code:
        'P8' +
        runId
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(-6),
    },
  });
  const mk = async (tag: string, email: string | null, extra: any = {}) => {
    const guest = await prisma.guest.create({
      data: { tenantId: t.id, firstName: 'P8', lastName: tag, email: email ?? undefined, ...extra },
    });
    g[tag] = guest.id;
    return guest;
  };

  await mk('sends', 'p8-sends-' + runId + '@example.com'); // lapsed + will consent
  await mk('noconsent', 'p8-no-' + runId + '@example.com'); // lapsed, no consent
  const revoked = await mk('revoked', 'p8-rev-' + runId + '@example.com');
  await mk('recent', 'p8-recent-' + runId + '@example.com'); // stayed 2 months ago
  await mk('returned', 'p8-ret-' + runId + '@example.com'); // lapsed stay + newer stay
  await mk('blocked', 'p8-blk-' + runId + '@example.com', {
    blacklisted: true,
    blacklistReason: 'chargebacks',
  });
  await mk('contacted', 'p8-old-' + runId + '@example.com'); // lapsed + consented + contacted 30d ago
  await mk('noemail', null); // lapsed, consented, no email

  const lapsed = monthsAgo(7);
  for (const tag of ['sends', 'noconsent', 'revoked', 'blocked', 'contacted', 'noemail']) {
    await seedStay(t.id, prop.id, g[tag], lapsed);
  }
  await seedStay(t.id, prop.id, g.recent, monthsAgo(2));
  await seedStay(t.id, prop.id, g.returned, lapsed);
  await seedStay(t.id, prop.id, g.returned, monthsAgo(1)); // newer stay wins -> not a candidate

  await grantConsent(g.sends);
  await grantConsent(g.revoked);
  await prisma.guestConsent.create({
    data: {
      tenantId: t.id,
      guestId: g.revoked,
      purpose: 'marketing',
      channel: 'email',
      status: 'revoked',
      source: 'unsubscribe',
    },
  });
  await grantConsent(g.contacted);
  await grantConsent(g.noemail);

  // contacted: win-back handoff row 30 days ago -> inside the 90-day window
  await prisma.emailLog.create({
    data: {
      tenantId: t.id,
      to: 'p8-old-' + runId + '@example.com',
      subject: 'We would love to welcome you back',
      template: 'win-back',
      status: 'queued',
      relatedType: 'guest',
      relatedId: g.contacted,
      createdAt: new Date(Date.now() - 30 * 86400000),
    },
  });

  // route discovery
  for (const c of ['/v1/marketing/winback', '/v1/winback']) {
    const res = await request(app)
      .post(c + '/run')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ dryRun: true });
    console.log('P8 probe', c, '->', res.status);
    if (res.status !== 404) {
      base = c;
      break;
    }
  }
  expect(base, 'winback route discovered').toBeTruthy();
  console.log('P8 seeded, base =', base);
}, 90000);

describe('P8 H3 win-back automation', () => {
  it('W1 run: exact per-branch counts across the seeded guest roster', async () => {
    const res = await request(app)
      .post(base + '/run')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({});
    expect(res.status).toBe(200);
    const d = res.body.data;
    // candidates pass basic filters: sends, noconsent, revoked, contacted
    expect(d.evaluated).toBe(4);
    expect(d.sent).toBe(1); // only 'sends'
    expect(d.suppressed.noConsent).toBe(2); // noconsent + revoked
    expect(d.suppressed.recentContact).toBe(1); // contacted
    expect(d.skipped.blacklisted).toBe(1);
    expect(d.skipped.noEmail).toBe(1);
    expect(d.skipped.recentStay).toBe(2); // recent + returned
    expect(d.dryRun).toBe(false);
  });

  it('W2 send handoff: exactly one queued win-back row, addressed to the consented lapsed guest', async () => {
    const rows = await prisma.emailLog.findMany({
      where: { tenantId: agent.tenantId, template: 'win-back' },
    });
    expect(rows.length).toBe(2); // 1 new + the 30-day-old seeded one
    const fresh = rows.find((r: any) => r.createdAt > new Date(Date.now() - 60000));
    expect(fresh).toBeTruthy();
    expect(fresh.to).toBe('p8-sends-' + runId + '@example.com');
    expect(fresh.status).toBe('queued');
    expect(fresh.relatedType).toBe('guest');
    expect(fresh.relatedId).toBe(g.sends);
    expect(fresh.payload.guestId).toBe(g.sends);
  });

  it('W3 duplicate-send rule holds across runs: immediate re-run sends nothing', async () => {
    const res = await request(app)
      .post(base + '/run')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({});
    const d = res.body.data;
    expect(d.sent).toBe(0);
    expect(d.suppressed.recentContact).toBe(2); // 'sends' (just emailed) + 'contacted'
    expect(d.suppressed.noConsent).toBe(2);
    const rows = await prisma.emailLog.count({
      where: { tenantId: agent.tenantId, template: 'win-back' },
    });
    expect(rows).toBe(2); // no new handoff rows
  });

  it('W4 dryRun evaluates everything and changes nothing', async () => {
    const res = await request(app)
      .post(base + '/run')
      .set('Authorization', 'Bearer ' + agent.token)
      .send({ dryRun: true, suppressionDays: 0 });
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.dryRun).toBe(true);
    expect(d.evaluated).toBe(4);
    expect(d.suppressed.noConsent).toBe(2); // E5 gate still applies in dryRun — consent is never bypassed
    expect(d.sent).toBe(2); // sends + contacted (window lifted); nothing written
    const rows = await prisma.emailLog.count({
      where: { tenantId: agent.tenantId, template: 'win-back' },
    });
    expect(rows).toBe(2); // unchanged
  });

  it('W5 tenant isolation: another tenant runs against an empty roster', async () => {
    const mod: any = await import('../helpers/server.js');
    const outsider = await mod.registerTestAgent(app);
    const res = await request(app)
      .post(base + '/run')
      .set('Authorization', 'Bearer ' + outsider.token)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.data.evaluated).toBe(0);
    expect(res.body.data.sent).toBe(0);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
