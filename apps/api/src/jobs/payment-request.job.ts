/* apps/api/src/jobs/payment-request.job.ts
 * Scheduler for deposit automation: every 5 minutes it scans for
 *   (a) requests whose next reminder is due  → email reminder via queue
 *   (b) requests past their due date          → expire + auto-cancel reservation
 * Job processing itself runs through BullMQ so failures retry into the DLQ.
 */
import { enqueue, createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import {
  sendPaymentRequest,
  expirePaymentRequest,
} from '../modules/payments/payment-requests.service.js';

export const PAYMENT_REQUESTS_QUEUE = 'payment-requests';

export type PaymentRequestJobData = { requestId: string; action: 'send-reminder' | 'expire' };

export const paymentRequestWorker = createWorker<PaymentRequestJobData>(
  PAYMENT_REQUESTS_QUEUE,
  async (job) => {
    const { requestId, action } = job.data;
    if (action === 'send-reminder') {
      await sendPaymentRequestForJob(requestId);
    } else {
      await expirePaymentRequest(requestId);
    }
  }
);

// Separate wrapper so a guest without email on a *reminder* doesn't crash
// the job after the initial send already succeeded.
async function sendPaymentRequestForJob(requestId: string): Promise<void> {
  const request = await prisma.paymentRequest.findUnique({
    where: { id: requestId },
    include: { reservation: { include: { guest: true } } },
  });
  if (!request || !['pending', 'sent'].includes(request.status)) return;

  if (!request.reservation?.guest.email) {
    logger.warn({ requestId }, 'reminder skipped — guest has no email');
    return;
  }
  await sendPaymentRequest(request.tenantId, requestId);
}

// ─── Scanner: called by node-cron every 5 minutes ───

export async function scanPaymentRequests(): Promise<void> {
  const now = new Date();

  const [reminders, expirables] = await Promise.all([
    prisma.paymentRequest.findMany({
      where: { status: { in: ['pending', 'sent'] }, nextReminderAt: { lte: now } },
      select: { id: true },
      take: 200,
    }),
    prisma.paymentRequest.findMany({
      where: { status: { in: ['pending', 'sent'] }, dueDate: { lt: now } },
      select: { id: true },
      take: 200,
    }),
  ]);

  for (const r of reminders) {
    await enqueue(PAYMENT_REQUESTS_QUEUE, 'send-reminder', {
      requestId: r.id,
      action: 'send-reminder',
    });
  }
  for (const r of expirables) {
    await enqueue(PAYMENT_REQUESTS_QUEUE, 'expire', { requestId: r.id, action: 'expire' });
  }

  if (reminders.length > 0 || expirables.length > 0) {
    logger.info(
      { reminders: reminders.length, expirables: expirables.length },
      'payment request scan dispatched jobs'
    );
  }
}

export function startPaymentRequestScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('*/5 * * * *', async () => {
        await scanPaymentRequests().catch((err) =>
          logger.error({ err }, 'payment request scan failed')
        );
      });
      logger.info('Payment request scheduler started (scans every 5 minutes)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — payment request scheduler disabled');
    });
}
