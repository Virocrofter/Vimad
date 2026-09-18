/* apps/api/src/common/rate-limit.ts */
import rateLimit, { ipKeyGenerator, type RateLimitRequestHandler } from 'express-rate-limit';
import RedisStore, { RedisReply } from 'rate-limit-redis';
import type { Request } from 'express';
import { env } from './env.js';
import { logger } from './logger.js';
import { AppError } from './errors.js';
import { redisConnection } from './queue.js';
import { prisma } from './prisma.js';

// ─── Plan Tier Configuration ───
export const RATE_LIMIT_TIERS = {
  starter: { windowMs: 60 * 60 * 1000, max: 1_000, label: 'Starter' },
  professional: { windowMs: 60 * 60 * 1000, max: 10_000, label: 'Professional' },
  enterprise: { windowMs: 60 * 60 * 1000, max: 100_000, label: 'Enterprise' },
} as const;

export type PlanTier = keyof typeof RATE_LIMIT_TIERS;

// ─── Redis Connection ───
let rateLimitStoreConnected = false;

export async function initRateLimitRedis() {
  if (!env.RATE_LIMIT_REDIS_URL && !env.REDIS_URL) {
    logger.warn(
      'No Redis URL configured. Rate limiting will use in-memory store (not recommended for production).'
    );
    rateLimitStoreConnected = false;
    return null;
  }

  if (redisConnection.status === 'ready' || redisConnection.status === 'connect') {
    logger.info('Rate limiter using shared Redis connection (BullMQ/ioredis)');
    rateLimitStoreConnected = true;
    return redisConnection;
  }

  if (redisConnection.status === 'connecting') {
    logger.info('Waiting for shared Redis connection...');
    await new Promise<void>((resolve) => {
      const check = () => {
        if (redisConnection.status === 'ready') {
          rateLimitStoreConnected = true;
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
    return redisConnection;
  }

  logger.error('Shared Redis connection not available for rate limiting');
  rateLimitStoreConnected = false;
  return null;
}

export function getRedisClient() {
  return rateLimitStoreConnected ? redisConnection : null;
}

// ─── Key Generator ───
function keyGenerator(req: Request): string {
  const authReq = req as unknown as { auth?: { tenantId?: string; user?: { id?: string } } };
  if (authReq.auth?.tenantId && authReq.auth?.user?.id) {
    return `ratelimit:${authReq.auth.tenantId}:${authReq.auth.user.id}`;
  }
  return `ratelimit:ip:${ipKeyGenerator(req.ip ?? '')}`;
}

// ─── Tier Lookup: Read from database ───
// Cache tenant plan lookups for 60 seconds to avoid DB pressure
const tierCache = new Map<string, { tier: PlanTier; expiresAt: number }>();

async function getTierFromRequest(req: Request): Promise<PlanTier> {
  const authReq = req as unknown as { auth?: { tenantId?: string } };
  const tenantId = authReq.auth?.tenantId;

  if (!tenantId) return 'starter';

  const cached = tierCache.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tier;
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    const plan = tenant?.plan?.toLowerCase() ?? 'starter';
    const tier: PlanTier =
      plan === 'enterprise'
        ? 'enterprise'
        : plan === 'professional' || plan === 'pro'
          ? 'professional'
          : 'starter';

    tierCache.set(tenantId, { tier, expiresAt: Date.now() + 60_000 });
    return tier;
  } catch (err) {
    logger.warn({ err, tenantId }, 'Failed to look up tenant plan for rate limiting');
    return 'starter';
  }
}

// ─── Store Factory ───
function makeStore() {
  if (!rateLimitStoreConnected) return undefined;

  return new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisConnection.call(command, ...args) as Promise<RedisReply>,
  });
}

// ─── Create Tiered Rate Limiter ───
export function createTieredRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    max: async (req: Request) => {
      const tier = await getTierFromRequest(req);
      return RATE_LIMIT_TIERS[tier].max;
    },
    keyGenerator,
    store: makeStore(),
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.RATE_LIMIT_ENABLED !== 'true',
    handler: async (req, _res, _next, _options) => {
      const tier = await getTierFromRequest(req);
      logger.warn({ key: keyGenerator(req), ip: req.ip, path: req.path }, 'Rate limit reached');
      throw new AppError(
        429,
        `Rate limit exceeded. Tier: ${RATE_LIMIT_TIERS[tier].label} (${RATE_LIMIT_TIERS[tier].max.toLocaleString()}/hr)`,
        'RATE_LIMIT_EXCEEDED'
      );
    },
  });
}

// ─── Strict Limiter (for auth endpoints) ───
export function createStrictRateLimiter(
  windowMs: number = 15 * 60 * 1000,
  max: number = 5
): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => `strict:${ipKeyGenerator(req.ip ?? '')}:${req.path}`,
    store: makeStore(),
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.RATE_LIMIT_ENABLED !== 'true',
    handler: (_req, _res, _next, _options) => {
      throw new AppError(
        429,
        `Too many attempts. Please try again in ${Math.ceil(windowMs / 60000)} minutes.`,
        'RATE_LIMIT_EXCEEDED'
      );
    },
  });
}

// ─── General API Limiter (fallback) ───
export function createApiRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator,
    store: makeStore(),
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.RATE_LIMIT_ENABLED !== 'true',
    handler: (_req, _res, _next, _options) => {
      throw new AppError(429, 'Too many requests. Please slow down.', 'RATE_LIMIT_EXCEEDED');
    },
  });
}
