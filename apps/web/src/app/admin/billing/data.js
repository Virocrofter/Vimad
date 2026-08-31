/* src/app/admin/billing/data.js */

/* ─── Revenue Metrics ─── */
export const revenueOverview = {
  mrr: 284750,
  arr: 3417000,
  lastMonthMrr: 271200,
  mrrGrowth: 5.0,
  churnRate: 2.3,
  churnRateLastMonth: 3.1,
  netRevenueRetention: 108.4,
  netRevenueRetentionLastMonth: 105.2,
  activeSubscriptions: 847,
  trialSubscriptions: 34,
  cancelledThisMonth: 12,
  avgRevenuePerUser: 336,
  lifetimeValue: 12480,
  customerAcquisitionCost: 420,
  paybackPeriod: 1.25,
};

export const mrrHistory = [
  { month: 'Jan 2026', mrr: 198500, new: 18500, expansion: 8200, contraction: 4300, churn: 6200 },
  { month: 'Feb 2026', mrr: 214700, new: 22100, expansion: 9500, contraction: 3800, churn: 5800 },
  { month: 'Mar 2026', mrr: 235400, new: 26800, expansion: 11200, contraction: 5200, churn: 7100 },
  { month: 'Apr 2026', mrr: 251800, new: 19500, expansion: 12800, contraction: 6100, churn: 6800 },
  { month: 'May 2026', mrr: 271200, new: 28400, expansion: 14500, contraction: 7200, churn: 8300 },
  { month: 'Jun 2026', mrr: 284750, new: 22100, expansion: 13200, contraction: 5800, churn: 6950 },
];

export const revenueByPlan = [
  { plan: 'Starter', mrr: 42700, subscribers: 214, avgMrr: 199, color: '#3b82f6' },
  { plan: 'Professional', mrr: 142800, subscribers: 286, avgMrr: 499, color: '#8b5cf6' },
  { plan: 'Enterprise', mrr: 99250, subscribers: 99, avgMrr: 1002, color: '#10b981' },
  { plan: 'Custom', mrr: 0, subscribers: 248, avgMrr: 0, color: '#f59e0b' },
];

