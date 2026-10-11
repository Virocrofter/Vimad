/* apps/api/src/jobs/transactional-email.job.ts
 * A3 scheduler: every hour, find confirmed reservations checking in within
 * the next 24 hours that haven't had the pre-arrival email, and queue it.
 * Sending itself runs through BullMQ (retries + DLQ on failure).
 */
import { enqueue, createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { sendPreArrival } from '../modules/notifications/transactional.service.js';

export const TRANSACTIONAL_EMAIL_QUEUE = 'transactional-email';

export type TransactionalEmailJobData = {
  kind: 'pre-arrival';
  tenantId: string;
  reservationId: string;
};

export const transactionalEmailWorker = createWorker<TransactionalEmailJobData>(
  TRANSACTIONAL_EMAIL_QUEUE,
  async (job) => {
    const { kind, tenantId, reservationId } = job.data;
    if (kind === 'pre-arrival') {
      await sendPreArrival(tenantId, reservationId);
    }
  }
);

// ─── Scanner: called by node-cron every hour ───

export async function scanPreArrivals(): Promise<void> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcoming = await prisma.reservation.findMany({
    where: {
      status: 'confirmed',
      preArrivalSentAt: null,
      arrivalDate: { gt: now, lte: in24h },
      guest: { email: { not: null } },
    },
    select: { id: true, tenantId: true },
    take: 200,
  });

  for (const r of upcoming) {
    await enqueue(TRANSACTIONAL_EMAIL_QUEUE, 'pre-arrival', {
      kind: 'pre-arrival',
      tenantId: r.tenantId,
      reservationId: r.id,
    });
  }

  if (upcoming.length > 0) {
    logger.info({ count: upcoming.length }, 'pre-arrival scan dispatched jobs');
  }
}

export function startTransactionalEmailScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('0 * * * *', async () => {
        await scanPreArrivals().catch((err) => logger.error({ err }, 'pre-arrival scan failed'));
      });
      logger.info('Transactional email scheduler started (pre-arrival scan every hour)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — transactional email scheduler disabled');
    });
}
