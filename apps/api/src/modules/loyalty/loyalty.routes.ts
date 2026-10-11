/* apps/api/src/modules/loyalty/loyalty.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { ErrorResponseSchema, IdParamSchema } from '../../common/openapi-schemas.js';
import {
  adjustPoints,
  getLoyaltyStats,
  getMember,
  listMembers,
  listTransactions,
  pointsAdjustSchema,
  type PointsAdjustInput,
} from './loyalty.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const memberQuerySchema = paginationSchema
  .extend({
    search: z.string().optional(),
    tier: z.enum(['all', 'bronze', 'silver', 'gold', 'platinum']).optional(),
  })
  .openapi('LoyaltyMemberQuery');

const transactionQuerySchema = paginationSchema
  .extend({
    guestId: z.string().optional(),
    type: z.enum(['accrual', 'redemption', 'bonus', 'adjustment']).optional(),
  })
  .openapi('LoyaltyTransactionQuery');

const PointsAdjustInputSchema = pointsAdjustSchema.openapi('LoyaltyPointsAdjustInput');

export const loyaltyRouter = Router();

loyaltyRouter.use(authMiddleware, tenantScope);

// ─── GET /members ───
registry.registerPath({
  method: 'get',
  path: '/members',
  tags: ['Loyalty'],
  description: 'List loyalty members (guests with derived tier, points, LTV)',
  request: { query: memberQuerySchema },
  responses: {
    200: { description: 'Paginated member list' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

loyaltyRouter.get(
  '/members',
  requirePermission('loyalty', 'read'),
  validateQuery(memberQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listMembers(req.tenantId, req.validatedQuery as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /members/:id ───
registry.registerPath({
  method: 'get',
  path: '/members/{id}',
  tags: ['Loyalty'],
  description: 'Member detail with recent points transactions',
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Member details' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Member not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

loyaltyRouter.get(
  '/members/:id',
  requirePermission('loyalty', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getMember(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /transactions ───
registry.registerPath({
  method: 'get',
  path: '/transactions',
  tags: ['Loyalty'],
  description: 'List points transactions (accruals, redemptions, bonuses)',
  request: { query: transactionQuerySchema },
  responses: {
    200: { description: 'Paginated transaction list' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

loyaltyRouter.get(
  '/transactions',
  requirePermission('loyalty', 'read'),
  validateQuery(transactionQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listTransactions(req.tenantId, req.validatedQuery as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /stats ───
registry.registerPath({
  method: 'get',
  path: '/stats',
  tags: ['Loyalty'],
  description: 'Loyalty program stats: members, points in circulation, tier distribution',
  responses: {
    200: { description: 'Program stats' },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

loyaltyRouter.get(
  '/stats',
  requirePermission('loyalty', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getLoyaltyStats(req.tenantId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /adjust ───
registry.registerPath({
  method: 'post',
  path: '/adjust',
  tags: ['Loyalty'],
  description:
    'Adjust member points (accrual, redemption, bonus, adjustment) — atomic with balance update',
  request: {
    body: {
      description: 'Points adjustment payload',
      content: { 'application/json': { schema: PointsAdjustInputSchema } },
    },
  },
  responses: {
    201: { description: 'Points adjusted' },
    400: {
      description: 'Invalid input or insufficient balance',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Member not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

loyaltyRouter.post(
  '/adjust',
  requirePermission('loyalty', 'update'),
  validateBody(pointsAdjustSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adjustPoints(
        req.tenantId,
        req.validatedBody as PointsAdjustInput,
        (req as any).user?.id
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
