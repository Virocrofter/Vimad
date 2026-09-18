import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import {
  authMiddleware,
  tenantScope,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  ErrorResponseSchema,
  IdParamSchema,
  MessageResponseSchema,
  PaginatedResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  createNotification,
  createBroadcastNotification,
  deleteNotification,
  getNotification,
  getUnreadCount,
  listNotifications,
  markAllAsRead,
  notificationBroadcastSchema,
  notificationCreateSchema,
  notificationUpdateSchema,
  updateNotification,
  type NotificationCreateInput,
  type NotificationUpdateInput,
} from './notification.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const notificationQuerySchema = paginationSchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});

const notificationSchema = z
  .object({
    id: z.string(),
    userId: z.string().nullable(),
    tenantId: z.string(),
    type: z.string(),
    category: z.string(),
    title: z.string(),
    message: z.string(),
    actionUrl: z.string().nullable(),
    actionLabel: z.string().nullable(),
    entityType: z.string().nullable(),
    entityId: z.string().nullable(),
    read: z.boolean(),
    readAt: z.string().datetime().nullable(),
    deliveredVia: z.array(z.string()),
    createdAt: z.string().datetime(),
  })
  .openapi('Notification');

const notificationResponseSchema = z
  .object({ data: notificationSchema })
  .openapi('NotificationResponse');
const notificationListResponseSchema = PaginatedResponseSchema(notificationSchema).openapi(
  'NotificationListResponse'
);
const unreadCountResponseSchema = z
  .object({ count: z.number().int() })
  .openapi('UnreadCountResponse');

export const notificationRouter = Router();

notificationRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/notifications',
  tags: ['Notifications'],
  description: 'List notifications for the authenticated user',
  request: { query: notificationQuerySchema.openapi('NotificationQuery') },
  responses: {
    200: {
      description: 'List of notifications',
      content: { 'application/json': { schema: notificationListResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

notificationRouter.get(
  '/',
  validateQuery(notificationQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await listNotifications(
        authReq.auth.user.id,
        req.tenantId,
        req.validatedQuery as { page: number; pageSize: number; unreadOnly?: boolean }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/notifications/unread-count',
  tags: ['Notifications'],
  description: 'Get the number of unread notifications',
  responses: {
    200: {
      description: 'Unread count',
      content: { 'application/json': { schema: unreadCountResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

notificationRouter.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await getUnreadCount(authReq.auth.user.id, req.tenantId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

registry.registerPath({
  method: 'post',
  path: '/notifications',
  tags: ['Notifications'],
  description: 'Create a notification for a specific user (admin/manager)',
  request: {
    body: {
      description: 'Notification payload',
      content: {
        'application/json': { schema: notificationCreateSchema.openapi('NotificationCreate') },
      },
    },
  },
  responses: {
    201: {
      description: 'Created notification',
      content: { 'application/json': { schema: notificationResponseSchema } },
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

notificationRouter.post(
  '/',
  requirePermission('notification', 'create'),
  validateBody(notificationCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createNotification(
        req.tenantId,
        req.validatedBody as NotificationCreateInput
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/notifications/broadcast',
  tags: ['Notifications'],
  description: 'Broadcast a notification to all active users in the tenant',
  request: {
    body: {
      description: 'Broadcast payload',
      content: {
        'application/json': {
          schema: notificationBroadcastSchema.openapi('NotificationBroadcast'),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Broadcast notifications',
      content: {
        'application/json': {
          schema: z
            .object({ data: z.array(notificationSchema) })
            .openapi('NotificationBroadcastResponse'),
        },
      },
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

notificationRouter.post(
  '/broadcast',
  requirePermission('notification', 'create'),
  validateBody(notificationBroadcastSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createBroadcastNotification(
        req.tenantId,
        req.validatedBody as z.infer<typeof notificationBroadcastSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/notifications/{id}',
  tags: ['Notifications'],
  description: 'Get a notification by ID',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Notification details',
      content: { 'application/json': { schema: notificationResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

notificationRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await getNotification(authReq.auth.user.id, req.tenantId, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

registry.registerPath({
  method: 'patch',
  path: '/notifications/{id}',
  tags: ['Notifications'],
  description: 'Mark a notification as read/unread',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Update payload',
      content: {
        'application/json': { schema: notificationUpdateSchema.openapi('NotificationUpdate') },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated notification',
      content: { 'application/json': { schema: notificationResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

notificationRouter.patch(
  '/:id',
  validateBody(notificationUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await updateNotification(
        authReq.auth.user.id,
        req.tenantId,
        req.params.id,
        req.validatedBody as NotificationUpdateInput
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/notifications/mark-all-read',
  tags: ['Notifications'],
  description: 'Mark all notifications as read',
  responses: {
    200: {
      description: 'Success',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

notificationRouter.post(
  '/mark-all-read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      await markAllAsRead(authReq.auth.user.id, req.tenantId);
      res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'delete',
  path: '/notifications/{id}',
  tags: ['Notifications'],
  description: 'Delete a notification',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Deleted',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

notificationRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await deleteNotification(authReq.auth.user.id, req.tenantId, req.params.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
});
