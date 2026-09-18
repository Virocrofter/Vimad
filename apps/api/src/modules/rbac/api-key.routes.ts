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
  PaginatedResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  createApiKey,
  createApiKeySchema,
  updateApiKey,
  updateApiKeySchema,
  revokeApiKey,
  deleteApiKey,
  listApiKeys,
  hasScope,
} from './api-key.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const apiKeySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    keyPrefix: z.string(),
    scopes: z.array(z.string()),
    status: z.string(),
    environment: z.string(),
    rateLimit: z.string(),
    expiresAt: z.string().datetime().nullable(),
    lastUsedAt: z.string().datetime().nullable(),
    usageCount: z.number().int(),
    createdBy: z.string(),
    revokedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi('ApiKey');

const apiKeyListResponseSchema =
  PaginatedResponseSchema(apiKeySchema).openapi('ApiKeyListResponse');
const apiKeyResponseSchema = z.object({ data: apiKeySchema }).openapi('ApiKeyResponse');
const apiKeyWithFullSchema = z
  .object({
    data: apiKeySchema,
    keyFull: z.string(),
    warning: z.string(),
  })
  .openapi('ApiKeyWithFull');

export const apiKeysRouter = Router();

apiKeysRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/api-keys',
  tags: ['API Keys'],
  description: 'List API keys for the tenant',
  request: { query: paginationSchema.openapi('ApiKeyListQuery') },
  responses: {
    200: {
      description: 'List of API keys',
      content: { 'application/json': { schema: apiKeyListResponseSchema } },
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
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listApiKeys(
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
  method: 'post',
  path: '/api-keys',
  tags: ['API Keys'],
  description: 'Create a new API key',
  request: {
    body: {
      description: 'API key payload',
      content: { 'application/json': { schema: createApiKeySchema.openapi('CreateApiKey') } },
    },
  },
  responses: {
    201: {
      description: 'Created API key',
      content: { 'application/json': { schema: apiKeyWithFullSchema } },
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
  validateBody(createApiKeySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { key, full } = await createApiKey(
        req.tenantId,
        authReq.auth.user.id,
        req.validatedBody as z.infer<typeof createApiKeySchema>
      );
      res.status(201).json({
        data: key,
        keyFull: full,
        warning: 'This is the only time the full key will be shown. Store it securely.',
      });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'patch',
  path: '/api-keys/{id}',
  tags: ['API Keys'],
  description: 'Update an API key',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Update payload',
      content: { 'application/json': { schema: updateApiKeySchema.openapi('UpdateApiKey') } },
    },
  },
  responses: {
    200: {
      description: 'Updated API key',
      content: { 'application/json': { schema: apiKeyResponseSchema } },
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
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

apiKeysRouter.patch(
  '/:id',
  requirePermission('api_key', 'update'),
  validateBody(updateApiKeySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateApiKey(
        req.tenantId,
        req.params.id,
        req.validatedBody as z.infer<typeof updateApiKeySchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/api-keys/{id}/revoke',
  tags: ['API Keys'],
  description: 'Revoke an API key',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Optional revoke reason',
      content: {
        'application/json': {
          schema: z.object({ reason: z.string().optional() }).openapi('RevokeApiKey'),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Revoked API key',
      content: { 'application/json': { schema: apiKeyResponseSchema } },
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
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

apiKeysRouter.post(
  '/:id/revoke',
  requirePermission('api_key', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const result = await revokeApiKey(
        req.tenantId,
        req.params.id,
        authReq.auth.user.id,
        req.body.reason
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'delete',
  path: '/api-keys/{id}',
  tags: ['API Keys'],
  description: 'Delete an API key',
  request: { params: IdParamSchema },
  responses: {
    204: { description: 'Deleted' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

apiKeysRouter.delete(
  '/:id',
  requirePermission('api_key', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteApiKey(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export { hasScope };
