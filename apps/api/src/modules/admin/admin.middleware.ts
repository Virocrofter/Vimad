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
  // B0: platform-admin is env-designated (email), fail-closed. Tenant
  // 'owner'/'admin' roles must NOT pass — every hotel tenant's registering
  // user is 'owner' (auth.service), so the role check below alone is a
  // privilege escalation. Unset env = /admin disabled for everyone, loudly.
  const platformAdmins = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (platformAdmins.length === 0) {
    next(
      new AppError(
        503,
        'PLATFORM_ADMIN_EMAILS is not configured; /admin is disabled (fail-closed)',
        'PLATFORM_ADMIN_UNSET'
      )
    );
    return;
  }
  if (!platformAdmins.includes((authReq.auth.user.email ?? '').toLowerCase())) {
    next(new AppError(403, 'Platform admin only', 'FORBIDDEN'));
    return;
  }

  if (!authReq.auth) {
    next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
    return;
  }

  // Designated email IS the platform-admin credential — no role check below
  // (the old owner/admin role check let every hotel tenant owner in).
  next();
}
