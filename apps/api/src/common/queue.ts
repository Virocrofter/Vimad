/* apps/api/src/common/queue.ts */
import { Queue, Worker, type JobsOptions, type WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from './logger.js';

// ─── Redis Connection ───
export const redisConnection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('error', (err: Error) => {
  logger.error({ err }, 'Redis connection error');
});

redisConnection.on('connect', () => {
  logger.info('Redis connected');
});

// Redis client accessor for health checks. Null when the connection is closed.
export function getRedisClient(): Redis | null {
  return redisConnection.status === 'end' ? null : redisConnection;
}

// ─── Queue Registry ───
const queues = new Map<string, Queue>();

// All known queue names (workers + DLQ). Used by the Bull Board dashboard
// and the dead-letter listener so every queue gets wired at startup.
export const QUEUE_NAMES = [
  'email',
  'report',
  'night-audit',
  'billing',
  'gdpr',
  'dead-letter',
] as const;
export type QueueName = (typeof QUEUE_NAMES)[number];

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

// ─── Worker Factory ───
const activeWorkers = new Set<Worker>();

export function getWorkerCount(): number {
  return activeWorkers.size;
}

export function createWorker<T = unknown>(
  queueName: string,
  processor: (job: { id: string; name: string; data: T }) => Promise<void>,
  options?: WorkerOptions
): Worker {
  const worker = new Worker(
    queueName,
    async (job) => {
      logger.info({ jobId: job.id, queue: queueName, name: job.name }, 'job started');
      const start = Date.now();
      try {
        await processor(job as { id: string; name: string; data: T });
        logger.info(
          { jobId: job.id, queue: queueName, durationMs: Date.now() - start },
          'job completed'
        );
      } catch (err) {
        logger.error({ err, jobId: job.id, queue: queueName }, 'job failed');
        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
      ...options,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, queue: queueName }, 'worker reported failure');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId, queue: queueName }, 'job stalled');
  });

  activeWorkers.add(worker);
  return worker;
}

// ─── Job Enqueue Helper ───
export async function enqueue<T = unknown>(
  queueName: string,
  jobName: string,
  data: T,
  opts?: JobsOptions
): Promise<void> {
  const queue = getQueue(queueName);
  await queue.add(jobName, data, opts);
  logger.info({ queue: queueName, jobName }, 'job enqueued');
}

// ─── Graceful Shutdown ───
export async function closeQueues(): Promise<void> {
  for (const [name, queue] of queues) {
    await queue.close();
    logger.info({ queue: name }, 'queue closed');
  }
  await redisConnection.quit();
}
