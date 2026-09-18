/* apps/api/src/common/logger.ts */
import pino from 'pino';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { env } from './env.js';

const REDACT_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'authorization',
  'cookie',
  'apiKey',
  'secret',
  'jwt',
  'creditCard',
  'cvv',
  'ssn',
];

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss Z' } }
      : undefined,
  redact: {
    paths: REDACT_FIELDS,
    censor: '[REDACTED]',
  },
  base: {
    pid: process.pid,
    env: env.NODE_ENV,
  },
  // Add timestamp in ISO format for production
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  // Create a child logger with request context
  req.log = logger.child({
    requestId,
    tenantId: (req as AuthenticatedRequest).auth?.tenantId,
    userId: (req as AuthenticatedRequest).auth?.user?.id,
    userRole: (req as AuthenticatedRequest).auth?.user?.role,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;

    req.log.info(
      {
        requestId,
        method: req.method,
        path: req.path,
        route: req.route?.path,
        statusCode: res.statusCode,
        durationMs,
        contentLength: res.get('content-length'),
        // Add tenant context if available
        tenantId: (req as AuthenticatedRequest).auth?.tenantId,
        userId: (req as AuthenticatedRequest).auth?.user?.id,
      },
      'request completed'
    );
  });

  next();
}

/* ─── Prisma Query Logger ─── */
export function createPrismaQueryLogger() {
  return {
    async $allOperations({ operation, model, args, query }: any) {
      const start = Date.now();
      const result = await query(args);
      const durationMs = Date.now() - start;

      logger.debug(
        {
          prisma: {
            operation,
            model,
            durationMs,
            // Don't log full args in production to avoid leaking data
            args: env.NODE_ENV === 'development' ? args : undefined,
          },
        },
        `Prisma ${operation} on ${model}`
      );

      return result;
    },
  };
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: unknown;
      log: pino.Logger;
    }
  }
}

// Import for type reference
import type { AuthenticatedRequest } from '../modules/auth/auth.middleware.js';
