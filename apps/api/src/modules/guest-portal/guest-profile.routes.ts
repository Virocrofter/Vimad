/* apps/api/src/modules/guest-portal/guest-profile.routes.ts
 * [G3] Guest profile + documents vault — portal-token auth, reservation-bound.
 *   GET  /profile/:token                      → guest-safe profile
 *   PATCH /profile/:token                     → email/phone/contact fields only (whitelisted)
 *   GET  /profile/:token/documents            → document list with verification status
 *   POST /profile/:token/documents            → register a document (pending verification)
 *   POST /profile/:token/documents/:id/upload → attach file via storage.putFile (local/S3)
 *
 * Reuse: storage.putFile (SAFE_KEY whitelist, local + S3 backends).
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import express from 'express';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { putFile } from '../../common/storage.js';
import { resolveToken } from './guest-portal.service.js';

export const guestProfileRouter = Router();

const ok = (res: Response, data: unknown) => res.json({ data });

const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const ALLOWED_EXTS = new Set(['pdf', 'jpg', 'jpeg', 'png']);

const profileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  nationality: true,
  address: true,
  city: true,
  country: true,
  dateOfBirth: true,
  vipStatus: true,
  loyaltyPoints: true,
  createdAt: true,
} as const;

// ─── GET /:token — profile ───

guestProfileRouter.get(
  '/:token',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const guest = await prisma.guest.findFirst({
      where: { id: reservation.guestId, tenantId: reservation.tenantId },
      select: profileSelect,
    });
    if (!guest) throw new AppError(404, 'Guest not found', 'NOT_FOUND');

    return ok(res, {
      token: String(req.params.token),
      guest,
      propertyName: reservation.property.name,
      confirmationNumber: reservation.confirmationNumber,
    });
  })
);

// ─── PATCH /:token — update contact fields (identity fields off-limits) ───

const patchSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(7).max(30).optional(),
    nationality: z.string().min(2).max(60).optional(),
    address: z.string().max(200).optional(),
    city: z.string().max(80).optional(),
    country: z.string().max(80).optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: 'Nothing to update',
  });

guestProfileRouter.patch(
  '/:token',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = patchSchema.parse(req.body ?? {});

    const patch: Record<string, string> = {};
    for (const key of ['email', 'phone', 'nationality', 'address', 'city', 'country'] as const) {
      const value = input[key];
      if (value !== undefined) patch[key] = value;
    }

    const guest = await prisma.guest.update({
      where: { id: reservation.guestId },
      data: patch,
      select: profileSelect,
    });

    await prisma.auditLog
      .create({
        data: {
          tenantId: reservation.tenantId,
          action: 'guest.update_profile',
          entity: 'guest',
          entityId: guest.id,
          metadata: { source: 'guest_portal', fields: Object.keys(patch) },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      })
      .catch(() => {});

    return ok(res, { token: String(req.params.token), guest });
  })
);

// ─── POST /:token/gdpr — guest data rights request (export / erasure) ───

const gdprSchema = z.object({
  request: z.enum(['export', 'erasure']),
});

guestProfileRouter.post(
  '/:token/gdpr',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = gdprSchema.parse(req.body ?? {});

    const guest = await prisma.guest.findFirst({
      where: { id: reservation.guestId, tenantId: reservation.tenantId },
      select: { firstName: true, lastName: true },
    });
    const guestName = guest ? `${guest.firstName} ${guest.lastName}` : reservation.guestId;

    await prisma.task
      .create({
        data: {
          tenantId: reservation.tenantId,
          propertyId: reservation.propertyId,
          department: 'management',
          title: `GDPR ${input.request} request — ${guestName}`,
          description: [
            `Guest ${guestName} (${reservation.confirmationNumber}) requested a data ${input.request} via the guest portal.`,
            'Verify identity, then run the GDPR pipeline and confirm by email within 30 days.',
          ].join('\n'),
          status: 'open',
          priority: 'high',
          reservationId: reservation.id,
          dedupeKey: `gdpr-${input.request}-${reservation.guestId}`,
          source: 'guest_portal',
        },
      })
      .catch(() => {});

    return ok(res, { request: input.request, queued: true });
  })
);

// ─── GET /:token/documents ───

guestProfileRouter.get(
  '/:token/documents',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));

    const documents = await prisma.guestDocument.findMany({
      where: { guestId: reservation.guestId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        number: true,
        issuedBy: true,
        issueDate: true,
        expiryDate: true,
        fileUrl: true,
        verificationStatus: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    return ok(res, { token: String(req.params.token), documents });
  })
);

// ─── POST /:token/documents — register a document ───

const documentSchema = z.object({
  type: z.enum(['passport', 'national_id', 'driver_license', 'other']),
  number: z.string().min(3).max(80).optional(),
  issuedBy: z.string().max(120).optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

guestProfileRouter.post(
  '/:token/documents',
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = documentSchema.parse(req.body ?? {});

    const document = await prisma.guestDocument.create({
      data: {
        guestId: reservation.guestId,
        type: input.type,
        number: input.number ?? null,
        issuedBy: input.issuedBy ?? null,
        issueDate: input.issueDate ? new Date(input.issueDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        verificationStatus: 'pending',
      },
      select: {
        id: true,
        type: true,
        number: true,
        issuedBy: true,
        issueDate: true,
        expiryDate: true,
        fileUrl: true,
        verificationStatus: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    return ok(res, { token: String(req.params.token), document });
  })
);

// ─── POST /:token/documents/:docId/upload — attach file ───

const uploadSchema = z.object({
  fileName: z.string().min(1).max(120),
  contentBase64: z.string().min(10).max(7_000_000),
  contentType: z.string().min(3).max(100),
});

guestProfileRouter.post(
  '/:token/documents/:docId/upload',
  express.json({ limit: '5mb' }),
  asyncRoute(async (req, res) => {
    const reservation = await resolveToken(String(req.params.token));
    const input = uploadSchema.parse(req.body ?? {});

    const doc = await prisma.guestDocument.findFirst({
      where: { id: String(req.params.docId), guestId: reservation.guestId },
    });
    if (!doc) throw new AppError(404, 'Document not found', 'NOT_FOUND');

    const ext = input.fileName.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTS.has(ext)) {
      throw new AppError(400, 'Only PDF, JPG or PNG files are accepted', 'INVALID_FILE_TYPE');
    }
    const buffer = Buffer.from(input.contentBase64, 'base64');
    if (buffer.length === 0) throw new AppError(400, 'File content is empty', 'INVALID_FILE');
    if (buffer.length > 5 * 1024 * 1024) {
      throw new AppError(400, 'File exceeds the 5MB limit', 'FILE_TOO_LARGE');
    }

    const key = `guest-documents/${reservation.tenantId}/${reservation.guestId}/${doc.id}.${ext}`;
    const stored = await putFile(key, buffer, input.contentType);

    const document = await prisma.guestDocument.update({
      where: { id: doc.id },
      data: { fileUrl: stored.key, verificationStatus: 'pending' },
      select: {
        id: true,
        type: true,
        number: true,
        fileUrl: true,
        verificationStatus: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    logger.info(
      { guestId: reservation.guestId, docId: doc.id, size: stored.size },
      'guest document uploaded'
    );

    return ok(res, { token: String(req.params.token), document, size: stored.size });
  })
);

// ─── Errors → { error: { code, message } } ───

guestProfileRouter.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  const e = err as { statusCode?: number; status?: number; code?: string; message?: string };
  if (err instanceof AppError || e.statusCode || e.status) {
    return res
      .status(e.statusCode ?? e.status ?? 500)
      .json({ error: { code: e.code ?? 'ERROR', message: e.message ?? 'Request failed' } });
  }
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.issues[0]?.message ?? 'Invalid input' },
    });
  }
  logger.warn({ err }, 'guest-profile unexpected error');
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
});
