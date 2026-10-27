/* apps/api/src/common/env.ts */
import { z } from 'zod';

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT_SECRET: NO default in production — must be explicitly set
  JWT_SECRET: isProd
    ? z.string().min(32, 'JWT_SECRET must be at least 32 characters in production')
    : z
        .string()
        .min(32, 'JWT_SECRET must be at least 32 characters')
        .default('dev-secret-change-in-production'),

  WEB_URL: z.string().url().default('http://localhost:5173'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3001'),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Rate limiting
  RATE_LIMIT_ENABLED: z.enum(['true', 'false']).default('true'),
  RATE_LIMIT_REDIS_URL: z.string().optional(),

  // Optional external services
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),

  // Paystack (cards tokenized — numbers never touch our servers)
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  PAYSTACK_CURRENCY: z.string().length(3).default('ZAR'),

  // Error tracking
  SENTRY_DSN: z.string().optional(),

  // Email delivery
  EMAIL_PROVIDER: z.enum(['smtp', 'sendgrid', 'ses']).default('smtp'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Vimad <no-reply@vimad.io>'),

  // Ops inbox for dead-letter / permanent job-failure alerts
  OPS_EMAIL: z.string().email().default('ops@vimad.io'),

  // Channel manager
  CHANNEL_API_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(15000),

  // SMS via Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'TWILIO_PHONE_NUMBER must be E.164')
    .optional(),
  TWILIO_STATUS_CALLBACK_URL: z.string().url().optional(),

  // File storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  EXPORT_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(604800).default(86400),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  // PDF rendering
  PUPPETEER_EXECUTABLE_PATH: z.string().default('/usr/bin/chromium'),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:support@vimad.io'),

  // CORS
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((s) => s.trim()) : undefined)),

  // Prometheus scrape protection (second layer; prefer network controls)
  METRICS_BEARER_TOKEN: z.string().optional(),

  // 0.4: flight-status hook (FlightAware AeroAPI)
  FLIGHTAWARE_API_KEY: z.string().optional(),
  FLIGHT_DELAY_THRESHOLD_MINUTES: z.coerce.number().int().min(5).max(720).default(60),
  FLIGHT_POLL_CRON: z.string().default('*/10 * * * *'),
  FLIGHT_SIMULATION_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // ─── Test-only variables ───
  // Not used at runtime; declared so tests/helpers can read them through the
  // same validated env object instead of raw process.env.
  TEST_DATABASE_URL: z.string().optional(),
  RUN_DB_TESTS: z.enum(['true', 'false']).default('false'),
  CI: z.enum(['true', 'false']).default('false'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error('\n❌ Environment validation failed:\n');
    console.error(errors);
    console.error('\nPlease check your .env file or environment variables.\n');
    process.exit(1);
  }

  // ─── Production hardening checks ───
  if (isProd) {
    const warnings: string[] = [];
    const fatal: string[] = [];

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      fatal.push('JWT_SECRET must be set to a strong secret (≥32 chars) in production');
    }
    if (process.env.JWT_SECRET === 'dev-secret-change-in-production') {
      fatal.push('JWT_SECRET is still the development default — set a unique secret');
    }
    if (!process.env.REDIS_URL && process.env.RATE_LIMIT_ENABLED !== 'false') {
      warnings.push('REDIS_URL should be configured for production rate limiting');
    }
    if (process.env.STORAGE_PROVIDER === 'local') {
      warnings.push('STORAGE_PROVIDER=local is not recommended for production');
    }
    if (!process.env.SENTRY_DSN) {
      warnings.push('SENTRY_DSN is recommended for production error tracking');
    }
    if (!process.env.CORS_ORIGINS) {
      warnings.push('CORS_ORIGINS not set — only WEB_URL will be allowed');
    }

    if (fatal.length > 0) {
      console.error('\n🚫 Production startup blocked:\n');
      fatal.forEach((f) => console.error(`  • ${f}`));
      console.error('');
      process.exit(1);
    }

    if (warnings.length > 0) {
      console.warn('\n⚠️  Production hardening warnings:\n');
      warnings.forEach((w) => console.warn(`  • ${w}`));
      console.warn('');
    }
  }

  return result.data;
}

export const env = parseEnv();
