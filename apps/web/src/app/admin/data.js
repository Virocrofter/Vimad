/* src/app/admin/data.js */

/* ─── Mock Tenants ─── */
export const initialTenants = [
  {
    id: 'TNT-001',
    name: 'Grand Hotel Boston',
    subdomain: 'grandhotel',
    domain: 'grandhotel.vimad.io',
    status: 'active',
    plan: 'Enterprise',
    billingStatus: 'active',
    location: 'Boston, MA',
    createdAt: '2025-03-15',
    lastActive: '2026-08-16 14:32',
    nextRenewal: '2026-09-12',
    region: 'us-east',
    owner: { name: 'Robert Chen', email: 'robert@grandhotel.com', phone: '+1 617-555-0101' },
    features: [
      'channel-manager',
      'booking-engine',
      'guest-portal',
      'crm-loyalty',
      'marketing-automation',
      'ai-revenue',
    ],
    rooms: { used: 142, total: 200 },
    users: { used: 18, total: 30 },
    storage: { used: 45.2, total: 100, unit: 'GB' },
    apiCalls: { used: 28400, total: 100000 },
    revenue: { mrr: 4990, totalPaid: 59880 },
    billing: { nextInvoice: '2026-09-12', paymentMethod: 'Visa •••• 4242', overdue: false },
    notes: 'Flagship enterprise customer. Dedicated account manager assigned.',
  },
  {
    id: 'TNT-002',
    name: 'Seaside Resort Miami',
    subdomain: 'seasideresort',
    domain: 'seasideresort.vimad.io',
    status: 'active',
    plan: 'Professional',
    billingStatus: 'active',
    location: 'Miami, FL',
    createdAt: '2025-06-20',
    lastActive: '2026-08-16 13:45',
    nextRenewal: '2026-08-20',
    region: 'us-east',
    owner: { name: 'Maria Garcia', email: 'maria@seasideresort.com', phone: '+1 305-555-0202' },
    features: ['channel-manager', 'booking-engine', 'guest-portal', 'crm-loyalty'],
    rooms: { used: 85, total: 200 },
    users: { used: 12, total: 20 },
    storage: { used: 28.5, total: 100, unit: 'GB' },
    apiCalls: { used: 15600, total: 100000 },
    revenue: { mrr: 499, totalPaid: 5988 },
    billing: { nextInvoice: '2026-08-20', paymentMethod: 'Mastercard •••• 8891', overdue: false },
    notes: 'Seasonal property. High volume in winter months.',
  },
  {
    id: 'TNT-003',
    name: 'Mountain Lodge Aspen',
    subdomain: 'mountainlodge',
    domain: 'mountainlodge.vimad.io',
    status: 'trial',
    plan: 'Professional',
    billingStatus: 'trial',
    location: 'Aspen, CO',
    createdAt: '2026-08-01',
    lastActive: '2026-08-16 11:20',
    nextRenewal: null,
    region: 'us-west',
    owner: { name: 'James Miller', email: 'james@mountainlodge.com', phone: '+1 970-555-0303' },
    features: ['channel-manager', 'booking-engine'],
    rooms: { used: 45, total: 200 },
    users: { used: 6, total: 20 },
    storage: { used: 8.2, total: 100, unit: 'GB' },
    apiCalls: { used: 4200, total: 100000 },
    revenue: { mrr: 0, totalPaid: 0 },
    billing: { nextInvoice: null, paymentMethod: null, overdue: false },
    notes: '14-day trial. Onboarding call scheduled for Aug 18.',
  },
  {
    id: 'TNT-004',
    name: 'Downtown Suites Chicago',
    subdomain: 'downtownsuites',
    domain: 'downtownsuites.vimad.io',
    status: 'suspended',
    plan: 'Starter',
    billingStatus: 'overdue',
    location: 'Chicago, IL',
    createdAt: '2025-01-10',
    lastActive: '2026-07-28 09:15',
    nextRenewal: '2026-08-12',
    region: 'us-central',
    owner: { name: 'Lisa Wong', email: 'lisa@downtownsuites.com', phone: '+1 312-555-0404' },
    features: ['booking-engine'],
    rooms: { used: 32, total: 75 },
    users: { used: 4, total: 10 },
    storage: { used: 12.1, total: 50, unit: 'GB' },
    apiCalls: { used: 8900, total: 50000 },
    revenue: { mrr: 199, totalPaid: 2388 },
    billing: {
      nextInvoice: '2026-08-12',
      paymentMethod: 'Visa •••• 4242',
      overdue: true,
      overdueAmount: 199,
    },
    notes: 'Payment failed 3x. Account suspended pending payment resolution.',
  },
  {
    id: 'TNT-005',
    name: 'Coastal Inn San Diego',
    subdomain: 'coastalinn',
    domain: 'coastalinn.vimad.io',
    status: 'active',
    plan: 'Starter',
    billingStatus: 'active',
    location: 'San Diego, CA',
    createdAt: '2025-09-05',
    lastActive: '2026-08-16 10:05',
    nextRenewal: '2026-09-05',
    region: 'us-west',
    owner: { name: 'David Park', email: 'david@coastalinn.com', phone: '+1 619-555-0505' },
    features: ['booking-engine', 'guest-portal'],
    rooms: { used: 28, total: 75 },
    users: { used: 3, total: 10 },
    storage: { used: 9.8, total: 50, unit: 'GB' },
    apiCalls: { used: 6700, total: 50000 },
    revenue: { mrr: 199, totalPaid: 2388 },
    billing: { nextInvoice: '2026-09-05', paymentMethod: 'ACH', overdue: false },
    notes: 'Small boutique property. Considering upgrade to Professional.',
  },
  {
    id: 'TNT-006',
    name: 'Lakeside Resort Tahoe',
    subdomain: 'lakesideresort',
    domain: 'lakesideresort.vimad.io',
    status: 'pending',
    plan: 'Enterprise',
    billingStatus: 'pending',
    location: 'Lake Tahoe, CA',
    createdAt: '2026-08-14',
    lastActive: '2026-08-14 16:30',
    nextRenewal: null,
    region: 'us-west',
    owner: { name: 'Amanda Wilson', email: 'amanda@lakesideresort.com', phone: '+1 530-555-0606' },
    features: [],
    rooms: { used: 0, total: 500 },
    users: { used: 0, total: 50 },
    storage: { used: 0, total: 500, unit: 'GB' },
    apiCalls: { used: 0, total: 500000 },
    revenue: { mrr: 0, totalPaid: 0 },
    billing: { nextInvoice: null, paymentMethod: null, overdue: false },
    notes: 'Contract signed. Awaiting Stripe Connect onboarding completion.',
  },
  {
    id: 'TNT-007',
    name: 'Urban Hotel NYC',
    subdomain: 'urbanhotel',
    domain: 'urbanhotel.vimad.io',
    status: 'active',
    plan: 'Professional',
    billingStatus: 'active',
    location: 'New York, NY',
    createdAt: '2025-04-22',
    lastActive: '2026-08-16 15:10',
    nextRenewal: '2026-08-22',
    region: 'us-east',
    owner: { name: 'Kevin Lee', email: 'kevin@urbanhotel.com', phone: '+1 212-555-0707' },
    features: [
      'channel-manager',
      'booking-engine',
      'guest-portal',
      'crm-loyalty',
      'marketing-automation',
    ],
    rooms: { used: 120, total: 200 },
    users: { used: 15, total: 20 },
    storage: { used: 38.7, total: 100, unit: 'GB' },
    apiCalls: { used: 42100, total: 100000 },
    revenue: { mrr: 499, totalPaid: 5988 },
    billing: { nextInvoice: '2026-08-22', paymentMethod: 'Amex •••• 1001', overdue: false },
    notes: 'High API usage. Monitoring for potential upgrade to Enterprise.',
  },
  {
    id: 'TNT-008',
    name: 'Desert Oasis Phoenix',
    subdomain: 'desertoasis',
    domain: 'desertoasis.vimad.io',
    status: 'cancelled',
    plan: 'Starter',
    billingStatus: 'cancelled',
    location: 'Phoenix, AZ',
    createdAt: '2024-11-01',
    lastActive: '2026-05-15 08:00',
    nextRenewal: null,
    region: 'us-west',
    owner: { name: 'Priya Kumar', email: 'priya@desertoasis.com', phone: '+1 602-555-0808' },
    features: [],
    rooms: { used: 0, total: 75 },
    users: { used: 0, total: 10 },
    storage: { used: 0, total: 50, unit: 'GB' },
    apiCalls: { used: 0, total: 50000 },
    revenue: { mrr: 0, totalPaid: 1194 },
    billing: { nextInvoice: null, paymentMethod: null, overdue: false },
    notes: 'Churned May 2026. Reason: switched to competitor. Exit interview completed.',
  },
];

