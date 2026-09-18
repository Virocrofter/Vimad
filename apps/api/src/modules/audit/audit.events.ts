import { emitToAdmin } from '../../common/socket.js';
import { logger } from '../../common/logger.js';

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

  // Also emit critical events to a dedicated critical channel
  if (payload.severity === 'critical' || payload.severity === 'high') {
    emitToAdmin('audit:critical', payload);
  }

  logger.debug({ auditId: payload.id, severity: payload.severity }, 'audit event streamed');
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
