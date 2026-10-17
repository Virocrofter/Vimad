/* apps/api/src/modules/audit/audit.routes.ts
 * Tenant-scoped audit trail (staff app: users > audit logs).
 * Platform-admin view stays at /admin/audit-logs (admin module). This router
 * exposes the same immutable audit_logs rows to tenant staff. Rows are written
 * by logAuditEvent() in audit.service.ts; actor/category/label/description/
 * severity live in the metadata jsonb column.
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, tenantScope, requireAnyPermission } from '../auth/auth.middleware.js';
import { validateQuery } from '../../common/validate.js';
import { paginationSchema, skipTake } from '../../common/pagination.js';
import { prisma } from '../../common/prisma.js';

export const auditLogsRouter = Router();

auditLogsRouter.use(authMiddleware, tenantScope);

const AUDIT_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'] as const;

const listQuerySchema = paginationSchema.extend({
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  severity: z.enum(AUDIT_SEVERITIES).optional(),
  category: z.string().optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

type Metadata = {
  actor?: { id?: string; name?: string; role?: string; ip?: string } | null;
  category?: string;
  label?: string;
  description?: string;
  name?: string;
  severity?: (typeof AUDIT_SEVERITIES)[number];
  changes?: { field: string; old: string; new: string }[];
  sessionId?: string;
  [key: string]: unknown;
};

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: Date;
};

// Row -> the exact shape the staff Audit Trail page consumes.
function toEntry(row: AuditRow) {
  const meta = (row.metadata ?? {}) as Metadata;
  const actor = meta.actor ?? null;
  return {
    id: row.id,
    timestamp: row.createdAt.toISOString(),
    severity: meta.severity ?? 'info',
    user: {
      name: actor?.name ?? 'System',
      role: actor?.role ?? 'system',
      ip: row.ipAddress ?? actor?.ip ?? '-',
    },
    action: {
      type: row.action,
      category: meta.category ?? 'general',
      label: meta.label ?? row.action,
      description: meta.description ?? '',
    },
    resource: {
      type: row.entity,
      id: row.entityId ?? '-',
      name: meta.name ?? row.entityId ?? '-',
    },
    category: meta.category ?? 'general',
    description: meta.description ?? '',
    changes: Array.isArray(meta.changes) ? meta.changes : [],
    sessionId: meta.sessionId ?? row.id.slice(0, 12),
  };
}

function buildWhere(tenantId: string, q: z.infer<typeof listQuerySchema>) {
  const and: Record<string, unknown>[] = [];
  if (q.action) and.push({ action: { contains: q.action, mode: 'insensitive' } });
  if (q.entity) and.push({ entity: { equals: q.entity, mode: 'insensitive' } });
  if (q.entityId) and.push({ entityId: q.entityId });
  if (q.userId) and.push({ userId: q.userId });
  if (q.severity) and.push({ metadata: { path: ['severity'], equals: q.severity } });
  if (q.category) and.push({ metadata: { path: ['category'], equals: q.category } });
  if (q.dateFrom || q.dateTo) {
    and.push({
      createdAt: {
        ...(q.dateFrom ? { gte: new Date(`${q.dateFrom}T00:00:00.000Z`) } : {}),
        ...(q.dateTo ? { lte: new Date(`${q.dateTo}T23:59:59.999Z`) } : {}),
      },
    });
  }
  const where: Record<string, unknown> = { tenantId };
  if (and.length > 0) where.AND = and;
  return where;
}

const READ_PERMS = requireAnyPermission(['audit', 'read'], ['report', 'read']);

// GET /v1/audit-logs - paginated, filterable
auditLogsRouter.get(
  '/',
  READ_PERMS,
  validateQuery(listQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.validatedQuery as z.infer<typeof listQuerySchema>;
      const where = buildWhere(req.tenantId!, q);
      const pageSize = Math.min(q.pageSize, 100);
      const [total, rows] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          ...skipTake({ page: q.page, pageSize }),
        }),
      ]);
      res.json({
        data: rows.map(toEntry),
        meta: { page: q.page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /v1/audit-logs/export - CSV (compliance export; capped at 10k rows)
auditLogsRouter.get(
  '/export',
  READ_PERMS,
  validateQuery(listQuerySchema.omit({ page: true, pageSize: true })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.validatedQuery as z.infer<typeof listQuerySchema>;
      const rows = await prisma.auditLog.findMany({
        where: buildWhere(req.tenantId!, q),
        orderBy: { createdAt: 'desc' },
        take: 10000,
      });
      const esc = (v: unknown) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = [
        'Timestamp',
        'Severity',
        'User',
        'Role',
        'Action',
        'Category',
        'Entity',
        'Entity ID',
        'Description',
        'IP',
        'Session',
      ];
      const lines = rows.map((r) => {
        const e = toEntry(r);
        return [
          e.timestamp,
          e.severity,
          e.user.name,
          e.user.role,
          e.action.type,
          e.category,
          e.resource.type,
          e.resource.id,
          e.description,
          e.user.ip,
          e.sessionId,
        ]
          .map(esc)
          .join(',');
      });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-trail-${new Date().toISOString().slice(0, 10)}.csv"`
      );
      res.send([header.join(','), ...lines].join('\n'));
    } catch (err) {
      next(err);
    }
  }
);
