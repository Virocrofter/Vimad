/* apps/api/src/jobs/billing.job.ts */
import { enqueue, createWorker } from '../common/queue.js';
import { prisma } from '../common/prisma.js';
import { logger } from '../common/logger.js';
import { sendInvoiceEmail } from './email.queue.js';

export const BILLING_QUEUE = 'billing';

export interface InvoiceJobData {
  tenantId: string;
  type: 'recurring' | 'one-time' | 'overage';
  periodStart: string;
  periodEnd: string;
  dueDate: string;
}

// ─── Schedule Helper ───
export async function generateInvoice(data: InvoiceJobData) {
  await enqueue(BILLING_QUEUE, 'generate-invoice', data);
}

// ─── Worker ───
export const billingWorker = createWorker<InvoiceJobData>(BILLING_QUEUE, async (job) => {
  const { tenantId, type: _type, periodStart, periodEnd, dueDate } = job.data;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { users: { where: { role: 'owner' }, take: 1 } },
  });

  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const owner = tenant.users[0];
  const planRates: Record<string, number> = {
    starter: 99,
    professional: 299,
    enterprise: 799,
  };
  const baseRate = planRates[tenant.plan.toLowerCase()] ?? 99;

  // Calculate overages (mock logic — replace with real usage tracking)
  const propertyCount = await prisma.property.count({ where: { tenantId } });
  const overageFee = propertyCount > 1 ? (propertyCount - 1) * 49 : 0;

  const total = baseRate + overageFee;

  // Create invoice record
  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        tenantId,
        customerId: owner?.id,
        plan: tenant.plan,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        dueDate: new Date(dueDate),
        baseAmount: baseRate,
        overageAmount: overageFee,
        totalAmount: total,
        currency: 'USD',
        status: 'sent',
        items: {
          plan: tenant.plan,
          baseRate,
          overageFee,
          propertyCount,
          periodStart,
          periodEnd,
        },
      },
    });

    return inv;
  });

  // Send email notification
  if (owner) {
    await sendInvoiceEmail(owner.email, invoice.id, total, 'USD');
  }

  logger.info({ invoiceId: invoice.id, tenantId, total }, 'invoice generated');
});
