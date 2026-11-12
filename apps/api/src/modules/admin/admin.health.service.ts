// Production-grade system health: live platform signals, scheduler dead-man
// grid, synthetic probes, per-tenant health scores, guest-journey SLIs,
// nightly batch-job panel, and auto-opened incidents.
import { getRedisClient } from '../../common/queue.js';
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { LOOPS } from '../../common/heartbeat.js';

const startedAt = Date.now();
const fmtUptime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400),
    h = Math.floor((s % 86400) / 3600),
    m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
};

async function q<T>(sql: string, ...params: any[]): Promise<T> {
  return prisma.$queryRawUnsafe(sql, ...params) as Promise<T>;
}

// ── Overview: real signals only ──
export async function getHealthOverview() {
  const t0 = Date.now();
  let db: { status: string; latencyMs: number } = { status: 'operational', latencyMs: 0 };
  try {
    await q('SELECT 1');
    db.latencyMs = Date.now() - t0;
  } catch {
    db = { status: 'critical', latencyMs: Date.now() - t0 };
  }

  let redis: { status: string; latencyMs: number } = { status: 'degraded', latencyMs: 0 };
  const client = getRedisClient();
  if (client) {
    const r0 = Date.now();
    try {
      await client.ping();
      redis = { status: 'operational', latencyMs: Date.now() - r0 };
    } catch {
      redis = { status: 'critical', latencyMs: Date.now() - r0 };
    }
  }

  const [openIncidents, failedJobs, openExceptions, hbRows] = await Promise.all([
    q<any[]>(
      `SELECT count(*)::int AS c FROM "incidents" WHERE "status" NOT IN ('resolved','closed')`
    ),
    q<any[]>(`SELECT count(*)::int AS c FROM "failed_jobs" WHERE "status" = 'pending'`),
    q<any[]>(`SELECT count(*)::int AS c FROM "exceptions" WHERE "status" = 'open'`),
    q<any[]>(`SELECT "name", "ranAt" FROM "scheduler_heartbeats"`),
  ]);
  const hbMap = Object.fromEntries(hbRows.map((r: any) => [r.name, new Date(r.ranAt)]));
  const stale = LOOPS.filter((l) => {
    const last = hbMap[l.label];
    return !last || Date.now() - last.getTime() > l.expectedMs * 2;
  }).map((l) => l.label);

  const mem = process.memoryUsage();
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (db.status === 'critical' || redis.status === 'critical' || stale.length > 0)
    status = 'critical';
  else if (redis.status === 'degraded' || failedJobs[0].c > 20 || openExceptions[0].c > 50)
    status = 'degraded';

  const services = [
    {
      name: 'Database',
      status: db.status,
      latencyMs: db.latencyMs,
      detail: 'PostgreSQL via Prisma (SELECT 1)',
    },
    {
      name: 'Redis / Queue',
      status: redis.status,
      latencyMs: redis.latencyMs,
      detail: client ? 'ioredis ping' : 'no redis client configured',
    },
    {
      name: 'Cron Loops',
      status: stale.length === 0 ? 'operational' : 'critical',
      latencyMs: 0,
      detail: stale.length === 0 ? 'all loops checking in' : `stale: ${stale.join(', ')}`,
    },
    {
      name: 'API Server',
      status: 'operational',
      latencyMs: 0,
      detail: `uptime ${fmtUptime(Date.now() - startedAt)} | heap ${Math.round(mem.heapUsed / 1048576)}MB`,
    },
    {
      name: 'Job Queue (DLQ)',
      status: failedJobs[0].c > 50 ? 'critical' : failedJobs[0].c > 0 ? 'degraded' : 'operational',
      latencyMs: 0,
      detail: `${failedJobs[0].c} dead-lettered jobs awaiting retry`,
    },
  ];

  return {
    status,
    generatedAt: new Date().toISOString(),
    uptime: fmtUptime(Date.now() - startedAt),
    openIncidents: openIncidents[0].c,
    openExceptions: openExceptions[0].c,
    staleLoops: stale,
    services,
  };
}

