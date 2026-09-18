/* apps/api/src/common/metrics.ts */
import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

// ─── Registry ───
export const register = new client.Registry();

register.setDefaultLabels({ service: 'vimad-api', env: process.env.NODE_ENV ?? 'development' });

// Node.js process metrics (event loop lag, GC, memory, handles…)
client.collectDefaultMetrics({ register });

// ─── HTTP metrics ───
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'HTTP requests currently being processed',
  registers: [register],
});

/**
 * Express middleware — mount BEFORE the routers:
 *   app.use(metricsMiddleware);
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Don't measure the scrape endpoint itself
  if (req.path === '/metrics') return next();

  httpRequestsInFlight.inc();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    httpRequestsInFlight.dec();
    // Use the matched route pattern, not the raw URL, to keep cardinality
    // bounded ("/v1/guests/:id", not "/v1/guests/clx123…").
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : `${req.baseUrl || req.path} (unmatched)`;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    end(labels);
  });

  next();
}

// ─── Database pool stats ───
// Prisma doesn't expose pool internals, so we sample Postgres directly:
// pg_stat_activity gives real connection counts by state for this DB.

export const dbConnections = new client.Gauge({
  name: 'db_connections',
  help: 'Postgres connections for this database by state',
  labelNames: ['state'],
  registers: [register],
});

export const dbUp = new client.Gauge({
  name: 'db_up',
  help: '1 if the database is reachable, 0 otherwise',
  registers: [register],
});

export async function collectDbMetrics(): Promise<void> {
  try {
    const rows = await prisma.$queryRaw<{ state: string | null; count: bigint }[]>`
      SELECT state, COUNT(*)::bigint AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `;

    dbConnections.reset();
    for (const row of rows) {
      dbConnections.set({ state: row.state ?? 'unknown' }, Number(row.count));
    }
    dbUp.set(1);
  } catch (err) {
    dbUp.set(0);
    logger.warn({ err }, 'failed to collect database metrics');
  }
}

export const metricsContentType = register.contentType;

/**
 * Standalone request handler serving the Prometheus scrape endpoint.
 * Matches how index.ts already mounts it:
 *   app.get('/metrics', metricsHandler);
 */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  await collectDbMetrics(); // fresh DB stats on every scrape
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
}
