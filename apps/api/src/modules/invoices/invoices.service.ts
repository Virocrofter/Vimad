/* apps/api/src/modules/invoices/invoices.service.ts
 * [A5] SARS-compliant tax invoices, receipts & credit notes.
 * Conventions:
 *  - PMS prices are VAT-INCLUSIVE; VAT is extracted per line (incl / 1.15,
 *    rounded half-up) and lines are summed. Consistent line-level rounding.
 *  - Header derives from the GROSS charged; VAT is the balancing figure, so
 *    subtotalEx + vat = totalIncl ties to the cent. Line-level ex-VAT rounding
 *    drift is absorbed by the last line so lines sum to the subtotal.
 *  - Numbers are sequential per tenant via an atomic counter upsert,
 *    e.g. INV-000042 / RCP-000042 / CN-000042. Unique (tenantId, number).
 *  - Issued documents are immutable snapshots. Corrections = credit notes,
 *    never edits. Credit notes store NEGATIVE amounts and reference the
 *    original invoice (originalId + originalNumber snapshot).
 */
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { sendEmail } from '../../jobs/email.queue.js';
import { renderInvoicePdf } from './invoices.pdf.js';

const VAT_RATE = 0.15;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const exclFromIncl = (incl: number) => round2(incl / (1 + VAT_RATE)); // SA: VAT-inclusive rack rates

