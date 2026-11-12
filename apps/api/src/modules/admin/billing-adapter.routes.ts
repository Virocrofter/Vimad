// apps/api/src/modules/admin/billing-adapter.routes.ts
// Adapter endpoints the billing drawer frontend expects, alongside the
// Phase B /billing/* routes (additive - no existing route is touched).
// Style note: every handler path ends with a value-less `return;` so
// noImplicitReturns stays satisfied (try, error, and catch paths uniform).
import { randomUUID } from 'crypto';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';
import { planFee } from './plan-catalog.js';
import { resolveMonthlyFee } from './contracts.service.js';

export const billingAdapterRouter = Router();
billingAdapterRouter.use(authMiddleware, requireAdminRole);

const actorOf = (req: Request) => (req as any).user?.email || 'platform-admin';
const num = (v: unknown) => Number(v ?? 0);

async function audit(
  actor: string,
  action: string,
  entity: string,
  entityId: string,
  tenantId: string | null,
  after: any
) {
  await prisma.platformAuditEvent.create({
    data: {
      id: randomUUID(),
      actorEmail: actor,
      action,
      entity,
      entityId,
      tenantId,
      after: after ?? {},
      source: 'api',
    },
  });
}

/* GET /summary - billing home KPIs (contract-aware MRR) */
billingAdapterRouter.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.tenant.findMany({ where: { status: 'active' } });
    let mrr = 0;
    for (const t of tenants) {
      mrr += await resolveMonthlyFee(t.id, planFee(t.plan));
    }
    const invoices = await prisma.invoice.findMany();
    const now = new Date();
    const isOpen = (i: any) => !['paid', 'void', 'cancelled'].includes(i.status);
    const invoiced =
      invoices.filter(isOpen).reduce((s, i) => s + num(i.totalAmount), 0) +
      invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + num(i.totalAmount), 0);
    const paid = invoices
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + num(i.totalAmount), 0);
    const overdueAmount = invoices
      .filter((i) => isOpen(i) && i.status !== 'draft' && new Date(i.dueDate) < now)
      .reduce((s, i) => s + num(i.totalAmount), 0);

    res.json({
      mrr,
      arr: mrr * 12,
      activeTenants: tenants.length,
      overdueAmount,
      collectionRatePct: invoiced > 0 ? Number(((paid / invoiced) * 100).toFixed(1)) : null,
      mrrDeltaPct: null,
      overdueDeltaPct: null,
    });
    return;
  } catch (err) {
    next(err);
    return;
  }
});

/* POST /invoices/:id/send */
billingAdapterRouter.post(
  '/invoices/:id/send',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      if (invoice.status !== 'draft') {
        res.status(409).json({ error: `Invoice is ${invoice.status}` });
        return;
      }
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'sent' },
      });
      await audit(actorOf(req), 'invoice_sent', 'invoice', invoice.id, invoice.tenantId, {
        status: 'sent',
      });
      res.json(updated);
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

const PaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().default('bank_transfer'),
  reference: z.string().optional(),
  note: z.string().optional(),
});

/* POST /invoices/:id/payments */
billingAdapterRouter.post(
  '/invoices/:id/payments',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = PaymentSchema.parse(req.body ?? {});
      const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      if (['paid', 'void', 'cancelled'].includes(invoice.status)) {
        res.status(409).json({ error: `Invoice is ${invoice.status}` });
        return;
      }
      const total = num(invoice.totalAmount);
      const fullyPaid = body.amount >= total;
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: fullyPaid ? 'paid' : 'partially_paid',
          paidAt: fullyPaid ? new Date() : invoice.paidAt,
        },
      });
      await audit(actorOf(req), 'invoice_payment', 'invoice', invoice.id, invoice.tenantId, {
        amount: body.amount,
        method: body.method,
        reference: body.reference ?? null,
        note: body.note ?? null,
        resultingStatus: updated.status,
      });
      res.json(updated);
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

const CreditNoteSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1),
});

