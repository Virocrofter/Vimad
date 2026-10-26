/* apps/api/src/modules/dashboard/ops-today.service.ts
 * D2 — "Today" operational snapshot for the command center:
 * check-in / check-out progress, room-turnaround progress, task snapshot,
 * VIP arrivals, and un-settled departures. All aggregates derive from the
 * property's current business date, mirroring dashboard.service.ts helpers.
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

export async function getOpsToday(tenantId: string, propertyId?: string) {
  const property = await prisma.property.findFirst({
    where: propertyId ? { id: propertyId, tenantId } : { tenantId },
    orderBy: { createdAt: 'asc' },
  });
  if (!property) {
    throw new AppError(404, 'Property not found', 'PROPERTY_NOT_FOUND');
  }

  const pid = property.id;
  const bd = startOfDay(property.currentBusinessDate);
  const next = addDays(bd, 1);
  const ACTIVE = { notIn: ['cancelled', 'no_show'] };

  const [
    arrivalRows,
    departureRows,
    turnedToday,
    dirtyNow,
    inspectedNow,
    taskRows,
    vipArrivalRows,
    unsettledRows,
  ] = await Promise.all([
    prisma.reservation.groupBy({
      by: ['status'],
      where: { tenantId, propertyId: pid, arrivalDate: { gte: bd, lt: next }, status: ACTIVE },
      _count: { _all: true },
    }),
    prisma.reservation.groupBy({
      by: ['status'],
      where: { tenantId, propertyId: pid, departureDate: { gte: bd, lt: next }, status: ACTIVE },
      _count: { _all: true },
    }),
    prisma.housekeepingTask.count({
      where: { tenantId, propertyId: pid, completedAt: { gte: bd, lt: next } },
    }),
    prisma.room.count({
      where: { tenantId, propertyId: pid, housekeepingStatus: { in: ['dirty', 'cleaning'] } },
    }),
    prisma.room.count({
      where: { tenantId, propertyId: pid, housekeepingStatus: 'inspected' },
    }),
    prisma.task.findMany({
      where: { tenantId, propertyId: pid, status: { in: ['open', 'in_progress'] } },
      select: {
        id: true,
        title: true,
        department: true,
        status: true,
        priority: true,
        slaBreached: true,
        dueAt: true,
      },
      orderBy: [{ slaBreached: 'desc' }, { dueAt: 'asc' }],
      take: 50,
    }),
    prisma.reservation.findMany({
      where: {
        tenantId,
        propertyId: pid,
        arrivalDate: { gte: bd, lt: next },
        status: { in: ['confirmed', 'checked_in'] },
        guest: { vipStatus: { not: null } },
      },
      include: {
        guest: { select: { firstName: true, lastName: true, vipStatus: true } },
        roomType: { select: { name: true } },
      },
      orderBy: { arrivalDate: 'asc' },
      take: 10,
    }),
    prisma.reservation.findMany({
      where: {
        tenantId,
        propertyId: pid,
        departureDate: { gte: bd, lt: next },
        status: { in: ['checked_in', 'checked_out'] },
        folio: { balance: { gt: 0 } },
      },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        folio: { select: { balance: true } },
        stays: {
          where: { date: { gte: bd, lt: next } },
          include: { room: { select: { number: true } } },
          take: 1,
        },
      },
      orderBy: { departureDate: 'asc' },
      take: 50,
    }),
  ]);

  const sum = (rows: { status: string; _count: { _all: number } }[]) =>
    rows.reduce((n, r) => n + r._count._all, 0);

  const arrivalsTotal = sum(arrivalRows);
  const arrivalsDone = sum(arrivalRows.filter((r) => r.status !== 'confirmed'));
  const departuresTotal = sum(departureRows);
  const departuresDone = sum(departureRows.filter((r) => r.status === 'checked_out'));

  const open = taskRows.filter((t) => t.status === 'open');
  const inProgress = taskRows.filter((t) => t.status === 'in_progress');
  const slaBreached = taskRows.filter((t) => t.slaBreached);
  const byDepartmentMap = new Map<
    string,
    { department: string; count: number; slaBreached: number }
  >();
  for (const t of taskRows) {
    const entry = byDepartmentMap.get(t.department) ?? {
      department: t.department,
      count: 0,
      slaBreached: 0,
    };
    entry.count += 1;
    if (t.slaBreached) entry.slaBreached += 1;
    byDepartmentMap.set(t.department, entry);
  }
  const byDepartment = [...byDepartmentMap.values()].sort((a, b) => b.count - a.count).slice(0, 6);

  const unsettled = unsettledRows
    .map((r) => ({
      id: r.id,
      confirmationNumber: r.confirmationNumber,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      roomNumber: r.stays[0]?.room.number ?? null,
      balance: Number(r.folio?.balance ?? 0),
    }))
    .sort((a, b) => b.balance - a.balance);

  return {
    businessDate: bd.toISOString().slice(0, 10),
    arrivals: { total: arrivalsTotal, done: arrivalsDone },
    departures: { total: departuresTotal, done: departuresDone },
    rooms: {
      turnedToday,
      dirty: dirtyNow,
      inspected: inspectedNow,
      turnaroundTarget: turnedToday + dirtyNow,
    },
    tasks: {
      open: open.length,
      inProgress: inProgress.length,
      slaBreached: slaBreached.length,
      byDepartment,
      top: slaBreached.slice(0, 3).map((t) => ({
        id: t.id,
        title: t.title,
        department: t.department,
        priority: t.priority,
      })),
    },
    vipArrivals: vipArrivalRows.map((r) => ({
      id: r.id,
      confirmationNumber: r.confirmationNumber,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      vipStatus: r.guest.vipStatus,
      roomType: r.roomType?.name ?? null,
      notes: r.notes,
      status: r.status,
    })),
    unsettledDepartures: {
      count: unsettled.length,
      totalBalance: Math.round(unsettled.reduce((n, r) => n + r.balance, 0) * 100) / 100,
      items: unsettled.slice(0, 5),
    },
  };
}
