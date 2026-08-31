/* src/app/admin/analytics/data.js */

/* ─── Feature Usage Heatmap Data ─── */
export const featureUsageHeatmap = [
  // Rows = features, Cols = hours of day (0-23)
  {
    feature: 'Reservations',
    category: 'operations',
    totalEvents: 284500,
    uniqueUsers: 420,
    avgSessionMin: 12.4,
    hourly: [
      12, 8, 5, 3, 2, 4, 18, 45, 78, 92, 85, 88, 95, 90, 82, 75, 68, 55, 42, 35, 28, 22, 18, 15,
    ],
  },
  {
    feature: 'Front Desk',
    category: 'operations',
    totalEvents: 198200,
    uniqueUsers: 380,
    avgSessionMin: 8.2,
    hourly: [
      8, 5, 3, 2, 1, 3, 12, 38, 65, 72, 68, 70, 75, 72, 65, 58, 48, 38, 28, 22, 18, 15, 12, 10,
    ],
  },
  {
    feature: 'Room Plan',
    category: 'operations',
    totalEvents: 156800,
    uniqueUsers: 310,
    avgSessionMin: 6.5,
    hourly: [5, 3, 2, 1, 1, 2, 8, 28, 52, 58, 55, 56, 60, 58, 52, 45, 38, 30, 22, 18, 14, 10, 8, 6],
  },
  {
    feature: 'Billing',
    category: 'operations',
    totalEvents: 124600,
    uniqueUsers: 290,
    avgSessionMin: 9.8,
    hourly: [2, 1, 1, 0, 0, 1, 4, 15, 32, 38, 35, 36, 40, 38, 35, 32, 28, 25, 20, 18, 12, 8, 5, 3],
  },
  {
    feature: 'Reports',
    category: 'management',
    totalEvents: 98700,
    uniqueUsers: 180,
    avgSessionMin: 15.6,
    hourly: [2, 1, 1, 0, 0, 1, 3, 12, 28, 35, 32, 30, 28, 25, 22, 20, 18, 15, 12, 10, 8, 6, 4, 3],
  },
  {
    feature: 'Housekeeping',
    category: 'operations',
    totalEvents: 87600,
    uniqueUsers: 220,
    avgSessionMin: 5.2,
    hourly: [15, 8, 3, 1, 1, 2, 12, 35, 48, 42, 38, 35, 32, 30, 28, 25, 22, 18, 12, 8, 6, 5, 8, 12],
  },
  {
    feature: 'Night Audit',
    category: 'management',
    totalEvents: 45200,
    uniqueUsers: 95,
    avgSessionMin: 22.8,
    hourly: [45, 38, 25, 12, 5, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 5, 12, 22, 32, 42],
  },
  {
    feature: 'Channel Manager',
    category: 'management',
    totalEvents: 72400,
    uniqueUsers: 140,
    avgSessionMin: 7.4,
    hourly: [3, 2, 1, 1, 1, 2, 5, 15, 28, 32, 30, 28, 25, 22, 20, 18, 15, 12, 10, 8, 6, 5, 4, 3],
  },
  {
    feature: 'Guest Portal',
    category: 'guest-experience',
    totalEvents: 342000,
    uniqueUsers: 1850,
    avgSessionMin: 4.2,
    hourly: [
      8, 5, 3, 2, 2, 3, 8, 18, 35, 42, 45, 48, 52, 50, 48, 45, 42, 38, 32, 28, 22, 18, 14, 10,
    ],
  },
  {
    feature: 'Analytics',
    category: 'management',
    totalEvents: 56800,
    uniqueUsers: 120,
    avgSessionMin: 18.5,
    hourly: [2, 1, 1, 0, 0, 1, 2, 8, 18, 22, 20, 18, 16, 15, 14, 12, 10, 8, 6, 5, 4, 3, 2, 2],
  },
  {
    feature: 'Settings',
    category: 'system',
    totalEvents: 42300,
    uniqueUsers: 85,
    avgSessionMin: 11.2,
    hourly: [1, 1, 0, 0, 0, 0, 1, 3, 8, 10, 9, 8, 7, 6, 6, 5, 5, 4, 3, 3, 2, 2, 1, 1],
  },
  {
    feature: 'Loyalty',
    category: 'marketing',
    totalEvents: 38900,
    uniqueUsers: 110,
    avgSessionMin: 6.8,
    hourly: [1, 1, 0, 0, 0, 0, 1, 4, 10, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 3, 2, 2, 1, 1],
  },
];

