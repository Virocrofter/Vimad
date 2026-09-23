/* src/app/admin/reports/data.js */

/* ─── Compliance Rules ─── */
export const complianceRules = [
  {
    id: 'RULE-001',
    name: 'GDPR Data Retention',
    framework: 'gdpr',
    description:
      'Personal data must not be retained longer than necessary for the purposes for which it was collected.',
    severity: 'critical',
    category: 'data_retention',
    check: 'retention_policy',
    autoFix: false,
    remediation: 'Implement automated data purging after retention period expires.',
  },
  {
    id: 'RULE-002',
    name: 'PCI-DSS Encryption at Rest',
    framework: 'pci-dss',
    description: 'Cardholder data must be encrypted when stored.',
    severity: 'critical',
    category: 'encryption',
    check: 'encryption_at_rest',
    autoFix: false,
    remediation: 'Enable AES-256 encryption for all storage containing cardholder data.',
  },
  {
    id: 'RULE-003',
    name: 'SOC 2 Access Controls',
    framework: 'soc2',
    description: 'Logical access to systems must be restricted to authorized users.',
    severity: 'high',
    category: 'access_control',
    check: 'access_review',
    autoFix: true,
    remediation: 'Enforce MFA and quarterly access reviews.',
  },
  {
    id: 'RULE-004',
    name: 'HIPAA Audit Logging',
    framework: 'hipaa',
    description: 'All access to ePHI must be logged with user identification and timestamp.',
    severity: 'critical',
    category: 'audit',
    check: 'audit_log_completeness',
    autoFix: false,
    remediation: 'Ensure all ePHI access events are captured in tamper-proof audit logs.',
  },
  {
    id: 'RULE-005',
    name: 'ISO 27001 Backup Policy',
    framework: 'iso27001',
    description: 'Backup copies of information and software shall be taken regularly.',
    severity: 'high',
    category: 'backup',
    check: 'backup_frequency',
    autoFix: true,
    remediation: 'Schedule daily automated backups with off-site replication.',
  },
  {
    id: 'RULE-006',
    name: 'SOX Change Management',
    framework: 'sox',
    description: 'Changes to financial systems must be documented and approved.',
    severity: 'high',
    category: 'change_management',
    check: 'change_approval',
    autoFix: false,
    remediation: 'Require dual approval for all production changes affecting financial data.',
  },
];

/* ─── Compliance Frameworks ─── */
export const complianceFrameworks = [
  {
    id: 'gdpr',
    label: 'GDPR',
    description: 'General Data Protection Regulation (EU)',
    region: 'EU',
    color: '#3b82f6',
  },
  {
    id: 'hipaa',
    label: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act (US)',
    region: 'US',
    color: '#22c55e',
  },
  {
    id: 'pci-dss',
    label: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    region: 'Global',
    color: '#f59e0b',
  },
  { id: 'sox', label: 'SOX', description: 'Sarbanes-Oxley Act', region: 'US', color: '#863bff' },
  {
    id: 'iso27001',
    label: 'ISO 27001',
    description: 'Information Security Management',
    region: 'Global',
    color: '#ef4444',
  },
  {
    id: 'soc2',
    label: 'SOC 2',
    description: 'Service Organization Control 2',
    region: 'US',
    color: '#06b6d4',
  },
];