/* POST /invoices/:id/credit-note */
billingAdapterRouter.post(
  '/invoices/:id/credit-note',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = CreditNoteSchema.parse(req.body ?? {});
      const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      const now = new Date();
      const credit = await prisma.invoice.create({
        data: {
          id: randomUUID(),
          tenantId: invoice.tenantId,
          periodStart: invoice.periodStart,
          periodEnd: invoice.periodEnd,
          dueDate: now,
          plan: invoice.plan,
          baseAmount: -body.amount,
          overageAmount: 0,
          totalAmount: -body.amount,
          currency: invoice.currency,
          status: 'sent',
          billingPeriod: (invoice.billingPeriod ?? '') + '-CN',
          items: [
            {
              description: 'Credit note: ' + body.reason,
              amount: -body.amount,
              originalInvoiceId: invoice.id,
            },
          ],
        },
      });
      await audit(actorOf(req), 'credit_note_issued', 'invoice', credit.id, invoice.tenantId, {
        originalInvoiceId: invoice.id,
        amount: -body.amount,
        reason: body.reason,
      });
      res.status(201).json(credit);
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

/* POST /subscriptions/:id/plan */
const PlanChangeSchema = z.object({
  plan: z.string().min(1),
  immediate: z.boolean().default(false),
});

billingAdapterRouter.post(
  '/subscriptions/:id/plan',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = PlanChangeSchema.parse(req.body ?? {});
      const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { plan: body.plan },
      });
      await audit(actorOf(req), 'subscription_plan_changed', 'tenant', tenant.id, tenant.id, {
        before: { plan: tenant.plan },
        after: { plan: updated.plan },
        immediate: body.immediate,
      });
      res.json({ id: updated.id, plan: updated.plan, status: updated.status });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

/* POST /subscriptions/:id/pause */
billingAdapterRouter.post(
  '/subscriptions/:id/pause',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'suspended' },
      });
      await audit(actorOf(req), 'subscription_paused', 'tenant', tenant.id, tenant.id, {
        reason: (req.body as any)?.reason ?? null,
      });
      res.json({ id: updated.id, status: updated.status });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

/* POST /subscriptions/:id/resume */
billingAdapterRouter.post(
  '/subscriptions/:id/resume',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
      if (!tenant) {
        res.status(404).json({ error: 'Tenant not found' });
        return;
      }
      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'active' },
      });
      await audit(actorOf(req), 'subscription_resumed', 'tenant', tenant.id, tenant.id, {});
      res.json({ id: updated.id, status: updated.status });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

/* POST /dunning/:id/remind */
billingAdapterRouter.post(
  '/dunning/:id/remind',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      await audit(actorOf(req), 'dunning_reminder_sent', 'invoice', invoice.id, invoice.tenantId, {
        tenantId: invoice.tenantId,
      });
      res.json({ ok: true, invoiceId: invoice.id });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

/* POST /dunning/:id/resolve */
billingAdapterRouter.post(
  '/dunning/:id/resolve',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      await audit(actorOf(req), 'dunning_resolved', 'invoice', invoice.id, invoice.tenantId, {
        note: (req.body as any)?.note ?? null,
      });
      res.json({ ok: true, invoiceId: invoice.id });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

/* GET /tenants - picker source for invoice/contract creation */
billingAdapterRouter.get('/tenants', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, slug: true, plan: true, status: true },
      orderBy: { name: 'asc' },
    });
    res.json(tenants);
    return;
  } catch (err) {
    next(err);
    return;
  }
});
/* GET /analytics - Revenue drawer: MRR curve (daily/weekly/monthly) + forecast + movement + pipeline */
async function mrrAt(tenants: any[], cutoff: Date): Promise<number> {
  const inBucket = tenants.filter(
    (t: any) => t.createdAt < cutoff && t.status === 'active' && t.plan !== 'trial'
  );
  let mrr = 0;
  for (const t of inBucket) mrr += await resolveMonthlyFee(t.id, planFee(t.plan));
  return Math.round(mrr * 100) / 100;
}

