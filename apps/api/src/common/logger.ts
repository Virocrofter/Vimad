import pino from 'pino';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      },
      'request completed'
    );
  });
  next();
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: unknown;
    }
  }
}
