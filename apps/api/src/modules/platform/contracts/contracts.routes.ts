import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../../common/errors.js';
import { requirePlatformRole, requireStepUp } from '../platform.middleware.js';
import * as svc from './contracts.service.js';

export const contractsRouter = Router();
const FINANCE = ['platform_super_admin', 'platform_finance'] as const;

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
  tenantId: z.string().min(1),
  legalEntity: z.string().min(2),
  modules: z.array(z.string()).optional(),
  roomBand: z.string().optional(),
  currency: z.string().optional(),
  listFee: z.number().positive(),
  netFee: z.number().positive(),
  discountApprovedBy: z.string().optional(),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  renewalNoticeDays: z.number().int().optional(),
  autoRenew: z.boolean().optional(),
  paymentMethod: z.string().optional(),
  signatories: z.array(z.any()).optional(),
});

contractsRouter.get(
  '/contracts',
  requirePlatformRole(...FINANCE, 'platform_support'),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.listContracts((req.query as any).status) });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.get(
  '/contracts/exceptions',
  requirePlatformRole(...FINANCE),
  async (_req, res, next) => {
    try {
      res.json({ data: await svc.contractExceptions() });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.get(
  '/contracts/:id',
  requirePlatformRole(...FINANCE, 'platform_support'),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.contractDetail(req.params.id) });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.post(
  '/contracts',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      const b = parseBody(createSchema, req.body ?? {});
      res
        .status(201)
        .json({ data: await svc.createContract({ ...b, actorEmail: req.platform!.email }) });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.post(
  '/contracts/:id/submit',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      res.json({ data: await svc.submitContract(req.params.id, req.platform!.email) });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.post(
  '/contracts/:id/approve',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      res.json({ data: await svc.approveContract(req.params.id, req.platform!.email) });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.post(
  '/contracts/:id/sign',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      const url = String((req.body ?? {}).documentUrl ?? '');
      res.json({ data: await svc.signContract(req.params.id, url, req.platform!.email) });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.post(
  '/contracts/:id/activate',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      res.json({ data: await svc.activateContract(req.params.id, req.platform!.email) });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.patch(
  '/contracts/:id',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      res.json({
        data: await svc.amendContract(
          req.params.id,
          (req.body ?? {}).patch ?? {},
          req.platform!.email
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);
contractsRouter.post(
  '/contracts/:id/cancel',
  requirePlatformRole(...FINANCE),
  requireStepUp,
  async (req, res, next) => {
    try {
      res.json({
        data: await svc.cancelContract(
          req.params.id,
          String((req.body ?? {}).reason ?? 'cancelled'),
          req.platform!.email
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);
