/* apps/api/src/jobs/wakeup-digest.job.ts — T3 wake-up call automation
 * Every 30 min: for each property where it's currently 05:00–05:29 in the
 * property's own timezone, email the front desk ONE digest of today's
 * wake-up calls. Idempotent — items carry metadata.digestSentAt, so a
 * re-run never double-sends. (Phone-system/PBX integration would replace
 * the email at the same chokepoint — sendWakeUpDigests is the seam.)
 */
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { sendEmail } from './email.queue.js';

function propertyLocalTime(
  timezone: string,
  date: Date
): { hour: number; minute: number; dateStr: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone || 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return {
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
  };
}

export async function sendWakeUpDigests(): Promise<void> {
  const now = new Date();

  const properties = await prisma.property.findMany({
    where: { status: 'active' },
    select: { id: true, tenantId: true, name: true, timezone: true },
    take: 200,
  });

  for (const property of properties) {
    try {
      const local = propertyLocalTime(property.timezone, now);
      if (local.hour !== 4 || local.minute >= 30) continue; // one window per morning

      // Candidates around today (UTC window wide enough for any tz, then
      // filtered to the property's own calendar date).
      const candidates = await prisma.conciergeItem.findMany({
        where: {
          tenantId: property.tenantId,
          propertyId: property.id,
          type: 'wake_up_call',
          status: { in: ['open', 'in_progress'] },
          scheduledAt: {
            gte: new Date(now.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 36 * 60 * 60 * 1000),
          },
        },
        include: {
          guest: { select: { firstName: true, lastName: true } },
          room: { select: { number: true } },
        },
        take: 100,
      });

      const todaysCalls = candidates.filter((c) => {
        const meta = (c.metadata ?? {}) as { digestSentAt?: string };
        if (meta.digestSentAt) return false;
        return (
          propertyLocalTime(property.timezone, new Date(c.scheduledAt!)).dateStr === local.dateStr
        );
      });

      if (todaysCalls.length === 0) continue;

      const deskStaff = await prisma.user.findMany({
        where: {
          tenantId: property.tenantId,
          status: 'active',
          role: { in: ['admin', 'manager', 'staff', 'owner'] },
        },
        select: { email: true },
        take: 20,
      });
      const recipients = deskStaff.map((u) => u.email).filter(Boolean);
      if (recipients.length === 0) {
        logger.warn({ propertyId: property.id }, 'wake-up digest skipped — no desk staff emails');
        continue;
      }

      const lines = todaysCalls
        .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime())
        .map((c) => {
          const t = propertyLocalTime(property.timezone, new Date(c.scheduledAt!));
          const guestName = c.guest ? `${c.guest.firstName} ${c.guest.lastName}` : 'Guest';
          const roomLabel = c.room?.number ? `Room ${c.room.number}` : 'room TBD';
          const note = c.description ? ` — ${c.description}` : '';
          return `  ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}  ${roomLabel}  ${guestName}${note}`;
        })
        .join('\n');

      await sendEmail({
        to: recipients.join(','),
        tenantId: property.tenantId,
        subject: `Wake-up calls — ${property.name} — ${local.dateStr} (${todaysCalls.length})`,
        template: 'generic',
        payload: {
          heading: `Wake-up calls — ${property.name}`,
          message:
            `${todaysCalls.length} wake-up call(s) for today (${local.dateStr}). ` +
            `Times are property-local.\n\n${lines}\n\n` +
            `Mark each done on the Concierge board after the call.`,
        },
      });

      // Mark sent AFTER the send resolves — a crash before this line means
      // a rare duplicate digest, never a missed one.
      for (const c of todaysCalls) {
        await prisma.conciergeItem.update({
          where: { id: c.id },
          data: {
            metadata: { ...((c.metadata ?? {}) as object), digestSentAt: now.toISOString() },
          },
        });
      }

      logger.info(
        { propertyId: property.id, count: todaysCalls.length, recipients: recipients.length },
        'wake-up digest sent'
      );
    } catch (err) {
      logger.error({ err, propertyId: property.id }, 'wake-up digest failed for property');
    }
  }
}

export function startWakeUpDigestScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('*/30 * * * *', async () => {
        await sendWakeUpDigests().catch((err) =>
          logger.error({ err }, 'wake-up digest scan failed')
        );
      });
      logger.info('Wake-up digest scheduler started (05:00 property-local, scans every 30 min)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — wake-up digest scheduler disabled');
    });
}
