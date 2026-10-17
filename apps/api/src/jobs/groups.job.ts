/* apps/api/src/jobs/groups.job.ts — G1: group cutoff release / washdown */
import { Queue, Worker, type Job } from 'bullmq';
import cron from 'node-cron';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { redisConnection } from '../common/queue.js';

export const GROUPS_QUEUE = 'groups';
export const groupsQueue = new Queue(GROUPS_QUEUE, { connection: redisConnection });

const ACTIVE_MEMBER_STATUSES = ['confirmed', 'checked_in'];

interface CutoffResult {
  groupId: string;
  code: string;
  blocksReleased: number;
  roomsReleased: number;
  blocksRemoved: number;
}

/**
 * Enqueue a cutoff-release job for every group whose cutOffDate has passed
 * and is still in an open status. Called by the 30-min scheduler; also
 * exported so gates/scripts can trigger it manually.
 */
export async function runCutoffReleaseScan(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = await prisma.group.findMany({
    where: {
      cutOffDate: { lte: today },
      status: { in: ['prospect', 'tentative', 'definite'] },
    },
    select: { id: true },
  });

  const day = today.toISOString().slice(0, 10);
  for (const g of due) {
    await groupsQueue.add(
      'cutoff-release',
      { groupId: g.id },
      { jobId: `cutoff-${g.id}-${day}`, removeOnComplete: 100, removeOnFail: 500 }
    );
  }
  if (due.length > 0) {
    logger.info({ due: due.length }, 'groups: cutoff scan enqueued releases');
  }
  return due.length;
}

async function releaseGroupCutoff(groupId: string): Promise<CutoffResult> {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: {
      roomBlocks: true,
      reservations: {
        where: { status: { in: ACTIVE_MEMBER_STATUSES } },
        select: { roomTypeId: true },
      },
    },
  });

  const result: CutoffResult = {
    groupId: group.id,
    code: group.code,
    blocksReleased: 0,
    roomsReleased: 0,
    blocksRemoved: 0,
  };

  for (const block of group.roomBlocks) {
    const pickedUp = group.reservations.filter((r) => r.roomTypeId === block.roomTypeId).length;

    if (pickedUp >= block.roomsBlocked) continue; // fully picked up — nothing to release

    if (pickedUp === 0) {
      await prisma.groupRoomBlock.delete({ where: { id: block.id } });
      result.blocksRemoved++;
      result.roomsReleased += block.roomsBlocked;
    } else {
      await prisma.groupRoomBlock.update({
        where: { id: block.id },
        data: { roomsBlocked: pickedUp },
      });
      result.blocksReleased++;
      result.roomsReleased += block.roomsBlocked - pickedUp;
    }
  }

  if (result.roomsReleased > 0) {
    logger.info(
      { ...result, tenantId: group.tenantId },
      'groups: cutoff washdown released unsold rooms'
    );
  }
  return result;
}

export const groupsWorker = new Worker(
  GROUPS_QUEUE,
  async (job: Job) => {
    if (job.name !== 'cutoff-release') return;
    const { groupId } = job.data as { groupId: string };
    await releaseGroupCutoff(groupId);
  },
  { connection: redisConnection, concurrency: 4 }
);

groupsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'groups job failed');
});

/** Every 30 min — matches the comment in index.ts. */
export function startGroupsScheduler() {
  cron.schedule('*/30 * * * *', () => {
    runCutoffReleaseScan().catch((err) =>
      logger.error({ err: err.message }, 'groups: cutoff scan failed')
    );
  });
  logger.info('groups cutoff scheduler started (every 30 min)');
}
