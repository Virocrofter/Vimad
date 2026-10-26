import { prisma } from '../common/prisma.js';
import { executeDueSchedules } from '../modules/reports/reports.service.js';

export function startReportsScheduler(intervalMs = 60000) {
  const tick = async () => {
    try {
      await executeDueSchedules(prisma);
    } catch {
      // next tick retries
    }
  };
  setInterval(tick, intervalMs);
  void tick();
}
