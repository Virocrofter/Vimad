/* apps/api/src/jobs/ar.job.ts
 * AR dunning: every 6 hours, find open invoices past due that haven't been
 * reminded in 6+ days, email the account's billing contact and notify the
 * finance user. Status itself is derived (see ar.service) — this job only
 * drives communication, so missing a run degrades nothing.
 */
import cron from 'node-cron';
import { createWorker, enqueue } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { sendEmail } from './email.queue.js';
import { arService } from '../modules/ar/ar.service.js';

const TENANT_BATCH = 'ar-overdue-scan';

export async function scanOverdueReminders(): Promise<{ scanned: number; reminded: number }> {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true },
  });
  let reminded = 0;
  let scanned = 0;

  for (const t of tenants) {
    const overdue = await arService.overdueForReminder(t.id);
    scanned += overdue.length;
    const remindedIds: string[] = [];

    for (const inv of overdue) {
      const to = inv.corporateAccount.billingEmail || inv.corporateAccount.email;
      if (!to) continue;

      const balance = Math.round((Number(inv.total) - Number(inv.amountPaid)) * 100) / 100;
      await sendEmail({
        to,
        subject: `Payment reminder — ${inv.number}`,
        template: 'ar-overdue-reminder',
        payload: {
          accountName: inv.corporateAccount.name,
          invoiceNumber: inv.number,
          amount: balance,
          currency: inv.currency,
          dueDate: new Date(inv.dueDate).toISOString().slice(0, 10),
        },
        tenantId: t.id,
        relatedType: 'ar_invoice',
        relatedId: inv.id,
      });

      remindedIds.push(inv.id);
      reminded += 1;
    }

    await arService.markReminderSent(remindedIds);
  }

  return { scanned, reminded };
}

export function startArScheduler(): void {
  // Every 6 hours at minute 20 — off the hour to avoid thundering herds.
  cron.schedule('20 */6 * * *', async () => {
    try {
      await enqueue('ar', TENANT_BATCH, { at: new Date().toISOString() });
    } catch (err) {
      logger.error({ err }, 'failed to enqueue ar overdue scan');
    }
  });
  logger.info('AR dunning scheduler started (every 6h)');
}

export const arWorker = createWorker('ar', async (job) => {
  if (job.name !== TENANT_BATCH) return;
  const result = await scanOverdueReminders();
  logger.info({ ...result }, 'ar overdue scan complete');
});