/* ─── Subscriptions ─── */
export const subscriptions = [
  {
    id: 'SUB-001',
    tenantId: 'TNT-001',
    tenantName: 'Grand Hotel Boston',
    plan: 'Enterprise',
    status: 'active',
    billingCycle: 'monthly',
    startDate: '2025-03-15',
    nextBillingDate: '2026-09-12',
    amount: 4990,
    seats: 18,
    addOns: [
      { name: 'AI Revenue Manager', amount: 500, quantity: 1 },
      { name: 'Advanced Analytics', amount: 300, quantity: 1 },
    ],
    discount: { type: 'percentage', value: 10, reason: 'Annual commitment' },
    prorationEnabled: true,
    autoRenew: true,
    paymentMethod: 'Visa •••• 4242',
    billingEmail: 'billing@grandhotel.com',
    taxRate: 6.25,
    taxRegion: 'MA',
    metadata: { contractTerm: 'annual', signedDate: '2025-03-10' },
  },
  {
    id: 'SUB-002',
    tenantId: 'TNT-002',
    tenantName: 'Seaside Resort Miami',
    plan: 'Professional',
    status: 'active',
    billingCycle: 'monthly',
    startDate: '2025-06-20',
    nextBillingDate: '2026-08-20',
    amount: 499,
    seats: 12,
    addOns: [{ name: 'Channel Manager Premium', amount: 99, quantity: 1 }],
    discount: null,
    prorationEnabled: true,
    autoRenew: true,
    paymentMethod: 'Mastercard •••• 8891',
    billingEmail: 'finance@seasideresort.com',
    taxRate: 7.0,
    taxRegion: 'FL',
    metadata: { contractTerm: 'monthly' },
  },
  {
    id: 'SUB-003',
    tenantId: 'TNT-003',
    tenantName: 'Mountain Lodge Aspen',
    plan: 'Professional',
    status: 'trial',
    billingCycle: 'monthly',
    startDate: '2026-08-01',
    nextBillingDate: '2026-08-15',
    amount: 0,
    seats: 6,
    addOns: [],
    discount: null,
    prorationEnabled: true,
    autoRenew: true,
    paymentMethod: null,
    billingEmail: 'james@mountainlodge.com',
    taxRate: 2.9,
    taxRegion: 'CO',
    metadata: { trialEndsAt: '2026-08-15', trialStartedAt: '2026-08-01' },
  },
  {
    id: 'SUB-004',
    tenantId: 'TNT-004',
    tenantName: 'Downtown Suites Chicago',
    plan: 'Starter',
    status: 'past_due',
    billingCycle: 'monthly',
    startDate: '2025-01-10',
    nextBillingDate: '2026-08-12',
    amount: 199,
    seats: 4,
    addOns: [],
    discount: null,
    prorationEnabled: true,
    autoRenew: true,
    paymentMethod: 'Visa •••• 4242',
    billingEmail: 'lisa@downtownsuites.com',
    taxRate: 10.25,
    taxRegion: 'IL',
    metadata: { pastDueSince: '2026-07-12', retryCount: 3 },
  },
  {
    id: 'SUB-005',
    tenantId: 'TNT-005',
    tenantName: 'Coastal Inn San Diego',
    plan: 'Starter',
    status: 'active',
    billingCycle: 'annual',
    startDate: '2025-09-05',
    nextBillingDate: '2026-09-05',
    amount: 199,
    seats: 3,
    addOns: [{ name: 'Guest Portal Pro', amount: 49, quantity: 1 }],
    discount: { type: 'fixed', value: 200, reason: 'Annual prepay' },
    prorationEnabled: true,
    autoRenew: true,
    paymentMethod: 'ACH',
    billingEmail: 'david@coastalinn.com',
    taxRate: 7.75,
    taxRegion: 'CA',
    metadata: { contractTerm: 'annual' },
  },
  {
    id: 'SUB-006',
    tenantId: 'TNT-006',
    tenantName: 'Lakeside Resort Tahoe',
    plan: 'Enterprise',
    status: 'pending',
    billingCycle: 'annual',
    startDate: '2026-08-14',
    nextBillingDate: '2026-09-14',
    amount: 0,
    seats: 25,
    addOns: [],
    discount: { type: 'percentage', value: 15, reason: 'Volume discount' },
    prorationEnabled: true,
    autoRenew: true,
    paymentMethod: null,
    billingEmail: 'amanda@lakesideresort.com',
    taxRate: 7.25,
    taxRegion: 'CA',
    metadata: { contractTerm: 'annual', onboardingInProgress: true },
  },
  {
    id: 'SUB-007',
    tenantId: 'TNT-007',
    tenantName: 'Urban Hotel NYC',
    plan: 'Professional',
    status: 'active',
    billingCycle: 'monthly',
    startDate: '2025-04-22',
    nextBillingDate: '2026-08-22',
    amount: 499,
    seats: 15,
    addOns: [
      { name: 'Marketing Automation', amount: 149, quantity: 1 },
      { name: 'SMS Notifications', amount: 79, quantity: 1 },
    ],
    discount: null,
    prorationEnabled: true,
    autoRenew: true,
    paymentMethod: 'Amex •••• 1001',
    billingEmail: 'kevin@urbanhotel.com',
    taxRate: 8.875,
    taxRegion: 'NY',
    metadata: { contractTerm: 'monthly' },
  },
  {
    id: 'SUB-008',
    tenantId: 'TNT-008',
    tenantName: 'Desert Oasis Phoenix',
    plan: 'Starter',
    status: 'cancelled',
    billingCycle: 'monthly',
    startDate: '2024-11-01',
    nextBillingDate: null,
    amount: 0,
    seats: 0,
    addOns: [],
    discount: null,
    prorationEnabled: false,
    autoRenew: false,
    paymentMethod: null,
    billingEmail: 'priya@desertoasis.com',
    taxRate: 5.6,
    taxRegion: 'AZ',
    metadata: { cancelledAt: '2026-05-15', cancellationReason: 'Switched to competitor' },
  },
];

