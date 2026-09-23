/* apps/web/src/app/admin/demo-access/data.js */
export const mockDemoRequests = [
  {
    id: 'demo-1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Hotel',
    phone: '+1 555-0100',
    propertyType: 'boutique',
    roomCount: 50,
    useCase: 'pms_migration',
    preferredDate: '2026-09-15T10:00:00Z',
    timezone: 'America/New_York',
    status: 'pending',
    assignedTo: null,
    notes: '',
    source: 'website',
    utm: { source: 'google', medium: 'cpc' },
    createdAt: '2026-09-09T10:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
  },
];

export const mockDemoMetrics = {
  totalRequests: 150,
  pendingRequests: 23,
  scheduledThisWeek: 8,
  conversionRate: 0.35,
  avgDealValue: 5000,
  pipelineValue: 125000,
};

/* ─── Demo Status Metadata ─── */
export const demoStatusMeta = {
  active: {
    label: 'Active',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  expired: {
    label: 'Expired',
    dot: 'bg-text-muted',
    class: 'bg-neutral/10 text-text-muted border-border',
  },
  locked: {
    label: 'Locked',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
  converted: {
    label: 'Converted',
    dot: 'bg-secondary',
    class: 'bg-secondary/10 text-secondary border-secondary/20',
  },
};

/* ─── Tier Config ─── */
export const tierConfig = {
  Starter: {
    label: 'Starter',
    price: 199,
    rooms: 25,
    users: 5,
    bg: 'bg-info/10',
    color: 'text-info',
    features: ['booking-engine', 'guest-portal'],
  },
  Professional: {
    label: 'Professional',
    price: 499,
    rooms: 100,
    users: 20,
    bg: 'bg-secondary/10',
    color: 'text-secondary',
    features: [
      'booking-engine',
      'guest-portal',
      'channel-manager',
      'crm-loyalty',
      'marketing-automation',
      'advanced-analytics',
    ],
  },
  Enterprise: {
    label: 'Enterprise',
    price: 999,
    rooms: 500,
    users: 100,
    bg: 'bg-purple-500/10',
    color: 'text-purple-500',
    features: [
      'booking-engine',
      'guest-portal',
      'channel-manager',
      'crm-loyalty',
      'marketing-automation',
      'ai-revenue',
      'advanced-analytics',
      'white-label-portal',
    ],
  },
};

/* ─── Seed demos for the zustand store (store.js) ─── */
export const initialDemos = [
  {
    id: 'DEMO-001',
    tenantName: 'Sunset Beach Resort',
    subdomain: 'sunsetbeach',
    contactName: 'Jane Cooper',
    contactEmail: 'jane@sunsetbeach.com',
    contactPhone: '+1 555-0100',
    tier: 'Professional',
    status: 'active',
    createdAt: '2026-09-05',
    expiresAt: '2026-10-05',
    daysRemaining: 16,
    totalDays: 30,
    roomsConfigured: 42,
    usersInvited: 6,
    reservationsCreated: 128,
    revenueSimulated: 18450,
    lastActive: '2026-09-18',
    sessionsCount: 34,
    featuresUsed: ['booking-engine', 'guest-portal', 'crm-loyalty'],
    onboardingStep: 'active_usage',
    notes: '',
    autoLockEnabled: true,
    reminderSent: false,
    convertedAt: null,
    convertedPlan: null,
    source: 'website',
    region: 'us-east',
  },
  {
    id: 'DEMO-002',
    tenantName: 'Alpine Lodge',
    subdomain: 'alpinelodge',
    contactName: 'Marcus Webb',
    contactEmail: 'marcus@alpinelodge.com',
    contactPhone: '+1 555-0101',
    tier: 'Starter',
    status: 'expiring_soon',
    createdAt: '2026-08-26',
    expiresAt: '2026-09-25',
    daysRemaining: 6,
    totalDays: 30,
    roomsConfigured: 18,
    usersInvited: 2,
    reservationsCreated: 41,
    revenueSimulated: 5230,
    lastActive: '2026-09-17',
    sessionsCount: 15,
    featuresUsed: ['booking-engine'],
    onboardingStep: 'onboarded',
    notes: 'Follow up on channel manager interest.',
    autoLockEnabled: true,
    reminderSent: false,
    convertedAt: null,
    convertedPlan: null,
    source: 'referral',
    region: 'eu-west',
  },
];

/* ─── Seed usage analytics for the zustand store (store.js) ─── */
export const usageAnalytics = {
  funnel: [
    { key: 'requested', label: 'Requested', count: 0, color: 'bg-info' },
    { key: 'approved', label: 'Approved', count: 0, color: 'bg-secondary' },
    { key: 'activated', label: 'Activated', count: 0, color: 'bg-accent' },
    { key: 'converted', label: 'Converted', count: 0, color: 'bg-warning' },
  ],
  sources: [],
  features: [],
};

/* ─── Helpers ─── */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function getUsagePercent(used, total) {
  if (typeof total !== 'number' || total <= 0) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}
