/* apps/api/src/modules/dashboard/dashboard-deltas.service.ts
 * D3 — KPI deltas: yesterday vs today + 7-day averages, so the command
 * center cards show trend, not just point-in-time. Mirrors the math in
 * dashboard.service.ts (business date, stay-based occupancy, folio-item
 * revenue). Note: the occupancy denominator uses current out-of-order
 * rooms — historical OOO state isn't tracked, so deltas are approximate
 * to that extent (fine for trend arrows).
 */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function getKpiDeltas(tenantId: string, propertyId?: string) {
  const property = await prisma.property.findFirst({
    where: propertyId ? { id: propertyId, tenantId } : { tenantId },
    orderBy: { createdAt: 'asc' },
  });
  if (!property) throw new AppError(404, 'Property not found', 'PROPERTY_NOT_FOUND');

  const pid = property.id;
  const bd = startOfDay(property.currentBusinessDate);
  const yd = addDays(bd, -1);
  const weekStart = addDays(bd, -7); // last 7 complete days

  const [sellableRooms, yStays, weekStays, yItems, weekItems] = await Promise.all([
    prisma.room.count({
      where: { tenantId, propertyId: pid, status: { notIn: ['out_of_order', 'maintenance'] } },
    }),
    prisma.reservationStay.findMany({
      where: { date: yd, reservation: { tenantId, propertyId: pid } },
      select: { roomId: true },
      distinct: ['roomId'],
    }),
    prisma.reservationStay.findMany({
      where: { date: { gte: weekStart, lt: bd }, reservation: { tenantId, propertyId: pid } },
      select: { roomId: true, date: true },
      distinct: ['roomId', 'date'],
    }),
    prisma.folioItem.aggregate({
      where: {
        postedAt: { gte: yd, lt: bd },
        folio: { reservation: { tenantId, propertyId: pid } },
      },
      _sum: { amount: true },
    }),
    prisma.folioItem.findMany({
      where: {
        postedAt: { gte: weekStart, lt: bd },
        folio: { reservation: { tenantId, propertyId: pid } },
      },
      select: { amount: true, postedAt: true },
    }),
  ]);

  const revenueYesterday = Number(yItems._sum.amount ?? 0);
  const occupancyYesterday =
    sellableRooms > 0 ? round2((yStays.length / sellableRooms) * 100) : null;

  // 7-day buckets
  const dayKey = (d: Date) => startOfDay(d).toISOString();
  const occByDay = new Map<string, Set<string>>();
  for (const s of weekStays) {
    const k = dayKey(s.date);
    if (!occByDay.has(k)) occByDay.set(k, new Set());
    occByDay.get(k)!.add(s.roomId);
  }
  const revByDay = new Map<string, number>();
  for (const i of weekItems) {
    const k = dayKey(i.postedAt);
    revByDay.set(k, (revByDay.get(k) ?? 0) + Number(i.amount));
  }

  const occupancy7d =
    sellableRooms > 0 && occByDay.size > 0
      ? round2(
          ([...occByDay.values()].reduce((n, set) => n + set.size / sellableRooms, 0) /
            occByDay.size) *
            100
        )
      : null;
  const revenue7d =
    revByDay.size > 0
      ? round2([...revByDay.values()].reduce((a, b) => a + b, 0) / revByDay.size)
      : null;

  return {
    yesterday: {
      date: yd.toISOString().slice(0, 10),
      occupancyRate: occupancyYesterday,
      revenue: revenueYesterday,
    },
    averages: { occupancyRate7d: occupancy7d, revenue7d },
  };
}
