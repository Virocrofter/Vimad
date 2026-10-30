/* apps/api/src/modules/guest-portal/refresh.routes.ts
 * Phase 0 — sliding session: POST /v1/guest-portal/refresh
 * Verifies the current portal token, re-signs its claims with a fresh
 * 12h expiry, returns the new token. Old token remains valid until its
 * own exp (guest wifi drops are tolerated), checkout revocation still
 * applies because the reservationId claim is preserved untouched.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { validateBody } from '../../common/validate.js';
import { env } from '../../common/env.js';

export const guestPortalRefreshRouter = Router();

const RefreshInputSchema = z.object({ token: z.string().min(10) });

const TWELVE_HOURS_SEC = 12 * 60 * 60;

guestPortalRefreshRouter.post(
  '/refresh',
  validateBody(RefreshInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.validatedBody as { token: string };

      let decoded: jwt.JwtPayload;
      try {
        decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
      } catch {
        return res.status(401).json({
          error: { code: 'INVALID_TOKEN', message: 'Portal token is invalid or expired' },
        });
      }

      if (decoded.scope !== 'guest-portal') {
        return res.status(401).json({
          error: { code: 'INVALID_TOKEN', message: 'Token scope mismatch' },
        });
      }

      const { iat, exp, ...claims } = decoded;
      const fresh = jwt.sign(claims, env.JWT_SECRET, { expiresIn: TWELVE_HOURS_SEC });

      return res.json({ data: { token: fresh, expiresInSeconds: TWELVE_HOURS_SEC } });
    } catch (err) {
      return next(err);
    }
  }
);