/* ─── Funnel Analysis Data ─── */
export const funnelData = [
  {
    id: 'funnel-onboarding',
    name: 'Property Onboarding',
    description: 'From signup to first reservation created',
    steps: [
      { name: 'Account Created', count: 1240, dropOff: 0 },
      { name: 'Property Setup', count: 1085, dropOff: 12.5 },
      { name: 'Room Types Added', count: 920, dropOff: 15.2 },
      { name: 'First Booking', count: 745, dropOff: 19.0 },
      { name: 'Payment Configured', count: 580, dropOff: 22.1 },
    ],
    totalConversion: 46.8,
    avgTimeDays: 3.2,
  },
  {
    id: 'funnel-reservation',
    name: 'Reservation Flow',
    description: 'From search to confirmed booking',
    steps: [
      { name: 'Search Dates', count: 8450, dropOff: 0 },
      { name: 'Select Room', count: 6820, dropOff: 19.3 },
      { name: 'Enter Guest Info', count: 5240, dropOff: 23.2 },
      { name: 'Review Booking', count: 4180, dropOff: 20.2 },
      { name: 'Payment', count: 3120, dropOff: 25.4 },
      { name: 'Confirmed', count: 2890, dropOff: 7.4 },
    ],
    totalConversion: 34.2,
    avgTimeMin: 4.8,
  },
  {
    id: 'funnel-checkin',
    name: 'Mobile Check-in',
    description: 'Guest self-service check-in flow',
    steps: [
      { name: 'Check-in Link Opened', count: 3250, dropOff: 0 },
      { name: 'ID Uploaded', count: 2840, dropOff: 12.6 },
      { name: 'Payment Method Added', count: 2180, dropOff: 23.2 },
      { name: 'Terms Accepted', count: 1950, dropOff: 10.6 },
      { name: 'Key Generated', count: 1680, dropOff: 13.8 },
    ],
    totalConversion: 51.7,
    avgTimeMin: 3.5,
  },
  {
    id: 'funnel-upgrade',
    name: 'Plan Upgrade',
    description: 'From trial to paid subscription',
    steps: [
      { name: 'Trial Started', count: 480, dropOff: 0 },
      { name: 'Feature Discovery', count: 385, dropOff: 19.8 },
      { name: 'Upgrade Page Viewed', count: 220, dropOff: 42.9 },
      { name: 'Plan Selected', count: 145, dropOff: 34.1 },
      { name: 'Payment Entered', count: 98, dropOff: 32.4 },
      { name: 'Subscribed', count: 82, dropOff: 16.3 },
    ],
    totalConversion: 17.1,
    avgTimeDays: 8.5,
  },
];

/* ─── Session Duration Distribution ─── */
export const sessionDurationDistribution = [
  { range: '0-30s', count: 2840, percentage: 18.2 },
  { range: '30s-2m', count: 3620, percentage: 23.2 },
  { range: '2-5m', count: 4120, percentage: 26.4 },
  { range: '5-15m', count: 3150, percentage: 20.2 },
  { range: '15-30m', count: 1420, percentage: 9.1 },
  { range: '30m-1h', count: 380, percentage: 2.4 },
  { range: '1h+', count: 80, percentage: 0.5 },
];

