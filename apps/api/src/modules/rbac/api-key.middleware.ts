/* apps/api/src/modules/rbac/api-key.middleware.ts */
import type { Request, Response, NextFunction } from 'express';
import { validateApiKey, type ApiKeyContext } from './api-key.service.js';
import { AppError } from '../../common/errors.js';

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKey: ApiKeyContext;
}

/**
 * Scope checker for API-key-authenticated requests.
 * Usage: app.use('/some-route', apiKeyAuth, requireApiKeyScope('resource:action'));
 */
export function requireApiKeyScope(scope: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const apiReq = req as ApiKeyAuthenticatedRequest;
    if (!apiReq.apiKey) {
      next(new AppError(401, 'API key authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!apiReq.apiKey.scopes.includes('*') && !apiReq.apiKey.scopes.includes(scope)) {
      next(new AppError(403, `API key missing required scope: ${scope}`, 'FORBIDDEN'));
      return;
    }

    next();
  };
}

// Re-export validateApiKey for convenience
export { validateApiKey };
