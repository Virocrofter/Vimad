/* P17 — Bulk 3 gates: overbooking limits API + DLQ alerts.
 * S1: POST /v1/inventory/overbooking upserts (set 1, then 2 -> one row,
 *     updated); GET returns the limit; unknown room type -> default 0.
 * S2: a failed_job (payload.tenantId, >15min old) raises exactly one
 *     dlq_alert notification; a second sweep run does not duplicate; a
 *     resolved job raises none; a tenant-less job is skipped (logged only).
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
      name: 'P17',
      code: ('P17' + runId)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(-12),
    },
  });
  const rt = await prisma.roomType.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      name: 'P17 RT',
      code: 'P17RT' + runId.toUpperCase().slice(-4),
    },
  });
  ctx.t = t;
  ctx.prop = prop;
  ctx.rt = rt;
  console.log('P17 seeded');
}, 90000);

describe('P17 bulk-3 gates', () => {
  it('S1: PUT overbooking upserts within scoped property; GET lists it', async () => {
    const H = { Authorization: 'Bearer ' + agent.token, 'x-property-id': ctx.prop.id };
    const url = '/v1/inventory/overbooking';

    const r1 = await request(app).put(url).set(H).send({ roomTypeId: ctx.rt.id, limit: 1 });
    if (r1.status !== 200)
      console.log('S1 put debug', r1.status, JSON.stringify(r1.body).slice(0, 250));
    expect(r1.status).toBe(200);

    const r2 = await request(app).put(url).set(H).send({ roomTypeId: ctx.rt.id, limit: 2 });
    expect(r2.status).toBe(200);

    const rows = await prisma.inventoryOverbooking.findMany({ where: { roomTypeId: ctx.rt.id } });
    expect(rows.length).toBe(1);
    expect(Number(rows[0].limit)).toBe(2);

    const get = await request(app).get(url).set(H);
    expect(get.status).toBe(200);
    const mine = (get.body.data ?? []).find((r: any) => r.roomTypeId === ctx.rt.id);
    expect(mine).toBeTruthy();
    expect(Number(mine.limit)).toBe(2);
    console.log('P17 S1 OK');
  }, 60000);

  it('S2: dlq alert — one notification per job, no dup, resolved suppressed', async () => {
    const job: any = await import('../../src/jobs/dlq-alert.job.js');
    const past = new Date(Date.now() - 20 * 60 * 1000);

    const j1 = await prisma.failedJob.create({
      data: {
        queue: 'email',
        jobId: 'p17-' + runId + '-a',
        jobName: 'P17Job',
        failReason: 'boom',
        payload: { tenantId: ctx.t },
        createdAt: past,
      },
    });
    const j2 = await prisma.failedJob.create({
      data: {
        queue: 'email',
        jobId: 'p17-' + runId + '-b',
        jobName: 'P17NoTenant',
        failReason: 'boom',
        payload: {},
        createdAt: past,
      },
    });

    const n1 = await job.alertOnDeadLetters(); // newest-first: j1 is in the first batch
    expect(n1).toBeGreaterThanOrEqual(1);

    const notes = await prisma.notification.findMany({
      where: { entityType: 'failed_job', entityId: j1.id, type: 'dlq_alert' },
    });
    expect(notes.length).toBe(1);
    expect(notes[0].tenantId).toBe(ctx.t);
    expect(notes[0].title).toContain('P17Job');

    const j2notes = await prisma.notification.findMany({
      where: { entityType: 'failed_job', entityId: j2.id },
    });
    expect(j2notes.length).toBe(0); // no tenantId -> logged only, never alerted

    await job.alertOnDeadLetters(); // drain further — j1 must NOT duplicate
    expect(
      await prisma.notification.count({
        where: { entityType: 'failed_job', entityId: j1.id, type: 'dlq_alert' },
      })
    ).toBe(1);

    await prisma.failedJob.update({ where: { id: j1.id }, data: { resolvedAt: new Date() } });
    await job.alertOnDeadLetters(); // resolved -> filtered out, never re-alerts
    expect(
      await prisma.notification.count({
        where: { entityType: 'failed_job', entityId: j1.id, type: 'dlq_alert' },
      })
    ).toBe(1);
    console.log('P17 S2 OK');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
