/* apps/api/src/modules/rbac/rbac.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
  unassignRole,
  listPermissions,
  roleCreateSchema,
  roleUpdateSchema,
} from './rbac.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const RoleCreateInputSchema = roleCreateSchema.openapi('RoleCreateInput');
const RoleUpdateInputSchema = roleUpdateSchema.openapi('RoleUpdateInput');

const RoleIdParamSchema = z.object({ id: z.string() }).openapi('RoleIdParam');

const AssignRoleInputSchema = z
  .object({
    userId: z.string(),
    roleId: z.string(),
    propertyId: z.string().optional(),
  })
  .openapi('AssignRoleInput');

const UnassignRoleInputSchema = z
  .object({
    userId: z.string(),
    roleId: z.string(),
    propertyId: z.string().optional(),
  })
  .openapi('UnassignRoleInput');

const PermissionItemSchema = z
  .object({
    id: z.string(),
    resource: z.string(),
    action: z.string(),
    description: z.string().nullable(),
    category: z.string(),
  })
  .openapi('PermissionItem');

const RolePermissionSchema = z
  .object({
    id: z.string(),
    roleId: z.string(),
    permissionId: z.string(),
    conditions: z.unknown().nullable(),
    permission: PermissionItemSchema,
  })
  .openapi('RolePermission');

const RoleItemSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.string(),
    isDefault: z.boolean(),
    isLocked: z.boolean(),
    tenantId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    rolePermissions: z.array(RolePermissionSchema).optional(),
    _count: z.object({ roleAssignments: z.number().int() }).optional(),
  })
  .openapi('RoleItem');

const RoleListResponseSchema = z
  .object({ data: z.array(RoleItemSchema) })
  .openapi('RoleListResponse');

const RoleResponseSchema = z.object({ data: RoleItemSchema }).openapi('RoleResponse');

const PermissionListResponseSchema = z
  .object({ data: z.array(PermissionItemSchema) })
  .openapi('PermissionListResponse');

const MessageResponseSchema = z.object({ message: z.string() }).openapi('MessageResponse');

export const rbacRouter = Router();

rbacRouter.use(authMiddleware, tenantScope);

/* ─── GET /rbac/roles ─── */
registry.registerPath({
  method: 'get',
  path: '/roles',
  tags: ['RBAC'],
  description: 'List all roles (system + tenant)',
  responses: {
    200: {
      description: 'List of roles',
      content: { 'application/json': { schema: RoleListResponseSchema } },
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

rbacRouter.get(
  '/roles',
  requirePermission('user', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listRoles(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /rbac/roles/:id ─── */
registry.registerPath({
  method: 'get',
  path: '/roles/{id}',
  tags: ['RBAC'],
  description: 'Get a role by ID with permissions and assignments',
  request: { params: RoleIdParamSchema },
  responses: {
    200: {
      description: 'Role details',
      content: { 'application/json': { schema: RoleResponseSchema } },
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
      description: 'Role not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

rbacRouter.get(
  '/roles/:id',
  requirePermission('user', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getRole(req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /rbac/roles ─── */
registry.registerPath({
  method: 'post',
  path: '/roles',
  tags: ['RBAC'],
  description: 'Create a new role',
  request: {
    body: {
      description: 'Role payload',
      content: { 'application/json': { schema: RoleCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Role created',
      content: { 'application/json': { schema: RoleResponseSchema } },
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

rbacRouter.post(
  '/roles',
  requirePermission('user', 'create'),
  validateBody(roleCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createRole(
        req.tenantId,
        req.validatedBody as z.infer<typeof roleCreateSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── PATCH /rbac/roles/:id ─── */
registry.registerPath({
  method: 'patch',
  path: '/roles/{id}',
  tags: ['RBAC'],
  description: 'Update a role',
  request: {
    params: RoleIdParamSchema,
    body: {
      description: 'Role update payload',
      content: { 'application/json': { schema: RoleUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Role updated',
      content: { 'application/json': { schema: RoleResponseSchema } },
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
    404: {
      description: 'Role not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Cannot modify locked role',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

rbacRouter.patch(
  '/roles/:id',
  requirePermission('user', 'update'),
  validateBody(roleUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateRole(
        req.params.id,
        req.validatedBody as z.infer<typeof roleUpdateSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── DELETE /rbac/roles/:id ─── */
registry.registerPath({
  method: 'delete',
  path: '/roles/{id}',
  tags: ['RBAC'],
  description: 'Delete a role',
  request: { params: RoleIdParamSchema },
  responses: {
    204: { description: 'Role deleted' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Role not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Cannot delete locked role',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

rbacRouter.delete(
  '/roles/:id',
  requirePermission('user', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteRole(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /rbac/permissions ─── */
registry.registerPath({
  method: 'get',
  path: '/permissions',
  tags: ['RBAC'],
  description: 'List all available permissions',
  responses: {
    200: {
      description: 'List of permissions',
      content: { 'application/json': { schema: PermissionListResponseSchema } },
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

rbacRouter.get(
  '/permissions',
  requirePermission('user', 'read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listPermissions();
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /rbac/assign ─── */
registry.registerPath({
  method: 'post',
  path: '/assign',
  tags: ['RBAC'],
  description: 'Assign a role to a user',
  request: {
    body: {
      description: 'Assignment payload',
      content: { 'application/json': { schema: AssignRoleInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Role assigned',
      content: { 'application/json': { schema: MessageResponseSchema } },
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
    404: {
      description: 'User or role not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

rbacRouter.post(
  '/assign',
  requirePermission('user', 'update'),
  validateBody(AssignRoleInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.validatedBody as z.infer<typeof AssignRoleInputSchema>;
      const authReq = req as any;
      await assignRole(body.userId, body.roleId, body.propertyId, authReq.auth?.user?.id);
      res.json({ message: 'Role assigned successfully' });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /rbac/unassign ─── */
registry.registerPath({
  method: 'post',
  path: '/unassign',
  tags: ['RBAC'],
  description: 'Remove a role assignment from a user',
  request: {
    body: {
      description: 'Unassignment payload',
      content: { 'application/json': { schema: UnassignRoleInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Role unassigned',
      content: { 'application/json': { schema: MessageResponseSchema } },
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

rbacRouter.post(
  '/unassign',
  requirePermission('user', 'update'),
  validateBody(UnassignRoleInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.validatedBody as z.infer<typeof UnassignRoleInputSchema>;
      await unassignRole(body.userId, body.roleId, body.propertyId);
      res.json({ message: 'Role unassigned successfully' });
    } catch (err) {
      next(err);
    }
  }
);
