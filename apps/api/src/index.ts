/* apps/api/src/index.ts */
import 'dotenv/config';
import './common/zod.js';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { env } from './common/env.js';
import { logger, requestLogger } from './common/logger.js';
import { errorHandler } from './common/errors.js';
import { sanitizeMiddleware } from './common/sanitize.js';
import { versionMiddleware } from './common/versioning.js';
import { metricsMiddleware, metricsHandler } from './common/metrics.js';
import { sentryErrorHandler } from './common/sentry.js';
import { generateOpenAPIDocument } from './common/openapi.js';
import { createSocketServer } from './common/socket.js';
import { idempotencyMiddleware } from './common/idempotency.js';
import {
  initRateLimitRedis,
  createTieredRateLimiter,
  createStrictRateLimiter,
  createApiRateLimiter,
  getRedisClient,
} from './common/rate-limit.js';

// ─── Phase 3: Background Jobs ───
import { closeQueues } from './common/queue.js';
import { queueDashboardMiddleware } from './jobs/dashboard.js';
import { emailWorker } from './jobs/email.worker.js';
import { nightAuditWorker } from './jobs/night-audit.job.js';
import { billingWorker } from './jobs/billing.job.js';
import { reportWorker } from './jobs/report.job.js';
import { gdprWorker } from './jobs/gdpr.job.js';
import { deadLetterWorker, attachDeadLetterHandler } from './jobs/dead-letter.handler.js';

import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { propertiesRouter } from './modules/properties/properties.routes.js';
import { guestsRouter } from './modules/guests/guests.routes.js';
import { reservationsRouter } from './modules/reservations/reservations.routes.js';
import { roomsRouter } from './modules/rooms/rooms.routes.js';
import { roomTypesRouter } from './modules/room-types/room-types.routes.js';
import { ratesRouter } from './modules/rates/rates.routes.js';
import { foliosRouter } from './modules/folios/folios.routes.js';
import { channelRouter } from './modules/channel/channel.routes.js';
import { housekeepingRouter } from './modules/housekeeping/housekeeping.routes.js';
import { nightAuditRouter } from './modules/night-audit/night-audit.routes.js';
import { smsRouter } from './modules/sms/sms.routes.js';
import { guestPortalRouter } from './modules/guest-portal/guest-portal.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { apiKeysRouter } from './modules/rbac/api-key.routes.js';
import { rbacRouter } from './modules/rbac/rbac.routes.js';
import { pushRouter } from './modules/push/push.routes.js';

const app = express();
const server = createServer(app);
const PORT = env.PORT;

// ─── Keep worker references alive ───
const activeWorkers = [
  emailWorker,
  nightAuditWorker,
  billingWorker,
  reportWorker,
  gdprWorker,
  deadLetterWorker,
];

