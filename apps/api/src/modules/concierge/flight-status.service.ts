/* apps/api/src/modules/concierge/flight-status.service.ts — 0.4 flight hook
 * Checks flight status for transfer items carrying a flightNumber. When a
 * delay exceeds the threshold the pickup is re-timed automatically:
 * concierge item scheduledAt shifts by the delay, a spine Task row is
 * created for the concierge desk (dedupe-guarded), front desk staff get a
 * Notification, and the guest is told on the T5 pipe (WhatsApp → SMS).
 * Flight state persists in concierge_items.metadata.flight — no migration.
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { env } from '../../common/env.js';
import { createNotification } from '../notifications/notification.service.js';
import { sendTwilioMessage, twilioConfigured, type PushChannel } from '../../common/twilio.js';

export type FlightStatus = 'on_time' | 'delayed' | 'cancelled' | 'landed' | 'unknown';

export interface FlightCheckResult {
  status: FlightStatus;
  delayMinutes: number;
  source: string;
}

export interface FlightAdjustmentResult {
  adjusted: boolean;
  alreadyAdjusted?: boolean;
  reason?: string;
  newScheduledAt?: string;
  taskCreated?: boolean;
  notified?: boolean;
  guestMessaged?: string;
}

const AEROAPI_BASE = 'https://aeroapi.flightaware.com/aeroapi';

/* ─── Provider ─── */
export async function checkFlightStatus(flightNumber: string): Promise<FlightCheckResult> {
  if (!env.FLIGHTAWARE_API_KEY) {
    return { status: 'unknown', delayMinutes: 0, source: 'none' };
  }
  try {
    const res = await fetch(
      `${AEROAPI_BASE}/flights/${encodeURIComponent(flightNumber)}?max_pages=1`,
      { headers: { 'x-apikey': env.FLIGHTAWARE_API_KEY } }
    );
    if (!res.ok) {
      logger.warn({ flightNumber, status: res.status }, 'flight check: AeroAPI non-200');
      return { status: 'unknown', delayMinutes: 0, source: 'aeroapi' };
    }
    const body = (await res.json()) as {
      flights?: { arrival_delay?: number; cancelled?: boolean; landed?: boolean }[];
    };
    const f = body.flights?.[0];
    if (!f) return { status: 'unknown', delayMinutes: 0, source: 'aeroapi' };
    if (f.cancelled) return { status: 'cancelled', delayMinutes: 0, source: 'aeroapi' };
    const delayMin = Math.max(0, Math.round((f.arrival_delay ?? 0) / 60));
    if (f.landed) return { status: 'landed', delayMinutes: delayMin, source: 'aeroapi' };
    return {
      status: delayMin > 15 ? 'delayed' : 'on_time',
      delayMinutes: delayMin,
      source: 'aeroapi',
    };
  } catch (err) {
    logger.error({ err, flightNumber }, 'flight check failed');
    return { status: 'unknown', delayMinutes: 0, source: 'aeroapi' };
  }
}

