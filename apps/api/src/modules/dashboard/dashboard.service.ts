import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

// ─── Date helpers (all business dates derive from Property.currentBusinessDate) ───

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

function dayKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

async function resolveProperty(tenantId: string, propertyId?: string) {
  const property = await prisma.property.findFirst({
    where: propertyId ? { id: propertyId, tenantId } : { tenantId },
    orderBy: { createdAt: 'asc' },
    include: { roomTypes: { where: { status: 'active' }, select: { id: true } } },
  });
  if (!property) {
    throw new AppError(404, 'No property found for this tenant', 'PROPERTY_NOT_FOUND');
  }
  return property;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  businessDate: string;
  property: { id: string; name: string; currency: string };
  occupancyRate: number; // 0-100
  adr: number;
  revpar: number;
  totalRevenue: number; // revenue posted today
  monthToDateRevenue: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouseGuests: number;
  availableRooms: number;
  occupiedRooms: number;
  outOfOrderRooms: number;
  dirtyRooms: number;
  totalRooms: number;
  pendingTasks: number;
  newReservationsToday: number;
  nightAudit: { status: string; completedAt: string | null } | null;
  revenueByDay: Array<{ date: string; revenue: number }>;
  recentReservations: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    arrivalDate: string;
    departureDate: string;
    status: string;
    roomNumber: string | null;
    totalAmount: number;
  }>;
}

const ACTIVE_STAY_STATUSES = ['confirmed', 'checked_in'];

