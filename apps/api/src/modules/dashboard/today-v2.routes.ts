// GET /v1/dashboard/today/v2 — Today v2 composed read model (plan section 7.5).
// Additive: v1 /today untouched. Server-decided entitlements; per-section degradation.
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import {
  authMiddleware,
  tenantScope,
  requirePermission,
  resolveAllowedPropertyIds,
} from '../auth/auth.middleware.js';
import { getTodayV2 } from './today-v2.service.js';

export const todayV2Router = Router();

todayV2Router.use(authMiddleware, tenantScope, requirePermission('dashboard', 'read'));

todayV2Router.get('/today/v2', async (req: Request, res: Response) => {
  const tenantId = ((req as any).auth?.user?.tenantId ?? (req as any).tenantId) as
    string | undefined;
  const propertyId = String((req.query as any).propertyId ?? '');
  if (!tenantId || !propertyId) {
    return res
      .status(400)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'propertyId is required' } });
  }
  const routeAllowedProps = await resolveAllowedPropertyIds((req as any).auth?.user?.id);
  if (Array.isArray(routeAllowedProps) && !routeAllowedProps.includes(propertyId)) {
    return res.status(403).json({ error: 'Forbidden', message: 'No access to this property' });
  }
  const prop = await prisma.property.findFirst({ where: { id: propertyId, tenantId } });
  if (!prop) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown property' } });
  }

  const workRange = String(req.query.workRange ?? 'today');
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);

  try {
    const data = await getTodayV2(
      tenantId,
      propertyId,
      { id: (req as any).auth?.user?.id, role: (req as any).auth?.user?.role },
      {
        workRange:
          workRange === 'tomorrow' || workRange === '7d'
            ? (workRange as 'tomorrow' | '7d')
            : 'today',
        page: Number.isFinite(page) ? page : 1,
        pageSize: Number.isFinite(pageSize) ? pageSize : 20,
      }
    );
    return res.json({ data });
  } catch (err: any) {
    if (String(err?.message).includes('PROPERTY_NOT_FOUND')) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown property' } });
    }
    throw err;
  }
});
