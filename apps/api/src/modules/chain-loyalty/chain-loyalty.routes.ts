/* apps/api/src/modules/chain-loyalty/chain-loyalty.routes.ts */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { authMiddleware } from '../auth/auth.middleware.js';
import { AppError } from '../../common/errors.js';
import * as svc from './chain-loyalty.service.js';

export const registry = new OpenAPIRegistry();

const router = Router();
router.use(authMiddleware);

type Authed = Request & {
  auth?: { tenantId: string; user?: { id?: string; role?: string } };
};

const ctx = (req: Request): { tenantId: string; userId: string | undefined } => {
  const a = (req as Authed).auth;
  if (!a?.tenantId) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  return { tenantId: a.tenantId, userId: a.user?.id };
};

const parseBody = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    throw new AppError(400, msg, 'VALIDATION_ERROR');
  }
  return r.data;
};

const h =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: (e: unknown) => void) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

const ConfigSchema = z.object({
  earnRate: z.number().positive().optional(),
  redeemValue: z.number().positive().optional(),
  tiers: z
    .array(z.object({ name: z.string().min(1).max(40), threshold: z.number().min(0) }))
    .max(10)
    .optional(),
});

const EarnSchema = z.object({
  guestId: z.string().min(1),
  amount: z.number().positive(),
  propertyId: z.string().optional(),
  description: z.string().max(255).optional(),
});

const RedeemSchema = z.object({
  guestId: z.string().min(1),
  points: z.number().positive(),
  propertyId: z.string().optional(),
  description: z.string().max(255).optional(),
});

router.get(
  '/config',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.getConfig(tenantId));
  })
);

router.put(
  '/config',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.saveConfig(tenantId, parseBody(ConfigSchema, req.body)));
  })
);

router.get(
  '/chain',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.chainBoard(tenantId));
  })
);

router.get(
  '/guests/:guestId',
  h(async (req, res) => {
    const { tenantId } = ctx(req);
    res.json(await svc.guestChainView(tenantId, req.params.guestId));
  })
);

router.post(
  '/earn',
  h(async (req, res) => {
    const { tenantId, userId } = ctx(req);
    const body = parseBody(EarnSchema, req.body);
    res.status(201).json(await svc.earn(tenantId, userId, body));
  })
);

router.post(
  '/redeem',
  h(async (req, res) => {
    const { tenantId, userId } = ctx(req);
    const body = parseBody(RedeemSchema, req.body);
    res.status(201).json(await svc.redeem(tenantId, userId, body));
  })
);

registry.registerPath({
  method: 'get',
  path: '/v1/chain-loyalty/chain',
  summary: 'Chain-wide loyalty board (liability, tiers, activity by property)',
  responses: { 200: { description: 'Chain loyalty board' } },
});

registry.registerPath({
  method: 'post',
  path: '/v1/chain-loyalty/earn',
  summary: 'Earn chain points for a guest at any chain property',
  responses: { 201: { description: 'Transaction posted' }, 400: { description: 'Invalid input' } },
});

registry.registerPath({
  method: 'post',
  path: '/v1/chain-loyalty/redeem',
  summary: 'Redeem chain points for a guest at any chain property',
  responses: {
    201: { description: 'Transaction posted' },
    409: { description: 'Insufficient points' },
  },
});

export const chainLoyaltyRouter = router;
export default router;
