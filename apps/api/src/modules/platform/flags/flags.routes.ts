import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../../common/errors.js';
import { requirePlatformRole, requireStepUp } from '../platform.middleware.js';
import * as svc from './flags.service.js';

export const flagsRouter = Router();
const SUPER = ['platform_super_admin'] as const;

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

const createSchema = z.object({
  key: z.string().min(2),
  description: z.string().min(3),
  owner: z.string().min(2),
  defaultValue: z.boolean().optional(),
  environment: z.string().optional(),
  rolloutStrategy: z.record(z.any()).optional(),
});
const overrideSchema = z.object({
  tenantId: z.string().min(1),
  value: z.boolean(),
  reason: z.string().min(3),
});

flagsRouter.get(
  '/flags',
  requirePlatformRole(...SUPER, 'platform_support', 'platform_read_only'),
  async (_req, res, next) => {
    try {
      res.json({ data: await svc.listFlags() });
    } catch (e) {
      next(e);
    }
  }
);
flagsRouter.post('/flags', requirePlatformRole(...SUPER), requireStepUp, async (req, res, next) => {
  try {
    const b = parseBody(createSchema, req.body ?? {});
    res.status(201).json({ data: await svc.createFlag({ ...b, actorEmail: req.platform!.email }) });
  } catch (e) {
    next(e);
  }
});
flagsRouter.post(
  '/flags/:id/toggle',
  requirePlatformRole(...SUPER),
  requireStepUp,
  async (req, res, next) => {
    try {
      const flag = await svc.setFlagDefault(
        req.params.id,
        Boolean((req.body ?? {}).value),
        req.platform!.email
      );
      res.json({ data: flag });
    } catch (e) {
      next(e);
    }
  }
);
flagsRouter.post(
  '/flags/:id/overrides',
  requirePlatformRole(...SUPER),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(overrideSchema, req.body ?? {});
      res
        .status(201)
        .json({
          data: await svc.setOverride(req.params.id, { ...b, actorEmail: req.platform!.email }),
        });
    } catch (e) {
      next(e);
    }
  }
);
flagsRouter.delete(
  '/flags/overrides/:overrideId',
  requirePlatformRole(...SUPER),
  requireStepUp,
  async (req, res, next) => {
    try {
      await svc.removeOverride(req.params.overrideId, req.platform!.email);
      res.json({ data: { removed: true } });
    } catch (e) {
      next(e);
    }
  }
);
flagsRouter.post(
  '/flags/:id/kill',
  requirePlatformRole(...SUPER),
  requireStepUp,
  async (req, res, next) => {
    try {
      const reason = String((req.body ?? {}).reason ?? 'killed');
      res.json({ data: await svc.killFlag(req.params.id, req.platform!.email, reason) });
    } catch (e) {
      next(e);
    }
  }
);
flagsRouter.get('/demo-gated', async (req, res, next) => {
  try {
    res.json({ data: await svc.evaluateFlag('demo-gated', (req as any).auth?.user?.tenantId) });
  } catch (e) {
    next(e);
  }
});
