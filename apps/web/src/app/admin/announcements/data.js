/* src/app/admin/announcements/data.js */

/* ─── Mock Announcements ─── */
export const initialAnnouncements = [
  {
    id: 'ANN-001',
    title: 'New Revenue Dashboard Now Live',
    content:
      "We've completely redesigned the revenue analytics dashboard with AI-powered forecasting, cohort analysis, and customizable widgets. Access it from Reports → Revenue Analytics.",
    type: 'feature',
    priority: 'high',
    status: 'published',
    audience: 'all',
    targetTenants: [],
    targetPlans: [],
    scheduledAt: null,
    publishedAt: '2026-08-15T09:00:00Z',
    expiresAt: '2026-09-15T23:59:59Z',
    createdBy: 'Robert Chen',
    createdAt: '2026-08-14T10:00:00Z',
    readCount: 142,
    totalRecipients: 156,
    cta: { label: 'View Dashboard', url: '/app/reports' },
    pinned: true,
  },
  {
    id: 'ANN-002',
    title: 'Scheduled Maintenance: Database Upgrade',
    content:
      'We will be performing a database upgrade to improve query performance and add support for new analytics features. Expected downtime: 15 minutes.',
    type: 'maintenance',
    priority: 'critical',
    status: 'published',
    audience: 'all',
    targetTenants: [],
    targetPlans: [],
    scheduledAt: '2026-08-20T02:00:00Z',
    publishedAt: '2026-08-13T14:00:00Z',
    expiresAt: '2026-08-21T00:00:00Z',
    createdBy: 'DevOps Team',
    createdAt: '2026-08-13T14:00:00Z',
    readCount: 138,
    totalRecipients: 156,
    cta: null,
    pinned: true,
  },
  {
    id: 'ANN-003',
    title: 'Channel Manager v2 Beta Available',
    content:
      'Enterprise customers can now opt into the Channel Manager v2 beta. Features include real-time sync, conflict resolution, and rate parity monitoring.',
    type: 'feature',
    priority: 'medium',
    status: 'published',
    audience: 'plan',
    targetTenants: [],
    targetPlans: ['Enterprise'],
    scheduledAt: null,
    publishedAt: '2026-08-12T11:00:00Z',
    expiresAt: '2026-09-12T23:59:59Z',
    createdBy: 'Maria Garcia',
    createdAt: '2026-08-12T11:00:00Z',
    readCount: 24,
    totalRecipients: 28,
    cta: { label: 'Enable Beta', url: '/app/settings/integrations' },
    pinned: false,
  },
  {
    id: 'ANN-004',
    title: 'Updated PCI-DSS Compliance Documentation',
    content:
      'Our latest PCI-DSS Level 1 compliance audit has been completed. Updated documentation and security certificates are now available in the Security Center.',
    type: 'update',
    priority: 'low',
    status: 'published',
    audience: 'all',
    targetTenants: [],
    targetPlans: [],
    scheduledAt: null,
    publishedAt: '2026-08-10T16:00:00Z',
    expiresAt: null,
    createdBy: 'Security Team',
    createdAt: '2026-08-10T16:00:00Z',
    readCount: 89,
    totalRecipients: 156,
    cta: { label: 'View Certificates', url: '/security' },
    pinned: false,
  },
  {
    id: 'ANN-005',
    title: 'End of Support: Legacy API v1',
    content:
      'API v1 will be deprecated on October 1, 2026. Please migrate to API v2 before this date. Migration guides and SDK updates are available.',
    type: 'alert',
    priority: 'high',
    status: 'published',
    audience: 'all',
    targetTenants: [],
    targetPlans: [],
    scheduledAt: null,
    publishedAt: '2026-08-08T10:00:00Z',
    expiresAt: '2026-10-01T00:00:00Z',
    createdBy: 'Platform Team',
    createdAt: '2026-08-08T10:00:00Z',
    readCount: 134,
    totalRecipients: 156,
    cta: { label: 'Migration Guide', url: '/api-docs/migration' },
    pinned: false,
  },
  {
    id: 'ANN-006',
    title: 'Holiday Pricing Recommendations',
    content:
      'Our AI revenue manager has generated holiday pricing recommendations for Q4 2026. Review and approve suggested rate adjustments.',
    type: 'feature',
    priority: 'medium',
    status: 'draft',
    audience: 'tenant',
    targetTenants: ['TNT-001', 'TNT-002', 'TNT-007'],
    targetPlans: [],
    scheduledAt: '2026-08-25T08:00:00Z',
    publishedAt: null,
    expiresAt: '2026-10-31T23:59:59Z',
    createdBy: 'David Park',
    createdAt: '2026-08-16T13:00:00Z',
    readCount: 0,
    totalRecipients: 3,
    cta: { label: 'Review Rates', url: '/app/rates' },
    pinned: false,
  },
];

