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
import { metricsMiddleware, metricsHandler, recordApiUsage } from './common/metrics.js';
import { sentryErrorHandler } from './common/sentry.js';
import { generateOpenAPIDocument } from './common/openapi.js';
// import { createSocketServer } from './common/socket.js'; // TODO: re-enable after socket.js is decoupled from auth.service.ts
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
import { startNightAuditScheduler } from './jobs/night-audit.job.js';
import { billingWorker } from './jobs/billing.job.js';
import { reportWorker } from './jobs/report.job.js';
import { gdprWorker } from './jobs/gdpr.job.js';
import { deadLetterWorker, attachDeadLetterHandler } from './jobs/dead-letter.handler.js';
// [PAYMENTS] Paystack payment worker (webhook → folio side effects)
import { paymentWorker } from './jobs/payment.job.js';
// [DEPOSIT-AUTOMATION] payment request reminders + expiry/auto-cancel
import { paymentRequestWorker, startPaymentRequestScheduler } from './jobs/payment-request.job.js';
// [A3] transactional email — pre-arrival scanner
import {
  transactionalEmailWorker,
  startTransactionalEmailScheduler,
} from './jobs/transactional-email.job.js';

import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { propertiesRouter } from './modules/properties/properties.routes.js';
import { guestsRouter } from './modules/guests/guests.routes.js';
import { reservationsRouter } from './modules/reservations/reservations.routes.js';
import { roomsRouter } from './modules/rooms/rooms.routes.js';
import { roomTypesRouter } from './modules/room-types/room-types.routes.js';
import { ratesRouter } from './modules/rates/rates.routes.js';
import { foliosRouter } from './modules/folios/folios.routes.js';
import { loyaltyRouter } from './modules/loyalty/loyalty.routes.js';
import { channelRouter } from './modules/channel/channel.routes.js';
import { housekeepingRouter } from './modules/housekeeping/housekeeping.routes.js';
import { nightAuditRouter } from './modules/night-audit/night-audit.routes.js';
import { smsRouter } from './modules/sms/sms.routes.js';
import { guestPortalRouter } from './modules/guest-portal/guest-portal.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
// [A3] transactional email center (email logs + manual triggers)
import { transactionalEmailRouter } from './modules/notifications/transactional.routes.js';
import { apiKeysRouter } from './modules/rbac/api-key.routes.js';
import { rbacRouter } from './modules/rbac/rbac.routes.js';
import { pushRouter } from './modules/push/push.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
// [PAYMENTS] Paystack payments router + public webhook router
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { paymentsWebhookRouter } from './modules/payments/payments.webhook.js';
// [DEPOSIT-AUTOMATION] payment requests router
import { paymentRequestsRouter } from './modules/payments/payment-requests.routes.js';
// [A4] public booking engine (no auth — rate limited at mount)
import { publicRouter } from './modules/public/public.routes.js';
// [A5] SARS-compliant tax invoices & receipts
import { invoicesRouter } from './modules/invoices/invoices.routes.js';

const app = express();
const server = createServer(app);
const PORT = env.PORT;

// Workers start on import (module-level createWorker) — track them for shutdown
const activeWorkers = [
  emailWorker,

  billingWorker,
  reportWorker,
  gdprWorker,
  deadLetterWorker,
  paymentWorker, // [PAYMENTS]
  paymentRequestWorker, // [DEPOSIT-AUTOMATION]
  transactionalEmailWorker, // [A3]
];

