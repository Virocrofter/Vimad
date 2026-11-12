/* apps/api/src/modules/guest-portal/guest-billing.routes.ts — G1b
 * Guest-facing billing: folio (balance, lines, payments) and tax-invoice
 * detail. Guest-safe projection — no internal folio flags, no staff notes.
 * Portal-token auth; mounted BEFORE the main portal router.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validateBody } from '../../common/validate.js';
import {
  getGuestFolio,
  getGuestInvoice,
  getGuestPreferences,
  getGuestDocuments,
  addGuestDocument,
  addDocumentSchema,
} from './guest-portal.service.js';
import PDFDocument from 'pdfkit';

export const guestBillingRouter = Router();

const TokenParamsSchema = z.object({ token: z.string() });
const InvoiceParamsSchema = z.object({ token: z.string(), invoiceId: z.string() });

guestBillingRouter.get('/folio/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = TokenParamsSchema.parse(req.params);
    const data = await getGuestFolio(token);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

guestBillingRouter.get(
  '/invoice/:token/:invoiceId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, invoiceId } = InvoiceParamsSchema.parse(req.params);
      const data = await getGuestInvoice(token, invoiceId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

guestBillingRouter.get(
  '/preferences/:token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = TokenParamsSchema.parse(req.params);
      const data = await getGuestPreferences(token);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

guestBillingRouter.get(
  '/documents/:token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = TokenParamsSchema.parse(req.params);
      const data = await getGuestDocuments(token);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

guestBillingRouter.post(
  '/documents',
  validateBody(addDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await addGuestDocument(req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);
// Guest tax-invoice PDF — same data as the JSON route above, streamed via
// pdfkit (pattern: modules/invoices/invoices.pdf.ts). Token-in-path, the
// house guest-portal convention.
guestBillingRouter.get(
  '/invoice/:token/:invoiceId/pdf',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, invoiceId } = InvoiceParamsSchema.parse(req.params);
      const invoice = await getGuestInvoice(token, invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'invoice not found' } });
      }
      const inv: any = invoice;
      const items: any[] = inv.items ?? [];
      const cur = inv.currency ?? 'ZAR';
      const fmt = (n: any) => `${cur} ${Number(n ?? 0).toFixed(2)}`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="invoice-${inv.number ?? invoiceId}.pdf"`
      );
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.pipe(res);

      doc.fontSize(18).text('TAX INVOICE', { continued: false });
      doc.moveDown(0.3);
      doc
        .fontSize(11)
        .text(
          `Invoice ${inv.number ?? ''}  ·  ${new Date(inv.issueDate ?? Date.now()).toISOString().slice(0, 10)}`
        );
      doc.moveDown();
      doc.fontSize(10).text(String(inv.propertyName ?? ''));
      if (inv.propertyVatNo) doc.text(`VAT no: ${inv.propertyVatNo}`);
      doc.moveDown();
      doc.text(`Bill to: ${inv.guestName ?? ''}`);
      if (inv.guestEmail) doc.text(inv.guestEmail);
      doc.moveDown();

      doc.fontSize(10).text('Description', { continued: true, width: 300 });
      doc.text('  Qty      Unit ex      Amount ex', { align: 'right' });
      doc.moveDown(0.3);
      items.forEach((it: any) => {
        doc
          .text(String(it.description ?? 'Item'), { continued: true, width: 300 })
          .text(`  ${Number(it.quantity ?? 1)}  ${fmt(it.unitPriceEx)}  ${fmt(it.amountEx)}`, {
            align: 'right',
          });
      });
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`Subtotal (ex VAT): ${fmt(inv.subtotalExVat)}`);
      doc.text(`VAT (${Number(inv.vatRate ?? 15)}%): ${fmt(inv.vatAmount)}`);
      doc.fontSize(11).text(`Total (incl VAT): ${fmt(inv.totalInclVat)}`);
      doc.moveDown(0.3);
      doc.fontSize(10);
      doc.text(`Amount paid: ${fmt(inv.amountPaid)}`);
      doc
        .fontSize(11)
        .text(`Balance due: ${fmt(Number(inv.totalInclVat ?? 0) - Number(inv.amountPaid ?? 0))}`);

      doc.end();
    } catch (err) {
      return next(err);
    }
  }
);
