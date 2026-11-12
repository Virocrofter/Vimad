import { Router } from 'express';
import { z } from 'zod';
import { requireAdminRole } from './admin.middleware.js';
import * as profiler from './admin.profiler.service.js';

export const adminProfilerRouter = Router();
const wrap = (fn: any) => async (req: any, res: any) => {
  try {
    res.json({ data: await fn(req) });
  } catch (err: any) {
    req.log?.error?.({ err }, 'admin profiler route failed');
    const isZod = err?.name === 'ZodError';
    const status = err?.statusCode ?? (isZod ? 400 : 500);
    res
      .status(status)
      .json({
        error: {
          code: err?.code ?? (isZod ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'),
          message: err?.message || 'profiler error',
        },
      });
  }
};

adminProfilerRouter.get(
  '/profiler/summary',
  requireAdminRole,
  wrap(async () => profiler.getSummary())
);
adminProfilerRouter.get(
  '/profiler/slow-queries',
  requireAdminRole,
  wrap(async (req: any) => {
    const rangeH = Math.min(168, Math.max(1, Number(req.query.range ?? 24) || 24));
    const search = String(req.query.search ?? '').slice(0, 120);
    return profiler.getSlowQueries(rangeH, search);
  })
);
adminProfilerRouter.get(
  '/profiler/endpoints',
  requireAdminRole,
  wrap(async () => profiler.getEndpoints())
);
adminProfilerRouter.get(
  '/profiler/database',
  requireAdminRole,
  wrap(async () => profiler.getDatabase())
);
adminProfilerRouter.get(
  '/profiler/queues',
  requireAdminRole,
  wrap(async () => profiler.getQueues())
);
adminProfilerRouter.get(
  '/profiler/runtime',
  requireAdminRole,
  wrap(async () => profiler.getRuntime())
);
adminProfilerRouter.get(
  '/profiler/tenants',
  requireAdminRole,
  wrap(async () => profiler.getTenants())
);
adminProfilerRouter.post(
  '/profiler/explain',
  requireAdminRole,
  wrap(async (req: any) => {
    const { query } = z.object({ query: z.string().min(10).max(4000) }).parse(req.body);
    return profiler.runExplain(query);
  })
);
