/* apps/api/src/modules/admin/admin.profiler.service.ts — profiler data assembly */
import { prisma } from '../../common/prisma.js';
import { register } from '../../common/metrics.js';
import { QUEUE_NAMES, getQueue, getWorkerCount } from '../../common/queue.js';
import { epSnapshot, runtimeSnapshot, flushTenantCosts } from '../../common/profiler.js';
import { AppError } from '../../common/errors.js';

const num = (v: any) => Number(v ?? 0);
async function pgAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM pg_stat_statements LIMIT 1`);
    return true;
  } catch {
    return false;
  }
}
const pctDelta = (now: number, prev: number) =>
  prev > 0 ? ((now - prev) / prev) * 100 : now > 0 ? 100 : 0;

// ── /summary ──
export async function getSummary() {
  const [dbHit] = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT
      SUM(heap_blks_hit + idx_blks_hit + toast_blks_hit) AS hit,
      SUM(heap_blks_read + idx_blks_read + toast_blks_read) AS read
    FROM pg_statio_user_tables`
    )
    .catch(() => [{ hit: 1, read: 0 }]);
  const cacheHitPct =
    num(dbHit?.hit) + num(dbHit?.read) > 0
      ? (num(dbHit?.hit) / (num(dbHit?.hit) + num(dbHit?.read))) * 100
      : 100;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 864e5);
  const twoAgo = new Date(now.getTime() - 2 * 864e5);
  const [slowNow, slowPrev] = await Promise.all([
    prisma.profilerSlowQuery.aggregate({
      _count: true,
      _sum: { durationMs: true },
      where: { createdAt: { gte: dayAgo } },
    }),
    prisma.profilerSlowQuery.aggregate({
      _count: true,
      _sum: { durationMs: true },
      where: { createdAt: { gte: twoAgo, lt: dayAgo } },
    }),
  ]);
  const failedJobs = await prisma.failedJob.count({ where: { status: { not: 'resolved' } } });
  const eps = epSnapshot();
  const tot = eps.reduce((a, e) => a + e.count, 0) || 1;
  const errRate = (eps.reduce((a, e) => a + e.errors, 0) / tot) * 100;
  const rt = runtimeSnapshot();
  const elP99 = rt.eventLoopMs?.p99 ?? 0;

  let score = 100;
  if (cacheHitPct < 95) score -= 15;
  if (num(slowNow._count) > 100) score -= 10;
  else if (num(slowNow._count) > 25) score -= 5;
  if (errRate > 1) score -= 15;
  else if (errRate > 0.2) score -= 5;
  if (failedJobs > 20) score -= 10;
  else if (failedJobs > 5) score -= 5;
  if (elP99 > 100) score -= 10;
  else if (elP99 > 25) score -= 5;
  score = Math.max(0, Math.min(100, score));

  const topSlow = await prisma.profilerSlowQuery.groupBy({
    by: ['query'],
    _count: true,
    _avg: { durationMs: true },
    where: { createdAt: { gte: dayAgo } },
    orderBy: { _count: { query: 'desc' } },
    take: 3,
  });
  const topEndpoints = [...eps]
    .filter((e) => e.count > 3)
    .sort((a, b) => b.p95 - a.p95)
    .slice(0, 3)
    .map((e) => ({
      key: e.key,
      p95: e.p95,
      avgMs: e.avgMs,
      errorRate: e.count ? (e.errors / e.count) * 100 : 0,
    }));
  const tenants = await topTenants(3);

  return {
    score,
    generatedAt: now.toISOString(),
    layers: {
      database: {
        cacheHitPct,
        slowQueries24h: num(slowNow._count),
        slowDeltaPct: pctDelta(num(slowNow._count), num(slowPrev._count)),
      },
      http: { errorRate: errRate, requests: tot, slowEndpoints: topEndpoints.length },
      queues: { failedUnresolved: failedJobs },
      runtime: { eventLoopP99Ms: elP99, rssMb: rt.memoryMb.rss },
    },
    offenders: {
      slowQueries: topSlow.map((s) => ({
        query: s.query,
        count: num(s._count),
        avgMs: num(s._avg?.durationMs),
      })),
      endpoints: topEndpoints,
      tenants,
    },
  };
}