billingAdapterRouter.get('/analytics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const DAY = 86400000;
    const monthKey = (d: Date) => d.toISOString().slice(0, 7);
    const tenants = await prisma.tenant.findMany({
      select: { id: true, plan: true, status: true, createdAt: true },
    });

    // Monthly: last 12 months
    const monthly: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
      monthly.push({ label: monthKey(d), mrr: await mrrAt(tenants, end) });
    }

    // Weekly: last 12 weeks (7-day buckets ending at now)
    const weekly: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * DAY);
      const start = new Date(end.getTime() - 7 * DAY);
      weekly.push({ label: start.toISOString().slice(5, 10), mrr: await mrrAt(tenants, end) });
    }

    // Daily: last 30 days
    const daily: any[] = [];
    for (let i = 29; i >= 0; i--) {
      const end = new Date(now.getTime() - i * DAY);
      daily.push({ label: end.toISOString().slice(5, 10), mrr: await mrrAt(tenants, end) });
    }

    const currentMrr = monthly.length ? monthly[monthly.length - 1].mrr : 0;

    const pipelineContracts = await prisma.contract.findMany({
      where: { status: { in: ['draft', 'pending_activation'] } },
      select: { status: true, netFee: true },
    });
    const draftMrr = pipelineContracts
      .filter((c: any) => c.status === 'draft')
      .reduce((s: number, c: any) => s + num(c.netFee), 0);
    const pendingMrr = pipelineContracts
      .filter((c: any) => c.status === 'pending_activation')
      .reduce((s: number, c: any) => s + num(c.netFee), 0);
    const trialCount = tenants.filter(
      (t: any) => t.status === 'active' && t.plan === 'trial'
    ).length;
    const pipelineMrr = Math.round((draftMrr + pendingMrr) * 100) / 100;

    const forecast: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
      const ramp = i === 1 ? 0.5 : i === 2 ? 0.8 : 1;
      forecast.push({
        label: monthKey(d),
        mrr: Math.round((currentMrr + pipelineMrr * ramp) * 100) / 100,
      });
    }

    const since = new Date(now.getTime() - 90 * DAY);
    const events = await prisma.contractEvent.findMany({
      where: { createdAt: { gte: since }, type: { in: ['created', 'renewed', 'cancelled'] } },
      include: { contract: { select: { netFee: true, renewalFee: true } } },
    });
    const buckets: Record<string, any> = {};
    for (const ev of events as any[]) {
      const mk = monthKey(ev.createdAt);
      const b = (buckets[mk] = buckets[mk] || {
        month: mk,
        new: 0,
        expansion: 0,
        contraction: 0,
        churned: 0,
      });
      const fee = num(ev.contract?.netFee);
      if (ev.type === 'created') b.new += fee;
      else if (ev.type === 'renewed') {
        const after = ev.contract?.renewalFee != null ? num(ev.contract.renewalFee) : fee;
        if (after > fee) b.expansion += after - fee;
        else if (after < fee) b.contraction += fee - after;
      } else if (ev.type === 'cancelled') b.churned += fee;
    }
    const mv = Object.values(buckets) as any[];
    for (const b of mv) {
      b.new = Math.round(b.new);
      b.expansion = Math.round(b.expansion);
      b.contraction = Math.round(b.contraction);
      b.churned = Math.round(b.churned);
    }
    const sum = (k: string) => mv.reduce((s: number, b: any) => s + b[k], 0);
    const movement = {
      newMrr: sum('new'),
      expansionMrr: sum('expansion'),
      contractionMrr: sum('contraction'),
      churnedMrr: sum('churned'),
      net: sum('new') + sum('expansion') - sum('contraction') - sum('churned'),
    };

    const activeContracts = await prisma.contract.findMany({
      where: { status: { in: ['active', 'renewed'] }, endDate: { gt: now } },
      select: { tenantId: true, netFee: true },
    });
    const contractedIds = new Set(activeContracts.map((c: any) => c.tenantId));
    const contractedMrr = activeContracts.reduce((s: number, c: any) => s + num(c.netFee), 0);
    let planOnlyMrr = 0;
    for (const t of tenants) {
      if (t.status === 'active' && t.plan !== 'trial' && !contractedIds.has(t.id))
        planOnlyMrr += planFee(t.plan);
    }

    res.json({
      currentMrr,
      series: { daily, weekly, monthly },
      forecast,
      pipeline: { draftMrr, pendingMrr, trialCount, pipelineMrr },
      movement,
      monthlyMovement: mv,
      mix: [
        { name: 'Under contract', mrr: Math.round(contractedMrr) },
        { name: 'Plan rate (no contract)', mrr: Math.round(planOnlyMrr) },
      ],
    });
    return;
  } catch (err) {
    next(err);
    return;
  }
});

