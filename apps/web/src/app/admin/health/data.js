/* src/app/admin/health/data.js */

/* ─── System Health Mock Data ─── */

export const systemOverview = {
  status: 'healthy', // healthy, degraded, critical
  uptime: {
    current: '99.97%',
    last7Days: '99.94%',
    last30Days: '99.91%',
    totalHours: 4382,
  },
  lastIncident: {
    date: '2026-08-08 03:14:00',
    description: 'Database connection pool exhausted — auto-recovered in 45s',
    severity: 'warning',
    resolved: true,
  },
};

export const serviceStatus = [
  {
    id: 'svc-api',
    name: 'API Gateway',
    status: 'operational',
    uptime: '99.99%',
    latency: { current: 42, p95: 78, p99: 145 },
    requestsPerMin: 2840,
    errorsPerMin: 2,
    lastRestart: '2026-08-01 02:00:00',
    version: 'v2.4.1',
    region: 'us-east-1',
  },
  {
    id: 'svc-auth',
    name: 'Auth Service',
    status: 'operational',
    uptime: '99.98%',
    latency: { current: 28, p95: 55, p99: 112 },
    requestsPerMin: 1560,
    errorsPerMin: 1,
    lastRestart: '2026-08-01 02:00:00',
    version: 'v1.8.3',
    region: 'us-east-1',
  },
  {
    id: 'svc-db',
    name: 'Primary Database',
    status: 'operational',
    uptime: '99.95%',
    latency: { current: 8, p95: 22, p99: 65 },
    connections: { active: 142, max: 500, pool: 85 },
    diskUsage: { used: 68.4, total: 500, unit: 'GB' },
    lastRestart: '2026-07-28 04:30:00',
    version: 'PostgreSQL 16.3',
    region: 'us-east-1',
  },
  {
    id: 'svc-cache',
    name: 'Redis Cache',
    status: 'operational',
    uptime: '99.99%',
    latency: { current: 2, p95: 5, p99: 12 },
    memoryUsage: { used: 3.2, total: 8, unit: 'GB' },
    hitRate: 94.7,
    evictions: 0,
    lastRestart: '2026-08-10 01:00:00',
    version: 'Redis 7.2',
    region: 'us-east-1',
  },
  {
    id: 'svc-worker',
    name: 'Background Worker',
    status: 'degraded',
    uptime: '98.72%',
    latency: { current: 1250, p95: 3400, p99: 8900 },
    queueDepth: 2847,
    processedPerMin: 45,
    failedPerMin: 12,
    lastRestart: '2026-08-12 09:15:00',
    version: 'v3.1.0',
    region: 'us-east-1',
    alert: 'Queue depth exceeding threshold (>2000)',
  },
  {
    id: 'svc-storage',
    name: 'File Storage (S3)',
    status: 'operational',
    uptime: '99.99%',
    latency: { current: 35, p95: 85, p99: 210 },
    storageUsed: { used: 1.2, total: 10, unit: 'TB' },
    objects: 284500,
    lastRestart: null,
    version: 'AWS S3',
    region: 'us-east-1',
  },
  {
    id: 'svc-search',
    name: 'Search Index',
    status: 'operational',
    uptime: '99.96%',
    latency: { current: 18, p95: 45, p99: 120 },
    indexSize: { used: 12.4, total: 50, unit: 'GB' },
    documents: 1842000,
    lastRestart: '2026-08-05 03:00:00',
    version: 'Elasticsearch 8.14',
    region: 'us-east-1',
  },
  {
    id: 'svc-notify',
    name: 'Notification Service',
    status: 'operational',
    uptime: '99.97%',
    latency: { current: 55, p95: 120, p99: 350 },
    sentPerMin: 890,
    failedPerMin: 3,
    lastRestart: '2026-08-01 02:00:00',
    version: 'v1.5.2',
    region: 'us-east-1',
  },
];

