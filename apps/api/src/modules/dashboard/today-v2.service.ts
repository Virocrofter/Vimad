// Today v2 composed read model (plan v3.0 section 7.5).
// Additive alongside dashboard.today (v1) - v1 DTOs untouched.
// Contract: context failure fails the request; per-section failure degrades
// only that section (section 10.3). Counts are aggregates, not items.length.
// Schema truths: Room has housekeepingStatus + serviceStatus (no single
// status); rooms attach to reservations via ReservationStay, not roomId.
import { prisma } from '../../common/prisma.js';

export interface TodayV2User {
  id: string;
  role: string;
}

export interface TodayV2Options {
  workRange?: 'today' | 'tomorrow' | '7d';
  page?: number;
  pageSize?: number;
}

const readyStates = ['ready', 'inspected'];

async function permissionKeys(user: TodayV2User): Promise<Set<string>> {
  const roleNames = new Set<string>([user.role]);
  const assignments = await prisma.roleAssignment.findMany({
    where: { userId: user.id },
    select: { role: { select: { name: true } } },
  });
  for (const a of assignments) if (a.role?.name) roleNames.add(a.role.name);
  const roles = await prisma.role.findMany({
    where: { name: { in: Array.from(roleNames) } },
    select: {
      rolePermissions: { select: { permission: { select: { resource: true, action: true } } } },
    },
  });
  const keys = new Set<string>();
  for (const r of roles) {
    for (const rp of r.rolePermissions)
      keys.add(rp.permission.resource + ':' + rp.permission.action);
  }
  return keys;
}

