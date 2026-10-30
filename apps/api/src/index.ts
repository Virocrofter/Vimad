// BigInt values (payments.paystackId is a BIGINT column) are not JSON-
// serializable by default; res.json throws 'Do not know how to serialize a
// BigInt'. Serialize as string globally.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

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
// [T1] universal task model + rules engine (+ [T3] concierge generators)
import { taskWorker, startTaskScheduler } from './jobs/tasks.job.js';
// [T3] Wake-up call digest — morning email to the desk
import { startWakeUpDigestScheduler } from './jobs/wakeup-digest.job.js';
// [T5] WhatsApp/SMS task push — one-tap tokenized links to staff phones
import { taskPushWorker, startTaskPushScheduler } from './jobs/task-push.job.js';
import { startFlightStatusScheduler } from './jobs/flight-status.job.js';
import { startHousekeepingScheduler } from './jobs/housekeeping.job.js';
// [G1] Groups — cutoff release / washout worker + scheduler
import { groupsWorker, startGroupsScheduler } from './jobs/groups.job.js';
// [T7] Meal plans — board-basis auto-posting worker + scheduler
import { mealsWorker, startMealPostingScheduler } from './jobs/meals.job.js';
// [AR] Accounts Receivable dunning — overdue reminders
import { arWorker, startArScheduler } from './jobs/ar.job.js';
// [REPORTS] tenant-scoped reports — due-schedule runner
import { startReportsScheduler } from './jobs/reports.job.js';
// [SUPPORT] guest support tickets — staff desk + guest portal + SLA engine

