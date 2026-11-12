/* apps/api/src/common/profiler.ts — production profiler instrumentation.
   Side effects on import: Prisma $use query timing, request-context ALS,
   in-memory endpoint/N+1 aggregation, tenant cost flush, hourly snapshot cron. */
import type { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks';
import { schedule } from 'node-cron';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

interface ReqCtx {
  tenantId: string | null;
  route: string;
  queryCount: number;
  queryTimeMs: number;
}
const als = new AsyncLocalStorage<ReqCtx>();

const SLOW_MS = 300;
const slow = (ms: number) => ms > SLOW_MS;

// ── In-memory endpoint map (N+1 + recent latency/error signal) ──
interface EpAgg {
  samples: number[];
  errors: number;
  count: number;
  sumMs: number;
  queryCounts: number[];
}
const epMap = new Map<string, EpAgg>();
const epKey = (m: string, r: string) => `${m} ${r}`;

function epBump(key: string, ms: number, err: boolean, qc: number) {
  const existing = epMap.get(key);
  const e: EpAgg = existing ?? { samples: [], errors: 0, count: 0, sumMs: 0, queryCounts: [] };
  e.samples.push(ms);
  if (e.samples.length > 500) e.samples.shift();
  e.queryCounts.push(qc);
  if (e.queryCounts.length > 500) e.queryCounts.shift();
  e.count += 1;
  e.sumMs += ms;
  if (err) e.errors += 1;
  epMap.set(key, e);
}

export function epSnapshot() {
  return [...epMap.entries()].map(([key, e]) => {
    const s = [...e.samples].sort((a, b) => a - b);
    const q = (p: number) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0);
    const qc = e.queryCounts.reduce((a, b) => a + b, 0);
    return {
      key,
      count: e.count,
      avgMs: e.count ? e.sumMs / e.count : 0,
      p50: q(0.5),
      p95: q(0.95),
      errors: e.errors,
      queryCountAvg: e.queryCounts.length ? qc / e.queryCounts.length : 0,
    };
  });
}