/* ─── Engagement Scores ─── */
export const engagementScores = [
  {
    tenantId: 'TNT-001',
    tenantName: 'Grand Hotel Boston',
    plan: 'Enterprise',
    score: 94,
    classification: 'power',
    sessionsPerWeek: 45,
    avgSessionMin: 18.5,
    featuresUsed: 11,
    lastActive: '2026-08-16 14:32',
    trend: '+3.2',
    breakdown: { daily: 28, weekly: 35, retention: 42, depth: 48 },
  },
  {
    tenantId: 'TNT-002',
    tenantName: 'Seaside Resort Miami',
    plan: 'Professional',
    score: 87,
    classification: 'power',
    sessionsPerWeek: 38,
    avgSessionMin: 14.2,
    featuresUsed: 9,
    lastActive: '2026-08-16 13:45',
    trend: '+1.8',
    breakdown: { daily: 25, weekly: 32, retention: 38, depth: 42 },
  },
  {
    tenantId: 'TNT-007',
    tenantName: 'Urban Hotel NYC',
    plan: 'Professional',
    score: 82,
    classification: 'engaged',
    sessionsPerWeek: 32,
    avgSessionMin: 12.8,
    featuresUsed: 8,
    lastActive: '2026-08-16 15:10',
    trend: '+0.5',
    breakdown: { daily: 22, weekly: 28, retention: 35, depth: 38 },
  },
  {
    tenantId: 'TNT-005',
    tenantName: 'Coastal Inn San Diego',
    plan: 'Starter',
    score: 68,
    classification: 'engaged',
    sessionsPerWeek: 22,
    avgSessionMin: 9.4,
    featuresUsed: 5,
    lastActive: '2026-08-16 10:05',
    trend: '-1.2',
    breakdown: { daily: 18, weekly: 24, retention: 28, depth: 30 },
  },
  {
    tenantId: 'TNT-003',
    tenantName: 'Mountain Lodge Aspen',
    plan: 'Professional',
    score: 52,
    classification: 'at-risk',
    sessionsPerWeek: 12,
    avgSessionMin: 6.2,
    featuresUsed: 4,
    lastActive: '2026-08-16 11:20',
    trend: '-4.5',
    breakdown: { daily: 12, weekly: 18, retention: 20, depth: 22 },
  },
  {
    tenantId: 'TNT-004',
    tenantName: 'Downtown Suites Chicago',
    plan: 'Starter',
    score: 34,
    classification: 'at-risk',
    sessionsPerWeek: 8,
    avgSessionMin: 4.5,
    featuresUsed: 3,
    lastActive: '2026-07-28 09:15',
    trend: '-8.2',
    breakdown: { daily: 8, weekly: 12, retention: 14, depth: 16 },
  },
  {
    tenantId: 'TNT-006',
    tenantName: 'Lakeside Resort Tahoe',
    plan: 'Enterprise',
    score: 28,
    classification: 'dormant',
    sessionsPerWeek: 3,
    avgSessionMin: 3.8,
    featuresUsed: 2,
    lastActive: '2026-08-14 16:30',
    trend: '-12.0',
    breakdown: { daily: 5, weekly: 8, retention: 10, depth: 12 },
  },
  {
    tenantId: 'TNT-008',
    tenantName: 'Desert Oasis Phoenix',
    plan: 'Starter',
    score: 12,
    classification: 'dormant',
    sessionsPerWeek: 0,
    avgSessionMin: 0,
    featuresUsed: 0,
    lastActive: '2026-05-15 08:00',
    trend: '-15.0',
    breakdown: { daily: 2, weekly: 4, retention: 5, depth: 6 },
  },
];

