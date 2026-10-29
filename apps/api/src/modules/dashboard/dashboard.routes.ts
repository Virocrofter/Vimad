import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateQuery } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  getActivityFeed,
  getAlerts,
  getDashboardStats,
  getFrontDeskSnapshot,
} from './dashboard.service.js';
import { getOpsToday } from './ops-today.service.js';
import { getKpiDeltas } from './dashboard-deltas.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const PropertyQuerySchema = z
  .object({ propertyId: z.string().optional() })
  .openapi('DashboardPropertyQuery');

// ─── Schemas ─────────────────────────────────────────────────────────────────

const StatsSchema = z
  .object({
    businessDate: z.string(),
    property: z.object({ id: z.string(), name: z.string(), currency: z.string() }),
    occupancyRate: z.number(),
    adr: z.number(),
    revpar: z.number(),
    totalRevenue: z.number(),
    monthToDateRevenue: z.number(),
    arrivalsToday: z.number(),
    departuresToday: z.number(),
    inHouseGuests: z.number(),
    availableRooms: z.number(),
    occupiedRooms: z.number(),
    outOfOrderRooms: z.number(),
    dirtyRooms: z.number(),
    totalRooms: z.number(),
    pendingTasks: z.number(),
    newReservationsToday: z.number(),
    nightAudit: z.object({ status: z.string(), completedAt: z.string().nullable() }).nullable(),
    revenueByDay: z.array(z.object({ date: z.string(), revenue: z.number() })),
    recentReservations: z.array(
      z.object({
        id: z.string(),
        confirmationNumber: z.string(),
        guestName: z.string(),
        arrivalDate: z.string(),
        departureDate: z.string(),
        status: z.string(),
        roomNumber: z.string().nullable(),
        totalAmount: z.number(),
      })
    ),
  })
  .openapi('DashboardStats');

const FrontDeskSnapshotSchema = z
  .object({
    rooms: z.array(
      z.object({
        id: z.string(),
        number: z.string(),
        floor: z.string().nullable(),
        status: z.string(),
        housekeepingStatus: z.string(),
        currentGuest: z.object({ firstName: z.string(), lastName: z.string() }).nullable(),
        currentReservation: z
          .object({
            id: z.string(),
            departureDate: z.string(),
            confirmationNumber: z.string(),
          })
          .nullable(),
      })
    ),
    arrivals: z.array(
      z.object({
        id: z.string(),
        confirmationNumber: z.string(),
        guestName: z.string(),
        arrivalDate: z.string(),
        roomType: z.string().nullable(),
        roomNumber: z.string().nullable(),
        status: z.string(),
        balance: z.number(),
      })
    ),
    departures: z.array(
      z.object({
        id: z.string(),
        confirmationNumber: z.string(),
        guestName: z.string(),
        departureDate: z.string(),
        roomNumber: z.string().nullable(),
        status: z.string(),
        balance: z.number(),
      })
    ),
  })
  .openapi('FrontDeskSnapshot');

const OpsTodaySchema = z
  .object({
    businessDate: z.string(),
    arrivals: z.object({ total: z.number().int(), done: z.number().int() }),
    departures: z.object({ total: z.number().int(), done: z.number().int() }),
    rooms: z.object({
      turnedToday: z.number().int(),
      dirty: z.number().int(),
      inspected: z.number().int(),
      turnaroundTarget: z.number().int(),
    }),
    tasks: z.object({
      open: z.number().int(),
      inProgress: z.number().int(),
      slaBreached: z.number().int(),
      byDepartment: z.array(
        z.object({ department: z.string(), count: z.number().int(), slaBreached: z.number().int() })
      ),
      top: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          department: z.string(),
          priority: z.string(),
        })
      ),
    }),
    vipArrivals: z.array(
      z.object({
        id: z.string(),
        confirmationNumber: z.string(),
        guestName: z.string(),
        vipStatus: z.string().nullable(),
        roomType: z.string().nullable(),
        notes: z.string().nullable(),
        status: z.string(),
      })
    ),
    unsettledDepartures: z.object({
      count: z.number().int(),
      totalBalance: z.number(),
      items: z.array(
        z.object({
          id: z.string(),
          confirmationNumber: z.string(),
          guestName: z.string(),
          roomNumber: z.string().nullable(),
          balance: z.number(),
        })
      ),
    }),
    exceptions: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        severity: z.enum(['critical', 'warning', 'info']),
        title: z.string(),
        detail: z.string(),
        count: z.number().int(),
        entityType: z.string(),
        entityId: z.string().nullable(),
        taskId: z.string().nullable().optional(),
        taskStatus: z.string().optional(),
      })
    ),
  })
  .openapi('DashboardOpsToday');

const ActivityFeedSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
        action: z.string(),
        entity: z.string(),
        entityId: z.string().nullable(),
        user: z.string().nullable(),
        time: z.string(),
        metadata: z.unknown(),
      })
    ),
  })
  .openapi('DashboardActivityFeed');

const AlertSchema = z
  .object({
    id: z.string(),
    severity: z.enum(['critical', 'warning', 'info', 'success']),
    title: z.string(),
    message: z.string(),
    source: z.string(),
    actionUrl: z.string().nullable(),
    timestamp: z.string(),
    acknowledged: z.boolean(),
  })
  .openapi('DashboardAlert');

