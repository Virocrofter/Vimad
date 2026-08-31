import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  createReservation,
  deleteReservation,
  getReservation,
  listReservations,
  reservationCreateSchema,
  reservationUpdateSchema,
  updateReservation,
  type ReservationCreateInput,
  type ReservationUpdateInput,
} from './reservations.service.js';

const reservationQuerySchema = paginationSchema.extend({
  status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
  propertyId: z.string().optional(),
  guestId: z.string().optional(),
});

export const reservationsRouter = Router();

reservationsRouter.use(authMiddleware, tenantScope);

reservationsRouter.get(
  '/',
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
        }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

reservationsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getReservation(req.tenantId, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

reservationsRouter.post(
  '/',
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

reservationsRouter.patch(
  '/:id',
  validateBody(reservationUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateReservation(
        req.tenantId,
        req.params.id,
        req.validatedBody as ReservationUpdateInput
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

reservationsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteReservation(req.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
