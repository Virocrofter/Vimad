/* apps/api/src/modules/admin/admin.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  getAdminKpis,
  getAdminSystemHealth,
  getAdminAlerts,
  getAdminTenantActivity,
  getAdminPlanDistribution,
  getAdminQuickActions,
} from './admin.service.js';
import { adminReportsRouter } from './admin.reports.routes.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ─── Schemas ───

const KpiTrendSchema = z.object({
  value: z.number(),
  change: z.number(),
  changeLabel: z.string(),
  trend: z.array(z.number()),
});

const KpiResponseSchema = z
  .object({
    data: z.object({
      totalTenants: KpiTrendSchema,
      mrr: KpiTrendSchema,
      churnRate: KpiTrendSchema,
      activeUsers: KpiTrendSchema,
    }),
  })
  .openapi('AdminKpiResponse');

const SystemHealthResponseSchema = z
  .object({
    data: z.object({
      status: z.enum(['healthy', 'degraded', 'critical']),
      uptime: z.string(),
      lastIncident: z.string(),
      services: z.array(
        z.object({
          name: z.string(),
          status: z.enum(['operational', 'degraded', 'critical']),
          responseTime: z.string(),
        })
      ),
    }),
  })
  .openapi('AdminSystemHealthResponse');

const AlertResponseSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
        severity: z.enum(['critical', 'error', 'warning', 'info']),
        title: z.string(),
        message: z.string(),
        source: z.string(),
        time: z.string(),
        acknowledged: z.boolean(),
      })
    ),
  })
  .openapi('AdminAlertResponse');

const ActivityResponseSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
        type: z.enum(['upgrade', 'booking', 'user', 'security', 'rate', 'billing', 'sync']),
        tenant: z.string(),
        action: z.string(),
        detail: z.string(),
        time: z.string(),
      })
    ),
  })
  .openapi('AdminActivityResponse');

const PlanDistributionResponseSchema = z
  .object({
    data: z.array(
      z.object({
        plan: z.string(),
        count: z.number().int(),
        percentage: z.number().int(),
        color: z.string(),
      })
    ),
  })
  .openapi('AdminPlanDistributionResponse');

const QuickActionsResponseSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        description: z.string(),
        icon: z.string(),
        color: z.enum(['secondary', 'accent', 'info', 'warning', 'neutral']),
      })
    ),
  })
  .openapi('AdminQuickActionsResponse');

// ─── Router ───

export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authMiddleware, requireAdminRole);

/* ─── GET /admin/kpis ─── */
registry.registerPath({
  method: 'get',
  path: '/kpis',
  tags: ['Admin'],
  description: 'Get admin dashboard KPIs (total tenants, MRR, churn, active users)',
  responses: {
    200: {
      description: 'KPI data',
      content: { 'application/json': { schema: KpiResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden — admin role required',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

adminRouter.get('/kpis', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAdminKpis();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* ─── GET /admin/health ─── */
registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Admin'],
  description: 'Get admin system health overview',
  responses: {
    200: {
      description: 'System health data',
      content: { 'application/json': { schema: SystemHealthResponseSchema } },
    },
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

adminRouter.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAdminSystemHealth();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* ─── GET /admin/alerts ─── */
registry.registerPath({
  method: 'get',
  path: '/alerts',
  tags: ['Admin'],
  description: 'Get recent platform alerts',
  responses: {
    200: {
      description: 'Alert list',
      content: { 'application/json': { schema: AlertResponseSchema } },
    },
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

adminRouter.get('/alerts', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAdminAlerts();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* ─── GET /admin/activity ─── */
registry.registerPath({
  method: 'get',
  path: '/activity',
  tags: ['Admin'],
  description: 'Get recent tenant activity feed',
  responses: {
    200: {
      description: 'Activity feed',
      content: { 'application/json': { schema: ActivityResponseSchema } },
    },
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

adminRouter.get('/activity', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAdminTenantActivity();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* ─── GET /admin/plans ─── */
registry.registerPath({
  method: 'get',
  path: '/plans',
  tags: ['Admin'],
  description: 'Get tenant plan distribution',
  responses: {
    200: {
      description: 'Plan distribution',
      content: { 'application/json': { schema: PlanDistributionResponseSchema } },
    },
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

adminRouter.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAdminPlanDistribution();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* ─── GET /admin/quick-actions ─── */
registry.registerPath({
  method: 'get',
  path: '/quick-actions',
  tags: ['Admin'],
  description: 'Get available quick actions for admin dashboard',
  responses: {
    200: {
      description: 'Quick actions',
      content: { 'application/json': { schema: QuickActionsResponseSchema } },
    },
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

adminRouter.use('/reports', adminReportsRouter);

adminRouter.get('/quick-actions', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = getAdminQuickActions();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