export async function getDashboardStats(
  tenantId: string,
  propertyId?: string
): Promise<DashboardStats> {
  const property = await resolveProperty(tenantId, propertyId);
  const today = startOfDay(property.currentBusinessDate);
  const tomorrow = addDays(today, 1);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const chartStart = addDays(today, -13);

  const [
    totalRooms,
    occupiedStays,
    roomsByStatus,
    arrivalsToday,
    departuresToday,
    inHouse,
    newReservationsToday,
    revenueTodayAgg,
    monthRevenueAgg,
    chartItems,
    pendingTasks,
    nightAudit,
    recentReservations,
  ] = await Promise.all([
    // Total physical rooms
    prisma.room.count({
      where: { tenantId, propertyId: property.id, status: { not: 'inactive' } },
    }),

    // Tonight's occupied rooms (drives occupancy, ADR, RevPAR)
    prisma.reservationStay.findMany({
      where: {
        date: today,
        reservation: {
          tenantId,
          propertyId: property.id,
          status: { in: ACTIVE_STAY_STATUSES },
        },
      },
      select: { roomId: true, rate: true },
    }),

    // Room status breakdown
    prisma.room.groupBy({
      by: ['housekeepingStatus'],
      where: { tenantId, propertyId: property.id, status: { not: 'inactive' } },
      _count: { _all: true },
    }),

    // Arrivals today
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId: property.id,
        arrivalDate: today,
        status: { in: ['confirmed', 'checked_in'] },
      },
    }),

    // Departures today
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId: property.id,
        departureDate: today,
        status: { in: ['confirmed', 'checked_in'] },
      },
    }),

    // In-house guests (adults + children)
    prisma.reservation.aggregate({
      where: {
        tenantId,
        propertyId: property.id,
        arrivalDate: { lte: today },
        departureDate: { gt: today },
        status: 'checked_in',
      },
      _sum: { adults: true, children: true },
      _count: { _all: true },
    }),

    // New reservations created today
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId: property.id,
        createdAt: { gte: today, lt: tomorrow },
      },
    }),

    // Revenue posted today
    prisma.folioItem.aggregate({
      where: {
        postedAt: { gte: today, lt: tomorrow },
        folio: { tenantId, reservation: { propertyId: property.id } },
      },
      _sum: { amount: true },
    }),

    // Month-to-date revenue
    prisma.folioItem.aggregate({
      where: {
        postedAt: { gte: monthStart, lt: tomorrow },
        folio: { tenantId, reservation: { propertyId: property.id } },
      },
      _sum: { amount: true },
    }),

    // Last 14 days of revenue items (bucketed in JS)
    prisma.folioItem.findMany({
      where: {
        postedAt: { gte: chartStart, lt: tomorrow },
        folio: { tenantId, reservation: { propertyId: property.id } },
      },
      select: { postedAt: true, amount: true },
    }),

    // Overdue / pending housekeeping tasks
    prisma.housekeepingTask.count({
      where: {
        tenantId,
        propertyId: property.id,
        status: { in: ['pending', 'in_progress'] },
        scheduledAt: { lt: tomorrow },
      },
    }),

    // Night audit status for the current business date
    prisma.nightAudit.findUnique({
      where: {
        tenantId_propertyId_auditDate: {
          tenantId,
          propertyId: property.id,
          auditDate: today,
        },
      },
      select: { status: true, completedAt: true },
    }),

    // 8 most recent reservations
    prisma.reservation.findMany({
      where: { tenantId, propertyId: property.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        guest: { select: { firstName: true, lastName: true } },
        stays: {
          where: { date: today },
          take: 1,
          select: { room: { select: { number: true } } },
        },
      },
    }),
  ]);

  const occupiedRooms = occupiedStays.length;
  const roomRevenueTonight = occupiedStays.reduce((sum, s) => sum + Number(s.rate), 0);

  const statusCounts: Record<string, number> = {};
  for (const row of roomsByStatus) statusCounts[row.housekeepingStatus] = row._count._all;

  const outOfOrderRooms =
    (statusCounts['out_of_order'] ?? 0) +
    (statusCounts['ooo'] ?? 0) +
    (statusCounts['maintenance'] ?? 0);
  const dirtyRooms =
    (statusCounts['dirty'] ?? 0) +
    (statusCounts['cleaning'] ?? 0) +
    (statusCounts['inspected'] ?? 0);

  const sellableRooms = Math.max(totalRooms - outOfOrderRooms, 0);
  const occupancyRate = sellableRooms > 0 ? (occupiedRooms / sellableRooms) * 100 : 0;
  const adr = occupiedRooms > 0 ? roomRevenueTonight / occupiedRooms : 0;
  const revpar = sellableRooms > 0 ? roomRevenueTonight / sellableRooms : 0;

  // 14-day revenue buckets
  const buckets = new Map<string, number>();
  for (let i = 0; i < 14; i++) buckets.set(dayKey(addDays(chartStart, i)), 0);
  for (const item of chartItems) {
    const key = dayKey(item.postedAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(item.amount));
  }
  const revenueByDay = [...buckets.entries()].map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));

  return {
    businessDate: dayKey(today),
    property: { id: property.id, name: property.name, currency: property.currency },
    occupancyRate: Math.round(occupancyRate * 10) / 10,
    adr: Math.round(adr * 100) / 100,
    revpar: Math.round(revpar * 100) / 100,
    totalRevenue: Number(revenueTodayAgg._sum.amount ?? 0),
    monthToDateRevenue: Number(monthRevenueAgg._sum.amount ?? 0),
    arrivalsToday,
    departuresToday,
    inHouseGuests: Number(inHouse._sum.adults ?? 0) + Number(inHouse._sum.children ?? 0),
    availableRooms: Math.max(sellableRooms - occupiedRooms, 0),
    occupiedRooms,
    outOfOrderRooms,
    dirtyRooms,
    totalRooms,
    pendingTasks,
    newReservationsToday,
    nightAudit: nightAudit
      ? { status: nightAudit.status, completedAt: nightAudit.completedAt?.toISOString() ?? null }
      : null,
    revenueByDay,
    recentReservations: recentReservations.map((r) => ({
      id: r.id,
      confirmationNumber: r.confirmationNumber,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      arrivalDate: dayKey(r.arrivalDate),
      departureDate: dayKey(r.departureDate),
      status: r.status,
      roomNumber: r.stays[0]?.room?.number ?? null,
      totalAmount: Number(r.totalAmount),
    })),
  };
}

// ─── Front-desk snapshot ─────────────────────────────────────────────────────

export interface FrontDeskSnapshot {
  rooms: Array<{
    id: string;
    number: string;
    floor: string | null;
    status: string;
    housekeepingStatus: string;
    currentGuest: { firstName: string; lastName: string } | null;
    currentReservation: { id: string; departureDate: string; confirmationNumber: string } | null;
  }>;
  arrivals: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    arrivalDate: string;
    roomType: string | null;
    roomNumber: string | null;
    status: string;
    balance: number;
  }>;
  departures: Array<{
    id: string;
    confirmationNumber: string;
    guestName: string;
    departureDate: string;
    roomNumber: string | null;
    status: string;
    balance: number;
  }>;
}

