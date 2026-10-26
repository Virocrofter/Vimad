/* apps/api/src/modules/central-reservations/central-reservations.routes.ts — C4 */
import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateParams, validateQuery } from '../../common/validate.js';
import * as service from './central-reservations.service.js';

export const centralReservationsRouter = Router();
centralReservationsRouter.use(authMiddleware);

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const availabilityQuery = z.object({
  from: z.string().regex(dateRe, 'from must be YYYY-MM-DD'),
  to: z.string().regex(dateRe, 'to must be YYYY-MM-DD'),
});
const createBody = z
  .object({
    propertyId: z.string().min(1),
    roomTypeId: z.string().min(1).optional(),
    ratePlanId: z.string().min(1).optional(),
    arrivalDate: z.string().regex(dateRe),
    departureDate: z.string().regex(dateRe),
    adults: z.coerce.number().int().min(1).max(20).default(2),
    children: z.coerce.number().int().min(0).max(20).default(0),
    guestId: z.string().min(1).optional(),
    guest: z
      .object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      })
      .optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((v) => v.guestId || v.guest, { message: 'guestId or guest is required' });
const moveBody = z.object({
  propertyId: z.string().min(1),
  roomTypeId: z.string().min(1).optional(),
});
const idParams = z.object({ id: z.string().min(1) });

const tenantOf = (req: any) => req.auth?.tenantId ?? req.user?.tenantId;

centralReservationsRouter.get(
  '/availability',
  requirePermission('reservation', 'read'),
  validateQuery(availabilityQuery),
  async (req, res, next) => {
    try {
      const { from, to } = req.validatedQuery as any;
      res.json({ data: await service.availability(tenantOf(req), from, to) });
    } catch (err) {
      next(err);
    }
  }
);

centralReservationsRouter.get(
  '/',
  requirePermission('reservation', 'read'),
  async (req, res, next) => {
    try {
      res.json({ data: await service.listReservations(tenantOf(req)) });
    } catch (err) {
      next(err);
    }
  }
);

centralReservationsRouter.post(
  '/',
  requirePermission('reservation', 'create'),
  validateBody(createBody),
  async (req, res, next) => {
    try {
      const data = await service.createBooking(tenantOf(req), req.validatedBody as any);
      res.status(201).json({ data });
    } catch (err) {
      next(err);
    }
  }
);

centralReservationsRouter.post(
  '/:id/move',
  requirePermission('reservation', 'update'),
  validateParams(idParams),
  validateBody(moveBody),
  async (req, res, next) => {
    try {
      const { id } = req.validatedParams as any;
      const { propertyId, roomTypeId } = req.validatedBody as any;
      res.json({ data: await service.moveReservation(tenantOf(req), id, propertyId, roomTypeId) });
    } catch (err) {
      next(err);
    }
  }
);
