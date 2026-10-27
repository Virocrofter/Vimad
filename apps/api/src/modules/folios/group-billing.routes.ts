/* apps/api/src/modules/folios/group-billing.routes.ts — T3+ */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import {
  getGroupBillingView,
  moveFolioItem,
  closeBill,
  reopenBill,
  getBillRules,
  setBillRules,
  runAutoSend,
} from './group-billing.service.js';

export const groupBillingRouter = Router();
groupBillingRouter.use(authMiddleware);

const moveSchema = z.object({ targetFolioId: z.string().min(1) });
const rulesSchema = z.object({
  rule: z.enum(['always', 'consumed', 'halfday']),
  windowHours: z.number().int().min(1).max(72).default(12),
});
const reopenSchema = z.object({ reason: z.string().min(2) });

groupBillingRouter.get(
  '/group/:groupId/billing',
  requirePermission('folio', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await getGroupBillingView(
          (req as AuthenticatedRequest).auth.tenantId,
          req.params.groupId
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

groupBillingRouter.post(
  '/items/:itemId/move',
  requirePermission('folio', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = moveSchema.parse(req.body);
      const auth = (req as AuthenticatedRequest).auth;
      res.json({
        data: await moveFolioItem(
          auth.tenantId,
          auth.user.id,
          req.params.itemId,
          body.targetFolioId
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

groupBillingRouter.post(
  '/:id/close',
  requirePermission('folio', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      res.json({ data: await closeBill(auth.tenantId, auth.user.id, req.params.id) });
    } catch (err) {
      next(err);
    }
  }
);

groupBillingRouter.post(
  '/:id/reopen',
  requirePermission('folio', 'update'),
  validateBody(reopenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.validatedBody as z.infer<typeof reopenSchema>;
      const role = (req as AuthenticatedRequest).auth.user.role;
      if (!['owner', 'admin', 'manager'].includes(role)) {
        res
          .status(403)
          .json({
            error: { code: 'FORBIDDEN', message: 'Reopening a closed bill requires a supervisor' },
          });
        return;
      }
      const auth = (req as AuthenticatedRequest).auth;
      res.json({ data: await reopenBill(auth.tenantId, auth.user.id, req.params.id, body.reason) });
    } catch (err) {
      next(err);
    }
  }
);

groupBillingRouter.get(
  '/bill-rules',
  requirePermission('property', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await getBillRules(
          (req as AuthenticatedRequest).auth.tenantId,
          req.query.propertyId as string
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

groupBillingRouter.put(
  '/bill-rules',
  requirePermission('property', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = rulesSchema.parse(req.body);
      const auth = (req as AuthenticatedRequest).auth;
      res.json({
        data: await setBillRules(
          auth.tenantId,
          req.query.propertyId as string,
          body.rule,
          body.windowHours
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

groupBillingRouter.post(
  '/run-auto-send',
  requirePermission('folio', 'update'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await runAutoSend() });
    } catch (err) {
      next(err);
    }
  }
);