// ── Heartbeat grid ──
export async function getHeartbeats() {
  const rows = await q<any[]>(
    `SELECT "name","ranAt","durationMs","itemsProcessed","error" FROM "scheduler_heartbeats" ORDER BY "name"`
  );
  const byName = new Map(rows.map((r) => [r.name, r]));
  const tiles = LOOPS.map((l) => {
    const r = byName.get(l.label);
    const ageMs = r ? Date.now() - new Date(r.ranAt).getTime() : null;
    const status =
      ageMs === null
        ? 'silent'
        : ageMs <= l.expectedMs * 2
          ? 'ok'
          : ageMs <= l.expectedMs * 4
            ? 'stale'
            : 'dead';
    return {
      name: l.label,
      expectedMs: l.expectedMs,
      status,
      ageMs,
      ranAt: r?.ranAt ?? null,
      durationMs: r?.durationMs ?? 0,
      error: r?.error ?? null,
    };
  });
  const extra = rows
    .filter((r) => !LOOPS.some((l) => l.label === r.name))
    .map((r) => ({
      name: r.name,
      expectedMs: null,
      status: 'ok',
      ageMs: Date.now() - new Date(r.ranAt).getTime(),
      ranAt: r.ranAt,
      durationMs: r.durationMs,
      error: r.error,
    }));
  return { tiles: [...tiles, ...extra] };
}

// ── Synthetic probes ──
async function runBookingProbe() {
  const t0 = Date.now();
  try {
    const props = await q<any[]>(
      `SELECT p."id", p."name", count(r."id")::int AS rooms, count(rp."id")::int AS rate_plans
       FROM "properties" p
       LEFT JOIN "rooms" r ON r."propertyId" = p."id"
       LEFT JOIN "rate_plans" rp ON rp."propertyId" = p."id" AND rp."status" = 'active'
       WHERE p."status" = 'active' GROUP BY p."id", p."name" LIMIT 1`
    );
    if (!props[0] || props[0].rooms === 0)
      return {
        status: 'fail',
        latencyMs: Date.now() - t0,
        detail: 'no active property with rooms',
        error: 'inventory empty',
      };
    return {
      status: 'pass',
      latencyMs: Date.now() - t0,
      detail: `${props[0].name}: ${props[0].rooms} rooms, ${props[0].rate_plans} active rate plans`,
    };
  } catch (e: any) {
    return {
      status: 'fail',
      latencyMs: Date.now() - t0,
      detail: null,
      error: String(e?.message || e),
    };
  }
}

async function runPortalProbe() {
  const t0 = Date.now();
  try {
    const g = await q<any[]>(`SELECT count(*)::int AS c FROM "guests" WHERE "email" IS NOT NULL`);
    const s = await q<any[]>(`SELECT count(*)::int AS c FROM "guest_checkin_sessions"`);
    return {
      status: 'pass',
      latencyMs: Date.now() - t0,
      detail: `${g[0].c} guests with email | ${s[0].c} check-in sessions on record`,
    };
  } catch (e: any) {
    return {
      status: 'fail',
      latencyMs: Date.now() - t0,
      detail: null,
      error: String(e?.message || e),
    };
  }
}

async function runWebhookProbe() {
  const t0 = Date.now();
  try {
    const r = await q<any[]>(
      `SELECT count(*)::int AS ok, max("postedAt") AS last_post
       FROM "payments" WHERE "status" = 'success' AND "createdAt" > now() - interval '24 hours'`
    );
    const ok = r[0].ok > 0;
    return {
      status: ok ? 'pass' : 'warn',
      latencyMs: Date.now() - t0,
      detail: ok
        ? `${r[0].ok} successful payments in 24h | last folio post ${r[0].last_post ?? 'n/a'}`
        : 'no successful payments in 24h (ok if quiet)',
      error: null,
    };
  } catch (e: any) {
    return {
      status: 'fail',
      latencyMs: Date.now() - t0,
      detail: null,
      error: String(e?.message || e),
    };
  }
}