/* ─── Mock Compliance Reports ─── */
export const complianceReports = [
  {
    id: 'RPT-2026-0816-001',
    title: 'Q3 2026 GDPR Compliance Report',
    framework: 'gdpr',
    status: 'complete',
    period: '2026-07-01 to 2026-09-30',
    generatedAt: '2026-08-16 12:00:00',
    generatedBy: 'System',
    recordCount: 1247,
    description:
      'Comprehensive GDPR compliance assessment covering data retention, subject rights, and cross-border transfers.',
    downloadUrl: '#',
  },
  {
    id: 'RPT-2026-0816-002',
    title: 'August 2026 PCI-DSS Assessment',
    framework: 'pci-dss',
    status: 'complete',
    period: '2026-08-01 to 2026-08-16',
    generatedAt: '2026-08-16 12:00:00',
    generatedBy: 'System',
    recordCount: 89,
    description: 'Monthly PCI-DSS compliance scan for cardholder data environment.',
    downloadUrl: '#',
  },
  {
    id: 'RPT-2026-0801-001',
    title: 'H1 2026 ISO 27001 Internal Audit',
    framework: 'iso27001',
    status: 'complete',
    period: '2026-01-01 to 2026-06-30',
    generatedAt: '2026-08-01 00:00:00',
    generatedBy: 'Alex Morgan',
    recordCount: 3847,
    description:
      'Semi-annual internal audit covering all ISO 27001 controls and Annex A requirements.',
    downloadUrl: '#',
  },
  {
    id: 'RPT-2026-0816-003',
    title: 'SOC 2 Type II Evidence Collection',
    framework: 'soc2',
    status: 'generating',
    period: '2026-05-01 to 2026-08-16',
    generatedAt: null,
    generatedBy: 'System',
    recordCount: 0,
    description: 'Automated evidence collection for SOC 2 Type II audit period.',
    downloadUrl: null,
  },
];

/* ─── Mock Regions ─── */
export const regions = [
  {
    id: 'REG-001',
    name: 'US East (N. Virginia)',
    code: 'us-east-1',
    location: 'Ashburn, VA, USA',
    status: 'active',
    tenantCount: 89,
    serverCount: 24,
    latencyMs: 28,
    uptimePct: 99.99,
    latencyHistory: [32, 30, 29, 31, 28, 27, 28, 26, 28, 29, 28, 27],
  },
  {
    id: 'REG-002',
    name: 'US West (Oregon)',
    code: 'us-west-2',
    location: 'Portland, OR, USA',
    status: 'active',
    tenantCount: 34,
    serverCount: 12,
    latencyMs: 45,
    uptimePct: 99.97,
    latencyHistory: [48, 46, 47, 45, 44, 45, 46, 45, 44, 43, 45, 45],
  },
  {
    id: 'REG-003',
    name: 'EU West (Ireland)',
    code: 'eu-west-1',
    location: 'Dublin, Ireland',
    status: 'active',
    tenantCount: 56,
    serverCount: 18,
    latencyMs: 62,
    uptimePct: 99.95,
    latencyHistory: [65, 64, 63, 62, 61, 62, 63, 62, 61, 60, 62, 62],
  },
  {
    id: 'REG-004',
    name: 'AP Southeast (Singapore)',
    code: 'ap-southeast-1',
    location: 'Singapore',
    status: 'maintenance',
    tenantCount: 12,
    serverCount: 6,
    latencyMs: 118,
    uptimePct: 99.82,
    latencyHistory: [120, 119, 118, 117, 118, 119, 118, 117, 118, 118, 119, 118],
  },
];

/* ─── Mock Migration Jobs ─── */
export const migrationJobs = [
  {
    id: 'MIG-2026-0816-001',
    name: 'Tenant Data Migration: EU-West',
    type: 'tenant_relocation',
    sourceRegion: 'us-east-1',
    targetRegion: 'eu-west-1',
    status: 'completed',
    progress: 100,
    recordsProcessed: 2847392,
    recordsTotal: 2847392,
    startedAt: '2026-08-15 02:00:00',
    duration: '4h 32m',
    errorMessage: null,
  },
  {
    id: 'MIG-2026-0816-002',
    name: 'Database Sharding: US-East',
    type: 'db_shard_split',
    sourceRegion: 'us-east-1',
    targetRegion: 'us-east-1',
    status: 'running',
    progress: 67,
    recordsProcessed: 1907845,
    recordsTotal: 2847392,
    startedAt: '2026-08-16 01:00:00',
    duration: '2h 15m (running)',
    errorMessage: null,
  },
  {
    id: 'MIG-2026-0815-001',
    name: 'Archive Cold Storage: 2025 Data',
    type: 'archive_migration',
    sourceRegion: 'us-east-1',
    targetRegion: 's3-glacier',
    status: 'failed',
    progress: 34,
    recordsProcessed: 45200,
    recordsTotal: 132800,
    startedAt: '2026-08-15 03:00:00',
    duration: '1h 12m',
    errorMessage: 'Connection timeout to S3 Glacier endpoint. Retry scheduled.',
  },
  {
    id: 'MIG-2026-0817-001',
    name: 'Redis Cache Warmup: US-West',
    type: 'cache_warmup',
    sourceRegion: 'us-east-1',
    targetRegion: 'us-west-2',
    status: 'pending',
    progress: 0,
    recordsProcessed: 0,
    recordsTotal: 500000,
    startedAt: null,
    duration: null,
    errorMessage: null,
  },
];