const AlertListSchema = z.object({ data: z.array(AlertSchema) }).openapi('DashboardAlertList');

// ─── Shared response docs ────────────────────────────────────────────────────

const unauthorized = {
  description: 'Unauthorized',
  content: { 'application/json': { schema: ErrorResponseSchema } },
} as const;

const forbidden = {
  description: 'Forbidden',
  content: { 'application/json': { schema: ErrorResponseSchema } },
} as const;

// ─── Router ──────────────────────────────────────────────────────────────────

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware, tenantScope);

// GET /stats
registry.registerPath({
  method: 'get',
  path: '/dashboard/stats',
  tags: ['Dashboard'],
  description: 'Property command-center KPIs for the current business date',
  request: { query: PropertyQuerySchema },
  responses: {
    200: {
      description: 'Dashboard stats',
      content: { 'application/json': { schema: StatsSchema } },
    },
    401: unauthorized,
    403: forbidden,
  },
});

dashboardRouter.get(
  '/stats',
  requirePermission('report', 'read'),
  validateQuery(PropertyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId?: string };
      const data = await getDashboardStats(req.tenantId, propertyId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// GET /front-desk
registry.registerPath({
  method: 'get',
  path: '/dashboard/front-desk',
  tags: ['Dashboard'],
  description: "Today's room board plus arrivals and departures",
  request: { query: PropertyQuerySchema },
  responses: {
    200: {
      description: 'Front-desk snapshot',
      content: { 'application/json': { schema: FrontDeskSnapshotSchema } },
    },
    401: unauthorized,
    403: forbidden,
  },
});

dashboardRouter.get(
  '/front-desk',
  requirePermission('reservation', 'read'),
  validateQuery(PropertyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId?: string };
      const data = await getFrontDeskSnapshot(req.tenantId, propertyId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// GET /ops-today — D2: today strip, tasks snapshot, VIP arrivals, un-settled departures
registry.registerPath({
  method: 'get',
  path: '/dashboard/ops-today',
  tags: ['Dashboard'],
  description:
    "Today's operational progress: check-ins, check-outs, room turnaround, tasks, VIP arrivals, un-settled departures",
  request: { query: PropertyQuerySchema },
  responses: {
    200: {
      description: 'Ops-today snapshot',
      content: { 'application/json': { schema: OpsTodaySchema } },
    },
    401: unauthorized,
    403: forbidden,
  },
});

dashboardRouter.get(
  '/ops-today',
  requirePermission('report', 'read'),
  validateQuery(PropertyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId?: string };
      const data = await getOpsToday(req.tenantId, propertyId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// GET /activity
registry.registerPath({
  method: 'get',
  path: '/dashboard/activity',
  tags: ['Dashboard'],
  description: 'Recent activity feed from the audit log',
  request: {
    query: PropertyQuerySchema.extend({ take: z.coerce.number().int().min(1).max(100).optional() }),
  },
  responses: {
    200: {
      description: 'Activity feed',
      content: { 'application/json': { schema: ActivityFeedSchema } },
    },
    401: unauthorized,
    403: forbidden,
  },
});

dashboardRouter.get(
  '/activity',
  requirePermission('report', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertyId = req.query.propertyId as string | undefined;
      const take = req.query.take ? Number(req.query.take) : 20;
      const data = await getActivityFeed(req.tenantId, propertyId, take);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// GET /alerts
registry.registerPath({
  method: 'get',
  path: '/dashboard/alerts',
  tags: ['Dashboard'],
  description: 'Operational alerts derived from live property data',
  request: { query: PropertyQuerySchema },
  responses: {
    200: {
      description: 'Alert list',
      content: { 'application/json': { schema: AlertListSchema } },
    },
    401: unauthorized,
    403: forbidden,
  },
});

dashboardRouter.get(
  '/alerts',
  requirePermission('report', 'read'),
  validateQuery(PropertyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId?: string };
      const data = await getAlerts(req.tenantId, propertyId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// ─── D3: KPI deltas vs yesterday + 7-day averages ───────────────────────────

const DeltasSchema = z
  .object({
    yesterday: z.object({
      date: z.string(),
      occupancyRate: z.number().nullable(),
      revenue: z.number(),
    }),
    averages: z.object({
      occupancyRate7d: z.number().nullable(),
      revenue7d: z.number().nullable(),
    }),
  })
  .openapi('DashboardKpiDeltas');

registry.registerPath({
  method: 'get',
  path: '/dashboard/deltas',
  tags: ['Dashboard'],
  description: 'KPI comparison data: yesterday and 7-day averages (frontend computes deltas)',
  request: { query: PropertyQuerySchema },
  responses: {
    200: {
      description: 'KPI deltas source data',
      content: { 'application/json': { schema: DeltasSchema } },
    },
    401: unauthorized,
    403: forbidden,
  },
});

dashboardRouter.get(
  '/deltas',
  requirePermission('report', 'read'),
  validateQuery(PropertyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.validatedQuery as { propertyId?: string };
      const data = await getKpiDeltas(req.tenantId, propertyId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);