const PROBES = [
  { key: 'booking-engine', label: 'Booking Engine', fn: runBookingProbe },
  { key: 'guest-portal', label: 'Guest Portal', fn: runPortalProbe },
  { key: 'payments-webhook', label: 'Payments / Webhooks', fn: runWebhookProbe },
];

export async function runProbes() {
  const results = [];
  for (const p of PROBES) {
    const r = await p.fn();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "health_checks" ("id","probe","status","latencyMs","detail","error","ranAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, now())`,
      p.key,
      r.status,
      r.latencyMs,
      r.detail,
      r.error
    );
    results.push({ probe: p.key, label: p.label, ...r, ranAt: new Date().toISOString() });
  }
  await maybeAutoIncident(results);
  return { results };
}

export async function getProbes() {
  const rows = await q<any[]>(
    `SELECT DISTINCT ON ("probe") "probe","status","latencyMs","detail","error","ranAt"
     FROM "health_checks" ORDER BY "probe", "ranAt" DESC`
  );
  return {
    results: PROBES.map((p) => {
      const r = rows.find((x) => x.probe === p.key);
      return r
        ? {
            probe: p.key,
            label: p.label,
            status: r.status,
            latencyMs: r.latencyMs,
            detail: r.detail,
            error: r.error,
            ranAt: r.ranAt,
          }
        : {
            probe: p.key,
            label: p.label,
            status: 'never_run',
            latencyMs: 0,
            detail: 'press Run probes',
            error: null,
            ranAt: null,
          };
    }),
  };
}

// ── Auto-open incidents from thresholds ──
async function maybeAutoIncident(probeResults: any[]) {
  const reasons: string[] = [];
  const failing = probeResults.filter((p) => p.status === 'fail');
  if (failing.length) reasons.push(`probe failures: ${failing.map((f) => f.probe).join(', ')}`);
  const stale = await q<any[]>(
    `SELECT "name" FROM "scheduler_heartbeats" WHERE "ranAt" < now() - interval '2 hours'`
  );
  if (stale.length) reasons.push(`stale cron loops: ${stale.map((s: any) => s.name).join(', ')}`);
  if (!reasons.length) return;
  const title = `Auto-detected: ${reasons.join('; ')}`.slice(0, 200);
  const exists = await q<any[]>(
    `SELECT 1 FROM "incidents" WHERE "title" = $1 AND "status" NOT IN ('resolved','closed') LIMIT 1`,
    title
  );
  if (exists.length) return;
  await prisma.$executeRawUnsafe(
    `INSERT INTO "incidents" ("id","severity","title","status","timeline","createdBy","createdAt","updatedAt")
     VALUES (gen_random_uuid()::text, 'high', $1, 'investigating', '[]', 'health-monitor', now(), now())`,
    title
  );
  logger.warn({ title }, 'auto-incident opened');
}

// ── Incidents CRUD (existing P10 incidents table) ──
export async function getIncidents() {
  return q<any[]>(`SELECT * FROM "incidents" ORDER BY "startedAt" DESC LIMIT 100`);
}
export async function createIncident(input: { title: string; severity: string; detail?: string }) {
  const row = await q<any[]>(
    `INSERT INTO "incidents" ("id","severity","title","status","timeline","createdBy","createdAt","updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'investigating', '[]', 'platform_admin', now(), now()) RETURNING *`,
    input.severity,
    input.title
  );
  return row[0];
}
export async function updateIncident(id: string, patch: { status?: string; note?: string }) {
  if (patch.status) {
    await prisma.$executeRawUnsafe(
      `UPDATE "incidents" SET "status" = $1,
         "resolvedAt" = CASE WHEN $1 IN ('resolved','closed') THEN now() ELSE "resolvedAt" END,
         "timeline" = "timeline" || jsonb_build_object('at', now(), 'status', $1, 'note', $2),
         "updatedAt" = now() WHERE "id" = $3`,
      patch.status,
      patch.note ?? null,
      id
    );
  }
  return q<any[]>(`SELECT * FROM "incidents" WHERE "id" = $1`, id);
}

