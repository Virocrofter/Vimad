/* apps/api/scripts/seed-profiler.ts — idempotent demo population for the system profiler */
import 'dotenv/config';
import { prisma } from '../src/common/prisma.js';

const FP = [
  [
    'fp:res-list',
    'Reservation.findMany({ take: 50, include: { guest: true, property: true, stays: { include: { room: { include: { roomType: true } } } }, folio: true } })',
  ],
  [
    'fp:guest-merge',
    'guest.findMany({ where: { email: { contains: ... } }, include: { reservations: true, loyaltyTransactions: true } })',
  ],
  ['fp:avail-grid', 'inventoryDailyCache.findMany({ where: { propertyId, date: { gte, lte } } })'],
  ['fp:folio-post', 'folioItem.create({ data: { folioId, amount } }) + folio.update balance'],
  ['fp:night-audit', 'nightAudit.create({ steps }) + reservationStays batch'],
  ['fp:channel-push', 'channelPushLog.create({ payload }) + http push booking.com'],
  ['fp:rate-grid', 'rateOverride.upsert({ ratePlanId, date })'],
  [
    'fp:hk-board',
    'housekeepingTask.findMany({ where: { status: pending }, include: { room: true, assignee: true } })',
  ],
  ['fp:ar-aging', 'arInvoice.groupBy({ by: [corporateAccountId], _sum: total })'],
  ['fp:chat-unread', 'chatMessage.updateMany({ readAt }) where threadId'],
  ['fp:meal-post', 'mealPlanPosting.upsert({ assignmentId, date })'],
  ['fp:loyalty-earn', 'loyaltyTransaction.create + guest.update points'],
];

async function main() {
  await prisma
    .$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`)
    .catch(() => {});
  const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' }, take: 8 });
  if (!tenants.length) throw new Error('No tenants found — run the main seed first');

  for (const [fp, q] of FP) {
    const prev = await prisma.profilerQuerySnapshot.findFirst({
      where: { fingerprint: fp },
      orderBy: { capturedAt: 'desc' },
    });
    const mean = prev?.meanTimeMs ?? 80 + Math.random() * 500;
    const grown = mean * (0.9 + Math.random() * 0.5);
    await prisma.profilerQuerySnapshot.create({
      data: {
        fingerprint: fp,
        query: q,
        calls: 500 + Math.floor(Math.random() * 20000),
        totalTimeMs: grown * (500 + Math.random() * 20000),
        meanTimeMs: grown,
        rows: 100 + Math.random() * 9000,
        capturedAt: new Date(Date.now() - 24 * 36e5),
      },
    });
    await prisma.profilerQuerySnapshot.create({
      data: {
        fingerprint: fp,
        query: q,
        calls: 500 + Math.floor(Math.random() * 20000),
        totalTimeMs: grown * (500 + Math.floor(Math.random() * 20000)) * 1.1,
        meanTimeMs: grown * 1.12,
        rows: 100 + Math.random() * 9000,
      },
    });
  }

  await prisma.profilerSlowQuery.deleteMany({ where: { query: { startsWith: '[seed]' } } });
  const routes = [
    '/v1/reservations',
    '/v1/guests',
    '/v1/inventory/availability',
    '/v1/folios',
    '/v1/rates/grid',
    '/v1/housekeeping/board',
  ];
  for (let i = 0; i < 20; i++) {
    const t = tenants[i % tenants.length];
    await prisma.profilerSlowQuery.create({
      data: {
        tenantId: t.id,
        route: routes[i % routes.length],
        query: `[seed] ${FP[i % FP.length][1]}`,
        durationMs: 320 + Math.random() * 3200,
        rows: Math.floor(Math.random() * 5000),
        createdAt: new Date(Date.now() - Math.random() * 20 * 36e5),
      },
    });
  }

  for (const t of tenants) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "profiler_tenant_costs" ("tenantId","queries","totalTimeMs","slowQueries","updatedAt")
      VALUES ($1,$2,$3,$4,now()) ON CONFLICT ("tenantId") DO UPDATE SET
        "queries" = EXCLUDED."queries", "totalTimeMs" = EXCLUDED."totalTimeMs",
        "slowQueries" = EXCLUDED."slowQueries", "updatedAt" = now()`,
      t.id,
      10000 + Math.floor(Math.random() * 90000),
      100000 + Math.random() * 900000,
      Math.floor(Math.random() * 12)
    );
  }

  const snap = {
    snapshots: await prisma.profilerQuerySnapshot.count(),
    events: await prisma.profilerSlowQuery.count(),
  };
  console.log('SEED OK', snap);
}
main().finally(() => prisma.$disconnect());
