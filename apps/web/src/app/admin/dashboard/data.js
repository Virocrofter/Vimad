/* src/app/admin/dashboard/data.js */

export const kpiData = {
  totalTenants: {
    value: 2847,
    change: +12.4,
    changeLabel: 'vs last month',
    trend: [2100, 2150, 2230, 2310, 2380, 2450, 2520, 2600, 2680, 2750, 2800, 2847],
  },
  mrr: {
    value: 142650,
    change: +8.7,
    changeLabel: 'vs last month',
    trend: [
      98000, 102000, 108000, 112000, 118000, 122000, 126000, 130000, 134000, 138000, 140000, 142650,
    ],
  },
  churnRate: {
    value: 2.3,
    change: -0.4,
    changeLabel: 'vs last month',
    isInverse: true,
    trend: [3.8, 3.5, 3.2, 3.0, 2.9, 2.8, 2.7, 2.6, 2.5, 2.4, 2.35, 2.3],
  },
  activeUsers: {
    value: 18420,
    change: +15.2,
    changeLabel: 'vs last month',
    trend: [12000, 12500, 13100, 13800, 14300, 14800, 15300, 15900, 16500, 17200, 17800, 18420],
  },
};

export const systemHealth = {
  status: 'healthy', // healthy | degraded | critical
  uptime: '99.97%',
  lastIncident: '2026-08-08 03:14',
  services: [
    { name: 'API Gateway', status: 'operational', latency: '42ms' },
    { name: 'Auth Service', status: 'operational', latency: '28ms' },
    { name: 'Primary DB', status: 'operational', latency: '8ms' },
    { name: 'Redis Cache', status: 'operational', latency: '2ms' },
    { name: 'Worker Queue', status: 'degraded', latency: '1250ms' },
    { name: 'File Storage', status: 'operational', latency: '35ms' },
  ],
};

export const recentAlerts = [
  {
    id: 'ALT-001',
    severity: 'warning',
    title: 'Worker queue depth exceeding threshold',
    message: 'Background worker queue depth reached 2,847 jobs (>2,000 threshold)',
    service: 'Worker Queue',
    timestamp: '2026-08-16 14:32:00',
    acknowledged: false,
  },
  {
    id: 'ALT-002',
    severity: 'info',
    title: 'Tenant TNT-003 trial expiring soon',
    message: 'Mountain Lodge Aspen trial expires in 2 days. Onboarding call scheduled.',
    service: 'Billing',
    timestamp: '2026-08-16 12:15:00',
    acknowledged: false,
  },
  {
    id: 'ALT-003',
    severity: 'error',
    title: 'Payment reconciliation job failed',
    message: 'Failed to process payment reconciliation job — timeout after 30s',
    service: 'Background Worker',
    timestamp: '2026-08-16 14:18:00',
    acknowledged: true,
  },
  {
    id: 'ALT-004',
    severity: 'warning',
    title: 'Rate limit exceeded for tenant T-4821',
    message: 'Throttling applied to tenant T-4821 after exceeding 10k req/min',
    service: 'API Gateway',
    timestamp: '2026-08-16 14:15:00',
    acknowledged: true,
  },
  {
    id: 'ALT-005',
    severity: 'info',
    title: 'New Enterprise tenant signup',
    message: 'Lakeside Resort Tahoe (TNT-006) completed contract signing',
    service: 'Onboarding',
    timestamp: '2026-08-16 11:00:00',
    acknowledged: false,
  },
  {
    id: 'ALT-006',
    severity: 'critical',
    title: 'Queue consumer crashed — OOM',
    message: 'Queue consumer crashed due to heap limit exceeded in batch processing',
    service: 'Background Worker',
    timestamp: '2026-08-16 13:45:00',
    acknowledged: true,
  },
];

export const quickActions = [
  {
    id: 'new-tenant',
    label: 'Create Tenant',
    icon: 'Building2',
    description: 'Onboard a new property',
    color: 'secondary',
  },
  {
    id: 'feature-flag',
    label: 'Feature Flag',
    icon: 'ToggleLeft',
    description: 'Toggle platform features',
    color: 'accent',
  },
  {
    id: 'announcement',
    label: 'Announcement',
    icon: 'Megaphone',
    description: 'Send global notification',
    color: 'info',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: 'Wrench',
    description: 'Schedule downtime window',
    color: 'warning',
  },
  {
    id: 'audit-log',
    label: 'Audit Log',
    icon: 'ScrollText',
    description: 'View recent admin actions',
    color: 'neutral',
  },
  {
    id: 'export',
    label: 'Export Data',
    icon: 'Download',
    description: 'Download tenant reports',
    color: 'secondary',
  },
];

export const tenantActivity = [
  {
    id: 'ACT-001',
    tenant: 'Grand Hotel Boston',
    action: 'Plan upgraded',
    detail: 'Starter → Professional',
    user: 'Robert Chen',
    time: '2 min ago',
    type: 'upgrade',
  },
  {
    id: 'ACT-002',
    tenant: 'Seaside Resort Miami',
    action: 'New reservation',
    detail: 'Booking #4023 confirmed via booking engine',
    user: 'Maria Garcia',
    time: '5 min ago',
    type: 'booking',
  },
  {
    id: 'ACT-003',
    tenant: 'Mountain Lodge Aspen',
    action: 'User invited',
    detail: 'Front desk staff added (2 users)',
    user: 'James Miller',
    time: '12 min ago',
    type: 'user',
  },
  {
    id: 'ACT-004',
    tenant: 'Urban Hotel NYC',
    action: 'API key rotated',
    detail: 'Production API key regenerated',
    user: 'Kevin Lee',
    time: '18 min ago',
    type: 'security',
  },
  {
    id: 'ACT-005',
    tenant: 'Coastal Inn San Diego',
    action: 'Rate updated',
    detail: 'Deluxe King rate changed to $219',
    user: 'David Park',
    time: '25 min ago',
    type: 'rate',
  },
  {
    id: 'ACT-006',
    tenant: 'Downtown Suites Chicago',
    action: 'Payment failed',
    detail: 'Auto-retry #3 failed — card expired',
    user: 'System',
    time: '32 min ago',
    type: 'billing',
  },
  {
    id: 'ACT-007',
    tenant: 'Grand Hotel Boston',
    action: 'Channel sync',
    detail: 'Synced 142 rooms across 6 channels',
    user: 'System',
    time: '45 min ago',
    type: 'sync',
  },
];

export const planDistribution = [
  { plan: 'Starter', count: 1842, percentage: 64.7, color: '#3b82f6' },
  { plan: 'Professional', count: 756, percentage: 26.6, color: '#863bff' },
  { plan: 'Enterprise', count: 249, percentage: 8.7, color: '#10b981' },
];

export const regionDistribution = [
  { region: 'US East', count: 1240, percentage: 43.6 },
  { region: 'US West', count: 680, percentage: 23.9 },
  { region: 'US Central', count: 420, percentage: 14.7 },
  { region: 'EU West', count: 310, percentage: 10.9 },
  { region: 'AP Southeast', count: 197, percentage: 6.9 },
];

/* ─── Helpers ─── */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function timeAgo(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T'));
  const now = new Date('2026-08-16T15:00:00');
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
