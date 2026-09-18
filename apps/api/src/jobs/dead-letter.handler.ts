/* apps/api/src/jobs/dead-letter.handler.ts */
import { Queue, QueueEvents, Job, Worker } from 'bullmq';
import { getQueue, redisConnection } from '../common/queue.js';
import { logger } from '../common/logger.js';
import { sendEmail } from './email.queue.js';

const DLQ_NAME = 'dead-letter';
const MAX_RETRIES = 5;
const DEFAULT_ATTEMPTS = 3;

export const deadLetterQueue = new Queue(DLQ_NAME, { connection: redisConnection });

export const deadLetterWorker = new Worker(
  DLQ_NAME,
  async (job) => {
    const { originalQueue, originalJobId, originalData, failReason, attemptCount } = job.data;

    logger.error(
      { originalQueue, originalJobId, failReason, attemptCount },
      'processing dead letter'
    );

    if (attemptCount >= MAX_RETRIES) {
      // Permanent failure — alert ops
      await sendEmail({
        to: process.env.OPS_EMAIL ?? 'ops@vimad.io',
        subject: `Job Permanently Failed: ${originalQueue}`,
        template: 'generic',
        payload: {
          message: `Job ${originalJobId} in queue ${originalQueue} failed after ${MAX_RETRIES} attempts.\n\nError: ${failReason}\n\nData: ${JSON.stringify(originalData, null, 2)}`,
        },
      });

      // TODO: Persist to failed-jobs table for manual review
      logger.error({ originalQueue, originalJobId }, 'job permanently failed, ops notified');
      return;
    }

    // Re-queue with exponential backoff
    const originalQ = new Queue(originalQueue, { connection: redisConnection });
    await originalQ.add(job.name, originalData, {
      delay: Math.pow(2, attemptCount) * 60 * 1000, // 2^n minutes
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
// Listens to a queue's failed events and moves jobs to the dead-letter queue
// once they have exhausted their attempts.
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

      await deadLetterQueue.add('dead-letter', {
        originalQueue: sourceQueueName,
        originalJobId: jobId,
        originalData: job.data,
        failReason: failedReason,
        attemptCount: attemptsMade,
      });

      logger.error(
        { queue: sourceQueueName, jobId, failedReason, attemptsMade },
        'job moved to dead letter queue'
      );
    } catch (err) {
      logger.error({ err, queue: sourceQueueName, jobId }, 'failed to handle dead letter event');
    }
  });

  logger.info({ queue: sourceQueueName }, 'dead letter handler attached');
}
