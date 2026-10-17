/* apps/api/src/jobs/parking.job.ts — T4
 * Every 15 min: dispatch an auto-assign run per active tenant. The worker
 * activates scheduled bays for guests already checked in, then assigns
 * today's arrivals with a vehicle on file to free bays (valet overflow).
 */
import { enqueue, createWorker } from '../common/queue.js';
import { logger } from '../common/logger.js';
import { prisma } from '../common/prisma.js';
import { autoAssign } from '../modules/parking/parking.service.js';

export const PARKING_QUEUE = 'parking';

export type ParkingJobData = { tenantId: string; propertyId?: string; date: string };

export const parkingWorker = createWorker<ParkingJobData>(PARKING_QUEUE, async (job) => {
  if (job.name === 'auto-assign') {
    const { tenantId, propertyId, date } = job.data;
    await autoAssign(tenantId, 'auto', propertyId, date);
  }
});

export async function scanParkingAssignments(): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true },
    take: 100,
  });
  for (const t of tenants) {
    await enqueue(PARKING_QUEUE, 'auto-assign', { tenantId: t.id, date });
  }
  if (tenants.length > 0) {
    logger.info({ tenants: tenants.length, date }, 'parking auto-assign dispatched');
  }
}

export function startParkingScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('*/15 * * * *', async () => {
        await scanParkingAssignments().catch((err) =>
          logger.error({ err }, 'parking auto-assign scan failed')
        );
      });
      logger.info('Parking scheduler started (auto-assign every 15 min)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — parking scheduler disabled');
    });
}
