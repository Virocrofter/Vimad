/* src/app/admin/feedback/data.js */

/* ─── NPS Responses ─── */
export const npsResponses = [
  {
    id: 'NPS-001',
    tenantId: 'TNT-001',
    tenantName: 'Grand Hotel Boston',
    user: { name: 'Robert Chen', email: 'robert@grandhotel.com', role: 'Owner' },
    score: 9,
    category: 'product',
    comment: 'The new dashboard is fantastic. Love the real-time occupancy widget. Would be great to have customizable widgets though.',
    sentiment: 'positive',
    sentimentScore: 0.87,
    keywords: ['dashboard', 'real-time', 'occupancy', 'customizable widgets'],
    followUp: true,
    responded: false,
    createdAt: '2026-08-16 14:32',
    touchpoint: 'post-booking',
    version: 'v2.4.1',
  },
  {
    id: 'NPS-002',
    tenantId: 'TNT-002',
    tenantName: 'Seaside Resort Miami',
    user: { name: 'Maria Garcia', email: 'maria@seasideresort.com', role: 'Manager' },
    score: 3,
    category: 'support',
    comment: 'Had a critical issue with channel manager sync last week. Support took 6 hours to respond. Unacceptable for our business.',
    sentiment: 'negative',
    sentimentScore: -0.72,
    keywords: ['channel manager', 'sync', 'support', 'response time'],
    followUp: true,
    responded: true,
    response: {
      by: 'Sarah J.',
      text: 'Hi Maria, we sincerely apologize for the delay. We\'ve identified a gap in our weekend coverage and have added an additional on-call engineer. We\'ve also prioritized the channel sync reliability improvements in our next sprint.',
      at: '2026-08-16 10:15',
    },
    createdAt: '2026-08-15 09:20',
    touchpoint: 'in-app',
    version: 'v2.4.1',
  },
  {
    id: 'NPS-003',
    tenantId: 'TNT-003',
    tenantName: 'Mountain Lodge Aspen',
    user: { name: 'James Miller', email: 'james@mountainlodge.com', role: 'Owner' },
    score: 7,
    category: 'feature',
    comment: 'Good overall but missing group booking functionality. We handle a lot of ski groups and need bulk check-in/check-out.',
    sentiment: 'neutral',
    sentimentScore: 0.15,
    keywords: ['group booking', 'bulk check-in', 'ski groups'],
    followUp: false,
    responded: false,
    createdAt: '2026-08-14 16:45',
    touchpoint: 'email',
    version: 'v2.4.0',
  },
  {
    id: 'NPS-004',
    tenantId: 'TNT-004',
    tenantName: 'Downtown Suites Chicago',
    user: { name: 'Lisa Wong', email: 'lisa@downtownsuites.com', role: 'GM' },
    score: 2,
    category: 'billing',
    comment: 'Billing module is confusing. Can\'t figure out how to split charges between guests. Invoice formatting is also terrible.',
    sentiment: 'negative',
    sentimentScore: -0.68,
    keywords: ['billing', 'split charges', 'invoice formatting'],
    followUp: true,
    responded: false,
    createdAt: '2026-08-13 11:10',
    touchpoint: 'in-app',
    version: 'v2.3.9',
  },
  {
    id: 'NPS-005',
    tenantId: 'TNT-005',
    tenantName: 'Coastal Inn San Diego',
    user: { name: 'David Park', email: 'david@coastalinn.com', role: 'Owner' },
    score: 10,
    category: 'product',
    comment: 'Absolutely love it. The mobile app has transformed how our front desk operates. Night audit is now a 5-minute job instead of 45.',
    sentiment: 'positive',
    sentimentScore: 0.95,
    keywords: ['mobile app', 'front desk', 'night audit'],
    followUp: false,
    responded: true,
    response: {
      by: 'Product Team',
      text: 'Thank you so much, David! We\'re thrilled the mobile app is making such a difference. We\'d love to feature your story in an upcoming case study — our team will reach out.',
      at: '2026-08-14 09:00',
    },
    createdAt: '2026-08-13 08:30',
    touchpoint: 'email',
    version: 'v2.4.1',
  },
  {
    id: 'NPS-006',
    tenantId: 'TNT-007',
    tenantName: 'Urban Hotel NYC',
    user: { name: 'Kevin Lee', email: 'kevin@urbanhotel.com', role: 'Revenue Manager' },
    score: 6,
    category: 'feature',
    comment: 'Rate management is decent but lacks dynamic pricing rules. Competitors have AI-driven pricing — we need this to stay competitive.',
    sentiment: 'neutral',
    sentimentScore: -0.12,
    keywords: ['rate management', 'dynamic pricing', 'AI pricing'],
    followUp: true,
    responded: false,
    createdAt: '2026-08-12 13:20',
    touchpoint: 'post-booking',
    version: 'v2.4.0',
  },
  {
    id: 'NPS-007',
    tenantId: 'TNT-001',
    tenantName: 'Grand Hotel Boston',
    user: { name: 'Sarah Johnson', email: 'sarah@grandhotel.com', role: 'Front Desk' },
    score: 8,
    category: 'product',
    comment: 'Housekeeping status updates are great. Would love push notifications when rooms are ready for check-in.',
    sentiment: 'positive',
    sentimentScore: 0.62,
    keywords: ['housekeeping', 'status updates', 'push notifications'],
    followUp: false,
    responded: false,
    createdAt: '2026-08-11 10:45',
    touchpoint: 'in-app',
    version: 'v2.4.0',
  },
  {
    id: 'NPS-008',
    tenantId: 'TNT-006',
    tenantName: 'Lakeside Resort Tahoe',
    user: { name: 'Amanda Wilson', email: 'amanda@lakesideresort.com', role: 'Owner' },
    score: 4,
    category: 'onboarding',
    comment: 'Onboarding was overwhelming. Too many features introduced at once. Need a more gradual walkthrough for new properties.',
    sentiment: 'negative',
    sentimentScore: -0.45,
    keywords: ['onboarding', 'walkthrough', 'new properties'],
    followUp: true,
    responded: true,
    response: {
      by: 'Customer Success',
      text: 'Hi Amanda, thank you for the honest feedback. We\'re completely redesigning our onboarding flow with a phased approach — core features first, advanced tools later. We\'d love your input on the beta — I\'ll schedule a call.',
      at: '2026-08-12 14:00',
    },
    createdAt: '2026-08-10 15:30',
    touchpoint: 'email',
    version: 'v2.4.0',
  },
  {
    id: 'NPS-009',
    tenantId: 'TNT-002',
    tenantName: 'Seaside Resort Miami',
    user: { name: 'Carlos Mendez', email: 'carlos@seasideresort.com', role: 'IT Admin' },
    score: 9,
    category: 'product',
    comment: 'API documentation is excellent. Webhooks are reliable. Made our custom integrations painless.',
    sentiment: 'positive',
    sentimentScore: 0.91,
    keywords: ['API', 'documentation', 'webhooks', 'integrations'],
    followUp: false,
    responded: false,
    createdAt: '2026-08-09 11:00',
    touchpoint: 'in-app',
    version: 'v2.4.1',
  },
  {
    id: 'NPS-010',
    tenantId: 'TNT-005',
    tenantName: 'Coastal Inn San Diego',
    user: { name: 'David Park', email: 'david@coastalinn.com', role: 'Owner' },
    score: 5,
    category: 'performance',
    comment: 'System gets slow during peak check-in/check-out hours. Pages take 5+ seconds to load. Very frustrating for guests waiting.',
    sentiment: 'negative',
    sentimentScore: -0.55,
    keywords: ['performance', 'slow', 'check-in', 'load time'],
    followUp: true,
    responded: false,
    createdAt: '2026-08-08 17:15',
    touchpoint: 'in-app',
    version: 'v2.3.9',
  },
  {
    id: 'NPS-011',
    tenantId: 'TNT-007',
    tenantName: 'Urban Hotel NYC',
    user: { name: 'Jessica Kim', email: 'jessica@urbanhotel.com', role: 'Front Desk' },
    score: 8,
    category: 'product',
    comment: 'Guest messaging feature is a game changer. Guests love texting us instead of calling. Would like auto-reply templates.',
    sentiment: 'positive',
    sentimentScore: 0.74,
    keywords: ['guest messaging', 'auto-reply', 'templates'],
    followUp: false,
    responded: false,
    createdAt: '2026-08-07 09:30',
    touchpoint: 'post-booking',
    version: 'v2.4.0',
  },
  {
    id: 'NPS-012',
    tenantId: 'TNT-003',
    tenantName: 'Mountain Lodge Aspen',
    user: { name: 'James Miller', email: 'james@mountainlodge.com', role: 'Owner' },
    score: 7,
    category: 'feature',
    comment: 'Reporting is good but export to Excel loses formatting. Need better PDF exports with our branding.',
    sentiment: 'neutral',
    sentimentScore: 0.22,
    keywords: ['reporting', 'Excel export', 'PDF', 'branding'],
    followUp: false,
    responded: false,
    createdAt: '2026-08-06 14:20',
    touchpoint: 'email',
    version: 'v2.3.9',
  },
];

