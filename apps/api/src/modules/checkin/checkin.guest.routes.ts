/* guest-facing routes — token-scoped 'guest-portal' JWT, same convention as support/my-stays */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../../common/env.js';
import { AppError } from '../../common/errors.js';
import { validateBody, validateParams } from '../../common/validate.js';
import * as svc from './checkin.service.js';

export const guestCheckinRouter = Router();

function guestAuth(req: Request, _res: Response, next: NextFunction) {
  const raw =
    (req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '') ||
    (req.headers['x-guest-token'] as string) ||
    ((req.body as any)?.token ?? '');
  if (!raw) return next(new AppError(401, 'Guest token required', 'UNAUTHORIZED'));
  try {
    const payload = jwt.verify(raw, env.JWT_SECRET) as any;
    if (payload?.scope !== 'guest-portal') throw new Error('bad scope');
    (req as any).guestAuth = {
      tenantId: payload.tenantId,
      guestId: payload.guestId,
      reservationId: payload.reservationId ?? null,
    };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired guest token', 'UNAUTHORIZED'));
  }
}

guestCheckinRouter.use(guestAuth);

const G = (req: any) => (req as any).guestAuth as { tenantId: string; guestId: string };
const IdParam = z.object({ id: z.string() });
const scanSchema = z.object({ kind: z.enum(['id', 'selfie']), dataBase64: z.string().min(8) });
const docsSchema = z.object({ idDocType: z.string().min(2), idDocNumber: z.string().min(2) });
const sigSchema = z.object({ dataBase64: z.string().min(8) });
const startSchema = z.object({ confirmationNumber: z.string().min(3) });
const depositSchema = z.object({ amount: z.number().positive().optional() });
const confirmSchema = z.object({ reference: z.string().min(3) });

guestCheckinRouter.post(
  '/start',
  validateBody(startSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      res
        .status(201)
        .json({
          data: await svc.startSession(
            g.tenantId,
            g.guestId,
            (req.validatedBody as any).confirmationNumber
          ),
        });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.post(
  '/sessions/:id/upload',
  validateParams(IdParam),
  validateBody(scanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      const b = req.validatedBody as any;
      res.json({
        data: await svc.uploadScan(
          g.tenantId,
          (req.validatedParams as any).id,
          b.kind,
          b.dataBase64
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.post(
  '/sessions/:id/documents',
  validateParams(IdParam),
  validateBody(docsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      const b = req.validatedBody as any;
      res.json({
        data: await svc.setDocuments(
          g.tenantId,
          (req.validatedParams as any).id,
          b.idDocType,
          b.idDocNumber
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.post(
  '/sessions/:id/signature',
  validateParams(IdParam),
  validateBody(sigSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      res.json({
        data: await svc.setSignature(
          g.tenantId,
          (req.validatedParams as any).id,
          (req.validatedBody as any).dataBase64
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.post(
  '/sessions/:id/deposit',
  validateParams(IdParam),
  validateBody(depositSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      res.json({
        data: await svc.createDeposit(
          g.tenantId,
          (req.validatedParams as any).id,
          (req.validatedBody as any).amount
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.post(
  '/deposit/confirm',
  validateBody(confirmSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      res.json({
        data: await svc.confirmDeposit(g.tenantId, (req.validatedBody as any).reference),
      });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.post(
  '/sessions/:id/complete',
  validateParams(IdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      res.json({ data: await svc.completeSession(g.tenantId, (req.validatedParams as any).id) });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.get(
  '/sessions/:id/registration-card',
  validateParams(IdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      res.json({ data: await svc.registrationCard(g.tenantId, (req.validatedParams as any).id) });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.get(
  '/sessions/:id/key-status',
  validateParams(IdParam),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const g = G(req);
      res.json({ data: await svc.keyStatus(g.tenantId, (req.validatedParams as any).id) });
    } catch (e) {
      next(e);
    }
  }
);

guestCheckinRouter.get('/timeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const g = G(req);
    res.json({ data: await svc.myTimeline(g.tenantId, g.guestId) });
  } catch (e) {
    next(e);
  }
});
