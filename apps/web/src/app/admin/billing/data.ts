// Static plan catalogue, status metadata & formatters only — entity data comes from the API.

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

export function calculateProration(
  currentPlan: string,
  newPlan: string,
  currentSeats: number,
  newSeats: number,
  billingCycle: string,
  daysRemaining: number
) {
  const daysInCycle = billingCycle === 'annual' ? 365 : 30;
  const currentPlanConfig = planConfig[currentPlan as keyof typeof planConfig];
  const newPlanConfig = planConfig[newPlan as keyof typeof planConfig];

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

export function formatCurrency(amount: number, currency = 'ZAR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
