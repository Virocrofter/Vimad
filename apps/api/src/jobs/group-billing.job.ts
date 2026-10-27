/* apps/api/src/jobs/group-billing.job.ts — T3+ auto close-and-send */
import { logger } from '../common/logger.js';
import { runAutoSend } from '../modules/folios/group-billing.service.js';

export function startGroupBillingScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('*/15 * * * *', async () => {
        const r = await runAutoSend().catch((err) => {
          logger.error({ err }, 'group-billing auto-send failed');
          return { processed: 0 };
        });
        if (r.processed > 0) logger.info({ processed: r.processed }, 'group-billing auto-sent');
      });
      logger.info('Group billing auto-send scheduler started (*/15min)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — group billing scheduler disabled');
    });
}