/* ─── Drop-off Points ─── */
export const dropOffPoints = [
  {
    id: 'drop-001',
    location: 'Reservation → Select Room',
    funnel: 'funnel-reservation',
    dropOffRate: 19.3,
    affectedUsers: 1630,
    reason: 'No availability for selected dates',
    severity: 'high',
    suggestedFix: 'Show alternative dates or nearby properties',
    impact: '$48,200/mo potential revenue',
  },
  {
    id: 'drop-002',
    location: 'Upgrade → Plan Selected',
    funnel: 'funnel-upgrade',
    dropOffRate: 42.9,
    affectedUsers: 165,
    reason: 'Pricing not transparent enough',
    severity: 'critical',
    suggestedFix: 'Add ROI calculator and feature comparison',
    impact: '$12,400/mo potential MRR',
  },
  {
    id: 'drop-003',
    location: 'Check-in → Payment Method',
    funnel: 'funnel-checkin',
    dropOffRate: 23.2,
    affectedUsers: 660,
    reason: 'Mobile payment form too complex',
    severity: 'high',
    suggestedFix: 'Simplify to single-field card entry with Apple/Google Pay',
    impact: 'Guest satisfaction score -12%',
  },
  {
    id: 'drop-004',
    location: 'Onboarding → Room Types Added',
    funnel: 'funnel-onboarding',
    dropOffRate: 15.2,
    affectedUsers: 165,
    reason: 'Unclear what room types to create',
    severity: 'medium',
    suggestedFix: 'Add template suggestions based on property size',
    impact: '15% faster time-to-first-booking',
  },
  {
    id: 'drop-005',
    location: 'Reservation → Payment',
    funnel: 'funnel-reservation',
    dropOffRate: 25.4,
    affectedUsers: 1060,
    reason: 'Payment processing errors',
    severity: 'critical',
    suggestedFix: 'Implement retry logic and alternative payment methods',
    impact: '$31,800/mo potential revenue',
  },
  {
    id: 'drop-006',
    location: 'Billing → Invoice View',
    funnel: 'internal',
    dropOffRate: 35.0,
    affectedUsers: 420,
    reason: 'Invoice PDF generation slow (>5s)',
    severity: 'medium',
    suggestedFix: 'Pre-generate PDFs and add loading state',
    impact: 'Support tickets -25%',
  },
  {
    id: 'drop-007',
    location: 'Reports → Export',
    funnel: 'internal',
    dropOffRate: 28.0,
    affectedUsers: 280,
    reason: 'Export format limited to CSV only',
    severity: 'low',
    suggestedFix: 'Add Excel and PDF export options',
    impact: 'User satisfaction +8%',
  },
];

/* ─── Weekly Active Users Trend ─── */
export const wauTrend = [
  { week: 'W1 Jun', wau: 1850, newUsers: 120, returning: 1730 },
  { week: 'W2 Jun', wau: 1920, newUsers: 135, returning: 1785 },
  { week: 'W3 Jun', wau: 1880, newUsers: 98, returning: 1782 },
  { week: 'W4 Jun', wau: 2010, newUsers: 142, returning: 1868 },
  { week: 'W1 Jul', wau: 2100, newUsers: 155, returning: 1945 },
  { week: 'W2 Jul', wau: 2050, newUsers: 110, returning: 1940 },
  { week: 'W3 Jul', wau: 2180, newUsers: 168, returning: 2012 },
  { week: 'W4 Jul', wau: 2240, newUsers: 175, returning: 2065 },
  { week: 'W1 Aug', wau: 2300, newUsers: 180, returning: 2120 },
  { week: 'W2 Aug', wau: 2380, newUsers: 195, returning: 2185 },
  { week: 'W3 Aug', wau: 2420, newUsers: 185, returning: 2235 },
  { week: 'W4 Aug', wau: 2480, newUsers: 200, returning: 2280 },
];

