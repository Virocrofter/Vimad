import { randomUUID } from 'node:crypto';
import { prisma } from '../../../common/prisma.js';
import { AppError } from '../../../common/errors.js';

export const PLAN_CATALOGUE: Record<string, { name: string; monthlyFee: number }> = {
  trial: { name: 'Trial', monthlyFee: 0 },
  starter: { name: 'Starter', monthlyFee: 199 },
  growth: { name: 'Growth', monthlyFee: 499 },
  pro: { name: 'Pro', monthlyFee: 999 },
  enterprise: { name: 'Enterprise', monthlyFee: 0 },
};

export async function resolveBaseFee(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  const now = new Date();
  const contract = await prisma.contract.findFirst({
    where: { tenantId, status: 'active', startDate: { lte: now }, endDate: { gte: now } },
    orderBy: { version: 'desc' },
  });
  if (contract) {
    return {
      source: 'contract',
      amount: Number(contract.netFee),
      plan: tenant.plan,
      contractId: contract.id,
    };
  }
  const plan = PLAN_CATALOGUE[tenant.plan] ?? { name: tenant.plan, monthlyFee: 0 };
  return { source: 'plan_catalogue', amount: plan.monthlyFee, plan: tenant.plan };
}

async function audit(entry: any) {
  await prisma.platformAuditEvent.create({
    data: {
      id: randomUUID(),
      actorEmail: entry.actorEmail,
      action: entry.action,
      entity: 'invoice',
      entityId: entry.entityId,
      tenantId: entry.tenantId,
      before:
        entry.before === undefined ? undefined : JSON.parse(JSON.stringify(entry.before ?? null)),
      after:
        entry.after === undefined ? undefined : JSON.parse(JSON.stringify(entry.after ?? null)),
      reason: entry.reason,
      correlationId: entry.idempotencyKey,
      source: 'console',
    },
  });
}

export async function generateInvoice(
  tenantId: string,
  period: string,
  actorEmail: string,
  idemKey?: string
) {
  const existing = await prisma.invoice.findFirst({ where: { tenantId, billingPeriod: period } });
  if (existing) return { invoice: existing, created: false, idempotentReplay: true };
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  if (tenant.plan === 'trial' || tenant.status !== 'active') {
    return {
      invoice: null,
      created: false,
      skipped: tenant.plan === 'trial' ? 'trial' : 'inactive',
    };
  }
  const fee = await resolveBaseFee(tenantId);
  const [year, month] = period.split('-').map(Number);
  const dueDate = new Date(Date.UTC(year, month, 0));
  try {
    const invoice = await prisma.invoice.create({
      data: {
        id: randomUUID(),
        tenantId,
        periodStart: new Date(Date.UTC(year, month - 1, 1)),
        periodEnd: dueDate,
        dueDate,
        plan: tenant.plan,
        baseAmount: fee.amount,
        overageAmount: 0,
        totalAmount: fee.amount,
        currency: 'ZAR',
        status: 'sent',
        billingPeriod: period,
        items: {
          lines: [
            {
              description: 'Vimad ' + fee.plan + ' subscription - ' + period,
              amount: fee.amount,
              source: fee.source,
              plan: fee.plan,
              billingPeriod: period,
              taxTreatment: 'vat-inclusive (SA)',
            },
          ],
          billingPeriod: period,
          meteredRatesPending: true,
        },
      },
    });
    await audit({
      actorEmail,
      action: 'platform.invoice.generated',
      entityId: invoice.id,
      tenantId,
      after: { period, amount: fee.amount },
      idempotencyKey: idemKey,
    });
    return { invoice, created: true };
  } catch (e: any) {
    if (e?.code === 'P2002') {
      const raced = await prisma.invoice.findFirst({ where: { tenantId, billingPeriod: period } });
      return { invoice: raced, created: false, idempotentReplay: true };
    }
    throw e;
  }
}

export async function generateForPeriod(period: string, actorEmail: string, idemKey?: string) {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true, plan: true },
  });
  let created = 0,
    existing = 0,
    skippedTrials = 0,
    skippedInactive = 0,
    invoiceSum = 0;
  for (const t of tenants) {
    const r: any = await generateInvoice(t.id, period, actorEmail, idemKey);
    if (r.created) {
      created++;
      invoiceSum += Number(r.invoice.totalAmount);
    } else if (r.idempotentReplay) existing++;
    else if (r.skipped === 'trial') skippedTrials++;
    else skippedInactive++;
  }
  const mrr = await computeMrr();
  return {
    period,
    processed: tenants.length,
    created,
    existing,
    skippedTrials,
    skippedInactive,
    invoiceSum,
    reconciliation: {
      dashboardMRR: mrr.mrr,
      invoiceSum,
      balanced: Math.abs(mrr.mrr - invoiceSum) < 0.01 || created === 0,
    },
  };
}

export async function computeMrr() {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'active' },
    select: { id: true, plan: true },
  });
  let mrr = 0,
    paying = 0;
  for (const t of tenants) {
    const fee = PLAN_CATALOGUE[t.plan]?.monthlyFee ?? 0;
    mrr += fee;
    if (fee > 0) paying++;
  }
  return { mrr, arr: mrr * 12, activeTenants: tenants.length, payingTenants: paying };
}

export async function listInvoices(query: any) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 25));
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.tenantId) where.tenantId = query.tenantId;
  if (query.period) where.billingPeriod = query.period;
  const [total, rows] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { tenant: { select: { name: true, slug: true } } },
    }),
  ]);
  return { rows, total, page, limit };
}

async function appliedCredits(invoiceId: string): Promise<number> {
  const credits = await prisma.invoice.findMany({
    where: { items: { path: ['creditOf'], equals: invoiceId }, status: 'applied' },
  });
  return credits.reduce((sum, c) => sum + Math.abs(Number(c.totalAmount)), 0);
}

