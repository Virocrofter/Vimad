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
  createGuest,
  deleteGuest,
  getGuest,
  guestCreateSchema,
  guestUpdateSchema,
  listGuests,
  updateGuest,
  type GuestCreateInput,
  type GuestUpdateInput,
} from './guests.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const guestQuerySchema = paginationSchema
  .extend({
    search: z.string().optional(),
  })
  .openapi('GuestQuery');
const GuestCreateInputSchema = guestCreateSchema.openapi('GuestCreateInput');
const GuestUpdateInputSchema = guestUpdateSchema.openapi('GuestUpdateInput');

const GuestItemSchema = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.date().or(z.string()).optional(),
    nationality: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    passportNumber: z.string().optional(),
    vipStatus: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('GuestItem');

const GuestResponseSchema = z.object({ data: GuestItemSchema }).openapi('GuestResponse');
const GuestListResponseSchema =
  PaginatedResponseSchema(GuestItemSchema).openapi('GuestListResponse');

export const guestsRouter = Router();

guestsRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Guests'],
  description: 'List guests',
  request: {
    query: guestQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of guests',
      content: { 'application/json': { schema: GuestListResponseSchema } },
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

guestsRouter.get(
  '/',
  requirePermission('guest', 'read'),
  validateQuery(guestQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listGuests(
        req.tenantId,
        req.validatedQuery as { page: number; pageSize: number; search?: string }
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
  tags: ['Guests'],
  description: 'Get a guest by ID',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Guest details',
      content: { 'application/json': { schema: GuestResponseSchema } },
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
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.get(
  '/:id',
  requirePermission('guest', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getGuest(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Guests'],
  description: 'Create a guest',
  request: {
    body: {
      description: 'Guest payload',
      content: { 'application/json': { schema: GuestCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Guest created',
      content: { 'application/json': { schema: GuestResponseSchema } },
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

guestsRouter.post(
  '/',
  requirePermission('guest', 'create'),
  validateBody(guestCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createGuest(req.tenantId, req.validatedBody as GuestCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'patch',
  path: '/{id}',
  tags: ['Guests'],
  description: 'Update a guest',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Guest update payload',
      content: { 'application/json': { schema: GuestUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Guest updated',
      content: { 'application/json': { schema: GuestResponseSchema } },
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
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.patch(
  '/:id',
  requirePermission('guest', 'update'),
  validateBody(guestUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateGuest(
        req.tenantId,
        req.params.id,
        req.validatedBody as GuestUpdateInput
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
  tags: ['Guests'],
  description: 'Delete a guest',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Guest deleted',
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
      description: 'Guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestsRouter.delete(
  '/:id',
  requirePermission('guest', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteGuest(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