export const errorLogs = [
  {
    id: 'ERR-2026-0816-001',
    timestamp: '2026-08-16 14:18:32',
    service: 'Background Worker',
    severity: 'error',
    message: 'Failed to process payment reconciliation job — timeout after 30s',
    stack: 'at processReconciliation (/app/worker/jobs/payment.js:142)\nat async Worker.run (/app/worker/queue.js:89)',
    count: 12,
    firstSeen: '2026-08-16 13:45:00',
    status: 'open',
    assignedTo: 'DevOps Team',
  },
  {
    id: 'ERR-2026-0816-002',
    timestamp: '2026-08-16 14:15:10',
    service: 'API Gateway',
    severity: 'warning',
    message: 'Rate limit exceeded for tenant T-4821 — throttling applied',
    stack: null,
    count: 1,
    firstSeen: '2026-08-16 14:15:10',
    status: 'auto-resolved',
    assignedTo: null,
  },
  {
    id: 'ERR-2026-0816-003',
    timestamp: '2026-08-16 14:12:45',
    service: 'Primary Database',
    severity: 'warning',
    message: 'Slow query detected (>5s): SELECT * FROM reservations WHERE check_in > $1',
    stack: null,
    count: 3,
    firstSeen: '2026-08-16 14:00:00',
    status: 'investigating',
    assignedTo: 'DBA Team',
  },
  {
    id: 'ERR-2026-0816-004',
    timestamp: '2026-08-16 14:08:22',
    service: 'Auth Service',
    severity: 'error',
    message: 'JWT token validation failed — invalid signature',
    stack: 'at verifyToken (/app/auth/jwt.js:67)\nat async authenticate (/app/auth/middleware.js:23)',
    count: 8,
    firstSeen: '2026-08-16 13:30:00',
    status: 'open',
    assignedTo: 'Security Team',
  },
  {
    id: 'ERR-2026-0816-005',
    timestamp: '2026-08-16 14:05:00',
    service: 'Redis Cache',
    severity: 'info',
    message: 'Cache eviction triggered — memory usage at 85%',
    stack: null,
    count: 1,
    firstSeen: '2026-08-16 14:05:00',
    status: 'auto-resolved',
    assignedTo: null,
  },
  {
    id: 'ERR-2026-0816-006',
    timestamp: '2026-08-16 13:58:15',
    service: 'Notification Service',
    severity: 'warning',
    message: 'Email provider (SendGrid) returned 429 — retrying with backoff',
    stack: null,
    count: 5,
    firstSeen: '2026-08-16 13:50:00',
    status: 'resolved',
    assignedTo: 'Platform Team',
  },
  {
    id: 'ERR-2026-0816-007',
    timestamp: '2026-08-16 13:45:00',
    service: 'Background Worker',
    severity: 'critical',
    message: 'Queue consumer crashed — out of memory (heap limit exceeded)',
    stack: 'at processLargeBatch (/app/worker/batch.js:234)\nat async Consumer.handle (/app/worker/consumer.js:56)',
    count: 2,
    firstSeen: '2026-08-16 13:45:00',
    status: 'open',
    assignedTo: 'DevOps Team',
  },
  {
    id: 'ERR-2026-0816-008',
    timestamp: '2026-08-16 13:30:00',
    service: 'Search Index',
    severity: 'warning',
    message: 'Index shard allocation delayed — node recovery in progress',
    stack: null,
    count: 1,
    firstSeen: '2026-08-16 13:30:00',
    status: 'investigating',
    assignedTo: 'Platform Team',
  },
  {
    id: 'ERR-2026-0815-009',
    timestamp: '2026-08-15 22:14:00',
    service: 'API Gateway',
    severity: 'error',
    message: 'Unhandled exception in webhook handler — null reference',
    stack: 'at handleWebhook (/app/api/webhooks.js:89)\nat async routeHandler (/app/api/routes.js:156)',
    count: 1,
    firstSeen: '2026-08-15 22:14:00',
    status: 'resolved',
    assignedTo: 'Backend Team',
  },
  {
    id: 'ERR-2026-0815-010',
    timestamp: '2026-08-15 18:32:00',
    service: 'Primary Database',
    severity: 'error',
    message: 'Connection pool exhausted — all 500 connections in use',
    stack: 'at acquireConnection (/app/db/pool.js:45)\nat async query (/app/db/client.js:112)',
    count: 1,
    firstSeen: '2026-08-15 18:32:00',
    status: 'resolved',
    assignedTo: 'DBA Team',
  },
];

