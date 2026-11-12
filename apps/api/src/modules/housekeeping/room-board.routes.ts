/* apps/api/src/modules/housekeeping/room-board.routes.ts
 * Room board read-model (roadmap addendum 5.3, Phase 3 slice #3).
 * One aggregate GET powering the v2 room board: every room with its full
 * operational picture — housekeeping state, service state (active/ooo/oos),
 * current occupant, next stay, open tasks — plus:
 *   - validTransitions from the P5 ROOM MATRIX below (single documented
 *     source; merge into common/lifecycle.ts when it grows a room matrix).
 *     The UI only renders these; the existing
 *     POST /housekeeping/rooms/:id/status endpoint keeps owning enforcement.
 *   - assignable computed SERVER-SIDE: serviceStatus 'active' AND
 *     housekeepingStatus 'ready' ONLY. A blocked room or one awaiting
 *     inspection is never offered for assignment (addendum: "a blocked room
 *     or room awaiting required inspection must not be assignable").
 *   - GET /:roomId/history: room_status_events + recent stay assignments,
 *     so the card drawer shows room history without module-hopping.
 * Read-only; mutations stay on the existing, already-tested endpoints.
 *
 * TZ CONTRACT: Prisma @db.Date columns round-trip as UTC midnight. ALL date
 * comparisons below use UTC-midnight bounds derived from the LOCAL calendar
 * date (`dayBounds`), never local-midnight Date objects — exact-equality
 * against DATE columns silently fails on any non-UTC server TZ otherwise
 * (found in P10: stayovers/arrivals/departures read 0 at +02:00).
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';

export const roomBoardRouter = Router();
roomBoardRouter.use(authMiddleware, tenantScope);
roomBoardRouter.use(requirePermission('housekeeping', 'read'));

/* ─── P5 room matrix ─── */
const HK_TRANSITIONS: Record<string, { to: string; label: string }[]> = {
  dirty: [{ to: 'in_progress', label: 'Start cleaning' }],
  in_progress: [
    { to: 'clean', label: 'Mark clean' },
    { to: 'dirty', label: 'Back to dirty' },
  ],
  clean: [
    { to: 'inspected', label: 'Inspect' },
    { to: 'dirty', label: 'Mark dirty' },
  ],
  inspected: [
    { to: 'ready', label: 'Make ready' },
    { to: 'dirty', label: 'Failed inspection' },
  ],
  ready: [
    { to: 'dirty', label: 'Mark dirty' },
    { to: 'inspected', label: 'Re-inspect' },
  ],
};
const SERVICE_TRANSITIONS: Record<
  string,
  { to: string; label: string; reasonRequired: boolean }[]
> = {
  active: [
    { to: 'ooo', label: 'Out of order', reasonRequired: true },
    { to: 'oos', label: 'Out of service', reasonRequired: true },
  ],
  ooo: [{ to: 'active', label: 'Return to service', reasonRequired: false }],
  oos: [{ to: 'active', label: 'Return to service', reasonRequired: false }],
};
/** Addendum rule: only 'ready' rooms in service are assignable. */
const ASSIGNABLE_HK = new Set(['ready']);

