import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../common/prisma.js';
import { paginationSchema, skipTake } from '../../common/pagination.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import {
  createCorporateSchema,
  createFollowUpSchema,
  createNoteSchema,
  createSegmentSchema,
  emailSegmentSchema,
  updateCorporateSchema,
  updateFollowUpSchema,
  updateGuestCrmSchema,
  updateNoteSchema,
  updateSegmentSchema,
} from './crm.schemas.js';
import * as svc from './crm.service.js';

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const tenantId = (req: Request) => (req as any).auth.tenantId as string;
const userId = (req: Request) => (req as any).auth.userId as string;

const followUpQuerySchema = paginationSchema.extend({
  done: z.enum(['true', 'false']).optional(),
  assigneeId: z.string().optional(),
  guestId: z.string().optional(),
});

const timelineQuerySchema = paginationSchema.pick({ pageSize: true });

export const crmRouter = Router();
crmRouter.use(authMiddleware);

// ── Overview ──
crmRouter.get(
  '/overview',
  requirePermission('crm', 'read'),
  asyncHandler(async (req, res) => {
    res.json(await svc.getOverview(prisma, tenantId(req)));
  })
);

crmRouter.get(
  '/assignees',
  requirePermission('crm', 'read'),
  asyncHandler(async (req, res) => {
    res.json(await svc.listAssignees(prisma, tenantId(req)));
  })
);

// ── Guest 360 ──
crmRouter.patch(
  '/guests/:guestId',
  requirePermission('crm', 'manage'),
  validateBody(updateGuestCrmSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await svc.updateGuestCrm(prisma, tenantId(req), req.params.guestId, req.validatedBody as any)
    );
  })
);

crmRouter.get(
  '/guests/:guestId/360',
  requirePermission('crm', 'read'),
  asyncHandler(async (req, res) => {
    res.json(await svc.getGuest360(prisma, tenantId(req), req.params.guestId));
  })
);

crmRouter.get(
  '/guests/:guestId/timeline',
  requirePermission('crm', 'read'),
  validateQuery(timelineQuerySchema),
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number((req.validatedQuery as any)?.pageSize ?? 50), 200);
    res.json(await svc.getTimeline(prisma, tenantId(req), req.params.guestId, limit));
  })
);

// ── Notes ──
crmRouter.post(
  '/guests/:guestId/notes',
  requirePermission('crm', 'manage'),
  validateBody(createNoteSchema),
  asyncHandler(async (req, res) => {
    res
      .status(201)
      .json(
        await svc.createNote(
          prisma,
          tenantId(req),
          userId(req),
          req.params.guestId,
          req.validatedBody as any
        )
      );
  })
);

crmRouter.patch(
  '/notes/:noteId',
  requirePermission('crm', 'manage'),
  validateBody(updateNoteSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await svc.updateNote(prisma, tenantId(req), req.params.noteId, req.validatedBody as any)
    );
  })
);

crmRouter.delete(
  '/notes/:noteId',
  requirePermission('crm', 'manage'),
  asyncHandler(async (req, res) => {
    res.json(await svc.deleteNote(prisma, tenantId(req), req.params.noteId));
  })
);

// ── Segments ──
crmRouter.get(
  '/segments',
  requirePermission('crm', 'read'),
  asyncHandler(async (req, res) => {
    res.json(await svc.listSegments(prisma, tenantId(req)));
  })
);

crmRouter.post(
  '/segments',
  requirePermission('crm', 'manage'),
  validateBody(createSegmentSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await svc.createSegment(prisma, tenantId(req), req.validatedBody as any));
  })
);

crmRouter.patch(
  '/segments/:segmentId',
  requirePermission('crm', 'manage'),
  validateBody(updateSegmentSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await svc.updateSegment(prisma, tenantId(req), req.params.segmentId, req.validatedBody as any)
    );
  })
);

crmRouter.delete(
  '/segments/:segmentId',
  requirePermission('crm', 'manage'),
  asyncHandler(async (req, res) => {
    res.json(await svc.deleteSegment(prisma, tenantId(req), req.params.segmentId));
  })
);

crmRouter.post(
  '/segments/:segmentId/evaluate',
  requirePermission('crm', 'manage'),
  asyncHandler(async (req, res) => {
    res.json(await svc.evaluateSegment(prisma, tenantId(req), req.params.segmentId));
  })
);

crmRouter.post(
  '/segments/:segmentId/email',
  requirePermission('crm', 'manage'),
  validateBody(emailSegmentSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await svc.emailSegment(prisma, tenantId(req), req.params.segmentId, req.validatedBody as any)
    );
  })
);

crmRouter.get(
  '/segments/:segmentId/members',
  requirePermission('crm', 'read'),
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { skip, take } = skipTake(req.validatedQuery as any);
    res.json(await svc.listSegmentMembers(prisma, tenantId(req), req.params.segmentId, skip, take));
  })
);

// ── Follow-ups ──
crmRouter.get(
  '/follow-ups',
  requirePermission('crm', 'read'),
  validateQuery(followUpQuerySchema),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery as any;
    const { skip, take } = skipTake(q);
    res.json(
      await svc.listFollowUps(prisma, tenantId(req), {
        done: q.done === undefined ? undefined : q.done === 'true',
        assigneeId: q.assigneeId,
        guestId: q.guestId,
        skip,
        take,
      })
    );
  })
);

crmRouter.post(
  '/follow-ups',
  requirePermission('crm', 'manage'),
  validateBody(createFollowUpSchema),
  asyncHandler(async (req, res) => {
    res
      .status(201)
      .json(await svc.createFollowUp(prisma, tenantId(req), userId(req), req.validatedBody as any));
  })
);

crmRouter.patch(
  '/follow-ups/:followUpId',
  requirePermission('crm', 'manage'),
  validateBody(updateFollowUpSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await svc.updateFollowUp(
        prisma,
        tenantId(req),
        req.params.followUpId,
        req.validatedBody as any
      )
    );
  })
);

// ── Corporate accounts ──
crmRouter.get(
  '/corporate-accounts',
  requirePermission('crm', 'read'),
  asyncHandler(async (req, res) => {
    res.json(await svc.listCorporateAccounts(prisma, tenantId(req)));
  })
);

crmRouter.post(
  '/corporate-accounts',
  requirePermission('crm', 'manage'),
  validateBody(createCorporateSchema),
  asyncHandler(async (req, res) => {
    res
      .status(201)
      .json(await svc.createCorporateAccount(prisma, tenantId(req), req.validatedBody as any));
  })
);

crmRouter.get(
  '/corporate-accounts/:accountId',
  requirePermission('crm', 'read'),
  asyncHandler(async (req, res) => {
    res.json(await svc.getCorporateAccount(prisma, tenantId(req), req.params.accountId));
  })
);

crmRouter.patch(
  '/corporate-accounts/:accountId',
  requirePermission('crm', 'manage'),
  validateBody(updateCorporateSchema),
  asyncHandler(async (req, res) => {
    res.json(
      await svc.updateCorporateAccount(
        prisma,
        tenantId(req),
        req.params.accountId,
        req.validatedBody as any
      )
    );
  })
);

// ── S&C client picker ──
crmRouter.get(
  '/sc-clients',
  requirePermission('crm', 'read'),
  asyncHandler(async (req, res) => {
    res.json(await svc.listScClients(prisma, tenantId(req)));
  })
);
