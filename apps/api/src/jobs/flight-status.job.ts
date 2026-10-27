/* apps/api/src/jobs/flight-status.job.ts — 0.4 flight-status poller
 * Every 10 min: find open transfer items with a flightNumber scheduled in
 * the next 36h (or 6h past), check status, re-time pickups on significant
 * delay. Items are re-checked at most every 20 min via metadata guard.
 */
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { env } from '../common/env.js';
import {
  checkFlightStatus,
  applyFlightAdjustment,
} from '../modules/concierge/flight-status.service.js';

export async function scanFlightStatuses(): Promise<void> {
  const items = await prisma.conciergeItem.findMany({
    where: {
      type: 'transfer',
      status: { in: ['open', 'in_progress'] },
      flightNumber: { not: null },
      scheduledAt: {
        gte: new Date(Date.now() - 6 * 3600_000),
        lte: new Date(Date.now() + 36 * 3600_000),
      },
    },
    select: { id: true, flightNumber: true, metadata: true },
    take: 200,
  });

  for (const item of items) {
    try {
      const meta = (item.metadata ?? {}) as { flight?: { checkedAt?: string } };
      const checkedAt = meta.flight?.checkedAt ? new Date(meta.flight.checkedAt).getTime() : 0;
      if (Date.now() - checkedAt < 20 * 60_000) continue;

      const result = await checkFlightStatus(item.flightNumber!);
      if (
        result.status === 'delayed' &&
        result.delayMinutes >= env.FLIGHT_DELAY_THRESHOLD_MINUTES
      ) {
        await applyFlightAdjustment(item.id, result.delayMinutes, result.status, result.source);
      } else {
        const m = (item.metadata ?? {}) as Record<string, unknown>;
        await prisma.conciergeItem.update({
          where: { id: item.id },
          data: {
            metadata: {
              ...m,
              flight: { ...result, checkedAt: new Date().toISOString() },
            },
          },
        });
      }
    } catch (err) {
      logger.error({ err, itemId: item.id }, 'flight scan: item failed');
    }
  }
}

export function startFlightStatusScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule(env.FLIGHT_POLL_CRON, async () => {
        await scanFlightStatuses().catch((err) => logger.error({ err }, 'flight scan failed'));
      });
      logger.info(`Flight status scheduler started (${env.FLIGHT_POLL_CRON})`);
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — flight status scheduler disabled');
    });
}