/* ─── Performance Metrics (last 24h, hourly) ─── */
export const latencyHistory = [
  { hour: '00:00', api: 38, auth: 25, db: 6, cache: 2 },
  { hour: '01:00', api: 32, auth: 22, db: 5, cache: 1 },
  { hour: '02:00', api: 28, auth: 20, db: 5, cache: 1 },
  { hour: '03:00', api: 30, auth: 21, db: 6, cache: 2 },
  { hour: '04:00', api: 35, auth: 24, db: 7, cache: 2 },
  { hour: '05:00', api: 40, auth: 26, db: 8, cache: 2 },
  { hour: '06:00', api: 45, auth: 30, db: 9, cache: 3 },
  { hour: '07:00', api: 55, auth: 35, db: 10, cache: 3 },
  { hour: '08:00', api: 68, auth: 42, db: 12, cache: 4 },
  { hour: '09:00', api: 72, auth: 45, db: 14, cache: 4 },
  { hour: '10:00', api: 65, auth: 40, db: 11, cache: 3 },
  { hour: '11:00', api: 58, auth: 36, db: 10, cache: 3 },
  { hour: '12:00', api: 62, auth: 38, db: 11, cache: 3 },
  { hour: '13:00', api: 70, auth: 44, db: 13, cache: 4 },
  { hour: '14:00', api: 42, auth: 28, db: 8, cache: 2 },
];

export const requestVolume = [
  { hour: '00:00', requests: 1200, errors: 2 },
  { hour: '01:00', requests: 980, errors: 1 },
  { hour: '02:00', requests: 850, errors: 1 },
  { hour: '03:00', requests: 920, errors: 2 },
  { hour: '04:00', requests: 1100, errors: 1 },
  { hour: '05:00', requests: 1400, errors: 3 },
  { hour: '06:00', requests: 1800, errors: 2 },
  { hour: '07:00', requests: 2400, errors: 4 },
  { hour: '08:00', requests: 3200, errors: 6 },
  { hour: '09:00', requests: 3800, errors: 8 },
  { hour: '10:00', requests: 3500, errors: 5 },
  { hour: '11:00', requests: 3100, errors: 4 },
  { hour: '12:00', requests: 3300, errors: 5 },
  { hour: '13:00', requests: 3600, errors: 7 },
  { hour: '14:00', requests: 2840, errors: 2 },
];

export const resourceUsage = [
  { hour: '00:00', cpu: 22, memory: 45, disk: 68 },
  { hour: '01:00', cpu: 18, memory: 42, disk: 68 },
  { hour: '02:00', cpu: 15, memory: 40, disk: 68 },
  { hour: '03:00', cpu: 20, memory: 43, disk: 68 },
  { hour: '04:00', cpu: 25, memory: 46, disk: 68 },
  { hour: '05:00', cpu: 32, memory: 50, disk: 68 },
  { hour: '06:00', cpu: 45, memory: 55, disk: 68 },
  { hour: '07:00', cpu: 58, memory: 62, disk: 68 },
  { hour: '08:00', cpu: 72, memory: 70, disk: 68 },
  { hour: '09:00', cpu: 78, memory: 74, disk: 68 },
  { hour: '10:00', cpu: 65, memory: 68, disk: 68 },
  { hour: '11:00', cpu: 55, memory: 60, disk: 68 },
  { hour: '12:00', cpu: 60, memory: 64, disk: 68 },
  { hour: '13:00', cpu: 70, memory: 72, disk: 68 },
  { hour: '14:00', cpu: 48, memory: 58, disk: 68 },
];

/* ─── Incident History ─── */
export const incidentHistory = [
  {
    id: 'INC-2026-0812',
    date: '2026-08-12 09:15:00',
    title: 'Background Worker Memory Leak',
    severity: 'critical',
    duration: '12 min',
    affectedServices: ['Background Worker'],
    rootCause: 'Memory leak in batch processing loop — unbounded array growth',
    resolution: 'Restarted worker pods, deployed hotfix v3.1.1',
    status: 'resolved',
  },
  {
    id: 'INC-2026-0810',
    date: '2026-08-10 01:00:00',
    title: 'Redis Cache Failover',
    severity: 'warning',
    duration: '3 min',
    affectedServices: ['Redis Cache', 'API Gateway'],
    rootCause: 'Primary Redis node failed — replica promoted automatically',
    resolution: 'Auto-failover successful, replaced failed node',
    status: 'resolved',
  },
  {
    id: 'INC-2026-0808',
    date: '2026-08-08 03:14:00',
    title: 'Database Connection Pool Exhaustion',
    severity: 'warning',
    duration: '45 sec',
    affectedServices: ['Primary Database', 'API Gateway', 'Auth Service'],
    rootCause: 'Connection leak in reservation query — connections not released',
    resolution: 'Killed stale connections, patched connection manager',
    status: 'resolved',
  },
  {
    id: 'INC-2026-0805',
    date: '2026-08-05 03:00:00',
    title: 'Search Index Node Recovery',
    severity: 'info',
    duration: '8 min',
    affectedServices: ['Search Index'],
    rootCause: 'Elasticsearch node restarted during scheduled maintenance',
    resolution: 'Shard reallocation completed, index fully operational',
    status: 'resolved',
  },
  {
    id: 'INC-2026-0801',
    date: '2026-08-01 02:00:00',
    title: 'Scheduled Platform Maintenance',
    severity: 'info',
    duration: '15 min',
    affectedServices: ['API Gateway', 'Auth Service', 'Notification Service'],
    rootCause: 'Planned maintenance window for security patches',
    resolution: 'All services restarted and verified',
    status: 'resolved',
  },
];

