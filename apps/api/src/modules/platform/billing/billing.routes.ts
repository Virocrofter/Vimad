import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../../common/errors.js';
import { requirePlatformRole, requireStepUp } from '../platform.middleware.js';
import * as svc from './billing.service.js';

export const billingRouter = Router();
const FINANCE = ['platform_super_admin', 'platform_finance'] as const;

function parseBody(schema: any, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new AppError(
      400,
      result.error.issues[0]?.message ?? 'Validation failed',
      'VALIDATION_ERROR'
    );
  return result.data;
}

const generateSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  idempotencyKey: z.string().min(3).optional(),
});
const markPaidSchema = z.object({
  reference: z.string().min(2),
  idempotencyKey: z.string().min(3).optional(),
});
const creditSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(3),
  idempotencyKey: z.string().min(3).optional(),
});

billingRouter.get(
  '/billing/dashboard',
  requirePlatformRole(...FINANCE),
  async (_req, res, next) => {
    try {
      res.json({ data: await svc.dashboard() });
    } catch (e) {
      next(e);
    }
  }
);
billingRouter.get(
  '/billing/plans',
  requirePlatformRole(...FINANCE, 'platform_support'),
  async (_req, res) => {
    res.json({ data: Object.entries(svc.PLAN_CATALOGUE).map(([code, p]) => ({ code, ...p })) });
  }
);
billingRouter.post(
  '/billing/invoices/generate',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(generateSchema, req.body ?? {});
      res.json({
        data: await svc.generateForPeriod(b.period, req.platform!.email, b.idempotencyKey),
      });
    } catch (e) {
      next(e);
    }
  }
);
billingRouter.get(
  '/billing/invoices',
  requirePlatformRole(...FINANCE, 'platform_support'),
  async (req, res, next) => {
    try {
      const q = req.query ?? {};
      res.json({
        data: await svc.listInvoices({
          status: q.status,
          tenantId: q.tenantId,
          period: q.period,
          page: q.page ? Number(q.page) : undefined,
          limit: q.limit ? Number(q.limit) : undefined,
        }),
      });
    } catch (e) {
      next(e);
    }
  }
);
billingRouter.get(
  '/billing/invoices/:id',
  requirePlatformRole(...FINANCE, 'platform_support'),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.invoiceDetail(req.params.id) });
    } catch (e) {
      next(e);
    }
  }
);
billingRouter.post(
  '/billing/invoices/:id/mark-paid',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(markPaidSchema, req.body ?? {});
      res.json({
        data: await svc.markPaid(req.params.id, b.reference, req.platform!.email, b.idempotencyKey),
      });
    } catch (e) {
      next(e);
    }
  }
);
billingRouter.post(
  '/billing/credit-notes',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(creditSchema, req.body ?? {});
      res
        .status(201)
        .json({
          data: await svc.createCreditNote({
            invoiceId: b.invoiceId,
            amount: b.amount,
            reason: b.reason,
            actorEmail: req.platform!.email,
            idempotencyKey: b.idempotencyKey,
          }),
        });
    } catch (e) {
      next(e);
    }
  }
);
billingRouter.post(
  '/billing/credit-notes/:id/apply',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      const key =
        typeof (req.body ?? {}).idempotencyKey === 'string'
          ? (req.body as any).idempotencyKey
          : undefined;
      res.json({ data: await svc.applyCreditNote(req.params.id, req.platform!.email, key) });
    } catch (e) {
      next(e);
    }
  }
);
billingRouter.get(
  '/billing/dunning',
  requirePlatformRole(...FINANCE, 'platform_support'),
  async (_req, res, next) => {
    try {
      res.json({ data: await svc.dunningQueue() });
    } catch (e) {
      next(e);
    }
  }
);
billingRouter.post(
  '/billing/dunning/:invoiceId/remind',
  requirePlatformRole(...FINANCE),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.sendReminder(req.params.invoiceId, req.platform!.email) });
    } catch (e) {
      next(e);
    }
  }
);
