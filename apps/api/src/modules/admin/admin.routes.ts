/* apps/api/src/modules/admin/admin.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { adminJobsRouter } from './admin.jobs.routes.js';
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
  getAdminAuditLogs,
  getAdminAuditStats,
  getAdminSystemMetrics,
  getAdminTicketQueue,
  getAdminTenants,
  getAdminBillingDashboard,
  getAdminRevenueAnalytics,
  getAdminRevenueByPlan,
  getAdminMrrHistory,
  listAdminSubscriptions,
  getAdminSubscriptionById,
  updateAdminSubscription,
  cancelAdminSubscription,
  listAdminInvoices,
  getAdminInvoiceById,
  createAdminInvoice,
  updateAdminInvoice,
  deleteAdminInvoice,
  generateAdminInvoice,
  markAdminInvoicePaid,
  getAdminCreditNotes,
  createAdminCreditNote,
  applyAdminCreditNote,
  getAdminDunning,
  triggerAdminDunning,
} from './admin.service.js';
import { adminReportsRouter } from './admin.reports.routes.js';
import { contractsRouter } from './contracts.routes.js';
import { billingAdapterRouter } from './billing-adapter.routes.js';

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
adminRouter.use('/billing/contracts', contractsRouter);
adminRouter.use('/billing', billingAdapterRouter);

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
adminRouter.use('/jobs', adminJobsRouter);

adminRouter.get('/quick-actions', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = getAdminQuickActions();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
// A1: platform audit-log explorer. Contract note: the audit client expects
// the body to BE {data, meta} (it unwraps one level) — no extra envelope.
adminRouter.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const result = await getAdminAuditLogs({
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      severity: q.severity,
      category: q.category,
      userId: q.userId,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

adminRouter.get('/audit-logs/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json(await getAdminAuditStats());
  } catch (err) {
    return next(err);
  }
});

// A4: prometheus scrape for the health page.
adminRouter.get('/health/metrics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json({ data: await getAdminSystemMetrics() });
  } catch (err) {
    return next(err);
  }
});
// A2: platform support-ticket queue (page currently mock-fed; endpoint is the
// contract for its future wiring).
adminRouter.get('/ticket', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const result = await getAdminTicketQueue({
      status: q.status,
      priority: q.priority,
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

// A3: platform tenant list — consumed by regions (migration selector) and
// billing/credit-notes (both unwrap {data} tolerantly).
adminRouter.get('/tenants', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json({ data: await getAdminTenants() });
  } catch (err) {
    return next(err);
  }
});
// ─── B1/B3: platform billing routes (contract-consumed response shapes) ───
// Dashboard/revenue return their shape DIRECTLY (client consumes body as-is);
// subscriptions list returns {data, meta} per PaginatedResponse.
adminRouter.get('/billing/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json(await getAdminBillingDashboard());
  } catch (err) {
    return next(err);
  }
});

adminRouter.get('/billing/revenue', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = String(req.query.period ?? 'monthly');
    return res.json(await getAdminRevenueAnalytics(period));
  } catch (err) {
    return next(err);
  }
});

adminRouter.get(
  '/billing/revenue-by-plan',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json({ data: await getAdminRevenueByPlan() });
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.get('/billing/mrr-history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = req.query.months ? Number(req.query.months) : 12;
    return res.json({ data: await getAdminMrrHistory(months) });
  } catch (err) {
    return next(err);
  }
});

adminRouter.get(
  '/billing/subscriptions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as Record<string, string | undefined>;
      return res.json(
        await listAdminSubscriptions({
          page: q.page ? Number(q.page) : undefined,
          pageSize: q.pageSize ? Number(q.pageSize) : undefined,
          status: q.status,
          tenantId: q.tenantId,
        })
      );
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.get(
  '/billing/subscriptions/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await getAdminSubscriptionById(req.params.id));
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.patch(
  '/billing/subscriptions/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await updateAdminSubscription(req.params.id, req.body ?? {}));
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.post(
  '/billing/subscriptions/:id/cancel',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await cancelAdminSubscription(req.params.id, req.body ?? {}));
    } catch (err) {
      return next(err);
    }
  }
);
// ─── B2/B4 routes (response shapes per billing.ts client consumption) ───
adminRouter.get('/billing/invoices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    return res.json(
      await listAdminInvoices({
        page: q.page ? Number(q.page) : undefined,
        pageSize: q.pageSize ? Number(q.pageSize) : undefined,
        status: q.status,
        tenantId: q.tenantId,
      })
    );
  } catch (err) {
    return next(err);
  }
});

adminRouter.post('/billing/invoices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(201).json(await createAdminInvoice(req.body ?? {}));
  } catch (err) {
    return next(err);
  }
});

adminRouter.post('/billing/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(201).json(await generateAdminInvoice(req.body ?? {}));
  } catch (err) {
    return next(err);
  }
});

adminRouter.get(
  '/billing/invoices/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await getAdminInvoiceById(req.params.id));
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.patch(
  '/billing/invoices/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await updateAdminInvoice(req.params.id, req.body ?? {}));
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.delete(
  '/billing/invoices/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteAdminInvoice(req.params.id);
      return res.status(204).end();
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.post(
  '/billing/invoices/:id/pay',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await markAdminInvoicePaid(req.params.id, req.body ?? {}));
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.get(
  '/billing/credit-notes',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await getAdminCreditNotes(req.query.invoiceId as string | undefined));
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.post(
  '/billing/credit-notes',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.status(201).json(await createAdminCreditNote(req.body ?? {}));
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.post(
  '/billing/credit-notes/:id/apply',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.json(await applyAdminCreditNote(req.params.id));
    } catch (err) {
      return next(err);
    }
  }
);

adminRouter.get('/billing/dunning', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json(await getAdminDunning(req.query.invoiceId as string | undefined));
  } catch (err) {
    return next(err);
  }
});

adminRouter.post(
  '/billing/invoices/:id/dunning',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return res.status(201).json(await triggerAdminDunning(req.params.id));
    } catch (err) {
      return next(err);
    }
  }
);