/* ─── Invoices ─── */
export const invoices = [
  {
    id: 'INV-2026-0812-001',
    subscriptionId: 'SUB-001',
    tenantName: 'Grand Hotel Boston',
    amount: 5289.38,
    subtotal: 4990,
    tax: 299.38,
    status: 'paid',
    dueDate: '2026-08-12',
    paidDate: '2026-08-12',
    paymentMethod: 'Visa •••• 4242',
    lineItems: [
      { description: 'Enterprise Plan (18 seats)', quantity: 1, unitPrice: 4990, amount: 4990 },
      { description: 'AI Revenue Manager', quantity: 1, unitPrice: 500, amount: 500 },
      { description: 'Advanced Analytics', quantity: 1, unitPrice: 300, amount: 300 },
      { description: 'Annual commitment discount', quantity: 1, unitPrice: -579, amount: -579 },
      { description: 'Tax (MA 6.25%)', quantity: 1, unitPrice: 299.38, amount: 299.38 },
    ],
    periodStart: '2026-08-12',
    periodEnd: '2026-09-12',
    pdfUrl: '#',
    sentAt: '2026-08-12T00:00:00Z',
  },
  {
    id: 'INV-2026-0820-002',
    subscriptionId: 'SUB-002',
    tenantName: 'Seaside Resort Miami',
    amount: 639.87,
    subtotal: 598,
    tax: 41.87,
    status: 'paid',
    dueDate: '2026-08-20',
    paidDate: '2026-08-20',
    paymentMethod: 'Mastercard •••• 8891',
    lineItems: [
      { description: 'Professional Plan (12 seats)', quantity: 1, unitPrice: 499, amount: 499 },
      { description: 'Channel Manager Premium', quantity: 1, unitPrice: 99, amount: 99 },
      { description: 'Tax (FL 7.0%)', quantity: 1, unitPrice: 41.87, amount: 41.87 },
    ],
    periodStart: '2026-08-20',
    periodEnd: '2026-09-20',
    pdfUrl: '#',
    sentAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'INV-2026-0812-003',
    subscriptionId: 'SUB-004',
    tenantName: 'Downtown Suites Chicago',
    amount: 219.4,
    subtotal: 199,
    tax: 20.4,
    status: 'overdue',
    dueDate: '2026-08-12',
    paidDate: null,
    paymentMethod: 'Visa •••• 4242',
    lineItems: [
      { description: 'Starter Plan (4 seats)', quantity: 1, unitPrice: 199, amount: 199 },
      { description: 'Tax (IL 10.25%)', quantity: 1, unitPrice: 20.4, amount: 20.4 },
    ],
    periodStart: '2026-07-12',
    periodEnd: '2026-08-12',
    pdfUrl: '#',
    sentAt: '2026-08-12T00:00:00Z',
  },
  {
    id: 'INV-2026-0905-004',
    subscriptionId: 'SUB-005',
    tenantName: 'Coastal Inn San Diego',
    amount: 2369.27,
    subtotal: 2199,
    tax: 170.27,
    status: 'draft',
    dueDate: '2026-09-05',
    paidDate: null,
    paymentMethod: 'ACH',
    lineItems: [
      { description: 'Starter Plan Annual (3 seats)', quantity: 1, unitPrice: 199, amount: 2388 },
      { description: 'Guest Portal Pro', quantity: 1, unitPrice: 49, amount: 588 },
      { description: 'Annual prepay discount', quantity: 1, unitPrice: -200, amount: -200 },
      { description: 'Proration adjustment', quantity: 1, unitPrice: -577, amount: -577 },
      { description: 'Tax (CA 7.75%)', quantity: 1, unitPrice: 170.27, amount: 170.27 },
    ],
    periodStart: '2026-09-05',
    periodEnd: '2027-09-05',
    pdfUrl: '#',
    sentAt: null,
  },
  {
    id: 'INV-2026-0822-005',
    subscriptionId: 'SUB-007',
    tenantName: 'Urban Hotel NYC',
    amount: 789.11,
    subtotal: 727,
    tax: 62.11,
    status: 'pending',
    dueDate: '2026-08-22',
    paidDate: null,
    paymentMethod: 'Amex •••• 1001',
    lineItems: [
      { description: 'Professional Plan (15 seats)', quantity: 1, unitPrice: 499, amount: 499 },
      { description: 'Marketing Automation', quantity: 1, unitPrice: 149, amount: 149 },
      { description: 'SMS Notifications', quantity: 1, unitPrice: 79, amount: 79 },
      { description: 'Tax (NY 8.875%)', quantity: 1, unitPrice: 62.11, amount: 62.11 },
    ],
    periodStart: '2026-08-22',
    periodEnd: '2026-09-22',
    pdfUrl: '#',
    sentAt: '2026-08-22T00:00:00Z',
  },
  {
    id: 'INV-2026-0712-006',
    subscriptionId: 'SUB-004',
    tenantName: 'Downtown Suites Chicago',
    amount: 219.4,
    subtotal: 199,
    tax: 20.4,
    status: 'failed',
    dueDate: '2026-07-12',
    paidDate: null,
    paymentMethod: 'Visa •••• 4242',
    lineItems: [
      { description: 'Starter Plan (4 seats)', quantity: 1, unitPrice: 199, amount: 199 },
      { description: 'Tax (IL 10.25%)', quantity: 1, unitPrice: 20.4, amount: 20.4 },
    ],
    periodStart: '2026-06-12',
    periodEnd: '2026-07-12',
    pdfUrl: '#',
    sentAt: '2026-07-12T00:00:00Z',
  },
];

