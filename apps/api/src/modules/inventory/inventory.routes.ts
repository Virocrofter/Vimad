/* apps/api/src/modules/inventory/inventory.routes.ts — I1 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import {
  createAllocation,
  getGrid,
  listAllocations,
  listHistory,
  listOverbooking,
  releaseAllocation,
  resolveProperty,
  setOverbooking,
  upsertRestriction,
} from './inventory.service.js';
import { readInventoryCache, refreshInventoryCache } from './inventory.cache.js';
import { pushInventoryToChannels } from './inventory.push.js';

export const inventoryRouter = Router();
export const registry = new OpenAPIRegistry();

inventoryRouter.use(authMiddleware);

const tenantOf = (req: Request) => (req as AuthenticatedRequest).auth.tenantId;
const userOf = (req: Request) => (req as AuthenticatedRequest).auth.user.id;

const DataEnvelope = z.object({ data: z.any() });

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const gridQuerySchema = z.object({
  propertyId: z.string().optional(),
  from: dateString,
  to: dateString,
  roomTypeId: z.string().optional(),
});

const restrictionSchema = z.object({
  propertyId: z.string().optional(),
  roomTypeId: z.string().min(1),
  date: dateString,
  stopSell: z.boolean().optional(),
  closeToArrival: z.boolean().optional(),
  closeToDeparture: z.boolean().optional(),
  adjustment: z.number().int().min(-500).max(500).optional(),
  notes: z.string().max(500).nullable().optional(),
});

const overbookingSchema = z.object({
  propertyId: z.string().optional(),
  roomTypeId: z.string().min(1),
  limit: z.number().int().min(0).max(50),
});

const HOLD_TYPE_ENUM = [
  'group_hold',
  'channel_allotment',
  'maintenance_block',
  'comp_hold',
] as const;

const allocationCreateSchema = z.object({
  propertyId: z.string().optional(),
  roomTypeId: z.string().min(1),
  type: z.enum(HOLD_TYPE_ENUM),
  name: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(500),
  date: dateString,
  endDate: dateString.optional(),
  notes: z.string().max(500).optional(),
  dedupeKey: z.string().max(120).optional(),
});

const allocationQuerySchema = z.object({
  propertyId: z.string().optional(),
  status: z.enum(['active', 'released']).optional(),
  type: z.string().optional(),
  roomTypeId: z.string().optional(),
  from: dateString.optional(),
  to: dateString.optional(),
});

registry.registerPath({
  method: 'get',
  path: '/v1/inventory/grid',
  tags: ['Inventory'],
  summary: 'Availability grid per room type per date',
  request: { query: gridQuerySchema },
  responses: {
    200: { description: 'Grid', content: { 'application/json': { schema: DataEnvelope } } },
  },
});
registry.registerPath({
  method: 'put',
  path: '/v1/inventory/restrictions',
  tags: ['Inventory'],
  summary: 'Set stop-sell / CTA / CTD / adjustment for a room type and date',
  request: { body: { content: { 'application/json': { schema: restrictionSchema } } } },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: DataEnvelope } } },
  },
});
registry.registerPath({
  method: 'post',
  path: '/v1/inventory/allocations',
  tags: ['Inventory'],
  summary: 'Create a hold / allocation (optionally over a date range)',
  request: { body: { content: { 'application/json': { schema: allocationCreateSchema } } } },
  responses: {
    201: { description: 'Created', content: { 'application/json': { schema: DataEnvelope } } },
  },
});
registry.registerPath({
  method: 'put',
  path: '/v1/inventory/overbooking',
  tags: ['Inventory'],
  summary: 'Set the overbooking limit for a room type',
  request: { body: { content: { 'application/json': { schema: overbookingSchema } } } },
  responses: {
    200: { description: 'Updated', content: { 'application/json': { schema: DataEnvelope } } },
  },
});
registry.registerPath({
  method: 'get',
  path: '/v1/inventory/history',
  tags: ['Inventory'],
  summary: 'Adjustment history from the audit trail',
  responses: {
    200: { description: 'History', content: { 'application/json': { schema: DataEnvelope } } },
  },
});

async function scopedProperty(req: Request) {
  const auth = (req as AuthenticatedRequest).auth;
  const explicit =
    (req.get('x-property-id') as string | undefined) ??
    ((req.validatedQuery ?? req.validatedBody ?? {}) as { propertyId?: string }).propertyId;
  const lastPropertyId = (auth.user as unknown as { lastPropertyId?: string }).lastPropertyId;
  return resolveProperty(auth.tenantId, explicit, lastPropertyId);
}

// ─── Grid ───

inventoryRouter.get(
  '/grid',
  requirePermission('inventory', 'view'),
  validateQuery(gridQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      const { from, to, roomTypeId } = req.validatedQuery as z.infer<typeof gridQuerySchema>;
      res.json({ data: await getGrid(tenantOf(req), property.id, from, to, roomTypeId) });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Channel push (I1 math: OOO / holds / adjustments / stop-sell aware) ───

inventoryRouter.post(
  '/push-channels',
  requirePermission('inventory', 'adjust'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      res.json({ data: await pushInventoryToChannels(tenantOf(req), property.id) });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Cache ───

inventoryRouter.post(
  '/cache/refresh',
  requirePermission('inventory', 'adjust'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      const rows = await refreshInventoryCache(property.id);
      res.json({ data: { refreshed: rows } });
    } catch (err) {
      next(err);
    }
  }
);

inventoryRouter.get(
  '/cache',
  requirePermission('inventory', 'view'),
  validateQuery(gridQuerySchema.pick({ from: true, to: true })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      const { from, to } = req.validatedQuery as { from: string; to: string };
      res.json({ data: await readInventoryCache(property.id, from, to) });
    } catch (err) {
      next(err);
    }
  }
);

inventoryRouter.get(
  '/history',
  requirePermission('inventory', 'view'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ data: await listHistory(tenantOf(req)) });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Restrictions ───

inventoryRouter.put(
  '/restrictions',
  requirePermission('inventory', 'adjust'),
  validateBody(restrictionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      const body = req.validatedBody as z.infer<typeof restrictionSchema>;
      const data = await upsertRestriction(tenantOf(req), property.id, userOf(req), req, body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Overbooking ───

inventoryRouter.get(
  '/overbooking',
  requirePermission('inventory', 'view'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      res.json({ data: await listOverbooking(tenantOf(req), property.id) });
    } catch (err) {
      next(err);
    }
  }
);

inventoryRouter.put(
  '/overbooking',
  requirePermission('inventory', 'adjust'),
  validateBody(overbookingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      const { roomTypeId, limit } = req.validatedBody as z.infer<typeof overbookingSchema>;
      const data = await setOverbooking(
        tenantOf(req),
        property.id,
        userOf(req),
        req,
        roomTypeId,
        limit
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Allocations / holds ───

inventoryRouter.get(
  '/allocations',
  requirePermission('inventory', 'view'),
  validateQuery(allocationQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      res.json({
        data: await listAllocations(
          tenantOf(req),
          property.id,
          req.validatedQuery as Record<string, string>
        ),
      });
    } catch (err) {
      next(err);
    }
  }
);

inventoryRouter.post(
  '/allocations',
  requirePermission('inventory', 'adjust'),
  validateBody(allocationCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await scopedProperty(req);
      const data = await createAllocation(
        tenantOf(req),
        property.id,
        userOf(req),
        req,
        req.validatedBody as never
      );
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

inventoryRouter.patch(
  '/allocations/:id/release',
  requirePermission('inventory', 'adjust'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await releaseAllocation(tenantOf(req), userOf(req), req, req.params.id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);
