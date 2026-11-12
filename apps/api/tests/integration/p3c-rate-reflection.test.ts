/* P3-C — E1x rate-grid REFLECTION through the public quote path.
 * Pins: seasonal boundaries exact; DOW reflects only after POST /rules/evaluate
 * (manual-step semantics documented, not hidden); precedence consistency
 * (quote === override ledger row).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
let app: any;
let agent: any;
const ctx: Record<string, any> = {};

const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (base: Date, n: number) => new Date(base.getTime() + n * 86400_000);

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);
  const t = agent.tenantId;

  const code = ('P3C' + runId)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-12);
  const prop = await prisma.property.create({
    data: { tenantId: t, name: 'P3C', code },
  });
  const rt = await prisma.roomType.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      name: 'P3C RT',
      code: 'P3CRT' + runId.toUpperCase().slice(-4),
    },
  });
  await prisma.room.create({
    data: { tenantId: t, propertyId: prop.id, roomTypeId: rt.id, number: 'P3C-1' },
  });
  const plan = await prisma.ratePlan.create({
    data: {
      tenantId: t,
      propertyId: prop.id,
      roomTypeId: rt.id,
      name: 'P3C Base',
      code: 'P3CB' + runId.toUpperCase().slice(-4),
      baseRate: 1000,
      status: 'active',
    },
  });

  let friday: Date | null = null;
  for (let i = 10; i <= 17; i++) {
    const d = addDays(new Date(), i);
    if (d.getUTCDay() === 5) {
      friday = d;
      break;
    }
  }
  if (!friday) throw new Error('no Friday found in window');

  ctx.t = t;
  ctx.propId = prop.id;
  ctx.rtId = rt.id;
  ctx.planId = plan.id;
  ctx.code = code;
  ctx.fri = fmt(friday);
  ctx.fri2 = fmt(addDays(friday, 7));
  ctx.thu = fmt(addDays(friday, -1));
  ctx.sat = fmt(addDays(friday, 1));
  ctx.sun = fmt(addDays(friday, 2));
  ctx.mon = fmt(addDays(friday, 3));
  console.log('P3-C seeded', code, 'friday=' + ctx.fri);
}, 90000);

describe('P3-C rate grid reflection', () => {
  const H = () => ({ Authorization: 'Bearer ' + agent.token });

  const quote = async (ci: string, co: string): Promise<any> => {
    const r = await request(app)
      .get('/v1/public/properties/' + ctx.code + '/availability')
      .query({ checkIn: ci, checkOut: co });
    expect(r.status).toBe(200);
    const rt = (r.body.data?.roomTypes ?? []).find((x: any) => x.roomTypeId === ctx.rtId);
    if (!rt) console.log('QUOTE DEBUG', JSON.stringify(r.body.data).slice(0, 500));
    expect(rt).toBeTruthy();
    return rt;
  };

  it('S1: seasonal grid reflects with exact boundaries (in=1450, out=base)', async () => {
    const r = await request(app).post('/v1/rates/seasonal').set(H()).send({
      name: 'P3C High Season',
      roomTypeId: ctx.rtId,
      ratePlanId: ctx.planId,
      startDate: ctx.fri,
      endDate: ctx.sat,
      rate: 1450,
    });
    expect(r.status).toBe(201);
    ctx.seasonRuleId = r.body.data?.id;

    expect((await quote(ctx.thu, ctx.fri)).nightly[0].rate).toBe(1000);
    expect((await quote(ctx.fri, ctx.sat)).nightly[0].rate).toBe(1450);
    expect((await quote(ctx.sun, ctx.mon)).nightly[0].rate).toBe(1000);
    console.log('P3-C S1 OK — seasonal boundary exact');
  }, 60000);

  it('S2: DOW grid is inert at creation, reflects only after evaluate', async () => {
    const dow = await request(app)
      .post('/v1/rates/day-of-week')
      .set(H())
      .send({
        name: 'P3C Weekend',
        roomTypeId: ctx.rtId,
        ratePlanId: ctx.planId,
        daysOfWeek: [5, 6],
        adjustmentPercent: 10,
      });
    expect(dow.status).toBe(201);
    ctx.dowRuleId = dow.body.data?.id;

    // inert pin: Friday still prices at seasonal rate until evaluate runs
    expect((await quote(ctx.fri, ctx.sat)).nightly[0].rate).toBe(1450);

    const ev = await request(app)
      .post('/v1/rates/rules/evaluate')
      .set(H())
      .query({ propertyId: ctx.propId })
      .send({ from: ctx.fri, to: fmt(addDays(new Date(ctx.fri + 'T00:00:00Z'), 8)) });
    expect(ev.status).toBe(200);

    const friRate = (await quote(ctx.fri, ctx.sat)).nightly[0].rate;
    expect(friRate).toBe(1450);
    console.log(
      'P3-C precedence pinned: overlap Friday =',
      friRate,
      '(seasonal wins createdAt tie)'
    );

    const fri2Rate = (await quote(ctx.fri2, fmt(addDays(new Date(ctx.fri2 + 'T00:00:00Z'), 1))))
      .nightly[0].rate;
    expect(fri2Rate).toBe(1100);
    console.log('P3-C DOW proven: Friday outside seasonal window =', fri2Rate);

    const dayStart2 = new Date(ctx.fri2 + 'T00:00:00Z');
    const ov2 = await prisma.rateOverride.findFirst({
      where: {
        ratePlanId: ctx.planId,
        date: { gte: dayStart2, lt: new Date(dayStart2.getTime() + 86400_000) },
      },
    });
    expect(ov2).toBeTruthy();
    expect(Number(ov2.effectiveRate)).toBe(fri2Rate);

    const dayStart = new Date(ctx.fri + 'T00:00:00Z');
    const ov = await prisma.rateOverride.findFirst({
      where: {
        ratePlanId: ctx.planId,
        date: { gte: dayStart, lt: new Date(dayStart.getTime() + 86400_000) },
      },
    });
    expect(ov).toBeTruthy();
    expect(Number(ov.effectiveRate)).toBe(friRate);
    console.log(
      'P3-C override ledger consistent; winning ruleId =',
      ov.ruleId,
      '| dowRule =',
      ctx.dowRuleId,
      '| seasonRule =',
      ctx.seasonRuleId
    );

    expect(
      (await quote(ctx.mon, fmt(addDays(new Date(ctx.mon + 'T00:00:00Z'), 1)))).nightly[0].rate
    ).toBe(1000);
    console.log('P3-C S2 OK — DOW reflects via evaluate; Monday unaffected');
  }, 60000);
});

afterAll(async () => {
  await prisma.$disconnect();
});