/* ─── Feature Requests ─── */
export const featureRequests = [
  {
    id: 'FR-001',
    title: 'AI-Driven Dynamic Pricing',
    description: 'Automatically adjust room rates based on demand, competitor pricing, local events, and historical data. Include revenue forecasting.',
    category: 'revenue',
    status: 'planned',
    votes: 47,
    voters: ['TNT-007', 'TNT-002', 'TNT-001'],
    npsLinked: ['NPS-006'],
    createdAt: '2026-07-15',
    createdBy: 'Kevin Lee',
    tenantId: 'TNT-007',
    priority: 'high',
    estimatedDelivery: 'Q4 2026',
    comments: 12,
  },
  {
    id: 'FR-002',
    title: 'Group Booking & Bulk Operations',
    description: 'Allow reservations for 10+ rooms with unified billing, bulk check-in/check-out, and group folio management. Essential for event hotels.',
    category: 'operations',
    status: 'in-progress',
    votes: 34,
    voters: ['TNT-003', 'TNT-001', 'TNT-006'],
    npsLinked: ['NPS-003'],
    createdAt: '2026-07-20',
    createdBy: 'James Miller',
    tenantId: 'TNT-003',
    priority: 'high',
    estimatedDelivery: 'Q3 2026',
    comments: 8,
  },
  {
    id: 'FR-003',
    title: 'Push Notifications for Housekeeping',
    description: 'Real-time push notifications to front desk when housekeeping marks rooms as clean/inspected. Reduce guest wait times.',
    category: 'operations',
    status: 'planned',
    votes: 28,
    voters: ['TNT-001', 'TNT-005'],
    npsLinked: ['NPS-007'],
    createdAt: '2026-07-25',
    createdBy: 'Sarah Johnson',
    tenantId: 'TNT-001',
    priority: 'medium',
    estimatedDelivery: 'Q4 2026',
    comments: 5,
  },
  {
    id: 'FR-004',
    title: 'White-Label Guest Portal',
    description: 'Fully customizable guest-facing portal with hotel branding, custom domain, and tailored messaging.',
    category: 'guest-experience',
    status: 'in-progress',
    votes: 52,
    voters: ['TNT-001', 'TNT-002', 'TNT-005', 'TNT-007'],
    npsLinked: [],
    createdAt: '2026-06-10',
    createdBy: 'Robert Chen',
    tenantId: 'TNT-001',
    priority: 'high',
    estimatedDelivery: 'Q3 2026',
    comments: 18,
  },
  {
    id: 'FR-005',
    title: 'Auto-Reply Templates for Guest Messaging',
    description: 'Configurable auto-reply templates for common guest inquiries (check-in time, WiFi password, amenities). Support variables.',
    category: 'guest-experience',
    status: 'backlog',
    votes: 19,
    voters: ['TNT-007'],
    npsLinked: ['NPS-011'],
    createdAt: '2026-08-01',
    createdBy: 'Jessica Kim',
    tenantId: 'TNT-007',
    priority: 'medium',
    estimatedDelivery: 'Q1 2027',
    comments: 3,
  },
  {
    id: 'FR-006',
    title: 'Gradual Onboarding Walkthrough',
    description: 'Phased onboarding that introduces features progressively. Core setup first, advanced tools unlocked over 30 days.',
    category: 'onboarding',
    status: 'in-progress',
    votes: 15,
    voters: ['TNT-006', 'TNT-004'],
    npsLinked: ['NPS-008'],
    createdAt: '2026-08-05',
    createdBy: 'Amanda Wilson',
    tenantId: 'TNT-006',
    priority: 'high',
    estimatedDelivery: 'Q3 2026',
    comments: 6,
  },
  {
    id: 'FR-007',
    title: 'Branded PDF Report Exports',
    description: 'PDF exports with custom hotel logo, colors, and cover page. Maintain formatting consistency across all reports.',
    category: 'reporting',
    status: 'backlog',
    votes: 11,
    voters: ['TNT-003'],
    npsLinked: ['NPS-012'],
    createdAt: '2026-08-06',
    createdBy: 'James Miller',
    tenantId: 'TNT-003',
    priority: 'low',
    estimatedDelivery: 'Q1 2027',
    comments: 2,
  },
  {
    id: 'FR-008',
    title: 'Performance Optimization for Peak Hours',
    description: 'Optimize database queries and caching for high-traffic periods. Target <2s load time during check-in rush.',
    category: 'performance',
    status: 'in-progress',
    votes: 23,
    voters: ['TNT-005', 'TNT-002', 'TNT-001'],
    npsLinked: ['NPS-010'],
    createdAt: '2026-08-08',
    createdBy: 'David Park',
    tenantId: 'TNT-005',
    priority: 'critical',
    estimatedDelivery: 'Q3 2026',
    comments: 9,
  },
];

