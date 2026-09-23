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

// ─── Usage Metering Helper ───
async function getUsageForPeriod(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<Record<string, number>> {
  const records = await prisma.usageRecord.groupBy({
    by: ['metric'],
    where: {
      tenantId,
      recordedAt: { gte: periodStart, lte: periodEnd },
    },
    _sum: { quantity: true },
  });

  const usage: Record<string, number> = {};
  for (const r of records) {
    usage[r.metric] = r._sum.quantity ?? 0;
  }
  return usage;
}

// ─── Plan Limits ───
const PLAN_LIMITS: Record<
  string,
  { apiCalls: number; storageGb: number; sms: number; includedProperties: number }
> = {
  starter: { apiCalls: 10_000, storageGb: 1, sms: 100, includedProperties: 1 },
  professional: { apiCalls: 100_000, storageGb: 10, sms: 1_000, includedProperties: 3 },
  enterprise: { apiCalls: 1_000_000, storageGb: 100, sms: 10_000, includedProperties: 10 },
};

const OVERAGE_RATES: Record<
  string,
  { perThousandApiCalls: number; perGbStorage: number; perSms: number; perExtraProperty: number }
> = {
  starter: { perThousandApiCalls: 0.5, perGbStorage: 5.0, perSms: 0.05, perExtraProperty: 49 },
  professional: { perThousandApiCalls: 0.3, perGbStorage: 3.0, perSms: 0.03, perExtraProperty: 29 },
  enterprise: { perThousandApiCalls: 0.15, perGbStorage: 1.5, perSms: 0.02, perExtraProperty: 19 },
};

// ─── Worker ───
export const billingWorker = createWorker<InvoiceJobData>(BILLING_QUEUE, async (job) => {
  const { tenantId, type: _type, periodStart, periodEnd, dueDate } = job.data;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { users: { where: { role: 'owner' }, take: 1 } },
  });

  if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

  const owner = tenant.users[0];
  const plan = tenant.plan.toLowerCase();
  const planRates: Record<string, number> = {
    starter: 99,
    professional: 299,
    enterprise: 799,
  };
  const baseRate = planRates[plan] ?? 99;

  // ─── REAL USAGE METERING ───
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const usage = await getUsageForPeriod(tenantId, start, end);

  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;
  const rates = OVERAGE_RATES[plan] ?? OVERAGE_RATES.starter;

  // Calculate overages
  const apiCalls = usage['api_calls'] ?? 0;
  const storageBytes = usage['storage_bytes'] ?? 0;
  const smsSent = usage['sms_sent'] ?? 0;
  const propertyCount = await prisma.property.count({ where: { tenantId } });

  const apiOverageUnits = Math.max(0, Math.ceil((apiCalls - limits.apiCalls) / 1000));
  const storageOverageGb = Math.max(0, storageBytes / 1024 ** 3 - limits.storageGb);
  const smsOverage = Math.max(0, smsSent - limits.sms);
  const propertyOverage = Math.max(0, propertyCount - limits.includedProperties);

  const apiOverageCost = apiOverageUnits * rates.perThousandApiCalls;
  const storageOverageCost = Math.round(storageOverageGb * rates.perGbStorage * 100) / 100;
  const smsOverageCost = smsOverage * rates.perSms;
  const propertyOverageCost = propertyOverage * rates.perExtraProperty;

  const overageFee =
    Math.round((apiOverageCost + storageOverageCost + smsOverageCost + propertyOverageCost) * 100) /
    100;
  const total = Math.round((baseRate + overageFee) * 100) / 100;

  // Create invoice record
  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        tenantId,
        customerId: owner?.id,
        plan: tenant.plan,
        periodStart: start,
        periodEnd: end,
        dueDate: new Date(dueDate),
        baseAmount: baseRate,
        overageAmount: overageFee,
        totalAmount: total,
        currency: 'USD',
        status: 'sent',
        items: {
          plan: tenant.plan,
          baseRate,
          usage: {
            apiCalls,
            apiCallsLimit: limits.apiCalls,
            apiOverageUnits,
            apiOverageCost,
            storageBytes,
            storageLimitGb: limits.storageGb,
            storageOverageGb: Math.round(storageOverageGb * 100) / 100,
            storageOverageCost,
            smsSent,
            smsLimit: limits.sms,
            smsOverage,
            smsOverageCost,
            propertyCount,
            includedProperties: limits.includedProperties,
            propertyOverage,
            propertyOverageCost,
          },
          overageFee,
          total,
          periodStart,
          periodEnd,
        } as any,
      },
    });

    return inv;
  });

  // Send email notification
  if (owner) {
    await sendInvoiceEmail(owner.email, invoice.id, total, 'USD');
  }

  logger.info(
    { invoiceId: invoice.id, tenantId, total, baseRate, overageFee, usage },
    'invoice generated with real usage metering'
  );
});