import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { propertiesRouter } from './modules/properties/properties.routes.js';
import { guestsRouter } from './modules/guests/guests.routes.js';
import { reservationsRouter } from './modules/reservations/reservations.routes.js';
import { roomsRouter } from './modules/rooms/rooms.routes.js';
import { roomTypesRouter } from './modules/room-types/room-types.routes.js';
import { ratesRouter } from './modules/rates/rates.routes.js';
import { pricingRulesRouter } from './modules/rates/pricing-rules.routes.js';
import { foliosRouter } from './modules/folios/folios.routes.js';
import { groupBillingRouter } from './modules/folios/group-billing.routes.js';
import { startGroupBillingScheduler } from './jobs/group-billing.job.js';
import { loyaltyRouter } from './modules/loyalty/loyalty.routes.js';
import { channelRouter } from './modules/channel/channel.routes.js';
import { housekeepingRouter } from './modules/housekeeping/housekeeping.routes.js';
import { nightAuditRouter } from './modules/night-audit/night-audit.routes.js';
import { smsRouter } from './modules/sms/sms.routes.js';
import { guestPortalRouter } from './modules/guest-portal/guest-portal.routes.js';
import { guestPortalMyStaysRouter } from './modules/guest-portal/my-stays.routes.js';
import { guestBookingRouter } from './modules/guest-portal/guest-booking.routes.js';
import { guestBillingRouter } from './modules/guest-portal/guest-billing.routes.js';
import { guestPayRouter } from './modules/guest-portal/guest-pay.routes.js';
import { guestLoyaltyRouter } from './modules/guest-portal/guest-loyalty.routes.js';
import { guestProfileRouter } from './modules/guest-portal/guest-profile.routes.js';
import { guestCommerceRouter } from './modules/guest-portal/guest-commerce.routes.js';
import { guestCommsRouter } from './modules/guest-portal/guest-comms.routes.js';
import { guestPortalRefreshRouter } from './modules/guest-portal/refresh.routes.js';
import { commsRouter } from './modules/guest-portal/comms.routes.js';
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
// [T1] tasks + rules engine
import { tasksRouter } from './modules/tasks/tasks.routes.js';
// [T5] task push — staff trigger + public one-tap page (mounted before tasksRouter)
import { taskPushStaffRouter } from './modules/tasks/task-push.routes.js';
import { tasksPublicRouter } from './modules/tasks/task-push.public.routes.js';
// [T2] Minibar logging + housekeeping supervisor surface
import { minibarRouter } from './modules/minibar/minibar.routes.js';
import { housekeepingSupervisorRouter } from './modules/housekeeping/housekeeping.supervisor.routes.js';
// [T3] Concierge board (transfers, wake-up calls, bookings, upsells)
import { conciergeRouter } from './modules/concierge/concierge.routes.js';
import { conciergeGuestRouter } from './modules/concierge/concierge.guest.routes.js';
// [T6] Parking board (bays, valet, transactions)
import { parkingRouter } from './modules/parking/parking.routes.js';
// [C1] Chains + property switcher
import { chainsRouter } from './modules/chains/chains.routes.js';
import { chainDashboardRouter } from './modules/chain-dashboard/chain-dashboard.routes.js';
import { guestIdentityRouter } from './modules/guest-identity/guest-identity.routes.js';
import { centralReservationsRouter } from './modules/central-reservations/central-reservations.routes.js';
import { chainBillingRouter } from './modules/chain-billing/chain-billing.routes.js';
// [USERS] tenant staff user management (list/create/update/suspend/audit)
import { usersRouter } from './modules/users/users.routes.js';
// [AUDIT] tenant-scoped audit trail (users > audit logs)
import { auditLogsRouter } from './modules/audit/audit.routes.js';
// [G1] Groups module — group blocks, rooming list, master folio
import { groupsRouter } from './modules/groups/groups.routes.js';
// [S&C] Sales & Catering — events pipeline, clients, BEOs, catering catalogs
import { salesCateringRouter } from './modules/sales-catering/sales-catering.routes.js';
// [CRM] Guest 360, segments, follow-ups, corporate accounts
import { crmRouter } from './modules/crm/index.js';
// [I1] Inventory — sellable room inventory engine (grid, holds, restrictions, overbooking)
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
// [I1] Nightly inventory cache refresh (03:40)
import { startInventoryCacheScheduler } from './modules/inventory/inventory.cache.js';
import { startOverbookingAlertScheduler } from './modules/inventory/inventory.cache.js';
// [T7] Meal plans — board-basis packages, restaurants, covers & posting log
import { mealsRouter } from './modules/meals/meals.routes.js';
// [SUPPORT] guest support tickets — staff desk + guest portal + SLA engine
import { ticketsRouter } from './modules/tickets/tickets.routes.js';
import { onboardingRouter } from './modules/onboarding/onboarding.routes.js';
import { chainLoyaltyRouter } from './modules/chain-loyalty/chain-loyalty.routes.js';
import { ticketsGuestRouter } from './modules/tickets/tickets.guest.routes.js';
import { ticketWorker, startTicketScheduler } from './jobs/tickets.job.js';
import { tenantSettingsRouter } from './modules/tenant-settings/tenant-settings.routes.js';
// [AR] Accounts Receivable — corporate ledger
import { arRouter } from './modules/ar/ar.routes.js';
// [MARKETING] campaigns, analytics, automation workflows, templates, segments
import { marketingRouter } from './modules/marketing/marketing.routes.js';
// [REPORTS] tenant-scoped reporting — library, builder, scheduler, history
import { reportsRouter } from './modules/reports/reports.routes.js';
import roomPlanRoutes from './modules/room-plan/room-plan.routes.js';

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
  taskWorker, // [T1] + [T3] concierge-generate jobs
  taskPushWorker, // [T5]
  groupsWorker, // [G1]
  mealsWorker, // [T7]
  ticketWorker, // [SUPPORT] SLA breach scans
  arWorker, // [AR] overdue dunning
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
        'x-property-id', // [C1] property switcher
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
      if (req.auth?.tenantId) {
        recordApiUsage(req.auth.tenantId, 1, {
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
  // [C1] Chains + property switcher scope (auth'd)
  app.use('/v1/chains', chainsRouter);
  app.use('/v1/chain-dashboard', chainDashboardRouter);
  app.use('/v1/guest-identity', guestIdentityRouter);
  app.use('/v1/central-reservations', centralReservationsRouter);
  app.use('/v1/chain-billing', chainBillingRouter);
  app.use('/v1/guests', guestsRouter);
  app.use('/v1/reservations', reservationsRouter);
  app.use('/v1/room-plan', roomPlanRoutes);
  app.use('/v1/rooms', roomsRouter);
  app.use('/v1/room-types', roomTypesRouter);
  app.use('/v1/rates', pricingRulesRouter);
  app.use('/v1/rates', ratesRouter);
  app.use('/v1/folios', foliosRouter);
  app.use('/v1/folios', groupBillingRouter);
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
  // [USERS] tenant staff management — sits next to RBAC (roles come from /v1/rbac)
  app.use('/v1/users', usersRouter);
  // [AUDIT] tenant-scoped audit trail (auth'd — report:read or audit:read)
  app.use('/v1/audit-logs', auditLogsRouter);
  app.use('/v1/push', pushRouter);
  // [SUPPORT] Guest-facing support tickets (portal-token auth, path-scoped).
  // MUST mount BEFORE /v1/guest-portal — the main portal router would intercept.
  app.use('/v1/guest-portal/support', ticketsGuestRouter);
  app.use('/v1/guest-portal', guestPortalMyStaysRouter);
  // [G1] Guest booking management (modify/cancel) + guest billing (folio,
  // invoices, preferences, documents). MUST mount BEFORE the main portal
  // router so their paths win over the generic /:token handlers.
  app.use('/v1/guest-portal', guestBookingRouter);
  app.use('/v1/guest-portal', guestBillingRouter);
  // [G2] Guest checkout + split billing (portal-token auth; strictLimiter — these mint payment sessions).
  // MUST mount BEFORE the main portal router.
  app.use('/v1/guest-portal/pay', strictLimiter, guestPayRouter);
  // [G3] Loyalty + guest profile/documents (portal-token auth).
  app.use('/v1/guest-portal/loyalty', strictLimiter, guestLoyaltyRouter);
  app.use('/v1/guest-portal/profile', strictLimiter, guestProfileRouter);
  // [G4] In-stay commerce: menu, room-service orders, upsells, timeline.
  app.use('/v1/guest-portal/commerce', strictLimiter, guestCommerceRouter);
  // [G5] Guest chat + reviews + announcements (portal-token auth).
  app.use('/v1/guest-portal/comms', strictLimiter, guestCommsRouter);
  app.use('/v1/guest-portal', strictLimiter, guestPortalRefreshRouter);
  // [G5] Staff comms desk (staff auth): chat inbox, review moderation, announcements.
  app.use('/v1/comms', commsRouter);
  app.use('/v1/guest-portal', guestPortalRouter);
  // [T5] Public one-tap task links (tokenized capability URL, per-IP limited).
  // MUST mount BEFORE /v1/tasks — the staff routers' auth would 401 it.
  app.use('/v1/tasks/t', publicLimiter, tasksPublicRouter);
  // [T5] Staff push trigger — only owns POST /:id/push, falls through otherwise
  app.use('/v1/tasks', taskPushStaffRouter);
  // [T1] Tasks + rules engine (auth'd)
  app.use('/v1/tasks', tasksRouter);
  // [T2] Minibar checks (photo proof → folio charge)
  app.use('/v1/minibar', minibarRouter);
  // [T2] Supervisor board: reassign / override / SLA / unassigned pool.
  // Mounted AFTER the base housekeeping router so /v1/housekeeping/* spine
  // routes keep priority; supervisor lives at /v1/housekeeping/supervisor/*.
  app.use('/v1/housekeeping/supervisor', housekeepingSupervisorRouter);
  // [T3] Guest-facing concierge endpoints (portal-token auth, not staff auth).
  // MUST mount BEFORE /v1/concierge — the staff router's authMiddleware would
  // otherwise intercept /guest/* paths and reject portal tokens.
  app.use('/v1/concierge/guest', conciergeGuestRouter);
  // [T3] Concierge board — the department is a revenue surface
  app.use('/v1/concierge', conciergeRouter);
  // [T6] Parking (auth'd)
  app.use('/v1/parking', parkingRouter);
  // [G1] Groups — room blocks, rooming list, master folio (auth'd)
  app.use('/v1/groups', groupsRouter);
  // [S&C] Sales & Catering — pipeline, clients, BEOs, catering catalogs (auth'd)
  app.use('/v1/sales-catering', salesCateringRouter);
  // [CRM] Guest 360, segments, follow-ups, corporate accounts (auth'd)
  app.use('/v1/crm', crmRouter);
  // [I1] Inventory — sellable room inventory (auth'd)
  app.use('/v1/inventory', inventoryRouter);
  // [T7] Meal plans — plans, restaurants, assignments, covers, posting log
  app.use('/v1/meal-plans', mealsRouter);
  // [SUPPORT] Staff Support Desk (auth'd)
  app.use('/v1/tickets', ticketsRouter);
  app.use('/v1/onboarding', onboardingRouter);
  app.use('/v1/chain-loyalty', chainLoyaltyRouter);
  app.use('/v1/tenant', tenantSettingsRouter);
  // [AR] Accounts Receivable — corporate ledger (auth'd)
  app.use('/v1/ar', arRouter);
  // [MARKETING] marketing module (auth'd)
  app.use('/v1/marketing', marketingRouter);
  // [REPORTS] tenant-scoped reports — library, builder, scheduler, history
  app.use('/v1/reports', reportsRouter);

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
  // [T1] task-rule evaluation jobs retry into the DLQ too
  attachDeadLetterHandler('tasks');
  // [T5] task push retries into the DLQ too
  attachDeadLetterHandler('task-push');
  // [G1] group cutoff release retries into the DLQ too
  attachDeadLetterHandler('groups');

  // [T7] meal posting retries into the DLQ too
  attachDeadLetterHandler('meals');
  // [SUPPORT] SLA scans retry into the DLQ too
  attachDeadLetterHandler('tickets');
  // [AR] dunning jobs retry into the DLQ too
  attachDeadLetterHandler('ar');
  void startNightAuditScheduler(); // cron-driven scheduled audits (node-cron, every minute)
  void startPaymentRequestScheduler(); // [DEPOSIT-AUTOMATION] reminders + expiry (every 5 min)
  void startTransactionalEmailScheduler(); // [A3] pre-arrival scan (every hour)
  void startTaskScheduler(); // [T1] rule scan + SLA flags (every min) · [T3] concierge generators (every 15 min)
  void startWakeUpDigestScheduler(); // [T3] 05:00 property-local wake-up digest
  void startTaskPushScheduler();
  void startFlightStatusScheduler();
  void startHousekeepingScheduler();
  void startGroupBillingScheduler(); // [T3+] group billing auto-send // [T2+] HK auto-status rules // [0.4] flight status hook // [T5] auto-push scan (every min)
  void startGroupsScheduler(); // [G1] cutoff release scan (every 30 min)
  void startInventoryCacheScheduler(); // [I1] nightly inventory cache refresh (03:40)
  void startOverbookingAlertScheduler(); // [I1] walk-plan alerts (08:00 + 14:00)
  void startMealPostingScheduler(); // [T7] meal auto-post scan (every 15 min)
  void startTicketScheduler(); // [SUPPORT] SLA breach scan + escalation (every 5 min)
  void startArScheduler(); // [AR] overdue dunning scan (every 6h)
  void startReportsScheduler(); // [REPORTS] due scheduled reports (every min)

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
  // D2: socket.js verifies tokens standalone (common/socket-auth.ts) -
  // the auth.service -> prisma circular dependency is broken.
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