export async function invoiceDetail(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: { select: { name: true, slug: true, plan: true } } },
  });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  const creditsApplied = await appliedCredits(invoiceId);
  return {
    ...invoice,
    creditsApplied,
    balanceDue: Math.max(0, Number(invoice.totalAmount) - creditsApplied),
  };
}

export async function markPaid(
  invoiceId: string,
  reference: string,
  actorEmail: string,
  idemKey?: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  if (invoice.status === 'paid') return { invoice, already: true };
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'paid',
      paidAt: new Date(),
      items: { ...(invoice.items as object), paidReference: reference } as any,
    },
  });
  await audit({
    actorEmail,
    action: 'platform.invoice.mark_paid',
    entityId: invoiceId,
    tenantId: invoice.tenantId,
    before: { status: invoice.status },
    after: { status: 'paid', reference },
    idempotencyKey: idemKey,
  });
  return { invoice: updated };
}

export async function createCreditNote(input: any) {
  const parent = await prisma.invoice.findUnique({ where: { id: input.invoiceId } });
  if (!parent) throw new AppError(404, 'Parent invoice not found', 'NOT_FOUND');
  if (input.amount <= 0)
    throw new AppError(400, 'Credit amount must be positive', 'VALIDATION_ERROR');
  const eligible = Number(parent.totalAmount) - (await appliedCredits(parent.id));
  if (input.amount > eligible)
    throw new AppError(
      422,
      'Credit exceeds eligible parent balance (' + eligible + ')',
      'CREDIT_EXCEEDS_BALANCE'
    );
  const credit = await prisma.invoice.create({
    data: {
      id: randomUUID(),
      tenantId: parent.tenantId,
      periodStart: parent.periodStart,
      periodEnd: parent.periodEnd,
      dueDate: parent.dueDate,
      plan: parent.plan,
      baseAmount: -input.amount,
      overageAmount: 0,
      totalAmount: -input.amount,
      currency: parent.currency,
      status: 'draft',
      items: { creditOf: parent.id, reason: input.reason },
    },
  });
  await audit({
    actorEmail: input.actorEmail,
    action: 'platform.credit_note.created',
    entityId: credit.id,
    tenantId: parent.tenantId,
    after: { parentId: parent.id, amount: input.amount },
    reason: input.reason,
    idempotencyKey: input.idempotencyKey,
  });
  return { credit };
}

export async function applyCreditNote(creditId: string, actorEmail: string, idemKey?: string) {
  const credit = await prisma.invoice.findUnique({ where: { id: creditId } });
  if (!credit) throw new AppError(404, 'Credit note not found', 'NOT_FOUND');
  if (credit.status === 'applied') return { credit, already: true };
  if (credit.status !== 'draft')
    throw new AppError(409, 'Credit note not in draft', 'INVALID_STATE');
  const parentId = (credit.items as any)?.creditOf;
  const updated = await prisma.invoice.update({
    where: { id: creditId },
    data: {
      status: 'applied',
      items: { ...(credit.items as object), appliedAt: new Date().toISOString() } as any,
    },
  });
  await audit({
    actorEmail,
    action: 'platform.credit_note.applied',
    entityId: creditId,
    tenantId: credit.tenantId,
    before: { status: 'draft' },
    after: { status: 'applied', parentId },
    idempotencyKey: idemKey,
  });
  return { credit: updated };
}

export async function dunningQueue() {
  const now = new Date();
  const overdue = await prisma.invoice.findMany({
    where: { status: { in: ['sent', 'overdue'] }, dueDate: { lt: now } },
    include: { tenant: { select: { name: true, slug: true } } },
    orderBy: { dueDate: 'asc' },
  });
  return overdue.map((inv: any) => ({
    invoiceId: inv.id,
    tenant: inv.tenant.name,
    period: inv.billingPeriod,
    amount: Number(inv.totalAmount),
    status: inv.status,
    daysOverdue: Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / 86400000),
    remindersSent: (inv.items as any)?.remindersSent ?? 0,
  }));
}

export async function sendReminder(invoiceId: string, actorEmail: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  const items = (invoice.items as any) ?? {};
  const reminders = (items.remindersSent ?? 0) as number;
  if (reminders >= 3)
    throw new AppError(422, 'Dunning reminder limit reached (3)', 'DUNNING_LIMIT');
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'overdue',
      items: {
        ...items,
        remindersSent: reminders + 1,
        lastReminderAt: new Date().toISOString(),
      } as any,
    },
  });
  await audit({
    actorEmail,
    action: 'platform.dunning.reminder_sent',
    entityId: invoiceId,
    tenantId: invoice.tenantId,
    after: { stage: reminders + 1 },
    reason: 'dunning',
  });
  return { invoice: updated, remindersSent: reminders + 1 };
}

export async function dashboard() {
  const mrr = await computeMrr();
  const [overdueAgg, paidAgg, sentAgg] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: 'overdue' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ['sent', 'overdue'] } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
  ]);
  const invoicedTotal =
    Number(paidAgg._sum.totalAmount ?? 0) + Number(sentAgg._sum.totalAmount ?? 0);
  const collectedTotal = Number(paidAgg._sum.totalAmount ?? 0);
  return {
    ...mrr,
    overdueAmount: Number(overdueAgg._sum.totalAmount ?? 0),
    overdueCount: overdueAgg._count.id,
    invoicedTotal,
    collectedTotal,
    collectionRate: invoicedTotal > 0 ? collectedTotal / invoicedTotal : 0,
    mrrDefinition:
      'Sum of plan-catalogue (or contract) monthly fees for active tenants. Excludes trials, one-time onboarding, usage overages (pending rates).',
  };
}
