/* apps/api/src/modules/audit/audit.events.ts
 * Emits are live again — socket.js no longer depends on auth.service.ts
 * (see common/socket-auth.ts). Every audited mutation funnels through
 * logAuditEvent() → broadcastAuditEvent(), so `ops:mutation` is the single
 * tenant-scoped event the whole ops UI can subscribe to for live refreshes.
 */
import { emitToAdmin, emitToTenant } from '../../common/socket.js';

export interface AuditEventPayload {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    role: string;
    ip: string;
  };
  action: {
    type: string;
    category: string;
    label: string;
    description: string;
  };
  target: {
    type: string;
    id: string;
    name: string;
    tenantId?: string;
  };
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  metadata?: Record<string, unknown>;
}

export function broadcastAuditEvent(payload: AuditEventPayload): void {
  emitToAdmin('audit:stream', {
    ...payload,
    receivedAt: new Date().toISOString(),
  });

  // Tenant-scoped live pulse — dashboards/boards refetch on this.
  if (payload.target.tenantId) {
    emitToTenant(payload.target.tenantId, 'ops:mutation', {
      action: payload.action.type,
      entity: payload.target.type,
      entityId: payload.target.id,
      severity: payload.severity,
      at: new Date().toISOString(),
    });
  }

  if (payload.severity === 'critical' || payload.severity === 'high') {
    emitToAdmin('audit:critical', payload);
  }
}

export function broadcastAnomalyDetected(anomaly: {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  confidence: number;
  affectedTargets: string[];
}): void {
  emitToAdmin('audit:anomaly', {
    ...anomaly,
    detectedAt: new Date().toISOString(),
  });
}
