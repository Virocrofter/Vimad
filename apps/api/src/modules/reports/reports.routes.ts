import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { REPORT_DEFINITIONS, getDefinition } from './reports.definitions.js';
import { computeNextRun, runReport } from './reports.service.js';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';

const MAX_AGE_DAYS = 180;

const runSchema = z.object({
  definitionKey: z.string().min(1),
  params: z.record(z.string()).default({}),
});
const scheduleSchema = z.object({
  definitionKey: z.string().min(1),
  name: z.string().min(1).max(120),
  params: z.record(z.string()).default({}),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'timeOfDay must be HH:MM'),
  recipients: z.array(z.string().email()).max(20).default([]),
  isActive: z.boolean().default(true),
});
const patchSchema = scheduleSchema.partial();

const templateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.string().max(60).optional(),
  fields: z.array(z.object({ name: z.string().min(1), label: z.string().min(1) })).default([]),
  config: z.record(z.unknown()).default({}),
});

const err = (res: any, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

const tenantOf = (req: any): string => req.auth?.tenantId;
const userOf = (req: any): string | undefined => req.auth?.userId ?? req.auth?.sub;

// Custom templates (admin report builder) persist as ReportTemplate rows and
// are exposed alongside the static definitions under a `custom:` key prefix.
function templateToDefinition(t: {
  id: string;
  name: string;
  description: string | null;
  fields: unknown;
}) {
  const fields = Array.isArray(t.fields)
    ? (t.fields as { name?: string; key?: string; label?: string }[])
    : [];
  return {
    key: `custom:${t.id}`,
    name: t.name,
    description: t.description ?? '',
    category: 'custom',
    params: [] as any[],
    columns: fields.map((f) => ({
      key: f.name ?? f.key ?? 'col',
      label: f.label ?? f.name ?? f.key ?? 'Column',
    })),
  };
}

async function definitionExists(tenantId: string, key: string): Promise<boolean> {
  if (getDefinition(key)) return true;
  if (!key.startsWith('custom:')) return false;
  const t = await prisma.reportTemplate.findFirst({
    where: { id: key.slice('custom:'.length), tenantId, type: 'custom' },
  });
  return Boolean(t);
}

export const reportsRouter = (() => {
  const router = Router();

  router.use(authMiddleware, tenantScope);

  router.get('/definitions', async (req, res) => {
    const custom = await prisma.reportTemplate.findMany({
      where: { tenantId: tenantOf(req), type: 'custom' },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: [...REPORT_DEFINITIONS, ...custom.map(templateToDefinition)] });
  });

  router.post('/definitions', async (req, res) => {
    const parsed = templateSchema.safeParse(req.body);
    if (!parsed.success)
      return err(res, 400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body');
    const t = await prisma.reportTemplate.create({
      data: {
        tenantId: tenantOf(req),
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        category: parsed.data.category ?? 'custom',
        type: 'custom',
        config: parsed.data.config as object,
        fields: parsed.data.fields as object,
      },
    });
    res.status(201).json({ data: templateToDefinition(t) });
  });

  router.get('/dashboard', async (req, res) => {
    const tenantId = tenantOf(req);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const [customCount, scheduledActive, runsThisMonth, runsTotal] = await Promise.all([
      prisma.reportTemplate.count({ where: { tenantId, type: 'custom' } }),
      prisma.tenantScheduledReport.count({ where: { tenantId, isActive: true } }),
      prisma.tenantReportRun.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
      prisma.tenantReportRun.count({ where: { tenantId } }),
    ]);
    res.json({
      data: {
        totalReports: REPORT_DEFINITIONS.length + customCount,
        scheduledActive,
        runsThisMonth,
        runsTotal,
      },
    });
  });

  router.post('/run', async (req, res) => {
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success)
      return err(res, 400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body');
    const run = await runReport(
      prisma,
      tenantOf(req),
      userOf(req),
      parsed.data.definitionKey,
      parsed.data.params
    );
    res.status(201).json({ data: run });
  });

  router.get('/runs', async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const where: any = {
      tenantId: tenantOf(req),
      createdAt: { gte: new Date(Date.now() - MAX_AGE_DAYS * 86400000) },
    };
    if (req.query.definitionKey) where.definitionKey = String(req.query.definitionKey);
    const [total, items] = await Promise.all([
      prisma.tenantReportRun.count({ where }),
      prisma.tenantReportRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    res.json({ data: { items, total, page } });
  });

  router.get('/runs/:id', async (req, res) => {
    const run = await prisma.tenantReportRun.findFirst({
      where: { id: req.params.id, tenantId: tenantOf(req) },
    });
    if (!run) return err(res, 404, 'NOT_FOUND', 'Report run not found');
    res.json({ data: run });
  });

  router.get('/runs/:id/export', async (req, res) => {
    const run = await prisma.tenantReportRun.findFirst({
      where: { id: req.params.id, tenantId: tenantOf(req) },
    });
    if (!run || !run.result) return err(res, 404, 'NOT_FOUND', 'Report run not found');
    const { columns, rows } = run.result as {
      columns: { key: string; label: string }[];
      rows: Record<string, unknown>[];
    };
    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      columns.map((c) => esc(c.label)).join(','),
      ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(',')),
    ].join('\n');
    if (req.query.as === 'json')
      return res.json({
        data: { filename: `report-${run.definitionKey}-${run.id}.csv`, content: csv },
      });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${run.definitionKey}-${run.id}.csv"`
    );
    res.send(csv);
  });

  router.get('/schedules', async (req, res) => {
    const items = await prisma.tenantScheduledReport.findMany({
      where: { tenantId: tenantOf(req) },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: items });
  });

  router.post('/schedules', async (req, res) => {
    const parsed = scheduleSchema.safeParse(req.body);
    if (!parsed.success)
      return err(res, 400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body');
    if (!(await definitionExists(tenantOf(req), parsed.data.definitionKey)))
      return err(res, 400, 'VALIDATION_ERROR', 'Unknown report definition');
    const item = await prisma.tenantScheduledReport.create({
      data: {
        ...parsed.data,
        tenantId: tenantOf(req),
        createdById: userOf(req),
        params: parsed.data.params as object,
        nextRunAt: computeNextRun(parsed.data, new Date()),
      },
    });
    res.status(201).json({ data: item });
  });

  router.post('/schedules/:id/run', async (req, res) => {
    const s = await prisma.tenantScheduledReport.findFirst({
      where: { id: req.params.id, tenantId: tenantOf(req) },
    });
    if (!s) return err(res, 404, 'NOT_FOUND', 'Schedule not found');
    const run = await runReport(
      prisma,
      s.tenantId,
      userOf(req),
      s.definitionKey,
      (s.params as Record<string, string>) ?? {}
    );
    await prisma.tenantScheduledReport.update({
      where: { id: s.id },
      data: { lastRunAt: new Date(), nextRunAt: computeNextRun(s, new Date()) },
    });
    res.status(201).json({ data: run });
  });

  router.patch('/schedules/:id', async (req, res) => {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success)
      return err(res, 400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid body');
    const existing = await prisma.tenantScheduledReport.findFirst({
      where: { id: req.params.id, tenantId: tenantOf(req) },
    });
    if (!existing) return err(res, 404, 'NOT_FOUND', 'Schedule not found');
    const merged = { ...existing, ...parsed.data };
    const item = await prisma.tenantScheduledReport.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        params: (parsed.data.params ?? existing.params) as object,
        nextRunAt: computeNextRun(merged as any, new Date()),
      },
    });
    res.json({ data: item });
  });

  router.delete('/schedules/:id', async (req, res) => {
    const existing = await prisma.tenantScheduledReport.findFirst({
      where: { id: req.params.id, tenantId: tenantOf(req) },
    });
    if (!existing) return err(res, 404, 'NOT_FOUND', 'Schedule not found');
    await prisma.tenantScheduledReport.delete({ where: { id: existing.id } });
    res.status(204).send();
  });

  return router;
})();
