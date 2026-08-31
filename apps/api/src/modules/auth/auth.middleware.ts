import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from './auth.service.js';
import { AppError } from '../../common/errors.js';
import { prisma } from '../../common/prisma.js';

export interface AuthenticatedRequest extends Request {
  auth: TokenPayload & { user: { id: string; email: string; role: string; tenantId: string } };
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'Missing or invalid authorization header', 'UNAUTHORIZED'));
    return;
  }

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

    (req as AuthenticatedRequest).auth = {
      ...payload,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.auth) {
      next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
      return;
    }
    if (!allowedRoles.includes(authReq.auth.role)) {
      next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
      return;
    }
    next();
  };
}

export function tenantScope() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.auth) {
      next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
      return;
    }
    req.tenantId = authReq.auth.tenantId;
    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
    }
  }
}
