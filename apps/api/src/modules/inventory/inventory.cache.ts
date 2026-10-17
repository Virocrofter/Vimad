/* apps/api/src/modules/inventory/inventory.cache.ts — I1 perf groundwork.
 * Nightly snapshot of per-date sellable inventory. The live grid remains the
 * source of truth; this cache exists so heavy consumers (channel push, pace
 * reports, 200+ room properties) read pre-computed rows instead of re-running
 * the occupancy join on every request. Refreshed after night audit roll and
 * on demand via POST /v1/inventory/cache/refresh.
 */
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { dstr, eachDate, getGrid } from './inventory.service.js';

const CACHE_DAYS = 60; // one refresh covers a rolling 60-day window (engine range cap)

/** Recompute the cache for one property (or every active property). */
export async function refreshInventoryCache(propertyId?: string): Promise<number> {
  const properties = await prisma.property.findMany({
    where: { ...(propertyId ? { id: propertyId } : { status: 'active' }) },
    select: { id: true, tenantId: true },
    take: 50,
  });

  const from = dstr(new Date());
  const to = dstr(new Date(Date.now() + (CACHE_DAYS - 1) * 86_400_000));
  const dates = eachDate(from, to);
  let written = 0;

  for (const property of properties) {
    const roomTypes = await prisma.roomType.findMany({
      where: { propertyId: property.id, status: 'active' },
      select: { id: true },
    });
    for (const rt of roomTypes) {
      // Per-type recompute through the live engine facts (same math as the grid)
      const [totals, ooo, occ, held, restrictions, overbooking] = await Promise.all([
        prisma.room.groupBy({
          by: ['roomTypeId'],
          where: { propertyId: property.id },
          _count: { _all: true },
        }),
        prisma.room.groupBy({
          by: ['roomTypeId'],
          where: { propertyId: property.id, status: { in: ['ooo', 'out_of_order'] } },
          _count: { _all: true },
        }),
        prisma.$queryRaw<{ roomTypeId: string; date: string; count: bigint }[]>`
          SELECT r."roomTypeId", s.date::text AS date, COUNT(*)::bigint AS count
          FROM reservation_stays s
          JOIN rooms r ON r.id = s."roomId"
          JOIN reservations res ON res.id = s."reservationId"
          WHERE r."propertyId" = ${property.id}
            AND res.status IN ('confirmed','checked_in')
            AND s.date >= ${new Date(`${from}T00:00:00.000Z`)}::date
            AND s.date <= ${new Date(`${to}T00:00:00.000Z`)}::date
          GROUP BY r."roomTypeId", s.date
        `,
        prisma.inventoryAllocation.groupBy({
          by: ['roomTypeId', 'date'],
          where: {
            propertyId: property.id,
            status: 'active',
            date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
          },
          _sum: { quantity: true },
        }),
        prisma.inventoryRestriction.findMany({
          where: {
            propertyId: property.id,
            date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
          },
        }),
        prisma.inventoryOverbooking.findMany({ where: { roomTypeId: rt.id } }),
      ]);
      const total = totals.find((t) => t.roomTypeId === rt.id)?._count._all ?? 0;
      const oooCount = ooo.find((t) => t.roomTypeId === rt.id)?._count._all ?? 0;
      const ob = overbooking[0]?.limit ?? 0;
      const occMap = new Map(
        occ.filter((o) => o.roomTypeId === rt.id).map((o) => [o.date, Number(o.count)])
      );
      const heldMap = new Map(
        held.filter((h) => h.roomTypeId === rt.id).map((h) => [dstr(h.date), h._sum.quantity ?? 0])
      );
      const restrMap = new Map(
        restrictions.filter((r) => r.roomTypeId === rt.id).map((r) => [dstr(r.date), r.adjustment])
      );

      const rows = dates.map((date) => {
        const heldCount = heldMap.get(date) ?? 0;
        const adjustment = restrMap.get(date) ?? 0;
        const sellable = Math.max(total - oooCount - heldCount + adjustment, 0);
        const occupied = occMap.get(date) ?? 0;
        return {
          propertyId: property.id,
          roomTypeId: rt.id,
          date: new Date(`${date}T00:00:00.000Z`),
          total,
          ooo: oooCount,
          occupied,
          held: heldCount,
          adjustment,
          sellable,
          overbookingLimit: ob,
          remaining: sellable + ob - occupied,
        };
      });

      await prisma.$transaction([
        prisma.inventoryDailyCache.deleteMany({
          where: {
            propertyId: property.id,
            roomTypeId: rt.id,
            date: { gte: new Date(`${from}T00:00:00.000Z`) },
          },
        }),
        prisma.inventoryDailyCache.createMany({ data: rows }),
      ]);
      written += rows.length;
    }
  }

  logger.info({ properties: properties.length, rows: written }, 'inventory daily cache refreshed');
  return written;
}

