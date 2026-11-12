import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  authMiddleware,
  tenantScope,
  requirePermission,
  attachPropertyScope,
  requirePropertyScope,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  ErrorResponseSchema,
  IdParamSchema,
  PaginatedResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  assignRoom,
  assignRoomSchema,
  createReservation,
  deleteReservation,
  getReservation,
  listReservations,
  updateReservation,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  markNoShow,
  resendConfirmation,
  updateStayRate,
  listTraces,
  createTrace,
  resolveTrace,
  listCompanions,
  addCompanion,
  removeCompanion,
  reservationCreateSchema,
  reservationUpdateSchema,
  createTraceSchema,
  addCompanionSchema,
  type AuditActor,
  type ReservationListQuery,
} from './reservations.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const reservationQuerySchema = paginationSchema
  .extend({
    status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
    source: z.enum(['direct', 'bookingcom', 'expedia', 'walkin', 'phone', 'email']).optional(),
    propertyId: z.string().optional(),
    guestId: z.string().optional(),
    search: z.string().optional(),
    arrivalFrom: z.string().optional(),
    arrivalTo: z.string().optional(),
    departureFrom: z.string().optional(),
    departureTo: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .openapi('ReservationQuery');

const ReservationCreateInputSchema = reservationCreateSchema.openapi('ReservationCreateInput');
const ReservationUpdateInputSchema = reservationUpdateSchema.openapi('ReservationUpdateInput');

const ReservationGuestSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
});

const ReservationPropertySchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
});

const ReservationStaySchema = z.object({
  id: z.string(),
  roomId: z.string(),
  date: z.date().or(z.string()),
  rate: z.number(),
  room: z
    .object({
      id: z.string(),
      number: z.string(),
    })
    .optional(),
});

const ReservationFolioSchema = z.object({
  id: z.string(),
  status: z.string(),
  balance: z.number(),
});

const ReservationItemSchema = z
  .object({
    id: z.string(),
    confirmationNumber: z.string(),
    status: z.string(),
    source: z.string(),
    arrivalDate: z.date().or(z.string()),
    departureDate: z.date().or(z.string()),
    nights: z.number().int(),
    adults: z.number().int(),
    children: z.number().int(),
    totalAmount: z.number(),
    balance: z.number(),
    guest: ReservationGuestSchema,
    property: ReservationPropertySchema,
    stays: z.array(ReservationStaySchema).optional(),
    folio: ReservationFolioSchema.nullable().optional(),
    createdAt: z.date().or(z.string()).optional(),
    updatedAt: z.date().or(z.string()).optional(),
  })
  .openapi('ReservationItem');

const ReservationResponseSchema = z
  .object({ data: ReservationItemSchema })
  .openapi('ReservationResponse');
const ReservationListResponseSchema =
  PaginatedResponseSchema(ReservationItemSchema).openapi('ReservationListResponse');

const unauthorized = {
  description: 'Unauthorized',
  content: { 'application/json': { schema: ErrorResponseSchema } },
} as const;

const forbidden = {
  description: 'Forbidden',
  content: { 'application/json': { schema: ErrorResponseSchema } },
} as const;

const notFound = {
  description: 'Not found',
  content: { 'application/json': { schema: ErrorResponseSchema } },
} as const;

const conflict = {
  description: 'Conflict',
  content: { 'application/json': { schema: ErrorResponseSchema } },
} as const;

export const reservationsRouter = Router();

reservationsRouter.use(authMiddleware, tenantScope);

// B2 fix: real user attribution — derive actor from the authed request
function actorOf(req: Request): AuditActor {
  const u = (
    req as unknown as {
      auth?: { user?: { id: string; firstName?: string; lastName?: string; role?: string } };
    }
  ).auth?.user;
  return {
    id: u?.id ?? 'system',
    name: u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.id : 'System',
    role: u?.role ?? 'system',
  };
}

// GET / — list
registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Reservations'],
  description: 'List reservations with filters',
  request: { query: reservationQuerySchema },
  responses: {
    200: {
      description: 'Paginated list of reservations',
      content: { 'application/json': { schema: ReservationListResponseSchema } },
    },
    401: unauthorized,
    403: forbidden,
  },
});

reservationsRouter.use(attachPropertyScope);

