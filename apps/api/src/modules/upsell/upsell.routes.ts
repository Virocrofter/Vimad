/* apps/api/src/modules/upsell/upsell.routes.ts — C7' */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { listProducts, createProduct, sellProduct, salesReport } from './upsell.service.js';

export const upsellRouter = Router();
upsellRouter.use(authMiddleware);

const productSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  category: z.string().default('extra'),
  taxInclusive: z.boolean().default(true),
});
const sellSchema = z.object({
  productId: z.string().min(1),
  reservationId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
});

const ctx = (req: Request) => (req as AuthenticatedRequest).auth;

upsellRouter.get(
  '/products',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await listProducts(ctx(req).tenantId, req.query.propertyId as string) });
    } catch (err) {
      next(err);
    }
  }
);

upsellRouter.post(
  '/products',
  requirePermission('folio', 'update'),
  validateBody(productSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res
        .status(201)
        .json({
          data: await createProduct(
            ctx(req).tenantId,
            req.query.propertyId as string,
            req.validatedBody as Record<string, unknown>
          ),
        });
    } catch (err) {
      next(err);
    }
  }
);

upsellRouter.post(
  '/sell',
  requirePermission('folio', 'update'),
  validateBody(sellSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res
        .status(201)
        .json({
          data: await sellProduct(
            ctx(req).tenantId,
            ctx(req).user.id,
            req.validatedBody as Record<string, unknown>
          ),
        });
    } catch (err) {
      next(err);
    }
  }
);

upsellRouter.get(
  '/sales',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await salesReport(
          ctx(req).tenantId,
          req.query.propertyId as string,
          req.query.from as string,
          req.query.to as string
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);
