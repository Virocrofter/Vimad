/* apps/api/src/modules/chain-billing/chain-billing.service.ts — C5
 * Chain corporate billing: group accounts with cross-property exposure,
 * consolidated month-end AR invoices, inter-property folio transfers.
 * Every posting keeps the folio invariant balance == charges − payments,
 * so both property audits stay clean. */
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

const DAY_MS = 86_400_000;
const VAT_RATE = 15;
const r2 = (n: number) => Math.round(n * 100) / 100;
const dayStart = (s: string) => new Date(`${s}T00:00:00.000Z`);
const dayEnd = (s: string) => new Date(`${s}T23:59:59.999Z`);

const FOLIO_INCLUDE = {
  reservation: {
    select: {
      id: true,
      confirmationNumber: true,
      guestId: true,
      property: { select: { id: true, name: true } },
      guest: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} as const;

function folioSummary(f: any) {
  const charges = Number(f.totalCharges);
  const payments = Number(f.totalPayments);
  const balance = Number(f.balance);
  return {
    id: f.id,
    status: f.status,
    balance: r2(balance),
    totalCharges: r2(charges),
    totalPayments: r2(payments),
    invariantOk: Math.abs(balance - (charges - payments)) <= 0.005,
    property: f.reservation.property,
    guest: f.reservation.guest,
    confirmationNumber: f.reservation.confirmationNumber,
    reservationId: f.reservation.id,
    updatedAt: f.updatedAt,
  };
}

async function accountOr404(tenantId: string, accountId: string) {
  const account = await prisma.corporateAccount.findFirst({ where: { id: accountId, tenantId } });
  if (!account) throw new AppError(404, 'Corporate account not found', 'NOT_FOUND');
  return account;
}

export async function listAccounts(tenantId: string) {
  const accounts = await prisma.corporateAccount.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' },
  });
  const out = [];
  for (const a of accounts) {
    const folios = await prisma.folio.findMany({
      where: {
        tenantId,
        status: 'open',
        balance: { gt: 0 },
        reservation: { guest: { corporateAccountId: a.id } },
      },
      include: FOLIO_INCLUDE,
    });
    const perProperty = new Map<
      string,
      { propertyId: string; propertyName: string; folioCount: number; outstanding: number }
    >();
    let outstanding = 0;
    for (const f of folios) {
      const bal = Number(f.balance);
      outstanding = r2(outstanding + bal);
      const p = f.reservation.property;
      const entry = perProperty.get(p.id) ?? {
        propertyId: p.id,
        propertyName: p.name,
        folioCount: 0,
        outstanding: 0,
      };
      entry.folioCount += 1;
      entry.outstanding = r2(entry.outstanding + bal);
      perProperty.set(p.id, entry);
    }
    out.push({
      id: a.id,
      name: a.name,
      contactName: a.contactName,
      email: a.email,
      billingEmail: a.billingEmail,
      creditLimit: a.creditLimit != null ? Number(a.creditLimit) : null,
      paymentTermsDays: a.paymentTermsDays,
      outstanding,
      folioCount: folios.length,
      perProperty: [...perProperty.values()].sort((x, y) =>
        x.propertyName.localeCompare(y.propertyName)
      ),
    });
  }
  return out;
}

export async function listFolios(tenantId: string) {
  const folios = await prisma.folio.findMany({
    where: { tenantId, status: 'open' },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: FOLIO_INCLUDE,
  });
  return folios.map(folioSummary);
}

function invoiceMapper(inv: any, propMap?: Map<string, string>) {
  const items = (inv.items ?? []).map((i: any) => ({
    id: i.id,
    description: i.description,
    amount: Number(i.amount),
    folioId: i.folioId,
    reservationId: i.reservationId,
    propertyName: (i.folioId && propMap?.get(i.folioId)) || null,
    date: i.date,
  }));
  return {
    id: inv.id,
    number: inv.number,
    status: inv.status,
    currency: inv.currency,
    subtotal: Number(inv.subtotal),
    vatAmount: Number(inv.vatAmount),
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    accountName: inv.corporateAccount?.name ?? null,
    properties: [...new Set(items.map((i: any) => i.propertyName).filter(Boolean))],
    items,
  };
}

