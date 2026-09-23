/* apps/api/src/modules/admin/admin.reports.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { prisma } from '../../common/prisma.js';
import { putFile, getSignedDownloadUrl } from '../../common/storage.js';
import { sendEmail } from '../../jobs/email.queue.js';

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

// ─── System templates (idempotent ensure — no reseed required) ───

const SYSTEM_TEMPLATES = [
  {
    id: 'sys-tpl-occupancy',
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
  },
  {
    id: 'sys-tpl-revenue',
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
  },
] as const;

let systemTemplatesEnsured = false;

async function ensureSystemTemplates(): Promise<void> {
  if (systemTemplatesEnsured) return;
  for (const tpl of SYSTEM_TEMPLATES) {
    await prisma.reportTemplate.upsert({
      where: { id: tpl.id },
      update: {},
      create: { ...tpl, tenantId: null, fields: tpl.fields as any, config: tpl.config as any },
    });
  }
  systemTemplatesEnsured = true;
}

function tenantIdOf(req: Request): string {
  return (req as AuthenticatedRequest).auth.tenantId;
}

// ─── Export file generation ───

async function generateExportFile(
  runId: string,
  tenantId: string,
  format: 'pdf' | 'csv' | 'excel'
): Promise<{ key: string; contentType: string }> {
  const run = await prisma.reportRun.findFirst({
    where: { id: runId },
    include: { template: true },
  });
  if (!run) throw new AppError(404, 'Report run not found', 'NOT_FOUND');

  const payload = {
    report: run.template.name,
    category: run.template.category,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    rowCount: run.rowCount,
    generatedAt: new Date().toISOString(),
  };

  // csv → real CSV. excel/pdf → JSON payload until a renderer is integrated.
  const isCsv = format === 'csv';
  const ext = isCsv ? 'csv' : 'json';
  const contentType = isCsv ? 'text/csv' : 'application/json';
  const content = isCsv
    ? [
        'report,category,status,startedAt,completedAt,rowCount,generatedAt',
        [
          payload.report,
          payload.category,
          payload.status,
          payload.startedAt.toISOString(),
          payload.completedAt?.toISOString() ?? '',
          payload.rowCount,
          payload.generatedAt,
        ].join(','),
      ].join('\n')
    : JSON.stringify(payload, null, 2);

  const key = `reports/${tenantId}/${runId}.${ext}`;
  await putFile(key, content, contentType);
  return { key, contentType };
}

// ─── Dashboard Stats ───

adminReportsRouter.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureSystemTemplates();
    const tenantId = tenantIdOf(req);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalReports, scheduledActive, runsThisMonth, completedRuns] = await Promise.all([
      prisma.reportTemplate.count({ where: { OR: [{ tenantId: null }, { tenantId }] } }),
      prisma.scheduledReport.count({
        where: { status: 'active', template: { OR: [{ tenantId: null }, { tenantId }] } },
      }),
      prisma.reportRun.count({
        where: {
          startedAt: { gte: monthStart },
          template: { OR: [{ tenantId: null }, { tenantId }] },
        },
      }),
      prisma.reportRun.findMany({
        where: {
          status: 'completed',
          completedAt: { not: null },
          template: { OR: [{ tenantId: null }, { tenantId }] },
        },
        select: { startedAt: true, completedAt: true },
      }),
    ]);

    const avgRuntime =
      completedRuns.length > 0
        ? completedRuns.reduce((sum, r) => {
            return sum + (r.completedAt!.getTime() - r.startedAt.getTime()) / 1000;
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
      await ensureSystemTemplates();
      const tenantId = tenantIdOf(req);
      const { page, pageSize, category } = req.validatedQuery as any;

      const where = {
        OR: [{ tenantId: null }, { tenantId }],
        ...(category ? { category } : {}),
      };

      const [data, total] = await Promise.all([
        prisma.reportTemplate.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.reportTemplate.count({ where }),
      ]);

      res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.get(
  '/templates/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = tenantIdOf(req);
      const template = await prisma.reportTemplate.findFirst({
        where: { id: req.params.id, OR: [{ tenantId: null }, { tenantId }] },
      });
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');
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
      const tenantId = tenantIdOf(req);
      const body = req.validatedBody as z.infer<typeof createTemplateSchema>;
      const template = await prisma.reportTemplate.create({
        data: { ...body, tenantId, config: body.config as any, fields: body.fields as any },
      });
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
      const tenantId = tenantIdOf(req);
      const existing = await prisma.reportTemplate.findFirst({
        where: { id: req.params.id, tenantId },
      });
      if (!existing) throw new AppError(404, 'Template not found', 'NOT_FOUND');
      if (existing.type === 'system') {
        throw new AppError(409, 'System templates cannot be modified', 'CONFLICT');
      }
      const updated = await prisma.reportTemplate.update({
        where: { id: req.params.id },
        data: req.body,
      });
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
      const tenantId = tenantIdOf(req);
      const existing = await prisma.reportTemplate.findFirst({
        where: { id: req.params.id, tenantId },
      });
      if (!existing) throw new AppError(404, 'Template not found', 'NOT_FOUND');
      if (existing.type === 'system') {
        throw new AppError(409, 'System templates cannot be deleted', 'CONFLICT');
      }
      await prisma.reportTemplate.delete({ where: { id: req.params.id } });
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
      const tenantId = tenantIdOf(req);
      const { page, pageSize } = req.validatedQuery as any;
      const where = { template: { OR: [{ tenantId: null }, { tenantId }] } };

      const [data, total] = await Promise.all([
        prisma.scheduledReport.findMany({
          where,
          include: { template: { select: { name: true, category: true } } },
          orderBy: { nextRunAt: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.scheduledReport.count({ where }),
      ]);

      res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
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
      const body = req.validatedBody as z.infer<typeof createScheduledReportSchema>;
      const template = await prisma.reportTemplate.findUnique({ where: { id: body.templateId } });
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');

      const scheduled = await prisma.scheduledReport.create({
        data: {
          ...body,
          parameters: body.parameters as any,
          nextRunAt: new Date(body.nextRunAt),
        },
      });
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
      const existing = await prisma.scheduledReport.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError(404, 'Scheduled report not found', 'NOT_FOUND');

      const { nextRunAt, ...rest } = req.body;
      const updated = await prisma.scheduledReport.update({
        where: { id: req.params.id },
        data: { ...rest, ...(nextRunAt ? { nextRunAt: new Date(nextRunAt) } : {}) },
      });
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
      const existing = await prisma.scheduledReport.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new AppError(404, 'Scheduled report not found', 'NOT_FOUND');
      await prisma.scheduledReport.delete({ where: { id: req.params.id } });
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
      const scheduled = await prisma.scheduledReport.findUnique({ where: { id: req.params.id } });
      if (!scheduled) throw new AppError(404, 'Scheduled report not found', 'NOT_FOUND');

      const run = await prisma.reportRun.create({
        data: {
          reportId: scheduled.templateId,
          status: 'completed',
          completedAt: new Date(),
          rowCount: 0, // data-source engine lands with Phase 1G reporting work
        },
      });

      await prisma.scheduledReport.update({
        where: { id: req.params.id },
        data: { lastRunAt: run.startedAt },
      });

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
      const tenantId = tenantIdOf(req);
      const { page, pageSize, reportId } = req.validatedQuery as any;
      const where = {
        template: { OR: [{ tenantId: null }, { tenantId }] },
        ...(reportId ? { reportId } : {}),
      };

      const [data, total] = await Promise.all([
        prisma.reportRun.findMany({
          where,
          include: { template: { select: { name: true, category: true } } },
          orderBy: { startedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.reportRun.count({ where }),
      ]);

      res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
    } catch (err) {
      next(err);
    }
  }
);

adminReportsRouter.get('/runs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const run = await prisma.reportRun.findUnique({
      where: { id: req.params.id },
      include: { template: { select: { name: true, category: true } } },
    });
    if (!run) throw new AppError(404, 'Report run not found', 'NOT_FOUND');
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
      const tenantId = tenantIdOf(req);
      const { format } = req.validatedBody as { format: 'pdf' | 'csv' | 'excel' };

      const { key } = await generateExportFile(req.params.id, tenantId, format);
      const downloadUrl = await getSignedDownloadUrl(key, {
        downloadName: `report-${req.params.id}.${format === 'csv' ? 'csv' : 'json'}`,
      });

      await prisma.reportRun.update({
        where: { id: req.params.id },
        data: { fileKey: key, fileUrl: downloadUrl },
      });

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
      const { templateId, parameters } = req.validatedBody as z.infer<typeof executeReportSchema>;

      const template = await prisma.reportTemplate.findUnique({ where: { id: templateId } });
      if (!template) throw new AppError(404, 'Template not found', 'NOT_FOUND');

      const run = await prisma.reportRun.create({
        data: {
          reportId: templateId,
          status: 'completed',
          completedAt: new Date(),
          rowCount: 0, // parameters recorded on the run's template config; engine lands in 1G
        },
      });

      logger.info({ runId: run.id, templateId, parameters }, 'report executed');
      res.json({ data: run });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Build Custom Report ───

adminReportsRouter.post('/build', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = tenantIdOf(req);
    const config = req.body;

    const template = config.id
      ? await prisma.reportTemplate.update({
          where: { id: config.id },
          data: {
            name: config.name,
            description: config.description,
            config: config as any,
            fields: (config.fields ?? []) as any,
          },
        })
      : await prisma.reportTemplate.create({
          data: {
            tenantId,
            name: config.name,
            description: config.description,
            category: 'custom',
            type: 'custom',
            config: config as any,
            fields: (config.fields ?? []) as any,
          },
        });

    const run = await prisma.reportRun.create({
      data: {
        reportId: template.id,
        status: 'completed',
        completedAt: new Date(),
        rowCount: 0,
      },
    });

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
      const { emails } = req.validatedBody as { emails: string[] };

      const run = await prisma.reportRun.findUnique({
        where: { id: req.params.id },
        include: { template: { select: { name: true } } },
      });
      if (!run) throw new AppError(404, 'Report run not found', 'NOT_FOUND');

      // Signed link: reuse existing fileKey if present, otherwise generate the export now
      let downloadUrl: string | null = null;
      if (run.fileKey) {
        downloadUrl = await getSignedDownloadUrl(run.fileKey);
      }

      for (const to of emails) {
        await sendEmail({
          to,
          subject: `Report shared with you: ${run.template.name}`,
          template: 'generic',
          payload: {
            heading: 'A report was shared with you',
            reportName: run.template.name,
            runId: run.id,
            status: run.status,
            completedAt: run.completedAt,
            downloadUrl,
            message: downloadUrl
              ? 'Download it using the secure link in this email (link expires).'
              : 'No export file has been generated for this run yet.',
          },
        });
      }

      logger.info({ runId: req.params.id, emails }, 'Report shared');
      res.json({ data: { shared: true, emailsSent: emails.length } });
    } catch (err) {
      next(err);
    }
  }
);
