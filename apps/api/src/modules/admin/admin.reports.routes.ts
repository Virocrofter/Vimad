/* apps/api/src/modules/admin/admin.reports.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';

export const adminReportsRouter = Router();

// All routes require authentication + admin role
adminReportsRouter.use(authMiddleware, requireAdminRole);

// ─── Schemas ───

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().default('custom'),
  type: z.enum(['system', 'custom']).default('custom'),
  config: z.record(z.string(), z.unknown()).default({}),
  fields: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        label: z.string(),
        required: z.boolean().default(false),
      })
    )
    .default([]),
});

const createScheduledReportSchema = z.object({
  templateId: z.string(),
  name: z.string().min(1),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  recipients: z.array(z.string().email()),
  format: z.enum(['pdf', 'csv', 'excel']),
  parameters: z.record(z.string(), z.unknown()).default({}),
  nextRunAt: z.string(),
  status: z.enum(['active', 'paused', 'error']).default('active'),
});

const executeReportSchema = z.object({
  templateId: z.string(),
  parameters: z.record(z.string(), z.unknown()).default({}),
});

// ─── In-memory storage for demo (replace with DB models) ───
// TODO: Create proper Prisma models for ReportTemplate, ScheduledReport, ReportRun

const templates: Map<string, any> = new Map();
const scheduledReports: Map<string, any> = new Map();
const reportRuns: Map<string, any> = new Map();

// Seed some default templates
templates.set('tpl-1', {
  id: 'tpl-1',
  name: 'Occupancy Report',
  description: 'Daily room occupancy statistics',
  category: 'operations',
  type: 'system',
  config: {},
  fields: [
    { name: 'date', type: 'date', label: 'Date', required: true },
    { name: 'roomNumber', type: 'string', label: 'Room', required: true },
    { name: 'status', type: 'string', label: 'Status', required: true },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

templates.set('tpl-2', {
  id: 'tpl-2',
  name: 'Revenue Report',
  description: 'Monthly revenue breakdown',
  category: 'financial',
  type: 'system',
  config: {},
  fields: [
    { name: 'month', type: 'string', label: 'Month', required: true },
    { name: 'revenue', type: 'number', label: 'Revenue', required: true },
    { name: 'bookings', type: 'number', label: 'Bookings', required: true },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ─── Dashboard Stats ───

adminReportsRouter.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalReports = templates.size;
    const scheduledActive = Array.from(scheduledReports.values()).filter(
      (s) => s.status === 'active'
    ).length;
    const runsThisMonth = Array.from(reportRuns.values()).filter((r) => {
      const runDate = new Date(r.startedAt);
      const now = new Date();
      return runDate.getMonth() === now.getMonth() && runDate.getFullYear() === now.getFullYear();
    }).length;

    const completedRuns = Array.from(reportRuns.values()).filter(
      (r) => r.status === 'completed' && r.completedAt
    );
    const avgRuntime =
      completedRuns.length > 0
        ? completedRuns.reduce((sum, r) => {
            const duration = new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime();
            return sum + duration / 1000;
          }, 0) / completedRuns.length
        : 0;

    res.json({
      data: {
        totalReports,
        scheduledActive,
        runsThisMonth,
        averageRuntime: Math.round(avgRuntime * 10) / 10,
        popularTemplates: [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Templates CRUD ───

adminReportsRouter.get(
  '/templates',
  validateQuery(paginationSchema.extend({ category: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize, category } = req.validatedQuery as any;
      let allTemplates = Array.from(templates.values());

      if (category) {
        allTemplates = allTemplates.filter((t) => t.category === category);
      }

      const start = (page - 1) * pageSize;
      const paginatedTemplates = allTemplates.slice(start, start + pageSize);

      res.json({
        data: paginatedTemplates,
        meta: {
          page,
          pageSize,
          total: allTemplates.length,
          totalPages: Math.ceil(allTemplates.length / pageSize),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.get(
  '/templates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = templates.get(req.params.id);
      if (!template) {
        throw new AppError(404, 'Template not found', 'NOT_FOUND');
      }
      res.json({ data: template });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.post(
  '/templates',
  validateBody(createTemplateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = `tpl-${Date.now()}`;
      const template = {
        id,
        ...(req.validatedBody as Record<string, unknown>),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      templates.set(id, template);
      res.status(201).json({ data: template });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.patch(
  '/templates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = templates.get(req.params.id);
      if (!template) {
        throw new AppError(404, 'Template not found', 'NOT_FOUND');
      }
      const updated = {
        ...template,
        ...req.body,
        id: req.params.id,
        updatedAt: new Date().toISOString(),
      };
      templates.set(req.params.id, updated);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.delete(
  '/templates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!templates.has(req.params.id)) {
        throw new AppError(404, 'Template not found', 'NOT_FOUND');
      }
      templates.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// ─── Scheduled Reports CRUD ───

adminReportsRouter.get(
  '/scheduled',
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize } = req.validatedQuery as any;
      const allScheduled = Array.from(scheduledReports.values());
      const start = (page - 1) * pageSize;
      const paginated = allScheduled.slice(start, start + pageSize);

      res.json({
        data: paginated,
        meta: {
          page,
          pageSize,
          total: allScheduled.length,
          totalPages: Math.ceil(allScheduled.length / pageSize),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.post(
  '/scheduled',
  validateBody(createScheduledReportSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = `sched-${Date.now()}`;
      const scheduled = {
        id,
        ...req.validatedBody,
        lastRunAt: undefined,
        createdAt: new Date().toISOString(),
      };
      scheduledReports.set(id, scheduled);
      res.status(201).json({ data: scheduled });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.patch(
  '/scheduled/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scheduled = scheduledReports.get(req.params.id);
      if (!scheduled) {
        throw new AppError(404, 'Scheduled report not found', 'NOT_FOUND');
      }
      const updated = { ...scheduled, ...req.body, id: req.params.id };
      scheduledReports.set(req.params.id, updated);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.delete(
  '/scheduled/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!scheduledReports.has(req.params.id)) {
        throw new AppError(404, 'Scheduled report not found', 'NOT_FOUND');
      }
      scheduledReports.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.post(
  '/scheduled/:id/run',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scheduled = scheduledReports.get(req.params.id);
      if (!scheduled) {
        throw new AppError(404, 'Scheduled report not found', 'NOT_FOUND');
      }

      // Create a new run
      const runId = `run-${Date.now()}`;
      const run = {
        id: runId,
        reportId: scheduled.templateId,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        rowCount: Math.floor(Math.random() * 1000),
        createdAt: new Date().toISOString(),
      };
      reportRuns.set(runId, run);

      // Update scheduled report
      scheduled.lastRunAt = run.startedAt;
      scheduledReports.set(req.params.id, scheduled);

      res.json({ data: run });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Report Runs ───

adminReportsRouter.get(
  '/runs',
  validateQuery(paginationSchema.extend({ reportId: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize, reportId } = req.validatedQuery as any;
      let allRuns = Array.from(reportRuns.values());

      if (reportId) {
        allRuns = allRuns.filter((r) => r.reportId === reportId);
      }

      const start = (page - 1) * pageSize;
      const paginated = allRuns.slice(start, start + pageSize);

      res.json({
        data: paginated,
        meta: {
          page,
          pageSize,
          total: allRuns.length,
          totalPages: Math.ceil(allRuns.length / pageSize),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.get('/runs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const run = reportRuns.get(req.params.id);
    if (!run) {
      throw new AppError(404, 'Report run not found', 'NOT_FOUND');
    }
    res.json({ data: run });
  } catch (err) {
    next(err);
  }
});

adminReportsRouter.post(
  '/runs/:id/export',
  validateBody(z.object({ format: z.enum(['pdf', 'csv', 'excel']) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = reportRuns.get(req.params.id);
      if (!run) {
        throw new AppError(404, 'Report run not found', 'NOT_FOUND');
      }

      // TODO: Generate actual export file
      const downloadUrl = `https://api.vimad.io/v1/admin/reports/runs/${req.params.id}/download?format=${req.validatedBody.format}`;

      res.json({ data: { downloadUrl } });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Execute Report ───

adminReportsRouter.post(
  '/execute',
  validateBody(executeReportSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { templateId } = req.validatedBody as any;

      const template = templates.get(templateId);
      if (!template) {
        throw new AppError(404, 'Template not found', 'NOT_FOUND');
      }

      // Create a new run
      const runId = `run-${Date.now()}`;
      const run = {
        id: runId,
        reportId: templateId,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        rowCount: Math.floor(Math.random() * 500),
        createdAt: new Date().toISOString(),
      };
      reportRuns.set(runId, run);

      res.json({ data: run });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Build Custom Report ───

adminReportsRouter.post('/build', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = req.body;

    // Create or update template
    const id = config.id || `tpl-${Date.now()}`;
    const template = {
      id,
      name: config.name,
      description: config.description,
      category: 'custom',
      type: 'custom',
      config,
      fields: config.fields || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.set(id, template);

    // Create a run
    const runId = `run-${Date.now()}`;
    const run = {
      id: runId,
      reportId: id,
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      rowCount: Math.floor(Math.random() * 200),
      createdAt: new Date().toISOString(),
    };
    reportRuns.set(runId, run);

    res.json({ data: run });
  } catch (err) {
    next(err);
  }
});

// ─── Categories & Data Sources ───

adminReportsRouter.get('/categories', async (_req: Request, res: Response) => {
  res.json({
    data: ['operations', 'financial', 'marketing', 'guests', 'custom'],
  });
});

adminReportsRouter.get('/data-sources', async (_req: Request, res: Response) => {
  res.json({
    data: [
      { id: 'reservations', name: 'Reservations', description: 'Reservation data' },
      { id: 'guests', name: 'Guests', description: 'Guest profiles' },
      { id: 'revenue', name: 'Revenue', description: 'Financial data' },
      { id: 'housekeeping', name: 'Housekeeping', description: 'Housekeeping tasks' },
    ],
  });
});

// ─── Share Report ───

adminReportsRouter.post(
  '/runs/:id/share',
  validateBody(z.object({ emails: z.array(z.string().email()) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = reportRuns.get(req.params.id);
      if (!run) {
        throw new AppError(404, 'Report run not found', 'NOT_FOUND');
      }

      // TODO: Send emails with report link
      logger.info({ runId: req.params.id, emails: req.validatedBody.emails }, 'Report shared');

      res.json({ data: { shared: true } });
    } catch (err) {
      next(err);
    }
  }
);