/* ─── Credit Notes ─── */
export const creditNotes = [
  {
    id: 'CN-2026-001',
    invoiceId: 'INV-2026-0812-001',
    tenantName: 'Grand Hotel Boston',
    amount: 500,
    reason: 'Service interruption refund',
    status: 'applied',
    createdAt: '2026-08-14',
    appliedAt: '2026-08-14',
    remainingBalance: 0,
    lineItems: [
      {
        description: 'AI Revenue Manager — 3 days outage',
        quantity: 1,
        unitPrice: 500,
        amount: 500,
      },
    ],
  },
  {
    id: 'CN-2026-002',
    invoiceId: 'INV-2026-0820-002',
    tenantName: 'Seaside Resort Miami',
    amount: 99,
    reason: 'Proration for seat reduction',
    status: 'applied',
    createdAt: '2026-08-18',
    appliedAt: '2026-08-18',
    remainingBalance: 0,
    lineItems: [
      { description: 'Channel Manager Premium — prorated', quantity: 1, unitPrice: 99, amount: 99 },
    ],
  },
  {
    id: 'CN-2026-003',
    invoiceId: null,
    tenantName: 'Urban Hotel NYC',
    amount: 200,
    reason: 'Goodwill credit for delayed support',
    status: 'open',
    createdAt: '2026-08-15',
    appliedAt: null,
    remainingBalance: 200,
    lineItems: [{ description: 'Goodwill credit', quantity: 1, unitPrice: 200, amount: 200 }],
  },
  {
    id: 'CN-2026-004',
    invoiceId: 'INV-2026-0905-004',
    tenantName: 'Coastal Inn San Diego',
    amount: 150,
    reason: 'Overpayment correction',
    status: 'partial',
    createdAt: '2026-08-10',
    appliedAt: '2026-08-10',
    remainingBalance: 75,
    lineItems: [
      { description: 'Overpayment on annual plan', quantity: 1, unitPrice: 150, amount: 150 },
    ],
  },
];

