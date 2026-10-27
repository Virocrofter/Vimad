/* apps/api/src/jobs/housekeeping.job.ts — T2+ HK auto-status scheduler */
import { logger } from '../common/logger.js';
import {
  runAllStagnantRules,
  runOvernightRules,
} from '../modules/housekeeping/hk-rules.service.js';

export function startHousekeepingScheduler() {
  return import('node-cron')
    .then((cron) => {
      cron.default.schedule('*/30 * * * *', async () => {
        await runAllStagnantRules().catch((err) =>
          logger.error({ err }, 'HK stagnant scan failed')
        );
      });
      cron.default.schedule('30 4 * * *', async () => {
        await runOvernightRules().catch((err) => logger.error({ err }, 'HK overnight roll failed'));
      });
      logger.info('Housekeeping auto-status scheduler started (stagnant */30min, overnight 04:30)');
    })
    .catch((err) => {
      logger.warn({ err }, 'node-cron unavailable — HK auto-status scheduler disabled');
    });
}
