/* B3: dead-letter alerts. failed_jobs rows carry no tenantId, so the
 * alert targets payload.tenantId when the job captured one; otherwise the
 * failure is logged platform-side only. One notification per job
 * (entityType+entityId dedupe); resolved jobs never re-alert.
 * Newest-first batching: fresh failures alert promptly; maxJobs caps one
 * cron tick (backlog drains over successive hourly runs). */
import cron from 'node-cron';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';

export async function alertOnDeadLetters(now = new Date(), maxJobs = 500): Promise<number> {
  const grace = new Date(now.getTime() - 15 * 60 * 1000);
  let alerted = 0;
  let processed = 0;
  let cursor: string | null = null;

  for (;;) {
    const batch: any[] = await prisma.failedJob.findMany({
      where: {
        resolvedAt: null,
        createdAt: { lt: grace },
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      take: 100,
      orderBy: { id: 'desc' },
    });
    if (!batch.length) break;

    for (const job of batch) {
      processed++;
      const tenantId = (job.payload as any)?.tenantId ?? null;
      if (!tenantId) {
        logger.warn(
          { queue: job.queue, jobId: job.jobId },
          'dead-letter without tenantId — no alert routed'
        );
      } else {
        const existing = await prisma.notification.findFirst({
          where: { entityType: 'failed_job', entityId: job.id, type: 'dlq_alert' },
          select: { id: true },
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              tenantId,
              userId: null,
              type: 'dlq_alert',
              category: 'integrations',
              title: 'Dead-lettered job: ' + job.jobName,
              message: 'Queue ' + job.queue + ': ' + String(job.failReason).slice(0, 200),
              actionUrl: '/app/exceptions',
              actionLabel: 'Review',
              entityType: 'failed_job',
              entityId: job.id,
            },
          });
          alerted++;
        }
      }
      if (processed >= maxJobs) break;
    }

    cursor = batch[batch.length - 1].id;
    if (batch.length < 100 || processed >= maxJobs) break;
  }

  if (alerted) logger.info({ alerted, processed }, 'dlq alerts raised');
  return alerted;
}

export function startDlqAlertScheduler(): void {
  cron.schedule('53 * * * *', async () => {
    try {
      await alertOnDeadLetters();
    } catch (err) {
      logger.error({ err }, 'dlq alert sweep failed');
    }
  });
  logger.info('DLQ alert scheduler started (hourly :53)');
}
