/* apps/api/src/common/sentry.ts */
import * as Sentry from '@sentry/node';
import type { ErrorRequestHandler, Request } from 'express';

const dsn = process.env.SENTRY_DSN;
const enabled = Boolean(dsn);

if (enabled) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 1.0,
    beforeSend(event) {
      const status = (event.contexts?.response?.status_code as number | undefined) ?? 0;
      if (status === 401 || status === 403 || status === 404) return null;
      return event;
    },
  });
} else {
  console.warn('[sentry] SENTRY_DSN not set — error reporting disabled');
}

type ReqWithUser = Request & { user?: { id?: string } };

/**
 * Express error-reporting middleware. Wired in server.ts AFTER all routes,
 * BEFORE errorHandler — do not move it. Reports to Sentry with request
 * context, then hands off to errorHandler so JSON error shape is preserved.
 */
export const sentryErrorHandler: ErrorRequestHandler = (err, req, _res, next) => {
  if (enabled) {
    Sentry.withScope((scope) => {
      scope.setTag('path', req.originalUrl ?? req.url);
      scope.setContext('http', {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        params: req.params,
        'user-agent': req.headers['user-agent'],
      });
      const user = (req as ReqWithUser).user;
      if (user?.id) scope.setUser({ id: user.id });
      if (req.auth?.tenantId) scope.setTag('tenantId', req.auth.tenantId);
      Sentry.captureException(err);
    });
  }
  next(err);
};

export default Sentry;
