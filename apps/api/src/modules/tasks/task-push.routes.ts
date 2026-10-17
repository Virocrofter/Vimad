/* apps/api/src/modules/tasks/task-push.routes.ts — T5 staff trigger.
 * Mounted at /v1/tasks BEFORE the base tasks router; only owns POST /:id/push,
 * everything else falls through to tasksRouter.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  requirePermission,
  type AuthenticatedRequest,
} from '../auth/auth.middleware.js';
import { validateBody } from '../../common/validate.js';
import { prisma } from '../../common/prisma.js';
import { AppError } from '../../common/errors.js';
import { enqueueTaskPush } from '../../jobs/task-push.job.js';

export const taskPushStaffRouter = Router();

taskPushStaffRouter.post(
  '/:id/push',
  authMiddleware,
  requirePermission('task', 'assign'),
  validateBody(z.object({ channel: z.enum(['sms', 'whatsapp']).optional() }).default({})),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthenticatedRequest).auth.tenantId;
      const { channel } = req.validatedBody as { channel?: 'sms' | 'whatsapp' };

      const task = await prisma.task.findFirst({
        where: { id: req.params.id, tenantId },
        include: { assignee: { select: { firstName: true, lastName: true, phone: true } } },
      });
      if (!task) throw new AppError(404, 'Task not found', 'NOT_FOUND');
      if (task.status !== 'open' && task.status !== 'in_progress') {
        throw new AppError(409, `Task is already ${task.status}`, 'TASK_CLOSED');
      }
      if (!task.assignee) {
        throw new AppError(400, 'Task has no assignee — assign it to someone first', 'NO_ASSIGNEE');
      }
      if (!task.assignee.phone) {
        const name = [task.assignee.firstName, task.assignee.lastName].filter(Boolean).join(' ');
        throw new AppError(
          400,
          `${name} has no phone number on file. Set it in the DB: UPDATE users SET phone='+27…' WHERE id='${task.assigneeId}';`,
          'NO_PHONE'
        );
      }

      await enqueueTaskPush(task.id, channel);
      res.json({ data: { queued: true, channel: channel ?? 'default' } });
    } catch (err) {
      next(err);
    }
  }
);