/* ─── Mock Report Schedules ─── */
export const reportSchedules = [
  {
    id: 'SCH-RPT-001',
    name: 'Weekly Security Summary',
    enabled: true,
    frequency: 'weekly',
    format: 'pdf',
    framework: 'iso27001',
    reportType: 'security_summary',
    recipients: ['security@vimad.io', 'cto@vimad.io'],
    nextRun: '2026-08-18 09:00:00',
    lastRun: '2026-08-11 09:00:00',
  },
  {
    id: 'SCH-RPT-002',
    name: 'Monthly Compliance Dashboard',
    enabled: true,
    frequency: 'monthly',
    format: 'xlsx',
    framework: 'all',
    reportType: 'compliance_dashboard',
    recipients: ['compliance@vimad.io'],
    nextRun: '2026-09-01 00:00:00',
    lastRun: '2026-08-01 00:00:00',
  },
  {
    id: 'SCH-RPT-003',
    name: 'Daily Audit Log Export',
    enabled: false,
    frequency: 'daily',
    format: 'csv',
    framework: 'soc2',
    reportType: 'audit_export',
    recipients: ['audit@vimad.io'],
    nextRun: null,
    lastRun: '2026-08-10 00:00:00',
  },
];

/* ─── Report Builder catalogues (static config for the builder UI) ─── */
export const reportTemplates = [
  {
    key: 'blank',
    label: 'Start from Scratch',
    description: 'Build a custom report with your own widgets',
    category: 'custom',
  },
  {
    key: 'revenue-dashboard',
    label: 'Revenue Dashboard',
    description: 'MRR, churn, and revenue trends',
    category: 'revenue',
  },
  {
    key: 'tenant-overview',
    label: 'Tenant Overview',
    description: 'Tenant counts, plans, and growth',
    category: 'operations',
  },
  {
    key: 'usage-analytics',
    label: 'Usage Analytics',
    description: 'API usage, storage, and activity',
    category: 'performance',
  },
  {
    key: 'health-monitor',
    label: 'System Health Monitor',
    description: 'Latency, uptime, and incident trends',
    category: 'infrastructure',
  },
  {
    key: 'support-metrics',
    label: 'Support Metrics',
    description: 'Tickets, response times, and CSAT',
    category: 'support',
  },
];

export const chartTypes = [
  { key: 'bar', label: 'Bar Chart', category: 'comparison' },
  { key: 'line', label: 'Line Chart', category: 'trend' },
  { key: 'area', label: 'Area Chart', category: 'trend' },
  { key: 'pie', label: 'Pie Chart', category: 'distribution' },
  { key: 'combo', label: 'Combo Chart', category: 'mixed' },
  { key: 'scatter', label: 'Scatter Plot', category: 'correlation' },
  { key: 'table', label: 'Data Table', category: 'tabular' },
];