// ── Per-tenant health score (0-100, every component from real rows) ──
export async function getTenantScores() {
  const rows = await q<any[]>(`
    WITH pay AS (
      SELECT "tenantId",
        count(*) FILTER (WHERE "status" = 'success')::int AS ok,
        count(*) FILTER (WHERE "status" IN ('failed','cancelled'))::int AS bad,
        count(*)::int AS total
      FROM "payments" WHERE "createdAt" > now() - interval '30 days' GROUP BY "tenantId"
    ),
    email AS (
      SELECT "tenantId",
        count(*) FILTER (WHERE "status" = 'sent')::int AS sent,
        count(*)::int AS total
      FROM "email_logs" WHERE "createdAt" > now() - interval '30 days' GROUP BY "tenantId"
    ),
    exc AS (
      SELECT "tenantId", count(*)::int AS open FROM "exceptions" WHERE "status" = 'open' GROUP BY "tenantId"
    ),
    jobs AS (
      SELECT count(*)::int AS c FROM "failed_jobs"
      WHERE "status" = 'pending' AND "createdAt" > now() - interval '24 hours'
    ),
    audit AS (
      SELECT p."tenantId",
        count(DISTINCT p."id")::int AS props,
        count(DISTINCT na."id") FILTER (WHERE na."status" = 'completed')::int AS completed
      FROM "properties" p
      LEFT JOIN "night_audits" na
        ON na."propertyId" = p."id" AND na."auditDate" = CURRENT_DATE - 1
      GROUP BY p."tenantId"
    )
    SELECT t."id", t."name", t."slug", t."plan", t."status",
      COALESCE(pay.ok,0) AS pay_ok, COALESCE(pay.bad,0) AS pay_bad, COALESCE(pay.total,0) AS pay_total,
      COALESCE(email.sent,0) AS email_sent, COALESCE(email.total,0) AS email_total,
      COALESCE(exc.open,0) AS exceptions_open, (SELECT c FROM jobs) AS failed_jobs_24h,
      COALESCE(audit.props,0) AS props, COALESCE(audit.completed,0) AS audits_completed
    FROM "tenants" t
    LEFT JOIN pay ON pay."tenantId" = t."id"
    LEFT JOIN email ON email."tenantId" = t."id"
    LEFT JOIN exc ON exc."tenantId" = t."id"
    LEFT JOIN audit ON audit."tenantId" = t."id"
    ORDER BY t."createdAt" DESC LIMIT 500`);
  return {
    tenants: rows.map((r) => ({ ...r, score: tenantScore(r), band: band(tenantScore(r)) })),
  };
}

function tenantScore(r: any) {
  let s = 100;
  if (r.pay_total > 0) s -= Math.min(40, (r.pay_bad / r.pay_total) * 100);
  if (r.email_total > 0) s -= Math.min(20, (1 - r.email_sent / r.email_total) * 50);
  s -= Math.min(20, r.exceptions_open * 2);
  s -= Math.min(10, r.failed_jobs_24h);
  if (r.props > 0) s -= Math.min(10, ((r.props - r.audits_completed) / r.props) * 10);
  return Math.max(0, Math.round(s));
}
const band = (s: number) => (s >= 80 ? 'green' : s >= 50 ? 'amber' : 'red');

