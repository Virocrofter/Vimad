// Socket emits disabled to break circular dependency: socket.js → auth.service.ts → prisma.js
// TODO: re-enable after socket.js is decoupled from auth.service.ts

function emitToAdmin(_event: string, _payload: unknown): void {
  // no-op
}

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