// ── /slow-queries ──
export async function getSlowQueries(rangeH = 24, search = '') {
  const hasPg = await pgAvailable();
  let fingerprints: any[] = [];
  if (hasPg) {
    const rows = await prisma.$queryRawUnsafe<
      any[]
    >(`SELECT md5(query) AS fp, LEFT(query,2000) AS q, calls::int AS calls,
        mean_exec_time::float AS mean_ms, total_exec_time::float AS total_ms, rows::float AS rows
      FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 60`);
    const prev = await prisma.$queryRawUnsafe<
      any[]
    >(`SELECT DISTINCT ON (fingerprint) fingerprint, "meanTimeMs" AS mean
      FROM "profiler_query_snapshots" WHERE "capturedAt" >= now() - interval '25 hours' ORDER BY fingerprint, "capturedAt" ASC`);
    const prevMap = new Map(prev.map((p) => [p.fingerprint, num(p.mean)]));
    fingerprints = rows.map((r) => {
      const base = prevMap.get(r.fp);
      return {
        fingerprint: r.fp,
        query: r.q,
        calls: num(r.calls),
        meanMs: num(r.mean_ms),
        totalMs: num(r.total_ms),
        rows: num(r.rows),
        deltaPct: base != null ? pctDelta(num(r.mean_ms), base) : null,
      };
    });
  }
  const since = new Date(Date.now() - rangeH * 36e5);
  const events = await prisma.profilerSlowQuery.findMany({
    where: {
      createdAt: { gte: since },
      ...(search ? { query: { contains: search, mode: 'insensitive' } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 80,
  });
  return { pgAvailable: hasPg, fingerprints, events };
}

// ── /endpoints (prom histogram aggregates + N+1) ──
export async function getEndpoints() {
  const hist = register.getSingleMetric('http_request_duration_seconds') as any;
  const counter = register.getSingleMetric('http_requests_total') as any;
  const agg = new Map<string, any>();
  for (const v of hist?.get()?.values ?? []) {
    const key = `${v.labels.method} ${v.labels.route}`;
    const prev = agg.get(key);
    const a = prev ?? {
      method: v.labels.method,
      route: v.labels.route,
      buckets: {} as Record<string, number>,
      count: 0,
      sum: 0,
    };
    for (const [le, n] of Object.entries(v.buckets)) a.buckets[le] = num(a.buckets[le]) + num(n);
    a.count += num(v.count);
    a.sum += num(v.sum);
    agg.set(key, a);
  }
  const errBy = new Map<string, number>();
  for (const v of counter?.get()?.values ?? []) {
    if (num(v.labels.status_code) >= 500)
      errBy.set(
        `${v.labels.method} ${v.labels.route}`,
        num(errBy.get(`${v.labels.method} ${v.labels.route}`)) + num(v.value)
      );
  }
  const npMap = new Map(epSnapshot().map((e) => [e.key, e]));
  const endpoints = [...agg.values()]
    .filter((a) => a.route && !a.route.includes('profiler') && a.route !== '/metrics')
    .map((a) => {
      const les = Object.keys(a.buckets)
        .map(Number)
        .filter((n) => !Number.isNaN(n))
        .sort((x, y) => x - y);
      const q = (p: number) => {
        const t = p * a.count;
        let c = 0;
        for (const le of les) {
          c = num(a.buckets[String(le)]);
          if (c >= t) return le;
        }
        return les.length ? les[les.length - 1] : 0;
      };
      const errs = errBy.get(`${a.method} ${a.route}`) ?? 0;
      const np = npMap.get(`${a.method} ${a.route}`);
      return {
        method: a.method,
        route: a.route,
        requestCount: a.count,
        avgMs: (a.sum / Math.max(1, a.count)) * 1000,
        p50Ms: q(0.5) * 1000,
        p95Ms: q(0.95) * 1000,
        p99Ms: q(0.99) * 1000,
        errorRate: a.count ? (errs / a.count) * 100 : 0,
        queryCountAvg: np?.queryCountAvg ?? 0,
        nplus1: (np?.queryCountAvg ?? 0) > 15,
      };
    })
    .sort((a, b) => b.p95Ms - a.p95Ms);
  return { endpoints };
}

// ── /database ──
export async function getDatabase() {
  const sizes = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT schemaname, relname, pg_total_relation_size(c.oid) AS bytes,
      n_live_tup AS live, n_dead_tup AS dead, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze, seq_scan, idx_scan
    FROM pg_stat_user_tables s JOIN pg_class c ON c.relname = s.relname JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = s.schemaname
    ORDER BY bytes DESC LIMIT 15`
    )
    .catch(() => []);
  const [dbRow] = await prisma
    .$queryRawUnsafe<any[]>(`SELECT pg_database_size(current_database()) AS bytes`)
    .catch(() => [{ bytes: 0 }]);
  const conns = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT COALESCE(state,'unknown') AS state, COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = current_database() GROUP BY 1`
    )
    .catch(() => []);
  const hit = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT SUM(heap_blks_hit+idx_blks_hit+toast_blks_hit) AS hit, SUM(heap_blks_read+idx_blks_read+toast_blks_read) AS read FROM pg_statio_user_tables`
    )
    .catch(() => [{ hit: 1, read: 0 }]);
  const blocking = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT DISTINCT ON (w.pid) w.pid AS blocked_pid, wa.query AS blocked_query,
      h.pid AS blocker_pid, h.query AS blocker_query, now() - wa.query_start AS blocked_for
    FROM pg_locks w
    JOIN pg_stat_activity wa ON wa.pid = w.pid
    JOIN LATERAL (
      SELECT hl.pid, a.query FROM pg_locks hl
      JOIN pg_stat_activity a ON a.pid = hl.pid
      WHERE hl.granted AND hl.locktype = w.locktype
        AND hl.database IS NOT DISTINCT FROM w.database
        AND hl.relation IS NOT DISTINCT FROM w.relation
        AND hl.page IS NOT DISTINCT FROM w.page
        AND hl.tuple IS NOT DISTINCT FROM w.tuple
        AND hl.transactionid IS NOT DISTINCT FROM w.transactionid
        AND hl.classid IS NOT DISTINCT FROM w.classid
        AND hl.objid IS NOT DISTINCT FROM w.objid
        AND hl.objsubid IS NOT DISTINCT FROM w.objsubid
        AND hl.pid <> w.pid
      LIMIT 1
    ) h ON true
    WHERE NOT w.granted
    ORDER BY w.pid LIMIT 20`
    )
    .catch(() => []);
  const seqScans = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT relname, seq_scan, seq_tup_read, idx_scan FROM pg_stat_user_tables WHERE seq_scan > 100 ORDER BY seq_tup_read DESC LIMIT 10`
    )
    .catch(() => []);
  const unusedIdx = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT schemaname, relname, indexrelname, idx_scan, pg_relation_size(indexrelid) AS bytes
    FROM pg_stat_user_indexes WHERE idx_scan = 0 AND pg_relation_size(indexrelid) > 1048576 ORDER BY bytes DESC LIMIT 10`
    )
    .catch(() => []);
  const fkMissing = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT DISTINCT c.conrelid::regclass::text AS tbl, a.attname AS col
    FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.contype = 'f' AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND a.attnum = ANY(string_to_array(i.indkey::text,' ')::int[])) LIMIT 20`
    )
    .catch(() => []);
  const wraparound = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT datname, age(datfrozenxid) AS xid_age, current_setting('autovacuum_freeze_max_age')::int AS max_age FROM pg_database WHERE datname = current_database()`
    )
    .catch(() => []);
  const hit0 = hit?.[0] ?? { hit: 1, read: 0 };
  return {
    dbSizeBytes: num(dbRow?.bytes),
    connections: conns.map((c) => ({ state: c.state, count: num(c.count) })),
    cacheHitPct:
      num(hit0.hit) + num(hit0.read) > 0
        ? (num(hit0.hit) / (num(hit0.hit) + num(hit0.read))) * 100
        : 100,
    tables: sizes.map((t) => ({
      schema: t.schemaname,
      table: t.relname,
      bytes: num(t.bytes),
      live: num(t.live),
      dead: num(t.dead),
      lastAutovacuum: t.last_autovacuum ?? null,
      lastVacuum: t.last_vacuum ?? null,
      lastAutoanalyze: t.last_autoanalyze ?? null,
      seqScan: num(t.seq_scan),
      idxScan: num(t.idx_scan),
    })),
    blocking: blocking.map((b) => ({
      blockedPid: num(b.blocked_pid),
      blockedQuery: b.blocked_query,
      blockerPid: num(b.blocker_pid),
      blockerQuery: b.blocker_query,
      blockedFor: b.blocked_for,
    })),
    indexAdvisor: {
      seqScanTables: seqScans.map((s) => ({
        table: s.relname,
        seqScans: num(s.seq_scan),
        seqTupRead: num(s.seq_tup_read),
        idxScans: num(s.idx_scan),
        suggestion: `CREATE INDEX ON ${s.relname} (<filter column>);`,
      })),
      unusedIndexes: unusedIdx.map((u) => ({
        schema: u.schemaname,
        table: u.relname,
        index: u.indexrelname,
        bytes: num(u.bytes),
        idxScans: num(u.idx_scan),
      })),
      missingFkIndexes: fkMissing.map((f) => ({
        table: f.tbl,
        column: f.col,
        suggestion: `CREATE INDEX ON ${f.tbl} (${f.col});`,
      })),
    },
    wraparound: wraparound.map((w) => ({
      database: w.datname,
      xidAge: num(w.xid_age),
      maxAge: num(w.max_age),
      pct: num(w.max_age) ? (num(w.xid_age) / num(w.max_age)) * 100 : 0,
    })),
  };
}