export async function getTenantHealthDetail(tenantId: string) {
  const payments = await q<any[]>(
    `SELECT "status", count(*)::int AS c FROM "payments"
     WHERE "tenantId" = $1 AND "createdAt" > now() - interval '30 days' GROUP BY "status"`,
    tenantId
  );
  const emails = await q<any[]>(
    `SELECT "status", count(*)::int AS c FROM "email_logs"
     WHERE "tenantId" = $1 AND "createdAt" > now() - interval '30 days' GROUP BY "status"`,
    tenantId
  );
  const exceptions = await q<any[]>(
    `SELECT "type","severity","title","createdAt" FROM "exceptions"
     WHERE "tenantId" = $1 AND "status" = 'open' ORDER BY "createdAt" DESC LIMIT 20`,
    tenantId
  );
  const audits = await q<any[]>(
    `SELECT na."auditDate", na."status", p."name" AS property FROM "night_audits" na
     JOIN "properties" p ON p."id" = na."propertyId"
     WHERE p."tenantId" = $1 ORDER BY na."auditDate" DESC LIMIT 14`,
    tenantId
  );
  const failedJobs = await q<any[]>(
    `SELECT "jobName","queue","failReason","createdAt" FROM "failed_jobs"
     WHERE "createdAt" > now() - interval '24 hours' ORDER BY "createdAt" DESC LIMIT 20`
  );
  return { payments, emails, exceptions, audits, failedJobs };
}

// ── Guest-journey SLIs per property ──
export async function getJourneys() {
  return q<any[]>(`
    SELECT p."id" AS "propertyId", p."tenantId" AS "tenantId", p."name",
      (SELECT count(*)::int FROM "guest_checkin_sessions" s WHERE s."propertyId" = p."id"
        AND s."createdAt" > now() - interval '30 days') AS checkins_started,
      (SELECT count(*)::int FROM "guest_checkin_sessions" s WHERE s."propertyId" = p."id"
        AND s."completedAt" IS NOT NULL AND s."createdAt" > now() - interval '30 days') AS checkins_done,
      (SELECT count(*)::int FROM "payment_requests" pr JOIN "reservations" r ON r."id" = pr."reservationId"
        WHERE r."propertyId" = p."id" AND pr."createdAt" > now() - interval '30 days') AS payreq_total,
      (SELECT count(*)::int FROM "payment_requests" pr JOIN "reservations" r ON r."id" = pr."reservationId"
        WHERE r."propertyId" = p."id" AND pr."status" = 'paid' AND pr."createdAt" > now() - interval '30 days') AS payreq_paid,
      (SELECT count(*)::int FROM "guest_orders" o WHERE o."propertyId" = p."id"
        AND o."createdAt" > now() - interval '30 days') AS orders_total,
      (SELECT count(*)::int FROM "guest_orders" o WHERE o."propertyId" = p."id"
        AND o."status" = 'delivered' AND o."createdAt" > now() - interval '30 days') AS orders_delivered
    FROM "properties" p WHERE p."status" = 'active' ORDER BY p."name" LIMIT 200`);
}

// ── Nightly batch panel ──
export async function getNightly() {
  const [cache, reportFails, mealErrors, hb] = await Promise.all([
    q<any[]>(
      `SELECT max("computedAt") AS freshest, count(*)::int AS rows FROM "inventory_daily_cache"`
    ),
    q<any[]>(
      `SELECT count(*)::int AS c FROM "report_runs" WHERE "status" = 'failed' AND "startedAt" > now() - interval '24 hours'`
    ),
    q<any[]>(
      `SELECT count(*)::int AS c FROM "meal_plan_postings" WHERE "status" = 'failed' AND "createdAt" > now() - interval '24 hours'`
    ),
    q<any[]>(`SELECT "name","ranAt","error" FROM "scheduler_heartbeats"
              WHERE "name" IN ('inventory-cache','wakeup-digest','hk-overnight','overbooking-alerts','ar-dunning','scheduled-reports')`),
  ]);
  const ageMs = cache[0].freshest ? Date.now() - new Date(cache[0].freshest).getTime() : null;
  return {
    inventoryCache: {
      rows: cache[0].rows,
      freshest: cache[0].freshest,
      ageMs,
      fresh: ageMs !== null && ageMs < 86400000,
    },
    reportFailures24h: reportFails[0].c,
    mealPostingFailures24h: mealErrors[0].c,
    nightlyLoops: hb,
  };
}