/* ─── Metadata ─── */
export const severityMeta = {
  critical: { label: 'Critical', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20', iconColor: 'text-danger' },
  error: { label: 'Error', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20', iconColor: 'text-danger' },
  warning: { label: 'Warning', dot: 'bg-warning', class: 'bg-warning/10 text-warning border-warning/20', iconColor: 'text-warning' },
  info: { label: 'Info', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20', iconColor: 'text-info' },
};

export const serviceStatusMeta = {
  operational: { label: 'Operational', dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20', iconColor: 'text-accent' },
  degraded: { label: 'Degraded', dot: 'bg-warning', class: 'bg-warning/10 text-warning border-warning/20', iconColor: 'text-warning' },
  critical: { label: 'Critical', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20', iconColor: 'text-danger' },
  maintenance: { label: 'Maintenance', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20', iconColor: 'text-info' },
};

export const errorStatusMeta = {
  open: { label: 'Open', class: 'bg-danger/10 text-danger border-danger/20' },
  investigating: { label: 'Investigating', class: 'bg-warning/10 text-warning border-warning/20' },
  resolved: { label: 'Resolved', class: 'bg-accent/10 text-accent border-accent/20' },
  'auto-resolved': { label: 'Auto-Resolved', class: 'bg-info/10 text-info border-info/20' },
};

export const incidentSeverityMeta = {
  critical: { label: 'Critical', class: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger' },
  warning: { label: 'Warning', class: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  info: { label: 'Info', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
};

// ─── Database Metrics ───
export const dbMetrics = {
  connections: {
    active: 142,
    idle: 58,
    max: 500,
    waiting: 3,
    history: [/* hourly data */]
  },
  queryPerformance: {
    avgLatency: 8,      // ms
    p95Latency: 22,
    p99Latency: 65,
    slowQueries: 3,     // >5s
    deadlocks: 0,
  },
  replication: {
    lag: 12,            // ms
    replicaStatus: 'streaming',
    lastCheckpoint: '2026-08-16 14:20:00',
  }
};

// ─── Infrastructure Metrics ───
export const infrastructureMetrics = {
  cpu: {
    overall: 48,
    perCore: [52, 45, 49, 51, 47, 46, 50, 48],
    loadAverage: [0.52, 0.48, 0.45],
  },
  memory: {
    used: 58,           // %
    total: 64,          // GB
    breakdown: {
      app: 28,
      cache: 18,
      system: 8,
      free: 10,
    }
  },
  disk: {
    readIops: 245,
    writeIops: 189,
    readThroughput: 12.5,   // MB/s
    writeThroughput: 8.2,
    utilization: 68,
  },
  network: {
    rxMbps: 45.2,
    txMbps: 38.7,
    packetsDropped: 0,
    errors: 0,
  }
};

// ─── Alert Rules ───
export const alertRules = [
  {
    id: 'rule-001',
    name: 'High CPU Usage',
    metric: 'cpu',
    condition: '>',
    threshold: 80,
    duration: '5m',
    severity: 'warning',
    channels: ['email', 'slack'],
    enabled: true,
  },
  {
    id: 'rule-002',
    name: 'Database Connection Pool Exhaustion',
    metric: 'db_connections',
    condition: '>',
    threshold: 400,
    duration: '1m',
    severity: 'critical',
    channels: ['pagerduty', 'slack'],
    enabled: true,
  },
  // ... more rules
];

/* ─── Helpers ─── */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function timeAgo(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T'));
  const now = new Date('2026-08-16T14:20:00');
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}