export const dataSources = [
  {
    key: 'revenue',
    label: 'Revenue & Billing',
    fields: [
      { key: 'month', label: 'Month', type: 'string' },
      { key: 'mrr', label: 'MRR', type: 'currency' },
      { key: 'expansion', label: 'Expansion', type: 'currency' },
      { key: 'contraction', label: 'Contraction', type: 'currency' },
      { key: 'churned', label: 'Churned MRR', type: 'currency' },
      { key: 'netNew', label: 'Net New MRR', type: 'currency' },
    ],
  },
  {
    key: 'tenants',
    label: 'Tenants',
    fields: [
      { key: 'month', label: 'Month', type: 'string' },
      { key: 'totalTenants', label: 'Total Tenants', type: 'number' },
      { key: 'newTenants', label: 'New Tenants', type: 'number' },
      { key: 'churnedTenants', label: 'Churned Tenants', type: 'number' },
      { key: 'activeUsers', label: 'Active Users', type: 'number' },
    ],
  },
  {
    key: 'usage',
    label: 'Usage & Activity',
    fields: [
      { key: 'month', label: 'Month', type: 'string' },
      { key: 'apiCalls', label: 'API Calls', type: 'number' },
      { key: 'storageGB', label: 'Storage (GB)', type: 'number' },
      { key: 'activeUsers', label: 'Active Users', type: 'number' },
      { key: 'utilization', label: 'Utilization', type: 'percent' },
    ],
  },
  {
    key: 'health',
    label: 'System Health',
    fields: [
      { key: 'month', label: 'Month', type: 'string' },
      { key: 'uptime', label: 'Uptime %', type: 'percent' },
      { key: 'avgLatencyMs', label: 'Avg Latency (ms)', type: 'number' },
      { key: 'incidents', label: 'Incidents', type: 'number' },
      { key: 'errorRate', label: 'Error Rate', type: 'percent' },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    fields: [
      { key: 'month', label: 'Month', type: 'string' },
      { key: 'ticketsOpened', label: 'Tickets Opened', type: 'number' },
      { key: 'ticketsResolved', label: 'Tickets Resolved', type: 'number' },
      { key: 'avgResponseHours', label: 'Avg Response (hrs)', type: 'number' },
      { key: 'csat', label: 'CSAT', type: 'percent' },
    ],
  },
];

export const aggregations = [
  { key: 'sum', label: 'Sum' },
  { key: 'avg', label: 'Average' },
  { key: 'min', label: 'Min' },
  { key: 'max', label: 'Max' },
  { key: 'count', label: 'Count' },
];

export const timeGranularities = [
  { key: 'hour', label: 'Hourly' },
  { key: 'day', label: 'Daily' },
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'quarter', label: 'Quarterly' },
  { key: 'year', label: 'Yearly' },
];

/* Preview sample rows for the report builder chart preview (client-side only). */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const mockChartData = {
  revenue: MONTHS.map((month, i) => ({
    month,
    mrr: 42000 + i * 1800,
    expansion: 2400 + i * 150,
    contraction: 800 + i * 60,
    churned: 1200 + i * 90,
    netNew: 3800 + i * 200,
  })),
  tenants: MONTHS.map((month, i) => ({
    month,
    totalTenants: 120 + i * 4,
    newTenants: 6 + (i % 4),
    churnedTenants: 2 + (i % 3),
    activeUsers: 840 + i * 45,
  })),
  usage: MONTHS.map((month, i) => ({
    month,
    apiCalls: 1_200_000 + i * 80_000,
    storageGB: 420 + i * 28,
    activeUsers: 760 + i * 38,
    utilization: 42 + i * 1.6,
  })),
  health: MONTHS.map((month, i) => ({
    month,
    uptime: 99.5 + (i % 3) * 0.15,
    avgLatencyMs: 120 - i * 3.5,
    incidents: 4 - (i % 3),
    errorRate: 1.8 - i * 0.08,
  })),
  support: MONTHS.map((month, i) => ({
    month,
    ticketsOpened: 140 + i * 6,
    ticketsResolved: 136 + i * 6,
    avgResponseHours: 6.5 - i * 0.18,
    csat: 88 + i * 0.7,
  })),
};

export function getDataSourceFields(dataSourceKey) {
  const source = dataSources.find((s) => s.key === dataSourceKey);
  return source ? source.fields : [];
}

export function getApplicableAggregations(/* fieldType */) {
  return aggregations;
}

