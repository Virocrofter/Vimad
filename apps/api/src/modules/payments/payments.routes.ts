/* apps/api/src/modules/payments/payments.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import { env } from '../../common/env.js';
import {
  initializePaymentSchema,
  chargeSavedCardSchema,
  refundPaymentSchema,
  vccChargeSchema,
  listPaymentsQuerySchema,
  initializePayment,
  verifyPaymentByReference,
  chargeSavedCard,
  refundPayment,
  recordVccCharge,
  listPayments,
  listGuestPaymentMethods,
  deactivatePaymentMethod,
} from './payments.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();
export const paymentsRouter = Router();

const ReferenceParamSchema = z.object({ reference: z.string() });
const IdParamSchema = z.object({ id: z.string() });

// Public config for the Paystack popup (publishable key only) — must be
// registered BEFORE the auth middleware so an unauthenticated client (the
// checkout popup on the payments page) can fetch it.
paymentsRouter.get('/config', (_req: Request, res: Response) => {
  res.json({
    data: {
      publicKey: env.PAYSTACK_PUBLIC_KEY ?? null,
      currency: env.PAYSTACK_CURRENCY,
      configured: Boolean(env.PAYSTACK_SECRET_KEY),
    },
  });
});

paymentsRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/v1/payments',
  tags: ['Payments'],
  responses: { 200: { description: 'Payment list' } },
});
paymentsRouter.get(
  '/',
  requirePermission('folio', 'read'),
  validateQuery(listPaymentsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listPayments(req.tenantId, req.validatedQuery as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/v1/payments/initialize',
  tags: ['Payments'],
  responses: {
    200: { description: 'Checkout URL created' },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
paymentsRouter.post(
  '/initialize',
  requirePermission('folio', 'payment'),
  validateBody(initializePaymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await initializePayment(
        req.tenantId,
        (req as any).auth.user.id,
        req.validatedBody as z.infer<typeof initializePaymentSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/v1/payments/verify/{reference}',
  tags: ['Payments'],
  request: { params: ReferenceParamSchema },
  responses: {
    200: { description: 'Verified payment' },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
paymentsRouter.get(
  '/verify/:reference',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await verifyPaymentByReference(req.tenantId, req.params.reference);
      res.json({ data: payment });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/v1/payments/charge',
  tags: ['Payments'],
  responses: {
    200: { description: 'Charge result' },
    404: {
      description: 'Card not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
paymentsRouter.post(
  '/charge',
  requirePermission('folio', 'payment'),
  validateBody(chargeSavedCardSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await chargeSavedCard(
        req.tenantId,
        (req as any).auth.user.id,
        req.validatedBody as z.infer<typeof chargeSavedCardSchema>
      );
      res.json({ data: payment });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/v1/payments/{id}/refund',
  tags: ['Payments'],
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Refunded' },
    409: {
      description: 'Not refundable',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
paymentsRouter.post(
  '/:id/refund',
  requirePermission('folio', 'refund'),
  validateBody(refundPaymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await refundPayment(
        req.tenantId,
        (req as any).auth.user.id,
        req.params.id,
        req.validatedBody as z.infer<typeof refundPaymentSchema>
      );
      res.json({ data: payment });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/v1/payments/vcc-charge',
  tags: ['Payments'],
  responses: { 201: { description: 'VCC capture recorded' } },
});
paymentsRouter.post(
  '/vcc-charge',
  requirePermission('folio', 'payment'),
  validateBody(vccChargeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await recordVccCharge(
        req.tenantId,
        (req as any).auth.user.id,
        req.validatedBody as z.infer<typeof vccChargeSchema>
      );
      res.status(201).json({ data: payment });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/v1/payments/guests/{guestId}/methods',
  tags: ['Payments'],
  request: { params: z.object({ guestId: z.string() }) },
  responses: { 200: { description: 'Saved payment methods for the guest' } },
});
paymentsRouter.get(
  '/guests/:guestId/methods',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await listGuestPaymentMethods(req.tenantId, req.params.guestId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'delete',
  path: '/v1/payments/methods/{id}',
  tags: ['Payments'],
  request: { params: IdParamSchema },
  responses: { 204: { description: 'Payment method deactivated' } },
});
paymentsRouter.delete(
  '/methods/:id',
  requirePermission('folio', 'payment'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deactivatePaymentMethod(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