/* ─── Sentiment Trend Data (last 30 days) ─── */
export const sentimentTrend = [
  { date: '2026-07-18', positive: 12, neutral: 5, negative: 3, nps: 42 },
  { date: '2026-07-19', positive: 10, neutral: 4, negative: 4, nps: 38 },
  { date: '2026-07-20', positive: 14, neutral: 3, negative: 2, nps: 52 },
  { date: '2026-07-21', positive: 11, neutral: 6, negative: 3, nps: 40 },
  { date: '2026-07-22', positive: 13, neutral: 4, negative: 3, nps: 48 },
  { date: '2026-07-23', positive: 9, neutral: 5, negative: 5, nps: 32 },
  { date: '2026-07-24', positive: 15, neutral: 3, negative: 2, nps: 58 },
  { date: '2026-07-25', positive: 12, neutral: 4, negative: 3, nps: 44 },
  { date: '2026-07-26', positive: 8, neutral: 6, negative: 4, nps: 28 },
  { date: '2026-07-27', positive: 16, neutral: 2, negative: 2, nps: 62 },
  { date: '2026-07-28', positive: 11, neutral: 5, negative: 3, nps: 40 },
  { date: '2026-07-29', positive: 13, neutral: 4, negative: 3, nps: 48 },
  { date: '2026-07-30', positive: 10, neutral: 5, negative: 4, nps: 34 },
  { date: '2026-07-31', positive: 14, neutral: 3, negative: 2, nps: 54 },
  { date: '2026-08-01', positive: 12, neutral: 4, negative: 3, nps: 44 },
  { date: '2026-08-02', positive: 9, neutral: 6, negative: 4, nps: 30 },
  { date: '2026-08-03', positive: 15, neutral: 3, negative: 2, nps: 56 },
  { date: '2026-08-04', positive: 11, neutral: 5, negative: 3, nps: 42 },
  { date: '2026-08-05', positive: 13, neutral: 4, negative: 2, nps: 50 },
  { date: '2026-08-06', positive: 10, neutral: 5, negative: 4, nps: 36 },
  { date: '2026-08-07', positive: 14, neutral: 3, negative: 2, nps: 54 },
  { date: '2026-08-08', positive: 8, neutral: 6, negative: 5, nps: 24 },
  { date: '2026-08-09', positive: 16, neutral: 2, negative: 1, nps: 64 },
  { date: '2026-08-10', positive: 11, neutral: 4, negative: 3, nps: 42 },
  { date: '2026-08-11', positive: 13, neutral: 3, negative: 3, nps: 48 },
  { date: '2026-08-12', positive: 9, neutral: 5, negative: 4, nps: 32 },
  { date: '2026-08-13', positive: 12, neutral: 4, negative: 3, nps: 44 },
  { date: '2026-08-14', positive: 14, neutral: 3, negative: 2, nps: 54 },
  { date: '2026-08-15', positive: 10, neutral: 5, negative: 4, nps: 34 },
  { date: '2026-08-16', positive: 11, neutral: 4, negative: 2, nps: 46 },
];