/* ─── Mock Feature Flags ─── */
export const initialFeatureFlags = [
  {
    id: 'FF-001',
    name: 'ai-revenue-manager',
    label: 'AI Revenue Manager',
    description: 'AI-powered dynamic pricing and revenue optimization engine',
    status: 'active',
    rollout: { type: 'percentage', value: 100 },
    targeting: { tenants: [], plans: ['Enterprise'], regions: [] },
    createdAt: '2026-01-15',
    updatedAt: '2026-08-10',
    createdBy: 'Admin',
    impact: 'high',
    category: 'revenue',
    history: [
      { date: '2026-08-10', action: 'Rollout increased to 100%', user: 'Admin' },
      { date: '2026-06-01', action: 'Rollout increased to 50%', user: 'Admin' },
      { date: '2026-01-15', action: 'Flag created', user: 'Admin' },
    ],
  },
  {
    id: 'FF-002',
    name: 'guest-self-checkin',
    label: 'Guest Self Check-in',
    description: 'Contactless mobile check-in via guest portal and digital key',
    status: 'active',
    rollout: { type: 'percentage', value: 75 },
    targeting: { tenants: [], plans: ['Professional', 'Enterprise'], regions: [] },
    createdAt: '2026-02-20',
    updatedAt: '2026-08-12',
    createdBy: 'Admin',
    impact: 'medium',
    category: 'guest-experience',
    history: [
      { date: '2026-08-12', action: 'Rollout increased to 75%', user: 'Admin' },
      { date: '2026-04-01', action: 'Rollout increased to 25%', user: 'Admin' },
      { date: '2026-02-20', action: 'Flag created', user: 'Admin' },
    ],
  },
  {
    id: 'FF-003',
    name: 'advanced-analytics',
    label: 'Advanced Analytics Dashboard',
    description: 'Predictive analytics, cohort analysis, and custom reporting',
    status: 'active',
    rollout: { type: 'plan', value: null },
    targeting: { tenants: [], plans: ['Enterprise'], regions: [] },
    createdAt: '2026-03-10',
    updatedAt: '2026-07-01',
    createdBy: 'Admin',
    impact: 'medium',
    category: 'analytics',
    history: [
      { date: '2026-07-01', action: 'Switched to plan-based targeting', user: 'Admin' },
      { date: '2026-03-10', action: 'Flag created', user: 'Admin' },
    ],
  },
  {
    id: 'FF-004',
    name: 'white-label-portal',
    label: 'White-Label Guest Portal',
    description: 'Fully customizable booking engine with custom domain support',
    status: 'inactive',
    rollout: { type: 'percentage', value: 0 },
    targeting: { tenants: [], plans: [], regions: [] },
    createdAt: '2026-04-05',
    updatedAt: '2026-04-05',
    createdBy: 'Admin',
    impact: 'high',
    category: 'guest-experience',
    history: [{ date: '2026-04-05', action: 'Flag created', user: 'Admin' }],
  },
  {
    id: 'FF-005',
    name: 'multi-property-dashboard',
    label: 'Multi-Property Dashboard',
    description: 'Centralized management for hotel chains and management groups',
    status: 'active',
    rollout: { type: 'tenant', value: null },
    targeting: { tenants: ['TNT-001', 'TNT-006'], plans: [], regions: [] },
    createdAt: '2026-05-01',
    updatedAt: '2026-08-01',
    createdBy: 'Admin',
    impact: 'high',
    category: 'operations',
    history: [
      { date: '2026-08-01', action: 'Added TNT-006 to allowlist', user: 'Admin' },
      { date: '2026-05-01', action: 'Flag created', user: 'Admin' },
    ],
  },
  {
    id: 'FF-006',
    name: 'smart-housekeeping',
    label: 'Smart Housekeeping AI',
    description: 'AI-driven room assignment and cleaning optimization',
    status: 'active',
    rollout: { type: 'percentage', value: 30 },
    targeting: { tenants: [], plans: ['Professional', 'Enterprise'], regions: ['us-east'] },
    createdAt: '2026-06-15',
    updatedAt: '2026-08-14',
    createdBy: 'Admin',
    impact: 'low',
    category: 'operations',
    history: [
      { date: '2026-08-14', action: 'Expanded to us-east region', user: 'Admin' },
      { date: '2026-06-15', action: 'Flag created', user: 'Admin' },
    ],
  },
  {
    id: 'FF-007',
    name: 'crypto-payments',
    label: 'Cryptocurrency Payments',
    description: 'Accept BTC, ETH, and stablecoins for bookings',
    status: 'inactive',
    rollout: { type: 'percentage', value: 0 },
    targeting: { tenants: [], plans: [], regions: [] },
    createdAt: '2026-07-20',
    updatedAt: '2026-07-20',
    createdBy: 'Admin',
    impact: 'low',
    category: 'billing',
    history: [{ date: '2026-07-20', action: 'Flag created', user: 'Admin' }],
  },
  {
    id: 'FF-008',
    name: 'voice-assistant',
    label: 'In-Room Voice Assistant',
    description: 'Alexa/Google integration for room controls and concierge',
    status: 'active',
    rollout: { type: 'percentage', value: 10 },
    targeting: { tenants: [], plans: ['Enterprise'], regions: [] },
    createdAt: '2026-08-01',
    updatedAt: '2026-08-15',
    createdBy: 'Admin',
    impact: 'medium',
    category: 'guest-experience',
    history: [
      { date: '2026-08-15', action: 'Rollout increased to 10%', user: 'Admin' },
      { date: '2026-08-01', action: 'Flag created', user: 'Admin' },
    ],
  },
];

