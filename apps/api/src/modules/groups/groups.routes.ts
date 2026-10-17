/* apps/api/src/modules/groups/groups.routes.ts — G1 */
import { Router } from 'express';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '../../common/zod.js';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import type { AuthenticatedRequest } from '../auth/auth.middleware.js';
import * as svc from './groups.service.js';

export const registry = new OpenAPIRegistry();

export const groupsRouter = Router();
groupsRouter.use(authMiddleware);

const ah =
  (fn: (req: AuthenticatedRequest, res: any) => Promise<void>) => (req: any, res: any, next: any) =>
    fn(req, res).catch(next);

const idParams = z.object({ id: z.string() });
const blockParams = z.object({ id: z.string(), blockId: z.string() });
const memberParams = z.object({ id: z.string(), reservationId: z.string() });
const eventParams = z.object({ id: z.string(), eventId: z.string() });

const blockInput = z.object({
  roomTypeId: z.string(),
  roomsBlocked: z.number().int().min(1).max(5000),
  rate: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});

const memberRow = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  roomTypeId: z.string().optional(),
  roomId: z.string().optional(),
  arrivalDate: z.string().optional(),
  departureDate: z.string().optional(),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(20).optional(),
  notes: z.string().max(2000).optional(),
});

const createGroupSchema = z.object({
  propertyId: z.string(),
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  contactName: z.string().max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(40).optional(),
  blockType: z.enum(['courtesy', 'negotiated', 'contract']).optional(),
  status: z.enum(['prospect', 'tentative', 'definite', 'cancelled', 'completed']).optional(),
  arrivalDate: z.string(),
  departureDate: z.string(),
  cutOffDate: z.string().optional(),
  rate: z.number().positive().optional(),
  eventSpace: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  blocks: z.array(blockInput).max(50).optional(),
});

const updateGroupSchema = createGroupSchema.partial().omit({ propertyId: true, blocks: true });

const listQuery = paginationSchema.extend({
  status: z.enum(['prospect', 'tentative', 'definite', 'cancelled', 'completed']).optional(),
  blockType: z.enum(['courtesy', 'negotiated', 'contract']).optional(),
  propertyId: z.string().optional(),
  q: z.string().max(100).optional(),
  upcoming: z.enum(['true']).optional(),
});

/* ─── Routes ─── */

groupsRouter.get(
  '/',
  requirePermission('group', 'read'),
  validateQuery(listQuery),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    res.json(await svc.listGroups(tenantId, req.validatedQuery as any));
  })
);

groupsRouter.post(
  '/',
  requirePermission('group', 'create'),
  validateBody(createGroupSchema),
  ah(async (req, res) => {
    const { tenantId, user } = (req as AuthenticatedRequest).auth;
    const detail = await svc.createGroup(tenantId, user.id, req.validatedBody as any);
    res.status(201).json({ data: detail });
  })
);

groupsRouter.get(
  '/:id',
  requirePermission('group', 'read'),
  validateParams(idParams),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    res.json({ data: await svc.getGroupDetail(tenantId, (req.validatedParams as any).id) });
  })
);

groupsRouter.patch(
  '/:id',
  requirePermission('group', 'update'),
  validateParams(idParams),
  validateBody(updateGroupSchema),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const detail = await svc.updateGroup(
      tenantId,
      (req.validatedParams as any).id,
      req.validatedBody as Record<string, unknown>
    );
    res.json({ data: detail });
  })
);

/* Blocks */
groupsRouter.post(
  '/:id/blocks',
  requirePermission('group', 'update'),
  validateParams(idParams),
  validateBody(blockInput),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const detail = await svc.addBlock(
      tenantId,
      (req.validatedParams as any).id,
      req.validatedBody as any
    );
    res.status(201).json({ data: detail });
  })
);

groupsRouter.patch(
  '/:id/blocks/:blockId',
  requirePermission('group', 'update'),
  validateParams(blockParams),
  validateBody(blockInput.partial()),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const { id, blockId } = req.validatedParams as any;
    const detail = await svc.updateBlock(tenantId, id, blockId, req.validatedBody as any);
    res.json({ data: detail });
  })
);

