/* apps/api/src/modules/parking/parking.routes.ts — T4 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../common/validate.js';
import { IdParamSchema } from '../../common/openapi-schemas.js';
import {
  listBays,
  createBay,
  updateBay,
  deleteBay,
  setCharging,
  listVehicles,
  createVehicle,
  updateVehicle,
  deactivateVehicle,
  listAssignments,
  createAssignment,
  updateAssignment,
  checkInAssignment,
  checkOutAssignment,
  cancelAssignment,
  getBoard,
  getValetQueue,
  autoAssign,
} from './parking.service.js';

export const parkingRouter = Router();

parkingRouter.use(authMiddleware);

const tenantOf = (req: Request) => (req as AuthenticatedRequest).auth.tenantId;
const userOf = (req: Request) => (req as AuthenticatedRequest).auth.user.id;

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const bayCreateSchema = z.object({
  propertyId: z.string().optional(),
  label: z.string().min(1).max(20),
  zone: z.enum(['standard', 'accessible', 'ev', 'valet']).default('standard'),
  evCharger: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

const bayUpdateSchema = z.object({
  zone: z.enum(['standard', 'accessible', 'ev', 'valet']).optional(),
  status: z.enum(['available', 'out_of_service']).optional(),
  evCharger: z.boolean().optional(),
  chargingStatus: z.enum(['free', 'charging', 'full']).optional(),
  notes: z.string().max(500).nullable().optional(),
});

const vehicleCreateSchema = z.object({
  guestId: z.string().min(1),
  plate: z.string().min(1).max(20),
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
  isElectric: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
});

const vehicleUpdateSchema = z.object({
  plate: z.string().min(1).max(20).optional(),
  make: z.string().max(50).nullable().optional(),
  model: z.string().max(50).nullable().optional(),
  color: z.string().max(30).nullable().optional(),
  isElectric: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  active: z.boolean().optional(),
});

const assignmentCreateSchema = z.object({
  propertyId: z.string().optional(),
  bayId: z.string().min(1),
  vehicleId: z.string().min(1),
  reservationId: z.string().optional(),
  scheduledFor: dateString.optional(),
  valet: z.boolean().optional(),
  valetInstructions: z.string().max(1000).optional(),
  valetKeyLocation: z.string().max(200).optional(),
  plateAtCheckin: z.string().max(20).optional(),
});

const assignmentUpdateSchema = z.object({
  valet: z.boolean().optional(),
  valetInstructions: z.string().max(1000).nullable().optional(),
  valetKeyLocation: z.string().max(200).nullable().optional(),
});

// ─── Bays ───

parkingRouter.get(
  '/bays',
  requirePermission('task', 'read'),
  validateQuery(
    z.object({
      propertyId: z.string().optional(),
      zone: z.string().optional(),
      status: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await listBays(tenantOf(req), req.validatedQuery as Record<string, string>),
      });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.post(
  '/bays',
  requirePermission('task', 'create'),
  validateBody(bayCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createBay(
        tenantOf(req),
        userOf(req),
        req.validatedBody as Record<string, unknown>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.patch(
  '/bays/:id',
  requirePermission('task', 'update'),
  validateParams(IdParamSchema),
  validateBody(bayUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await updateBay(
        tenantOf(req),
        userOf(req),
        req.params.id,
        req.validatedBody as Record<string, unknown>
      );
      res.json({ data: { updated: true } });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.delete(
  '/bays/:id',
  requirePermission('task', 'delete'),
  validateParams(IdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteBay(tenantOf(req), userOf(req), req.params.id);
      res.json({ data: { deleted: true } });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.post(
  '/bays/:id/charging',
  requirePermission('task', 'update'),
  validateParams(IdParamSchema),
  validateBody(z.object({ status: z.enum(['free', 'charging', 'full']) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.validatedBody as { status: string };
      await setCharging(tenantOf(req), userOf(req), req.params.id, status);
      res.json({ data: { updated: true } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Vehicles ───

parkingRouter.get(
  '/vehicles',
  requirePermission('task', 'read'),
  validateQuery(
    z.object({
      guestId: z.string().optional(),
      plate: z.string().optional(),
      includeInactive: z.coerce.boolean().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await listVehicles(tenantOf(req), req.validatedQuery as Record<string, string>),
      });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.post(
  '/vehicles',
  requirePermission('task', 'create'),
  validateBody(vehicleCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createVehicle(
        tenantOf(req),
        userOf(req),
        req.validatedBody as Record<string, unknown>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.patch(
  '/vehicles/:id',
  requirePermission('task', 'update'),
  validateParams(IdParamSchema),
  validateBody(vehicleUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await updateVehicle(
        tenantOf(req),
        userOf(req),
        req.params.id,
        req.validatedBody as Record<string, unknown>
      );
      res.json({ data: { updated: true } });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.delete(
  '/vehicles/:id',
  requirePermission('task', 'delete'),
  validateParams(IdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deactivateVehicle(tenantOf(req), userOf(req), req.params.id);
      res.json({ data: { deactivated: true } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Board & auto-assign ───

parkingRouter.get(
  '/board',
  requirePermission('task', 'read'),
  validateQuery(z.object({ date: dateString.optional(), propertyId: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, propertyId } = req.validatedQuery as { date?: string; propertyId?: string };
      res.json({
        data: await getBoard(
          tenantOf(req),
          date ?? new Date().toISOString().slice(0, 10),
          propertyId
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.post(
  '/auto-assign',
  requirePermission('task', 'assign'),
  validateBody(z.object({ propertyId: z.string().optional(), date: dateString.optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId, date } = req.validatedBody as { propertyId?: string; date?: string };
      const result = await autoAssign(tenantOf(req), userOf(req), propertyId, date);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Assignments ───

parkingRouter.get(
  '/assignments',
  requirePermission('task', 'read'),
  validateQuery(
    z.object({
      propertyId: z.string().optional(),
      date: dateString.optional(),
      status: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        data: await listAssignments(tenantOf(req), req.validatedQuery as Record<string, string>),
      });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.post(
  '/assignments',
  requirePermission('task', 'create'),
  validateBody(assignmentCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createAssignment(
        tenantOf(req),
        userOf(req),
        req.validatedBody as Record<string, unknown>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.patch(
  '/assignments/:id',
  requirePermission('task', 'update'),
  validateParams(IdParamSchema),
  validateBody(assignmentUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await updateAssignment(
        tenantOf(req),
        userOf(req),
        req.params.id,
        req.validatedBody as Record<string, unknown>
      );
      res.json({ data: { updated: true } });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.post(
  '/assignments/:id/check-in',
  requirePermission('task', 'update'),
  validateParams(IdParamSchema),
  validateBody(z.object({ plate: z.string().min(1).max(20).optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plate } = req.validatedBody as { plate?: string };
      await checkInAssignment(tenantOf(req), userOf(req), req.params.id, plate);
      res.json({ data: { checkedIn: true } });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.post(
  '/assignments/:id/check-out',
  requirePermission('task', 'update'),
  validateParams(IdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await checkOutAssignment(tenantOf(req), userOf(req), req.params.id);
      res.json({ data: { checkedOut: true } });
    } catch (err) {
      next(err);
    }
  }
);

parkingRouter.post(
  '/assignments/:id/cancel',
  requirePermission('task', 'delete'),
  validateParams(IdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await cancelAssignment(tenantOf(req), userOf(req), req.params.id);
      res.json({ data: { cancelled: true } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Valet queue ───

parkingRouter.get(
  '/valet',
  requirePermission('task', 'read'),
  validateQuery(z.object({ propertyId: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId?: string };
      res.json({ data: await getValetQueue(tenantOf(req), propertyId) });
    } catch (err) {
      next(err);
    }
  }
);