async function bootstrap() {
  // Initialize Redis for rate limiting + job queues
  await initRateLimitRedis();

  // Security middleware
  app.use(helmet());

  // Compression for responses
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      level: 6,
    })
  );

  // ─── 1C.3: CORS hardening ───
  const corsOrigins = (() => {
    if (env.NODE_ENV === 'production') {
      if (!env.CORS_ORIGINS || env.CORS_ORIGINS.length === 0) {
        logger.warn('CORS_ORIGINS not set in production — defaulting to WEB_URL');
        return [env.WEB_URL];
      }
      return env.CORS_ORIGINS;
    }
    return env.CORS_ORIGINS ?? [env.WEB_URL, 'http://localhost:5173', 'http://localhost:3000'];
  })();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        logger.warn({ origin, allowedOrigins: corsOrigins }, 'CORS blocked request');
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-request-id',
        'x-api-version',
        'idempotency-key',
      ],
      exposedHeaders: ['x-request-id', 'x-api-version', 'RateLimit-*', 'Idempotency-Key'],
      maxAge: 86400,
    })
  );

  // Request ID + structured logging
  app.use(requestLogger);

  // Prometheus metrics instrumentation
  app.use(metricsMiddleware);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Input sanitization
  app.use(sanitizeMiddleware);

  // API Versioning
  app.use(versionMiddleware);

  // Idempotency middleware (for mutating operations)
  app.use(idempotencyMiddleware);

  // Prometheus scrape endpoint
  app.get('/metrics', metricsHandler);

  // Rate limiting
  const tieredLimiter = createTieredRateLimiter();
  const strictLimiter = createStrictRateLimiter();
  const apiLimiter = createApiRateLimiter();

  app.use(apiLimiter);

  // ─── API Documentation ───
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(generateOpenAPIDocument()));
  app.get('/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(generateOpenAPIDocument());
  });

  // ─── Health (unversioned, no auth) ───
  app.get('/', (_req, res) => {
    res.json({
      name: 'Vimad PMS API',
      version: '0.0.0',
      status: 'ok',
      environment: env.NODE_ENV,
      documentation: '/api-docs',
    });
  });
  app.use('/health', healthRouter);

  // ─── Auth (strict rate limit on sensitive endpoints) ───
  app.use('/auth/login', strictLimiter);
  app.use('/auth/register', strictLimiter);
  app.use('/auth/forgot-password', strictLimiter);
  app.use('/auth/reset-password', strictLimiter);
  app.use('/auth', authRouter);

  // ─── Versioned API Routes ───
  app.use('/v1/properties', tieredLimiter, propertiesRouter);
  app.use('/v1/guests', tieredLimiter, guestsRouter);
  app.use('/v1/reservations', tieredLimiter, reservationsRouter);
  app.use('/v1/rooms', tieredLimiter, roomsRouter);
  app.use('/v1/room-types', tieredLimiter, roomTypesRouter);
  app.use('/v1/rates', tieredLimiter, ratesRouter);
  app.use('/v1/folios', tieredLimiter, foliosRouter);
  app.use('/v1/channel', tieredLimiter, channelRouter);
  app.use('/v1/housekeeping', tieredLimiter, housekeepingRouter);
  app.use('/v1/night-audit', tieredLimiter, nightAuditRouter);
  app.use('/v1/sms', tieredLimiter, smsRouter);
  app.use('/v1/notifications', tieredLimiter, notificationRouter);
  app.use('/v1/api-keys', tieredLimiter, apiKeysRouter);
  app.use('/v1/rbac', tieredLimiter, rbacRouter);
  app.use('/v1/push', tieredLimiter, pushRouter);
  app.use('/v1/guest-portal', tieredLimiter, guestPortalRouter);

  // Legacy non-versioned routes
  app.use('/properties', tieredLimiter, propertiesRouter);
  app.use('/guests', tieredLimiter, guestsRouter);
  app.use('/reservations', tieredLimiter, reservationsRouter);
  app.use('/rooms', tieredLimiter, roomsRouter);
  app.use('/room-types', tieredLimiter, roomTypesRouter);
  app.use('/rates', tieredLimiter, ratesRouter);
  app.use('/folios', tieredLimiter, foliosRouter);
  app.use('/channel', tieredLimiter, channelRouter);
  app.use('/housekeeping', tieredLimiter, housekeepingRouter);
  app.use('/night-audit', tieredLimiter, nightAuditRouter);
  app.use('/sms', tieredLimiter, smsRouter);
  app.use('/notifications', tieredLimiter, notificationRouter);
  app.use('/api-keys', tieredLimiter, apiKeysRouter);
  app.use('/rbac', tieredLimiter, rbacRouter);
  app.use('/push', tieredLimiter, pushRouter);
  app.use('/guest-portal', tieredLimiter, guestPortalRouter);

  // ─── Phase 3: Queue Dashboard (protected) ───
  app.use('/admin/queues', ...queueDashboardMiddleware());

  // ─── Error Handling ───
  app.use(sentryErrorHandler);
  app.use(errorHandler);

  // ─── Attach dead-letter handlers ───
  attachDeadLetterHandler('email');
  attachDeadLetterHandler('night-audit');
  attachDeadLetterHandler('billing');
  attachDeadLetterHandler('report');
  attachDeadLetterHandler('gdpr');

  // ─── Graceful Shutdown ───
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await closeQueues();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await closeQueues();
    process.exit(0);
  });

  // ─── Real-time Layer ───
  createSocketServer(server);

  // ─── Start Server ───
  server.listen(PORT, () => {
    logger.info(
      {
        port: PORT,
        env: env.NODE_ENV,
        rateLimitEnabled: env.RATE_LIMIT_ENABLED,
        redisConnected: !!getRedisClient(),
        workersActive: activeWorkers.length,
      },
      `🚀 API server listening on port ${PORT}`
    );
  });
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Failed to start server');
  process.exit(1);
});

export { app };
