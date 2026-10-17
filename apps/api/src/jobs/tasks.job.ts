/* apps/api/src/jobs/tasks.job.ts — T1 scanner + T3 concierge generators
 * Every minute: enqueue due rules → worker evaluates them (retries + DLQ),
 * then flag SLA breaches on any open/in-progress task past its dueAt.
 * Every 15 min: dispatch concierge generator runs per active tenant.
 */
import { enqueue, createWorker } from '../common/queue.js';
import { logger } from '../common/logger.js';
import { prisma } from '../common/prisma.js';
import { evaluateRule, dueRules, flagSlaBreaches } from '../modules/tasks/tasks.service.js';
import { runConciergeGenerators } from '../modules/concierge/concierge.service.js';

export const TASKS_QUEUE = 'tasks';

export type TaskJobData = { ruleId: string } | { tenantId: string };

export const taskWorker = createWorker<TaskJobData>(TASKS_QUEUE, async (job) => {
  if (job.name === 'evaluate-rule') {
    const { ruleId } = job.data as { ruleId: string };
    await evaluateRule(ruleId);
    return;
  }
  if (job.name === 'concierge-generate') {
    const { tenantId } = job.data as { tenantId: string };
    await runConciergeGenerators(tenantId);
    return;
  }
});

// Fire-and-forget helper for routes (run-now uses evaluateRule directly).
export async function enqueueTaskRule(ruleId: string): Promise<void> {
  await enqueue(TASKS_QUEUE, 'evaluate-rule', { ruleId });
}

export async function scanTaskRules(): Promise<void> {
  const due = await dueRules();
  for (const rule of due) {
    await enqueue(TASKS_QUEUE, 'evaluate-rule', { ruleId: rule.id });
  }
  if (due.length > 0) logger.info({ due: due.length }, 'task rules dispatched');
}

// ─── T3: dispatch concierge generator runs per active tenant ───
export async function scanConciergeGenerators(): Promise<void> {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true },
    take: 100,
  });
  for (const t of tenants) {
    await enqueue(TASKS_QUEUE, 'concierge-generate', { tenantId: t.id });
  }
  if (tenants.length > 0)
    logger.info({ tenants: tenants.length }, 'concierge generators dispatched');
}

export function startTaskScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('* * * * *', async () => {
        await scanTaskRules().catch((err) => logger.error({ err }, 'task rule scan failed'));
        await flagSlaBreaches().catch((err) => logger.error({ err }, 'SLA breach scan failed'));
      });
      cron.default.schedule('*/15 * * * *', async () => {
        await scanConciergeGenerators().catch((err) =>
          logger.error({ err }, 'concierge generator scan failed')
        );
      });
      logger.info(
        'Task scheduler started (rule scan + SLA flags every minute, concierge generators every 15 min)'
      );
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — task scheduler disabled');
    });
}
