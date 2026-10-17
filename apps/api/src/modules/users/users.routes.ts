/* apps/api/src/modules/users/users.routes.ts
 * Tenant-scoped staff user management. Fills the gap: the app had auth
 * (self-service) and RBAC (roles/permissions) but no endpoints to list,
 * create, edit, suspend, or audit staff accounts.
 */
import { Router } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { env } from '../../common/env.js';
import { logger } from '../../common/logger.js';

export const usersRouter = Router();
usersRouter.use(authMiddleware);

/* ─── Schemas ─── */
const listQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.string().optional(),
  role: z.string().optional(),
});

const idParamsSchema = z.object({ id: z.string().min(1) });

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['owner', 'admin', 'manager', 'staff', 'housekeeper']).default('staff'),
  phone: z.string().max(30).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).nullable().optional(),
  role: z.enum(['owner', 'admin', 'manager', 'staff', 'housekeeper']).optional(),
});

const statusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
  reason: z.string().max(500).optional(),
});

const rolesSchema = z.object({ roleIds: z.array(z.string().min(1)) });

const activityQuerySchema = paginationSchema.extend({});

/* ─── Helpers ─── */
type AuthReq = AuthenticatedRequest & {
  auth: { tenantId: string; user: { id: string; role: string } };
};

function toSafeUser(u: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

async function audit(
  tenantId: string,
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  metadata?: Record<string, unknown>,
  req?: AuthReq
) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entity,
        entityId,
        metadata: metadata as object | undefined,
        ipAddress: req?.ip,
        userAgent: req?.get('user-agent'),
      },
    });
  } catch (err) {
    logger.warn({ err, action }, 'failed to write user-management audit log');
  }
}

/** Latest login + login count per user from audit_logs (action contains "login"). */
async function loginStats(tenantId: string, userIds: string[]) {
  if (userIds.length === 0)
    return new Map<string, { lastLoginAt: Date | null; loginCount: number }>();
  const rows = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: { tenantId, userId: { in: userIds }, action: { contains: 'login' } },
    _max: { createdAt: true },
    _count: { _all: true },
  });
  return new Map(
    rows.map((r) => [r.userId, { lastLoginAt: r._max.createdAt, loginCount: r._count._all }])
  );
}