/* ─── Metadata ─── */
export const tenantStatusMeta = {
  active: {
    label: 'Active',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: 'CheckCircle2',
  },
  trial: {
    label: 'Trial',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    icon: 'Clock',
  },
  suspended: {
    label: 'Suspended',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: 'AlertTriangle',
  },
  pending: {
    label: 'Pending',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
    icon: 'Clock',
  },
  cancelled: {
    label: 'Cancelled',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
    icon: 'XCircle',
  },
};

// Alias for components that expect statusMeta
export const statusMeta = tenantStatusMeta;

export const planMeta = {
  Starter: { label: 'Starter', color: 'text-info', bg: 'bg-info/10' },
  Professional: { label: 'Professional', color: 'text-secondary', bg: 'bg-secondary/10' },
  Enterprise: { label: 'Enterprise', color: 'text-purple-500', bg: 'bg-purple-500/10' },
};

export const flagStatusMeta = {
  active: { label: 'Active', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
  inactive: {
    label: 'Inactive',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
  deprecated: {
    label: 'Deprecated',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
};

export const flagCategoryMeta = {
  revenue: {
    label: 'Revenue',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    icon: 'TrendingUp',
  },
  'guest-experience': {
    label: 'Guest Experience',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    icon: 'Heart',
  },
  analytics: {
    label: 'Analytics',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    icon: 'BarChart3',
  },
  operations: {
    label: 'Operations',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    icon: 'Settings',
  },
  billing: { label: 'Billing', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'CreditCard' },
};

export const impactMeta = {
  high: { label: 'High', class: 'bg-danger/10 text-danger border-danger/20' },
  medium: { label: 'Medium', class: 'bg-warning/10 text-warning border-warning/20' },
  low: { label: 'Low', class: 'bg-accent/10 text-accent border-accent/20' },
};

export const billingStatusMeta = {
  active: { label: 'Active', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
  overdue: {
    label: 'Overdue',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
  pending: {
    label: 'Pending',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  cancelled: {
    label: 'Cancelled',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
  trial: { label: 'Trial', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
};

export const regions = ['us-east', 'us-west', 'us-central', 'eu-west', 'ap-southeast'];
export const plans = ['Starter', 'Professional', 'Enterprise'];

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZAR' }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ─── Usage Helpers (used by components.jsx and page.jsx) ─── */
export function getUsagePercent(used, total) {
  if (typeof total === 'string' || !total) return null;
  return Math.round((used / total) * 100);
}

export function getUsageColor(pct) {
  if (pct === null) return 'text-text-muted';
  if (pct >= 100) return 'text-danger';
  if (pct >= 90) return 'text-warning';
  if (pct >= 75) return 'text-info';
  return 'text-accent';
}

export function getUsageBarColor(pct) {
  if (pct === null) return 'bg-text-muted';
  if (pct >= 100) return 'bg-danger';
  if (pct >= 90) return 'bg-warning';
  if (pct >= 75) return 'bg-info';
  return 'bg-accent';
}
