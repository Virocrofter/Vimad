/* apps/api/src/jobs/dead-letter.handler.ts */
import { Queue, QueueEvents, Job, Worker } from 'bullmq';
import { getQueue, redisConnection } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { sendEmail } from './email.queue.js';

const DLQ_NAME = 'dead-letter';
const MAX_RETRIES = 5;
const DEFAULT_ATTEMPTS = 3;

export const deadLetterQueue = new Queue(DLQ_NAME, { connection: redisConnection });

export const deadLetterWorker = new Worker(
  DLQ_NAME,
  async (job) => {
    const { originalQueue, originalJobId, originalData, failReason, attemptCount, dbRecordId } =
      job.data;

    logger.error(
      { originalQueue, originalJobId, failReason, attemptCount },
      'processing dead letter'
    );

    if (attemptCount >= MAX_RETRIES) {
      // ─── PERSIST: Save to failed_jobs table ───
      let failedJobId = dbRecordId;
      if (!failedJobId) {
        const record = await prisma.failedJob.create({
          data: {
            queue: originalQueue,
            jobId: originalJobId,
            jobName: job.name,
            payload: originalData ?? {},
            failReason,
            attemptCount,
            status: 'pending',
          },
        });
        failedJobId = record.id;
      }

      await sendEmail({
        to: process.env.OPS_EMAIL ?? 'ops@vimad.io',
        subject: `Job Permanently Failed: ${originalQueue}`,
        template: 'generic',
        payload: {
          message: `Job ${originalJobId} in queue ${originalQueue} failed after ${MAX_RETRIES} attempts.\n\nError: ${failReason}\n\nFailedJob ID: ${failedJobId}\n\nData: ${JSON.stringify(originalData, null, 2)}`,
        },
      });

      logger.error(
        { originalQueue, originalJobId, failedJobId },
        'job permanently failed, persisted and ops notified'
      );
      return;
    }

    // Re-queue with exponential backoff
    const originalQ = new Queue(originalQueue, { connection: redisConnection });
    await originalQ.add(job.name, originalData, {
      delay: Math.pow(2, attemptCount) * 60 * 1000,
      priority: 1,
      jobId: `${originalJobId}-retry-${attemptCount}`,
    });

    await originalQ.close();

    logger.info(
      { originalQueue, originalJobId, attemptCount, delayMin: Math.pow(2, attemptCount) },
      'job re-queued from dead letter'
    );
  },
  { connection: redisConnection, concurrency: 2 }
);

// ─── Failed Job Listener ───
export function attachDeadLetterHandler(sourceQueueName: string) {
  const events = new QueueEvents(sourceQueueName, { connection: redisConnection });

  events.on('failed', async ({ jobId, failedReason }) => {
    try {
      const queue = getQueue(sourceQueueName);
      const job = await Job.fromId(queue, jobId);
      if (!job) return;

      const attemptsMade = job.attemptsMade;
      const maxAttempts = job.opts.attempts ?? DEFAULT_ATTEMPTS;

      if (attemptsMade < maxAttempts) {
        return; // intermediate failure — BullMQ will retry
      }

      // ─── PERSIST: Create failed_jobs record immediately ───
      const record = await prisma.failedJob.upsert({
        where: {
          queue_jobId: { queue: sourceQueueName, jobId },
        },
        update: {
          failReason: failedReason,
          attemptCount: attemptsMade,
          payload: job.data ?? {},
          status: 'pending',
        },
        create: {
          queue: sourceQueueName,
          jobId,
          jobName: job.name,
          payload: job.data ?? {},
          failReason: failedReason,
          attemptCount: attemptsMade,
          status: 'pending',
        },
      });

      await deadLetterQueue.add('dead-letter', {
        originalQueue: sourceQueueName,
        originalJobId: jobId,
        originalData: job.data,
        failReason: failedReason,
        attemptCount: attemptsMade,
        dbRecordId: record.id,
      });

      logger.error(
        { queue: sourceQueueName, jobId, failedReason, attemptsMade, dbRecordId: record.id },
        'job moved to dead letter queue and persisted'
      );
    } catch (err) {
      logger.error({ err, queue: sourceQueueName, jobId }, 'failed to handle dead letter event');
    }
  });

  logger.info({ queue: sourceQueueName }, 'dead letter handler attached');
}

// ─── Retry a failed job (called from admin endpoint) ───
export async function retryFailedJob(
  failedJobId: string
): Promise<{ success: boolean; message: string }> {
  const record = await prisma.failedJob.findUnique({ where: { id: failedJobId } });
  if (!record) {
    return { success: false, message: 'Failed job not found' };
  }

  if (record.status === 'resolved') {
    return { success: false, message: 'Job already resolved' };
  }

  try {
    const originalQ = new Queue(record.queue, { connection: redisConnection });
    await originalQ.add(record.jobName, record.payload, {
      priority: 1,
      jobId: `${record.jobId}-manual-retry-${Date.now()}`,
    });
    await originalQ.close();

    await prisma.failedJob.update({
      where: { id: failedJobId },
      data: { status: 'retried', retriedAt: new Date() },
    });

    logger.info(
      { failedJobId, queue: record.queue, jobId: record.jobId },
      'failed job manually retried'
    );
    return { success: true, message: `Job re-queued to ${record.queue}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, failedJobId }, 'failed to retry failed job');
    return { success: false, message };
  }
}
