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
  createRatePlan,
  deleteRatePlan,
  getRatePlan,
  listRatePlans,
  ratePlanCreateSchema,
  ratePlanUpdateSchema,
  updateRatePlan,
  type RatePlanCreateInput,
  type RatePlanUpdateInput,
} from './rates.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const rateQuerySchema = paginationSchema
  .extend({
    propertyId: z.string().optional(),
    roomTypeId: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  })
  .openapi('RateQuery');
const RatePlanCreateInputSchema = ratePlanCreateSchema.openapi('RatePlanCreateInput');
const RatePlanUpdateInputSchema = ratePlanUpdateSchema.openapi('RatePlanUpdateInput');

const RatePlanItemSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    roomTypeId: z.string(),
    name: z.string(),
    code: z.string(),
    baseRate: z.number(),
    currency: z.string(),
    startDate: z.date().or(z.string()).optional(),
    endDate: z.date().or(z.string()).optional(),
    minStay: z.number().int().optional(),
    maxStay: z.number().int().optional(),
    closeToArrival: z.boolean(),
    closeToDeparture: z.boolean(),
    status: z.enum(['active', 'inactive']),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('RatePlanItem');

const RatePlanResponseSchema = z.object({ data: RatePlanItemSchema }).openapi('RatePlanResponse');
const RatePlanListResponseSchema =
  PaginatedResponseSchema(RatePlanItemSchema).openapi('RatePlanListResponse');

export const ratesRouter = Router();

ratesRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Rates'],
  description: 'List rate plans',
  request: {
    query: rateQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of rate plans',
      content: { 'application/json': { schema: RatePlanListResponseSchema } },
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

ratesRouter.get(
  '/',
  requirePermission('rate', 'read'),
  validateQuery(rateQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listRatePlans(
        req.tenantId,
        req.validatedQuery as {
          page: number;
          pageSize: number;
          propertyId?: string;
          roomTypeId?: string;
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
  tags: ['Rates'],
  description: 'Get a rate plan by ID',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Rate plan details',
      content: { 'application/json': { schema: RatePlanResponseSchema } },
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
      description: 'Rate plan not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

ratesRouter.get(
  '/:id',
  requirePermission('rate', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getRatePlan(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Rates'],
  description: 'Create a rate plan',
  request: {
    body: {
      description: 'Rate plan payload',
      content: { 'application/json': { schema: RatePlanCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Rate plan created',
      content: { 'application/json': { schema: RatePlanResponseSchema } },
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
      description: 'Property or room type not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Rate plan code already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

ratesRouter.post(
  '/',
  requirePermission('rate', 'create'),
  validateBody(ratePlanCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createRatePlan(req.tenantId, req.validatedBody as RatePlanCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'patch',
  path: '/{id}',
  tags: ['Rates'],
  description: 'Update a rate plan',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Rate plan update payload',
      content: { 'application/json': { schema: RatePlanUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Rate plan updated',
      content: { 'application/json': { schema: RatePlanResponseSchema } },
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
      description: 'Rate plan not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Rate plan code already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

ratesRouter.patch(
  '/:id',
  requirePermission('rate', 'update'),
  validateBody(ratePlanUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateRatePlan(
        req.tenantId,
        req.params.id,
        req.validatedBody as RatePlanUpdateInput
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'delete',
  path: '/{id}',
  tags: ['Rates'],
  description: 'Delete a rate plan',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Rate plan deleted',
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
      description: 'Rate plan not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

ratesRouter.delete(
  '/:id',
  requirePermission('rate', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteRatePlan(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
