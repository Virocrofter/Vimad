/* apps/api/src/modules/meals/meals.routes.ts — T7 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  listMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  mealPlanSummary,
  listRestaurants,
  createRestaurant,
  updateRestaurant,
  listAssignments,
  createAssignment,
  cancelAssignment,
  coversForecast,
  listPostings,
  retryPosting,
  postDueMeals,
} from './meals.service.js';

export const mealsRouter = Router();
export const registry = new OpenAPIRegistry();

mealsRouter.use(authMiddleware);

// ─── Schemas ───

const mealPlanBodySchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1).max(120),
  code: z.string().min(1).max(40),
  boardBasis: z.enum(['RO', 'BB', 'HB', 'FB', 'AI', 'UAI']),
  price: z.coerce.number().min(0).max(1_000_000),
  currency: z.string().length(3).default('ZAR'),
  taxInclusive: z.boolean().default(true),
  autoPost: z.boolean().default(true),
  postTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'postTime must be HH:MM')
    .default('06:00'),
  restaurantId: z.string().nullable().optional(),
  description: z.string().max(500).optional(),
  inclusions: z.array(z.string().max(120)).max(40).default([]),
  exclusions: z.array(z.string().max(120)).max(40).default([]),
  childUnder6: z.enum(['free', '50', '75', 'full', 'n/a']).default('free'),
  childUnder12: z.enum(['free', '50', '75', 'full', 'n/a']).default('50'),
  childUnder16: z.enum(['free', '50', '75', 'full', 'n/a']).default('75'),
  seasonality: z.string().max(40).default('year-round'),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

const mealPlanUpdateSchema = mealPlanBodySchema.partial().omit({ propertyId: true });

const restaurantBodySchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1).max(120),
  type: z.enum(['main', 'pool', 'specialty', 'bar', 'room_service']).default('main'),
  cuisine: z.string().max(80).optional(),
  capacity: z.coerce.number().int().min(1).max(5000).default(50),
  operatingHours: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
});

const restaurantUpdateSchema = restaurantBodySchema.partial().omit({ propertyId: true });

const assignmentBodySchema = z.object({
  reservationId: z.string().min(1),
  mealPlanId: z.string().min(1),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  adults: z.coerce.number().int().min(0).max(50).optional(),
  children: z.coerce.number().int().min(0).max(50).optional(),
});

// ─── Meal plans ───

registry.registerPath({
  method: 'get',
  path: '/v1/meal-plans',
  tags: ['Meal Plans'],
  summary: 'List meal plans',
  security: [{ bearerAuth: [] }],
  request: {
    query: paginationSchema.extend({
      propertyId: z.string().optional(),
      boardBasis: z.string().optional(),
      isActive: z.string().optional(),
      search: z.string().optional(),
    }),
  },
  responses: { 200: { description: 'Paginated meal plans' } },
});

mealsRouter.get(
  '/',
  validateQuery(
    paginationSchema.extend({
      propertyId: z.string().optional(),
      boardBasis: z.string().optional(),
      isActive: z.string().optional(),
      search: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const result = await listMealPlans(auth.tenantId, req.validatedQuery as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/v1/meal-plans/summary',
  tags: ['Meal Plans'],
  summary: 'Meal plan dashboard stats',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Summary counters and month revenue' } },
});

mealsRouter.get(
  '/summary',
  validateQuery(z.object({ propertyId: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const q = req.validatedQuery as { propertyId?: string };
      res.json({ data: await mealPlanSummary(auth.tenantId, q.propertyId) });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/v1/meal-plans',
  tags: ['Meal Plans'],
  summary: 'Create a meal plan',
  security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: mealPlanBodySchema } } } },
  responses: { 201: { description: 'Created' }, 409: { description: 'Code already exists' } },
});

mealsRouter.post(
  '/',
  requirePermission('rate_plan', 'update'),
  validateBody(mealPlanBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const plan = await createMealPlan(auth.tenantId, req.validatedBody as any);
      res.status(201).json({ data: plan });
    } catch (err) {
      next(err);
    }
  }
);

mealsRouter.patch(
  '/:id',
  requirePermission('rate_plan', 'update'),
  validateBody(mealPlanUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const plan = await updateMealPlan(auth.tenantId, req.params.id, req.validatedBody as any);
      res.json({ data: plan });
    } catch (err) {
      next(err);
    }
  }
);

mealsRouter.delete(
  '/:id',
  requirePermission('rate_plan', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const result = await deleteMealPlan(auth.tenantId, req.params.id);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Restaurants ───

mealsRouter.get(
  '/restaurants',
  validateQuery(z.object({ propertyId: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const q = req.validatedQuery as { propertyId?: string };
      res.json({ data: await listRestaurants(auth.tenantId, q.propertyId) });
    } catch (err) {
      next(err);
    }
  }
);

mealsRouter.post(
  '/restaurants',
  requirePermission('rate_plan', 'update'),
  validateBody(restaurantBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const restaurant = await createRestaurant(auth.tenantId, req.validatedBody as any);
      res.status(201).json({ data: restaurant });
    } catch (err) {
      next(err);
    }
  }
);

mealsRouter.patch(
  '/restaurants/:id',
  requirePermission('rate_plan', 'update'),
  validateBody(restaurantUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const restaurant = await updateRestaurant(
        auth.tenantId,
        req.params.id,
        req.validatedBody as any
      );
      res.json({ data: restaurant });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Assignments ───

mealsRouter.get(
  '/assignments',
  validateQuery(
    paginationSchema.extend({
      propertyId: z.string().optional(),
      date: z.string().optional(),
      status: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const result = await listAssignments(auth.tenantId, req.validatedQuery as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

mealsRouter.post(
  '/assignments',
  requirePermission('reservation', 'update'),
  validateBody(assignmentBodySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const assignment = await createAssignment(
        auth.tenantId,
        auth.user.id,
        req.validatedBody as any
      );
      res.status(201).json({ data: assignment });
    } catch (err) {
      next(err);
    }
  }
);

mealsRouter.post(
  '/assignments/:id/cancel',
  requirePermission('reservation', 'update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const assignment = await cancelAssignment(auth.tenantId, req.params.id);
      res.json({ data: assignment });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Covers forecast (kitchen prep sheet) ───

registry.registerPath({
  method: 'get',
  path: '/v1/meal-plans/covers',
  tags: ['Meal Plans'],
  summary: 'Covers forecast per plan for a date, with dietary flags',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Covers breakdown' } },
});

mealsRouter.get(
  '/covers',
  validateQuery(z.object({ propertyId: z.string().min(1), date: z.string().min(8) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const q = req.validatedQuery as { propertyId: string; date: string };
      res.json({ data: await coversForecast(auth.tenantId, q.propertyId, q.date) });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Posting log + actions ───

mealsRouter.get(
  '/postings',
  validateQuery(
    paginationSchema.extend({ status: z.string().optional(), date: z.string().optional() })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const result = await listPostings(auth.tenantId, req.validatedQuery as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

mealsRouter.post(
  '/postings/:id/retry',
  requirePermission('folio', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const posting = await retryPosting(auth.tenantId, req.params.id);
      res.json({ data: posting });
    } catch (err) {
      next(err);
    }
  }
);

/** Manually trigger the auto-poster (e.g. after fixing a folio issue). */
mealsRouter.post(
  '/post-now',
  requirePermission('folio', 'create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const summary = await postDueMeals(auth.tenantId);
      res.json({ data: summary });
    } catch (err) {
      next(err);
    }
  }
);
