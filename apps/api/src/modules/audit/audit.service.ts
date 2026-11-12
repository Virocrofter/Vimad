/* apps/api/src/modules/audit/audit.service.ts */
import { prisma } from '../../common/prisma.js';
import { logger } from '../../common/logger.js';
import { broadcastAuditEvent } from './audit.events.js';
import type { AuthenticatedRequest } from '../auth/auth.middleware.js';

type Actor = {
  id: string;
  name: string;
  role: string;
  ip: string;
};

export async function logAuditEvent(params: {
  req?: Pick<AuthenticatedRequest, 'auth' | 'ip'>;
  tenantId: string;
  action: string;
  category: string;
  label: string;
  description: string;
  entityType: string;
  entityId: string;
  propertyId?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  metadata?: Record<string, unknown>;
}) {
  const {
    req,
    tenantId,
    action,
    category,
    label,
    description,
    entityType,
    entityId,
    propertyId,
    severity = 'info',
    metadata,
  } = params;

  // Build actor from request if available
  let actor: Actor | undefined;
  if (req?.auth?.user) {
    actor = {
      id: req.auth.user.id,
      name:
        `${req.auth.user.firstName ?? ''} ${req.auth.user.lastName ?? ''}`.trim() ||
        req.auth.user.email,
      role: req.auth.user.role,
      ip: req.ip ?? 'unknown',
    };
  }

  // Persist to database
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: actor?.id,
        action,
        entity: entityType,
        entityId,
        propertyId: propertyId ?? (metadata?.propertyId as string) ?? null,
        metadata: {
          ...metadata,
          actor: actor ?? null,
          category,
          label,
          description,
        },
        ipAddress: actor?.ip,
        userAgent: undefined, // available on req if needed
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to persist audit log');
  }

  // Broadcast to admin sockets in real-time
  broadcastAuditEvent({
    id: `${tenantId}-${entityType}-${entityId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: actor ?? { id: 'system', name: 'System', role: 'system', ip: 'internal' },
    action: { type: action, category, label, description },
    target: {
      type: entityType,
      id: entityId,
      name: (metadata?.name as string) ?? entityId,
      tenantId,
    },
    severity,
    metadata,
  });
}
