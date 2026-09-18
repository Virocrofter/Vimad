import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  connectChannel,
  disconnectChannel,
  getChannelStatus,
  listChannels,
  pushAvailability,
  pushRates,
  syncReservations,
  channelConnectSchema,
  availabilityPushSchema,
  ratesPushSchema,
} from './channel.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const ChannelConnectInputSchema = channelConnectSchema.openapi('ChannelConnectInput');
const AvailabilityPushInputSchema = availabilityPushSchema.openapi('AvailabilityPushInput');
const RatesPushInputSchema = ratesPushSchema.openapi('RatesPushInput');

const ChannelIdParamSchema = z.object({ channelId: z.string() }).openapi('ChannelIdParam');

const ChannelStatusSchema = z
  .object({
    data: z.object({
      connections: z.array(z.record(z.string(), z.unknown())),
      stats: z.object({
        totalConnections: z.number().int(),
        active: z.number().int(),
        syncing: z.number().int(),
        failed: z.number().int(),
      }),
    }),
  })
  .openapi('ChannelStatusResponse');

const ChannelListResponseSchema = z
  .object({
    data: z.array(z.record(z.string(), z.unknown())),
  })
  .openapi('ChannelListResponse');

const ChannelConnectionResponseSchema = z
  .object({
    data: z.record(z.string(), z.unknown()),
  })
  .openapi('ChannelConnectionResponse');

const AvailabilityPushResponseSchema = z
  .object({
    data: z.object({
      availability: z.array(z.record(z.string(), z.unknown())),
      pushedTo: z.array(z.record(z.string(), z.unknown())),
    }),
  })
  .openapi('AvailabilityPushResponse');

const RatesPushResponseSchema = z
  .object({
    data: z.object({
      rates: z.array(z.record(z.string(), z.unknown())),
      pushedTo: z.array(z.record(z.string(), z.unknown())),
    }),
  })
  .openapi('RatesPushResponse');

const SyncReservationsResponseSchema = z
  .object({
    data: z.array(z.record(z.string(), z.unknown())),
  })
  .openapi('SyncReservationsResponse');

export const channelRouter = Router();

channelRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/status',
  tags: ['Channel'],
  description: 'Get channel manager status',
  responses: {
    200: {
      description: 'Channel status',
      content: { 'application/json': { schema: ChannelStatusSchema } },
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

channelRouter.get(
  '/status',
  requirePermission('channel', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getChannelStatus(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/channels',
  tags: ['Channel'],
  description: 'List connected channels',
  responses: {
    200: {
      description: 'List of channels',
      content: { 'application/json': { schema: ChannelListResponseSchema } },
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

channelRouter.get(
  '/channels',
  requirePermission('channel', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listChannels(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/connect',
  tags: ['Channel'],
  description: 'Connect a channel',
  request: {
    body: {
      description: 'Channel connection payload',
      content: { 'application/json': { schema: ChannelConnectInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Channel connected',
      content: { 'application/json': { schema: ChannelConnectionResponseSchema } },
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
      description: 'Channel connection already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

channelRouter.post(
  '/connect',
  requirePermission('channel', 'create'),
  validateBody(channelConnectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await connectChannel(
        req.tenantId,
        req.validatedBody as z.infer<typeof channelConnectSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{channelId}/disconnect',
  tags: ['Channel'],
  description: 'Disconnect a channel',
  request: {
    params: ChannelIdParamSchema,
  },
  responses: {
    204: {
      description: 'Channel disconnected',
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
      description: 'Channel not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

channelRouter.post(
  '/:channelId/disconnect',
  requirePermission('channel', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await disconnectChannel(req.tenantId, req.params.channelId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/push/availability',
  tags: ['Channel'],
  description: 'Push availability to channels',
  request: {
    body: {
      description: 'Availability push payload',
      content: { 'application/json': { schema: AvailabilityPushInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Availability pushed',
      content: { 'application/json': { schema: AvailabilityPushResponseSchema } },
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

channelRouter.post(
  '/push/availability',
  requirePermission('channel', 'update'),
  validateBody(availabilityPushSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pushAvailability(
        req.tenantId,
        req.validatedBody as z.infer<typeof availabilityPushSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/push/rates',
  tags: ['Channel'],
  description: 'Push rates to channels',
  request: {
    body: {
      description: 'Rates push payload',
      content: { 'application/json': { schema: RatesPushInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Rates pushed',
      content: { 'application/json': { schema: RatesPushResponseSchema } },
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

channelRouter.post(
  '/push/rates',
  requirePermission('channel', 'update'),
  validateBody(ratesPushSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await pushRates(
        req.tenantId,
        req.validatedBody as z.infer<typeof ratesPushSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/sync/reservations',
  tags: ['Channel'],
  description: 'Sync reservations from channels',
  request: {
    query: z.object({ channelId: z.string().optional() }).openapi('ChannelSyncQuery'),
  },
  responses: {
    200: {
      description: 'Reservations synced',
      content: { 'application/json': { schema: SyncReservationsResponseSchema } },
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

channelRouter.post(
  '/sync/reservations',
  requirePermission('channel', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await syncReservations(req.tenantId, req.body.channelId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
