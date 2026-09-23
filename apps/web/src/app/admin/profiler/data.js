/* apps/web/src/app/admin/profiler/data.js */
export const mockSlowQueries = [
  {
    id: 'sq-1',
    query: 'SELECT * FROM reservations WHERE status = ?',
    durationMs: 2500,
    rowsAffected: 15000,
    source: 'reservations.list',
    userId: 'user-1',
    tenantId: 'tenant-1',
    createdAt: '2026-09-09T10:00:00Z',
    stackTrace: 'at listReservations (reservations.service.ts:45)',
    optimizationSuggestion: 'Add index on status column',
  },
];

export const mockEndpointPerformance = [
  {
    path: '/v1/reservations',
    method: 'GET',
    avgResponseTime: 120,
    p95ResponseTime: 350,
    p99ResponseTime: 800,
    requestCount: 15000,
    errorRate: 0.02,
    lastAccessed: '2026-09-09T10:00:00Z',
  },
];

export const mockDatabaseStats = [
  {
    tableName: 'reservations',
    rowCount: 150000,
    tableSize: '45 MB',
    indexSize: '12 MB',
    lastVacuum: '2026-09-08T00:00:00Z',
    lastAnalyze: '2026-09-08T00:00:00Z',
    bloatRatio: 0.15,
  },
];

/* ─── Impact Metadata ─── */
export const impactMeta = {
  low: {
    label: 'Low',
    dot: 'bg-info',
    class: 'bg-info/10 text-info border-info/20',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  high: {
    label: 'High',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

/* ─── Severity Metadata ─── */
export const severityMeta = {
  low: {
    label: 'Low',
    dot: 'bg-info',
    class: 'bg-info/10 text-info border-info/20',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  high: {
    label: 'High',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

/* ─── Effort Metadata ─── */
export const effortMeta = {
  low: {
    label: 'Low Effort',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  medium: {
    label: 'Medium Effort',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  high: {
    label: 'High Effort',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

/* ─── Recommendation Type Metadata ─── */
export const typeMeta = {
  index: {
    label: 'Index',
    bg: 'bg-secondary/10',
    color: 'text-secondary',
  },
  query: {
    label: 'Query',
    bg: 'bg-info/10',
    color: 'text-info',
  },
  schema: {
    label: 'Schema',
    bg: 'bg-warning/10',
    color: 'text-warning',
  },
  cache: {
    label: 'Cache',
    bg: 'bg-accent/10',
    color: 'text-accent',
  },
};

/* ─── Helpers ─── */
export function formatDuration(ms) {
  if (typeof ms !== 'number' || Number.isNaN(ms) || ms < 0) return '—';
  if (ms < 1) return '0ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toLocaleString('en-US');
}
