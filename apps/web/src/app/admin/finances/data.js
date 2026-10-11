/* src/app/admin/finances/data.js */

/* ─── Revenue Metrics ─── */
export const revenueOverview = {
  mrr: 284750,
  arr: 3417000,
  lastMonthMrr: 271200,
  lastYearArr: 2985000,
  netRevenue: 2847500, // YTD
  grossRevenue: 3122000, // YTD
  refunds: 125000, // YTD
  discounts: 149500, // YTD
};

export const mrrHistory = [
  {
    month: 'Jan 2026',
    mrr: 198000,
    newMrr: 42000,
    expansionMrr: 15000,
    contractionMrr: 8000,
    churnedMrr: 12000,
  },
  {
    month: 'Feb 2026',
    mrr: 215000,
    newMrr: 38000,
    expansionMrr: 18000,
    contractionMrr: 6000,
    churnedMrr: 14000,
  },
  {
    month: 'Mar 2026',
    mrr: 232000,
    newMrr: 45000,
    expansionMrr: 22000,
    contractionMrr: 9000,
    churnedMrr: 11000,
  },
  {
    month: 'Apr 2026',
    mrr: 248000,
    newMrr: 35000,
    expansionMrr: 20000,
    contractionMrr: 7000,
    churnedMrr: 9000,
  },
  {
    month: 'May 2026',
    mrr: 258000,
    newMrr: 28000,
    expansionMrr: 16000,
    contractionMrr: 5000,
    churnedMrr: 13000,
  },
  {
    month: 'Jun 2026',
    mrr: 265000,
    newMrr: 32000,
    expansionMrr: 14000,
    contractionMrr: 8000,
    churnedMrr: 7000,
  },
  {
    month: 'Jul 2026',
    mrr: 271200,
    newMrr: 25000,
    expansionMrr: 18000,
    contractionMrr: 6000,
    churnedMrr: 9000,
  },
  {
    month: 'Aug 2026',
    mrr: 284750,
    newMrr: 30000,
    expansionMrr: 21000,
    contractionMrr: 4000,
    churnedMrr: 8000,
  },
];

export const arrHistory = [
  { year: '2022', arr: 890000, growth: 0 },
  { year: '2023', arr: 1420000, growth: 59.6 },
  { year: '2024', arr: 2150000, growth: 51.4 },
  { year: '2025', arr: 2985000, growth: 38.8 },
  { year: '2026', arr: 3417000, growth: 14.5 },
];

/* ─── Churn Analysis ─── */
export const churnMetrics = {
  logoChurnRate: 4.2, // % monthly
  revenueChurnRate: 3.1, // % monthly
  netRevenueRetention: 108.5, // %
  grossRevenueRetention: 96.9, // %
  avgChurnReasons: [
    { reason: 'Switched to competitor', count: 12, pct: 28.6 },
    { reason: 'Business closed / M&A', count: 8, pct: 19.0 },
    { reason: 'Pricing too high', count: 7, pct: 16.7 },
    { reason: 'Missing features', count: 6, pct: 14.3 },
    { reason: 'Poor onboarding experience', count: 5, pct: 11.9 },
    { reason: 'Other', count: 4, pct: 9.5 },
  ],
};

export const churnHistory = [
  { month: 'Jan 2026', logoChurn: 3.8, revenueChurn: 2.9, nrr: 109.2 },
  { month: 'Feb 2026', logoChurn: 4.5, revenueChurn: 3.4, nrr: 107.8 },
  { month: 'Mar 2026', logoChurn: 3.2, revenueChurn: 2.5, nrr: 110.5 },
  { month: 'Apr 2026', logoChurn: 3.9, revenueChurn: 3.0, nrr: 108.9 },
  { month: 'May 2026', logoChurn: 4.8, revenueChurn: 3.8, nrr: 106.2 },
  { month: 'Jun 2026', logoChurn: 3.5, revenueChurn: 2.7, nrr: 109.8 },
  { month: 'Jul 2026', logoChurn: 4.1, revenueChurn: 3.2, nrr: 107.5 },
  { month: 'Aug 2026', logoChurn: 4.2, revenueChurn: 3.1, nrr: 108.5 },
];

