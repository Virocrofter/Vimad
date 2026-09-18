import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { authMiddleware, tenantScope, type AuthenticatedRequest } from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema, MessageResponseSchema } from '../../common/openapi-schemas.js';
import {
  getSubscription,
  getVapidPublicKey,
  pushSubscriptionSchema,
  removeSubscription,
  saveSubscription,
} from './push.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const vapidKeyResponseSchema = z
  .object({ data: z.object({ publicKey: z.string().nullable() }) })
  .openapi('PushVapidKeyResponse');

const pushSubscriptionResponseSchema = z
  .object({
    data: z.object({
      id: z.string(),
      endpoint: z.string(),
      createdAt: z.string().datetime(),
    }),
  })
  .openapi('PushSubscriptionResponse');

export const pushRouter = Router();

pushRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/push/vapid-public-key',
  tags: ['Push'],
  description: 'Get the server VAPID public key used for Web Push subscription',
  responses: {
    200: {
      description: 'VAPID public key (null when push is not configured)',
      content: { 'application/json': { schema: vapidKeyResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

pushRouter.get('/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ data: { publicKey: getVapidPublicKey() } });
});

registry.registerPath({
  method: 'post',
  path: '/push/subscriptions',
  tags: ['Push'],
  description: 'Subscribe the authenticated user to Web Push notifications',
  request: {
    body: {
      description: 'Browser push subscription object',
      content: {
        'application/json': { schema: pushSubscriptionSchema.openapi('PushSubscriptionCreate') },
      },
    },
  },
  responses: {
    201: {
      description: 'Subscription saved',
      content: { 'application/json': { schema: pushSubscriptionResponseSchema } },
    },
    400: {
      description: 'Invalid subscription payload',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

pushRouter.post(
  '/subscriptions',
  validateBody(pushSubscriptionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const subscription = await saveSubscription(
        authReq.auth.user.id,
        req.tenantId,
        req.validatedBody as z.infer<typeof pushSubscriptionSchema>
      );
      res.status(201).json({
        data: {
          id: subscription.id,
          endpoint: subscription.endpoint,
          createdAt: subscription.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/push/subscriptions',
  tags: ['Push'],
  description: 'Get the authenticated user’s Web Push subscription',
  responses: {
    200: {
      description: 'Subscription (data is null when not subscribed)',
      content: {
        'application/json': {
          schema: z
            .object({
              data: z
                .object({
                  id: z.string(),
                  endpoint: z.string(),
                  createdAt: z.string().datetime(),
                })
                .nullable(),
            })
            .openapi('PushSubscriptionGetResponse'),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

pushRouter.get('/subscriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const subscription = await getSubscription(authReq.auth.user.id);
    res.json({
      data: subscription
        ? {
            id: subscription.id,
            endpoint: subscription.endpoint,
            createdAt: subscription.createdAt,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

registry.registerPath({
  method: 'delete',
  path: '/push/subscriptions',
  tags: ['Push'],
  description: 'Unsubscribe the authenticated user from Web Push notifications',
  responses: {
    200: {
      description: 'Subscription removed',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

pushRouter.delete('/subscriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const endpoint =
      req.body && typeof req.body === 'object'
        ? (req.body as { endpoint?: string }).endpoint
        : undefined;
    const result = await removeSubscription(authReq.auth.user.id, endpoint);
    res.json({ message: result.removed > 0 ? 'Subscription removed' : 'No subscription found' });
  } catch (err) {
    next(err);
  }
});