async function attachPropertyNames(invoices: any[]) {
  const folioIds = [
    ...new Set(
      invoices.flatMap((inv) => (inv.items ?? []).map((i: any) => i.folioId).filter(Boolean))
    ),
  ];
  const folios = folioIds.length
    ? await prisma.folio.findMany({
        where: { id: { in: folioIds } },
        select: { id: true, reservation: { select: { property: { select: { name: true } } } } },
      })
    : [];
  const map = new Map(folios.map((f) => [f.id, f.reservation.property.name]));
  return invoices.map((inv) => invoiceMapper(inv, map));
}

export async function listInvoices(tenantId: string, accountId: string) {
  await accountOr404(tenantId, accountId);
  const invoices = await prisma.arInvoice.findMany({
    where: { tenantId, corporateAccountId: accountId },
    orderBy: { issueDate: 'desc' },
    take: 12,
    include: { corporateAccount: { select: { name: true } }, items: true },
  });
  return attachPropertyNames(invoices);
}

export async function createConsolidatedInvoice(
  tenantId: string,
  userId: string | undefined,
  accountId: string,
  body: { periodStart: string; periodEnd: string; guestIds?: string[] }
) {
  const account = await accountOr404(tenantId, accountId);
  const from = dayStart(body.periodStart);
  const to = dayEnd(body.periodEnd);
  if (from > to)
    throw new AppError(400, 'periodStart must be on or before periodEnd', 'VALIDATION_ERROR');

  const guests = await prisma.guest.findMany({
    where: body.guestIds?.length
      ? { tenantId, id: { in: body.guestIds } }
      : { tenantId, corporateAccountId: account.id },
    select: { id: true },
  });
  if (guests.length === 0) {
    throw new AppError(409, 'No guests are linked to this account', 'NO_GUESTS');
  }

  const folios = await prisma.folio.findMany({
    where: {
      tenantId,
      status: 'open',
      balance: { gt: 0 },
      reservation: { guestId: { in: guests.map((g) => g.id) } },
    },
    include: {
      ...FOLIO_INCLUDE,
      items: { where: { postedAt: { gte: from, lte: to } }, select: { amount: true } },
    },
  });

  const lines: { folio: (typeof folios)[number]; amount: number }[] = [];
  for (const f of folios) {
    const amount = r2(f.items.reduce((a, i) => a + Number(i.amount), 0));
    if (amount > 0) lines.push({ folio: f, amount });
  }
  if (lines.length === 0) {
    throw new AppError(
      409,
      'No open charges in the selected period for this account',
      'NOTHING_TO_INVOICE'
    );
  }

  const subtotal = r2(lines.reduce((a, l) => a + l.amount, 0));
  const vatAmount = r2((subtotal * VAT_RATE) / 100);
  const total = r2(subtotal + vatAmount);
  const dueDate = new Date(to.getTime() + account.paymentTermsDays * DAY_MS);

  const invoice = await prisma.$transaction(async (tx) => {
    const counter = await tx.arInvoiceCounter.upsert({
      where: { tenantId },
      update: { lastNumber: { increment: 1 } },
      create: { tenantId, lastNumber: 1 },
    });
    const number = `CAR-${String(counter.lastNumber).padStart(6, '0')}`;
    const inv = await tx.arInvoice.create({
      data: {
        tenantId,
        corporateAccountId: account.id,
        propertyId: null,
        number,
        status: 'sent',
        currency: 'ZAR',
        subtotal,
        vatRate: VAT_RATE,
        vatAmount,
        total,
        amountPaid: 0,
        issueDate: new Date(),
        dueDate,
        sentAt: new Date(),
        notes: `Consolidated chain billing ${body.periodStart} → ${body.periodEnd}`,
        createdById: userId ?? null,
        metadata: {
          periodStart: body.periodStart,
          periodEnd: body.periodEnd,
          source: 'chain_billing',
        },
        items: {
          create: lines.map((l) => ({
            description: `${l.folio.reservation.property.name} — ${l.folio.reservation.guest.firstName} ${l.folio.reservation.guest.lastName} — ${l.folio.reservation.confirmationNumber}`,
            folioId: l.folio.id,
            reservationId: l.folio.reservation.id,
            guestId: l.folio.reservation.guestId,
            date: to,
            amount: l.amount,
            vatRate: VAT_RATE,
          })),
        },
      },
    });
    for (const l of lines) {
      await tx.folioItem.create({
        data: {
          folioId: l.folio.id,
          type: 'ar_transfer',
          description: `Consolidated invoice ${number} — ${l.folio.reservation.property.name}`,
          amount: -l.amount,
        },
      });
      await tx.folio.update({
        where: { id: l.folio.id },
        data: { balance: { decrement: l.amount }, totalCharges: { decrement: l.amount } },
      });
    }
    return inv;
  });

  const full = await prisma.arInvoice.findFirst({
    where: { id: invoice.id },
    include: { corporateAccount: { select: { name: true } }, items: true },
  });
  return (await attachPropertyNames([full]))[0];
}