const money = (major: number, currency = 'ZAR') => {
  const sym = currency === 'ZAR' ? 'R' : currency === 'USD' ? '$' : `${currency} `;
  return `${sym}${major.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const issueInvoiceSchema = z.object({
  folioId: z.string().min(1),
  send: z.coerce.boolean().default(false), // also email it to the guest
});

export const issueCreditNoteSchema = z.object({
  reason: z.string().min(3, 'SARS requires a reason on a credit note').max(500),
  applyToFolio: z.coerce.boolean().default(false), // post a negative folio line
  send: z.coerce.boolean().default(false),
});

// ─── Sequential numbering (atomic — safe under concurrent requests) ───

async function nextNumber(tenantId: string, prefix: 'INV' | 'RCP' | 'CN') {
  const counter = await prisma.invoiceCounter.upsert({
    where: { tenantId },
    update: { lastNumber: { increment: 1 } },
    create: { tenantId, lastNumber: 1 },
  });
  return `${prefix}-${String(counter.lastNumber).padStart(6, '0')}`;
}

// ─── Issue a tax invoice from a folio ───

export async function issueTaxInvoice(tenantId: string, input: z.infer<typeof issueInvoiceSchema>) {
  const folio = await prisma.folio.findFirst({
    where: { id: input.folioId, tenantId },
    include: {
      reservation: { include: { property: true, guest: true } },
      items: true,
    },
  });
  if (!folio) throw new AppError(404, 'Folio not found', 'NOT_FOUND');
  const { reservation } = folio;
  if (!reservation) throw new AppError(400, 'Folio has no reservation', 'VALIDATION_ERROR');
  const { property, guest } = reservation;

  // Idempotency: one open tax invoice per folio. Re-calling returns it.
  const existing = await prisma.taxInvoice.findFirst({
    where: { folioId: folio.id, tenantId, type: 'tax_invoice', status: { not: 'cancelled' } },
  });
  if (existing) return existing;

  // Charges only — payments/refunds are money-in/out, not sale lines
  const rawCharges = folio.items.filter(
    (i) => i.type !== 'payment' && i.type !== 'refund' && i.type !== 'credit'
  );
  if (rawCharges.length === 0) {
    throw new AppError(400, 'Folio has no charges to invoice', 'VALIDATION_ERROR');
  }

  // Header derives from the GROSS charged — VAT is the balancing figure, so
  // subtotalEx + vat = totalIncl always ties to the cent. Line-level ex-VAT
  // rounding drift is absorbed by the last line so lines sum to the subtotal.
  const gross = round2(rawCharges.reduce((s, c) => s + round2(Number(c.amount)), 0));
  const subtotalExVat = exclFromIncl(gross);
  const vatAmount = round2(gross - subtotalExVat);
  const totalInclVat = gross;

  let runningEx = 0;
  const items = rawCharges.map((c, idx) => {
    const incl = round2(Number(c.amount));
    let ex = exclFromIncl(incl);
    if (idx === rawCharges.length - 1) ex = round2(subtotalExVat - runningEx);
    runningEx = round2(runningEx + ex);
    const qty = Number(c.quantity) || 1;
    return {
      description: c.description || 'Accommodation',
      quantity: qty,
      unitPriceEx: round2(ex / qty),
      vatRate: 15,
      amountEx: ex,
    };
  });

  const folioBalance = Number(folio.balance);
  const amountPaid = round2(Number(folio.totalPayments));
  const status = folioBalance <= 0 ? 'paid' : amountPaid > 0 ? 'partially_paid' : 'open';
  const number = await nextNumber(tenantId, 'INV');

  const invoice = await prisma.taxInvoice.create({
    data: {
      tenantId,
      propertyId: property.id,
      folioId: folio.id,
      reservationId: reservation.id,
      guestId: guest?.id,
      number,
      type: 'tax_invoice',
      status,
      currency: property.currency ?? 'ZAR',
      subtotalExVat,
      vatAmount,
      totalInclVat,
      amountPaid,
      propertyName: property.name,
      propertyVatNo: (property as { vatNumber?: string | null }).vatNumber ?? null,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
      guestEmail: guest?.email ?? null,
      items: { create: items },
    },
    include: { items: true },
  });

  await renderInvoicePdf(invoice.id);

  if (input.send && invoice.guestEmail) {
    await sendInvoiceEmail(invoice.id);
  }

  logger.info({ invoiceId: invoice.id, number }, 'tax invoice issued');
  return invoice;
}

// ─── Receipt: issued from a payment via the A1 chokepoint ───

export async function recordReceipt(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { reservation: { include: { property: true, guest: true } } },
  });
  if (!payment || payment.status !== 'success') return;
  const { reservation } = payment;
  if (!reservation) return;

  // Idempotent: exactly one receipt per payment (paymentId is unique)
  const existing = await prisma.taxInvoice.findUnique({ where: { paymentId } });
  if (existing) return existing;

  const amountIncl = round2(Number(payment.amountMinor) / 100);
  const ex = exclFromIncl(amountIncl);
  const receiptVat = round2(amountIncl - ex); // balancing figure — ties to the cent
  const number = await nextNumber(payment.tenantId, 'RCP');

  const receipt = await prisma.taxInvoice.create({
    data: {
      tenantId: payment.tenantId,
      propertyId: reservation.propertyId,
      folioId: payment.folioId,
      reservationId: reservation.id,
      guestId: reservation.guestId ?? payment.guestId,
      paymentId,
      number,
      type: 'receipt',
      status: 'paid',
      currency: reservation.property.currency ?? 'ZAR',
      subtotalExVat: ex,
      vatAmount: receiptVat,
      totalInclVat: amountIncl,
      amountPaid: amountIncl,
      propertyName: reservation.property.name,
      propertyVatNo: (reservation.property as { vatNumber?: string | null }).vatNumber ?? null,
      guestName: reservation.guest
        ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
        : 'Guest',
      guestEmail: reservation.guest?.email ?? null,
      items: {
        create: [
          {
            description: `Payment received — ${payment.type} (${payment.reference})`,
            quantity: 1,
            unitPriceEx: ex,
            vatRate: 15,
            amountEx: ex,
          },
        ],
      },
    },
    include: { items: true },
  });

  await renderInvoicePdf(receipt.id);
  if (receipt.guestEmail) {
    await sendInvoiceEmail(receipt.id).catch((err) =>
      logger.warn({ err, receiptId: receipt.id }, 'receipt email failed')
    );
  }
  logger.info({ receiptId: receipt.id, number }, 'receipt issued');
  return receipt;
}

// ─── Credit note: full-credit reversal of a tax invoice ───

export async function issueCreditNote(
  tenantId: string,
  invoiceId: string,
  input: z.infer<typeof issueCreditNoteSchema>
) {
  const original = await prisma.taxInvoice.findFirst({
    where: { id: invoiceId, tenantId },
    include: { items: true },
  });
  if (!original) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  if (original.type !== 'tax_invoice') {
    throw new AppError(400, 'Only tax invoices can be credited', 'VALIDATION_ERROR');
  }
  if (original.status === 'cancelled') {
    throw new AppError(409, 'Invoice already cancelled — see its credit note', 'CONFLICT');
  }

  // Idempotency: one live credit note per invoice. Re-calling returns it.
  const existing = await prisma.taxInvoice.findFirst({
    where: { originalId: original.id, type: 'credit_note', status: { not: 'cancelled' } },
  });
  if (existing) return existing;

  const number = await nextNumber(tenantId, 'CN');
  const totalIncl = Number(original.totalInclVat);

  // Full credit: every stored line is negated, so the document ties exactly.
  // Original stored lines already reconcile (last-line absorb), so negation
  // keeps subtotalEx + vat = totalIncl to the cent on the credit side.
  const items = original.items.map((it) => ({
    description: it.description,
    quantity: Number(it.quantity),
    unitPriceEx: -Number(it.unitPriceEx),
    vatRate: Number(it.vatRate),
    amountEx: -Number(it.amountEx),
  }));

  const creditNote = await prisma.$transaction(async (tx) => {
    const cn = await tx.taxInvoice.create({
      data: {
        tenantId,
        propertyId: original.propertyId,
        folioId: original.folioId,
        reservationId: original.reservationId,
        guestId: original.guestId,
        originalId: original.id,
        originalNumber: original.number,
        reason: input.reason,
        number,
        type: 'credit_note',
        status: 'paid', // a credit note needs no settlement — it IS the settlement
        currency: original.currency,
        subtotalExVat: -Number(original.subtotalExVat),
        vatAmount: -Number(original.vatAmount),
        totalInclVat: -totalIncl,
        amountPaid: 0,
        propertyName: original.propertyName,
        propertyVatNo: original.propertyVatNo,
        guestName: original.guestName,
        guestEmail: original.guestEmail,
        items: { create: items },
      },
      include: { items: true },
    });

    // Full credit cancels the original — SARS wants the offsetting trail.
    await tx.taxInvoice.update({
      where: { id: original.id },
      data: { status: 'cancelled' },
    });

    if (input.applyToFolio && original.folioId) {
      await tx.folioItem.create({
        data: {
          folioId: original.folioId,
          type: 'credit',
          description: `Credit note ${number} for ${original.number}: ${input.reason}`,
          amount: -totalIncl,
          quantity: 1,
        },
      });
      await tx.folio.update({
        where: { id: original.folioId },
        data: {
          totalCharges: { decrement: totalIncl },
          balance: { decrement: totalIncl },
        },
      });
    }

    return cn;
  });

  await renderInvoicePdf(creditNote.id);

  if (input.send && creditNote.guestEmail) {
    await sendInvoiceEmail(creditNote.id).catch((err) =>
      logger.warn({ err, creditNoteId: creditNote.id }, 'credit note email failed')
    );
  }

  logger.info(
    {
      creditNoteId: creditNote.id,
      number,
      originalNumber: original.number,
      applyToFolio: input.applyToFolio,
    },
    'credit note issued'
  );
  return creditNote;
}

// ─── Read / list / email ───

export async function getInvoice(tenantId: string, id: string) {
  const invoice = await prisma.taxInvoice.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  return invoice;
}

export async function listInvoices(
  tenantId: string,
  query: { folioId?: string; reservationId?: string; type?: string }
) {
  return prisma.taxInvoice.findMany({
    where: { tenantId, ...query },
    include: { items: true },
    orderBy: { issueDate: 'desc' },
    take: 100,
  });
}

export async function sendInvoiceEmail(invoiceId: string) {
  const invoice = await prisma.taxInvoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (!invoice) throw new AppError(404, 'Invoice not found', 'NOT_FOUND');
  if (!invoice.guestEmail)
    throw new AppError(400, 'Invoice has no guest email', 'VALIDATION_ERROR');

  const template =
    invoice.type === 'receipt'
      ? 'receipt'
      : invoice.type === 'credit_note'
        ? 'credit-note'
        : 'tax-invoice';
  const subjectPrefix =
    invoice.type === 'receipt'
      ? 'Receipt'
      : invoice.type === 'credit_note'
        ? 'Credit Note'
        : 'Tax Invoice';

  await sendEmail({
    to: invoice.guestEmail,
    subject: `${subjectPrefix} ${invoice.number} — ${invoice.propertyName}`,
    template,
    payload: {
      guestName: invoice.guestName,
      propertyName: invoice.propertyName,
      number: invoice.number,
      originalNumber: invoice.originalNumber,
      reason: invoice.reason,
      issueDate: invoice.issueDate.toISOString().slice(0, 10),
      totalLabel: money(Number(invoice.totalInclVat), invoice.currency),
      balanceLabel: money(
        Math.max(0, Number(invoice.totalInclVat) - Number(invoice.amountPaid)),
        invoice.currency
      ),
      pdfPath: invoice.pdfPath,
    },
    tenantId: invoice.tenantId,
    relatedType: 'invoice',
    relatedId: invoice.id,
  });

  await prisma.taxInvoice.update({ where: { id: invoice.id }, data: { sentAt: new Date() } });
}

// ─── PDF download ───

export async function getInvoicePdfPath(tenantId: string, id: string) {
  const invoice = await getInvoice(tenantId, id);
  if (!invoice.pdfPath) {
    await renderInvoicePdf(invoice.id);
  }
  const fresh = await prisma.taxInvoice.findUnique({ where: { id } });
  return { path: fresh!.pdfPath!, number: invoice.number, type: invoice.type };
}
