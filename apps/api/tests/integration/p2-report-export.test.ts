import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// P2-C — Report export live verification (0.2)
const API = { reservations: '/v1/reservations', reports: '/v1/reports' };
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing-min-32-chars';
const prisma = new PrismaClient();

type Ctx = {
  app: any;
  runId: string;
  tenantId: string;
  propertyId: string;
  roomTypeId: string;
  roomId: string;
  token: string;
  names: string[];
};
const ctx = {} as Ctx;
const day = (o: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + o);
  return d.toISOString().slice(0, 10);
};
const pickId = (b: any): string | undefined => b?.id ?? b?.data?.id ?? b?.run?.id;
const authed = (req: any) => req.set('Authorization', `Bearer ${ctx.token}`);

async function buildApp(): Promise<any> {
  const helpers = await import('../helpers/server');
  const fn = Object.values(helpers).find((v) => typeof v === 'function');
  const out: any = await (fn as any)();
  return out?.app ?? out?.server ?? out;
}

const runReport = (payload: any) =>
  authed(request(ctx.app).post(`${API.reports}/run`)).send(payload);
const exportRun = (runId: string) =>
  authed(request(ctx.app).get(`${API.reports}/runs/${runId}/export?as=json`));

beforeAll(async () => {
  ctx.runId = `p2c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  ctx.app = await buildApp();
  const t = await prisma.tenant.create({ data: { name: 'P2C Tenant', slug: `${ctx.runId}-t` } });
  ctx.tenantId = t.id;
  const p = await prisma.property.create({
    data: {
      tenantId: t.id,
      name: 'P2C Prop',
      code: ctx.runId.slice(-8).toUpperCase(),
      timezone: 'UTC',
      currency: 'ZAR',
    },
  });
  ctx.propertyId = p.id;
  const rt = await prisma.roomType.create({
    data: {
      tenantId: t.id,
      propertyId: p.id,
      name: 'P2C Type',
      code: 'P2',
      baseOccupancy: 2,
      maxOccupancy: 2,
    },
  });
  ctx.roomTypeId = rt.id;
  const room = await prisma.room.create({
    data: { tenantId: t.id, propertyId: p.id, roomTypeId: rt.id, number: '101' },
  });
  ctx.roomId = room.id;
  const owner = await prisma.user.create({
    data: {
      tenantId: t.id,
      email: `${ctx.runId}@t.local`,
      firstName: 'P2',
      lastName: 'Owner',
      role: 'owner',
    },
  });
  const ownerRole = await prisma.role.findFirst({ where: { name: 'Owner', tenantId: null } });
  if (ownerRole)
    await prisma.roleAssignment.create({ data: { userId: owner.id, roleId: ownerRole.id } });
  ctx.token = jwt.sign({ userId: owner.id, tenantId: t.id, role: 'owner' }, JWT_SECRET, {
    expiresIn: '2h',
  });

  ctx.names = [];
  for (const off of [20, 21, 22, 30]) {
    const g = await prisma.guest.create({
      data: { tenantId: t.id, firstName: 'Exp', lastName: `Guest${off}` },
    });
    ctx.names.push(`Exp Guest${off}`);
    const r = await authed(request(ctx.app).post(API.reservations))
      .set('Idempotency-Key', `${ctx.runId}-seed-${off}`)
      .send({
        guestId: g.id,
        propertyId: p.id,
        roomId: room.id,
        arrivalDate: day(off),
        departureDate: day(off + 1),
        nights: 1,
        adults: 1,
        source: 'direct',
      });
    expect(r.status, `seed ${off}: ${r.status} ${JSON.stringify(r.body)}`).toBeLessThan(300);
  }
}, 120_000);

afterAll(async () => {
  if (ctx.tenantId) await prisma.tenant.delete({ where: { id: ctx.tenantId } }).catch(() => {});
  await prisma.$disconnect();
});

const runAndExport = async (dateFrom: string, dateTo: string) => {
  const run = await runReport({
    definitionKey: 'arrivals_departures',
    params: { dateFrom, dateTo, mode: 'BOTH', propertyId: ctx.propertyId },
  });
  expect(run.status, `run failed: ${run.status} ${JSON.stringify(run.body)}`).toBeLessThan(300);
  const runId = pickId(run.body)!;
  expect(runId).toBeTruthy();
  const exp = await exportRun(runId);
  expect(exp.status, `export failed: ${exp.status} ${JSON.stringify(exp.body)}`).toBeLessThan(300);
  let content = '';
  if (typeof exp.body === 'string') content = exp.body;
  else content = exp.body?.data?.content ?? exp.body?.content ?? '';
  expect(content.length, `empty export for run ${runId}`).toBeGreaterThan(0);
  return { run, runId, content };
};

describe('P2-C report export verification (0.2)', () => {
  it('filters/date params bound the export to the requested window exactly', async () => {
    const full = await runAndExport(day(20), day(23));
    const narrow = await runAndExport(day(21), day(22));

    const rowCount = (r: any) => r.run.body?.rowCount ?? r.run.body?.data?.rowCount ?? 0;
    expect(rowCount(full), `full run: ${JSON.stringify(full.run.body)}`).toBeGreaterThan(0);
    expect(rowCount(narrow), `narrow run: ${JSON.stringify(narrow.run.body)}`).toBeGreaterThan(0);
    expect(rowCount(narrow)).toBeLessThan(rowCount(full));

    // date-anchored window checks: stay dates must fall INSIDE the requested
    // window on BOTH ends. This is the detector that catches the UTC-offset
    // leak (a row dated day(20) must never appear in the day(21)..day(22) run).
    expect(full.content).toContain(`${day(20)},`);
    expect(full.content).toContain(`${day(23)},`);
    expect(narrow.content).toContain(`${day(21)},`);
    expect(narrow.content).toContain(`${day(22)},`);
    expect(narrow.content).not.toContain(`${day(20)},`);
    expect(narrow.content).not.toContain(`${day(23)},`);
    for (const n of [ctx.names[0], ctx.names[1], ctx.names[2]]) {
      expect(full.content).toContain(n);
    }
    expect(full.content).not.toContain(ctx.names[3]);
    expect(narrow.content).not.toContain(ctx.names[3]);
  }, 120_000);

  it('a failed/invalid request surfaces as an error, never as an empty export', async () => {
    const unknown = await runReport({
      definitionKey: 'no_such_report_xyz',
      params: { dateFrom: day(20), dateTo: day(23) },
    });
    expect(unknown.status).toBeGreaterThanOrEqual(400);
    expect(unknown.status).toBeLessThan(500);

    const exp404 = await exportRun('does-not-exist');
    expect(exp404.status).toBeGreaterThanOrEqual(400);
    expect(exp404.status).toBeLessThan(500);
  }, 60_000);
});
