/* apps/web/src/app/app/rates/ratesUtils.js */
export const WEEKEND_MULTIPLIER = 1.2;

export const isWeekend = (dateStr) => {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6; // Sun / Sat
};

export const formatDate = (dateStr) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

export const formatShortDay = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }),
    day: d.getDate(),
    weekend: isWeekend(dateStr),
  };
};

// Find the rate plan covering a given date for a room type
export function planForDate(plans, roomTypeId, date) {
  const covering = plans.filter((p) => {
    if (p.roomTypeId !== roomTypeId) return false;
    if (p.startDate && date < p.startDate.slice(0, 10)) return false;
    if (p.endDate && date > p.endDate.slice(0, 10)) return false;
    return true;
  });
  // Prefer the most specific (narrowest date range) plan
  covering.sort((a, b) => {
    const span = (p) =>
      p.startDate && p.endDate
        ? new Date(p.endDate) - new Date(p.startDate)
        : Number.MAX_SAFE_INTEGER;
    return span(a) - span(b);
  });
  return covering[0] ?? null;
}

export const ACTIVE_STATUSES = ['confirmed', 'checked_in', 'in_house'];

// Heat classification vs base rate
export function heatClass(rate, base) {
  if (base == null || rate == null) return 'bg-surface-elevated text-text-muted';
  if (rate < base) return 'bg-primary/10 text-primary';
  if (rate === base) return 'bg-accent/10 text-accent';
  if (rate <= base * 1.25) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
}

// Cell rate for a room type on a date
export function getCellRate(ratePlans, rtId, date) {
  const plan = planForDate(ratePlans, rtId, date);
  if (!plan) return null;
  const base = Number(plan.baseRate);
  const weekend = isWeekend(date);
  const rate = weekend ? Math.round(base * WEEKEND_MULTIPLIER) : base;
  const minStay = weekend ? Math.max(plan.minStay ?? 1, 2) : (plan.minStay ?? 1);
  return { rate, minStay, weekend, currency: plan.currency ?? 'ZAR' };
}