reservationsRouter.get(
  '/',
  requirePermission('reservation', 'read'),
  validateQuery(reservationQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listReservations(req.tenantId, {
        ...(req.validatedQuery as ReservationListQuery),
        ...(req.effectivePropertyIds ? { propertyIds: req.effectivePropertyIds } : {}),
      } as ReservationListQuery);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id
registry.registerPath({
  method: 'get',
  path: '/{id}',
  tags: ['Reservations'],
  description: 'Get a reservation by ID',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Reservation details',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    401: unauthorized,
    403: forbidden,
    404: notFound,
  },
});

reservationsRouter.get(
  '/:id',
  requirePermission('reservation', 'read'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getReservation(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST / — create
registry.registerPath({
  method: 'post',
  path: '/',
  tags: ['Reservations'],
  description: 'Create a reservation',
  request: {
    body: {
      description: 'Reservation payload',
      content: { 'application/json': { schema: ReservationCreateInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Reservation created',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: unauthorized,
    403: forbidden,
  },
});

reservationsRouter.post(
  '/',
  requirePermission('reservation', 'create'),
  validateBody(reservationCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createReservation(req.tenantId, req.body, actorOf(req));
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /:id — update
registry.registerPath({
  method: 'patch',
  path: '/{id}',
  tags: ['Reservations'],
  description: 'Update a reservation',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Reservation update payload',
      content: { 'application/json': { schema: ReservationUpdateInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Reservation updated',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: unauthorized,
    403: forbidden,
    404: notFound,
    409: conflict,
  },
});

reservationsRouter.patch(
  '/:id',
  requirePermission('reservation', 'update'),
  requirePropertyScope(),
  validateBody(reservationUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateReservation(req.tenantId, req.params.id, req.body, actorOf(req));
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:id
reservationsRouter.delete(
  '/:id',
  requirePermission('reservation', 'delete'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteReservation(req.tenantId, req.params.id, actorOf(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/assign-room
reservationsRouter.post(
  '/:id/assign-room',
  requirePermission('reservation', 'update'),
  requirePropertyScope(),
  validateBody(assignRoomSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await assignRoom(req.tenantId, req.params.id, req.body, actorOf(req));
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/check-in
reservationsRouter.post(
  '/:id/check-in',
  requirePermission('reservation', 'checkin'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await checkInReservation(req.tenantId, req.params.id, actorOf(req));
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/check-out
reservationsRouter.post(
  '/:id/check-out',
  requirePermission('reservation', 'checkout'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await checkOutReservation(req.tenantId, req.params.id, actorOf(req));
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/cancel
registry.registerPath({
  method: 'post',
  path: '/{id}/cancel',
  tags: ['Reservations'],
  description: 'Cancel a reservation',
  request: {
    params: IdParamSchema,
    body: {
      description: 'Cancellation payload',
      content: {
        'application/json': {
          schema: z.object({ reason: z.string().optional() }).openapi('CancelInput'),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Cancelled',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    401: unauthorized,
    403: forbidden,
    404: notFound,
    409: conflict,
  },
});

reservationsRouter.post(
  '/:id/cancel',
  requirePermission('reservation', 'cancel'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await cancelReservation(
        req.tenantId,
        req.params.id,
        req.body?.reason,
        actorOf(req)
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/no-show
registry.registerPath({
  method: 'post',
  path: '/{id}/no-show',
  tags: ['Reservations'],
  description: 'Mark a confirmed reservation as no-show (frees the room)',
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: 'Marked no-show',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    401: unauthorized,
    403: forbidden,
    404: notFound,
    409: conflict,
  },
});

reservationsRouter.post(
  '/:id/no-show',
  requirePermission('reservation', 'no_show'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await markNoShow(req.tenantId, req.params.id, actorOf(req));
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/resend-confirmation
registry.registerPath({
  method: 'post',
  path: '/{id}/resend-confirmation',
  tags: ['Reservations'],
  description: 'Resend the confirmation email to the guest',
  request: { params: IdParamSchema },
  responses: {
    200: { description: 'Confirmation queued' },
    401: unauthorized,
    403: forbidden,
    404: notFound,
    409: conflict,
  },
});

reservationsRouter.post(
  '/:id/resend-confirmation',
  requirePermission('reservation', 'update'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await resendConfirmation(req.tenantId, req.params.id, actorOf(req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /stays/:stayId — per-night rate editing
reservationsRouter.patch(
  '/stays/:stayId',
  requirePermission('reservation', 'update'),
  validateBody(z.object({ rate: z.number().min(0) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateStayRate(
        req.tenantId,
        req.params.stayId,
        req.body.rate,
        actorOf(req)
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id/traces
reservationsRouter.get(
  '/:id/traces',
  requirePermission('reservation', 'read'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listTraces(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/traces
reservationsRouter.post(
  '/:id/traces',
  requirePermission('reservation', 'trace'),
  requirePropertyScope(),
  validateBody(createTraceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createTrace(req.tenantId, req.params.id, req.body, actorOf(req));
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /traces/:traceId/resolve
reservationsRouter.post(
  '/traces/:traceId/resolve',
  requirePermission('reservation', 'trace'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await resolveTrace(req.tenantId, req.params.traceId, actorOf(req));
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /:id/companions
reservationsRouter.get(
  '/:id/companions',
  requirePermission('reservation', 'read'),
  requirePropertyScope(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listCompanions(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /:id/companions
reservationsRouter.post(
  '/:id/companions',
  requirePermission('reservation', 'update'),
  requirePropertyScope(),
  validateBody(addCompanionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await addCompanion(req.tenantId, req.params.id, req.body, actorOf(req));
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /companions/:companionId
reservationsRouter.delete(
  '/companions/:companionId',
  requirePermission('reservation', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await removeCompanion(req.tenantId, req.params.companionId, actorOf(req));
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
