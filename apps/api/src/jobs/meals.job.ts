/* apps/api/src/jobs/meals.job.ts — T7 meal auto-poster
 * Every 15 minutes (and hourly via the same scan): for each active
 * property, ensure a posting row exists for every in-house assignment
 * covering the business date, then post it. Idempotent by
 * unique(assignmentId, date) — the scanner can run forever.
 */
import { createWorker } from '../common/queue.js';
import { logger } from '../common/logger.js';
import { prisma } from '../common/prisma.js';
import { postDueMeals } from '../modules/meals/meals.service.js';

export const MEALS_QUEUE = 'meals';

export type MealsJobData = { tenantId?: string; propertyId?: string };

export const mealsWorker = createWorker<MealsJobData>(MEALS_QUEUE, async (job) => {
  const { tenantId, propertyId } = job.data;
  await postDueMeals(tenantId, propertyId);
});

// ─── Scanner: dispatch one job per active tenant (bounded fan-out) ───

export async function scanMealPostings(): Promise<void> {
  const { enqueue } = await import('../common/queue.js');
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true },
    take: 100,
  });

  for (const t of tenants) {
    await enqueue(MEALS_QUEUE, 'post-due-meals', { tenantId: t.id }).catch((err) =>
      logger.error({ err, tenantId: t.id }, 'meal posting enqueue failed')
    );
  }

  if (tenants.length > 0) {
    logger.debug({ tenants: tenants.length }, 'meal posting scan dispatched');
  }
}

export function startMealPostingScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('*/15 * * * *', async () => {
        await scanMealPostings().catch((err) => logger.error({ err }, 'meal posting scan failed'));
      });
      logger.info('Meal posting scheduler started (auto-post scan every 15 min)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — meal posting scheduler disabled');
    });
}
