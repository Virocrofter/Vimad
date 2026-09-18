/* apps/api/src/modules/admin/admin.middleware.ts */
import type { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { AppError } from '../../common/errors.js';

/**
 * Restricts access to platform-level admin endpoints.
 * Only users with role 'owner' or 'admin' can access.
 * Use AFTER authMiddleware.
 */
export function requireAdminRole(req: Request, _res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth) {
    next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    return;
  }

  const role = authReq.auth.user.role;
  if (role !== 'owner' && role !== 'admin') {
    next(new AppError(403, 'Admin access required', 'FORBIDDEN'));
    return;
  }

  next();
}