export async function transferFolio(
  tenantId: string,
  body: { fromFolioId: string; toFolioId: string; amount: number; reason?: string }
) {
  const amount = r2(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, 'amount must be a positive number', 'VALIDATION_ERROR');
  }
  const [from, to] = await Promise.all([
    prisma.folio.findFirst({ where: { id: body.fromFolioId, tenantId }, include: FOLIO_INCLUDE }),
    prisma.folio.findFirst({ where: { id: body.toFolioId, tenantId }, include: FOLIO_INCLUDE }),
  ]);
  if (!from || !to) throw new AppError(404, 'Folio not found', 'NOT_FOUND');
  if (from.id === to.id)
    throw new AppError(400, 'Cannot transfer a folio to itself', 'VALIDATION_ERROR');
  if (Number(from.balance) < amount - 0.005) {
    throw new AppError(
      409,
      'Insufficient open balance on the source folio',
      'INSUFFICIENT_BALANCE'
    );
  }
  const desc = body.reason?.trim() || 'Inter-property transfer';
  await prisma.$transaction([
    prisma.folioItem.create({
      data: {
        folioId: from.id,
        type: 'transfer_out',
        description: `Transfer to ${to.reservation.property.name} — ${desc}`,
        amount: -amount,
      },
    }),
    prisma.folioItem.create({
      data: {
        folioId: to.id,
        type: 'transfer_in',
        description: `Transfer from ${from.reservation.property.name} — ${desc}`,
        amount,
      },
    }),
    prisma.folio.update({
      where: { id: from.id },
      data: { balance: { decrement: amount }, totalCharges: { decrement: amount } },
    }),
    prisma.folio.update({
      where: { id: to.id },
      data: { balance: { increment: amount }, totalCharges: { increment: amount } },
    }),
  ]);
  const [fromAfter, toAfter] = await Promise.all([
    prisma.folio.findFirst({ where: { id: from.id }, include: FOLIO_INCLUDE }),
    prisma.folio.findFirst({ where: { id: to.id }, include: FOLIO_INCLUDE }),
  ]);
  return { from: folioSummary(fromAfter), to: folioSummary(toAfter) };
}

export async function recentTransfers(tenantId: string) {
  const items = await prisma.folioItem.findMany({
    where: { folio: { tenantId }, type: { in: ['transfer_out', 'transfer_in', 'ar_transfer'] } },
    orderBy: { postedAt: 'desc' },
    take: 25,
    include: {
      folio: {
        include: {
          reservation: {
            include: {
              property: { select: { name: true } },
              guest: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });
  return items.map((i) => ({
    id: i.id,
    type: i.type,
    description: i.description,
    amount: Number(i.amount),
    postedAt: i.postedAt,
    folioId: i.folioId,
    propertyName: i.folio.reservation.property.name,
    guestName: `${i.folio.reservation.guest.firstName} ${i.folio.reservation.guest.lastName}`,
    confirmationNumber: i.folio.reservation.confirmationNumber,
  }));
}
