/* apps/api/src/modules/guest-identity/guest-identity.routes.ts — C3 */
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateParams } from '../../common/validate.js';
import * as service from './guest-identity.service.js';

export const guestIdentityRouter = Router();
guestIdentityRouter.use(authMiddleware);

const groupParams = z.object({ groupId: z.string().min(1) });
const memberParams = z.object({ groupId: z.string().min(1), guestId: z.string().min(1) });
const createGroupBody = z.object({
  guestIds: z.array(z.string().min(1)).min(2).max(20),
});
const addMemberBody = z.object({ guestId: z.string().min(1) });

const tenantOf = (req: any) => req.auth?.tenantId ?? req.user?.tenantId;
const userOf = (req: any) => req.auth?.user?.id ?? req.user?.id ?? undefined;

guestIdentityRouter.get('/groups', requirePermission('guest', 'read'), async (req, res, next) => {
  try {
    res.json({ data: await service.listGroups(tenantOf(req)) });
  } catch (err) {
    next(err);
  }
});

guestIdentityRouter.get(
  '/groups/:groupId',
  requirePermission('guest', 'read'),
  validateParams(groupParams),
  async (req, res, next) => {
    try {
      const { groupId } = req.validatedParams as any;
      res.json({ data: await service.getGroup360(tenantOf(req), groupId) });
    } catch (err) {
      next(err);
    }
  }
);

guestIdentityRouter.post(
  '/groups',
  requirePermission('guest', 'update'),
  validateBody(createGroupBody),
  async (req, res, next) => {
    try {
      const { guestIds } = req.validatedBody as any;
      const data = await service.createGroup(tenantOf(req), userOf(req), guestIds);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

guestIdentityRouter.post(
  '/groups/:groupId/members',
  requirePermission('guest', 'update'),
  validateParams(groupParams),
  validateBody(addMemberBody),
  async (req, res, next) => {
    try {
      const { groupId } = req.validatedParams as any;
      const { guestId } = req.validatedBody as any;
      res.json({ data: await service.addMember(tenantOf(req), groupId, guestId) });
    } catch (err) {
      next(err);
    }
  }
);

guestIdentityRouter.delete(
  '/groups/:groupId/members/:guestId',
  requirePermission('guest', 'update'),
  validateParams(memberParams),
  async (req, res, next) => {
    try {
      const { groupId, guestId } = req.validatedParams as any;
      res.json({ data: await service.removeMember(tenantOf(req), groupId, guestId) });
    } catch (err) {
      next(err);
    }
  }
);

guestIdentityRouter.get('/dedupe', requirePermission('guest', 'read'), async (req, res, next) => {
  try {
    res.json({ data: await service.dedupeReport(tenantOf(req)) });
  } catch (err) {
    next(err);
  }
});
