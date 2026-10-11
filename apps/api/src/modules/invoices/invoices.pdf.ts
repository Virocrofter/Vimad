/* apps/api/src/modules/invoices/invoices.pdf.ts
 * [A5] PDF rendering for tax invoices, receipts & credit notes (pdfkit).
 * Credit notes render the same layout with a CREDIT NOTE header, the
 * original-invoice reference, reason line, and negative amounts.
 */
import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { prisma } from '../../common/prisma.js';

const OUT_DIR = path.join(process.cwd(), 'storage', 'invoices');
fs.mkdirSync(OUT_DIR, { recursive: true });

const money = (n: number, currency = 'ZAR') => {
  const sym = currency === 'ZAR' ? 'R' : currency === 'USD' ? '$' : `${currency} `;
  return `${sym}${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const COL = {
  brand: '#863bff',
  ink: '#1a1a2e',
  muted: '#666',
  line: '#ddd',
};

type DocType = 'tax_invoice' | 'receipt' | 'credit_note';

const TITLES: Record<DocType, string> = {
  tax_invoice: 'TAX INVOICE',
  receipt: 'RECEIPT',
  credit_note: 'CREDIT NOTE',
};

export async function renderInvoicePdf(invoiceId: string): Promise<string> {
  const invoice = await prisma.taxInvoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (!invoice) throw new Error(`invoice ${invoiceId} not found`);

  const docType = (invoice.type as DocType) ?? 'tax_invoice';
  const filePath = path.join(OUT_DIR, `${invoice.number}.pdf`);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ─── Header band ───
    doc.rect(0, 0, 595, 90).fill(COL.brand);
    doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text(TITLES[docType], 50, 32);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(invoice.propertyName, 50, 62)
      .text(invoice.propertyVatNo ? `VAT No: ${invoice.propertyVatNo}` : '', { continued: false });

    // ─── Meta block (SARS required fields) ───
    const metaTop = 120;
    doc.fillColor(COL.ink).fontSize(10);
    const meta: [string, string][] = [
      [
        docType === 'receipt'
          ? 'Receipt number'
          : docType === 'credit_note'
            ? 'Credit note number'
            : 'Invoice number',
        invoice.number,
      ],
      ['Issue date', invoice.issueDate.toISOString().slice(0, 10)],
      ['Billed to', invoice.guestName],
      ...(invoice.guestEmail ? [['Email', invoice.guestEmail] as [string, string]] : []),
      ['Currency', invoice.currency],
      ...(docType === 'credit_note' && invoice.originalNumber
        ? [['Credited invoice', invoice.originalNumber] as [string, string]]
        : []),
    ];
    meta.forEach(([k, v], i) => {
      doc.font('Helvetica-Bold').text(k, 50, metaTop + i * 16, { width: 110 });
      doc.font('Helvetica').text(v, 165, metaTop + i * 16);
    });

    // ─── Reason line (credit notes — SARS requires it) ───
    let y = metaTop + meta.length * 16 + 8;
    if (docType === 'credit_note' && invoice.reason) {
      doc.font('Helvetica-Bold').text('Reason:', 50, y, { width: 110 });
      doc.font('Helvetica').text(invoice.reason, 165, y, { width: 380 });
      y += Math.max(16, doc.heightOfString(invoice.reason, { width: 380 }) + 6);
    }

    // ─── Line items ───
    y += 16;
    doc
      .font('Helvetica-Bold')
      .fillColor(COL.muted)
      .fontSize(9)
      .text('DESCRIPTION', 50, y)
      .text('QTY', 300, y)
      .text('UNIT PRICE (EX VAT)', 340, y, { width: 110, align: 'right' })
      .text('AMOUNT (EX VAT)', 455, y, { width: 90, align: 'right' });
    y += 6;
    doc.moveTo(50, y).lineTo(545, y).strokeColor(COL.line).stroke();
    y += 14;

    doc.fillColor(COL.ink).fontSize(10);
    for (const item of invoice.items) {
      doc.font('Helvetica').text(item.description, 50, y, { width: 240 });
      doc.text(Number(item.quantity).toString(), 300, y);
      doc.text(money(Number(item.unitPriceEx), invoice.currency), 340, y, {
        width: 110,
        align: 'right',
      });
      doc.text(money(Number(item.amountEx), invoice.currency), 455, y, {
        width: 90,
        align: 'right',
      });
      y += Math.max(18, doc.heightOfString(item.description, { width: 240 }) + 6);
    }

    // ─── Totals ───
    y += 12;
    doc.moveTo(340, y).lineTo(545, y).strokeColor(COL.line).stroke();
    y += 12;
    const row = (label: string, value: string, bold = false) => {
      doc
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10)
        .fillColor(COL.ink)
        .text(label, 340, y, { width: 115, align: 'right' })
        .text(value, 455, y, { width: 90, align: 'right' });
      y += 18;
    };
    row('Subtotal (ex VAT)', money(Number(invoice.subtotalExVat), invoice.currency));
    row(`VAT @ ${Number(invoice.vatRate)}%`, money(Number(invoice.vatAmount), invoice.currency));
    row('Total (incl VAT)', money(Number(invoice.totalInclVat), invoice.currency), true);
    if (docType === 'receipt' || Number(invoice.amountPaid) > 0) {
      row('Amount paid', money(Number(invoice.amountPaid), invoice.currency));
      row(
        'Balance due',
        money(
          Math.max(0, Number(invoice.totalInclVat) - Number(invoice.amountPaid)),
          invoice.currency
        ),
        true
      );
    }

    doc
      .fontSize(8)
      .fillColor(COL.muted)
      .text(
        docType === 'credit_note'
          ? 'This credit note is a computer-generated tax document and requires no signature. It offsets the referenced invoice.'
          : 'This document is a computer-generated tax invoice and requires no signature.',
        50,
        780,
        { width: 495, align: 'center' }
      );

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  await prisma.taxInvoice.update({ where: { id: invoice.id }, data: { pdfPath: filePath } });
  return filePath;
}
