/* apps/api/src/modules/auth/auth.middleware.ts */
import type { Request, Response, NextFunction } from 'express';
import { validateApiKey, type ApiKeyContext } from '../rbac/api-key.service.js';
import { verifyToken, type TokenPayload } from './auth.service.js';
import { AppError } from '../../common/errors.js';
import { prisma } from '../../common/prisma.js';

export interface AuthenticatedRequest extends Request {
  auth: TokenPayload & {
    user: {
      lastName: string;
      firstName: string;
      id: string;
      email: string;
      role: string;
      tenantId: string;
      permissions: string[];
    };
  };
}

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKey: ApiKeyContext;
}

// ─── Resolve user permissions from roles ───
async function resolvePermissions(userId: string): Promise<string[]> {
  const assignments = await prisma.roleAssignment.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  // No explicit assignments — fall back to the global role matching user.role
  // (seed creates global roles 'Owner'/'Admin'/'Manager'/'Staff'/'Housekeeper')
  if (assignments.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return [];

    const role = await prisma.role.findFirst({
      where: { name: { equals: user.role, mode: 'insensitive' }, tenantId: null },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) return [];

    return role.rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`);
  }

  const perms = new Set<string>();
  for (const assignment of assignments) {
    for (const rp of assignment.role.rolePermissions) {
      perms.add(`${rp.permission.resource}:${rp.permission.action}`);
    }
  }
  return [...perms];
}

// ─── Auth Middleware (JWT or API key) ───
export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Try JWT Bearer token first
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.status !== 'active' || user.tenantId !== payload.tenantId) {
        next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
        return;
      }

      // Resolve granular permissions
      const permissions = await resolvePermissions(user.id);

      (req as AuthenticatedRequest).auth = {
        ...payload,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          role: user.role,
          tenantId: user.tenantId,
          permissions,
        },
      };
      next();
      return;
    } catch {
      next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
      return;
    }
  }

  // Fall back to API key authentication
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;
  if (apiKeyHeader) {
    try {
      const context = await validateApiKey(apiKeyHeader);
      (req as AuthenticatedRequest & ApiKeyAuthenticatedRequest).auth = {
        userId: context.id,
        tenantId: context.tenantId,
        email: `api-key:${context.name}`,
        role: 'api_key',
        user: {
          id: context.id,
          email: `api-key:${context.name}`,
          firstName: 'API',
          lastName: 'Key',
          role: 'api_key',
          tenantId: context.tenantId,
          permissions: context.scopes,
        },
      };
      (req as ApiKeyAuthenticatedRequest).apiKey = context;
      next();
      return;
    } catch (err) {
      next(err);
      return;
    }
  }

  next(new AppError(401, 'Missing or invalid authorization header', 'UNAUTHORIZED'));
}

// ─── Permission-based middleware ───
export function requirePermission(resource: string, action: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.auth) {
      next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const perms = authReq.auth.user.permissions;
    const hasPermission = perms.includes('*') || perms.includes(`${resource}:${action}`);

    if (!hasPermission) {
      next(new AppError(403, `Permission denied: ${resource}:${action} required`, 'FORBIDDEN'));
      return;
    }
    next();
  };
}

// ─── Check multiple permissions (any) ───
export function requireAnyPermission(...requiredPerms: [string, string][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.auth) {
      next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const perms = authReq.auth.user.permissions;
    const hasAny =
      perms.includes('*') ||
      requiredPerms.some(([resource, action]) => perms.includes(`${resource}:${action}`));

    if (!hasAny) {
      next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
      return;
    }
    next();
  };
}

// ─── Check all permissions ───
export function requireAllPermissions(...requiredPerms: [string, string][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.auth) {
      next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const perms = authReq.auth.user.permissions;
    if (perms.includes('*')) {
      next();
      return;
    }

    const missing = requiredPerms.filter(
      ([resource, action]) => !perms.includes(`${resource}:${action}`)
    );

    if (missing.length > 0) {
      next(
        new AppError(
          403,
          `Missing permissions: ${missing.map(([r, a]) => `${r}:${a}`).join(', ')}`,
          'FORBIDDEN'
        )
      );
      return;
    }
    next();
  };
}

// ─── Tenant scope ───
// NOTE: plain middleware, used bare — router.use(authMiddleware, tenantScope).
// Do NOT convert to a factory; all 16 routers pass it without ().
export function tenantScope(req: Request, _res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth) {
    next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    return;
  }
  req.tenantId = authReq.auth.tenantId;
  next();
}

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
    }
  }
}