/* ─── Mock Changelog Entries ─── */
export const initialChangelog = [
  {
    id: 'CL-2026-08-16',
    version: '2.4.1',
    date: '2026-08-16',
    title: 'August 2026 Release',
    summary: 'Revenue dashboard redesign, Channel Manager v2 beta, and performance improvements.',
    changes: [
      {
        type: 'feature',
        text: 'Completely redesigned Revenue Analytics dashboard with AI forecasting',
      },
      { type: 'feature', text: 'Channel Manager v2 beta for Enterprise customers' },
      { type: 'improvement', text: 'Reduced page load times by 40% across the app' },
      { type: 'improvement', text: 'Enhanced mobile responsiveness for Front Desk module' },
      { type: 'fix', text: 'Fixed race condition in reservation concurrent editing' },
      { type: 'fix', text: 'Resolved timezone display issues in night audit reports' },
      { type: 'security', text: 'Updated dependencies to patch CVE-2026-XXXX' },
    ],
    author: 'Release Team',
    published: true,
  },
  {
    id: 'CL-2026-08-02',
    version: '2.4.0',
    date: '2026-08-02',
    title: 'August Mid-Sprint Release',
    summary:
      'Guest portal enhancements, new housekeeping automation, and Stripe Connect improvements.',
    changes: [
      { type: 'feature', text: 'Guest self-check-in via mobile with digital key integration' },
      { type: 'feature', text: 'Smart Housekeeping AI for automated room assignment' },
      { type: 'improvement', text: 'Stripe Connect onboarding flow streamlined' },
      { type: 'improvement', text: 'Bulk rate update tool for revenue managers' },
      { type: 'fix', text: 'Fixed OTA sync delay for Booking.com reservations' },
      { type: 'fix', text: 'Corrected tax calculation for multi-currency bookings' },
    ],
    author: 'Release Team',
    published: true,
  },
  {
    id: 'CL-2026-07-15',
    version: '2.3.2',
    date: '2026-07-15',
    title: 'July Hotfix Release',
    summary: 'Critical fixes for payment processing and reservation imports.',
    changes: [
      { type: 'fix', text: 'Fixed payment authorization failure for Amex cards' },
      { type: 'fix', text: 'Resolved CSV import encoding issues for guest data' },
      { type: 'security', text: 'Rotated API keys for third-party integrations' },
    ],
    author: 'Release Team',
    published: true,
  },
  {
    id: 'CL-2026-07-01',
    version: '2.3.0',
    date: '2026-07-01',
    title: 'Q3 Feature Release',
    summary: 'Multi-property dashboard, white-label portal, and advanced analytics.',
    changes: [
      { type: 'feature', text: 'Multi-Property Dashboard for hotel chains' },
      { type: 'feature', text: 'White-Label Guest Portal with custom domain support' },
      { type: 'feature', text: 'Advanced Analytics with cohort and predictive analysis' },
      { type: 'improvement', text: 'Redis caching layer for 50% faster report generation' },
      { type: 'improvement', text: 'Elasticsearch upgrade for better search performance' },
    ],
    author: 'Release Team',
    published: true,
  },
  {
    id: 'CL-2026-06-15',
    version: '2.2.0',
    date: '2026-06-15',
    title: 'June Release',
    summary: 'CRM loyalty program, marketing automation, and guest messaging.',
    changes: [
      { type: 'feature', text: 'CRM & Loyalty program with points and tiers' },
      { type: 'feature', text: 'Marketing automation with email and SMS campaigns' },
      { type: 'feature', text: 'Two-way guest messaging via SMS and email' },
      { type: 'improvement', text: 'Updated UI component library to v4' },
    ],
    author: 'Release Team',
    published: true,
  },
];