groupsRouter.delete(
  '/:id/blocks/:blockId',
  requirePermission('group', 'update'),
  validateParams(blockParams),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const { id, blockId } = req.validatedParams as any;
    const detail = await svc.deleteBlock(tenantId, id, blockId);
    res.json({ data: detail });
  })
);

/* Members / rooming list */
groupsRouter.post(
  '/:id/members',
  requirePermission('group', 'update'),
  validateParams(idParams),
  validateBody(memberRow),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const detail = await svc.addMember(
      tenantId,
      (req.validatedParams as any).id,
      req.validatedBody as any
    );
    res.status(201).json({ data: detail });
  })
);

groupsRouter.post(
  '/:id/rooming-list',
  requirePermission('group', 'update'),
  validateParams(idParams),
  validateBody(z.object({ rows: z.array(memberRow).min(1).max(500) })),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const detail = await svc.importRoomingList(
      tenantId,
      (req.validatedParams as any).id,
      (req.validatedBody as any).rows
    );
    res.status(201).json({ data: detail });
  })
);

groupsRouter.post(
  '/:id/members/link',
  requirePermission('group', 'update'),
  validateParams(idParams),
  validateBody(z.object({ reservationId: z.string() })),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const detail = await svc.linkReservation(
      tenantId,
      (req.validatedParams as any).id,
      (req.validatedBody as any).reservationId
    );
    res.json({ data: detail });
  })
);

groupsRouter.delete(
  '/:id/members/:reservationId',
  requirePermission('group', 'update'),
  validateParams(memberParams),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const { id, reservationId } = req.validatedParams as any;
    const detail = await svc.removeMember(tenantId, id, reservationId);
    res.json({ data: detail });
  })
);

/* Master folio */
groupsRouter.post(
  '/:id/charges',
  requirePermission('folio', 'create'),
  validateParams(idParams),
  validateBody(
    z.object({
      type: z.enum(['room_block', 'event_space', 'av', 'f_b', 'misc']).optional(),
      description: z.string().min(1).max(300),
      amount: z.number().positive(),
      quantity: z.number().int().min(1).max(999).optional(),
    })
  ),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const detail = await svc.postCharge(
      tenantId,
      (req.validatedParams as any).id,
      req.validatedBody as any
    );
    res.status(201).json({ data: detail });
  })
);

groupsRouter.post(
  '/:id/payments',
  requirePermission('folio', 'payment'),
  validateParams(idParams),
  validateBody(
    z.object({
      method: z.enum(['cash', 'card', 'bank_transfer', 'other']).optional(),
      amount: z.number().positive(),
      reference: z.string().max(100).optional(),
      note: z.string().max(500).optional(),
    })
  ),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const detail = await svc.recordPayment(
      tenantId,
      (req.validatedParams as any).id,
      req.validatedBody as any
    );
    res.status(201).json({ data: detail });
  })
);

/* Events */
groupsRouter.post(
  '/:id/events',
  requirePermission('group', 'update'),
  validateParams(idParams),
  validateBody(
    z.object({
      name: z.string().min(1).max(200),
      venue: z.string().max(200).optional(),
      date: z.string(),
      startTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
      endTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
      guests: z.number().int().min(0).max(100000).optional(),
      status: z.enum(['tentative', 'confirmed', 'cancelled']).optional(),
      tags: z.array(z.string().max(60)).max(30).optional(),
      notes: z.string().max(3000).optional(),
    })
  ),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const detail = await svc.addEvent(
      tenantId,
      (req.validatedParams as any).id,
      req.validatedBody as any
    );
    res.status(201).json({ data: detail });
  })
);

groupsRouter.delete(
  '/:id/events/:eventId',
  requirePermission('group', 'update'),
  validateParams(eventParams),
  ah(async (req, res) => {
    const { tenantId } = (req as AuthenticatedRequest).auth;
    const { id, eventId } = req.validatedParams as any;
    const detail = await svc.deleteEvent(tenantId, id, eventId);
    res.json({ data: detail });
  })
);

/* Component registration (documented in the OpenAPI doc via openapi.ts) */
registry.register('Group', z.object({ id: z.string(), code: z.string(), name: z.string() }));
