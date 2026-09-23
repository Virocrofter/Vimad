/* apps/api/src/modules/admin/admin.jobs.routes.ts */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../auth/auth.middleware.js';
import { requireAdminRole } from './admin.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema } from '../../common/pagination.js';
import { AppError } from '../../common/errors.js';
import { retryFailedJob } from '../../jobs/dead-letter.handler.js';
import { prisma } from '../../common/prisma.js';

export const adminJobsRouter = Router();

adminJobsRouter.use(authMiddleware, requireAdminRole);

// ─── GET /admin/jobs/failed ───
adminJobsRouter.get(
  '/failed',
  validateQuery(paginationSchema.extend({ status: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, pageSize, status } = req.validatedQuery as {
        page: number;
        pageSize: number;
        status?: string;
      };

      const where = status ? { status } : {};
      const [total, items] = await Promise.all([
        prisma.failedJob.count({ where }),
        prisma.failedJob.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      res.json({
        data: items,
        meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /admin/jobs/failed/:id/retry ───
adminJobsRouter.post(
  '/failed/:id/retry',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await retryFailedJob(req.params.id);
      if (!result.success) {
        throw new AppError(400, result.message, 'RETRY_FAILED');
      }
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /admin/jobs/failed/:id/resolve ───
adminJobsRouter.post(
  '/failed/:id/resolve',
  validateBody(z.object({ note: z.string().optional() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.failedJob.findUnique({ where: { id: req.params.id } });
      if (!record) {
        throw new AppError(404, 'Failed job not found', 'NOT_FOUND');
      }

      await prisma.failedJob.update({
        where: { id: req.params.id },
        data: { status: 'resolved', resolvedAt: new Date() },
      });

      res.json({ data: { resolved: true } });
    } catch (err) {
      next(err);
    }
  }
);
