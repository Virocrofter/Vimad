/* apps/api/src/modules/tenant-settings/tenant-settings.routes.ts
 * Tenant self-service settings — SELF-CONTAINED (no cross-module imports).
 * Mounted at /v1/tenant in src/index.ts.
 *   GET  /tenant/settings/profile         — tenant, current user, counts, usage
 *   GET  /tenant/settings/invoices        — platform invoices (billing.job output)
 *   POST /tenant/settings/plan-request    — plan change  -> support case (billing)
 *   POST /tenant/settings/support-request — card capture -> support case (billing)
 *   GET  /tenant/settings/diagnostics     — version/env/tenant/db/redis bundle
 * No self-billing by design (A1-A6): VIMAD billing confirms plan changes and
 * sends the Paystack card-capture link. Permissions: setting:read/update.
 */
import { Router } from 'express';
import { z } from 'zod';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { authMiddleware, requirePermission } from '../auth/auth.middleware.js';
import { validateBody, validateQuery } from '../../common/validate.js';
import { paginationSchema, paginate, skipTake } from '../../common/pagination.js';
import { prisma } from '../../common/prisma.js';
import { redisConnection } from '../../common/queue.js';
import { env } from '../../common/env.js';
import { AppError } from '../../common/errors.js';
import { logger } from '../../common/logger.js';

extendZodWithOpenApi(z);
export const registry = new OpenAPIRegistry();

export const tenantSettingsRouter = Router();
tenantSettingsRouter.use(authMiddleware);

const API_VERSION = '0.0.0';

/* Open a VIMAD billing support case directly (same support_cases tables and
 * SC-<year>-<seq> numbering the support module uses). */
async function openBillingCase(
  tenantId: string,
  userId: string | null,
  subject: string,
  description: string
): Promise<string> {
  const counter = await prisma.supportCaseCounter.upsert({
    where: { key: 'global' },
    update: { lastNumber: { increment: 1 } },
    create: { key: 'global', lastNumber: 1 },
  });
  const number = `SC-${new Date().getFullYear()}-${String(counter.lastNumber).padStart(4, '0')}`;

  await prisma.supportCase.create({
    data: {
      tenantId,
      number,
      subject,
      description,
      category: 'billing',
      status: 'open',
      priority: 'medium',
      source: 'tenant',
      createdById: userId,
      lastMessageAt: new Date(),
    },
  });
  logger.info({ tenantId, number, subject }, 'billing case opened from settings');
  return number;
}

const planRequestBody = z.object({
  plan: z.enum(['starter', 'professional', 'enterprise']),
  note: z.string().max(1000).optional(),
});

const supportRequestBody = z.object({ kind: z.enum(['card_capture']) });

tenantSettingsRouter.get(
  '/settings/profile',
  requirePermission('setting', 'read'),
  async (req, res, next) => {
    try {
      const tenantId = req.auth.tenantId as string;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [tenant, properties, members, usageRows] = await Promise.all([
        prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
        prisma.property.count({ where: { tenantId } }),
        prisma.user.count({ where: { tenantId, status: 'active' } }),
        prisma.usageRecord.groupBy({
          by: ['metric'],
          where: { tenantId, recordedAt: { gte: monthStart } },
          _sum: { quantity: true },
        }),
      ]);

      const usage: Record<string, number> = {};
      for (const r of usageRows) usage[r.metric] = r._sum.quantity ?? 0;

      const u: any = (req.auth as any).user ?? {};
      res.json({
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            status: tenant.status,
            createdAt: tenant.createdAt,
          },
          user: {
            id: (req.auth as any).userId ?? u?.id ?? '',
            email: (req.auth as any).email ?? u?.email ?? '',
            firstName: u?.firstName ?? null,
            lastName: u?.lastName ?? null,
            role: u?.role ?? 'staff',
          },
          properties,
          members,
          usage,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

tenantSettingsRouter.get(
  '/settings/invoices',
  requirePermission('setting', 'read'),
  validateQuery(paginationSchema),
  async (req, res, next) => {
    try {
      const tenantId = req.auth.tenantId as string;
      const pq = req.validatedQuery as any;
      const [items, total] = await Promise.all([
        prisma.invoice.findMany({
          where: { tenantId },
          orderBy: { periodEnd: 'desc' },
          ...skipTake(pq),
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            dueDate: true,
            plan: true,
            baseAmount: true,
            overageAmount: true,
            totalAmount: true,
            currency: true,
            status: true,
            paidAt: true,
          },
        }),
        prisma.invoice.count({ where: { tenantId } }),
      ]);
      res.json(paginate(items, total, pq));
    } catch (e) {
      next(e);
    }
  }
);

tenantSettingsRouter.post(
  '/settings/plan-request',
  requirePermission('setting', 'update'),
  validateBody(planRequestBody),
  async (req, res, next) => {
    try {
      const tenantId = req.auth.tenantId as string;
      const userId = ((req.auth as any).userId ?? (req.auth as any).user?.id) as string | null;
      const { plan, note } = req.validatedBody as z.infer<typeof planRequestBody>;
      const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

      const target = plan.charAt(0).toUpperCase() + plan.slice(1);
      const current = tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1);
      if (tenant.plan.toLowerCase() === plan) {
        throw new AppError(400, `You are already on the ${target} plan`, 'PLAN_UNCHANGED');
      }

      const number = await openBillingCase(
        tenantId,
        userId,
        `Plan change request: ${current} > ${target}`,
        `Tenant "${tenant.name}" (${tenant.slug}) requests a move from ${current} to ${target}.` +
          (note ? `\n\nNote from hotel:\n${note}` : '') +
          `\n\nHandled by VIMAD billing - no self-serve plan switch exists yet.`
      );

      res
        .status(201)
        .json({
          data: { requested: plan, caseNumber: number, message: 'Request sent to VIMAD billing' },
        });
    } catch (e) {
      next(e);
    }
  }
);

tenantSettingsRouter.post(
  '/settings/support-request',
  requirePermission('setting', 'update'),
  validateBody(supportRequestBody),
  async (req, res, next) => {
    try {
      const tenantId = req.auth.tenantId as string;
      const userId = ((req.auth as any).userId ?? (req.auth as any).user?.id) as string | null;
      const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

      const number = await openBillingCase(
        tenantId,
        userId,
        'Payment method - request secure card capture link',
        `Tenant "${tenant.name}" (${tenant.slug}) requests a Paystack secure card capture link for subscription billing. ` +
          `Requested from Settings > Subscription. Card numbers are never typed into the app.`
      );

      res
        .status(201)
        .json({ data: { caseNumber: number, message: 'Request sent to VIMAD billing' } });
    } catch (e) {
      next(e);
    }
  }
);

tenantSettingsRouter.get(
  '/settings/diagnostics',
  requirePermission('setting', 'read'),
  async (req, res, next) => {
    try {
      let db = 'down';
      try {
        await prisma.$queryRaw`SELECT 1`;
        db = 'up';
      } catch {
        /* stays down */
      }

      res.json({
        data: {
          app: 'vimad-api',
          version: API_VERSION,
          environment: env.NODE_ENV,
          node: process.version,
          tenantId: req.auth.tenantId as string,
          serverTime: new Date().toISOString(),
          db,
          redis: redisConnection.status,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);