/* ─── Adjustment (shared by job + simulation route) ─── */
export async function applyFlightAdjustment(
  itemId: string,
  delayMinutes: number,
  status: FlightStatus,
  source: string
): Promise<FlightAdjustmentResult> {
  const item = await prisma.conciergeItem.findUnique({
    where: { id: itemId },
    include: {
      guest: { select: { firstName: true, lastName: true, phone: true } },
      property: { select: { name: true } },
    },
  });
  if (!item || !item.scheduledAt) return { adjusted: false, reason: 'not_found' };

  const meta = (item.metadata ?? {}) as Record<string, unknown>;
  const prev = meta.flight as { delayMinutes?: number; adjustedAt?: string } | undefined;

  const base: Record<string, unknown> = {
    ...meta,
    flight: {
      status,
      delayMinutes,
      source,
      checkedAt: new Date().toISOString(),
      previousScheduledAt: item.scheduledAt.toISOString(),
      adjustedAt: new Date().toISOString(),
    },
  };

  // Idempotent: never re-time for the same or a smaller delay
  if (prev?.adjustedAt && (prev.delayMinutes ?? 0) >= delayMinutes) {
    await prisma.conciergeItem.update({
      where: { id: item.id },
      data: { metadata: base as Prisma.InputJsonValue },
    });
    return { adjusted: false, alreadyAdjusted: true, guestMessaged: 'skipped_already_adjusted' };
  }

  const newScheduledAt = new Date(item.scheduledAt.getTime() + delayMinutes * 60_000);
  await prisma.conciergeItem.update({
    where: { id: item.id },
    data: { scheduledAt: newScheduledAt, metadata: base as Prisma.InputJsonValue },
  });

  const guestName = item.guest ? `${item.guest.firstName} ${item.guest.lastName}` : 'Guest';

  // Spine task — arrives as a generator row on the concierge board
  let taskCreated = false;
  try {
    await prisma.task.create({
      data: {
        tenantId: item.tenantId,
        propertyId: item.propertyId,
        department: 'concierge',
        title: `Flight ${item.flightNumber} delayed ${delayMinutes} min — ${guestName} pickup adjusted`,
        description: `Auto-adjusted by flight hook (${source}). New pickup time ${newScheduledAt.toISOString()}. Confirm transport provider.`,
        status: 'open',
        priority: 'high',
        reservationId: item.reservationId,
        guestId: item.guestId,
        roomId: item.roomId,
        dedupeKey: `flight-delay:${item.id}`,
        source: 'rule',
      },
    });
    taskCreated = true;
  } catch {
    // dedupeKey unique violation → task already raised for this item
  }

  // Front desk notification
  let notified = false;
  try {
    const desk = await prisma.user.findFirst({
      where: {
        tenantId: item.tenantId,
        status: 'active',
        role: { in: ['owner', 'admin', 'manager', 'staff'] },
      },
      select: { id: true },
    });
    if (desk) {
      await createNotification(item.tenantId, {
        userId: desk.id,
        type: 'flight_delay',
        category: 'warning',
        title: `Flight ${item.flightNumber} delayed ${delayMinutes} min`,
        message: `${guestName}'s pickup at ${item.property.name} moved to ${newScheduledAt.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}. Concierge task ${taskCreated ? 'created' : 'already open'}.`,
        entityType: 'concierge_item',
        entityId: item.id,
        deliveredVia: ['in_app'],
      });
      notified = true;
    }
  } catch (err) {
    logger.error({ err, itemId }, 'flight hook: notification failed');
  }

  // T5 pipe → guest (WhatsApp first, SMS fallback)
  let guestMessaged = 'skipped_no_phone';
  if (item.guest?.phone) {
    const body =
      `${item.property.name}: your pickup for flight ${item.flightNumber} has been moved ` +
      `to ${newScheduledAt.toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} ` +
      `due to a ${delayMinutes}-minute flight delay. No action needed — see you then.`;
    const trySend = async (channel: PushChannel) => {
      if (!twilioConfigured(channel)) return false;
      await sendTwilioMessage({ to: item.guest!.phone!, body, channel });
      return true;
    };
    try {
      if (await trySend('whatsapp')) guestMessaged = 'whatsapp';
      else if (await trySend('sms')) guestMessaged = 'sms';
      else guestMessaged = 'failed_no_twilio';
    } catch (err) {
      logger.warn({ err, itemId }, 'flight hook: guest message failed');
      guestMessaged = (await trySend('sms').catch(() => false)) ? 'sms_fallback' : 'failed';
    }
  }

  logger.info(
    { itemId, delayMinutes, taskCreated, notified, guestMessaged },
    'flight delay applied'
  );
  return {
    adjusted: true,
    newScheduledAt: newScheduledAt.toISOString(),
    taskCreated,
    notified,
    guestMessaged,
  };
}

/* ─── Read-back for the status route + gate ─── */
export async function getFlightInfo(itemId: string) {
  const item = await prisma.conciergeItem.findUnique({
    where: { id: itemId },
    select: { id: true, scheduledAt: true, flightNumber: true, metadata: true },
  });
  if (!item) return null;
  const meta = (item.metadata ?? {}) as { flight?: Record<string, unknown> };
  return {
    id: item.id,
    flightNumber: item.flightNumber,
    scheduledAt: item.scheduledAt,
    flight: meta.flight ?? null,
  };
}