/* ─── Dunning / Failed Payments ─── */
export const dunningCases = [
  {
    id: 'DUN-001',
    subscriptionId: 'SUB-004',
    tenantName: 'Downtown Suites Chicago',
    invoiceId: 'INV-2026-0812-003',
    amount: 219.4,
    status: 'in_progress',
    stage: 3,
    maxStages: 4,
    failureReason: 'insufficient_funds',
    retryCount: 3,
    maxRetries: 4,
    lastAttempt: '2026-08-14T09:30:00Z',
    nextAttempt: '2026-08-17T09:30:00Z',
    createdAt: '2026-08-12T00:00:00Z',
    escalationDate: '2026-08-20',
    actions: [
      { date: '2026-08-12T00:00:00Z', action: 'Invoice created', status: 'success' },
      {
        date: '2026-08-12T09:30:00Z',
        action: 'Payment attempt #1',
        status: 'failed',
        reason: 'insufficient_funds',
      },
      {
        date: '2026-08-13T09:30:00Z',
        action: 'Payment attempt #2',
        status: 'failed',
        reason: 'insufficient_funds',
      },
      {
        date: '2026-08-14T09:30:00Z',
        action: 'Payment attempt #3',
        status: 'failed',
        reason: 'insufficient_funds',
      },
      { date: '2026-08-14T10:00:00Z', action: 'Dunning email sent', status: 'sent' },
    ],
    settings: {
      retrySchedule: [1, 3, 5, 7],
      autoCancelAfterDays: 30,
      downgradePlanAfterDays: 14,
      sendEmails: true,
      emailTemplate: 'standard',
    },
  },
  {
    id: 'DUN-002',
    subscriptionId: 'SUB-008',
    tenantName: 'Desert Oasis Phoenix',
    invoiceId: 'INV-2026-0515-007',
    amount: 219.4,
    status: 'cancelled',
    stage: 4,
    maxStages: 4,
    failureReason: 'card_expired',
    retryCount: 4,
    maxRetries: 4,
    lastAttempt: '2026-05-15T09:30:00Z',
    nextAttempt: null,
    createdAt: '2026-05-15T00:00:00Z',
    escalationDate: '2026-05-15',
    actions: [
      { date: '2026-05-15T00:00:00Z', action: 'Invoice created', status: 'success' },
      {
        date: '2026-05-15T09:30:00Z',
        action: 'Payment attempt #1',
        status: 'failed',
        reason: 'card_expired',
      },
      {
        date: '2026-05-16T09:30:00Z',
        action: 'Payment attempt #2',
        status: 'failed',
        reason: 'card_expired',
      },
      {
        date: '2026-05-18T09:30:00Z',
        action: 'Payment attempt #3',
        status: 'failed',
        reason: 'card_expired',
      },
      {
        date: '2026-05-20T09:30:00Z',
        action: 'Payment attempt #4',
        status: 'failed',
        reason: 'card_expired',
      },
      { date: '2026-05-20T10:00:00Z', action: 'Subscription cancelled', status: 'cancelled' },
    ],
    settings: {
      retrySchedule: [1, 2, 4, 7],
      autoCancelAfterDays: 5,
      downgradePlanAfterDays: 3,
      sendEmails: true,
      emailTemplate: 'urgent',
    },
  },
  {
    id: 'DUN-003',
    subscriptionId: 'SUB-002',
    tenantName: 'Seaside Resort Miami',
    invoiceId: 'INV-2026-0720-008',
    amount: 639.87,
    status: 'resolved',
    stage: 2,
    maxStages: 4,
    failureReason: 'bank_decline',
    retryCount: 2,
    maxRetries: 4,
    lastAttempt: '2026-07-21T09:30:00Z',
    nextAttempt: null,
    createdAt: '2026-07-20T00:00:00Z',
    escalationDate: null,
    actions: [
      { date: '2026-07-20T00:00:00Z', action: 'Invoice created', status: 'success' },
      {
        date: '2026-07-20T09:30:00Z',
        action: 'Payment attempt #1',
        status: 'failed',
        reason: 'bank_decline',
      },
      {
        date: '2026-07-21T09:30:00Z',
        action: 'Payment attempt #2',
        status: 'failed',
        reason: 'bank_decline',
      },
      {
        date: '2026-07-21T14:00:00Z',
        action: 'Customer updated payment method',
        status: 'success',
      },
      { date: '2026-07-21T14:30:00Z', action: 'Payment successful', status: 'success' },
    ],
    settings: {
      retrySchedule: [1, 3, 5, 7],
      autoCancelAfterDays: 30,
      downgradePlanAfterDays: 14,
      sendEmails: true,
      emailTemplate: 'standard',
    },
  },
];

