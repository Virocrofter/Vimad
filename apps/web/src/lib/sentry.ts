/* apps/web/src/lib/sentry.ts */
import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    console.warn('[sentry] VITE_SENTRY_DSN not set — error reporting disabled');
    return;
  }
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  initialized = true;
}

export default Sentry;
