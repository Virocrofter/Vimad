/* apps/api/src/modules/chains/chains.routes.ts — C1 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  authMiddleware,
  requirePermission,
  AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  listChains,
  createChain,
  updateChain,
  attachProperty,
  detachProperty,
  getScope,
  setCurrentProperty,
  chainCreateSchema,
  chainUpdateSchema,
} from './chains.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const ChainSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    slug: z.string(),
    status: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .openapi('Chain');

const ScopeSchema = z
  .object({
    data: z.object({
      properties: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          code: z.string(),
          city: z.string().nullable().optional(),
          status: z.string(),
          chainId: z.string().nullable().optional(),
          _count: z.object({
            rooms: z.number(),
            reservations: z.number(),
          }),
        })
      ),
      chains: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          status: z.string(),
          _count: z.object({ properties: z.number() }),
        })
      ),
      currentPropertyId: z.string().nullable(),
    }),
  })
  .openapi('PropertyScope');

registry.registerPath({
  method: 'get',
  path: '/v1/chains/scope',
  tags: ['Chains'],
  description: 'Switcher scope: accessible properties + chains + sticky choice',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Scope', content: { 'application/json': { schema: ScopeSchema } } },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/chains',
  tags: ['Chains'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Chains',
      content: { 'application/json': { schema: z.object({ data: z.array(ChainSchema) }) } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/v1/chains',
  tags: ['Chains'],
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: chainCreateSchema } } } },
  responses: {
    201: {
      description: 'Created',
      content: { 'application/json': { schema: z.object({ data: ChainSchema }) } },
    },
    409: {
      description: 'Slug conflict',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const chainsRouter = Router();

function auth(req: Request): { tenantId: string; userId: string; role: string } {
  const a = (req as AuthenticatedRequest).auth;
  return { tenantId: a.tenantId, userId: a.user.id, role: a.user.role };
}

// ─── Switcher scope (must precede /:id) ───
chainsRouter.get(
  '/scope',
  authMiddleware,
  requirePermission('property', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId, role } = auth(req);
      res.json({ data: await getScope(tenantId, userId, role) });
    } catch (err) {
      next(err);
    }
  }
);

chainsRouter.put(
  '/me/current-property',
  authMiddleware,
  validateBody(z.object({ propertyId: z.string().nullable() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, userId, role } = auth(req);
      const { propertyId } = req.validatedBody as { propertyId: string | null };
      res.json({ data: await setCurrentProperty(tenantId, userId, role, propertyId) });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Chain CRUD ───
chainsRouter.get(
  '/',
  authMiddleware,
  requirePermission('property', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await listChains(auth(req).tenantId) });
    } catch (err) {
      next(err);
    }
  }
);

chainsRouter.post(
  '/',
  authMiddleware,
  requirePermission('property', 'create'),
  validateBody(chainCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createChain(
        auth(req).tenantId,
        req.validatedBody as z.infer<typeof chainCreateSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

chainsRouter.patch(
  '/:id',
  authMiddleware,
  requirePermission('property', 'update'),
  validateBody(chainUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateChain(
        auth(req).tenantId,
        req.params.id,
        req.validatedBody as z.infer<typeof chainUpdateSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

chainsRouter.post(
  '/:id/properties',
  authMiddleware,
  requirePermission('property', 'update'),
  validateBody(z.object({ propertyId: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedBody as { propertyId: string };
      const result = await attachProperty(auth(req).tenantId, req.params.id, propertyId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

chainsRouter.delete(
  '/:id/properties/:propertyId',
  authMiddleware,
  requirePermission('property', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await detachProperty(auth(req).tenantId, req.params.propertyId);
      res.json({ message: 'Property removed from chain' });
    } catch (err) {
      next(err);
    }
  }
);
