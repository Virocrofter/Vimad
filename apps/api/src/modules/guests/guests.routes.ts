import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, tenantScope } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  createGuest,
  deleteGuest,
  getGuest,
  guestCreateSchema,
  guestUpdateSchema,
  listGuests,
  updateGuest,
  type GuestCreateInput,
  type GuestUpdateInput,
} from './guests.service.js';

const guestQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const guestsRouter = Router();

guestsRouter.use(authMiddleware, tenantScope);

guestsRouter.get(
  '/',
  validateQuery(guestQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listGuests(
        req.tenantId,
        req.validatedQuery as { page: number; pageSize: number; search?: string }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

guestsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getGuest(req.tenantId, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

guestsRouter.post(
  '/',
  validateBody(guestCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createGuest(req.tenantId, req.validatedBody as GuestCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

guestsRouter.patch(
  '/:id',
  validateBody(guestUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateGuest(
        req.tenantId,
        req.params.id,
        req.validatedBody as GuestUpdateInput
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

guestsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await deleteGuest(req.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
