import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  logger.error({ err, requestId: req.requestId }, 'unhandled error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}
