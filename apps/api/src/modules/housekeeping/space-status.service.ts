/* apps/api/src/modules/housekeeping/space-status.service.ts — T2+ Mews depth
 * Space lifecycle: OOO/OOS with mandatory reason, parent/child cascade,
 * reason-for-state on every transition, immutable event ledger.
 */
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { logAuditEvent } from '../audit/audit.service.js';

export const HK_STATUSES = ['clean', 'dirty', 'inspected', 'in_progress', 'ready'] as const;
export const SERVICE_STATUSES = ['active', 'ooo', 'oos'] as const;

export const transitionSchema = z.object({
  housekeepingStatus: z.enum(HK_STATUSES).optional(),
  serviceStatus: z.enum(SERVICE_STATUSES).optional(),
  reason: z.string().min(2).max(300).optional(),
  note: z.string().max(500).optional(),
});

async function recordEvent(
  room: { id: string; tenantId: string; propertyId: string },
  field: string,
  from: string | null,
  to: string,
  reason: string | null,
  note: string | undefined,
  actorId: string | null
) {
  await prisma.roomStatusEvent.create({
    data: {
      tenantId: room.tenantId,
      propertyId: room.propertyId,
      roomId: room.id,
      field,
      from,
      to,
      reason,
      note,
      actorId,
    },
  });
}

export async function transitionRoom(
  tenantId: string,
  roomId: string,
  actorId: string,
  input: z.infer<typeof transitionSchema>
) {
  if (!input.housekeepingStatus && !input.serviceStatus) {
    throw new AppError(400, 'Nothing to change', 'VALIDATION_ERROR');
  }
  const room = await prisma.room.findFirst({ where: { id: roomId, tenantId } });
  if (!room) throw new AppError(404, 'Room not found', 'NOT_FOUND');

  const needsReason =
    input.serviceStatus === 'ooo' ||
    input.serviceStatus === 'oos' ||
    input.housekeepingStatus === 'dirty';
  if (needsReason && !input.reason) {
    throw new AppError(400, 'reason is mandatory for OOO/OOS/dirty', 'REASON_REQUIRED');
  }

  const data: Record<string, unknown> = { statusChangedAt: new Date(), statusChangedBy: actorId };
  if (input.housekeepingStatus) data.housekeepingStatus = input.housekeepingStatus;
  if (input.serviceStatus) {
    data.serviceStatus = input.serviceStatus;
    data.serviceReason =
      input.serviceStatus === 'active' ? null : (input.reason ?? room.serviceReason);
  }

  const updated = await prisma.room.update({ where: { id: roomId }, data });

  if (input.housekeepingStatus && input.housekeepingStatus !== room.housekeepingStatus) {
    await recordEvent(
      room,
      'housekeepingStatus',
      room.housekeepingStatus,
      input.housekeepingStatus,
      input.reason ?? null,
      input.note,
      actorId
    );
  }
  if (input.serviceStatus && input.serviceStatus !== room.serviceStatus) {
    await recordEvent(
      room,
      'serviceStatus',
      room.serviceStatus,
      input.serviceStatus,
      input.reason ?? null,
      input.note,
      actorId
    );
    // Parent/child cascade: children follow the parent's service state
    if (input.serviceStatus !== 'active') {
      const children = await prisma.room.findMany({
        where: { parentRoomId: roomId, serviceStatus: { not: input.serviceStatus } },
        select: { id: true },
      });
      if (children.length > 0) {
        await prisma.room.updateMany({
          where: { id: { in: children.map((c) => c.id) } },
          data: {
            serviceStatus: input.serviceStatus,
            serviceReason: `cascade from parent room`,
            statusChangedAt: new Date(),
            statusChangedBy: actorId,
          },
        });
        for (const c of children) {
          await recordEvent(
            { id: c.id, tenantId: room.tenantId, propertyId: room.propertyId },
            'serviceStatus',
            null,
            input.serviceStatus,
            `cascade from room ${room.number}`,
            undefined,
            actorId
          );
        }
      }
    }
  }

  await logAuditEvent({
    tenantId,
    action: 'housekeeping.status_change',
    category: 'housekeeping',
    label: `Room ${room.number} → ${input.housekeepingStatus ?? input.serviceStatus}`,
    description: input.reason ?? input.note ?? '',
    entityType: 'room',
    entityId: roomId,
    metadata: { actorId },
    severity: 'info',
  });

  logger.info({ roomId, input }, 'room status transitioned');
  return updated;
}

/* ─── Space Status grid ─── */
export async function getSpaceStatus(tenantId: string, propertyId?: string, date?: string) {
  const day = date ?? new Date().toISOString().slice(0, 10);
  const where = { tenantId, ...(propertyId ? { propertyId } : {}) };

  const rooms = await prisma.room.findMany({
    where,
    select: {
      id: true,
      number: true,
      floor: true,
      housekeepingStatus: true,
      serviceStatus: true,
      serviceReason: true,
      statusChangedAt: true,
      parentRoomId: true,
      roomType: { select: { code: true, name: true } },
      _count: { select: { childRooms: true } },
    },
    orderBy: [{ floor: 'asc' }, { number: 'asc' }],
  });

  const [arrivals, departures, stayovers] = await Promise.all([
    prisma.reservation.count({
      where: { ...where, status: 'confirmed', arrivalDate: new Date(day) },
    }),
    prisma.reservation.count({
      where: { ...where, status: 'checked_in', departureDate: new Date(day) },
    }),
    prisma.reservation.count({
      where: {
        ...where,
        status: 'checked_in',
        arrivalDate: { lte: new Date(day) },
        departureDate: { gt: new Date(day) },
      },
    }),
  ]);

  const countBy = (fn: (r: (typeof rooms)[0]) => string) =>
    rooms.reduce<Record<string, number>>((acc, r) => {
      const k = fn(r);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

  return {
    stats: {
      total: rooms.length,
      byHousekeeping: countBy((r) => r.housekeepingStatus),
      byService: countBy((r) => r.serviceStatus),
    },
    cards: { arrivals, departures, stayovers },
    rooms,
  };
}

export async function exportSpaceStatus(tenantId: string, propertyId?: string) {
  const grid = await getSpaceStatus(tenantId, propertyId);
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    'Room',
    'Floor',
    'Type',
    'HK Status',
    'Service',
    'Reason',
    'Changed At',
    'Children',
  ];
  const lines = grid.rooms.map((r) =>
    [
      r.number,
      r.floor,
      r.roomType.code,
      r.housekeepingStatus,
      r.serviceStatus,
      r.serviceReason,
      r.statusChangedAt,
      r._count.childRooms,
    ]
      .map(esc)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}
