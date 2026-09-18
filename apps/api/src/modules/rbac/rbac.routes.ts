import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import {
  authMiddleware,
  tenantScope,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import {
  ErrorResponseSchema,
  IdParamSchema,
  MessageResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  assignRole,
  listPermissions,
  listRoles,
  listUserRoles,
  removeRoleAssignment,
  roleAssignmentSchema,
} from './rbac.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const permissionSchema = z
  .object({
    id: z.string(),
    resource: z.string(),
    action: z.string(),
    description: z.string().nullable(),
    category: z.string(),
  })
  .openapi('Permission');

const roleSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    type: z.string(),
    isDefault: z.boolean(),
    isLocked: z.boolean(),
    tenantId: z.string().nullable(),
    permissions: z.array(z.string()),
    assignmentCount: z.number().int(),
  })
  .openapi('Role');

const roleListResponseSchema = z.object({ data: z.array(roleSchema) }).openapi('RoleListResponse');
const permissionListResponseSchema = z
  .object({ data: z.array(permissionSchema) })
  .openapi('PermissionListResponse');

const roleAssignmentSchemaOut = z
  .object({
    id: z.string(),
    userId: z.string(),
    roleId: z.string(),
    propertyId: z.string().nullable(),
    assignedAt: z.string().datetime(),
    role: roleSchema.omit({ permissions: true, assignmentCount: true }),
  })
  .openapi('RoleAssignment');
const roleAssignmentListResponseSchema = z
  .object({ data: z.array(roleAssignmentSchemaOut) })
  .openapi('RoleAssignmentListResponse');

export const rbacRouter = Router();

rbacRouter.use(authMiddleware, tenantScope);

// ─── Roles ───

registry.registerPath({
  method: 'get',
  path: '/rbac/roles',
  tags: ['RBAC'],
  description: 'List roles available to the tenant (platform-wide + tenant-scoped)',
  responses: {
    200: {
      description: 'List of roles',
      content: { 'application/json': { schema: roleListResponseSchema } },
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
      const roles = await listRoles(req.tenantId);
      res.json({
        data: roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          type: role.type,
          isDefault: role.isDefault,
          isLocked: role.isLocked,
          tenantId: role.tenantId,
          permissions: role.rolePermissions.map(
            (rp) => `${rp.permission.resource}:${rp.permission.action}`
          ),
          assignmentCount: role._count.roleAssignments,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Permissions ───

registry.registerPath({
  method: 'get',
  path: '/rbac/permissions',
  tags: ['RBAC'],
  description: 'List all permissions in the system',
  responses: {
    200: {
      description: 'List of permissions',
      content: { 'application/json': { schema: permissionListResponseSchema } },
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
      const permissions = await listPermissions();
      res.json({ data: permissions });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Role assignments ───

registry.registerPath({
  method: 'get',
  path: '/rbac/users/{id}/roles',
  tags: ['RBAC'],
  description: 'List role assignments for a user',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'User role assignments',
      content: { 'application/json': { schema: roleAssignmentListResponseSchema } },
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
      description: 'User not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

rbacRouter.get(
  '/users/:id/roles',
  requirePermission('user', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assignments = await listUserRoles(req.params.id, req.tenantId);
      res.json({
        data: assignments.map((assignment) => ({
          id: assignment.id,
          userId: assignment.userId,
          roleId: assignment.roleId,
          propertyId: assignment.propertyId,
          assignedAt: assignment.assignedAt,
          role: {
            id: assignment.role.id,
            name: assignment.role.name,
            description: assignment.role.description,
            type: assignment.role.type,
            isDefault: assignment.role.isDefault,
            isLocked: assignment.role.isLocked,
            tenantId: assignment.role.tenantId,
          },
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/rbac/users/{id}/roles',
  tags: ['RBAC'],
  description: 'Assign a role to a user (optionally scoped to a property)',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Role assignment payload',
      content: {
        'application/json': { schema: roleAssignmentSchema.openapi('RoleAssignmentCreate') },
      },
    },
  },
  responses: {
    201: {
      description: 'Role assigned',
      content: { 'application/json': { schema: z.object({ data: roleAssignmentSchemaOut }) } },
    },
    400: {
      description: 'Invalid payload',
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
      description: 'User, role, or property not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Role already assigned',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

rbacRouter.post(
  '/users/:id/roles',
  requirePermission('user', 'update'),
  validateBody(roleAssignmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const assignment = await assignRole(
        req.params.id,
        req.tenantId,
        req.validatedBody as z.infer<typeof roleAssignmentSchema>,
        authReq.auth.user.id
      );
      res.status(201).json({
        data: {
          id: assignment.id,
          userId: assignment.userId,
          roleId: assignment.roleId,
          propertyId: assignment.propertyId,
          assignedAt: assignment.assignedAt,
          role: {
            id: assignment.role.id,
            name: assignment.role.name,
            description: assignment.role.description,
            type: assignment.role.type,
            isDefault: assignment.role.isDefault,
            isLocked: assignment.role.isLocked,
            tenantId: assignment.role.tenantId,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'delete',
  path: '/rbac/users/{id}/roles/{roleId}',
  tags: ['RBAC'],
  description: 'Remove a role assignment from a user',
  request: {
    params: z.object({ id: z.string(), roleId: z.string() }).openapi('RoleAssignmentParams'),
    query: z.object({ propertyId: z.string().optional() }).openapi('RoleAssignmentDeleteQuery'),
  },
  responses: {
    200: {
      description: 'Role assignment removed',
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
      description: 'User or assignment not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

rbacRouter.delete(
  '/users/:id/roles/:roleId',
  requirePermission('user', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId =
        req.query.propertyId && typeof req.query.propertyId === 'string'
          ? req.query.propertyId
          : undefined;
      await removeRoleAssignment(req.params.id, req.tenantId, req.params.roleId, propertyId);
      res.json({ message: 'Role assignment removed' });
    } catch (err) {
      next(err);
    }
  }
);
