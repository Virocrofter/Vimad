import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema, type TypeOf } from 'zod';
import { AppError } from './errors.js';

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError(400, formatZodError(result.error), 'VALIDATION_ERROR'));
      return;
    }
    req.validatedBody = result.data as TypeOf<T>;
    next();
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new AppError(400, formatZodError(result.error), 'VALIDATION_ERROR'));
      return;
    }
    req.validatedQuery = result.data as TypeOf<T>;
    next();
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(new AppError(400, formatZodError(result.error), 'VALIDATION_ERROR'));
      return;
    }
    req.validatedParams = result.data as TypeOf<T>;
    next();
  };
}

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}

declare global {
  namespace Express {
    interface Request {
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}
