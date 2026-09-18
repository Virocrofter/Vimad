import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  ErrorResponseSchema,
  IdParamSchema,
  PaginatedResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  createFolio,
  deleteFolio,
  getFolio,
  listFolios,
  postCharge,
  postPayment,
  reverseCharge,
  transferToCityLedger,
  folioCreateSchema,
  chargeSchema,
  paymentSchema,
  type FolioCreateInput,
} from './folios.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const folioQuerySchema = paginationSchema
  .extend({
    reservationId: z.string().optional(),
    status: z.enum(['open', 'closed', 'transferred']).optional(),
  })
  .openapi('FolioQuery');
const FolioCreateInputSchema = folioCreateSchema.openapi('FolioCreateInput');
const ChargeInputSchema = chargeSchema.openapi('ChargeInput');
const PaymentInputSchema = paymentSchema.openapi('PaymentInput');
const ReverseChargeInputSchema = z.object({ reason: z.string() }).openapi('ReverseChargeInput');

const FolioItemSchema = z
  .object({
    id: z.string(),
    reservationId: z.string(),
    type: z.enum(['guest', 'master', 'split']),
    status: z.enum(['open', 'closed', 'transferred']),
    totalCharges: z.number(),
    totalPayments: z.number(),
    balance: z.number(),
    name: z.string().optional(),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('FolioItem');

const FolioItemDetailSchema = FolioItemSchema.extend({
  items: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        description: z.string(),
        amount: z.number(),
        quantity: z.number().int(),
        postedAt: z.date().or(z.string()),
      })
    )
    .optional(),
}).openapi('FolioItemDetail');

const FolioResponseSchema = z.object({ data: FolioItemDetailSchema }).openapi('FolioResponse');
const FolioListResponseSchema =
  PaginatedResponseSchema(FolioItemSchema).openapi('FolioListResponse');

const FolioTransactionItemSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    description: z.string(),
    amount: z.number(),
    quantity: z.number().int(),
    postedAt: z.date().or(z.string()),
  })
  .openapi('FolioTransactionItem');

const FolioTransactionResponseSchema = z
  .object({ data: FolioTransactionItemSchema })
  .openapi('FolioTransactionResponse');

const FolioIdChargeIdParamSchema = z
  .object({ id: z.string(), chargeId: z.string() })
  .openapi('FolioIdChargeIdParam');

export const foliosRouter = Router();

foliosRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Folios'],
  description: 'List folios',
  request: {
    query: folioQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of folios',
      content: { 'application/json': { schema: FolioListResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

foliosRouter.get(
  '/',
  requirePermission('folio', 'read'),
  validateQuery(folioQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listFolios(
        req.tenantId,
        req.validatedQuery as {
          page: number;
          pageSize: number;
          reservationId?: string;
          status?: string;
        }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/{id}',
  tags: ['Folios'],
  description: 'Get a folio by ID',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Folio details',
      content: { 'application/json': { schema: FolioResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Folio not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

foliosRouter.get(
  '/:id',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getFolio(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Folios'],
  description: 'Create a folio',
  request: {
    body: {
      description: 'Folio payload',
      content: { 'application/json': { schema: FolioCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Folio created',
      content: { 'application/json': { schema: FolioResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Folio already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

foliosRouter.post(
  '/',
  requirePermission('folio', 'create'),
  validateBody(folioCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createFolio(req.tenantId, req.validatedBody as FolioCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/charges',
  tags: ['Folios'],
  description: 'Post a charge to a folio',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Charge payload',
      content: { 'application/json': { schema: ChargeInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Charge posted',
      content: { 'application/json': { schema: FolioTransactionResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Folio not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Folio is closed',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

foliosRouter.post(
  '/:id/charges',
  requirePermission('folio', 'update'),
  validateBody(chargeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postCharge(
        req.tenantId,
        req.params.id,
        req.validatedBody as z.infer<typeof chargeSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/charges/{chargeId}/reverse',
  tags: ['Folios'],
  description: 'Reverse a charge on a folio',
  request: {
    params: FolioIdChargeIdParamSchema,
    body: {
      description: 'Reverse reason',
      content: { 'application/json': { schema: ReverseChargeInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Charge reversed',
      content: { 'application/json': { schema: FolioTransactionResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Folio or charge not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Cannot reverse adjustment',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

foliosRouter.post(
  '/:id/charges/:chargeId/reverse',
  requirePermission('folio', 'update'),
  validateBody(z.object({ reason: z.string() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await reverseCharge(
        req.tenantId,
        req.params.id,
        req.params.chargeId,
        (req.validatedBody as { reason: string }).reason
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/payments',
  tags: ['Folios'],
  description: 'Post a payment to a folio',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Payment payload',
      content: { 'application/json': { schema: PaymentInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Payment posted',
      content: { 'application/json': { schema: FolioTransactionResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Folio not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Folio is closed',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

foliosRouter.post(
  '/:id/payments',
  requirePermission('folio', 'update'),
  validateBody(paymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postPayment(
        req.tenantId,
        req.params.id,
        req.validatedBody as z.infer<typeof paymentSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/transfer-to-city-ledger',
  tags: ['Folios'],
  description: 'Transfer a folio to the city ledger',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Folio transferred',
      content: { 'application/json': { schema: FolioResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Folio not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Folio must be open to transfer',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

foliosRouter.post(
  '/:id/transfer-to-city-ledger',
  requirePermission('folio', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await transferToCityLedger(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'delete',
  path: '/{id}',
  tags: ['Folios'],
  description: 'Delete a folio',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Folio deleted',
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Folio not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Folio has posted items',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

foliosRouter.delete(
  '/:id',
  requirePermission('folio', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteFolio(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
