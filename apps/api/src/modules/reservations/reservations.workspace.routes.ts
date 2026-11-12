/* apps/api/src/modules/reservations/reservations.workspace.routes.ts
 * Reservation workspace read-model (roadmap addendum 5.3, Phase 3 slice #2).
 * One aggregate GET powering the v2 workspace: header, lifecycle-derived
 * validActions (P5 matrix — UI shows only actions legal for the CURRENT
 * state, instead of hardcoding buttons the engine will 409), guests,
 * room & ops state, folio + payments, messages, tasks, traces, timeline —
 * plus change-preview inputs: per-night remaining availability for the
 * room type and the pricing basis, so the UI can show availability/pricing
 * impact and conflicts BEFORE a date/room/rate change is saved (addendum:
 * "before changing dates/room/rate, show availability/pricing impact,
 * channel sync, deposit/payment implications and conflicts").
 * Read-only. Mutations stay on the existing reservation endpoints, which
 * keep their own server-side enforcement (P5 M3).
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';
import { nextStates } from '../../common/lifecycle.js';

export const reservationWorkspaceRouter = Router();
reservationWorkspaceRouter.use(authMiddleware, tenantScope);

const ACTION_LABELS: Record<string, { action: string; label: string }> = {
  checked_in: { action: 'check-in', label: 'Check in' },
  checked_out: { action: 'check-out', label: 'Check out' },
  cancelled: { action: 'cancel', label: 'Cancel' },
  no_show: { action: 'no-show', label: 'Mark no-show' },
};

function tenantOf(req: Request): string | undefined {
  return ((req as any).user?.tenantId ?? (req as any).tenantId) as string | undefined;
}

function nightsBetween(a: Date, b: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  while (cur < end) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

// GET /v1/reservation-workspace/:id
reservationWorkspaceRouter.get('/:id', async (req: Request, res: Response) => {
  const tenantId = tenantOf(req)!;
  const id = String(req.params.id);
  const reservation = await prisma.reservation.findFirst({
    where: { id, tenantId },
    include: {
      guest: true,
      roomType: true,
      ratePlan: true,
      folio: { include: { items: { orderBy: { postedAt: 'desc' }, take: 50 } } },
      stays: { include: { room: true }, orderBy: { date: 'desc' }, take: 14 },
      companions: { orderBy: { createdAt: 'asc' } },
      traces: { orderBy: { createdAt: 'desc' }, take: 20 },
      tasks: { orderBy: { createdAt: 'desc' }, take: 20 },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!reservation) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'reservation not found' } });
  }

  const [threads, timeline, roomAgg, occupiedRows] = await Promise.all([
    prisma.chatThread.findMany({
      where: { tenantId, reservationId: id },
      orderBy: { lastMessageAt: 'desc' },
      take: 5,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }),
    prisma.auditLog.findMany({
      where: { tenantId, entity: 'reservation', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.room.count({
      where: {
        tenantId,
        propertyId: reservation.propertyId,
        roomTypeId: reservation.roomTypeId ?? undefined,
        serviceStatus: 'active',
      },
    }),
    prisma.reservationStay.groupBy({
      by: ['date'],
      where: {
        date: { gte: reservation.arrivalDate, lt: reservation.departureDate },
        room: { roomTypeId: reservation.roomTypeId ?? undefined, serviceStatus: 'active' },
        reservationId: { not: id },
      },
      _count: { _all: true },
    }),
  ]);
  const occupiedByNight = new Map(
    occupiedRows.map((r: any) => [new Date(r.date).toDateString(), r._count._all])
  );

  const preview = nightsBetween(reservation.arrivalDate, reservation.departureDate).map((d) => {
    const occupied = occupiedByNight.get(d.toDateString()) ?? 0;
    return {
      date: d.toISOString().slice(0, 10),
      roomsTotal: roomAgg,
      remaining: Math.max(0, roomAgg - occupied),
      conflict: roomAgg - occupied <= 0,
    };
  });
  const nightlyRate = reservation.ratePlan
    ? Number(reservation.ratePlan.baseRate)
    : Number(reservation.totalAmount) / Math.max(1, reservation.nights);

  const currentRoom = reservation.stays[0]?.room ?? null;
  const validActions: { action: string; label: string }[] = nextStates(
    'reservation',
    reservation.status
  ).map((s) => ACTION_LABELS[s] ?? { action: s, label: s });
  const folioBalance = reservation.folio
    ? Number(reservation.folio.balance)
    : Number(reservation.balance);
  if (['confirmed', 'checked_in'].includes(reservation.status) && folioBalance > 0) {
    validActions.push({ action: 'take-payment', label: 'Take payment' });
  }
  if (reservation.status === 'checked_in' && !currentRoom) {
    validActions.push({ action: 'assign-room', label: 'Assign room' });
  }

  const settled = reservation.payments
    .filter((p: any) => p.status === 'success')
    .reduce((s: number, p: any) => s + p.amountMinor, 0);

  return res.json({
    data: {
      header: {
        id: reservation.id,
        confirmationNumber: reservation.confirmationNumber,
        status: reservation.status,
        source: reservation.source,
        arrivalDate: reservation.arrivalDate,
        departureDate: reservation.departureDate,
        nights: reservation.nights,
        adults: reservation.adults,
        children: reservation.children,
        eta: reservation.eta,
        specialRequests: reservation.specialRequests,
        marketSegment: reservation.marketSegment,
        guaranteed: reservation.guaranteed,
        checkedInAt: reservation.checkedInAt,
        checkedOutAt: reservation.checkedOutAt,
        cancelledAt: reservation.cancelledAt,
        noShowAt: reservation.noShowAt,
        totalAmount: Number(reservation.totalAmount),
        depositDue: Number(reservation.depositDue),
        depositPaid: Number(reservation.depositPaid),
        propertyId: reservation.propertyId,
        guest: reservation.guest,
        roomType: reservation.roomType,
        ratePlan: reservation.ratePlan,
        assignedRoom: currentRoom,
        balance: folioBalance,
        settledMinor: settled,
      },
      validActions,
      companions: reservation.companions,
      stays: reservation.stays,
      folio: reservation.folio,
      payments: reservation.payments,
      tasks: reservation.tasks,
      traces: reservation.traces,
      messages: threads.map((t: any) => ({
        id: t.id,
        status: t.status,
        unreadForStaff: t.unreadForStaff,
        lastMessageAt: t.lastMessageAt,
        lastMessage: t.messages[0] ?? null,
      })),
      timeline: timeline.map((t: any) => ({
        at: t.createdAt,
        actor: t.userId,
        action: t.action,
        metadata: t.metadata,
      })),
      preview: { nights: preview, nightlyRate, currency: reservation.ratePlan?.currency ?? 'ZAR' },
    },
  });
});