/* ─── Latency History (24h sample data) ─── */
export const latencyHistory = [
  { timestamp: '00:00', usEast: 32, usWest: 48, euWest: 65, apSouth: 120 },
  { timestamp: '01:00', usEast: 30, usWest: 46, euWest: 64, apSouth: 119 },
  { timestamp: '02:00', usEast: 29, usWest: 47, euWest: 63, apSouth: 118 },
  { timestamp: '03:00', usEast: 31, usWest: 45, euWest: 62, apSouth: 117 },
  { timestamp: '04:00', usEast: 28, usWest: 44, euWest: 61, apSouth: 118 },
  { timestamp: '05:00', usEast: 27, usWest: 45, euWest: 62, apSouth: 119 },
  { timestamp: '06:00', usEast: 28, usWest: 46, euWest: 63, apSouth: 118 },
  { timestamp: '07:00', usEast: 26, usWest: 45, euWest: 62, apSouth: 117 },
  { timestamp: '08:00', usEast: 28, usWest: 44, euWest: 61, apSouth: 118 },
  { timestamp: '09:00', usEast: 29, usWest: 45, euWest: 60, apSouth: 118 },
  { timestamp: '10:00', usEast: 28, usWest: 43, euWest: 61, apSouth: 119 },
  { timestamp: '11:00', usEast: 27, usWest: 45, euWest: 62, apSouth: 118 },
  { timestamp: '12:00', usEast: 28, usWest: 45, euWest: 62, apSouth: 117 },
  { timestamp: '13:00', usEast: 29, usWest: 44, euWest: 61, apSouth: 118 },
  { timestamp: '14:00', usEast: 30, usWest: 46, euWest: 62, apSouth: 119 },
  { timestamp: '15:00', usEast: 28, usWest: 45, euWest: 63, apSouth: 118 },
  { timestamp: '16:00', usEast: 27, usWest: 44, euWest: 62, apSouth: 117 },
  { timestamp: '17:00', usEast: 28, usWest: 45, euWest: 61, apSouth: 118 },
  { timestamp: '18:00', usEast: 29, usWest: 46, euWest: 60, apSouth: 119 },
  { timestamp: '19:00', usEast: 28, usWest: 45, euWest: 61, apSouth: 118 },
  { timestamp: '20:00', usEast: 27, usWest: 44, euWest: 62, apSouth: 117 },
  { timestamp: '21:00', usEast: 28, usWest: 45, euWest: 63, apSouth: 118 },
  { timestamp: '22:00', usEast: 29, usWest: 46, euWest: 62, apSouth: 119 },
  { timestamp: '23:00', usEast: 28, usWest: 45, euWest: 61, apSouth: 118 },
];

/* ─── Helpers ─── */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.replace(' ', 'T'));
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr.replace(' ', 'T'));
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function getFrameworkColor(id) {
  const fw = complianceFrameworks.find((f) => f.id === id);
  return fw?.color || '#6b7280';
}

export function getFrameworkLabel(id) {
  const fw = complianceFrameworks.find((f) => f.id === id);
  return fw?.label || id;
}

export function getSeverityMeta(severity) {
  const map = {
    critical: {
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      dot: 'bg-rose-500',
      label: 'Critical',
    },
    high: {
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      dot: 'bg-amber-500',
      label: 'High',
    },
    medium: {
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      dot: 'bg-blue-500',
      label: 'Medium',
    },
    low: {
      color: 'text-text-muted',
      bg: 'bg-neutral/10',
      border: 'border-border',
      dot: 'bg-text-muted',
      label: 'Low',
    },
  };
  return map[severity] || map.low;
}

export function getStatusMeta(status) {
  const map = {
    complete: {
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-500',
      label: 'Complete',
    },
    pending: {
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      dot: 'bg-amber-500',
      label: 'Pending',
    },
    running: {
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      dot: 'bg-blue-500',
      label: 'Running',
    },
    failed: {
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      dot: 'bg-rose-500',
      label: 'Failed',
    },
    generating: {
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      dot: 'bg-blue-500',
      label: 'Generating',
    },
  };
  return map[status] || map.pending;
}

