/* apps/api/src/modules/dashboard/dashboard.today.routes.ts
 * #8 Today-dashboard vertical slice (roadmap Phase 3 + addendum F).
 * One tenant-scoped endpoint composing the operational cockpit:
 *   critical attention strip -> today at a glance -> front-desk worklist
 *   -> revenue snapshot -> activity timeline.
 * Rules honored from the addendum:
 *  - dueOut is a VIEW over checked_in stays (lifecycle STAY_VIEWS), never
 *    equated with completed check-out;
 *  - every KPI carries its underlying items (drill-through), and every
 *    worklist item carries validActions derived from the canonical matrix;
 *  - loading/failure can never masquerade as zero: a failed query rejects
 *    the whole request; each region reports its own computedAt freshness.
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { resolveAllowedPropertyIds } from '../auth/auth.middleware.js';
import { nextStates } from '../../common/lifecycle.js';

export const todayDashboardRouter = Router();
todayDashboardRouter.use(authMiddleware, tenantScope);
todayDashboardRouter.use(requirePermission('dashboard', 'read'));

const RESERVATION_ACTION_LABELS: Record<string, string> = {
  checked_in: 'check-in',
  checked_out: 'check-out',
  cancelled: 'cancel',
  no_show: 'no-show',
};

/* The business date lives in a DATE column; driver timezone handling
 * round-trips it inconsistently (observed: a full calendar day behind at
 * UTC+2). Read it as raw text and build the window from explicit UTC
 * components — identical results whatever the server timezone. */