/** Last login IP per user (most recent login row with an ipAddress). */
async function lastLoginIps(tenantId: string, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, string>();
  const rows = await prisma.auditLog.findMany({
    where: {
      tenantId,
      userId: { in: userIds },
      action: { contains: 'login' },
      ipAddress: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    select: { userId: true, ipAddress: true },
    distinct: ['userId'],
  });
  return new Map(rows.map((r) => [r.userId, r.ipAddress as string]));
}

/* ─── GET /v1/users — list & search ─── */
usersRouter.get(
  '/',
  requirePermission('user', 'read'),
  validateQuery(listQuerySchema),
  async (req, res, next) => {
    try {
      const { tenantId } = (req as AuthReq).auth;
      const { page, pageSize, search, status, role } = req.validatedQuery as z.infer<
        typeof listQuerySchema
      >;

      const where = {
        tenantId,
        ...(status ? { status } : {}),
        ...(role ? { role } : {}),
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            roleAssignments: { include: { role: { select: { id: true, name: true } } } },
          },
        }),
      ]);

      const stats = await loginStats(
        tenantId,
        users.map((u) => u.id)
      );

      res.json({
        data: users.map((u) => ({
          ...toSafeUser(u),
          roles: u.roleAssignments.map((ra) => ra.role),
          lastLoginAt: stats.get(u.id)?.lastLoginAt ?? null,
          loginCount: stats.get(u.id)?.loginCount ?? 0,
        })),
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /v1/users/:id — detail ─── */
usersRouter.get(
  '/:id',
  requirePermission('user', 'read'),
  validateParams(idParamsSchema),
  async (req, res, next) => {
    try {
      const { tenantId } = (req as AuthReq).auth;
      const user = await prisma.user.findFirst({
        where: { id: (req.validatedParams as z.infer<typeof idParamsSchema>).id, tenantId },
        include: {
          roleAssignments: {
            include: {
              role: { select: { id: true, name: true, description: true, isLocked: true } },
            },
          },
        },
      });
      if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND');

      const [stats, ips, sessions] = await Promise.all([
        loginStats(tenantId, [user.id]),
        lastLoginIps(tenantId, [user.id]),
        prisma.refreshToken.count({
          where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
        }),
      ]);

      res.json({
        data: {
          ...toSafeUser(user),
          roles: user.roleAssignments.map((ra) => ra.role),
          lastLoginAt: stats.get(user.id)?.lastLoginAt ?? null,
          loginCount: stats.get(user.id)?.loginCount ?? 0,
          lastLoginIp: ips.get(user.id) ?? null,
          activeSessions: sessions,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /v1/users — create ─── */
usersRouter.post(
  '/',
  requirePermission('user', 'create'),
  validateBody(createUserSchema),
  async (req, res, next) => {
    try {
      const { tenantId, user: authUser } = (req as AuthReq).auth;
      const body = req.validatedBody as z.infer<typeof createUserSchema>;

      const existing = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId, email: body.email.toLowerCase() } },
      });
      if (existing) throw new AppError(409, 'A user with this email already exists', 'EMAIL_TAKEN');

      const passwordHash = await bcrypt.hash(body.password, 10);
      const user = await prisma.user.create({
        data: {
          tenantId,
          email: body.email.toLowerCase(),
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
          role: body.role,
          passwordHash,
          status: 'active',
        },
      });

      await audit(
        tenantId,
        authUser.id,
        'user.create',
        'user',
        user.id,
        { email: user.email },
        req as AuthReq
      );
      res.status(201).json({ data: toSafeUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── PATCH /v1/users/:id — update profile/role ─── */
usersRouter.patch(
  '/:id',
  requirePermission('user', 'update'),
  validateParams(idParamsSchema),
  validateBody(updateUserSchema),
  async (req, res, next) => {
    try {
      const { tenantId, user: authUser } = (req as AuthReq).auth;
      const { id } = req.validatedParams as z.infer<typeof idParamsSchema>;
      const body = req.validatedBody as z.infer<typeof updateUserSchema>;

      const target = await prisma.user.findFirst({ where: { id, tenantId } });
      if (!target) throw new AppError(404, 'User not found', 'NOT_FOUND');

      if (id === authUser.id && body.role && body.role !== target.role) {
        throw new AppError(400, 'You cannot change your own role', 'SELF_ROLE_CHANGE');
      }
      if (body.email && body.email.toLowerCase() !== target.email) {
        const clash = await prisma.user.findUnique({
          where: { tenantId_email: { tenantId, email: body.email.toLowerCase() } },
        });
        if (clash) throw new AppError(409, 'A user with this email already exists', 'EMAIL_TAKEN');
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
          ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
          ...(body.email !== undefined ? { email: body.email.toLowerCase() } : {}),
          ...(body.phone !== undefined ? { phone: body.phone } : {}),
          ...(body.role !== undefined ? { role: body.role } : {}),
        },
      });

      await audit(
        tenantId,
        authUser.id,
        'user.update',
        'user',
        id,
        { fields: Object.keys(body) },
        req as AuthReq
      );
      res.json({ data: toSafeUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── PATCH /v1/users/:id/status — suspend / reactivate ─── */
usersRouter.patch(
  '/:id/status',
  requirePermission('user', 'update'),
  validateParams(idParamsSchema),
  validateBody(statusSchema),
  async (req, res, next) => {
    try {
      const { tenantId, user: authUser } = (req as AuthReq).auth;
      const { id } = req.validatedParams as z.infer<typeof idParamsSchema>;
      const { status, reason } = req.validatedBody as z.infer<typeof statusSchema>;

      if (id === authUser.id)
        throw new AppError(400, 'You cannot change your own status', 'SELF_STATUS_CHANGE');

      const target = await prisma.user.findFirst({ where: { id, tenantId } });
      if (!target) throw new AppError(404, 'User not found', 'NOT_FOUND');

      const user = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({ where: { id }, data: { status } });
        if (status !== 'active') {
          // Suspending/inactivating kills every live session immediately.
          await tx.refreshToken.updateMany({
            where: { userId: id, revokedAt: null },
            data: { revokedAt: new Date(), revokedReason: reason ?? `Account ${status}` },
          });
        }
        return updated;
      });

      await audit(
        tenantId,
        authUser.id,
        `user.${status}`,
        'user',
        id,
        { previousStatus: target.status, reason },
        req as AuthReq
      );
      res.json({ data: toSafeUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── PUT /v1/users/:id/roles — replace role assignments ─── */
usersRouter.put(
  '/:id/roles',
  requirePermission('user', 'update'),
  validateParams(idParamsSchema),
  validateBody(rolesSchema),
  async (req, res, next) => {
    try {
      const { tenantId, user: authUser } = (req as AuthReq).auth;
      const { id } = req.validatedParams as z.infer<typeof idParamsSchema>;
      const { roleIds } = req.validatedBody as z.infer<typeof rolesSchema>;

      if (id === authUser.id)
        throw new AppError(400, 'Manage your own roles from your profile', 'SELF_ROLE_CHANGE');

      const target = await prisma.user.findFirst({ where: { id, tenantId } });
      if (!target) throw new AppError(404, 'User not found', 'NOT_FOUND');

      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds }, OR: [{ tenantId }, { tenantId: null }] },
      });
      if (roles.length !== roleIds.length)
        throw new AppError(400, 'One or more roles are invalid', 'INVALID_ROLE');

      await prisma.$transaction([
        prisma.roleAssignment.deleteMany({ where: { userId: id } }),
        prisma.roleAssignment.createMany({
          data: roles.map((r) => ({ userId: id, roleId: r.id, assignedBy: authUser.id })),
        }),
      ]);

      await audit(
        tenantId,
        authUser.id,
        'user.roles_update',
        'user',
        id,
        { roleIds },
        req as AuthReq
      );
      res.json({ data: { userId: id, roleIds } });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── POST /v1/users/:id/reset-password — mint a reset link ─── */
usersRouter.post(
  '/:id/reset-password',
  requirePermission('user', 'update'),
  validateParams(idParamsSchema),
  async (req, res, next) => {
    try {
      const { tenantId, user: authUser } = (req as AuthReq).auth;
      const { id } = req.validatedParams as z.infer<typeof idParamsSchema>;

      const target = await prisma.user.findFirst({ where: { id, tenantId } });
      if (!target) throw new AppError(404, 'User not found', 'NOT_FOUND');

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.passwordReset.create({
        data: { userId: id, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });

      await audit(
        tenantId,
        authUser.id,
        'user.reset_password',
        'user',
        id,
        undefined,
        req as AuthReq
      );
      res.json({
        data: {
          resetUrl: `${env.WEB_URL}/auth/forgot-password?token=${token}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── GET /v1/users/:id/activity — audit trail for one user ─── */
usersRouter.get(
  '/:id/activity',
  requirePermission('user', 'read'),
  validateParams(idParamsSchema),
  validateQuery(activityQuerySchema),
  async (req, res, next) => {
    try {
      const { tenantId } = (req as AuthReq).auth;
      const { id } = req.validatedParams as z.infer<typeof idParamsSchema>;
      const { page, pageSize } = req.validatedQuery as z.infer<typeof activityQuerySchema>;

      const where = { tenantId, userId: id };
      const [total, items] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      res.json({
        data: items,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  }
);
