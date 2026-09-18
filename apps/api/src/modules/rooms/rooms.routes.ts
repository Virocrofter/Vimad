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
  createRoom,
  deleteRoom,
  getRoom,
  listRooms,
  roomCreateSchema,
  roomUpdateSchema,
  updateRoom,
  type RoomCreateInput,
  type RoomUpdateInput,
} from './rooms.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const roomQuerySchema = paginationSchema
  .extend({
    propertyId: z.string().optional(),
    roomTypeId: z.string().optional(),
    status: z.enum(['clean', 'dirty', 'inspected', 'maintenance']).optional(),
    housekeepingStatus: z.enum(['ready', 'not_ready', 'in_progress']).optional(),
    search: z.string().optional(),
  })
  .openapi('RoomQuery');
const RoomCreateInputSchema = roomCreateSchema.openapi('RoomCreateInput');
const RoomUpdateInputSchema = roomUpdateSchema.openapi('RoomUpdateInput');

const RoomItemSchema = z
  .object({
    id: z.string(),
    propertyId: z.string(),
    roomTypeId: z.string(),
    number: z.string(),
    floor: z.string().optional(),
    status: z.enum(['clean', 'dirty', 'inspected', 'maintenance']),
    housekeepingStatus: z.enum(['ready', 'not_ready', 'in_progress']),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('RoomItem');

const RoomResponseSchema = z.object({ data: RoomItemSchema }).openapi('RoomResponse');
const RoomListResponseSchema = PaginatedResponseSchema(RoomItemSchema).openapi('RoomListResponse');

export const roomsRouter = Router();

roomsRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Rooms'],
  description: 'List rooms',
  request: {
    query: roomQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of rooms',
      content: { 'application/json': { schema: RoomListResponseSchema } },
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

roomsRouter.get(
  '/',
  requirePermission('room', 'read'),
  validateQuery(roomQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listRooms(
        req.tenantId,
        req.validatedQuery as {
          page: number;
          pageSize: number;
          propertyId?: string;
          roomTypeId?: string;
          status?: string;
          housekeepingStatus?: string;
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
  tags: ['Rooms'],
  description: 'Get a room by ID',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Room details',
      content: { 'application/json': { schema: RoomResponseSchema } },
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
      description: 'Room not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

roomsRouter.get(
  '/:id',
  requirePermission('room', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getRoom(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Rooms'],
  description: 'Create a room',
  request: {
    body: {
      description: 'Room payload',
      content: { 'application/json': { schema: RoomCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Room created',
      content: { 'application/json': { schema: RoomResponseSchema } },
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
      description: 'Room number already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

roomsRouter.post(
  '/',
  requirePermission('room', 'create'),
  validateBody(roomCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createRoom(req.tenantId, req.validatedBody as RoomCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'patch',
  path: '/{id}',
  tags: ['Rooms'],
  description: 'Update a room',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Room update payload',
      content: { 'application/json': { schema: RoomUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Room updated',
      content: { 'application/json': { schema: RoomResponseSchema } },
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
      description: 'Room not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Room number already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

roomsRouter.patch(
  '/:id',
  requirePermission('room', 'update'),
  validateBody(roomUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateRoom(
        req.tenantId,
        req.params.id,
        req.validatedBody as RoomUpdateInput
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
  tags: ['Rooms'],
  description: 'Delete a room',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Room deleted',
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
      description: 'Room not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Room has associated stays',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

roomsRouter.delete(
  '/:id',
  requirePermission('room', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteRoom(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