/* ─── Cohort Retention ─── */
export const cohortData = [
  {
    cohort: 'Jan 2025',
    size: 45,
    months: [100, 95.6, 91.1, 88.9, 86.7, 84.4, 82.2, 80.0, 80.0, 77.8, 77.8, 75.6],
  },
  {
    cohort: 'Feb 2025',
    size: 38,
    months: [100, 94.7, 89.5, 86.8, 84.2, 81.6, 78.9, 78.9, 76.3, 76.3, 73.7, null],
  },
  {
    cohort: 'Mar 2025',
    size: 52,
    months: [100, 96.2, 92.3, 90.4, 86.5, 84.6, 82.7, 80.8, 78.8, 76.9, null, null],
  },
  {
    cohort: 'Apr 2025',
    size: 41,
    months: [100, 95.1, 90.2, 87.8, 85.4, 82.9, 80.5, 78.0, 75.6, null, null, null],
  },
  {
    cohort: 'May 2025',
    size: 48,
    months: [100, 93.8, 89.6, 85.4, 83.3, 81.3, 79.2, 77.1, null, null, null, null],
  },
  {
    cohort: 'Jun 2025',
    size: 55,
    months: [100, 94.5, 90.9, 87.3, 85.5, 83.6, 81.8, null, null, null, null, null],
  },
  {
    cohort: 'Jul 2025',
    size: 42,
    months: [100, 95.2, 92.9, 88.1, 85.7, 83.3, null, null, null, null, null, null],
  },
  {
    cohort: 'Aug 2025',
    size: 50,
    months: [100, 96.0, 92.0, 88.0, 86.0, null, null, null, null, null, null, null],
  },
  {
    cohort: 'Sep 2025',
    size: 44,
    months: [100, 93.2, 88.6, 84.1, null, null, null, null, null, null, null, null],
  },
  {
    cohort: 'Oct 2025',
    size: 39,
    months: [100, 94.9, 89.7, null, null, null, null, null, null, null, null, null],
  },
  {
    cohort: 'Nov 2025',
    size: 46,
    months: [100, 93.5, null, null, null, null, null, null, null, null, null, null],
  },
  {
    cohort: 'Dec 2025',
    size: 51,
    months: [100, null, null, null, null, null, null, null, null, null, null, null],
  },
];

/* ─── LTV by Segment ─── */
export const ltvData = [
  {
    segment: 'Enterprise',
    avgLtv: 48500,
    cac: 8200,
    ltvCacRatio: 5.9,
    avgLifetimeMonths: 48,
    monthlyRevenue: 1010,
  },
  {
    segment: 'Professional',
    avgLtv: 14200,
    cac: 2800,
    ltvCacRatio: 5.1,
    avgLifetimeMonths: 36,
    monthlyRevenue: 395,
  },
  {
    segment: 'Starter',
    avgLtv: 3600,
    cac: 650,
    ltvCacRatio: 5.5,
    avgLifetimeMonths: 24,
    monthlyRevenue: 150,
  },
];

export const ltvTrend = [
  { quarter: 'Q1 2025', enterprise: 42000, professional: 12800, starter: 3100 },
  { quarter: 'Q2 2025', enterprise: 44500, professional: 13200, starter: 3300 },
  { quarter: 'Q3 2025', enterprise: 46200, professional: 13600, starter: 3450 },
  { quarter: 'Q4 2025', enterprise: 47800, professional: 14000, starter: 3550 },
  { quarter: 'Q1 2026', enterprise: 48500, professional: 14200, starter: 3600 },
];

/* ─── Revenue Recognition ─── */
export const revenueRecognition = {
  deferredRevenue: 425000,
  recognizedRevenueYtd: 2847500,
  unbilledRevenue: 89000,
  contractLiabilities: 312000,
  performanceObligations: [
    {
      id: 'PO-001',
      customer: 'Grand Hotel Boston',
      amount: 59880,
      period: 'Jan 2026 - Dec 2026',
      recognized: 39920,
      remaining: 19960,
    },
    {
      id: 'PO-002',
      customer: 'Seaside Resort Miami',
      amount: 5988,
      period: 'Jun 2026 - May 2027',
      recognized: 2495,
      remaining: 3493,
    },
    {
      id: 'PO-003',
      customer: 'Urban Hotel NYC',
      amount: 5988,
      period: 'Apr 2026 - Mar 2027',
      recognized: 3992,
      remaining: 1996,
    },
    {
      id: 'PO-004',
      customer: 'Coastal Inn San Diego',
      amount: 2388,
      period: 'Sep 2025 - Aug 2026',
      recognized: 1990,
      remaining: 398,
    },
    {
      id: 'PO-005',
      customer: 'Lakeside Resort Tahoe',
      amount: 0,
      period: 'Pending contract start',
      recognized: 0,
      remaining: 0,
    },
  ],
};

/* ─── Payment Gateway Health ─── */
export const paymentGateways = [
  {
    id: 'gw-stripe',
    name: 'Stripe',
    status: 'healthy',
    uptime: '99.99%',
    successRate: 98.7,
    avgProcessingTime: 245, // ms
    volumeToday: 12450,
    volumeMonth: 284500,
    failuresToday: 162,
    lastIncident: '2026-07-15',
    methods: ['card', 'ach', 'apple_pay', 'google_pay'],
  },
  {
    id: 'gw-paypal',
    name: 'PayPal',
    status: 'healthy',
    uptime: '99.95%',
    successRate: 97.2,
    avgProcessingTime: 420, // ms
    volumeToday: 3840,
    volumeMonth: 89200,
    failuresToday: 107,
    lastIncident: '2026-06-22',
    methods: ['paypal', 'venmo', 'pay_later'],
  },
  {
    id: 'gw-adyen',
    name: 'Adyen',
    status: 'degraded',
    uptime: '98.72%',
    successRate: 94.5,
    avgProcessingTime: 680, // ms
    volumeToday: 2150,
    volumeMonth: 56700,
    failuresToday: 118,
    lastIncident: '2026-08-14',
    methods: ['card', 'ideal', 'sofort', 'bancontact'],
    alert: 'Elevated latency on EU card processing',
  },
];

