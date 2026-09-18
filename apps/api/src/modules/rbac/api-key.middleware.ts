import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../common/errors.js';
import { validateApiKey, hasScope, type ApiKeyContext } from './api-key.service.js';

declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyContext;
    }
  }
}

/**
 * Middleware: authenticate the request via an X-API-Key header.
 * If no header is present, continues to the next middleware (JWT).
 * If a header is present but invalid, throws 401.
 */
export async function apiKeyAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers['x-api-key'] as string | undefined;
  if (!header) {
    next();
    return;
  }

  try {
    const context = await validateApiKey(header);
    req.apiKey = context;
    req.tenantId = context.tenantId;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: enforce that an API key (if used) has the required scope.
 * If JWT auth is used, this is a no-op; the permission middleware handles that path.
 */
export function requireApiKeyScope(resource: string, action: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const apiKey = req.apiKey;
    if (!apiKey) {
      next();
      return;
    }

    if (!hasScope(apiKey.scopes, resource, action)) {
      next(new AppError(403, `API key lacks scope: ${resource}:${action}`, 'FORBIDDEN'));
      return;
    }
    next();
  };
}
