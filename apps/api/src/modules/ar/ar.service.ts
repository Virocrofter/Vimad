/* apps/api/src/modules/ar/ar.service.ts
 * Accounts Receivable — corporate ledger.
 * Invariants enforced here (never trust the client for money):
 *   • invoice totals are recomputed server-side from line items
 *   • payments can never exceed the outstanding balance of an invoice
 *   • account balance = Σ open invoices − on-account (unapplied) payments
 *   • "overdue" is derived: status sent|partially_paid AND dueDate < today
 */
import { Prisma } from '@prisma/client';
import { resolveAuditPropertyId } from '../audit/audit-property.js';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { paginate, skipTake, type PaginationInput } from '../../common/pagination.js';

const round2 = (n: number): number => Math.round(n * 100) / 100;
const dayMs = 24 * 60 * 60 * 1000;

const OPEN_STATUSES = ['sent', 'partially_paid'];

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const deriveStatus = (inv: {
  status: string;
  amountPaid: unknown;
  total: unknown;
  dueDate: Date;
}): string => {
  if (inv.status === 'cancelled' || inv.status === 'paid' || inv.status === 'draft') {
    return inv.status;
  }
  const balance = round2(Number(inv.total) - Number(inv.amountPaid));
  if (balance <= 0) return 'paid';
  const derived = Number(inv.amountPaid) > 0 ? 'partially_paid' : 'sent';
  if (OPEN_STATUSES.includes(derived) && inv.dueDate < startOfToday()) return 'overdue';
  return derived;
};

const csvEscape = (v: unknown): string => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function nextInvoiceNumber(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
  const counter = await tx.arInvoiceCounter.upsert({
    where: { tenantId },
    update: { lastNumber: { increment: 1 } },
    create: { tenantId, lastNumber: 1 },
  });
  return `AR-INV-${String(counter.lastNumber).padStart(6, '0')}`;
}