export async function getFrontDeskSnapshot(
  tenantId: string,
  propertyId?: string
): Promise<FrontDeskSnapshot> {
  const property = await resolveProperty(tenantId, propertyId);
  const today = startOfDay(property.currentBusinessDate);

  const [rooms, arrivals, departures] = await Promise.all([
    prisma.room.findMany({
      where: { tenantId, propertyId: property.id, status: { not: 'inactive' } },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        floor: true,
        status: true,
        housekeepingStatus: true,
        reservationStays: {
          where: {
            date: today,
            reservation: { status: { in: ACTIVE_STAY_STATUSES } },
          },
          take: 1,
          select: {
            reservation: {
              select: {
                id: true,
                confirmationNumber: true,
                departureDate: true,
                guest: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),

    prisma.reservation.findMany({
      where: {
        tenantId,
        propertyId: property.id,
        arrivalDate: today,
        status: { in: ['confirmed', 'checked_in'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        folio: { select: { balance: true } },
        stays: {
          where: { date: today },
          take: 1,
          select: { room: { select: { number: true, roomType: { select: { name: true } } } } },
        },
      },
    }),

    prisma.reservation.findMany({
      where: {
        tenantId,
        propertyId: property.id,
        departureDate: today,
        status: { in: ['confirmed', 'checked_in'] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        guest: { select: { firstName: true, lastName: true } },
        folio: { select: { balance: true } },
        stays: {
          where: { date: { lte: today } },
          orderBy: { date: 'desc' },
          take: 1,
          select: { room: { select: { number: true } } },
        },
      },
    }),
  ]);

  return {
    rooms: rooms.map((r) => {
      const stay = r.reservationStays[0]?.reservation ?? null;
      return {
        id: r.id,
        number: r.number,
        floor: r.floor,
        status: r.status,
        housekeepingStatus: r.housekeepingStatus,
        currentGuest: stay
          ? { firstName: stay.guest.firstName, lastName: stay.guest.lastName }
          : null,
        currentReservation: stay
          ? {
              id: stay.id,
              departureDate: dayKey(stay.departureDate),
              confirmationNumber: stay.confirmationNumber,
            }
          : null,
      };
    }),
    arrivals: arrivals.map((r) => ({
      id: r.id,
      confirmationNumber: r.confirmationNumber,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      arrivalDate: dayKey(r.arrivalDate),
      roomType: r.stays[0]?.room?.roomType?.name ?? null,
      roomNumber: r.stays[0]?.room?.number ?? null,
      status: r.status,
      balance: Number(r.folio?.balance ?? 0),
    })),
    departures: departures.map((r) => ({
      id: r.id,
      confirmationNumber: r.confirmationNumber,
      guestName: `${r.guest.firstName} ${r.guest.lastName}`,
      departureDate: dayKey(r.departureDate),
      roomNumber: r.stays[0]?.room?.number ?? null,
      status: r.status,
      balance: Number(r.folio?.balance ?? 0),
    })),
  };
}

// ─── Activity feed ───────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  user: string | null;
  time: string;
  metadata: unknown;
}

export async function getActivityFeed(
  tenantId: string,
  propertyId?: string,
  take = 20
): Promise<ActivityItem[]> {
  await resolveProperty(tenantId, propertyId);

  const logs = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take,
  });

  // AuditLog has no Prisma relation to User — resolve names in one extra query
  const userIds = [...new Set(logs.map((l) => l.userId).filter((id): id is string => !!id))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const userNames = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    user: l.userId ? (userNames.get(l.userId) ?? null) : null,
    time: l.createdAt.toISOString(),
    metadata: l.metadata,
  }));
}

// ─── Alerts (derived from live data) ─────────────────────────────────────────

export interface DashboardAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  source: string;
  actionUrl: string | null;
  timestamp: string;
  acknowledged: boolean;
}

export async function getAlerts(tenantId: string, propertyId?: string): Promise<DashboardAlert[]> {
  const property = await resolveProperty(tenantId, propertyId);
  const today = startOfDay(property.currentBusinessDate);
  const now = new Date();
  const alerts: DashboardAlert[] = [];

  const [
    dirtyArrivalRooms,
    unassignedArrivals,
    overdueTasks,
    unpaidDepartures,
    nightAudit,
    dirtyRoomsCount,
  ] = await Promise.all([
    // Rooms that are dirty but have an arrival tonight
    prisma.reservationStay.findMany({
      where: {
        date: today,
        reservation: {
          tenantId,
          propertyId: property.id,
          arrivalDate: today,
          status: { in: ['confirmed', 'checked_in'] },
        },
        room: { housekeepingStatus: { in: ['dirty', 'cleaning'] } },
      },
      select: { room: { select: { number: true } } },
      take: 10,
    }),

    // Arrivals today with no room assigned
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId: property.id,
        arrivalDate: today,
        status: 'confirmed',
        stays: { none: { date: today } },
      },
    }),

    // Housekeeping tasks not done by now
    prisma.housekeepingTask.findMany({
      where: {
        tenantId,
        propertyId: property.id,
        status: { in: ['pending', 'in_progress'] },
        scheduledAt: { lt: now },
      },
      select: { id: true, room: { select: { number: true } }, priority: true },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),

    // Departures today with an open balance
    prisma.reservation.findMany({
      where: {
        tenantId,
        propertyId: property.id,
        departureDate: today,
        status: { in: ['confirmed', 'checked_in'] },
        folio: { balance: { gt: 0 } },
      },
      select: { confirmationNumber: true, folio: { select: { balance: true } } },
      take: 5,
    }),

    prisma.nightAudit.findUnique({
      where: {
        tenantId_propertyId_auditDate: { tenantId, propertyId: property.id, auditDate: today },
      },
      select: { status: true },
    }),

    prisma.room.count({
      where: { tenantId, propertyId: property.id, housekeepingStatus: 'dirty' },
    }),
  ]);

  if (dirtyArrivalRooms.length > 0) {
    const rooms = dirtyArrivalRooms.map((s) => s.room.number).join(', ');
    alerts.push({
      id: 'dirty-arrival-rooms',
      severity: 'critical',
      title: `${dirtyArrivalRooms.length} arrival room${dirtyArrivalRooms.length > 1 ? 's' : ''} still dirty`,
      message: `Rooms ${rooms} have guests arriving today but are not clean yet.`,
      source: 'housekeeping',
      actionUrl: '/app/housekeeping',
      timestamp: now.toISOString(),
      acknowledged: false,
    });
  }

  if (unassignedArrivals > 0) {
    alerts.push({
      id: 'unassigned-arrivals',
      severity: 'warning',
      title: `${unassignedArrivals} arrival${unassignedArrivals > 1 ? 's' : ''} without a room`,
      message: 'Guests arriving today have no room assigned. Assign rooms before check-in.',
      source: 'reservations',
      actionUrl: '/app/reservations/front-desk',
      timestamp: now.toISOString(),
      acknowledged: false,
    });
  }

  if (overdueTasks.length > 0) {
    const rooms = overdueTasks.map((t) => t.room?.number ?? '?').join(', ');
    alerts.push({
      id: 'overdue-tasks',
      severity: 'warning',
      title: `${overdueTasks.length} overdue housekeeping task${overdueTasks.length > 1 ? 's' : ''}`,
      message: `Tasks for rooms ${rooms} are past their scheduled time.`,
      source: 'housekeeping',
      actionUrl: '/app/housekeeping',
      timestamp: now.toISOString(),
      acknowledged: false,
    });
  }

  if (unpaidDepartures.length > 0) {
    const total = unpaidDepartures.reduce((s, r) => s + Number(r.folio?.balance ?? 0), 0);
    alerts.push({
      id: 'unpaid-departures',
      severity: 'critical',
      title: `${unpaidDepartures.length} departure${unpaidDepartures.length > 1 ? 's' : ''} with open balance`,
      message: `${unpaidDepartures.length} departing reservation(s) owe ${property.currency} ${total.toFixed(2)}. Settle folios before check-out.`,
      source: 'billing',
      actionUrl: '/app/billing',
      timestamp: now.toISOString(),
      acknowledged: false,
    });
  }

  if (!nightAudit || nightAudit.status !== 'completed') {
    alerts.push({
      id: 'night-audit-pending',
      severity: 'info',
      title: 'Night audit not run',
      message: `Night audit for ${dayKey(today)} has not been completed yet.`,
      source: 'night-audit',
      actionUrl: '/app/night-audit',
      timestamp: now.toISOString(),
      acknowledged: false,
    });
  } else {
    alerts.push({
      id: 'night-audit-complete',
      severity: 'success',
      title: 'Night audit complete',
      message: `Business date ${dayKey(today)} closed successfully.`,
      source: 'night-audit',
      actionUrl: '/app/night-audit',
      timestamp: now.toISOString(),
      acknowledged: false,
    });
  }

  if (dirtyRoomsCount > 0) {
    alerts.push({
      id: 'dirty-rooms',
      severity: 'info',
      title: `${dirtyRoomsCount} room${dirtyRoomsCount > 1 ? 's' : ''} marked dirty`,
      message: 'Housekeeping has not inspected these rooms yet.',
      source: 'housekeeping',
      actionUrl: '/app/housekeeping',
      timestamp: now.toISOString(),
      acknowledged: false,
    });
  }

  const severityRank: Record<DashboardAlert['severity'], number> = {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3,
  };
  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
