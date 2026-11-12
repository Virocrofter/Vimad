import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../../common/prisma.js';
import { AppError } from '../../../common/errors.js';
import { requirePlatformRole, requireStepUp, PLATFORM_ROLES } from '../platform.middleware.js';
import * as svc from './identity.service.js';

export const identityRouter = Router();

function parseBody(schema: any, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success)
    throw new AppError(
      400,
      result.error.issues[0]?.message ?? 'Validation failed',
      'VALIDATION_ERROR'
    );
  return result.data;
}

const grantSchema = z.object({
  email: z.string().email(),
  role: z.enum([...PLATFORM_ROLES]),
  reason: z.string().min(3),
});
const roleSchema = z.object({ role: z.enum([...PLATFORM_ROLES]), reason: z.string().min(3) });
const revokeSchema = z.object({ reason: z.string().min(3) });
const stepUpSchema = z.object({ password: z.string().min(1) });

identityRouter.get('/me', async (req, res) => {
  const p = req.platform!;
  const operator = await prisma.platformOperator.findUnique({ where: { id: p.operatorId } });
  res.json({
    data: {
      email: p.email,
      role: p.role,
      stepUp: p.stepUp,
      mfaEnrolled: operator?.mfaEnrolled ?? false,
      lastActiveAt: operator?.lastActiveAt ?? null,
      sessionRole: (req as any).auth?.user?.role ?? null,
    },
  });
});

identityRouter.get('/operators', requirePlatformRole('platform_super_admin'), async (_req, res) => {
  res.json({ data: await svc.listOperators() });
});
identityRouter.post(
  '/operators',
  requirePlatformRole('platform_super_admin'),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(grantSchema, req.body ?? {});
      res
        .status(201)
        .json({
          data: await svc.grantOperator({
            email: b.email,
            role: b.role as any,
            reason: b.reason,
            actorEmail: req.platform!.email,
          }),
        });
    } catch (e) {
      next(e);
    }
  }
);
identityRouter.patch(
  '/operators/:id',
  requirePlatformRole('platform_super_admin'),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(roleSchema, req.body ?? {});
      res.json({
        data: await svc.updateOperatorRole(
          req.params.id,
          b.role as any,
          req.platform!.email,
          b.reason
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);
identityRouter.post(
  '/operators/:id/revoke',
  requirePlatformRole('platform_super_admin'),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(revokeSchema, req.body ?? {});
      res.json({ data: await svc.revokeOperator(req.params.id, b.reason, req.platform!.email) });
    } catch (e) {
      next(e);
    }
  }
);
identityRouter.post(
  '/operators/:id/reactivate',
  requirePlatformRole('platform_super_admin'),
  requireStepUp,
  async (req, res, next) => {
    try {
      const reason =
        typeof (req.body ?? {}).reason === 'string' ? (req.body as any).reason : undefined;
      res.json({ data: await svc.reactivateOperator(req.params.id, req.platform!.email, reason) });
    } catch (e) {
      next(e);
    }
  }
);
identityRouter.post('/identity/step-up', async (req, res, next) => {
  try {
    const { password } = parseBody(stepUpSchema, req.body ?? {});
    const user = await prisma.user.findFirst({
      where: { email: req.platform!.email },
      select: { passwordHash: true },
    });
    const ok = user?.passwordHash && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw new AppError(403, 'Step-up authentication failed', 'STEP_UP_REQUIRED');
    const token = jwt.sign(
      { sub: req.platform!.email, typ: 'step-up' },
      process.env.JWT_SECRET as string,
      { expiresIn: '10m' }
    );
    res.json({ data: { stepUpToken: token, expiresInMinutes: 10 } });
  } catch (e) {
    next(e);
  }
});
identityRouter.get(
  '/break-glass/status',
  requirePlatformRole('platform_super_admin'),
  async (_req, res) => {
    const activeSuperAdmins = await prisma.platformOperator.count({
      where: { role: 'platform_super_admin', status: 'active' },
    });
    const envEntries = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean).length;
    res.json({
      data: { armed: activeSuperAdmins === 0 && envEntries > 0, activeSuperAdmins, envEntries },
    });
  }
);