export const arService = {
  // ─── Accounts ───

  async listAccounts(
    tenantId: string,
    q: { search?: string; status?: string; includeInactive?: boolean } & PaginationInput
  ) {
    const where = {
      tenantId,
      ...(q.includeInactive ? {} : { isActive: true }),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' as const } },
              { email: { contains: q.search, mode: 'insensitive' as const } },
              { contactName: { contains: q.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [accounts, total] = await Promise.all([
      prisma.corporateAccount.findMany({
        where,
        orderBy: { name: 'asc' },
        ...skipTake(q),
      }),
      prisma.corporateAccount.count({ where }),
    ]);

    const ids = accounts.map((a) => a.id);
    const [openAgg, creditAgg] = await Promise.all([
      prisma.arInvoice.groupBy({
        by: ['corporateAccountId'],
        where: {
          corporateAccountId: { in: ids },
          status: { in: OPEN_STATUSES },
        },
        _sum: { total: true, amountPaid: true },
      }),
      prisma.arPayment.groupBy({
        by: ['corporateAccountId'],
        where: { corporateAccountId: { in: ids }, invoiceId: null, status: 'applied' },
        _sum: { amount: true },
      }),
    ]);

    const openMap = new Map(openAgg.map((r) => [r.corporateAccountId, r._sum]));
    const creditMap = new Map(creditAgg.map((r) => [r.corporateAccountId, r._sum]));

    const data = accounts.map((a) => {
      const open = openMap.get(a.id);
      const outstanding = round2(
        Number(open?.total ?? 0) -
          Number(open?.amountPaid ?? 0) -
          Number(creditMap.get(a.id)?.amount ?? 0)
      );
      const creditLimit = a.creditLimit === null ? null : Number(a.creditLimit);
      return {
        ...a,
        creditLimit,
        outstanding,
        availableCredit: creditLimit === null ? null : round2(creditLimit - outstanding),
        creditUtilization:
          creditLimit && creditLimit > 0 ? round2((outstanding / creditLimit) * 100) : null,
      };
    });

    const filtered =
      q.status === 'overdue'
        ? data.filter((a) => a.outstanding > 0)
        : q.status === 'ok'
          ? data.filter((a) => a.outstanding <= 0)
          : data;

    return paginate(filtered, q.status ? filtered.length : total, q);
  },

  async createAccount(
    tenantId: string,
    input: {
      name: string;
      contactName?: string;
      email?: string;
      phone?: string;
      taxNumber?: string;
      billingContact?: string;
      billingEmail?: string;
      billingAddress?: string;
      creditLimit?: number;
      paymentTermsDays?: number;
      negotiatedRate?: number;
      notes?: string;
    }
  ) {
    return prisma.corporateAccount.create({
      data: {
        tenantId,
        name: input.name,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        taxNumber: input.taxNumber,
        billingContact: input.billingContact,
        billingEmail: input.billingEmail,
        billingAddress: input.billingAddress,
        creditLimit: input.creditLimit,
        paymentTermsDays: input.paymentTermsDays ?? 30,
        negotiatedRate: input.negotiatedRate,
        notes: input.notes,
      },
    });
  },

  async updateAccount(
    tenantId: string,
    id: string,
    input: Partial<{
      name: string;
      contactName: string;
      email: string;
      phone: string;
      taxNumber: string;
      billingContact: string;
      billingEmail: string;
      billingAddress: string;
      creditLimit: number | null;
      paymentTermsDays: number;
      negotiatedRate: number | null;
      notes: string;
      isActive: boolean;
    }>
  ) {
    const existing = await prisma.corporateAccount.findFirst({ where: { id, tenantId } });
    if (!existing) throw new AppError(404, 'Account not found', 'NOT_FOUND');
    return prisma.corporateAccount.update({ where: { id }, data: input });
  },

  async getAccount(tenantId: string, id: string) {
    const account = await prisma.corporateAccount.findFirst({ where: { id, tenantId } });
    if (!account) throw new AppError(404, 'Account not found', 'NOT_FOUND');

    const [invoices, payments] = await Promise.all([
      prisma.arInvoice.findMany({
        where: { corporateAccountId: id, status: { in: OPEN_STATUSES } },
        select: { total: true, amountPaid: true, dueDate: true },
      }),
      prisma.arPayment.aggregate({
        where: { corporateAccountId: id, invoiceId: null, status: 'applied' },
        _sum: { amount: true },
      }),
    ]);

    const outstanding = round2(
      invoices.reduce((s, i) => s + Number(i.total) - Number(i.amountPaid), 0) -
        Number(payments._sum.amount ?? 0)
    );
    const overdueInvoices = invoices.filter((i) => i.dueDate < startOfToday()).length;
    const creditLimit = account.creditLimit === null ? null : Number(account.creditLimit);

    return {
      ...account,
      creditLimit,
      outstanding,
      overdueInvoices,
      availableCredit: creditLimit === null ? null : round2(creditLimit - outstanding),
    };
  },

  // ─── Invoices ───

  async listInvoices(
    tenantId: string,
    q: {
      accountId?: string;
      status?: string;
      aging?: string;
      search?: string;
      from?: string;
      to?: string;
    } & PaginationInput
  ) {
    const today = startOfToday();
    const open = { status: { in: OPEN_STATUSES } };

    const agingWhere = (() => {
      switch (q.aging) {
        case 'not_due':
          return { dueDate: { gte: today } };
        case '1-30':
          return { dueDate: { gte: new Date(today.getTime() - 30 * dayMs), lt: today } };
        case '31-60':
          return {
            dueDate: {
              gte: new Date(today.getTime() - 60 * dayMs),
              lt: new Date(today.getTime() - 30 * dayMs),
            },
          };
        case '61-90':
          return {
            dueDate: {
              gte: new Date(today.getTime() - 90 * dayMs),
              lt: new Date(today.getTime() - 60 * dayMs),
            },
          };
        case '90+':
          return { dueDate: { lt: new Date(today.getTime() - 90 * dayMs) } };
        default:
          return {};
      }
    })();

    const statusWhere = (() => {
      if (!q.status || q.status === 'all') return {};
      if (q.status === 'open') return open;
      if (q.status === 'overdue') return { ...open, dueDate: { lt: today } };
      return { status: q.status };
    })();

    const where = {
      tenantId,
      ...(q.accountId ? { corporateAccountId: q.accountId } : {}),
      ...statusWhere,
      ...(q.aging ? { ...open, ...agingWhere } : {}),
      ...(q.search
        ? {
            OR: [
              { number: { contains: q.search, mode: 'insensitive' as const } },
              { corporateAccount: { name: { contains: q.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
      ...(q.from || q.to
        ? {
            issueDate: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(new Date(q.to).getTime() + dayMs - 1) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.arInvoice.findMany({
        where,
        include: { corporateAccount: { select: { id: true, name: true } } },
        orderBy: [{ issueDate: 'desc' }, { number: 'desc' }],
        ...skipTake(q),
      }),
      prisma.arInvoice.count({ where }),
    ]);

    const data = rows.map((inv) => {
      const status = deriveStatus(inv);
      const balance = round2(Number(inv.total) - Number(inv.amountPaid));
      const daysOverdue =
        status === 'overdue'
          ? Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / dayMs)
          : 0;
      return {
        ...inv,
        subtotal: Number(inv.subtotal),
        vatAmount: Number(inv.vatAmount),
        total: Number(inv.total),
        amountPaid: Number(inv.amountPaid),
        vatRate: Number(inv.vatRate),
        status,
        balance,
        daysOverdue,
      };
    });

    return paginate(data, total, q);
  },

  async createInvoice(
    tenantId: string,
    userId: string,
    input: {
      corporateAccountId: string;
      propertyId?: string;
      vatRate?: number;
      dueDate?: string;
      notes?: string;
      items: {
        description: string;
        amount: number;
        date?: string;
        folioId?: string;
        reservationId?: string;
        guestId?: string;
      }[];
    }
  ) {
    if (!input.items || input.items.length === 0) {
      throw new AppError(400, 'At least one line item is required', 'VALIDATION_ERROR');
    }

    const account = await prisma.corporateAccount.findFirst({
      where: { id: input.corporateAccountId, tenantId },
    });
    if (!account) throw new AppError(404, 'Account not found', 'NOT_FOUND');
    if (!account.isActive) {
      throw new AppError(409, 'Account is on hold — new invoices are blocked', 'ACCOUNT_ON_HOLD');
    }

    // Recompute totals server-side. Never trust client money.
    const vatRate = input.vatRate ?? 15;
    const subtotal = round2(input.items.reduce((s, i) => s + round2(i.amount), 0));
    const vatAmount = round2((subtotal * vatRate) / 100);
    const total = round2(subtotal + vatAmount);
    if (total <= 0) {
      throw new AppError(400, 'Invoice total must be greater than zero', 'VALIDATION_ERROR');
    }

    const dueDate = input.dueDate
      ? new Date(input.dueDate)
      : new Date(Date.now() + (account.paymentTermsDays || 30) * dayMs);

    const invoice = await prisma.$transaction(async (tx) => {
      const number = await nextInvoiceNumber(tx, tenantId);
      const created = await tx.arInvoice.create({
        data: {
          tenantId,
          corporateAccountId: account.id,
          propertyId: input.propertyId ?? null,
          number,
          status: 'draft',
          subtotal,
          vatRate,
          vatAmount,
          total,
          dueDate,
          notes: input.notes,
          createdById: userId,
          items: {
            create: input.items.map((i) => ({
              description: i.description,
              amount: round2(i.amount),
              vatRate,
              date: i.date ? new Date(i.date) : new Date(),
              folioId: i.folioId ?? null,
              reservationId: i.reservationId ?? null,
              guestId: i.guestId ?? null,
            })),
          },
        },
        include: { items: true, corporateAccount: { select: { id: true, name: true } } },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'create',
          entity: 'ar_invoice',
          entityId: created.id,
          propertyId: await resolveAuditPropertyId(tenantId, 'ar_invoice', created.id),
          metadata: { number: created.number, total, accountId: account.id },
        },
      });

      return created;
    });

    return {
      ...invoice,
      subtotal,
      vatAmount,
      total,
      amountPaid: 0,
      status: 'draft',
      balance: total,
    };
  },

  async getInvoice(tenantId: string, id: string) {
    const inv = await prisma.arInvoice.findFirst({
      where: { id, tenantId },
      include: {
        items: { orderBy: { date: 'asc' } },
        corporateAccount: { select: { id: true, name: true, billingEmail: true, email: true } },
        payments: {
          where: { status: 'applied' },
          orderBy: { receivedAt: 'desc' },
        },
      },
    });
    if (!inv) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');

    const status = deriveStatus(inv);
    return {
      ...inv,
      subtotal: Number(inv.subtotal),
      vatAmount: Number(inv.vatAmount),
      total: Number(inv.total),
      amountPaid: Number(inv.amountPaid),
      vatRate: Number(inv.vatRate),
      status,
      balance: round2(Number(inv.total) - Number(inv.amountPaid)),
      items: inv.items.map((i) => ({ ...i, amount: Number(i.amount), vatRate: Number(i.vatRate) })),
      payments: inv.payments.map((p) => ({ ...p, amount: Number(p.amount) })),
    };
  },

  async sendInvoice(tenantId: string, userId: string, id: string) {
    const inv = await prisma.arInvoice.findFirst({ where: { id, tenantId } });
    if (!inv) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
    if (inv.status !== 'draft') {
      throw new AppError(409, `Cannot send an invoice in status "${inv.status}"`, 'INVALID_STATE');
    }

    const updated = await prisma.arInvoice.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'send',
        entity: 'ar_invoice',
        entityId: id,
        propertyId: await resolveAuditPropertyId(tenantId, 'ar_invoice', id),
        metadata: { number: inv.number },
      },
    });

    return { ...updated, status: 'sent' };
  },

  async cancelInvoice(tenantId: string, userId: string, id: string, reason?: string) {
    const inv = await prisma.arInvoice.findFirst({ where: { id, tenantId } });
    if (!inv) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
    if (Number(inv.amountPaid) > 0) {
      throw new AppError(
        409,
        'Invoice has payments applied — reverse the payments before cancelling',
        'INVALID_STATE'
      );
    }
    if (inv.status === 'cancelled') return inv;

    const updated = await prisma.arInvoice.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason ?? null },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'cancel',
        entity: 'ar_invoice',
        entityId: id,
        propertyId: await resolveAuditPropertyId(tenantId, 'ar_invoice', id),
        metadata: { number: inv.number, reason },
      },
    });

    return updated;
  },

  // ─── Payments ───

  async recordPayment(
    tenantId: string,
    userId: string,
    input: {
      corporateAccountId: string;
      invoiceId?: string;
      amount: number;
      method?: string;
      reference?: string;
      note?: string;
      receivedAt?: string;
    }
  ) {
    const amount = round2(input.amount);
    if (amount <= 0)
      throw new AppError(400, 'Amount must be greater than zero', 'VALIDATION_ERROR');

    const account = await prisma.corporateAccount.findFirst({
      where: { id: input.corporateAccountId, tenantId },
    });
    if (!account) throw new AppError(404, 'Account not found', 'NOT_FOUND');

    // Idempotency: same tenant + reference never records twice.
    if (input.reference) {
      const dup = await prisma.arPayment.findFirst({
        where: { tenantId, reference: input.reference },
      });
      if (dup) {
        throw new AppError(
          409,
          `A payment with reference "${input.reference}" already exists`,
          'DUPLICATE_REFERENCE'
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      if (input.invoiceId) {
        const invoice = await tx.arInvoice.findFirst({
          where: { id: input.invoiceId, tenantId },
        });
        if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
        if (invoice.corporateAccountId !== account.id) {
          throw new AppError(400, 'Invoice does not belong to this account', 'VALIDATION_ERROR');
        }
        if (invoice.status === 'draft') {
          throw new AppError(409, 'Send the invoice before recording payments', 'INVALID_STATE');
        }
        if (invoice.status === 'cancelled') {
          throw new AppError(409, 'Invoice is cancelled', 'INVALID_STATE');
        }
        const outstanding = round2(Number(invoice.total) - Number(invoice.amountPaid));
        if (amount > outstanding) {
          throw new AppError(
            400,
            `Amount exceeds invoice balance (R ${outstanding.toFixed(2)})`,
            'VALIDATION_ERROR'
          );
        }

        const newPaid = round2(Number(invoice.amountPaid) + amount);
        const newStatus = newPaid >= Number(invoice.total) ? 'paid' : 'partially_paid';
        await tx.arInvoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newPaid,
            status: newStatus,
            paidAt: newStatus === 'paid' ? new Date() : invoice.paidAt,
          },
        });
      }

      const payment = await tx.arPayment.create({
        data: {
          tenantId,
          corporateAccountId: account.id,
          invoiceId: input.invoiceId ?? null,
          amount,
          method: input.method ?? 'bank_transfer',
          reference: input.reference ?? null,
          note: input.note ?? null,
          receivedById: userId,
          receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'payment',
          entity: 'ar_payment',
          entityId: payment.id,
          propertyId: await resolveAuditPropertyId(tenantId, 'ar_payment', payment.id),
          metadata: {
            amount,
            accountId: account.id,
            invoiceId: input.invoiceId ?? null,
            reference: input.reference ?? null,
          },
        },
      });

      await tx.notification.create({
        data: {
          tenantId,
          userId,
          type: 'ar_payment',
          category: 'billing',
          title: `AR payment received — ${account.name}`,
          message: `R ${amount.toFixed(2)} ${input.invoiceId ? 'applied to invoice' : 'on account'}${input.reference ? ` (ref ${input.reference})` : ''}`,
          entityType: 'ar_payment',
          entityId: payment.id,
        },
      });

      return payment;
    });
  },

  async reversePayment(tenantId: string, userId: string, id: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.arPayment.findFirst({ where: { id, tenantId } });
      if (!payment) throw new AppError(404, 'Payment not found', 'NOT_FOUND');
      if (payment.status === 'reversed') return payment;

      if (payment.invoiceId) {
        const invoice = await tx.arInvoice.findFirst({
          where: { id: payment.invoiceId, tenantId },
        });
        if (invoice) {
          const newPaid = round2(Math.max(0, Number(invoice.amountPaid) - Number(payment.amount)));
          await tx.arInvoice.update({
            where: { id: invoice.id },
            data: {
              amountPaid: newPaid,
              status: newPaid <= 0 ? 'sent' : 'partially_paid',
              paidAt: null,
            },
          });
        }
      }

      const updated = await tx.arPayment.update({
        where: { id },
        data: { status: 'reversed', reversedAt: new Date(), reversalReason: reason ?? null },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'reverse',
          entity: 'ar_payment',
          entityId: id,
          propertyId: await resolveAuditPropertyId(tenantId, 'ar_payment', id),
          metadata: { amount: Number(payment.amount), reason },
        },
      });

      return updated;
    });
  },

  async listPayments(
    tenantId: string,
    q: { accountId?: string; invoiceId?: string; status?: string } & PaginationInput
  ) {
    const where = {
      tenantId,
      ...(q.accountId ? { corporateAccountId: q.accountId } : {}),
      ...(q.invoiceId ? { invoiceId: q.invoiceId } : {}),
      ...(q.status ? { status: q.status } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.arPayment.findMany({
        where,
        include: {
          corporateAccount: { select: { id: true, name: true } },
          invoice: { select: { id: true, number: true } },
        },
        orderBy: { receivedAt: 'desc' },
        ...skipTake(q),
      }),
      prisma.arPayment.count({ where }),
    ]);

    return paginate(
      rows.map((p) => ({ ...p, amount: Number(p.amount) })),
      total,
      q
    );
  },

  // ─── Summary / Aging / Statement ───

  async summary(tenantId: string) {
    const today = startOfToday();

    const [openInvoices, paidRecent, monthAgg, collectedAgg, accounts, creditAgg] =
      await Promise.all([
        prisma.arInvoice.findMany({
          where: { tenantId, status: { in: OPEN_STATUSES } },
          select: { total: true, amountPaid: true, dueDate: true, corporateAccountId: true },
        }),
        prisma.arInvoice.findMany({
          where: { tenantId, paidAt: { gte: new Date(Date.now() - 90 * dayMs) } },
          select: { issueDate: true, paidAt: true },
        }),
        prisma.arInvoice.aggregate({
          where: {
            tenantId,
            status: { notIn: ['cancelled'] },
            issueDate: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
          },
          _sum: { total: true },
        }),
        prisma.arPayment.aggregate({
          where: {
            tenantId,
            status: 'applied',
            receivedAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
          },
          _sum: { amount: true },
        }),
        prisma.corporateAccount.count({ where: { tenantId, isActive: true } }),
        prisma.arPayment.aggregate({
          where: { tenantId, status: 'applied', invoiceId: null },
          _sum: { amount: true },
        }),
      ]);

    let outstanding = 0;
    let overdue = 0;
    let overdueCount = 0;
    const buckets = { not_due: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const byAccount = new Map<string, number>();

    for (const inv of openInvoices) {
      const balance = round2(Number(inv.total) - Number(inv.amountPaid));
      if (balance <= 0) continue;
      outstanding = round2(outstanding + balance);
      byAccount.set(
        inv.corporateAccountId,
        round2((byAccount.get(inv.corporateAccountId) ?? 0) + balance)
      );
      const daysPast = Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / dayMs);
      if (daysPast > 0) {
        overdue = round2(overdue + balance);
        overdueCount += 1;
        if (daysPast <= 30) buckets['1-30'] = round2(buckets['1-30'] + balance);
        else if (daysPast <= 60) buckets['31-60'] = round2(buckets['31-60'] + balance);
        else if (daysPast <= 90) buckets['61-90'] = round2(buckets['61-90'] + balance);
        else buckets['90+'] = round2(buckets['90+'] + balance);
      } else {
        buckets.not_due = round2(buckets.not_due + balance);
      }
    }

    const dso =
      paidRecent.length > 0
        ? Math.round(
            paidRecent.reduce(
              (s, i) =>
                s +
                (new Date(i.paidAt as unknown as string).getTime() -
                  new Date(i.issueDate).getTime()) /
                  dayMs,
              0
            ) / paidRecent.length
          )
        : 0;

    return {
      outstanding,
      overdue,
      overdueCount,
      buckets,
      openInvoiceCount: openInvoices.length,
      billedThisMonth: round2(Number(monthAgg._sum.total ?? 0)),
      collectedThisMonth: round2(Number(collectedAgg._sum.amount ?? 0)),
      onAccountCredits: round2(Number(creditAgg._sum.amount ?? 0)),
      activeAccounts: accounts,
      dso,
      topExposure: [...byAccount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([corporateAccountId, balance]) => ({ corporateAccountId, balance })),
    };
  },

  async statement(tenantId: string, accountId: string, from?: string, to?: string) {
    const account = await prisma.corporateAccount.findFirst({
      where: { id: accountId, tenantId },
    });
    if (!account) throw new AppError(404, 'Account not found', 'NOT_FOUND');

    const fromDate = from ? new Date(from) : new Date(Date.now() - 90 * dayMs);
    const toDate = to ? new Date(new Date(to).getTime() + dayMs - 1) : new Date();

    const [invoices, payments] = await Promise.all([
      prisma.arInvoice.findMany({
        where: {
          corporateAccountId: accountId,
          tenantId,
          issueDate: { gte: fromDate, lte: toDate },
          status: { notIn: ['cancelled'] },
        },
        orderBy: { issueDate: 'asc' },
      }),
      prisma.arPayment.findMany({
        where: {
          corporateAccountId: accountId,
          tenantId,
          status: 'applied',
          receivedAt: { gte: fromDate, lte: toDate },
        },
        orderBy: { receivedAt: 'asc' },
      }),
    ]);

    // Opening balance: everything before the window.
    const [priorInvoices, priorPayments] = await Promise.all([
      prisma.arInvoice.aggregate({
        where: {
          corporateAccountId: accountId,
          tenantId,
          issueDate: { lt: fromDate },
          status: { notIn: ['cancelled'] },
        },
        _sum: { total: true },
      }),
      prisma.arPayment.aggregate({
        where: {
          corporateAccountId: accountId,
          tenantId,
          status: 'applied',
          receivedAt: { lt: fromDate },
        },
        _sum: { amount: true },
      }),
    ]);

    const openingBalance = round2(
      Number(priorInvoices._sum.total ?? 0) - Number(priorPayments._sum.amount ?? 0)
    );
    const closingBalance = round2(
      openingBalance +
        invoices.reduce((s, i) => s + Number(i.total), 0) -
        payments.reduce((s, p) => s + Number(p.amount), 0)
    );

    return {
      account: { id: account.id, name: account.name },
      from: fromDate,
      to: toDate,
      openingBalance,
      closingBalance,
      invoices: invoices.map((i) => ({
        number: i.number,
        date: i.issueDate,
        dueDate: i.dueDate,
        total: Number(i.total),
        status: deriveStatus(i),
      })),
      payments: payments.map((p) => ({
        date: p.receivedAt,
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
      })),
    };
  },

  async statementCsv(tenantId: string, accountId: string, from?: string, to?: string) {
    const s = await this.statement(tenantId, accountId, from, to);
    const lines: string[] = [
      ['Statement', csvEscape(s.account.name)].join(','),
      [
        'Period',
        csvEscape(`${s.from.toISOString().slice(0, 10)} to ${s.to.toISOString().slice(0, 10)}`),
      ].join(','),
      '',
      ['Date', 'Document', 'Debit', 'Credit', 'Balance'].join(','),
      ['', 'Opening balance', '', '', s.openingBalance.toFixed(2)].join(','),
    ];
    let running = s.openingBalance;
    for (const inv of s.invoices) {
      running = round2(running + inv.total);
      lines.push(
        [
          new Date(inv.date).toISOString().slice(0, 10),
          csvEscape(`Invoice ${inv.number}`),
          inv.total.toFixed(2),
          '',
          running.toFixed(2),
        ].join(',')
      );
    }
    for (const p of s.payments) {
      running = round2(running - p.amount);
      lines.push(
        [
          new Date(p.date).toISOString().slice(0, 10),
          csvEscape(`Payment ${p.method}${p.reference ? ` (${p.reference})` : ''}`),
          '',
          p.amount.toFixed(2),
          running.toFixed(2),
        ].join(',')
      );
    }
    lines.push(['', 'Closing balance', '', '', s.closingBalance.toFixed(2)].join(','));
    return lines.join('\n');
  },

  // ─── Dunning (called by the ar job) ───

  async overdueForReminder(tenantId: string) {
    const today = startOfToday();
    const cutoff = new Date(Date.now() - 6 * dayMs); // remind at most every 6 days
    return prisma.arInvoice.findMany({
      where: {
        tenantId,
        status: { in: OPEN_STATUSES },
        dueDate: { lt: today },
        OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: cutoff } }],
      },
      include: {
        corporateAccount: { select: { name: true, billingEmail: true, email: true } },
      },
      take: 200,
    });
  },

  async markReminderSent(ids: string[]) {
    if (ids.length === 0) return;
    await prisma.arInvoice.updateMany({
      where: { id: { in: ids } },
      data: { lastReminderAt: new Date() },
    });
  },
};