async function bootstrap() {
  // Initialize Redis for rate limiting + job queues
  await initRateLimitRedis();

  // Security middleware
  app.use(helmet());

  // Compression for responses
  app.use(
    compression({
      filter: (req: any, res: any) => {
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
  // [PAYMENTS] `verify` captures the raw body so the Paystack webhook can
  // verify its HMAC-SHA512 signature against the untouched payload.
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: any, _res: any, buf: Buffer) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Input sanitization
  app.use(sanitizeMiddleware);

  // API Versioning
  app.use(versionMiddleware);

  // Idempotency middleware (for mutating operations)
  app.use(idempotencyMiddleware);

  // ─── Usage metering: record API calls per tenant ───
  app.use((req: any, res, next) => {
    res.on('finish', () => {
      if (req.tenantId) {
        recordApiUsage(req.tenantId, 1, {
          method: req.method,
          path: req.path,
          status: res.statusCode,
        });
      }
    });
    next();
  });

  // ─── Prometheus scrape endpoint (bearer-token protected in production) ───
  app.get('/metrics', metricsHandler);

  // Rate limiting
  const tieredLimiter = createTieredRateLimiter();
  const strictLimiter = createStrictRateLimiter();
  const apiLimiter = createApiRateLimiter();
  // [A4] Public booking endpoints — guests have no login, so limit per IP.
  // 30 req/min/IP: generous for a real guest flow, hostile to scraping/carding.
  const publicLimiter = createStrictRateLimiter(60 * 1000, 30);

  app.use(apiLimiter);

  // ─── API Documentation ───
  const docsAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (env.NODE_ENV !== 'production') return next();

    const docsUser = process.env.DOCS_USERNAME;
    const docsPass = process.env.DOCS_PASSWORD;

    if (!docsUser || !docsPass) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
      return;
    }

    const header = req.headers.authorization ?? '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [user, pass] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
      if (user === docsUser && pass === docsPass) return next();
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Vimad API Docs"');
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  };

  app.use('/api-docs', docsAuth, swaggerUi.serve, swaggerUi.setup(generateOpenAPIDocument()));
  app.get('/openapi.json', docsAuth, (_req, res) => {
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
      documentation: env.NODE_ENV === 'production' ? undefined : '/api-docs',
    });
  });
  app.use('/health', healthRouter);

  // ─── Auth (strict rate limit on sensitive endpoints) ───
  app.use('/auth/login', strictLimiter);
  app.use('/auth/register', strictLimiter);
  app.use('/auth/forgot-password', strictLimiter);
  app.use('/auth/reset-password', strictLimiter);
  app.use('/auth', authRouter);

  // ─── Versioned API Routes (per-plan tiered rate limits) ───
  // Single mount point per router — the legacy non-versioned duplicates were
  // cut: they doubled rate-limit passes, doubled the API surface, and
  // /invoices was even mounted three times in total.
  app.use('/v1', tieredLimiter);

  // [PAYMENTS] Webhook is PUBLIC (HMAC-signed, no JWT) — must mount BEFORE
  // the auth'd payments router, otherwise it would 401.
  app.use('/v1/payments/webhook', paymentsWebhookRouter);
  app.use('/v1/payments', paymentsRouter);
  // [DEPOSIT-AUTOMATION] Payment requests (auth'd)
  app.use('/v1/payment-requests', paymentRequestsRouter);
  // [A3] Transactional email center (auth'd)
  app.use('/v1/communications', transactionalEmailRouter);
  // [A4] Public booking engine (unauthenticated, per-IP rate limited)
  app.use('/v1/public', publicLimiter, publicRouter);
  // [A5] Tax invoices & receipts (auth'd)
  app.use('/v1/invoices', invoicesRouter);

  app.use('/v1/properties', propertiesRouter);
  app.use('/v1/guests', guestsRouter);
  app.use('/v1/reservations', reservationsRouter);
  app.use('/v1/rooms', roomsRouter);
  app.use('/v1/room-types', roomTypesRouter);
  app.use('/v1/rates', ratesRouter);
  app.use('/v1/folios', foliosRouter);
  // Loyalty — previously built but never mounted (frontend Loyalty page 404'd)
  app.use('/v1/loyalty', loyaltyRouter);
  app.use('/v1/channel', channelRouter);
  app.use('/v1/housekeeping', housekeepingRouter);
  app.use('/v1/dashboard', dashboardRouter);
  app.use('/v1/night-audit', nightAuditRouter);
  app.use('/v1/sms', smsRouter);
  app.use('/v1/notifications', notificationRouter);
  app.use('/v1/api-keys', apiKeysRouter);
  app.use('/v1/rbac', rbacRouter);
  app.use('/v1/push', pushRouter);
  app.use('/v1/guest-portal', guestPortalRouter);

  // ─── Admin (platform admin: KPIs, health, alerts, reports, jobs) ───
  app.use('/admin', adminRouter);

  // ─── Phase 3: Queue Dashboard (protected) ───
  app.use('/admin/queues', ...queueDashboardMiddleware());

  // ─── Error Handling ───
  app.use(sentryErrorHandler);
  app.use(errorHandler);

  // ─── Test mode: the app stays fully mounted for supertest, but listeners,
  // schedulers, signal handlers and worker wiring are skipped — importing
  // this module under vitest must never bind a port or register SIGTERM/SIGINT
  // handlers (that caused EADDRINUSE + "w.close is not a function" crashes).
  if (process.env.VITEST === 'true') {
    return;
  }

  // ─── Dead-letter handlers ───
  attachDeadLetterHandler('email');
  attachDeadLetterHandler('night-audit');
  attachDeadLetterHandler('billing');
  attachDeadLetterHandler('report');
  attachDeadLetterHandler('gdpr');
  // [PAYMENTS] payment side-effects (webhook → folio) retry into the DLQ too
  attachDeadLetterHandler('payments');
  // [DEPOSIT-AUTOMATION] reminder/expire jobs retry into the DLQ too
  attachDeadLetterHandler('payment-requests');
  // [A3] pre-arrival jobs retry into the DLQ too
  attachDeadLetterHandler('transactional-email');
  void startNightAuditScheduler(); // cron-driven scheduled audits (node-cron, every minute)
  void startPaymentRequestScheduler(); // [DEPOSIT-AUTOMATION] reminders + expiry (every 5 min)
  void startTransactionalEmailScheduler(); // [A3] pre-arrival scan (every hour)

  // ─── Graceful Shutdown ───
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown received, closing server, workers, and queues');
    server.close();
    await Promise.allSettled(activeWorkers.map((w) => w.close()));
    await closeQueues();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ─── Real-time Layer ───
  // TODO: re-enable after socket.js is decoupled from auth.service.ts
  // createSocketServer(server);

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
