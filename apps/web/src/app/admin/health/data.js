/* apps/web/src/app/admin/health/data.js */
export const mockHealthStatus = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  version: '0.0.0',
  uptime: 3600,
  environment: 'development',
  responseTimeMs: 45,
  workers: 5,
  checks: {
    database: { status: 'ok', responseTimeMs: 12 },
    redis: { status: 'ok', responseTimeMs: 5 },
    email: { status: 'ok', responseTimeMs: 200 },
    storage: { status: 'ok', responseTimeMs: 30 },
  },
};

export const mockAlertRules = [
  {
    id: 'rule-1',
    name: 'High CPU',
    description: 'CPU usage above 80%',
    metric: 'cpu_percent',
    operator: 'gt',
    threshold: 80,
    duration: 300,
    severity: 'critical',
    channels: ['email', 'slack'],
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const mockIncidents = [
  {
    id: 'inc-1',
    ruleId: 'rule-1',
    ruleName: 'High CPU',
    severity: 'critical',
    status: 'firing',
    value: 95,
    startedAt: '2026-09-09T10:00:00Z',
    message: 'CPU usage at 95% for 5 minutes',
  },
];