function tenantOf(req: Request): string | undefined {
  return ((req as any).auth?.user?.tenantId ??
    (req as any).auth?.tenantId ??
    (req as any).tenantId) as string | undefined;
}
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
/** UTC-midnight bounds for the LOCAL calendar date of `ref`. */
function dayBounds(ref: Date) {
  const start = new Date(Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate()));
  const label = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-${String(
    ref.getDate()
  ).padStart(2, '0')}`;
  return { start, end: addDays(start, 1), label };
}

interface RoomCtx {
  tasksByRoom: Map<string, any[]>;
  staysByRoom: Map<string, any[]>;
  dayStart: Date;
  dayEnd: Date;
}

function roomView(room: any, ctx: RoomCtx) {
  const stays = ctx.staysByRoom.get(room.id) ?? [];
  const t = (s: any) => new Date(s.date).getTime();
  const occupantStay = stays.find(
    (s: any) => t(s) >= ctx.dayStart.getTime() && t(s) < ctx.dayEnd.getTime()
  );
  const nextStay = stays.find(
    (s: any) => t(s) >= ctx.dayEnd.getTime() && s.reservation?.status !== 'cancelled'
  );
  const pick = (s: any) =>
    s && s.reservation
      ? {
          reservationId: s.reservation.id,
          confirmationNumber: s.reservation.confirmationNumber,
          guestName: `${s.reservation.guest.firstName} ${s.reservation.guest.lastName}`,
          status: s.reservation.status,
          date: s.date,
        }
      : null;
  return {
    id: room.id,
    number: room.number,
    floor: room.floor,
    roomType: { id: room.roomType.id, name: room.roomType.name, code: room.roomType.code },
    housekeepingStatus: room.housekeepingStatus,
    serviceStatus: room.serviceStatus,
    serviceReason: room.serviceReason,
    parentRoomId: room.parentRoomId,
    childCount: room._count?.childRooms ?? 0,
    statusChangedAt: room.statusChangedAt,
    assignable: room.serviceStatus === 'active' && ASSIGNABLE_HK.has(room.housekeepingStatus),
    blocked: room.serviceStatus !== 'active',
    occupant: pick(occupantStay),
    nextStay: pick(nextStay),
    openTasks: (ctx.tasksByRoom.get(room.id) ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      department: t.department,
      status: t.status,
      priority: t.priority,
    })),
    validTransitions: [
      ...(HK_TRANSITIONS[room.housekeepingStatus] ?? []).map((t) => ({
        field: 'housekeepingStatus',
        to: t.to,
        label: t.label,
        // Enforcement contract (P10 finding): reason is MANDATORY for
        // dirty/OOO/OOS — the T2 status endpoint 400s REASON_REQUIRED
        // otherwise. Target 'dirty' always requires a reason.
        reasonRequired: t.to === 'dirty',
      })),
      ...(SERVICE_TRANSITIONS[room.serviceStatus] ?? []).map((t) => ({
        field: 'serviceStatus',
        to: t.to,
        label: t.label,
        reasonRequired: t.reasonRequired,
      })),
    ],
  };
}

async function loadCtx(
  tenantId: string,
  roomIds: string[],
  b: { start: Date; end: Date }
): Promise<RoomCtx> {
  const [tasks, stays] = await Promise.all([
    prisma.task.findMany({
      where: { tenantId, roomId: { in: roomIds }, status: { in: ['open', 'in_progress'] } },
      select: {
        id: true,
        roomId: true,
        title: true,
        department: true,
        status: true,
        priority: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.reservationStay.findMany({
      where: { roomId: { in: roomIds }, date: { gte: b.start } },
      include: { reservation: { include: { guest: true } } },
      orderBy: { date: 'asc' },
      take: 1000,
    }),
  ]);
  const tasksByRoom = new Map<string, any[]>();
  for (const t of tasks) {
    const list = tasksByRoom.get(t.roomId!) ?? [];
    list.push(t);
    tasksByRoom.set(t.roomId!, list);
  }
  const staysByRoom = new Map<string, any[]>();
  for (const s of stays) {
    const list = staysByRoom.get(s.roomId) ?? [];
    list.push(s);
    staysByRoom.set(s.roomId, list);
  }
  return { tasksByRoom, staysByRoom, dayStart: b.start, dayEnd: b.end };
}

// GET /v1/room-board?propertyId=&date=YYYY-MM-DD
roomBoardRouter.get('/', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const propertyId = String(req.query.propertyId ?? '');
  const prop = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!prop) {
    return res
      .status(400)
      .json({ error: { code: 'BAD_PROPERTY', message: 'property not found for tenant' } });
  }
  const ref = req.query.date ? new Date(String(req.query.date) + 'T12:00:00') : new Date();
  const b = dayBounds(ref);

  const rooms = await prisma.room.findMany({
    where: { tenantId, propertyId },
    include: { roomType: true, _count: { select: { childRooms: true } } },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  });
  const ctx = await loadCtx(
    tenantId,
    rooms.map((r) => r.id),
    b
  );
  const views = rooms.map((r) => roomView(r, ctx));

  const tEnd = addDays(b.end, 1);
  const [arrivals, departures, stayTodayIds, stayTomorrow] = await Promise.all([
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId,
        arrivalDate: { gte: b.start, lt: b.end },
        status: { in: ['confirmed', 'checked_in'] },
      },
    }),
    prisma.reservation.count({
      where: {
        tenantId,
        propertyId,
        departureDate: { gte: b.start, lt: b.end },
        status: 'checked_in',
      },
    }),
    prisma.reservationStay.findMany({
      where: { roomId: { in: rooms.map((r) => r.id) }, date: { gte: b.start, lt: b.end } },
      select: { roomId: true },
    }),
    prisma.reservationStay.findMany({
      where: { roomId: { in: rooms.map((r) => r.id) }, date: { gte: b.end, lt: tEnd } },
      select: { roomId: true },
    }),
  ]);
  const todaySet = new Set(stayTodayIds.map((s) => s.roomId));
  const stayovers = stayTomorrow.filter((s) => todaySet.has(s.roomId)).length;

  const stats = {
    total: views.length,
    assignable: views.filter((v) => v.assignable).length,
    dirty: views.filter((v) => v.housekeepingStatus === 'dirty').length,
    inProgress: views.filter((v) => v.housekeepingStatus === 'in_progress').length,
    inspected: views.filter((v) => v.housekeepingStatus === 'inspected').length,
    blocked: views.filter((v) => v.blocked).length,
  };

  return res.json({
    data: {
      property: { id: prop.id, name: prop.name, code: prop.code },
      date: b.label,
      stats,
      cards: { arrivals, departures, stayovers },
      rooms: views,
    },
  });
});

// GET /v1/room-board/:roomId — drawer detail: history + recent stays + tasks
roomBoardRouter.get('/:roomId', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const room = await prisma.room.findFirst({
    where: { id: String(req.params.roomId), tenantId },
    include: { roomType: true, _count: { select: { childRooms: true } } },
  });
  if (!room) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'room not found' } });
  }
  const b = dayBounds(new Date());
  const [events, pastStays, ctx] = await Promise.all([
    prisma.roomStatusEvent.findMany({
      where: { tenantId, roomId: room.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.reservationStay.findMany({
      where: { roomId: room.id, date: { lt: b.start } },
      include: { reservation: { include: { guest: true } } },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    loadCtx(tenantId, [room.id], b),
  ]);
  return res.json({
    data: {
      ...roomView(room, ctx),
      history: events.map((e: any) => ({
        at: e.createdAt,
        field: e.field,
        from: e.from,
        to: e.to,
        reason: e.reason,
        note: e.note,
        actorId: e.actorId,
      })),
      recentStays: pastStays.map((s: any) => ({
        date: s.date,
        rate: Number(s.rate),
        confirmationNumber: s.reservation.confirmationNumber,
        guestName: `${s.reservation.guest.firstName} ${s.reservation.guest.lastName}`,
        status: s.reservation.status,
      })),
    },
  });
});
