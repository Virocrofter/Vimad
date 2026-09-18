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
  createRoomType,
  deleteRoomType,
  getRoomType,
  listRoomTypes,
  roomTypeCreateSchema,
  roomTypeUpdateSchema,
  updateRoomType,
  type RoomTypeCreateInput,
  type RoomTypeUpdateInput,
} from './room-types.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const roomTypeQuerySchema = paginationSchema
  .extend({
    propertyId: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    search: z.string().optional(),
  })
  .openapi('RoomTypeQuery');
const RoomTypeCreateInputSchema = roomTypeCreateSchema.openapi('RoomTypeCreateInput');
const RoomTypeUpdateInputSchema = roomTypeUpdateSchema.openapi('RoomTypeUpdateInput');

const RoomTypeItemSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    name: z.string(),
    code: z.string(),
    description: z.string().optional(),
    baseOccupancy: z.number().int(),
    maxOccupancy: z.number().int(),
    baseRate: z.number(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive']),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('RoomTypeItem');

const RoomTypeResponseSchema = z.object({ data: RoomTypeItemSchema }).openapi('RoomTypeResponse');
const RoomTypeListResponseSchema =
  PaginatedResponseSchema(RoomTypeItemSchema).openapi('RoomTypeListResponse');

export const roomTypesRouter = Router();

roomTypesRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Room Types'],
  description: 'List room types',
  request: {
    query: roomTypeQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of room types',
      content: { 'application/json': { schema: RoomTypeListResponseSchema } },
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

roomTypesRouter.get(
  '/',
  requirePermission('room_type', 'read'),
  validateQuery(roomTypeQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listRoomTypes(
        req.tenantId,
        req.validatedQuery as {
          page: number;
          pageSize: number;
          propertyId?: string;
          status?: string;
          search?: string;
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
  tags: ['Room Types'],
  description: 'Get a room type by ID',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Room type details',
      content: { 'application/json': { schema: RoomTypeResponseSchema } },
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
      description: 'Room type not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

roomTypesRouter.get(
  '/:id',
  requirePermission('room_type', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getRoomType(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Room Types'],
  description: 'Create a room type',
  request: {
    body: {
      description: 'Room type payload',
      content: { 'application/json': { schema: RoomTypeCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Room type created',
      content: { 'application/json': { schema: RoomTypeResponseSchema } },
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
    409: {
      description: 'Room type code already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

roomTypesRouter.post(
  '/',
  requirePermission('room_type', 'create'),
  validateBody(roomTypeCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createRoomType(req.tenantId, req.validatedBody as RoomTypeCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'patch',
  path: '/{id}',
  tags: ['Room Types'],
  description: 'Update a room type',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Room type update payload',
      content: { 'application/json': { schema: RoomTypeUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Room type updated',
      content: { 'application/json': { schema: RoomTypeResponseSchema } },
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
      description: 'Room type not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Room type code already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

roomTypesRouter.patch(
  '/:id',
  requirePermission('room_type', 'update'),
  validateBody(roomTypeUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateRoomType(
        req.tenantId,
        req.params.id,
        req.validatedBody as RoomTypeUpdateInput
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
  tags: ['Room Types'],
  description: 'Delete a room type',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Room type deleted',
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
      description: 'Room type not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Room type has associated rooms',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

roomTypesRouter.delete(
  '/:id',
  requirePermission('room_type', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteRoomType(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