/* ─── Export Formats ─── */
export const exportFormats = [
  { id: 'pdf', label: 'PDF', ext: '.pdf', mime: 'application/pdf', icon: 'FileText' },
  { id: 'csv', label: 'CSV', ext: '.csv', mime: 'text/csv', icon: 'FileSpreadsheet' },
  {
    id: 'xlsx',
    label: 'Excel',
    ext: '.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icon: 'FileSpreadsheet',
  },
  { id: 'json', label: 'JSON', ext: '.json', mime: 'application/json', icon: 'FileJson' },
];

/* ─── Schedule Frequencies ─── */
export const scheduleFrequencies = [
  { id: 'hourly', label: 'Hourly', description: 'Every hour on the hour' },
  { id: 'daily', label: 'Daily', description: 'Once per day at specified time' },
  { id: 'weekly', label: 'Weekly', description: 'Once per week on specified day' },
  { id: 'biweekly', label: 'Bi-weekly', description: 'Every two weeks' },
  { id: 'monthly', label: 'Monthly', description: 'Once per month on specified date' },
  { id: 'quarterly', label: 'Quarterly', description: 'Every three months' },
];

/* ─── Compliance Status Meta ─── */
export const complianceStatusMeta = {
  compliant: {
    label: 'Compliant',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  'non-compliant': {
    label: 'Non-Compliant',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    dot: 'bg-rose-500',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
  },
  'not-applicable': {
    label: 'Not Applicable',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
  'partially-compliant': {
    label: 'Partially Compliant',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
};

/* ─── Get Region Name by Code ─── */
export function getRegionName(code) {
  const regionMap = {
    'us-east-1': 'US East (N. Virginia)',
    'us-east-2': 'US East (Ohio)',
    'us-west-1': 'US West (N. California)',
    'us-west-2': 'US West (Oregon)',
    'eu-west-1': 'EU West (Ireland)',
    'eu-west-2': 'EU West (London)',
    'eu-west-3': 'EU West (Paris)',
    'eu-central-1': 'EU Central (Frankfurt)',
    'ap-southeast-1': 'AP Southeast (Singapore)',
    'ap-southeast-2': 'AP Southeast (Sydney)',
    'ap-northeast-1': 'AP Northeast (Tokyo)',
    'ap-south-1': 'AP South (Mumbai)',
    'sa-east-1': 'South America (São Paulo)',
    'ca-central-1': 'Canada (Central)',
    'af-south-1': 'Africa (Cape Town)',
    'me-south-1': 'Middle East (Bahrain)',
  };
  return regionMap[code] || code;
}

/* ─── Migration Status Meta ─── */
export const migrationStatusMeta = {
  pending: {
    label: 'Pending',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
  running: {
    label: 'Running',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    dot: 'bg-rose-500',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
};

/* ─── Region Status Meta ─── */
export const regionStatusMeta = {
  active: {
    label: 'Active',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  deploying: {
    label: 'Deploying',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
  degraded: {
    label: 'Degraded',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    dot: 'bg-rose-500',
  },
  offline: {
    label: 'Offline',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
};

/* ─── Region Tenants (cross-region tenant distribution) ─── */
export const regionTenants = [
  {
    regionId: 'REG-001',
    regionCode: 'us-east-1',
    tenantCount: 89,
    activeUsers: 2840,
    dataVolumeGb: 124.2,
  },
  {
    regionId: 'REG-002',
    regionCode: 'us-west-2',
    tenantCount: 34,
    activeUsers: 920,
    dataVolumeGb: 42.8,
  },
  {
    regionId: 'REG-003',
    regionCode: 'eu-west-1',
    tenantCount: 56,
    activeUsers: 1680,
    dataVolumeGb: 68.4,
  },
  {
    regionId: 'REG-004',
    regionCode: 'ap-southeast-1',
    tenantCount: 12,
    activeUsers: 340,
    dataVolumeGb: 15.6,
  },
];
