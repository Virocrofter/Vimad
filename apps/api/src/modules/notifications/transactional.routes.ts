/* apps/api/src/modules/notifications/transactional.routes.ts
 * A3 — email center API: log viewer, resend, manual triggers.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import {
  sendReservationConfirmation,
  sendPreArrival,
  sendFolioEmail,
  listEmailLogs,
  resendEmailLog,
} from './transactional.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();
export const transactionalEmailRouter = Router();

transactionalEmailRouter.use(authMiddleware, tenantScope);

const IdParamSchema = z.object({ id: z.string() });

const listQuerySchema = z.object({
  status: z.enum(['queued', 'sent', 'failed']).optional(),
  template: z
    .enum([
      'reservation-confirmation',
      'pre-arrival',
      'payment-receipt',
      'folio-email',
      'payment-request',
      'welcome',
      'password-reset',
      'invoice',
      'maintenance',
      'generic',
    ])
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});

/* ─── GET /email-logs — Email Center table ─── */
registry.registerPath({
  method: 'get',
  path: '/v1/communications/email-logs',
  tags: ['Communications'],
  responses: { 200: { description: 'Paginated email log' } },
});
transactionalEmailRouter.get(
  '/email-logs',
  requirePermission('folio', 'read'),
  validateQuery(listQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listEmailLogs(req.tenantId, req.validatedQuery as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /email-logs/:id/resend ─── */
registry.registerPath({
  method: 'post',
  path: '/v1/communications/email-logs/{id}/resend',
  tags: ['Communications'],
  request: { params: IdParamSchema },
  responses: { 200: { description: 'Log entry re-queued for sending' } },
});
transactionalEmailRouter.post(
  '/email-logs/:id/resend',
  requirePermission('folio', 'payment'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await resendEmailLog(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /send/confirmation — manual/resend confirmation ─── */
registry.registerPath({
  method: 'post',
  path: '/v1/communications/send/confirmation',
  tags: ['Communications'],
  responses: { 200: { description: 'Confirmation email queued' } },
});
transactionalEmailRouter.post(
  '/send/confirmation',
  requirePermission('folio', 'payment'),
  validateBody(z.object({ reservationId: z.string().min(1), force: z.boolean().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reservationId, force } = req.validatedBody as {
        reservationId: string;
        force?: boolean;
      };
      const result = await sendReservationConfirmation(req.tenantId, reservationId, { force });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /send/pre-arrival — manual pre-arrival (ignores the 24h window) ─── */
registry.registerPath({
  method: 'post',
  path: '/v1/communications/send/pre-arrival',
  tags: ['Communications'],
  responses: { 200: { description: 'Pre-arrival email queued' } },
});
transactionalEmailRouter.post(
  '/send/pre-arrival',
  requirePermission('folio', 'payment'),
  validateBody(z.object({ reservationId: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reservationId } = req.validatedBody as { reservationId: string };
      const result = await sendPreArrival(req.tenantId, reservationId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /send/folio — email folio to guest (or override recipient) ─── */
registry.registerPath({
  method: 'post',
  path: '/v1/communications/send/folio',
  tags: ['Communications'],
  responses: { 200: { description: 'Folio email queued' } },
});
transactionalEmailRouter.post(
  '/send/folio',
  requirePermission('folio', 'payment'),
  validateBody(z.object({ reservationId: z.string().min(1), to: z.string().email().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reservationId, to } = req.validatedBody as { reservationId: string; to?: string };
      const result = await sendFolioEmail(req.tenantId, reservationId, to);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
