/* apps/api/src/common/sentry.ts */
import * as Sentry from '@sentry/node';
import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { env } from './env.js';
import { logger } from './logger.js';

// Sentry is optional — without SENTRY_DSN everything is a no-op.

export function initSentry(): void {
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  logger.info('Sentry initialized');
}

/**
 * Express error handler that reports to Sentry, then passes the error on to
 * the app's own errorHandler. Mount BEFORE errorHandler:
 *   app.use(sentryErrorHandler);
 *   app.use(errorHandler);
 */
export const sentryErrorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  next(err);
};

export { Sentry };
