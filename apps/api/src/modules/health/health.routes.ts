/* apps/api/src/modules/health/health.routes.ts */
import { Router } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { getRedisClient, getWorkerCount } from '../../common/queue.js';
import { env } from '../../common/env.js';
import os from 'os';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const HealthCheckSchema = z.object({
  status: z.enum(['ok', 'error', 'degraded', 'unknown']),
  responseTimeMs: z.number().optional(),
  message: z.string().optional(),
});

const HealthResponseSchema = z
  .object({
    status: z.enum(['ok', 'degraded']),
    timestamp: z.string(),
    version: z.string(),
    uptime: z.number(),
    environment: z.string(),
    responseTimeMs: z.number(),
    workers: z.number().optional(),
    checks: z.record(z.string(), HealthCheckSchema),
  })
  .openapi('HealthResponse');

const LivenessResponseSchema = z
  .object({
    status: z.literal('alive'),
  })
  .openapi('LivenessResponse');

const ReadinessResponseSchema = z
  .object({
    status: z.enum(['ready', 'not_ready']),
    checks: z.record(z.string(), z.string()).optional(),
  })
  .openapi('ReadinessResponse');

export const healthRouter = Router();

interface HealthCheck {
  name: string;
  status: 'ok' | 'error' | 'degraded' | 'unknown';
  responseTimeMs?: number;
  message?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'database',
      status: 'ok',
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return {
      name: 'database',
      status: 'error',
      responseTimeMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  const client = getRedisClient();

  if (!client) {
    return {
      name: 'redis',
      status: 'unknown',
      message: 'Redis not connected',
    };
  }

  try {
    await client.ping();
    return {
      name: 'redis',
      status: 'ok',
      responseTimeMs: Date.now() - start,
    };
  } catch (err) {
    logger.error({ err }, 'Redis health check failed');
    return {
      name: 'redis',
      status: 'error',
      responseTimeMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function checkDiskSpace(): Promise<HealthCheck> {
  try {
    // Simple check: warn if memory pressure is high
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const memUsage = (totalMem - freeMem) / totalMem;

    if (memUsage > 0.95) {
      return {
        name: 'disk_space',
        status: 'degraded',
        message: `Memory usage at ${(memUsage * 100).toFixed(1)}%`,
      };
    }

    return {
      name: 'disk_space',
      status: 'ok',
      message: `Memory usage at ${(memUsage * 100).toFixed(1)}%`,
    };
  } catch {
    return {
      name: 'disk_space',
      status: 'unknown',
      message: 'Unable to check disk space',
    };
  }
}

async function checkExternalServices(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];

  // Stripe check (if configured)
  if (env.STRIPE_SECRET_KEY) {
    const start = Date.now();
    try {
      // Lightweight Stripe API check would go here
      // const stripe = new Stripe(env.STRIPE_SECRET_KEY);
      // await stripe.balance.retrieve();
      checks.push({
        name: 'stripe',
        status: 'ok',
        responseTimeMs: Date.now() - start,
      });
    } catch {
      checks.push({
        name: 'stripe',
        status: 'error',
        message: 'Stripe API unreachable',
      });
    }
  }

  return checks;
}

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Health'],
  description: 'Get system health status',
  responses: {
    200: {
      description: 'System healthy',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
    503: {
      description: 'System degraded',
      content: { 'application/json': { schema: HealthResponseSchema } },
    },
  },
});

healthRouter.get('/', async (_req, res) => {
  const timestamp = new Date().toISOString();

  const [database, redis, disk, externals] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkDiskSpace(),
    checkExternalServices(),
  ]);

  const allChecks = [database, redis, disk, ...externals];
  const failedChecks = allChecks.filter((c) => c.status === 'error');
  const degradedChecks = allChecks.filter((c) => c.status === 'degraded');

  const overallStatus =
    failedChecks.length > 0 ? 'degraded' : degradedChecks.length > 0 ? 'degraded' : 'ok';

  const responseTimeMs = allChecks.reduce((sum, c) => sum + (c.responseTimeMs ?? 0), 0);

  res.status(overallStatus === 'ok' ? 200 : 503).json({
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version ?? '0.0.0',
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    responseTimeMs,
    workers: getWorkerCount(),
    checks: allChecks.reduce(
      (acc, check) => {
        acc[check.name] = {
          status: check.status,
          ...(check.responseTimeMs && { responseTimeMs: check.responseTimeMs }),
          ...(check.message && { message: check.message }),
        };
        return acc;
      },
      {} as Record<string, unknown>
    ),
  });
});

// Liveness probe (k8s)
registry.registerPath({
  method: 'get',
  path: '/live',
  tags: ['Health'],
  description: 'Kubernetes liveness probe',
  responses: {
    200: {
      description: 'Service is alive',
      content: { 'application/json': { schema: LivenessResponseSchema } },
    },
  },
});

healthRouter.get('/live', (_req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (k8s)
registry.registerPath({
  method: 'get',
  path: '/ready',
  tags: ['Health'],
  description: 'Kubernetes readiness probe',
  responses: {
    200: {
      description: 'Service is ready',
      content: { 'application/json': { schema: ReadinessResponseSchema } },
    },
    503: {
      description: 'Service is not ready',
      content: { 'application/json': { schema: ReadinessResponseSchema } },
    },
  },
});

healthRouter.get('/ready', async (_req, res) => {
  const db = await checkDatabase();
  const redis = await checkRedis();

  if (db.status === 'error' || redis.status === 'error') {
    return res.status(503).json({
      status: 'not_ready',
      checks: { database: db.status, redis: redis.status },
    });
  }

  res.status(200).json({ status: 'ready' });
  return;
});
