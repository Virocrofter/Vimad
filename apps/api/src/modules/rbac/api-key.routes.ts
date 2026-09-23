/* apps/api/src/modules/rbac/api-key.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import { createApiKey, listApiKeys, revokeApiKey, apiKeyCreateSchema } from './api-key.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const ApiKeyCreateInputSchema = apiKeyCreateSchema.openapi('ApiKeyCreateInput');

const ApiKeyItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    keyPrefix: z.string(),
    scopes: z.array(z.string()),
    status: z.string(),
    environment: z.string(),
    rateLimit: z.string(),
    expiresAt: z.date().nullable(),
    lastUsedAt: z.date().nullable(),
    usageCount: z.number().int(),
    createdAt: z.date(),
    createdBy: z.string().nullable(),
  })
  .openapi('ApiKeyItem');

const ApiKeyCreatedResponseSchema = z
  .object({
    data: z.object({
      apiKey: ApiKeyItemSchema,
      rawKey: z.string(),
    }),
  })
  .openapi('ApiKeyCreatedResponse');

const ApiKeyListResponseSchema = z
  .object({ data: z.array(ApiKeyItemSchema) })
  .openapi('ApiKeyListResponse');

const MessageResponseSchema = z.object({ message: z.string() }).openapi('MessageResponse');

export const apiKeysRouter = Router();

apiKeysRouter.use(authMiddleware, tenantScope);

/* ─── GET /api-keys ─── */
registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['API Keys'],
  description: 'List API keys for the current tenant',
  responses: {
    200: {
      description: 'List of API keys',
      content: { 'application/json': { schema: ApiKeyListResponseSchema } },
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

apiKeysRouter.get(
  '/',
  requirePermission('api_key', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listApiKeys(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /api-keys ─── */
registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['API Keys'],
  description: 'Create a new API key',
  request: {
    body: {
      description: 'API key payload',
      content: { 'application/json': { schema: ApiKeyCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'API key created — rawKey shown only once',
      content: { 'application/json': { schema: ApiKeyCreatedResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
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

apiKeysRouter.post(
  '/',
  requirePermission('api_key', 'create'),
  validateBody(apiKeyCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createApiKey(
        req.tenantId,
        req.validatedBody as z.infer<typeof apiKeyCreateSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /api-keys/:id/revoke ─── */
registry.registerPath({
  method: 'post',
  path: '/{id}/revoke',
  tags: ['API Keys'],
  description: 'Revoke an API key',
  request: {
    params: z.object({ id: z.string() }).openapi('ApiKeyIdParam'),
    body: {
      description: 'Revocation reason (optional)',
      content: {
        'application/json': {
          schema: z.object({ reason: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'API key revoked',
      content: { 'application/json': { schema: MessageResponseSchema } },
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
      description: 'API key not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

apiKeysRouter.post(
  '/:id/revoke',
  requirePermission('api_key', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reason = (req.body as { reason?: string })?.reason;
      await revokeApiKey(req.tenantId, req.params.id, reason);
      res.json({ message: 'API key revoked' });
    } catch (err) {
      next(err);
    }
  }
);
