/* P6 — Today-dashboard vertical slice (roadmap #8, addendum F).
 * Seeds one business day: 2 in-house (one due out, unsettled), 1 arriving,
 * 1 checked out this morning, 1 future; 3 active rooms (1 ready), an
 * overdue task, an errored channel connection, a failed payment, and
 * revenue via reservation_stays.
 * T1 endpoint shape + business date + freshness; T2 today-at-a-glance counts;
 * T3 critical attention strip (addendum region 2); T4 front-desk worklist
 * with lifecycle-derived validActions; T5 revenue math with stated
 * definitions; T6 never-false-zero contract; T7 tenant isolation.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma: any = new PrismaClient();
const runId = Date.now().toString(36);
const propCode =
  'P6' +
  runId
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-6);

let app: any;
let agent: any;
const ctx: Record<string, any> = {};

// All seed dates anchor to the PROPERTY'S business date, never the wall
// clock: near a midnight boundary the local calendar day and the server's
// business date can differ by one day (observed: UTC+2 local vs UTC server),
// and every dashboard query keys off the business date.
let baseMidnight = new Date();
function setBusinessDay(bd: Date) {
  baseMidnight = new Date(bd.getFullYear(), bd.getMonth(), bd.getDate());
}
function todayAt(hour: number): Date {
  const d = new Date(baseMidnight);
  d.setHours(hour, 0, 0, 0);
  return d;
}
function day(offset: number): Date {
  const d = todayAt(12);
  d.setDate(d.getDate() + offset);
  return d;
}

beforeAll(async () => {
  const mod: any = await import('../helpers/server.js');
  app = mod.buildTestApp?.() ?? mod.app;
  agent = await mod.registerTestAgent(app);

  const t = await prisma.tenant.findUnique({ where: { id: agent.tenantId } });
  const prop = await prisma.property.create({
    data: { tenantId: t.id, name: 'P6 Today Hotel', code: propCode },
  });
  ctx.propertyId = prop.id;
  setBusinessDay(prop.currentBusinessDate); // seeds live on the business date
  const p2 = (n: number) => String(n).padStart(2, '0');
  ctx.businessDay =
    prop.currentBusinessDate.getFullYear() +
    '-' +
    p2(prop.currentBusinessDate.getMonth() + 1) +
    '-' +
    p2(prop.currentBusinessDate.getDate());
  const rt = await prisma.roomType.create({
    data: { tenantId: t.id, propertyId: prop.id, name: 'P6 Type', code: 'P6RT' },
  });
  const mkRoom = (num: string, hk: string, svc: string) =>
    prisma.room.create({
      data: {
        tenantId: t.id,
        propertyId: prop.id,
        roomTypeId: rt.id,
        number: num,
        housekeepingStatus: hk,
        serviceStatus: svc,
      },
    });
  ctx.r1 = await mkRoom('P6-1', 'ready', 'active');
  ctx.r2 = await mkRoom('P6-2', 'clean', 'active');
  await mkRoom('P6-3', 'dirty', 'active');
  await mkRoom('P6-4', 'ready', 'ooo'); // ready but blocked — must not count as ready-to-sell

  const mkGuest = (tag: string) =>
    prisma.guest.create({
      data: { tenantId: t.id, firstName: 'P6', lastName: tag },
    });
  let confSeq = 100;
  const mkRes = async (tag: string, status: string, arr: Date, dep: Date, extra: any = {}) => {
    const g = await mkGuest(tag);
    return prisma.reservation.create({
      data: {
        tenantId: t.id,
        propertyId: prop.id,
        guestId: g.id,
        confirmationNumber: 'P6-' + runId.toUpperCase() + '-' + confSeq++,
        status,
        arrivalDate: arr,
        departureDate: dep,
        nights: 1,
        totalAmount: 1000,
        balance: 0,
        ...extra,
      },
    });
  };

  // In house, due out TODAY, unsettled folio
  ctx.dueOut = await mkRes('Dueout', 'checked_in', day(-1), day(0), { checkedInAt: todayAt(14) });
  await prisma.folio.create({
    data: { tenantId: t.id, reservationId: ctx.dueOut.id, balance: 100, totalCharges: 100 },
  });
  // In house, staying over
  ctx.staying = await mkRes('Staying', 'checked_in', day(-1), day(2), { checkedInAt: todayAt(15) });
  // Arriving today
  ctx.arriving = await mkRes('Arriving', 'confirmed', day(0), day(1), { eta: '14:30' });
  // Checked out this morning
  await mkRes('Gone', 'checked_out', day(-1), day(0), {
    checkedInAt: todayAt(13),
    checkedOutAt: todayAt(8),
  });
  // Future — must NOT appear in today's numbers
  await mkRes('Future', 'confirmed', day(5), day(6));

  // Tonight's room revenue: both in-house stays occupy rooms tonight
  await prisma.reservationStay.create({
    data: { reservationId: ctx.dueOut.id, roomId: ctx.r1.id, date: day(0), rate: 1000 },
  });
  await prisma.reservationStay.create({
    data: { reservationId: ctx.staying.id, roomId: ctx.r2.id, date: day(0), rate: 1000 },
  });

  await prisma.task.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      department: 'housekeeping',
      title: 'Overdue turnover',
      status: 'open',
      dueAt: new Date(Date.now() - 3600_000),
    },
  });
  await prisma.channelConnection.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      provider: 'channex',
      hotelId: 'HTL-P6',
      apiKey: 'k6',
      status: 'error',
      lastSyncStatus: 'failed',
      lastSyncAt: new Date(Date.now() - 3600_000),
    },
  });
  await prisma.payment.create({
    data: {
      tenantId: t.id,
      propertyId: prop.id,
      reference: 'P6-FAIL-' + runId,
      amountMinor: 5000,
      type: 'card',
      status: 'failed',
      failureReason: 'card declined',
    },
  });
  await prisma.auditLog.create({
    data: {
      tenantId: t.id,
      userId: agent.userId,
      action: 'reservation.check_in',
      entity: 'reservation',
      entityId: ctx.dueOut.id,
    },
  });

  // Endpoint discovery (existing dashboard router may occupy other paths)
  const candidates = ['/v1/dashboard/today', '/v1/today', '/v1/dashboard/today/view'];
  for (const c of candidates) {
    const res = await request(app)
      .get(c + '?propertyId=' + prop.id)
      .set('Authorization', 'Bearer ' + agent.token);
    console.log('P6 probe', c, '->', res.status);
    if (res.status !== 404) {
      ctx.path = c;
      ctx.probeBody = res.body;
      break;
    }
  }
  expect(ctx.path, 'today endpoint discovered').toBeTruthy();
  console.log('P6 seeded', propCode);
}, 90000);

describe('P6 Today dashboard', () => {
  async function getToday(token?: string) {
    return request(app)
      .get(ctx.path + '?propertyId=' + ctx.propertyId)
      .set('Authorization', 'Bearer ' + (token ?? agent.token));
  }

  it('T1 endpoint shape: business date, generatedAt freshness, all regions', async () => {
    const res = await getToday();
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.businessDate).toBe(ctx.businessDay);
    expect(Date.parse(d.generatedAt)).not.toBeNaN();
    expect(Array.isArray(d.critical)).toBe(true);
    expect(d.today).toBeTruthy();
    expect(d.frontDesk).toBeTruthy();
    expect(d.revenue).toBeTruthy();
    expect(Array.isArray(d.activity)).toBe(true);
    expect(d.property.code).toBe(propCode);
  });

  it('T2 today at a glance: exact counts for the seeded business day', async () => {
    const d = (await getToday()).body.data;
    expect(d.today.arrivals).toBe(1);
    expect(d.today.dueOut).toBe(1);
    expect(d.today.inHouse).toBe(2);
    expect(d.today.checkedOutToday).toBe(1);
    expect(d.today.roomsReady).toBe(1); // P6-1 only; P6-4 is ooo
    expect(d.today.roomsTotal).toBe(3); // active rooms only
    expect(d.today.openTasks).toBe(1);
    expect(d.today.overdueTasks).toBe(1);
    expect(typeof d.today.dayUse).toBe('number'); // reserved, zero until UX-02
  });

  it('T3 critical attention strip: seeded exceptions surface with items + actions', async () => {
    const d = (await getToday()).body.data;
    const byType = Object.fromEntries(d.critical.map((c: any) => [c.type, c]));
    expect(byType.channel_sync_failure.count).toBe(1);
    expect(byType.channel_sync_failure.items[0].label).toContain('channex');
    expect(byType.payment_failure.count).toBe(1);
    expect(byType.payment_failure.items[0].label).toContain('P6-FAIL');
    expect(byType.due_out_unsettled.count).toBe(1);
    expect(byType.due_out_unsettled.items[0].label).toContain('P6-');
    expect(byType.overdue_task.count).toBe(1);
    for (const c of d.critical) {
      expect(['critical', 'high']).toContain(c.severity);
      expect(typeof c.recommendedAction).toBe('string');
      expect(Array.isArray(c.items)).toBe(true);
    }
  });

  it('T4 front-desk worklist: lifecycle-derived validActions (matrix pays off)', async () => {
    const d = (await getToday()).body.data;
    expect(d.frontDesk.arrivals.length).toBe(1);
    expect(d.frontDesk.arrivals[0].validActions).toContain('check-in');
    expect(d.frontDesk.arrivals[0].eta).toBe('14:30');
    expect(d.frontDesk.arrivals[0].link).toContain('/reservations/');
    expect(d.frontDesk.dueOut.length).toBe(1);
    expect(d.frontDesk.dueOut[0].validActions).toContain('check-out');
    expect(d.frontDesk.dueOut[0].validActions).not.toContain('check-in');
    expect(d.frontDesk.dueOut[0].flags).toContain('unsettled_balance');
    expect(d.frontDesk.dueOut[0].balance).toBe(100);
  });

  it('T5 revenue snapshot: stated definitions, honest math', async () => {
    const d = (await getToday()).body.data;
    const r = d.revenue;
    expect(r.roomRevenueToday).toBe(2000);
    expect(r.occupiedTonight).toBe(2);
    expect(r.roomsTotal).toBe(3);
    expect(r.occupancyPct).toBeCloseTo(66.67, 1);
    expect(r.adr).toBe(1000);
    expect(r.revpar).toBeCloseTo(666.67, 1);
    expect(r.definitions).toContain('reservation_stays');
    expect(Date.parse(r.computedAt)).not.toBeNaN();
  });

  it('T6 never-false-zero: counts are numbers, activity carries audit fields', async () => {
    const d = (await getToday()).body.data;
    for (const v of Object.values(d.today)) expect(typeof v).toBe('number');
    for (const c of d.critical) expect(typeof c.count).toBe('number');
    expect(d.activity.length).toBeGreaterThan(0);
    expect(d.activity[0].action).toBe('reservation.check_in');
    expect(d.activity[0].entity).toBe('reservation');
  });

  it('T7 tenant isolation: another tenant cannot read this property', async () => {
    const mod: any = await import('../helpers/server.js');
    const outsider = await mod.registerTestAgent(app);
    const res = await getToday(outsider.token);
    expect(res.status).toBe(404);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
