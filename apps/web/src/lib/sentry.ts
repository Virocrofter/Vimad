/* apps/web/src/lib/sentry.ts */
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/**
 * Frontend Sentry init. No-op when VITE_SENTRY_DSN is not set.
 * Tracing and replay are sampled low by default to keep volumes/costs down.
 */
export function initSentry() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 0.5,
  });
}