/* ─── Daily Active Users (last 30 days) ─── */
export const dauTrend = [
  { date: '2026-07-18', dau: 420, sessions: 1250 },
  { date: '2026-07-19', dau: 445, sessions: 1320 },
  { date: '2026-07-20', dau: 438, sessions: 1280 },
  { date: '2026-07-21', dau: 460, sessions: 1380 },
  { date: '2026-07-22', dau: 455, sessions: 1350 },
  { date: '2026-07-23', dau: 480, sessions: 1420 },
  { date: '2026-07-24', dau: 475, sessions: 1400 },
  { date: '2026-07-25', dau: 490, sessions: 1480 },
  { date: '2026-07-26', dau: 485, sessions: 1450 },
  { date: '2026-07-27', dau: 510, sessions: 1520 },
  { date: '2026-07-28', dau: 505, sessions: 1500 },
  { date: '2026-07-29', dau: 520, sessions: 1580 },
  { date: '2026-07-30', dau: 515, sessions: 1550 },
  { date: '2026-07-31', dau: 530, sessions: 1620 },
  { date: '2026-08-01', dau: 525, sessions: 1600 },
  { date: '2026-08-02', dau: 540, sessions: 1650 },
  { date: '2026-08-03', dau: 535, sessions: 1630 },
  { date: '2026-08-04', dau: 550, sessions: 1700 },
  { date: '2026-08-05', dau: 545, sessions: 1680 },
  { date: '2026-08-06', dau: 560, sessions: 1750 },
  { date: '2026-08-07', dau: 555, sessions: 1720 },
  { date: '2026-08-08', dau: 570, sessions: 1780 },
  { date: '2026-08-09', dau: 565, sessions: 1760 },
  { date: '2026-08-10', dau: 580, sessions: 1820 },
  { date: '2026-08-11', dau: 575, sessions: 1800 },
  { date: '2026-08-12', dau: 590, sessions: 1850 },
  { date: '2026-08-13', dau: 585, sessions: 1830 },
  { date: '2026-08-14', dau: 600, sessions: 1900 },
  { date: '2026-08-15', dau: 595, sessions: 1880 },
  { date: '2026-08-16', dau: 610, sessions: 1920 },
];

/* ─── Power Users (top 10%) ─── */
export const powerUsers = [
  {
    tenantId: 'TNT-001',
    name: 'Grand Hotel Boston',
    score: 94,
    streakDays: 45,
    commandsUsed: 2840,
  },
  {
    tenantId: 'TNT-002',
    name: 'Seaside Resort Miami',
    score: 87,
    streakDays: 38,
    commandsUsed: 2150,
  },
  { tenantId: 'TNT-007', name: 'Urban Hotel NYC', score: 82, streakDays: 32, commandsUsed: 1890 },
  {
    tenantId: 'TNT-005',
    name: 'Coastal Inn San Diego',
    score: 68,
    streakDays: 22,
    commandsUsed: 1240,
  },
];

/* ─── Metadata ─── */
export const classificationMeta = {
  power: {
    label: 'Power User',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    dot: 'bg-purple-500',
  },
  engaged: {
    label: 'Engaged',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
  'at-risk': {
    label: 'At Risk',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    dot: 'bg-warning',
  },
  dormant: {
    label: 'Dormant',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
};

export const severityMeta = {
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

export const categoryMeta = {
  operations: { label: 'Operations', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  management: { label: 'Management', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'guest-experience': { label: 'Guest Experience', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  marketing: { label: 'Marketing', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  system: { label: 'System', color: 'text-text-muted', bg: 'bg-neutral/10' },
};

/* ─── Helpers ─── */
export function getHeatmapColor(value, max) {
  const ratio = value / max;
  if (ratio > 0.8) return 'bg-purple-500';
  if (ratio > 0.6) return 'bg-secondary';
  if (ratio > 0.4) return 'bg-accent';
  if (ratio > 0.2) return 'bg-info';
  if (ratio > 0.05) return 'bg-warning/60';
  return 'bg-border';
}

export function getUsageBarColor(usagePercentage) {
  if (usagePercentage >= 90) return 'bg-danger';
  if (usagePercentage >= 75) return 'bg-warning';
  if (usagePercentage >= 50) return 'bg-info';
  return 'bg-accent';
}

export function getHeatmapIntensity(value, max) {
  const ratio = value / max;
  if (ratio === 0) return 'None';
  if (ratio > 0.2) return 'Very Low';
  if (ratio > 0.4) return 'Low';
  if (ratio > 0.6) return 'Medium';
  if (ratio > 0.8) return 'High';
  return 'Minimal';
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
