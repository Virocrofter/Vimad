/* apps/api/src/modules/parking/parking.service.ts — T4
 * Parking board: bay map, guest vehicle registry, plate captured at
 * check-in, auto bay assignment from today's arrivals with a vehicle on
 * file, valet queue. No gate hardware, no boom integration.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { AppError } from '../../common/errors.js';

export const BAY_ZONES = ['standard', 'accessible', 'ev', 'valet'] as const;
export const CHARGING_STATUSES = ['free', 'charging', 'full'] as const;

const ASSIGNMENT_INCLUDE = {
  vehicle: {
    include: {
      guest: { select: { id: true, firstName: true, lastName: true, vipStatus: true } },
    },
  },
} as const;

function dayBounds(date: string): { start: Date; end: Date } {
  const start = new Date(`${date}T00:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function resolveProperty(tenantId: string, propertyId?: string) {
  if (propertyId) {
    const p = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
    if (!p) throw new AppError(404, 'Property not found', 'NOT_FOUND');
    return p;
  }
  const first = await prisma.property.findFirst({
    where: { tenantId, status: 'active' },
    orderBy: { createdAt: 'asc' },
  });
  if (!first) throw new AppError(400, 'No property configured for this tenant', 'NOT_FOUND');
  return first;
}

async function logAudit(
  tenantId: string,
  userId: string,
  entity: string,
  entityId: string,
  action: string,
  metadata: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog
    .create({
      data: { tenantId, userId, action, entity, entityId, metadata: metadata as object },
    })
    .catch((err) => logger.warn({ err }, 'parking audit log failed'));
}

// ─── Bays ───

export async function listBays(
  tenantId: string,
  query: { propertyId?: string; zone?: string; status?: string }
): Promise<Record<string, unknown>[]> {
  const bays = await prisma.parkingBay.findMany({
    where: {
      tenantId,
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.zone ? { zone: query.zone } : {}),
      ...(query.status ? { status: query.status } : {}),
    },
    include: {
      assignments: {
        where: { status: { in: ['scheduled', 'active'] } },
        include: ASSIGNMENT_INCLUDE,
        orderBy: { scheduledFor: 'desc' },
        take: 1,
      },
    },
    orderBy: { label: 'asc' },
  });
  return bays.map((b) => ({ ...b, current: b.assignments[0] ?? null, assignments: undefined }));
}

export async function createBay(
  tenantId: string,
  userId: string,
  input: Record<string, unknown>
): Promise<{ id: string }> {
  const property = await resolveProperty(tenantId, input.propertyId as string | undefined);
  const label = (input.label as string).trim().toUpperCase();
  if (!label) throw new AppError(400, 'Bay label is required', 'VALIDATION_ERROR');

  try {
    const bay = await prisma.parkingBay.create({
      data: {
        tenantId,
        propertyId: property.id,
        label,
        zone: (input.zone as string | undefined) ?? 'standard',
        evCharger: Boolean(input.evCharger),
        notes: (input.notes as string | undefined) ?? null,
      },
    });
    await logAudit(tenantId, userId, 'parking_bay', bay.id, 'parking.bay.create', { label });
    return { id: bay.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, `Bay ${label} already exists on this property`, 'CONFLICT');
    }
    throw err;
  }
}

export async function updateBay(
  tenantId: string,
  userId: string,
  id: string,
  input: Record<string, unknown>
): Promise<void> {
  const bay = await prisma.parkingBay.findFirst({ where: { id, tenantId } });
  if (!bay) throw new AppError(404, 'Bay not found', 'NOT_FOUND');

  const data: Prisma.ParkingBayUpdateInput = {};
  if (input.zone !== undefined) {
    if (!BAY_ZONES.includes(input.zone as (typeof BAY_ZONES)[number])) {
      throw new AppError(400, `Unknown zone "${input.zone}"`, 'VALIDATION_ERROR');
    }
    data.zone = input.zone as string;
  }
  if (input.notes !== undefined) data.notes = (input.notes as string) ?? null;
  if (input.evCharger !== undefined) data.evCharger = Boolean(input.evCharger);
  if (input.chargingStatus !== undefined) {
    if (!CHARGING_STATUSES.includes(input.chargingStatus as (typeof CHARGING_STATUSES)[number])) {
      throw new AppError(
        400,
        `Unknown charging status "${input.chargingStatus}"`,
        'VALIDATION_ERROR'
      );
    }
    data.chargingStatus = input.chargingStatus as string;
  }
  if (input.status !== undefined) {
    // occupied/reserved are assignment-driven — only direct ops allowed here
    if (!['available', 'out_of_service'].includes(input.status as string)) {
      throw new AppError(409, `Status "${input.status}" is managed by assignments`, 'CONFLICT');
    }
    data.status = input.status as string;
  }

  await prisma.parkingBay.update({ where: { id }, data });
  await logAudit(tenantId, userId, 'parking_bay', id, 'parking.bay.update', { input });
}

export async function deleteBay(tenantId: string, userId: string, id: string): Promise<void> {
  const bay = await prisma.parkingBay.findFirst({ where: { id, tenantId } });
  if (!bay) throw new AppError(404, 'Bay not found', 'NOT_FOUND');
  const open = await prisma.parkingAssignment.count({
    where: { bayId: id, status: { in: ['scheduled', 'active'] } },
  });
  if (open > 0) {
    throw new AppError(
      409,
      `Bay ${bay.label} has ${open} open assignment(s) — cancel them first`,
      'CONFLICT'
    );
  }
  await prisma.parkingBay.delete({ where: { id } });
  await logAudit(tenantId, userId, 'parking_bay', id, 'parking.bay.delete', { label: bay.label });
}

export async function setCharging(
  tenantId: string,
  userId: string,
  id: string,
  status: string
): Promise<void> {
  const bay = await prisma.parkingBay.findFirst({ where: { id, tenantId } });
  if (!bay) throw new AppError(404, 'Bay not found', 'NOT_FOUND');
  if (!bay.evCharger) throw new AppError(400, 'Bay has no EV charger', 'VALIDATION_ERROR');
  await prisma.parkingBay.update({ where: { id }, data: { chargingStatus: status } });
  await logAudit(tenantId, userId, 'parking_bay', id, 'parking.bay.charging', { status });
}

// ─── Vehicles ───

export async function listVehicles(
  tenantId: string,
  query: { guestId?: string; plate?: string; includeInactive?: boolean }
): Promise<Record<string, unknown>[]> {
  return prisma.guestVehicle.findMany({
    where: {
      tenantId,
      ...(query.guestId ? { guestId: query.guestId } : {}),
      ...(query.plate ? { plate: { contains: query.plate, mode: 'insensitive' } } : {}),
      ...(query.includeInactive ? {} : { active: true }),
    },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true, vipStatus: true } },
      assignments: {
        where: { status: 'active' },
        select: { id: true, bay: { select: { label: true } } },
        take: 1,
      },
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createVehicle(
  tenantId: string,
  userId: string,
  input: Record<string, unknown>
): Promise<{ id: string }> {
  const guest = await prisma.guest.findFirst({
    where: { id: input.guestId as string, tenantId },
  });
  if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');
  const plate = (input.plate as string).trim().toUpperCase();
  if (!plate) throw new AppError(400, 'Plate is required', 'VALIDATION_ERROR');

  try {
    const vehicle = await prisma.guestVehicle.create({
      data: {
        tenantId,
        guestId: guest.id,
        plate,
        make: (input.make as string | undefined) ?? null,
        model: (input.model as string | undefined) ?? null,
        color: (input.color as string | undefined) ?? null,
        isElectric: Boolean(input.isElectric),
        isPrimary: Boolean(input.isPrimary),
      },
    });
    await logAudit(tenantId, userId, 'guest_vehicle', vehicle.id, 'parking.vehicle.create', {
      plate,
    });
    return { id: vehicle.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, `Plate ${plate} already exists for this tenant`, 'CONFLICT');
    }
    throw err;
  }
}

export async function updateVehicle(
  tenantId: string,
  userId: string,
  id: string,
  input: Record<string, unknown>
): Promise<void> {
  const vehicle = await prisma.guestVehicle.findFirst({ where: { id, tenantId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');

  if (input.isPrimary === true) {
    // one primary per guest
    await prisma.guestVehicle.updateMany({
      where: { tenantId, guestId: vehicle.guestId, id: { not: id } },
      data: { isPrimary: false },
    });
  }

  await prisma.guestVehicle.update({
    where: { id },
    data: {
      ...(input.plate !== undefined ? { plate: (input.plate as string).trim().toUpperCase() } : {}),
      ...(input.make !== undefined ? { make: (input.make as string) ?? null } : {}),
      ...(input.model !== undefined ? { model: (input.model as string) ?? null } : {}),
      ...(input.color !== undefined ? { color: (input.color as string) ?? null } : {}),
      ...(input.isElectric !== undefined ? { isElectric: Boolean(input.isElectric) } : {}),
      ...(input.isPrimary !== undefined ? { isPrimary: Boolean(input.isPrimary) } : {}),
      ...(input.active !== undefined ? { active: Boolean(input.active) } : {}),
    },
  });
  await logAudit(tenantId, userId, 'guest_vehicle', id, 'parking.vehicle.update', { input });
}

export async function deactivateVehicle(
  tenantId: string,
  userId: string,
  id: string
): Promise<void> {
  const vehicle = await prisma.guestVehicle.findFirst({ where: { id, tenantId } });
  if (!vehicle) throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
  const open = await prisma.parkingAssignment.count({
    where: { vehicleId: id, status: { in: ['scheduled', 'active'] } },
  });
  if (open > 0) {
    throw new AppError(409, 'Vehicle has open parking assignments — cancel them first', 'CONFLICT');
  }
  await prisma.guestVehicle.update({ where: { id }, data: { active: false, isPrimary: false } });
  await logAudit(tenantId, userId, 'guest_vehicle', id, 'parking.vehicle.deactivate', {});
}

// ─── Assignments ───

export async function listAssignments(
  tenantId: string,
  query: { propertyId?: string; date?: string; status?: string }
): Promise<Record<string, unknown>[]> {
  const date = query.date ?? todayStr();
  const { start } = dayBounds(date);
  return prisma.parkingAssignment.findMany({
    where: {
      tenantId,
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.status ? { status: query.status } : { status: { in: ['scheduled', 'active'] } }),
      scheduledFor: start,
    },
    include: { ...ASSIGNMENT_INCLUDE, bay: { select: { id: true, label: true, zone: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function createAssignment(
  tenantId: string,
  userId: string,
  input: Record<string, unknown>
): Promise<{ id: string }> {
  const property = await resolveProperty(tenantId, input.propertyId as string | undefined);
  const vehicle = await prisma.guestVehicle.findFirst({
    where: { id: input.vehicleId as string, tenantId, active: true },
  });
  if (!vehicle) throw new AppError(404, 'Vehicle not found (or inactive)', 'NOT_FOUND');
  const bay = await prisma.parkingBay.findFirst({
    where: { id: input.bayId as string, tenantId },
  });
  if (!bay) throw new AppError(404, 'Bay not found', 'NOT_FOUND');
  if (bay.status === 'out_of_service') {
    throw new AppError(409, `Bay ${bay.label} is out of service`, 'CONFLICT');
  }

  const date = (input.scheduledFor as string | undefined) ?? todayStr();
  const { start } = dayBounds(date);
  const plate = (input.plateAtCheckin as string | undefined) ?? null;
  const active = Boolean(plate); // plate captured at creation = car is already on site

  const reservationId = (input.reservationId as string | undefined) ?? null;
  if (reservationId) {
    const res = await prisma.reservation.findFirst({ where: { id: reservationId, tenantId } });
    if (!res) throw new AppError(404, 'Reservation not found', 'NOT_FOUND');
  }

  const assignment = await prisma.$transaction(async (tx) => {
    const clash = await tx.parkingAssignment.findFirst({
      where: { bayId: bay.id, scheduledFor: start, status: { in: ['scheduled', 'active'] } },
    });
    if (clash) {
      throw new AppError(409, `Bay ${bay.label} already reserved for ${date}`, 'CONFLICT');
    }
    const a = await tx.parkingAssignment.create({
      data: {
        tenantId,
        propertyId: property.id,
        bayId: bay.id,
        vehicleId: vehicle.id,
        reservationId,
        status: active ? 'active' : 'scheduled',
        valet: Boolean(input.valet),
        valetInstructions: (input.valetInstructions as string | undefined) ?? null,
        valetKeyLocation: (input.valetKeyLocation as string | undefined) ?? null,
        plateAtCheckin: plate,
        assignedBy: userId,
        scheduledFor: start,
        checkedInAt: active ? new Date() : null,
      },
    });
    await tx.parkingBay.update({
      where: { id: bay.id },
      data: { status: active ? 'occupied' : 'reserved' },
    });
    return a;
  });

  await logAudit(tenantId, userId, 'parking_assignment', assignment.id, 'parking.assign', {
    bay: bay.label,
    plate: vehicle.plate,
    date,
  });
  return { id: assignment.id };
}

export async function updateAssignment(
  tenantId: string,
  userId: string,
  id: string,
  input: Record<string, unknown>
): Promise<void> {
  const a = await prisma.parkingAssignment.findFirst({ where: { id, tenantId } });
  if (!a) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  await prisma.parkingAssignment.update({
    where: { id },
    data: {
      ...(input.valetInstructions !== undefined
        ? { valetInstructions: (input.valetInstructions as string) ?? null }
        : {}),
      ...(input.valetKeyLocation !== undefined
        ? { valetKeyLocation: (input.valetKeyLocation as string) ?? null }
        : {}),
      ...(input.valet !== undefined ? { valet: Boolean(input.valet) } : {}),
    },
  });
  await logAudit(tenantId, userId, 'parking_assignment', id, 'parking.assignment.update', {
    input,
  });
}

export async function checkInAssignment(
  tenantId: string,
  userId: string,
  id: string,
  plate?: string
): Promise<void> {
  const a = await prisma.parkingAssignment.findFirst({
    where: { id, tenantId },
    include: { vehicle: true, bay: { select: { label: true } } },
  });
  if (!a) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  if (a.status !== 'scheduled') {
    throw new AppError(409, `Assignment is ${a.status} — only scheduled can check in`, 'CONFLICT');
  }
  const captured = (plate ?? a.vehicle.plate).trim().toUpperCase();

  await prisma.$transaction([
    prisma.parkingAssignment.update({
      where: { id },
      data: { status: 'active', checkedInAt: new Date(), plateAtCheckin: captured },
    }),
    prisma.parkingBay.update({ where: { id: a.bayId }, data: { status: 'occupied' } }),
  ]);

  await logAudit(tenantId, userId, 'parking_assignment', id, 'parking.checkin', {
    bay: a.bay.label,
    plate: captured,
  });
  logger.info({ assignmentId: id, bay: a.bay.label, plate: captured }, 'vehicle checked in to bay');
}

export async function checkOutAssignment(
  tenantId: string,
  userId: string,
  id: string
): Promise<void> {
  const a = await prisma.parkingAssignment.findFirst({
    where: { id, tenantId },
    include: { bay: { select: { label: true } } },
  });
  if (!a) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  if (a.status !== 'active') {
    throw new AppError(409, `Assignment is ${a.status} — only active can check out`, 'CONFLICT');
  }
  await prisma.$transaction([
    prisma.parkingAssignment.update({
      where: { id },
      data: { status: 'completed', checkedOutAt: new Date() },
    }),
    prisma.parkingBay.update({
      where: { id: a.bayId },
      data: { status: 'available', chargingStatus: 'free' },
    }),
  ]);
  await logAudit(tenantId, userId, 'parking_assignment', id, 'parking.checkout', {
    bay: a.bay.label,
  });
}

export async function cancelAssignment(
  tenantId: string,
  userId: string,
  id: string
): Promise<void> {
  const a = await prisma.parkingAssignment.findFirst({
    where: { id, tenantId },
    include: { bay: { select: { label: true } } },
  });
  if (!a) throw new AppError(404, 'Assignment not found', 'NOT_FOUND');
  if (a.status !== 'scheduled') {
    throw new AppError(
      409,
      `Assignment is ${a.status} — only scheduled can be cancelled`,
      'CONFLICT'
    );
  }
  await prisma.$transaction([
    prisma.parkingAssignment.update({ where: { id }, data: { status: 'cancelled' } }),
    prisma.parkingBay.update({ where: { id: a.bayId }, data: { status: 'available' } }),
  ]);
  await logAudit(tenantId, userId, 'parking_assignment', id, 'parking.cancel', {
    bay: a.bay.label,
  });
}

// ─── Board ───

export async function getBoard(
  tenantId: string,
  date: string,
  propertyId?: string
): Promise<Record<string, unknown>> {
  const property = await resolveProperty(tenantId, propertyId);
  const { start, end } = dayBounds(date);

  const [bays, assignments, arrivals] = await Promise.all([
    prisma.parkingBay.findMany({
      where: { tenantId, propertyId: property.id },
      orderBy: { label: 'asc' },
    }),
    prisma.parkingAssignment.findMany({
      where: {
        tenantId,
        propertyId: property.id,
        scheduledFor: start,
        status: { in: ['scheduled', 'active'] },
      },
      include: ASSIGNMENT_INCLUDE,
    }),
    todaysArrivals(tenantId, property.id, start, end),
  ]);

  // Attach reservation confirmation numbers (plain ids → one lookup)
  const resIds = [...new Set(assignments.map((a) => a.reservationId).filter(Boolean))] as string[];
  const reservations = resIds.length
    ? await prisma.reservation.findMany({
        where: { id: { in: resIds }, tenantId },
        select: { id: true, confirmationNumber: true, status: true },
      })
    : [];
  const resMap = new Map(reservations.map((r) => [r.id, r]));

  const taken = new Set(assignments.map((a) => `${a.reservationId}:${a.vehicleId}`));
  const unassigned: Record<string, unknown>[] = [];
  for (const { reservation, guest } of arrivals) {
    for (const vehicle of guest.vehicles) {
      if (taken.has(`${reservation.id}:${vehicle.id}`)) continue;
      unassigned.push({
        reservation: {
          id: reservation.id,
          confirmationNumber: reservation.confirmationNumber,
          status: reservation.status,
        },
        guest: {
          id: guest.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          vipStatus: guest.vipStatus,
        },
        vehicle,
      });
    }
  }

  const baysWithState = bays.map((bay) => {
    const assignment = assignments.find((a) => a.bayId === bay.id) ?? null;
    return {
      ...bay,
      assignment,
      reservation: assignment?.reservationId
        ? (resMap.get(assignment.reservationId) ?? null)
        : null,
    };
  });

  const count = (s: string) => bays.filter((b) => b.status === s).length;

  return {
    date,
    property: { id: property.id, name: property.name },
    stats: {
      total: bays.length,
      available: count('available'),
      reserved: count('reserved'),
      occupied: count('occupied'),
      outOfService: count('out_of_service'),
      evCharging: bays.filter((b) => b.evCharger && b.chargingStatus === 'charging').length,
      valetQueue: assignments.filter((a) => a.valet && a.status === 'active').length,
      unassignedArrivals: unassigned.length,
    },
    bays: baysWithState,
    unassigned,
  };
}

async function todaysArrivals(
  tenantId: string,
  propertyId: string,
  start: Date,
  end: Date
): Promise<{ reservation: any; guest: any }[]> {
  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      propertyId,
      arrivalDate: { gte: start, lt: end },
      status: { in: ['confirmed', 'checked_in'] },
    },
    include: {
      guest: {
        include: {
          preferences: { select: { category: true } },
          vehicles: {
            where: { active: true },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          },
        },
      },
    },
    orderBy: { arrivalDate: 'asc' },
  });
  return reservations
    .filter((r) => r.guest.vehicles.length > 0)
    .map((r) => ({ reservation: r, guest: r.guest }));
}

// ─── Valet queue ───

export async function getValetQueue(
  tenantId: string,
  propertyId?: string
): Promise<Record<string, unknown>[]> {
  const scope = { tenantId, ...(propertyId ? { propertyId } : {}) };
  return prisma.parkingAssignment.findMany({
    where: { ...scope, valet: true, status: { in: ['scheduled', 'active'] } },
    include: { ...ASSIGNMENT_INCLUDE, bay: { select: { id: true, label: true, zone: true } } },
    orderBy: [{ status: 'desc' }, { scheduledFor: 'asc' }],
  });
}

// ─── Auto-assign ───

function pickBay(
  bays: { zone: string }[],
  preferredZone: string
): { index: number; valet: boolean } | null {
  const nonValet = bays.map((b, i) => ({ b, i })).filter(({ b }) => b.zone !== 'valet');
  const order: number[] = [];
  const push = (pred: (zone: string) => boolean) => {
    for (const { b, i } of nonValet) if (pred(b.zone) && !order.includes(i)) order.push(i);
  };
  push((z) => z === preferredZone);
  push((z) => z === 'standard');
  push(() => true);
  if (order.length > 0) return { index: order[0], valet: false };
  const valet = bays.findIndex((b) => b.zone === 'valet');
  return valet >= 0 ? { index: valet, valet: true } : null;
}

export async function autoAssign(
  tenantId: string,
  actor: string,
  propertyId?: string,
  dateStr?: string
): Promise<{ assigned: number; valet: number; activated: number; skipped: number }> {
  const property = await resolveProperty(tenantId, propertyId);
  const date = dateStr ?? todayStr();
  const { start, end } = dayBounds(date);

  // Pass 1 — activate: scheduled assignments whose guest already checked in.
  let activated = 0;
  const scheduled = await prisma.parkingAssignment.findMany({
    where: { tenantId, propertyId: property.id, status: 'scheduled', scheduledFor: start },
    select: { id: true, reservationId: true },
  });
  if (scheduled.length > 0) {
    const resIds = scheduled.map((s) => s.reservationId).filter(Boolean) as string[];
    const checkedIn = new Set(
      (
        await prisma.reservation.findMany({
          where: { id: { in: resIds }, status: 'checked_in' },
          select: { id: true },
        })
      ).map((r) => r.id)
    );
    for (const s of scheduled) {
      if (!s.reservationId || !checkedIn.has(s.reservationId)) continue;
      await prisma.parkingAssignment.update({
        where: { id: s.id },
        data: { status: 'active', checkedInAt: new Date() },
      });
      activated++;
    }
  }

  // Pass 2 — assign: today's arrivals with a vehicle on file and no assignment.
  const [availableBays, existing, arrivals] = await Promise.all([
    prisma.parkingBay.findMany({
      where: { tenantId, propertyId: property.id, status: 'available' },
      orderBy: { label: 'asc' },
    }),
    prisma.parkingAssignment.findMany({
      where: {
        tenantId,
        propertyId: property.id,
        scheduledFor: start,
        status: { in: ['scheduled', 'active'] },
      },
      select: { reservationId: true, vehicleId: true },
    }),
    todaysArrivals(tenantId, property.id, start, end),
  ]);

  const taken = new Set(existing.map((e) => `${e.reservationId}:${e.vehicleId}`));
  let assigned = 0;
  let valet = 0;
  let skipped = 0;

  for (const { reservation, guest } of arrivals) {
    const wantsAccessible = (guest.preferences ?? []).some(
      (p: { category: string }) => p.category === 'accessibility'
    );
    for (const vehicle of guest.vehicles) {
      if (taken.has(`${reservation.id}:${vehicle.id}`)) continue;
      const preferredZone = wantsAccessible ? 'accessible' : vehicle.isElectric ? 'ev' : 'standard';
      const pick = pickBay(availableBays, preferredZone);
      if (!pick) {
        skipped++; // no bays at all — front desk must resolve manually
        continue;
      }
      const bay = availableBays[pick.index];
      const alreadyOnSite = reservation.status === 'checked_in';

      try {
        await prisma.$transaction(async (tx) => {
          await tx.parkingAssignment.create({
            data: {
              tenantId,
              propertyId: property.id,
              bayId: bay.id,
              vehicleId: vehicle.id,
              reservationId: reservation.id,
              status: alreadyOnSite ? 'active' : 'scheduled',
              valet: pick.valet,
              assignedBy: actor,
              scheduledFor: start,
              checkedInAt: alreadyOnSite ? new Date() : null,
              plateAtCheckin: alreadyOnSite ? vehicle.plate : null,
              dedupeKey: `arr:${reservation.id}:${vehicle.id}:${date}`,
            },
          });
          await tx.parkingBay.update({
            where: { id: bay.id },
            data: { status: alreadyOnSite ? 'occupied' : 'reserved' },
          });
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue; // raced another worker — already assigned
        throw err;
      }

      availableBays.splice(pick.index, 1); // consume locally
      taken.add(`${reservation.id}:${vehicle.id}`);
      if (pick.valet) valet++;
      else assigned++;
    }
  }

  logger.info(
    { tenantId, propertyId: property.id, date, assigned, valet, activated, skipped },
    'parking auto-assign complete'
  );
  return { assigned, valet, activated, skipped };
}
