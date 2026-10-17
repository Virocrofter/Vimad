/* apps/api/src/modules/tickets/tickets.routes.ts — staff Support Desk */
import { Router } from 'express';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../common/validate.js';
import {
  registry,
  listTicketsQuerySchema,
  createTicketBodySchema,
  updateTicketBodySchema,
  assignTicketBodySchema,
  addCommentBodySchema,
  ticketSchema,
} from './tickets.schemas.js';
import * as svc from './tickets.service.js';
import { ErrorResponseSchema, IdParamSchema } from '../../common/openapi-schemas.js';

export const ticketsRouter = Router();
ticketsRouter.use(authMiddleware);

const TENANT = (req: any) => req.auth.tenantId as string;

ticketsRouter.get(
  '/',
  requirePermission('ticket', 'read'),
  validateQuery(listTicketsQuerySchema),
  async (req, res, next) => {
    try {
      res.json(await svc.listTickets(TENANT(req), req.validatedQuery as any));
    } catch (e) {
      next(e);
    }
  }
);

ticketsRouter.get('/stats', requirePermission('ticket', 'read'), async (req, res, next) => {
  try {
    res.json({ data: await svc.getStats(TENANT(req)) });
  } catch (e) {
    next(e);
  }
});

ticketsRouter.get(
  '/:id',
  requirePermission('ticket', 'read'),
  validateParams(IdParamSchema),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.getTicket(TENANT(req), (req.validatedParams as any).id) });
    } catch (e) {
      next(e);
    }
  }
);

ticketsRouter.post(
  '/',
  requirePermission('ticket', 'manage'),
  validateBody(createTicketBodySchema),
  async (req, res, next) => {
    try {
      const t = await svc.createTicket(TENANT(req), req.auth.userId, req.validatedBody as any, req);
      res.status(201).json({ data: t });
    } catch (e) {
      next(e);
    }
  }
);

ticketsRouter.put(
  '/:id',
  requirePermission('ticket', 'update'),
  validateParams(IdParamSchema),
  validateBody(updateTicketBodySchema),
  async (req, res, next) => {
    try {
      res.json({
        data: await svc.updateTicket(
          TENANT(req),
          (req.validatedParams as any).id,
          req.validatedBody as any,
          req
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

ticketsRouter.post(
  '/:id/assign',
  requirePermission('ticket', 'update'),
  validateParams(IdParamSchema),
  validateBody(assignTicketBodySchema),
  async (req, res, next) => {
    try {
      res.json({
        data: await svc.assignTicket(
          TENANT(req),
          (req.validatedParams as any).id,
          (req.validatedBody as any).assigneeId,
          req
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

ticketsRouter.post(
  '/:id/comments',
  requirePermission('ticket', 'update'),
  validateParams(IdParamSchema),
  validateBody(addCommentBodySchema),
  async (req, res, next) => {
    try {
      const name = req.auth.email || 'Staff';
      res.json({
        data: await svc.addComment(
          TENANT(req),
          (req.validatedParams as any).id,
          req.auth.userId,
          name,
          (req.validatedBody as any).message,
          (req.validatedBody as any).isInternal,
          req
        ),
      });
    } catch (e) {
      next(e);
    }
  }
);

ticketsRouter.post(
  '/:id/close',
  requirePermission('ticket', 'update'),
  validateParams(IdParamSchema),
  async (req, res, next) => {
    try {
      res.json({ data: await svc.closeTicket(TENANT(req), (req.validatedParams as any).id, req) });
    } catch (e) {
      next(e);
    }
  }
);

// ─── OpenAPI paths ───
registry.registerPath({
  method: 'get',
  path: '/v1/tickets',
  tags: ['Support'],
  summary: 'List support tickets',
  security: [{ bearerAuth: [] }],
  request: { query: listTicketsQuerySchema },
  responses: { 200: { description: 'Paginated tickets' }, 401: { description: 'Unauthorized' } },
});
registry.registerPath({
  method: 'get',
  path: '/v1/tickets/{id}',
  tags: ['Support'],
  summary: 'Get a ticket with its full thread',
  security: [{ bearerAuth: [] }],
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Ticket', content: { 'application/json': { schema: ticketSchema } } },
  },
});
registry.registerPath({
  method: 'post',
  path: '/v1/tickets/{id}/comments',
  tags: ['Support'],
  summary: 'Reply to a ticket (or add an internal note)',
  security: [{ bearerAuth: [] }],
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: addCommentBodySchema } } },
  },
  responses: {
    200: { description: 'Updated' },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});
