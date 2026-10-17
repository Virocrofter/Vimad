import { Router, type Request, type Response, type NextFunction } from 'express';
import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, requirePermission, tenantScope } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  ErrorResponseSchema,
  IdParamSchema,
  PaginatedResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  createProperty,
  deleteProperty,
  getProperty,
  listProperties,
  propertyCreateSchema,
  propertyUpdateSchema,
  updateProperty,
  type PropertyCreateInput,
  type PropertyUpdateInput,
} from './properties.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const PropertyQuerySchema = paginationSchema.openapi('PropertyQuery');
const PropertyCreateInputSchema = propertyCreateSchema.openapi('PropertyCreateInput');
const PropertyUpdateInputSchema = propertyUpdateSchema.openapi('PropertyUpdateInput');

const PropertyItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string(),
    currency: z.string(),
    createdAt: z.date().or(z.string()),
    updatedAt: z.date().or(z.string()),
  })
  .openapi('PropertyItem');

const PropertyResponseSchema = z.object({ data: PropertyItemSchema }).openapi('PropertyResponse');
const PropertyListResponseSchema =
  PaginatedResponseSchema(PropertyItemSchema).openapi('PropertyListResponse');

export const propertiesRouter = Router();

// EVERY route on this router requires auth + tenant scoping. Commenting this
// out doesn't just leak data — Prisma treats undefined tenantId as "no
// filter", returning ALL tenants' properties, and GET routes become fully
// unauthenticated. Do not remove.
propertiesRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Properties'],
  description: 'List properties',
  request: {
    query: PropertyQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of properties',
      content: { 'application/json': { schema: PropertyListResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

propertiesRouter.get(
  '/',
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listProperties(
        req.tenantId,
        req.validatedQuery as { page: number; pageSize: number }
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
  tags: ['Properties'],
  description: 'Get a property by ID',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Property details',
      content: { 'application/json': { schema: PropertyResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

propertiesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getProperty(req.tenantId, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Properties'],
  description: 'Create a property',
  request: {
    body: {
      description: 'Property payload',
      content: { 'application/json': { schema: PropertyCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Property created',
      content: { 'application/json': { schema: PropertyResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Property code already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

propertiesRouter.post(
  '/',
  requirePermission('property', 'create'),
  validateBody(propertyCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createProperty(req.tenantId, req.validatedBody as PropertyCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'patch',
  path: '/{id}',
  tags: ['Properties'],
  description: 'Update a property',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Property update payload',
      content: { 'application/json': { schema: PropertyUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Property updated',
      content: { 'application/json': { schema: PropertyResponseSchema } },
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
      description: 'Property not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

propertiesRouter.patch(
  '/:id',
  requirePermission('property', 'update'),
  validateBody(propertyUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateProperty(
        req.tenantId,
        req.params.id,
        req.validatedBody as PropertyUpdateInput
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
  tags: ['Properties'],
  description: 'Delete a property',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Property deleted',
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
      description: 'Property not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

propertiesRouter.delete(
  '/:id',
  requirePermission('property', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteProperty(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
