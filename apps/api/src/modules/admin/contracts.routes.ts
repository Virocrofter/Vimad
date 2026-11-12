// apps/api/src/modules/admin/contracts.routes.ts
// Mounted at /api/admin/billing/contracts (see admin.routes.ts).
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';
import {
  listContracts,
  getContract,
  createContract,
  signContract,
  activateContract,
  cancelContract,
  renewContract,
  amendContract,
  approveDiscount,
} from './contracts.service.js';

export const contractsRouter = Router();

const actorOf = (req: Request) => (req as any).user?.email || 'platform-admin';

const CreateSchema = z.object({
  tenantId: z.string().min(1),
  legalEntity: z.string().min(1),
  modules: z.array(z.string()).default([]),
  roomBand: z.string().optional(),
  currency: z.string().default('ZAR'),
  listFee: z.number().positive(),
  netFee: z.number().positive(),
  renewalFee: z.number().positive().optional(),
  discountPct: z.number().min(0).max(100).optional(),
  discountApprovedBy: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  renewalNoticeDays: z.number().int().min(0).default(30),
  autoRenew: z.boolean().default(false),
  paymentMethod: z.string().default('invoice'),
  signatories: z.array(z.any()).default([]),
  documentUrl: z.string().optional(),
  dataUseConsent: z.boolean().optional(),
});

const AmendSchema = z.object({
  listFee: z.number().positive().optional(),
  netFee: z.number().positive().optional(),
  renewalFee: z.number().positive().optional(),
  discountPct: z.number().min(0).max(100).optional(),
  discountApprovedBy: z.string().optional(),
  modules: z.array(z.string()).optional(),
  roomBand: z.string().nullable().optional(),
  endDate: z.string().optional(),
  autoRenew: z.boolean().optional(),
  renewalNoticeDays: z.number().int().min(0).optional(),
  reason: z.string().optional(),
});

contractsRouter.use(authMiddleware, requireAdminRole);

contractsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, q } = req.query as { status?: string; q?: string };
    res.json(await listContracts({ status, q }));
  } catch (err) {
    next(err);
  }
});

contractsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getContract(req.params.id));
  } catch (err) {
    next(err);
  }
});

contractsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = CreateSchema.parse(req.body);
    res.status(201).json(await createContract(actorOf(req), data));
  } catch (err) {
    next(err);
  }
});

contractsRouter.post('/:id/sign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await signContract(req.params.id, actorOf(req), req.body ?? {}));
  } catch (err) {
    next(err);
  }
});

contractsRouter.post('/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await activateContract(req.params.id, actorOf(req)));
  } catch (err) {
    next(err);
  }
});

contractsRouter.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(
      await cancelContract(req.params.id, actorOf(req), String((req.body as any)?.reason ?? ''))
    );
  } catch (err) {
    next(err);
  }
});

contractsRouter.post('/:id/renew', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await renewContract(req.params.id, actorOf(req), req.body ?? {}));
  } catch (err) {
    next(err);
  }
});

contractsRouter.post('/:id/amend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = AmendSchema.parse(req.body);
    res.json(await amendContract(req.params.id, actorOf(req), data));
  } catch (err) {
    next(err);
  }
});

contractsRouter.post(
  '/:id/approve-discount',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await approveDiscount(
          req.params.id,
          actorOf(req),
          String((req.body as any)?.approver ?? '')
        )
      );
    } catch (err) {
      next(err);
    }
  }
);
