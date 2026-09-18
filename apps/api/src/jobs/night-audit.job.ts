/* apps/api/src/jobs/night-audit.job.ts */
import { enqueue, createWorker } from '../common/queue.js';
import { logger } from '../common/logger.js';
import { runNightAudit } from '../modules/night-audit/night-audit.service.js';

export const NIGHT_AUDIT_QUEUE = 'night-audit';

export interface NightAuditData {
  tenantId: string;
  propertyId: string;
  date: string; // ISO date
  userId?: string;
}

// ─── Schedule Helper ───
export async function scheduleNightAudit(
  tenantId: string,
  propertyId: string,
  date: string,
  userId?: string
) {
  await enqueue(NIGHT_AUDIT_QUEUE, 'run-night-audit', { tenantId, propertyId, date, userId });
}

// ─── Worker ───
// Delegates to the night-audit service so scheduled audits run the exact
// same code path (validations, NightAudit record, idempotency) as manual ones.
export const nightAuditWorker = createWorker<NightAuditData>(NIGHT_AUDIT_QUEUE, async (job) => {
  const { tenantId, propertyId, date, userId } = job.data;

  logger.info({ tenantId, propertyId, date }, 'starting night audit');

  await runNightAudit(tenantId, userId ?? 'system', {
    propertyId,
    auditDate: new Date(date),
    autoPostRoomCharges: true,
    verifyBalances: true,
    generateReports: true,
    closeDay: true,
  });
});
