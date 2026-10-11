/* apps/api/src/modules/payments/payment-requests.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  authMiddleware,
  tenantScope,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  createPaymentRequestSchema,
  listPaymentRequestsQuerySchema,
  createPaymentRequest,
  listPaymentRequests,
  getPaymentRequest,
  getPaymentRequestSummary,
  sendPaymentRequest,
  cancelPaymentRequest,
} from './payment-requests.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();
export const paymentRequestsRouter = Router();

const IdParamSchema = z.object({ id: z.string() });

paymentRequestsRouter.use(authMiddleware, tenantScope);

/* ─── GET / — list (filters: status, reservationId, search) ─── */
registry.registerPath({
  method: 'get',
  path: '/v1/payment-requests',
  tags: ['Payment Requests'],
  responses: { 200: { description: 'Payment request list' } },
});
paymentRequestsRouter.get(
  '/',
  requirePermission('folio', 'read'),
  validateQuery(listPaymentRequestsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listPaymentRequests(req.tenantId, req.validatedQuery as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /summary — dashboard stat cards ─── */
registry.registerPath({
  method: 'get',
  path: '/v1/payment-requests/summary',
  tags: ['Payment Requests'],
  responses: { 200: { description: 'Aggregated payment-request stats' } },
});
paymentRequestsRouter.get(
  '/summary',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getPaymentRequestSummary(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST / — create + email pay-now link ─── */
registry.registerPath({
  method: 'post',
  path: '/v1/payment-requests',
  tags: ['Payment Requests'],
  responses: {
    201: { description: 'Payment request created and emailed' },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
paymentRequestsRouter.post(
  '/',
  requirePermission('folio', 'payment'),
  validateBody(createPaymentRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await createPaymentRequest(
        req.tenantId,
        authReq.auth.user.id,
        req.validatedBody as z.infer<typeof createPaymentRequestSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /:id ─── */
registry.registerPath({
  method: 'get',
  path: '/v1/payment-requests/{id}',
  tags: ['Payment Requests'],
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Payment request detail' },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
paymentRequestsRouter.get(
  '/:id',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getPaymentRequest(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /:id/send — resend / manual reminder ─── */
registry.registerPath({
  method: 'post',
  path: '/v1/payment-requests/{id}/send',
  tags: ['Payment Requests'],
  request: { params: IdParamSchema },
  responses: { 200: { description: 'Payment request sent / reminder emailed' } },
});
paymentRequestsRouter.post(
  '/:id/send',
  requirePermission('folio', 'payment'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sendPaymentRequest(req.tenantId, req.params.id, {
        force: req.body?.force === true,
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /:id/cancel ─── */
registry.registerPath({
  method: 'post',
  path: '/v1/payment-requests/{id}/cancel',
  tags: ['Payment Requests'],
  request: { params: IdParamSchema },
  responses: { 200: { description: 'Payment request cancelled' } },
});
paymentRequestsRouter.post(
  '/:id/cancel',
  requirePermission('folio', 'payment'),
  validateBody(z.object({ note: z.string().max(300).optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await cancelPaymentRequest(
        req.tenantId,
        req.params.id,
        (req.validatedBody as { note?: string }).note
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
