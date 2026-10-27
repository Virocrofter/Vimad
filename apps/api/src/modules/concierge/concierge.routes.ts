/* apps/api/src/modules/concierge/concierge.routes.ts — T3 (staff) + 0.4 flight hook */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../common/validate.js';
import { IdParamSchema } from '../../common/openapi-schemas.js';
import { env } from '../../common/env.js';
import { getBoard, createItem, updateItem, postToFolio } from './concierge.service.js';
import { applyFlightAdjustment, getFlightInfo } from './flight-status.service.js';

export const conciergeRouter = Router();

conciergeRouter.use(authMiddleware);

const tenantOf = (req: Request) => (req as AuthenticatedRequest).auth.tenantId;
const userOf = (req: Request) => (req as AuthenticatedRequest).auth.user.id;

const createSchema = z.object({
  propertyId: z.string().min(1),
  type: z.enum([
    'transfer',
    'special_request',
    'wake_up_call',
    'restaurant_booking',
    'activity_booking',
    'upsell',
    'gesture',
  ]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  guestId: z.string().optional(),
  reservationId: z.string().optional(),
  roomId: z.string().optional(),
  assigneeId: z.string().optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  priceMinor: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  flightNumber: z.string().max(20).optional(),
  tripStatus: z
    .enum(['requested', 'confirmed', 'assigned', 'en_route', 'completed', 'cancelled'])
    .optional(),
  dedupeKey: z.string().max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
  priceMinor: z.number().int().min(0).optional(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
  tripStatus: z
    .enum(['requested', 'confirmed', 'assigned', 'en_route', 'completed', 'cancelled'])
    .optional(),
  flightNumber: z.string().max(20).nullable().optional(),
});

const boardQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  propertyId: z.string().optional(),
});

const simulateSchema = z.object({
  itemId: z.string().min(1),
  status: z.enum(['on_time', 'delayed', 'cancelled', 'landed']).default('delayed'),
  delayMinutes: z.number().int().min(1).max(1440).default(60),
});

// ─── GET /v1/concierge/board?date=YYYY-MM-DD ───
conciergeRouter.get(
  '/board',
  requirePermission('task', 'read'),
  validateQuery(boardQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date, propertyId } = req.validatedQuery as { date?: string; propertyId?: string };
      const board = await getBoard(
        tenantOf(req),
        date ?? new Date().toISOString().slice(0, 10),
        propertyId
      );
      res.json({ data: board });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /v1/concierge ───
conciergeRouter.post(
  '/',
  requirePermission('task', 'create'),
  validateBody(createSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createItem(
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

// ─── PATCH /v1/concierge/:id ───
conciergeRouter.patch(
  '/:id',
  requirePermission('task', 'update'),
  validateParams(IdParamSchema),
  validateBody(updateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await updateItem(
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

// ─── POST /v1/concierge/:id/post-to-folio (one tap → owner sees the Rand) ───
conciergeRouter.post(
  '/:id/post-to-folio',
  requirePermission('folio', 'create'),
  validateParams(IdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await postToFolio(tenantOf(req), userOf(req), req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── 0.4: flight simulation (dev/demo only — drives the Tambo gate) ───
conciergeRouter.post(
  '/flights/simulate',
  requirePermission('task', 'update'),
  validateBody(simulateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (env.NODE_ENV === 'production' && !env.FLIGHT_SIMULATION_ENABLED) {
        res
          .status(403)
          .json({ error: { code: 'FORBIDDEN', message: 'Simulation disabled in production' } });
        return;
      }
      const { itemId, status, delayMinutes } = req.validatedBody as z.infer<typeof simulateSchema>;
      const result = await applyFlightAdjustment(itemId, delayMinutes, status, 'simulation');
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── 0.4: flight status read-back (staff + gate) ───
conciergeRouter.get(
  '/flights/status/:itemId',
  requirePermission('task', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const info = await getFlightInfo(req.params.itemId);
      if (!info) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'concierge item not found' } });
        return;
      }
      res.json({ data: info });
    } catch (err) {
      next(err);
    }
  }
);