/* ─── Plan Config ─── */
export const planConfig = {
  Starter: {
    basePrice: 199,
    includedSeats: 5,
    extraSeatPrice: 25,
    features: ['booking-engine', 'guest-portal', 'basic-reports'],
    limits: { rooms: 75, storage: 50, apiCalls: 25000 },
  },
  Professional: {
    basePrice: 499,
    includedSeats: 12,
    extraSeatPrice: 35,
    features: [
      'booking-engine',
      'guest-portal',
      'crm-loyalty',
      'channel-manager',
      'advanced-reports',
    ],
    limits: { rooms: 200, storage: 100, apiCalls: 100000 },
  },
  Enterprise: {
    basePrice: 999,
    includedSeats: 25,
    extraSeatPrice: 45,
    features: ['all-features', 'white-label', 'dedicated-support', 'sla'],
    limits: { rooms: 500, storage: 500, apiCalls: 500000 },
  },
};

/* ─── Metadata ─── */
export const subscriptionStatusMeta = {
  active: { label: 'Active', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
  trial: { label: 'Trial', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  past_due: {
    label: 'Past Due',
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
  paused: {
    label: 'Paused',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
};

export const invoiceStatusMeta = {
  paid: { label: 'Paid', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
  pending: {
    label: 'Pending',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  overdue: {
    label: 'Overdue',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
  draft: { label: 'Draft', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  failed: { label: 'Failed', class: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger' },
  void: {
    label: 'Void',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
};

export const creditNoteStatusMeta = {
  open: { label: 'Open', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  applied: {
    label: 'Applied',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
  },
  partial: {
    label: 'Partial',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  void: {
    label: 'Void',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  },
};

export const dunningStatusMeta = {
  in_progress: {
    label: 'In Progress',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
  },
  resolved: {
    label: 'Resolved',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
  },
  cancelled: {
    label: 'Cancelled',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
  escalated: {
    label: 'Escalated',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
  },
};

export const failureReasonMeta = {
  insufficient_funds: 'Insufficient Funds',
  card_expired: 'Card Expired',
  bank_decline: 'Bank Declined',
  incorrect_cvc: 'Incorrect CVC',
  processing_error: 'Processing Error',
  authentication_required: 'Authentication Required',
};

/* ─── Helpers ─── */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function calculateProration(
  currentPlan,
  newPlan,
  currentSeats,
  newSeats,
  billingCycle,
  daysRemaining
) {
  const daysInCycle = billingCycle === 'annual' ? 365 : 30;
  const currentPlanConfig = planConfig[currentPlan];
  const newPlanConfig = planConfig[newPlan];

  const currentBase = currentPlanConfig.basePrice;
  const currentExtraSeats = Math.max(0, currentSeats - currentPlanConfig.includedSeats);
  const currentExtraCost = currentExtraSeats * currentPlanConfig.extraSeatPrice;
  const currentTotal = currentBase + currentExtraCost;

  const newBase = newPlanConfig.basePrice;
  const newExtraSeats = Math.max(0, newSeats - newPlanConfig.includedSeats);
  const newExtraCost = newExtraSeats * newPlanConfig.extraSeatPrice;
  const newTotal = newBase + newExtraCost;

  const unusedValue = (currentTotal / daysInCycle) * daysRemaining;
  const newValue = (newTotal / daysInCycle) * daysRemaining;

  return {
    prorationAmount: Math.round((newValue - unusedValue) * 100) / 100,
    newTotalMonthly: newTotal,
    daysRemaining,
    creditApplied: newValue < unusedValue ? Math.round((unusedValue - newValue) * 100) / 100 : 0,
  };
}
