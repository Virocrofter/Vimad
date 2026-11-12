/* apps/api/src/modules/exceptions/exceptions.routes.ts
 * Phase 4 — operational exception queue (roadmap audit §6).
 * ONE queue for work needing a human. Detectors run synchronously on GET and
 * are idempotent (upsert by tenantId+dedupeKey); a human decision
 * (resolved/dismissed) is NEVER re-opened by detectors — dismissal is a
 * decision, not a data state (the P11 lesson). Lifecycle:
 *   open → acknowledged → (in_progress) → resolved | dismissed(reason)
 * MVP types: payment_failed, payment_stale, room_readiness, overdue_request,
 * channel_sync. Every mutation writes an audit row.
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';

export const exceptionsRouter = Router();
exceptionsRouter.use(authMiddleware, tenantScope);

const STALE_MS = 2 * 3600 * 1000;
const SYNC_STALE_MS = 24 * 3600 * 1000;
const ACTIVE = ['open', 'acknowledged', 'in_progress'];
const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const tenantOf = (req: Request): string =>
  ((req as any).user?.tenantId ?? (req as any).tenantId) as string;
const actorOf = (req: Request): string | null => {
  const u: any = (req as any).user ?? {};
  return (u.userId ?? u.id ?? u.sub ?? null) as string | null;
};

interface Detected {
  type: string;
  severity: string;
  title: string;
  detail: string;
  recommendedAction: string;
  actionUrl: string;
  dedupeKey: string;
  slaDueAt: Date | undefined;
  propertyId?: string;
  reservationId?: string;
  guestId?: string;
  roomId?: string;
  paymentId?: string;
  taskId?: string;
  connectionId?: string;
}

async function upsert(tenantId: string, d: Detected): Promise<void> {
  const existing = await prisma.exception.findUnique({
    where: { tenantId_dedupeKey: { tenantId, dedupeKey: d.dedupeKey } },
  });
  if (existing) {
    // Human decisions stand; refresh only the facts on still-active rows.
    if (existing.status === 'resolved' || existing.status === 'dismissed') return;
    await prisma.exception.update({
      where: { id: existing.id },
      data: { title: d.title, detail: d.detail, severity: d.severity, slaDueAt: d.slaDueAt },
    });
    return;
  }
  await prisma.exception.create({ data: { tenantId, ...d } });
}

async function detect(tenantId: string): Promise<void> {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const [failedPays, stalePays, arrivals, overdueTasks, conns] = await Promise.all([
    prisma.payment.findMany({
      where: { tenantId, status: 'failed' },
      include: { guest: true, reservation: true },
      take: 100,
    }),
    prisma.payment.findMany({
      where: { tenantId, status: 'pending', createdAt: { lt: new Date(now.getTime() - STALE_MS) } },
      include: { guest: true, reservation: true },
      take: 100,
    }),
    prisma.reservation.findMany({
      where: {
        tenantId,
        arrivalDate: { gte: start, lt: end },
        status: { in: ['confirmed', 'checked_in'] },
      },
      include: {
        guest: true,
        stays: { where: { date: { gte: start, lt: end } }, include: { room: true } },
      },
      take: 100,
    }),
    prisma.task.findMany({
      where: { tenantId, status: { in: ['open', 'in_progress'] }, dueAt: { lt: now } },
      take: 100,
    }),
    prisma.channelConnection.findMany({ where: { tenantId }, take: 50 }),
  ]);

  for (const p of failedPays) {
    if ((p.metadata as any)?.exception?.dismissedAt) continue;
    await upsert(tenantId, {
      type: 'payment_failed',
      severity: 'critical',
      title: `Failed payment ${p.reference}`,
      detail: `${p.guest ? `${p.guest.firstName} ${p.guest.lastName} — ` : ''}${(p.amountMinor / 100).toFixed(2)} ${p.currency}${p.failureReason ? ` — ${p.failureReason}` : ''}`,
      recommendedAction: 'Verify, retry or send the guest a payment link',
      actionUrl: '/app/billing',
      dedupeKey: `pay-failed:${p.id}`,
      slaDueAt: new Date(now.getTime() + 2 * 3600_000),
      propertyId: p.propertyId ?? undefined,
      reservationId: p.reservationId ?? undefined,
      guestId: p.guestId ?? undefined,
      paymentId: p.id,
    });
  }
  for (const p of stalePays) {
    await upsert(tenantId, {
      type: 'payment_stale',
      severity: 'high',
      title: `Unsettled payment ${p.reference}`,
      detail: `Pending ${Math.floor((now.getTime() - new Date(p.createdAt).getTime()) / 60000)}m — never retry a pending charge; verify with the provider`,
      recommendedAction: 'Verify settlement with the provider',
      actionUrl: '/app/billing',
      dedupeKey: `pay-stale:${p.id}`,
      slaDueAt: new Date(now.getTime() + 2 * 3600_000),
      propertyId: p.propertyId ?? undefined,
      reservationId: p.reservationId ?? undefined,
      guestId: p.guestId ?? undefined,
      paymentId: p.id,
    });
  }
  for (const r of arrivals) {
    for (const s of r.stays) {
      const room = s.room;
      if (room.housekeepingStatus === 'ready' && room.serviceStatus === 'active') continue;
      const why =
        room.serviceStatus !== 'active'
          ? `out of service${room.serviceReason ? ` (${room.serviceReason})` : ''}`
          : `housekeeping: ${room.housekeepingStatus}`;
      await upsert(tenantId, {
        type: 'room_readiness',
        severity: 'high',
        title: `Arrival room ${room.number} not ready`,
        detail: `${r.guest.firstName} ${r.guest.lastName} arrives today (${r.confirmationNumber}) — ${why}`,
        recommendedAction: 'Open the room board and prioritize this room',
        actionUrl: '/app/rooms',
        dedupeKey: `room-ready:${r.id}:${start.toISOString().slice(0, 10)}`,
        slaDueAt: new Date(start.getTime() + 14 * 3600_000),
        propertyId: r.propertyId,
        reservationId: r.id,
        guestId: r.guestId,
        roomId: room.id,
      });
    }
  }
  for (const t of overdueTasks) {
    await upsert(tenantId, {
      type: 'overdue_request',
      severity: t.slaBreached ? 'high' : 'medium',
      title: `Overdue task: ${t.title}`,
      detail: `${t.department} — due ${t.dueAt ? t.dueAt.toISOString().slice(11, 16) : '—'} (${Math.floor((now.getTime() - new Date(t.dueAt!).getTime()) / 60000)}m overdue)`,
      recommendedAction: 'Open tasks — reassign or complete',
      actionUrl: '/app/tasks',
      dedupeKey: `task-overdue:${t.id}`,
      slaDueAt: t.dueAt ?? undefined,
      propertyId: t.propertyId,
      taskId: t.id,
      roomId: t.roomId ?? undefined,
      reservationId: t.reservationId ?? undefined,
      guestId: t.guestId ?? undefined,
    });
  }
  for (const c of conns) {
    const failed = /fail|error/i.test(c.lastSyncStatus ?? '');
    const staleSync =
      c.status === 'active' &&
      (!c.lastSyncAt || now.getTime() - new Date(c.lastSyncAt).getTime() > SYNC_STALE_MS);
    if (!failed && !staleSync) continue;
    await upsert(tenantId, {
      type: 'channel_sync',
      severity: failed ? 'critical' : 'high',
      title: `Channel ${c.provider}: ${failed ? 'sync failing' : 'not syncing'}`,
      detail: `${c.hotelId} — last sync ${c.lastSyncAt ? new Date(c.lastSyncAt).toISOString() : 'never'}${c.lastSyncStatus ? ` (${c.lastSyncStatus})` : ''}`,
      recommendedAction: 'Open channel manager — check credentials, replay safely',
      actionUrl: '/app/channel-manager',
      dedupeKey: `chan:${c.id}`,
      slaDueAt: new Date(now.getTime() + 4 * 3600_000),
      propertyId: c.propertyId,
      connectionId: c.id,
    });
  }
}

// GET /v1/exceptions?status=active|open|acknowledged|in_progress|resolved|dismissed|all
exceptionsRouter.get('/', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req);
  await detect(tenantId);
  const status = String(req.query.status ?? 'active');
  const where = {
    tenantId,
    ...(status === 'all' ? {} : status === 'active' ? { status: { in: ACTIVE } } : { status }),
  };
  const [rows, counts] = await Promise.all([
    prisma.exception.findMany({ where, take: 300 }),
    prisma.exception.groupBy({ by: ['status'], where: { tenantId }, _count: { _all: true } }),
  ]);
  rows.sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      (a.slaDueAt?.getTime() ?? 9e15) - (b.slaDueAt?.getTime() ?? 9e15)
  );
  return res.json({
    data: {
      generatedAt: new Date().toISOString(),
      items: rows,
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    },
  });
});

async function loadActive(req: Request, res: Response) {
  const ex = await prisma.exception.findFirst({
    where: { id: String(req.params.id), tenantId: tenantOf(req) },
  });
  if (!ex) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'exception not found' } });
    return null;
  }
  if (!ACTIVE.includes(ex.status)) {
    res
      .status(409)
      .json({ error: { code: 'INVALID_STATE', message: `exception is '${ex.status}'` } });
    return null;
  }
  return ex;
}

async function audit(
  tenantId: string,
  actor: string | null,
  action: string,
  ex: any,
  metadata: object
) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: actor,
      action,
      entity: 'exception',
      entityId: ex.id,
      metadata: { type: ex.type, ...metadata },
    },
  });
}

// POST /v1/exceptions/:id/ack
exceptionsRouter.post('/:id/ack', async (req: Request, res: Response) => {
  const ex = await loadActive(req, res);
  if (!ex) return;
  if (ex.status !== 'open') {
    return res
      .status(409)
      .json({
        error: { code: 'INVALID_STATE', message: `cannot acknowledge from '${ex.status}'` },
      });
  }
  const actor = actorOf(req);
  const bodyOwner = (req.body as any)?.ownerId ? String((req.body as any).ownerId) : undefined;
  const updated = await prisma.exception.update({
    where: { id: ex.id },
    data: {
      status: 'acknowledged',
      ownerId: actor ?? bodyOwner ?? undefined,
      acknowledgedAt: new Date(),
    },
  });
  await audit(ex.tenantId, actor, 'exception.acknowledge', ex, {});
  return res.json({ data: updated });
});

// POST /v1/exceptions/:id/assign  (assignee = the caller; body optional)
exceptionsRouter.post('/:id/assign', async (req: Request, res: Response) => {
  const ex = await loadActive(req, res);
  if (!ex) return;
  const actor = actorOf(req);
  const assigneeId = String((req.body as any)?.assigneeId ?? actor ?? '');
  if (!assigneeId) {
    return res
      .status(400)
      .json({
        error: { code: 'ASSIGNEE_REQUIRED', message: 'assigneeId required when actor is unknown' },
      });
  }
  const updated = await prisma.exception.update({
    where: { id: ex.id },
    data: { assigneeId, status: ex.status === 'open' ? 'in_progress' : ex.status },
  });
  await audit(ex.tenantId, actor, 'exception.assign', ex, { assigneeId });
  return res.json({ data: updated });
});

// POST /v1/exceptions/:id/resolve { note? }
exceptionsRouter.post('/:id/resolve', async (req: Request, res: Response) => {
  const ex = await loadActive(req, res);
  if (!ex) return;
  const actor = actorOf(req);
  const note = (req.body as any)?.note ? String((req.body as any).note).trim() : null;
  const updated = await prisma.exception.update({
    where: { id: ex.id },
    data: { status: 'resolved', resolvedAt: new Date(), resolutionNote: note },
  });
  await audit(ex.tenantId, actor, 'exception.resolve', ex, { note });
  return res.json({ data: updated });
});

// POST /v1/exceptions/:id/dismiss { reason } — reason REQUIRED, audited
exceptionsRouter.post('/:id/dismiss', async (req: Request, res: Response) => {
  const ex = await loadActive(req, res);
  if (!ex) return;
  const reason = (req.body as any)?.reason ? String((req.body as any).reason).trim() : '';
  if (!reason) {
    return res
      .status(400)
      .json({
        error: { code: 'REASON_REQUIRED', message: 'a dismissal reason is required (audited)' },
      });
  }
  const actor = actorOf(req);
  const updated = await prisma.exception.update({
    where: { id: ex.id },
    data: {
      status: 'dismissed',
      dismissedAt: new Date(),
      dismissedBy: actor,
      dismissReason: reason,
    },
  });
  await audit(ex.tenantId, actor, 'exception.dismiss', ex, { reason });
  return res.json({ data: updated });
});
