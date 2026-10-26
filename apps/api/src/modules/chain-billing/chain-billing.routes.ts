/* apps/api/src/modules/chain-billing/chain-billing.routes.ts — C5 */
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateParams } from '../../common/validate.js';
import * as service from './chain-billing.service.js';

export const chainBillingRouter = Router();
chainBillingRouter.use(authMiddleware);

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const accountParams = z.object({ accountId: z.string().min(1) });
const invoiceBody = z.object({
  periodStart: z.string().regex(dateRe),
  periodEnd: z.string().regex(dateRe),
  guestIds: z.array(z.string().min(1)).optional(),
});
const transferBody = z.object({
  fromFolioId: z.string().min(1),
  toFolioId: z.string().min(1),
  amount: z.coerce.number().positive().max(10_000_000),
  reason: z.string().max(500).optional(),
});

const tenantOf = (req: any) => req.auth?.tenantId ?? req.user?.tenantId;
const userOf = (req: any) => req.auth?.user?.id ?? req.user?.id ?? undefined;

chainBillingRouter.get('/accounts', requirePermission('ar', 'read'), async (req, res, next) => {
  try {
    res.json({ data: await service.listAccounts(tenantOf(req)) });
  } catch (err) {
    next(err);
  }
});

chainBillingRouter.get(
  '/accounts/:accountId/invoices',
  requirePermission('ar', 'read'),
  validateParams(accountParams),
  async (req, res, next) => {
    try {
      const { accountId } = req.validatedParams as any;
      res.json({ data: await service.listInvoices(tenantOf(req), accountId) });
    } catch (err) {
      next(err);
    }
  }
);

chainBillingRouter.post(
  '/accounts/:accountId/invoices',
  requirePermission('ar', 'manage'),
  validateParams(accountParams),
  validateBody(invoiceBody),
  async (req, res, next) => {
    try {
      const { accountId } = req.validatedParams as any;
      const data = await service.createConsolidatedInvoice(
        tenantOf(req),
        userOf(req),
        accountId,
        req.validatedBody as any
      );
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

chainBillingRouter.get('/folios', requirePermission('ar', 'read'), async (req, res, next) => {
  try {
    res.json({ data: await service.listFolios(tenantOf(req)) });
  } catch (err) {
    next(err);
  }
});

chainBillingRouter.post(
  '/folios/transfer',
  requirePermission('ar', 'manage'),
  validateBody(transferBody),
  async (req, res, next) => {
    try {
      res.json({ data: await service.transferFolio(tenantOf(req), req.validatedBody as any) });
    } catch (err) {
      next(err);
    }
  }
);

chainBillingRouter.get('/transfers', requirePermission('ar', 'read'), async (req, res, next) => {
  try {
    res.json({ data: await service.recentTransfers(tenantOf(req)) });
  } catch (err) {
    next(err);
  }
});
