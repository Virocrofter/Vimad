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

/* ─── Service Status Metadata ─── */
export const serviceStatusMeta = {
  operational: {
    label: 'Operational',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
    iconColor: 'text-accent',
  },
  degraded: {
    label: 'Degraded',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
    iconColor: 'text-warning',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
    iconColor: 'text-danger',
  },
  maintenance: {
    label: 'Maintenance',
    dot: 'bg-info',
    class: 'bg-info/10 text-info border-info/20',
    iconColor: 'text-info',
  },
};

/* ─── Error Severity Metadata ─── */
export const severityMeta = {
  info: {
    label: 'Info',
    dot: 'bg-info',
    class: 'bg-info/10 text-info border-info/20',
  },
  warning: {
    label: 'Warning',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  error: {
    label: 'Error',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

/* ─── Error Status Metadata ─── */
export const errorStatusMeta = {
  open: {
    label: 'Open',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
  investigating: {
    label: 'Investigating',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  resolved: {
    label: 'Resolved',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
};

/* ─── Incident Severity Metadata ─── */
export const incidentSeverityMeta = {
  info: {
    label: 'Info',
    dot: 'bg-info',
    class: 'bg-info/10 text-info border-info/20',
  },
  minor: {
    label: 'Minor',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  major: {
    label: 'Major',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

/* ─── Helpers ─── */
export function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '—';
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