// ── Tenant cost accumulation (flushed to profiler_tenant_costs) ──
const tenantTime = new Map<string, { queries: number; timeMs: number; slowQueries: number }>();
export function tenantBump(tenantId: string | null, ms: number) {
  if (!tenantId) return;
  let t = tenantTime.get(tenantId);
  if (!t) {
    t = { queries: 0, timeMs: 0, slowQueries: 0 };
    tenantTime.set(tenantId, t);
  }
  t.queries += 1;
  t.timeMs += ms;
  if (slow(ms)) t.slowQueries += 1;
}
export async function flushTenantCosts(): Promise<void> {
  if (tenantTime.size === 0) return;
  const batch = [...tenantTime.entries()];
  tenantTime.clear();
  for (const [tenantId, t] of batch) {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "profiler_tenant_costs" ("tenantId","queries","totalTimeMs","slowQueries","updatedAt")
         VALUES ($1,$2,$3,$4,now())
         ON CONFLICT ("tenantId") DO UPDATE SET
           "queries" = "profiler_tenant_costs"."queries" + EXCLUDED."queries",
           "totalTimeMs" = "profiler_tenant_costs"."totalTimeMs" + EXCLUDED."totalTimeMs",
           "slowQueries" = "profiler_tenant_costs"."slowQueries" + EXCLUDED."slowQueries",
           "updatedAt" = now()`,
        tenantId,
        t.queries,
        t.timeMs,
        t.slowQueries
      );
    } catch (err) {
      logger.warn({ err, tenantId }, 'profiler tenant flush failed');
    }
  }
}

// ── Express middleware: per-request context + endpoint aggregation ──
export function profilerMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/metrics') return next();
  const t0 = Date.now();
  const auth = (req as any).auth;
  let tenantId: string | null = auth?.user?.tenantId ?? auth?.user?.tenant?.id ?? null;
  if (!tenantId) {
    const h = req.headers.authorization;
    if (typeof h === 'string' && h.startsWith('Bearer ')) {
      try {
        const payload = JSON.parse(
          Buffer.from(h.slice(7).split('.')[1] || '', 'base64url').toString('utf8')
        );
        tenantId = typeof payload?.tenantId === 'string' ? payload.tenantId : null;
      } catch {
        /* unverifiable token — route auth rejects it; profiling just skips attribution */
      }
    }
  }
  const ctx: ReqCtx = {
    tenantId,
    route: `${req.baseUrl}${req.path}`,
    queryCount: 0,
    queryTimeMs: 0,
  };
  als.run(ctx, () => {
    res.on('finish', () => {
      const ms = Date.now() - t0;
      const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : ctx.route;
      const err = res.statusCode >= 500;
      epBump(epKey(req.method, route), ms, err, ctx.queryCount);
      if (ctx.queryCount > 25)
        logger.warn({ route, queryCount: ctx.queryCount, ms }, 'profiler: possible N+1');
    });
    next();
  });
}

// ── Prisma $use: time every query, capture slow ones, count N+1 ──
function summarize(params: any): string {
  try {
    const args = JSON.stringify(params.args ?? {});
    return `${params.model ?? 'raw'}.${params.action}(${args.slice(0, 400)})`;
  } catch {
    return `${params.model ?? 'raw'}.${params.action}`;
  }
}
let prismaAttached = false;
export function attachPrismaProfiler(): void {
  if (prismaAttached) return;
  prismaAttached = true;
  prisma.$use(async (params, nextPrisma) => {
    const t0 = Date.now();
    try {
      return await nextPrisma(params);
    } finally {
      const ms = Date.now() - t0;
      const ctx = als.getStore();
      if (ctx) {
        ctx.queryCount += 1;
        ctx.queryTimeMs += ms;
      }
      tenantBump(ctx?.tenantId ?? null, ms);
      if (slow(ms)) {
        const query = summarize(params);
        prisma.profilerSlowQuery
          .create({
            data: {
              tenantId: ctx?.tenantId ?? null,
              route: ctx?.route ?? null,
              query,
              durationMs: ms,
              rows: null,
            },
          })
          .catch((err) => logger.warn({ err }, 'profiler slow-query write failed'));
      }
    }
  });
  logger.info('profiler: prisma $use middleware attached');
}

// ── Runtime monitor (event loop delay) ──
let eld: IntervalHistogram | null = null;
export function startRuntimeMonitor(): void {
  if (eld) return;
  eld = monitorEventLoopDelay({ resolution: 20 });
  eld.enable();
}
export function runtimeSnapshot() {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  return {
    eventLoopMs: eld
      ? {
          p50: eld.percentile(50) / 1e6,
          p95: eld.percentile(95) / 1e6,
          p99: eld.percentile(99) / 1e6,
          max: (eld.max || 0) / 1e6,
        }
      : null,
    memoryMb: {
      rss: mem.rss / 1048576,
      heapUsed: mem.heapUsed / 1048576,
      heapTotal: mem.heapTotal / 1048576,
      external: mem.external / 1048576,
    },
    cpuUs: { user: cpu.user, system: cpu.system },
    uptimeSec: Math.round(process.uptime()),
    activeHandles: (process as any)._getActiveHandles?.().length ?? 0,
    loadAvg: (process as any).loadavg?.() ?? [],
    node: process.version,
    pid: process.pid,
  };
}

// ── pg_stat_statements snapshot (hourly at :07 + boot) ──
export async function snapshotPgStatStatements(): Promise<{
  ok: boolean;
  rows?: number;
  reason?: string;
}> {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT md5(query) AS fp, LEFT(query, 2000) AS q,
              calls::int AS calls, total_exec_time::float AS total_ms,
              mean_exec_time::float AS mean_ms, rows::float AS rows
       FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 100`
    );
    if (!rows.length) return { ok: true, rows: 0 };
    await flushTenantCosts();
    for (const r of rows) {
      await prisma.profilerQuerySnapshot.create({
        data: {
          fingerprint: r.fp,
          query: r.q,
          calls: Number(r.calls),
          totalTimeMs: Number(r.total_ms),
          meanTimeMs: Number(r.mean_ms),
          rows: Number(r.rows),
        },
      });
    }
    await prisma.$executeRawUnsafe(
      `DELETE FROM "profiler_query_snapshots" WHERE "capturedAt" < now() - interval '14 days'`
    );
    return { ok: true, rows: rows.length };
  } catch (err: any) {
    const reason = String(err?.message ?? err);
    if (!reason.includes('pg_stat_statements')) logger.warn({ err }, 'profiler snapshot failed');
    return {
      ok: false,
      reason: reason.includes('pg_stat_statements')
        ? 'pg_stat_statements extension not enabled'
        : reason,
    };
  }
}

// ── Self-registration (import side effects; idempotent) ──
attachPrismaProfiler();
startRuntimeMonitor();
schedule('7 * * * *', () => {
  snapshotPgStatStatements().catch(() => {});
});
schedule('*/5 * * * *', () => {
  flushTenantCosts().catch(() => {});
});
