/* apps/api/src/jobs/night-audit.job.ts */
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { runNightAudit } from '../modules/night-audit/night-audit.service.js';

/**
 * Night Audit Scheduled Job
 * Runs every minute to check for scheduled audits that are due.
 * Call this from your job scheduler (BullMQ, node-cron, etc.)
 */
export async function processScheduledNightAudits() {
  try {
    const now = new Date();

    const dueSchedules = await prisma.nightAuditSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
      include: {
        property: { select: { id: true, name: true, tenantId: true } },
      },
    });

    if (dueSchedules.length === 0) return;

    logger.info({ count: dueSchedules.length }, 'Processing scheduled night audits');

    for (const schedule of dueSchedules) {
      try {
        if (!schedule.autoRun) {
          // Reminder mode — just log and update next run
          logger.info(
            { propertyId: schedule.propertyId, propertyName: schedule.property.name },
            'Night audit reminder: manual run required'
          );

          // Calculate next run
          const [hours, minutes] = schedule.scheduledTime.split(':').map(Number);
          const nextRun = new Date(now);
          nextRun.setHours(hours, minutes, 0, 0);
          nextRun.setDate(nextRun.getDate() + 1);

          await prisma.nightAuditSchedule.update({
            where: { id: schedule.id },
            data: { nextRunAt: nextRun },
          });
          continue;
        }

        // Auto-run mode
        logger.info(
          { propertyId: schedule.propertyId, propertyName: schedule.property.name },
          'Auto-running scheduled night audit'
        );

        const auditDate = new Date();
        auditDate.setHours(0, 0, 0, 0);

        const steps = schedule.steps as Record<string, boolean>;

        await runNightAudit(schedule.tenantId, 'system', {
          propertyId: schedule.propertyId,
          auditDate,
          autoPostRoomCharges: steps.autoPostRoomCharges ?? true,
          verifyBalances: steps.verifyBalances ?? true,
          generateReports: steps.generateReports ?? true,
          closeDay: steps.closeDay ?? true,
          processNoShows: steps.processNoShows ?? true,
          updateRoomStatuses: steps.updateRoomStatuses ?? true,
          loadRatesForNewDate: steps.loadRatesForNewDate ?? true,
        });

        // Calculate next run
        const [hours, minutes] = schedule.scheduledTime.split(':').map(Number);
        const nextRun = new Date(now);
        nextRun.setHours(hours, minutes, 0, 0);
        nextRun.setDate(nextRun.getDate() + 1);

        await prisma.nightAuditSchedule.update({
          where: { id: schedule.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextRun,
          },
        });

        logger.info(
          { propertyId: schedule.propertyId, propertyName: schedule.property.name },
          'Scheduled night audit completed successfully'
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(
          {
            err,
            errorMessage,
            propertyId: schedule.propertyId,
            propertyName: schedule.property.name,
          },
          'Scheduled night audit failed'
        );

        // Calculate next run even on failure so it doesn't spam
        const [hours, minutes] = schedule.scheduledTime.split(':').map(Number);
        const nextRun = new Date(now);
        nextRun.setHours(hours, minutes, 0, 0);
        nextRun.setDate(nextRun.getDate() + 1);

        await prisma.nightAuditSchedule
          .update({
            where: { id: schedule.id },
            data: { nextRunAt: nextRun },
          })
          .catch(() => {}); // Don't let update failure crash the loop
      }
    }
  } catch (err) {
    logger.error({ err }, 'Failed to process scheduled night audits');
  }
}

/**
 * Simple cron wrapper using node-cron
 * Install: npm install node-cron
 *
 * Usage in your server startup (e.g. apps/api/src/index.ts):
 *
 *   import cron from 'node-cron';
 *   import { processScheduledNightAudits } from './jobs/night-audit.job.js';
 *
 *   cron.schedule('* * * * *', () => {
 *     processScheduledNightAudits();
 *   });
 */
export function startNightAuditScheduler() {
  // Dynamic import to avoid hard dependency if not installed
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('* * * * *', async () => {
        await processScheduledNightAudits();
      });
      logger.info('Night audit scheduler started (runs every minute)');
    })
    .catch((err) => {
      logger.warn(
        { err },
        'node-cron not installed — night audit scheduler disabled. Install with: npm install node-cron'
      );
    });
}
