// Platform identity guard - DB-backed operators only. Env = audited break-glass.
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';

export const PLATFORM_ROLES = [
  'platform_super_admin',
  'platform_support',
  'platform_finance',
  'platform_compliance',
  'platform_read_only',
] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export interface PlatformContext {
  operatorId: string;
  email: string;
  role: PlatformRole;
  stepUp: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      platform?: PlatformContext;
    }
  }
}

function breakGlassEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function platformGuard(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email: string | undefined = (req as any).auth?.user?.email;
    if (!email) throw new AppError(401, 'Authentication required', 'PLATFORM_AUTH_REQUIRED');
    const normalized = email.toLowerCase();
    let operator = await prisma.platformOperator.findUnique({ where: { email: normalized } });
    if (!operator || operator.status !== 'active') {
      const activeSupers = await prisma.platformOperator.count({
        where: { role: 'platform_super_admin', status: 'active' },
      });
      if (operator == null && activeSupers === 0 && breakGlassEmails().includes(normalized)) {
        operator = await prisma.platformOperator.create({
          data: {
            id: randomUUID(),
            email: normalized,
            role: 'platform_super_admin',
            status: 'active',
            grantedBy: 'break-glass',
          },
        });
        await prisma.platformAuditEvent.create({
          data: {
            id: randomUUID(),
            actorEmail: normalized,
            action: 'platform.breakglass.used',
            entity: 'platform_operator',
            entityId: operator.id,
            after: { role: operator.role },
            reason: 'break-glass bootstrap: no active super admin',
            source: 'break-glass',
          },
        });
      } else {
        throw new AppError(403, 'Platform access denied', 'ROLE_FORBIDDEN');
      }
    }
    req.platform = {
      operatorId: operator.id,
      email: operator.email,
      role: operator.role as PlatformRole,
      stepUp: false,
    };
    void prisma.platformOperator
      .update({ where: { id: operator.id }, data: { lastActiveAt: new Date() } })
      .catch(() => undefined);
    next();
  } catch (err) {
    next(err);
  }
}

export function requirePlatformRole(...roles: PlatformRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const p = req.platform;
    if (!p) return next(new AppError(401, 'Authentication required', 'PLATFORM_AUTH_REQUIRED'));
    if (!roles.includes(p.role))
      return next(new AppError(403, 'Insufficient platform role', 'ROLE_FORBIDDEN'));
    next();
  };
}

export function requireStepUp(req: Request, _res: Response, next: NextFunction): void {
  const p = req.platform;
  if (!p) return next(new AppError(401, 'Authentication required', 'PLATFORM_AUTH_REQUIRED'));
  const header = req.header('x-step-up-token');
  if (!header)
    return next(new AppError(403, 'Step-up authentication required', 'STEP_UP_REQUIRED'));
  try {
    const payload = jwt.verify(header, process.env.JWT_SECRET as string) as Record<string, unknown>;
    if (payload.typ !== 'step-up' || payload.sub !== p.email) throw new Error('bad step-up token');
    p.stepUp = true;
    next();
  } catch {
    next(new AppError(403, 'Step-up token invalid or expired', 'STEP_UP_REQUIRED'));
  }
}
