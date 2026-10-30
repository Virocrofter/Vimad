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