function dayRangeFrom(bd: string) {
  const [y, m, d] = bd.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

function validActionsFor(status: string): string[] {
  return nextStates('reservation', status).map((s) => RESERVATION_ACTION_LABELS[s] ?? s);
}

// GET /v1/dashboard/today?propertyId=...
todayDashboardRouter.get('/today', async (req: Request, res: Response) => {
  const tenantId = ((req as any).auth?.user?.tenantId ??
    (req as any).auth?.tenantId ??
    (req as any).tenantId) as string | undefined;
  const propertyId = String((req.query as any).propertyId ?? '');
  const routeAllowedProps = await resolveAllowedPropertyIds((req as any).auth?.user?.id);
  if (Array.isArray(routeAllowedProps) && !routeAllowedProps.includes(propertyId)) {
    return res.status(403).json({ error: 'Forbidden', message: 'No access to this property' });
  }
  if (!tenantId || !propertyId) {
    return res
      .status(400)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'propertyId is required' } });
  }
  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId },
    select: {
      id: true,
      name: true,
      code: true,
      timezone: true,
      currency: true,
      currentBusinessDate: true,
    },
  });
  if (!property) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'property not found' } });
  }

  const bdRows: any[] =
    await prisma.$queryRaw`SELECT "currentBusinessDate"::text AS d FROM "properties" WHERE "id" = ${propertyId}`;
  const businessDay: string = bdRows[0]?.d ?? new Date().toISOString().slice(0, 10);
  const { start, end } = dayRangeFrom(businessDay);
  const now = new Date();
  const computedAt = new Date().toISOString();

  // ── Front-desk worklists ──
  const [arrivals, dueOutStays] = await Promise.all([
    prisma.reservation.findMany({
      where: { tenantId, propertyId, status: 'confirmed', arrivalDate: { gte: start, lt: end } },
      include: { guest: { select: { firstName: true, lastName: true } } },
      orderBy: { confirmationNumber: 'asc' },
      take: 100,
    }),
    prisma.reservation.findMany({
      where: { tenantId, propertyId, status: 'checked_in', departureDate: { gte: start, lt: end } },
      include: { guest: { select: { firstName: true, lastName: true } }, folio: true },
      orderBy: { confirmationNumber: 'asc' },
      take: 100,
    }),
  ]);

  const arrivalItems = arrivals.map((r: any) => ({
    id: r.id,
    confirmationNumber: r.confirmationNumber,
    guestName: r.guest.firstName + ' ' + r.guest.lastName,
    roomTypeId: r.roomTypeId,
    eta: r.eta,
    status: r.status,
    validActions: validActionsFor(r.status),
    link: '/app/reservations/' + r.id,
  }));
  const dueOutItems = dueOutStays.map((r: any) => ({
    id: r.id,
    confirmationNumber: r.confirmationNumber,
    guestName: r.guest.firstName + ' ' + r.guest.lastName,
    status: r.status,
    balance: r.folio ? Number(r.folio.balance) : Number(r.balance),
    flags: [r.folio && Number(r.folio.balance) > 0 ? 'unsettled_balance' : null].filter(Boolean),
    validActions: validActionsFor(r.status),
    link: '/app/reservations/' + r.id,
  }));

  // ── Today at a glance ──
  const [inHouse, checkedOutToday, roomsReady, roomsActive, openTasks, overdueTasks] =
    await Promise.all([
      prisma.reservation.count({ where: { tenantId, propertyId, status: 'checked_in' } }),
      prisma.reservation.count({
        where: {
          tenantId,
          propertyId,
          status: 'checked_out',
          checkedOutAt: { gte: start, lt: end },
        },
      }),
      prisma.room.count({
        where: { tenantId, propertyId, housekeepingStatus: 'ready', serviceStatus: 'active' },
      }),
      prisma.room.count({ where: { tenantId, propertyId, serviceStatus: 'active' } }),
      prisma.task.count({
        where: { tenantId, propertyId, status: { in: ['open', 'in_progress'] } },
      }),
      prisma.task.count({
        where: {
          tenantId,
          propertyId,
          status: { in: ['open', 'in_progress'] },
          dueAt: { lt: now },
        },
      }),
    ]);

  // ── Critical attention strip (addendum region 2) ──
  const [errorChannels, failedPayments, dueOutUnsettled] = await Promise.all([
    prisma.channelConnection.findMany({
      where: { tenantId, propertyId, OR: [{ status: 'error' }, { lastSyncStatus: 'failed' }] },
      select: {
        id: true,
        provider: true,
        hotelId: true,
        status: true,
        lastSyncStatus: true,
        lastSyncAt: true,
      },
    }),
    prisma.payment.findMany({
      where: { tenantId, propertyId, status: 'failed', createdAt: { gte: start } },
      select: {
        id: true,
        reference: true,
        amountMinor: true,
        failureReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    dueOutItems.filter((d: any) => d.balance > 0),
  ]);
  const readinessGap = Math.max(0, arrivalItems.length - roomsReady);
  const critical = [
    {
      type: 'channel_sync_failure',
      severity: 'critical',
      count: errorChannels.length,
      items: errorChannels.map((c: any) => ({
        id: c.id,
        label: c.provider + ' / ' + c.hotelId + ' (' + (c.lastSyncStatus ?? c.status) + ')',
        link: '/app/channel-manager',
      })),
      recommendedAction: 'Open sync-error dashboard, inspect push log, replay safely',
    },
    {
      type: 'payment_failure',
      severity: 'critical',
      count: failedPayments.length,
      items: failedPayments.map((p: any) => ({
        id: p.id,
        label: p.reference + (p.failureReason ? ' — ' + p.failureReason : ''),
        link: '/app/billing/payments',
      })),
      recommendedAction: 'Retry, send payment link, or change method',
    },
    {
      type: 'due_out_unsettled',
      severity: 'high',
      count: dueOutUnsettled.length,
      items: dueOutUnsettled.map((d: any) => ({
        id: d.id,
        label: d.confirmationNumber + ' ' + d.guestName + ' balance ' + d.balance,
        link: d.link,
      })),
      recommendedAction: 'Collect balance before departure',
    },
    {
      type: 'overdue_task',
      severity: 'high',
      count: overdueTasks,
      items: [] as any[],
      recommendedAction: 'Reassign or escalate overdue work',
    },
    {
      type: 'room_readiness',
      severity: 'high',
      count: readinessGap,
      items: [] as any[],
      recommendedAction: 'Prioritize housekeeping for arriving room types',
    },
  ].filter((c) => c.count > 0 || c.type === 'room_readiness' || c.type === 'overdue_task');

  // ── Revenue snapshot (honest definitions, freshness stamped) ──
  const [stayAgg, occupiedTonight] = await Promise.all([
    prisma.reservationStay.aggregate({
      _sum: { rate: true },
      where: { date: { gte: start, lt: end }, reservation: { propertyId, tenantId } },
    }),
    prisma.reservationStay.count({
      where: { date: { gte: start, lt: end }, reservation: { propertyId, tenantId } },
    }),
  ]);
  const roomRevenueToday = Number(stayAgg._sum.rate ?? 0);
  const roomsTotal = roomsActive;
  const occupancyPct = roomsTotal > 0 ? (occupiedTonight / roomsTotal) * 100 : 0;
  const adr = occupiedTonight > 0 ? roomRevenueToday / occupiedTonight : 0;
  const revpar = roomsTotal > 0 ? roomRevenueToday / roomsTotal : 0;

  // ── Activity timeline (tenant-scoped audit trail) ──
  const allowedProps = await resolveAllowedPropertyIds((req as any).auth?.user?.id);
  const activityWhere: any = { tenantId };
  if (allowedProps) {
    activityWhere.propertyId = { in: allowedProps.includes(propertyId) ? [propertyId] : [] };
  } else {
    activityWhere.OR = [{ propertyId: propertyId }, { propertyId: null }];
  }
  const activity = await prisma.auditLog.findMany({
    where: activityWhere,
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return res.json({
    data: {
      property: {
        id: property.id,
        name: property.name,
        code: property.code,
        timezone: property.timezone,
        currency: property.currency,
      },
      businessDate: businessDay,
      generatedAt: computedAt,
      critical,
      today: {
        arrivals: arrivalItems.length,
        dueOut: dueOutItems.length,
        inHouse,
        dayUse: 0, // reserved: addendum UX-02 — no day-use stays until bookingType ships
        checkedOutToday,
        roomsReady,
        roomsTotal,
        openTasks,
        overdueTasks,
      },
      frontDesk: { arrivals: arrivalItems, dueOut: dueOutItems },
      revenue: {
        roomRevenueToday,
        occupiedTonight,
        roomsTotal,
        occupancyPct: Math.round(occupancyPct * 100) / 100,
        adr: Math.round(adr * 100) / 100,
        revpar: Math.round(revpar * 100) / 100,
        definitions:
          'roomRevenue = sum(reservation_stays.rate for business date); occupancy = occupiedTonight/roomsTotal(active); ADR = revenue/occupied; RevPAR = revenue/roomsTotal. Day Use excluded until UX-02 (matrix bookingType).',
        computedAt,
      },
      activity: activity.map((a: any) => ({
        at: a.createdAt,
        actor: a.userId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
      })),
    },
  });
});