/* ─── Mock Maintenance Windows ─── */
export const initialMaintenanceWindows = [
  {
    id: 'MW-001',
    title: 'Database Cluster Upgrade',
    description:
      'Upgrading PostgreSQL cluster to v16.4 for improved performance and new JSON indexing features.',
    status: 'scheduled',
    startTime: '2026-08-20T02:00:00Z',
    endTime: '2026-08-20T02:30:00Z',
    estimatedDuration: '30 minutes',
    affectedServices: ['Primary Database', 'API Gateway', 'Auth Service'],
    impact: 'read-only',
    tenantNotification: true,
    createdBy: 'DevOps Team',
    createdAt: '2026-08-13T14:00:00Z',
  },
  {
    id: 'MW-002',
    title: 'Redis Cache Failover Test',
    description:
      'Scheduled failover test of Redis cluster to validate disaster recovery procedures.',
    status: 'scheduled',
    startTime: '2026-08-22T03:00:00Z',
    endTime: '2026-08-22T03:10:00Z',
    estimatedDuration: '10 minutes',
    affectedServices: ['Redis Cache'],
    impact: 'degraded',
    tenantNotification: true,
    createdBy: 'DevOps Team',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'MW-003',
    title: 'Elasticsearch Reindexing',
    description:
      'Full reindexing of search corpus to enable new fuzzy matching and autocomplete features.',
    status: 'scheduled',
    startTime: '2026-08-25T01:00:00Z',
    endTime: '2026-08-25T04:00:00Z',
    estimatedDuration: '3 hours',
    affectedServices: ['Search Index', 'API Gateway'],
    impact: 'degraded',
    tenantNotification: true,
    createdBy: 'Platform Team',
    createdAt: '2026-08-14T16:00:00Z',
  },
  {
    id: 'MW-004',
    title: 'CDN Edge Node Deployment',
    description: 'Deploying new edge nodes in APAC region for improved global performance.',
    status: 'completed',
    startTime: '2026-08-10T00:00:00Z',
    endTime: '2026-08-10T02:00:00Z',
    estimatedDuration: '2 hours',
    affectedServices: ['File Storage (S3)', 'API Gateway'],
    impact: 'none',
    tenantNotification: false,
    createdBy: 'DevOps Team',
    createdAt: '2026-08-08T12:00:00Z',
    actualDuration: '1h 45m',
  },
  {
    id: 'MW-005',
    title: 'Security Patch Rollout',
    description: 'Critical security patches for kernel and container runtime.',
    status: 'completed',
    startTime: '2026-08-05T02:00:00Z',
    endTime: '2026-08-05T02:15:00Z',
    estimatedDuration: '15 minutes',
    affectedServices: ['All Services'],
    impact: 'read-only',
    tenantNotification: true,
    createdBy: 'Security Team',
    createdAt: '2026-08-03T09:00:00Z',
    actualDuration: '12m',
  },
  {
    id: 'MW-006',
    title: 'Kubernetes Cluster Upgrade',
    description:
      'Upgrading K8s control plane to v1.31 for improved scheduling and resource management.',
    status: 'in-progress',
    startTime: '2026-08-17T01:00:00Z',
    endTime: '2026-08-17T03:00:00Z',
    estimatedDuration: '2 hours',
    affectedServices: ['All Services'],
    impact: 'none',
    tenantNotification: true,
    createdBy: 'DevOps Team',
    createdAt: '2026-08-14T08:00:00Z',
    actualDuration: null,
  },
];

/* ─── Subscription Plans ─── */
export const plans = ['Starter', 'Professional', 'Enterprise'];

/* ─── Regions ─── */
export const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];

/* ─── Metadata ─── */
export const announcementTypeMeta = {
  feature: {
    label: 'Feature',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    icon: 'Sparkles',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    icon: 'Wrench',
  },
  alert: {
    label: 'Alert',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    icon: 'AlertTriangle',
  },
  update: {
    label: 'Update',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
    icon: 'Info',
  },
};

export const priorityMeta = {
  critical: {
    label: 'Critical',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
  high: {
    label: 'High',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    dot: 'bg-warning',
  },
  medium: {
    label: 'Medium',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  low: {
    label: 'Low',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
};

export const announcementStatusMeta = {
  draft: {
    label: 'Draft',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
  scheduled: {
    label: 'Scheduled',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  published: {
    label: 'Published',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
  archived: {
    label: 'Archived',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
};

export const maintenanceStatusMeta = {
  scheduled: {
    label: 'Scheduled',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    dot: 'bg-warning',
  },
  completed: {
    label: 'Completed',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
};

export const impactMeta = {
  none: {
    label: 'No Impact',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  degraded: {
    label: 'Degraded',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  'read-only': {
    label: 'Read-Only',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  unavailable: {
    label: 'Unavailable',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
  },
};

export const changelogTypeMeta = {
  feature: { label: 'New', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  improvement: {
    label: 'Improved',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  fix: { label: 'Fixed', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  security: {
    label: 'Security',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
  },
  deprecated: {
    label: 'Deprecated',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
  },
};

export const audienceMeta = {
  all: { label: 'All Tenants', icon: 'Globe' },
  plan: { label: 'By Plan', icon: 'Tag' },
  tenant: { label: 'Specific Tenants', icon: 'Building2' },
};

/* ─── Helpers ─── */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(isoString);
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function isUpcoming(startTime) {
  return new Date(startTime) > new Date();
}

export function isOngoing(startTime, endTime) {
  const now = new Date();
  return new Date(startTime) <= now && new Date(endTime) >= now;
}