/** Read cached rows (future consumers: channel push, pace reports). */
export async function readInventoryCache(propertyId: string, from: string, to: string) {
  return prisma.inventoryDailyCache.findMany({
    where: {
      propertyId,
      date: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T00:00:00.000Z`) },
    },
    orderBy: [{ roomTypeId: 'asc' }, { date: 'asc' }],
    take: 5000,
  });
}

/** Nightly refresh — 03:40 property-local-agnostic UTC, after night audit rolls. */
export function startInventoryCacheScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('40 3 * * *', async () => {
        await refreshInventoryCache().catch((err) =>
          logger.error({ err }, 'inventory cache refresh failed')
        );
      });
      logger.info('Inventory cache scheduler started (nightly 03:40 refresh)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — inventory cache scheduler disabled');
    });
}

// ─── [I1] Walk-plan alerts: flag tomorrow's oversold inventory as tasks ───
// DB-enforced dedupe (unique tenantId+dedupeKey) — the scan can run forever
// and never double-fires. Department management, urgent, due end of day.

export async function flagOverbookings(): Promise<number> {
  const tomorrow = dstr(new Date(Date.now() + 86_400_000));
  const properties = await prisma.property.findMany({
    where: { status: 'active' },
    select: { id: true, tenantId: true },
    take: 50,
  });
  let created = 0;
  for (const property of properties) {
    const grid = await getGrid(property.tenantId, property.id, tomorrow, tomorrow);
    for (const rt of grid.roomTypes) {
      const cell = rt.cells[0];
      if (!cell || !cell.oversold) continue;
      const overBy = cell.occupied - cell.sellable;
      try {
        await prisma.task.create({
          data: {
            tenantId: property.tenantId,
            propertyId: property.id,
            department: 'management',
            title:
              'Overbooked ' +
              tomorrow +
              ': ' +
              rt.name +
              ' is ' +
              overBy +
              ' room(s) over — arrange walks',
            description:
              rt.name +
              ' (' +
              rt.code +
              '): ' +
              cell.occupied +
              ' occupied vs ' +
              cell.sellable +
              ' sellable at ' +
              (grid.property?.name ?? property.id) +
              '. Overbooking allowance +' +
              cell.overbookingLimit +
              ' already included. Contact ' +
              overBy +
              ' guest(s) to walk, or add an adjustment if a room returns to service.',
            status: 'open',
            priority: 'urgent',
            dueAt: new Date(tomorrow + 'T16:00:00.000Z'),
            dedupeKey: 'inv-overbook:' + property.id + ':' + rt.id + ':' + tomorrow,
            source: 'rule',
            ruleKey: 'inventory-overbooking-alert',
            entityType: 'inventory',
            entityId: rt.id,
          },
        });
        created++;
      } catch (err) {
        if ((err as { code?: string }).code !== 'P2002') throw err;
      }
    }
  }
  if (created > 0) logger.info({ created, date: tomorrow }, 'overbooking walk-plan alerts created');
  return created;
}

export function startOverbookingAlertScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('0 8,14 * * *', async () => {
        await flagOverbookings().catch((err) =>
          logger.error({ err }, 'overbooking alert scan failed')
        );
      });
      logger.info('Overbooking alert scheduler started (08:00 + 14:00 daily)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — overbooking alert scheduler disabled');
    });
}
