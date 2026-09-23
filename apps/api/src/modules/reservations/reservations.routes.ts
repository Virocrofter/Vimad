import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { authMiddleware, tenantScope, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  ErrorResponseSchema,
  IdParamSchema,
  PaginatedResponseSchema,
} from '../../common/openapi-schemas.js';
import {
  createReservation,
  deleteReservation,
  getReservation,
  listReservations,
  updateReservation,
  checkInReservation,
  checkOutReservation,
  cancelReservation,
  reservationCreateSchema,
  reservationUpdateSchema,
  type ReservationCreateInput,
} from './reservations.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const reservationQuerySchema = paginationSchema
  .extend({
    status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
    propertyId: z.string().optional(),
    guestId: z.string().optional(),
    arrivalDate: z.string().optional(),
    departureDate: z.string().optional(),
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

export const reservationsRouter = Router();

reservationsRouter.use(authMiddleware, tenantScope);

registry.registerPath({
  method: 'get',
  path: '/',
  tags: ['Reservations'],
  description: 'List reservations',
  request: {
    query: reservationQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of reservations',
      content: { 'application/json': { schema: ReservationListResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

reservationsRouter.get(
  '/',
  requirePermission('reservation', 'read'),
  validateQuery(reservationQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listReservations(
        req.tenantId,
        req.validatedQuery as {
          page: number;
          pageSize: number;
          status?: string;
          propertyId?: string;
          guestId?: string;
          arrivalDate?: string;
          departureDate?: string;
        }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/{id}',
  tags: ['Reservations'],
  description: 'Get a reservation by ID',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Reservation details',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

reservationsRouter.get(
  '/:id',
  requirePermission('reservation', 'read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getReservation(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

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
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Property or guest not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Duplicate confirmation number',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

reservationsRouter.post(
  '/',
  requirePermission('reservation', 'create'),
  validateBody(reservationCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createReservation(
        req.tenantId,
        req.validatedBody as ReservationCreateInput
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

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
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

reservationsRouter.patch(
  '/:id',
  requirePermission('reservation', 'update'),
  validateBody(reservationUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateReservation(
        req.tenantId,
        req.params.id,
        req.validatedBody as z.infer<typeof reservationUpdateSchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/check-in',
  tags: ['Reservations'],
  description: 'Check in a reservation',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Checked in',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Already checked in or invalid status',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

reservationsRouter.post(
  '/:id/check-in',
  requirePermission('reservation', 'checkin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await checkInReservation(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/check-out',
  tags: ['Reservations'],
  description: 'Check out a reservation',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Checked out',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Not checked in or invalid status',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

reservationsRouter.post(
  '/:id/check-out',
  requirePermission('reservation', 'checkout'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await checkOutReservation(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/{id}/cancel',
  tags: ['Reservations'],
  description: 'Cancel a reservation',
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: 'Cancelled',
      content: { 'application/json': { schema: ReservationResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Already cancelled or checked out',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

reservationsRouter.post(
  '/:id/cancel',
  requirePermission('reservation', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await cancelReservation(req.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'delete',
  path: '/{id}',
  tags: ['Reservations'],
  description: 'Delete a reservation',
  request: {
    params: IdParamSchema,
  },
  responses: {
    204: {
      description: 'Reservation deleted',
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Reservation not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Cannot delete checked-in reservation',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

reservationsRouter.delete(
  '/:id',
  requirePermission('reservation', 'delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteReservation(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