// ── /queues ──
export async function getQueues() {
  const failedByQueue = await prisma.failedJob.groupBy({
    by: ['queue'],
    _count: true,
    where: { status: { not: 'resolved' } },
  });
  const failedMap = new Map(failedByQueue.map((f) => [f.queue, num(f._count)]));
  const heartbeats = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT DISTINCT ON (name) name, "ranAt", "durationMs", "itemsProcessed", error FROM "scheduler_heartbeats" ORDER BY name, "ranAt" DESC LIMIT 12`
    )
    .catch(() => []);
  const queues = [];
  for (const name of QUEUE_NAMES) {
    try {
      const c = await getQueue(name).getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused'
      );
      queues.push({
        name,
        ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, num(v)])),
        failedUnresolved: failedMap.get(name) ?? 0,
        available: true,
      });
    } catch {
      queues.push({ name, available: false, failedUnresolved: failedMap.get(name) ?? 0 });
    }
  }
  return {
    queues,
    workers: getWorkerCount(),
    heartbeats: heartbeats.map((h) => ({
      name: h.name,
      ranAt: h.ranAt,
      durationMs: num(h.durationMs),
      items: num(h.itemsProcessed),
      error: h.error,
    })),
  };
}

// ── /runtime ──
export async function getRuntime() {
  await flushTenantCosts();
  return runtimeSnapshot();
}

// ── /tenants ──
async function topTenants(take: number) {
  const rows = await prisma
    .$queryRawUnsafe<any[]>(
      `SELECT u."tenantId", SUM(u.quantity)::int AS calls
    FROM "usage_records" u WHERE u."recordedAt" >= now() - interval '7 days' GROUP BY 1 ORDER BY calls DESC LIMIT $1`,
      take
    )
    .catch(() => []);
  const ids = rows.map((r) => r.tenantId);
  const tenants = ids.length
    ? await prisma.tenant.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, slug: true, plan: true },
      })
    : [];
  const costs = ids.length
    ? await prisma.profilerTenantCost.findMany({ where: { tenantId: { in: ids } } })
    : [];
  const costMap = new Map(costs.map((c) => [c.tenantId, c]));
  const tMap = new Map(tenants.map((t) => [t.id, t]));
  const totalCalls = rows.reduce((a, r) => a + num(r.calls), 0) || 1;
  return rows.map((r) => ({
    tenantId: r.tenantId,
    name: tMap.get(r.tenantId)?.name ?? r.tenantId,
    slug: tMap.get(r.tenantId)?.slug,
    plan: tMap.get(r.tenantId)?.plan ?? 'trial',
    apiCalls7d: num(r.calls),
    sharePct: (num(r.calls) / totalCalls) * 100,
    queryTimeMs: costMap.get(r.tenantId)?.totalTimeMs ?? 0,
    slowQueries: costMap.get(r.tenantId)?.slowQueries ?? 0,
  }));
}
export async function getTenants() {
  return { tenants: await topTenants(15) };
}

// ── POST /explain — safety-gated EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ──
const FORBIDDEN =
  /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|vacuum|reindex|cluster)\b/i;
interface PlanNode {
  nodeType: string;
  relation?: string;
  filter?: string;
  totalCost: number;
  actualRows: number;
  planRows: number;
  misestimate: number;
  seqScan: boolean;
  sharedHit: number;
  sharedRead: number;
  children: PlanNode[];
}
function flatten(node: any): PlanNode {
  return {
    nodeType: node['Node Type'] ?? '?',
    relation: node['Relation Name'],
    filter: node.Filter,
    totalCost: num(node['Total Cost']),
    actualRows: num(node['Actual Rows']),
    planRows: num(node['Plan Rows']),
    misestimate: num(node['Plan Rows']) > 0 ? num(node['Actual Rows']) / num(node['Plan Rows']) : 0,
    seqScan:
      node['Node Type'] === 'Seq Scan' && !!node['Relation Name'] && num(node['Plan Rows']) > 1000,
    sharedHit: num(node['Shared Hit Blocks']),
    sharedRead: num(node['Shared Read Blocks']),
    children: (node.Plans ?? []).map(flatten),
  };
}
export async function runExplain(raw: string) {
  const query = raw
    .replace(/--[^\n]*$/gm, '')
    .trim()
    .replace(/;\s*$/, '');
  if (query.length < 10 || query.length > 4000)
    throw new AppError(400, 'Query must be 10-4000 chars', 'BAD_QUERY');
  if (!/^(select|with)\b/i.test(query)) throw new AppError(400, 'SELECT/WITH only', 'NOT_SELECT');
  if (FORBIDDEN.test(query))
    throw new AppError(400, 'Query contains a forbidden keyword', 'FORBIDDEN_STMT');
  const res = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '5s'`);
    return tx.$queryRawUnsafe<any[]>(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`);
  });
  const payload = Array.isArray(res) ? res[0] : res;
  const plan = payload?.['QUERY PLAN']?.[0] ?? payload?.[0];
  if (!plan?.Plan) throw new AppError(500, 'Could not parse plan', 'PLAN_PARSE');
  return {
    planningTimeMs: num(plan['Planning Time']),
    executionTimeMs: num(plan['Execution Time']),
    plan: flatten(plan.Plan),
    warnings: [
      /Seq Scan/i.test(JSON.stringify(plan))
        ? 'Sequential scan detected - check the index advisor'
        : null,
    ].filter(Boolean),
  };
}
