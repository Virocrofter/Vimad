/* apps/api/src/common/sanitize.ts */
import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errors.js';

const DANGEROUS_PATTERNS = [
  // NoSQL injection patterns
  /\$where/i,
  /\$ne/i,
  /\$gt/i,
  /\$lt/i,
  /\$gte/i,
  /\$lte/i,
  /\$in/i,
  /\$nin/i,
  /\$regex/i,
  /\$exists/i,
  /\$or/i,
  /\$and/i,
  /\$not/i,
  // SQL injection patterns (defense in depth)
  /;\s*drop\s+/i,
  /;\s*delete\s+from/i,
  /union\s+select/i,
  /exec\s*\(/i,
  /eval\s*\(/i,
];

const SUSPICIOUS_KEYS = ['__proto__', 'constructor', 'prototype'];

function sanitizeValue(value: unknown, path: string): unknown {
  if (typeof value === 'string') {
    // Check for dangerous patterns in string values
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(value)) {
        throw new AppError(
          400,
          `Potentially malicious input detected at "${path}"`,
          'SANITIZE_ERROR'
        );
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeValue(item, `${path}[${idx}]`));
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Block prototype pollution keys
      if (SUSPICIOUS_KEYS.includes(key)) {
        throw new AppError(400, `Forbidden key "${key}" detected`, 'SANITIZE_ERROR');
      }
      sanitized[key] = sanitizeValue(val, `${path}.${key}`);
    }
    return sanitized;
  }

  return value;
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.body && Object.keys(req.body).length > 0) {
      req.body = sanitizeValue(req.body, 'body') as Record<string, unknown>;
    }
    if (req.query && Object.keys(req.query).length > 0) {
      req.query = sanitizeValue(req.query, 'query') as any;
    }
    if (req.params && Object.keys(req.params).length > 0) {
      req.params = sanitizeValue(req.params, 'params') as Record<string, string>;
    }
    next();
  } catch (err) {
    next(err);
  }
}

/* ─── HTML Escape helper for responses that might render user input ─── */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