function bdWindow(businessDate: string): { start: Date; end: Date } {
  const start = new Date(businessDate + 'T00:00:00.000Z');
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

async function section<T>(fn: () => Promise<T>): Promise<{ status: string } & T> {
  try {
    const out = await fn();
    return { status: 'ready', ...out } as { status: string } & T;
  } catch (err: any) {
    return { status: 'error', error: String(err?.message ?? err) } as unknown as {
      status: string;
    } & T;
  }
}

const pickCount = (arr: any[], key: string) =>
  arr.reduce((a, g) => {
    const k = g.housekeepingStatus ?? g.serviceStatus;
    return a + (k === key ? g._count._all : 0);
  }, 0);

export async function getTodayV2(
  tenantId: string,
  propertyId: string,
  user: TodayV2User,
  opts: TodayV2Options
) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, opts.pageSize ?? 20));
  const perms = await permissionKeys(user);
  const canReport = perms.has('report:read');
  const canFolio = perms.has('folio:read');
  const canException = perms.has('exception:read');
  const canTask = perms.has('task:read') || perms.has('task:update');
  const canHousekeeping = perms.has('housekeeping:read');

  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId },
    select: { id: true, name: true, timezone: true, currency: true, currentBusinessDate: true },
  });
  if (!property) throw new Error('PROPERTY_NOT_FOUND');
  const bdRaw = property.currentBusinessDate as unknown;
  const bd =
    bdRaw instanceof Date
      ? bdRaw.toISOString().slice(0, 10)
      : String(bdRaw ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const { start, end } = bdWindow(bd);

  const entitlements = {
    sections: [
      ...(canException ? ['attention'] : []),
      'arrivals',
      'departures',
      ...(canHousekeeping ? ['readiness'] : []),
      ...(canTask ? ['myShift'] : []),
      ...(canReport ? ['performance'] : []),
      'activity',
    ],
    actions: {
      checkIn: perms.has('reservation:update'),
      checkOut: perms.has('reservation:update'),
      recordPayment: perms.has('folio:payment'),
      manageTasks: perms.has('task:update'),
      manageExceptions: perms.has('exception:manage'),
    },
    rolePriorities: [user.role],
  };

  const sections: Record<string, any> = {};

  if (canException) {
    sections.attention = await section(async () => {
      const where = { tenantId, propertyId, status: { in: ['open', 'acknowledged'] } };
      const [bySeverity, items] = await Promise.all([
        prisma.exception.groupBy({ by: ['severity'], where, _count: { _all: true } }),
        prisma.exception.findMany({
          where,
          orderBy: [{ severity: 'asc' }, { slaDueAt: 'asc' }],
          take: 10,
        }),
      ]);
      const now = Date.now();
      return {
        summary: {
          total: bySeverity.reduce((a, g) => a + g._count._all, 0),
          critical: bySeverity.find((g) => g.severity === 'critical')?._count._all ?? 0,
        },
        items: items.map((x) => ({
          id: x.id,
          title: x.title,
          type: x.type,
          severity: x.severity,
          status: x.status,
          ownerId: x.assigneeId,
          overdue: x.slaDueAt ? x.slaDueAt.getTime() < now : false,
          ageMinutes: Math.round((now - x.createdAt.getTime()) / 60000),
          recommendedAction: x.actionUrl ?? '/app/exceptions?focus=' + x.id,
          ref: { type: 'exception', id: x.id },
        })),
        staleAfterSeconds: 60,
        computedAt: new Date().toISOString(),
      };
    });
  }

  sections.arrivals = await section(async () => {
    const rangeEnd = opts.workRange === 'tomorrow' ? new Date(end.getTime() + 86400000) : end;
    const rangeStart = opts.workRange === '7d' ? new Date(start.getTime() - 6 * 86400000) : start;
    const where = {
      tenantId,
      propertyId,
      arrivalDate: { gte: rangeStart, lt: rangeEnd },
      status: { in: ['confirmed', 'checked_in'] },
    };
    const [total, rows] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where,
        orderBy: [{ arrivalDate: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          guest: { select: { firstName: true, lastName: true } },
          status: true,
          arrivalDate: true,
          departureDate: true,
          roomType: { select: { name: true } },
          adults: true,
          children: true,

          confirmationNumber: true,
          specialRequests: true,
        },
      }),
    ]);
    const resIds = rows.map((r) => r.id);
    const stays = resIds.length
      ? await prisma.reservationStay.findMany({
          where: { reservationId: { in: resIds }, date: { gte: rangeStart, lt: rangeEnd } },
          select: { reservationId: true, roomId: true },
        })
      : [];
    const stayRoom = new Map(
      stays.filter((x) => x.roomId).map((x) => [x.reservationId, x.roomId as string])
    );
    const roomIds = Array.from(new Set(stayRoom.values()));
    const rooms = roomIds.length
      ? await prisma.room.findMany({
          where: { id: { in: roomIds } },
          select: { id: true, number: true, housekeepingStatus: true },
        })
      : [];
    const roomMap = new Map(rooms.map((r) => [r.id, r]));
    return {
      summary: { total, remaining: total, done: 0 },
      items: rows.map((r) => {
        const rid = stayRoom.get(r.id);
        const room = rid ? roomMap.get(rid) : undefined;
        const readiness = room
          ? readyStates.includes(room.housekeepingStatus)
            ? 'ready'
            : room.housekeepingStatus
          : 'unassigned';
        return {
          ref: { type: 'reservation', id: r.id },
          guest: [r.guest?.firstName, r.guest?.lastName].filter(Boolean).join(' '),
          confirmation: r.confirmationNumber,
          status: r.status,
          eta: r.arrivalDate,
          nights: Math.max(
            1,
            Math.round(
              (new Date(r.departureDate).getTime() - new Date(r.arrivalDate).getTime()) / 86400000
            )
          ),
          roomType: r.roomType?.name ?? null,
          room: room ? room.number : null,
          readiness,
          party: { adults: r.adults, children: r.children },
          specialRequests: r.specialRequests,
          links: { reservation: '/app/reservations/' + r.id },
          actions: r.status === 'confirmed' && entitlements.actions.checkIn ? ['check_in'] : [],
        };
      }),
      nextCursor: page * pageSize < total ? String(page + 1) : null,
      computedAt: new Date().toISOString(),
    };
  });

  sections.departures = await section(async () => {
    const whereDue = {
      tenantId,
      propertyId,
      status: 'checked_in',
      departureDate: { gte: start, lt: end },
    };
    const whereDone = {
      tenantId,
      propertyId,
      status: 'checked_out',
      updatedAt: { gte: start, lt: end },
    };
    const [dueTotal, doneTotal, dueRows] = await Promise.all([
      prisma.reservation.count({ where: whereDue }),
      prisma.reservation.count({ where: whereDone }),
      prisma.reservation.findMany({
        where: whereDue,
        orderBy: [{ departureDate: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          guest: { select: { firstName: true, lastName: true } },
          status: true,
          departureDate: true,
          balance: true,
        },
      }),
    ]);
    return {
      summary: { dueOut: dueTotal, checkedOutToday: doneTotal },
      items: dueRows.map((r) => ({
        ref: { type: 'reservation', id: r.id },
        guest: [r.guest?.firstName, r.guest?.lastName].filter(Boolean).join(' '),
        room: null,
        dueOut: r.departureDate,
        balance: canFolio ? Number(r.balance) : null,
        links: { reservation: '/app/reservations/' + r.id },
        actions: [
          ...(entitlements.actions.checkOut ? ['check_out'] : []),
          ...(entitlements.actions.recordPayment && canFolio && Number(r.balance) > 0
            ? ['record_payment']
            : []),
        ],
      })),
      nextCursor: page * pageSize < dueTotal ? String(page + 1) : null,
      computedAt: new Date().toISOString(),
    };
  });

  if (canHousekeeping) {
    sections.readiness = await section(async () => {
      const [hk, svc, roomTotal, arrivalsToday] = await Promise.all([
        prisma.room.groupBy({
          by: ['housekeepingStatus'],
          where: { tenantId, propertyId },
          _count: { _all: true },
        }),
        prisma.room.groupBy({
          by: ['serviceStatus'],
          where: { tenantId, propertyId },
          _count: { _all: true },
        }),
        prisma.room.count({
          where: {
            tenantId,
            propertyId,
            serviceStatus: { notIn: ['out_of_order', 'out_of_service'] },
          },
        }),
        prisma.reservation.count({
          where: {
            tenantId,
            propertyId,
            arrivalDate: { gte: start, lt: end },
            status: 'confirmed',
            NOT: {
              stays: {
                some: {
                  date: { gte: start, lt: end },
                  room: { housekeepingStatus: { in: readyStates } },
                },
              },
            },
          },
        }),
      ]);
      return {
        summary: {
          total: roomTotal,
          ready: pickCount(hk, 'ready') + pickCount(hk, 'inspected'),
          dirty: pickCount(hk, 'dirty'),
          inProgress: pickCount(hk, 'in_progress'),
          inspected: pickCount(hk, 'inspected'),
          ooo: pickCount(svc, 'out_of_order'),
          oos: pickCount(svc, 'out_of_service'),
          arrivalsAwaitingReady: arrivalsToday,
        },
        computedAt: new Date().toISOString(),
      };
    });
  }

  if (canTask) {
    sections.myShift = await section(async () => {
      const where = {
        tenantId,
        propertyId,
        assigneeId: user.id,
        status: { in: ['open', 'in_progress'] },
      };
      const [total, items] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.findMany({ where, orderBy: [{ dueAt: 'asc' }], take: 20 }),
      ]);
      const now = Date.now();
      return {
        summary: { open: total },
        items: items.map((t) => ({
          ref: { type: 'task', id: t.id },
          title: t.title,
          status: t.status,
          dueAt: t.dueAt,
          overdue: t.dueAt ? t.dueAt.getTime() < now : false,
          slaBreached: t.slaBreached || (t.dueAt ? t.dueAt.getTime() < now : false),
          department: t.department,
        })),
        computedAt: new Date().toISOString(),
      };
    });
  }

  if (canReport) {
    sections.performance = await section(async () => {
      const [occupied, availableBasis, stayAgg, posted] = await Promise.all([
        prisma.reservationStay.count({
          where: { reservation: { propertyId }, date: { gte: start, lt: end } },
        }),
        prisma.room.count({
          where: {
            tenantId,
            propertyId,
            serviceStatus: { notIn: ['out_of_order', 'out_of_service'] },
          },
        }),
        prisma.reservationStay.aggregate({
          _sum: { rate: true },
          where: { reservation: { propertyId }, date: { gte: start, lt: end } },
        }),
        prisma.folioItem.aggregate({
          _sum: { amount: true },
          where: {
            type: 'charge',
            createdAt: { gte: start, lt: end },
            folio: { reservation: { propertyId } },
          },
        }),
      ]);
      const projectedRoomRevenue = Number(stayAgg._sum.rate ?? 0);
      const postedRevenue = Number(posted._sum.amount ?? 0);
      const seriesStart = new Date(start.getTime() - 13 * 86400000);
      const dailyAgg = await prisma.reservationStay.groupBy({
        by: ['date'],
        where: { reservation: { propertyId }, date: { gte: seriesStart, lt: end } },
        _sum: { rate: true },
      });
      const byDay = new Map(
        dailyAgg.map((d) => [
          (d.date instanceof Date ? d.date.toISOString() : String(d.date)).slice(0, 10),
          Number(d._sum.rate ?? 0),
        ])
      );
      const series = Array.from({ length: 14 }, (_, i) => {
        const day = new Date(start.getTime() - (13 - i) * 86400000).toISOString().slice(0, 10);
        return { date: day, projectedRoomRevenue: byDay.get(day) ?? 0 };
      });
      const available = Math.max(1, availableBasis);
      const occBase = occupied || 1;
      return {
        metrics: {
          occupiedTonight: occupied,
          availableRooms: availableBasis,
          occupancyPct: Math.round((occupied / available) * 1000) / 10,
          projectedRoomRevenue,
          postedRevenue,
          postedRevenueMtd: postedRevenue,
          adr: Math.round((projectedRoomRevenue / occBase) * 100) / 100,
          revpar: Math.round((projectedRoomRevenue / available) * 100) / 100,
        },
        series,
        basis: {
          revenue:
            'projected stay rates (ReservationStay) for the business date; posted = folio charges created in the business-date window',
          occupancy: 'stay nights on the business date / sellable rooms (excl. OoO/OoS)',
        },
        definitionsVersion: 'today-v2.2026-11-13',
        computedAt: new Date().toISOString(),
      };
    });
  }

  sections.activity = await section(async () => {
    const rows = await prisma.auditLog.findMany({
      where: { tenantId, OR: [{ propertyId: propertyId }, { propertyId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    return {
      items: rows.map((a) => ({
        id: a.id,
        actor: (() => {
          const m: any = a.metadata ?? {};
          const actor = m.actor;
          if (typeof actor === 'string') return actor;
          if (actor && typeof actor === 'object') return actor.name ?? null;
          return typeof m.label === 'string' ? m.label : null;
        })(),
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        at: a.createdAt,
        ref: a.entityId ? { type: a.entity, id: a.entityId } : null,
      })),
      computedAt: new Date().toISOString(),
    };
  });

  return {
    context: {
      tenantId,
      property: { id: property.id, name: property.name },
      businessDate: bd,
      timezone: property.timezone,
      currency: property.currency,
      generatedAt: new Date().toISOString(),
    },
    entitlements,
    sections,
  };
}
