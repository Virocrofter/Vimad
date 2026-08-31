import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware, tenantScope, requireRole } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import {
  createProperty,
  deleteProperty,
  getProperty,
  listProperties,
  propertyCreateSchema,
  propertyUpdateSchema,
  updateProperty,
  type PropertyCreateInput,
  type PropertyUpdateInput,
} from './properties.service.js';

export const propertiesRouter = Router();

propertiesRouter.use(authMiddleware, tenantScope);

propertiesRouter.get(
  '/',
  validateQuery(paginationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await listProperties(
        req.tenantId,
        req.validatedQuery as { page: number; pageSize: number }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

propertiesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getProperty(req.tenantId, req.params.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

propertiesRouter.post(
  '/',
  requireRole('owner', 'admin', 'manager'),
  validateBody(propertyCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createProperty(req.tenantId, req.validatedBody as PropertyCreateInput);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

propertiesRouter.patch(
  '/:id',
  requireRole('owner', 'admin', 'manager'),
  validateBody(propertyUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updateProperty(
        req.tenantId,
        req.params.id,
        req.validatedBody as PropertyUpdateInput
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

propertiesRouter.delete(
  '/:id',
  requireRole('owner', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteProperty(req.tenantId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