/* ─── Category Distribution ─── */
export const categoryDistribution = [
  { category: 'product', count: 45, label: 'Product' },
  { category: 'feature', count: 32, label: 'Feature Request' },
  { category: 'support', count: 18, label: 'Support' },
  { category: 'billing', count: 12, label: 'Billing' },
  { category: 'performance', count: 10, label: 'Performance' },
  { category: 'onboarding', count: 8, label: 'Onboarding' },
];

/* ─── NPS Score Distribution ─── */
export const npsDistribution = [
  { score: 0, count: 2 }, { score: 1, count: 1 }, { score: 2, count: 3 },
  { score: 3, count: 4 }, { score: 4, count: 5 }, { score: 5, count: 8 },
  { score: 6, count: 12 }, { score: 7, count: 18 }, { score: 8, count: 24 },
  { score: 9, count: 22 }, { score: 10, count: 16 },
];

/* ─── Metadata ─── */
export const npsCategoryMeta = {
  product: { label: 'Product', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  feature: { label: 'Feature', color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  support: { label: 'Support', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  billing: { label: 'Billing', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
  performance: { label: 'Performance', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  onboarding: { label: 'Onboarding', color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
};

export const sentimentMeta = {
  positive: { label: 'Positive', dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20', iconColor: 'text-accent' },
  neutral: { label: 'Neutral', dot: 'bg-warning', class: 'bg-warning/10 text-warning border-warning/20', iconColor: 'text-warning' },
  negative: { label: 'Negative', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20', iconColor: 'text-danger' },
};

export const featureStatusMeta = {
  backlog: { label: 'Backlog', class: 'bg-neutral/10 text-text-muted border-border', dot: 'bg-text-muted' },
  planned: { label: 'Planned', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  'in-progress': { label: 'In Progress', class: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  shipped: { label: 'Shipped', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
  declined: { label: 'Declined', class: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger' },
};

export const priorityMeta = {
  critical: { label: 'Critical', class: 'bg-danger/10 text-danger border-danger/20' },
  high: { label: 'High', class: 'bg-warning/10 text-warning border-warning/20' },
  medium: { label: 'Medium', class: 'bg-info/10 text-info border-info/20' },
  low: { label: 'Low', class: 'bg-neutral/10 text-text-muted border-border' },
};

export const touchpointMeta = {
  'in-app': { label: 'In-App', icon: 'Monitor' },
  email: { label: 'Email', icon: 'Mail' },
  'post-booking': { label: 'Post-Booking', icon: 'CheckCircle' },
  'post-support': { label: 'Post-Support', icon: 'Headphones' },
};

/* ─── Helpers ─── */
export function calculateNPS(responses) {
  const total = responses.length;
  if (total === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0 };
  const promoters = responses.filter(r => r.score >= 9).length;
  const passives = responses.filter(r => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter(r => r.score <= 6).length;
  const score = Math.round(((promoters - detractors) / total) * 100);
  return { score, promoters, passives, detractors, total };
}

export function getSentimentFromScore(score) {
  if (score >= 0.5) return 'positive';
  if (score <= -0.3) return 'negative';
  return 'neutral';
}

export function formatNpsScore(score) {
  const prefix = score >= 0 ? '+' : '';
  return `${prefix}${score}`;
}

export function getNpsColor(score) {
  if (score >= 50) return 'text-accent';
  if (score >= 30) return 'text-secondary';
  if (score >= 0) return 'text-warning';
  return 'text-danger';
}

export function getNpsBarColor(score) {
  if (score >= 50) return 'bg-accent';
  if (score >= 30) return 'bg-secondary';
  if (score >= 0) return 'bg-warning';
  return 'bg-danger';
}
