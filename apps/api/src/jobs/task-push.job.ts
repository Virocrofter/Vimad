/* apps/api/src/jobs/task-push.job.ts — T5: WhatsApp/SMS task push
 * Queue worker sends the tokenized one-tap link to the assignee's phone.
 * Idempotent per task state: closed tasks are skipped, tokens rotate on
 * expiry, WhatsApp falls back to SMS so a message always lands.
 *
 * Auto-push: the scanner runs every minute and enqueues any open task that
 * has an assignee with a phone and was never pushed — rule-generated tasks
 * (departures, escalations) reach the cleaner's phone without anyone
 * touching the board.
 */
import crypto from 'node:crypto';
import { enqueue, createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { env } from '../common/env.js';
import { sendTwilioMessage, twilioConfigured, type PushChannel } from '../common/twilio.js';

export const TASK_PUSH_QUEUE = 'task-push';

export interface TaskPushJobData {
  taskId: string;
  channel?: PushChannel;
}

export async function enqueueTaskPush(taskId: string, channel?: PushChannel): Promise<void> {
  await enqueue(TASK_PUSH_QUEUE, 'send-push', { taskId, channel });
}

// ─── Worker ───
export const taskPushWorker = createWorker<TaskPushJobData>(TASK_PUSH_QUEUE, async (job) => {
  const { taskId, channel } = job.data;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, phone: true } },
      room: { select: { number: true } },
      property: { select: { name: true } },
    },
  });
  if (!task) {
    logger.warn({ taskId }, 'task-push: task not found');
    return;
  }
  if (task.status !== 'open' && task.status !== 'in_progress') {
    logger.info({ taskId, status: task.status }, 'task-push: task already closed, skipping');
    return;
  }
  if (!task.assignee?.phone) {
    logger.warn({ taskId }, 'task-push: assignee has no phone on file, skipping');
    return;
  }

  // Mint / rotate the one-tap token (14-day validity, rotated per push once expired)
  let token = task.pushToken;
  if (!token || !task.pushTokenExpiresAt || task.pushTokenExpiresAt.getTime() < Date.now()) {
    token = crypto.randomBytes(24).toString('hex');
    await prisma.task.update({
      where: { id: task.id },
      data: { pushToken: token, pushTokenExpiresAt: new Date(Date.now() + 14 * 86400_000) },
    });
  }

  const baseUrl = env.API_PUBLIC_URL.replace(/\/$/, '');
  const url = `${baseUrl}/v1/tasks/t/${token}`;
  const roomBit = task.room?.number ? ` — Room ${task.room.number}` : '';
  const dueBit = task.dueAt
    ? ` — due ${task.dueAt.toLocaleString('en-ZA', { timeZone: task.property?.name ? 'Africa/Johannesburg' : undefined })}`
    : '';
  const body =
    `Vimad · ${task.department.replace(/_/g, ' ')}${roomBit}\n` +
    `${task.title}\n` +
    `${dueBit}\n` +
    `Tap to update — no app needed: ${url}`;

  const requested: PushChannel =
    channel ?? ((process.env.TASK_PUSH_CHANNEL as PushChannel) || 'sms');
  let sentChannel: PushChannel = requested;

  try {
    if (!twilioConfigured(requested)) throw new Error(`Twilio not configured for ${requested}`);
    await sendTwilioMessage({ to: task.assignee.phone, body, channel: requested });
  } catch (err) {
    // WhatsApp sandbox rejection / unapproved sender → fall back to SMS
    if (requested === 'whatsapp' && twilioConfigured('sms')) {
      logger.warn({ err, taskId }, 'task-push: WhatsApp failed, falling back to SMS');
      await sendTwilioMessage({ to: task.assignee.phone, body, channel: 'sms' });
      sentChannel = 'sms';
    } else {
      throw err; // BullMQ retries → DLQ → failed_jobs + ops email
    }
  }

  await prisma.task.update({
    where: { id: task.id },
    data: {
      pushSentAt: new Date(),
      pushChannel: sentChannel,
      pushAttempts: { increment: 1 },
    },
  });
  logger.info({ taskId, channel: sentChannel, phone: task.assignee.phone }, 'task-push sent');
});

// ─── Auto-push scan: open + assigned + has phone + never pushed ───
export async function scanUnpushedTasks(): Promise<void> {
  const candidates = await prisma.task.findMany({
    where: {
      status: 'open',
      pushSentAt: null,
      assigneeId: { not: null },
      assignee: { phone: { not: null } },
      createdAt: { gte: new Date(Date.now() - 7 * 86400_000) },
    },
    select: { id: true },
    take: 100,
  });

  for (const t of candidates) {
    await enqueueTaskPush(t.id).catch((err) =>
      logger.error({ err, taskId: t.id }, 'task-push enqueue failed')
    );
  }
  if (candidates.length > 0) {
    logger.info({ count: candidates.length }, 'task-push: auto-push dispatched');
  }
}

export function startTaskPushScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('* * * * *', async () => {
        await scanUnpushedTasks().catch((err) => logger.error({ err }, 'task-push scan failed'));
      });
      logger.info('Task push scheduler started (auto-push scan every minute)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — task push scheduler disabled');
    });
}