/* GET /finances - payouts, processing fees, cost to serve, margins */
billingAdapterRouter.get('/finances', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const DAY = 86400000;
    const since = new Date(now.getTime() - 30 * DAY);

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: since }, status: { notIn: ['failed', 'pending'] } },
      select: { tenantId: true, channel: true, amountMinor: true, feeMinor: true, createdAt: true },
    });
    const collected = payments.reduce((s: number, p: any) => s + num(p.amountMinor), 0) / 100;
    const fees = payments.reduce((s: number, p: any) => s + num(p.feeMinor), 0) / 100;

    const volumeMap: Record<string, any> = {};
    for (const p of payments as any[]) {
      const k = p.createdAt.toISOString().slice(5, 10);
      const v = (volumeMap[k] = volumeMap[k] || { label: k, amount: 0, fee: 0 });
      v.amount += num(p.amountMinor) / 100;
      v.fee += num(p.feeMinor) / 100;
    }
    const volume = Object.values(volumeMap).map((v: any) => ({
      label: v.label,
      amount: Math.round(v.amount),
      fee: Math.round(v.fee * 100) / 100,
    }));

    const channelsMap: Record<string, any> = {};
    for (const p of payments as any[]) {
      const c = (channelsMap[p.channel || 'card'] = channelsMap[p.channel || 'card'] || {
        channel: p.channel || 'card',
        amount: 0,
        fee: 0,
      });
      c.amount += num(p.amountMinor) / 100;
      c.fee += num(p.feeMinor) / 100;
    }
    const channels = Object.values(channelsMap).map((c: any) => ({
      channel: c.channel,
      amount: Math.round(c.amount),
      fee: Math.round(c.fee * 100) / 100,
    }));

    const usage = await prisma.usageLedger.groupBy({
      by: ['metric'],
      _sum: { quantity: true, ratedAmount: true },
    });
    const usageRows = usage.map((u: any) => ({
      metric: u.metric,
      quantity: num(u._sum.quantity),
      cost: Math.round((num(u._sum.ratedAmount) || 0) * 100) / 100,
    }));

    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, plan: true, status: true },
    });
    const feeByTenant: Record<string, number> = {};
    for (const p of payments as any[])
      feeByTenant[p.tenantId] = (feeByTenant[p.tenantId] || 0) + num(p.feeMinor) / 100;

    const margins = [];
    for (const t of tenants.filter((t: any) => t.status === 'active' && t.plan !== 'trial')) {
      const revenue = await resolveMonthlyFee(t.id, planFee(t.plan));
      const costs = Math.round(((feeByTenant[t.id] || 0) + 0) * 100) / 100;
      const marginPct = revenue > 0 ? Math.round(((revenue - costs) / revenue) * 1000) / 10 : null;
      margins.push({ id: t.id, name: t.name, revenue: Math.round(revenue), costs, marginPct });
    }
    margins.sort((a: any, b: any) => b.revenue - a.revenue);

    const usageCostTotal = usageRows.reduce((s: number, u: any) => s + u.cost, 0);
    const marginPct =
      collected > 0
        ? Math.round(((collected - fees - usageCostTotal) / collected) * 1000) / 10
        : null;

    res.json({
      kpis: {
        collected: Math.round(collected),
        fees: Math.round(fees * 100) / 100,
        net: Math.round(collected - fees),
        marginPct,
      },
      volume,
      channels,
      usage: usageRows,
      margins: margins.slice(0, 12),
    });
    return;
  } catch (err) {
    next(err);
    return;
  }
});