export const paymentMethodDistribution = [
  { method: 'Visa', pct: 34.2, volume: 145200 },
  { method: 'Mastercard', pct: 28.7, volume: 121800 },
  { method: 'Amex', pct: 12.4, volume: 52600 },
  { method: 'ACH / Bank Transfer', pct: 10.8, volume: 45800 },
  { method: 'PayPal', pct: 8.5, volume: 36000 },
  { method: 'Other', pct: 5.4, volume: 22900 },
];

/* ─── Tax Reporting ─── */
export const taxSummary = {
  totalTaxCollectedYtd: 284750,
  totalTaxRemittedYtd: 256275,
  pendingRemittance: 28475,
  jurisdictions: [
    { country: 'US', state: 'CA', rate: 8.25, collected: 45200, remitted: 40680, pending: 4520 },
    { country: 'US', state: 'NY', rate: 8.875, collected: 38900, remitted: 35010, pending: 3890 },
    { country: 'US', state: 'TX', rate: 6.25, collected: 28400, remitted: 25560, pending: 2840 },
    { country: 'US', state: 'FL', rate: 6.0, collected: 22100, remitted: 19890, pending: 2210 },
    { country: 'GB', state: null, rate: 20.0, collected: 56800, remitted: 51120, pending: 5680 },
    { country: 'DE', state: null, rate: 19.0, collected: 42500, remitted: 38250, pending: 4250 },
    { country: 'FR', state: null, rate: 20.0, collected: 31200, remitted: 28080, pending: 3120 },
    { country: 'CA', state: 'ON', rate: 13.0, collected: 19650, remitted: 17685, pending: 1965 },
  ],
};

/* ─── Forecast Modeling ─── */
export const forecastData = {
  currentMrr: 284750,
  forecastPeriods: [
    { month: 'Sep 2026', optimistic: 312000, realistic: 298000, conservative: 288000 },
    { month: 'Oct 2026', optimistic: 325000, realistic: 308000, conservative: 294000 },
    { month: 'Nov 2026', optimistic: 340000, realistic: 320000, conservative: 302000 },
    { month: 'Dec 2026', optimistic: 358000, realistic: 335000, conservative: 312000 },
    { month: 'Jan 2027', optimistic: 372000, realistic: 348000, conservative: 322000 },
    { month: 'Feb 2027', optimistic: 388000, realistic: 362000, conservative: 332000 },
    { month: 'Mar 2027', optimistic: 405000, realistic: 378000, conservative: 344000 },
    { month: 'Apr 2027', optimistic: 422000, realistic: 392000, conservative: 356000 },
    { month: 'May 2027', optimistic: 440000, realistic: 408000, conservative: 368000 },
    { month: 'Jun 2027', optimistic: 458000, realistic: 425000, conservative: 380000 },
    { month: 'Jul 2027', optimistic: 478000, realistic: 440000, conservative: 392000 },
    { month: 'Aug 2027', optimistic: 498000, realistic: 458000, conservative: 405000 },
  ],
  assumptions: {
    newCustomerGrowth: 5.2, // % monthly
    avgExpansionRate: 2.1, // % monthly
    churnRate: 3.5, // % monthly
    avgSellingPriceGrowth: 1.8, // % quarterly
  },
};

/* ─── Plan Distribution ─── */
export const planDistribution = [
  { plan: 'Starter', customers: 284, mrr: 56516, pct: 19.8 },
  { plan: 'Professional', customers: 156, mrr: 77844, pct: 27.3 },
  { plan: 'Enterprise', customers: 42, mrr: 150390, pct: 52.8 },
];

/* ─── Helpers ─── */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ZAR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

export function getMrrChangeColor(current, previous) {
  const change = ((current - previous) / previous) * 100;
  return change >= 0 ? 'text-accent' : 'text-danger';
}

export function getMrrChangeTrend(current, previous) {
  return current >= previous ? 'text-accent' : 'text-danger';
}

export const gatewayStatusMeta = {
  healthy: {
    label: 'Healthy',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  degraded: {
    label: 'Degraded',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

export const cohortColorScale = [
  'bg-emerald-500',
  'bg-emerald-400',
  'bg-emerald-300',
  'bg-emerald-200',
  'bg-teal-300',
  'bg-teal-200',
  'bg-cyan-300',
  'bg-cyan-200',
  'bg-sky-300',
  'bg-sky-200',
  'bg-blue-300',
  'bg-blue-200',
];
