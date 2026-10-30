/* apps/web/src/lib/guest-utils.ts
 * Pure helpers & display metadata extracted from guest-portal/data.js.
 * No mock data lives here — only formatting and presentation constants.
 */

export function formatCurrency(amount: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
}

export function formatPoints(points: number): string {
  return new Intl.NumberFormat('en-US').format(points);
}

export function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateShort(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateRange(arrival: string | Date, departure: string | Date): string {
  const a = new Date(arrival);
  const d = new Date(departure);
  const sameMonth = a.getMonth() === d.getMonth();
  const sameYear = a.getFullYear() === d.getFullYear();
  if (sameMonth && sameYear) {
    return `${a.toLocaleDateString('en-US', { month: 'short' })} ${a.getDate()} – ${d.getDate()}, ${a.getFullYear()}`;
  }
  return `${a.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function formatDateTime(isoString?: string | null): string {
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

export function timeAgo(isoString?: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(isoString);
}

/* ─── Stay shape used across guest pages ─── */
export interface StayLike {
  status: string;
  dates: { arrival: string | Date; departure: string | Date };
  rate?: { total: number };
}

export function getStayPhase(stay: StayLike): 'pre-arrival' | 'in-stay' | 'post-stay' {
  const now = new Date();
  const arrival = new Date(stay.dates.arrival);
  const departure = new Date(stay.dates.departure);
  if (now < arrival) return 'pre-arrival';
  if (now >= arrival && now <= departure) return 'in-stay';
  return 'post-stay';
}

export function canCheckIn(stay: StayLike): boolean {
  const now = new Date();
  const arrival = new Date(stay.dates.arrival);
  const hoursBefore = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursBefore <= 24 && stay.status === 'confirmed';
}

export function getCancellationPolicy(stay: StayLike) {
  const now = new Date();
  const arrival = new Date(stay.dates.arrival);
  const hoursBefore = (arrival.getTime() - now.getTime()) / (1000 * 60 * 60);
  const total = stay.rate?.total ?? 0;
  if (hoursBefore >= 72)
    return {
      type: 'free',
      fee: 0,
      label: 'Free Cancellation',
      description: 'Cancel at least 72 hours before arrival for a full refund.',
    };
  if (hoursBefore >= 24)
    return {
      type: 'partial',
      fee: total * 0.5,
      label: 'Partial Refund',
      description: 'Cancel at least 24 hours before arrival for a 50% refund.',
    };
  return {
    type: 'non-refundable',
    fee: total,
    label: 'Non-Refundable',
    description: 'Cancellations within 24 hours of arrival are non-refundable.',
  };
}

/* ─── Display metadata ─── */
export const folioCategoryMeta: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  room: { label: 'Room', color: 'text-secondary', bg: 'bg-secondary/10', icon: '🏨' },
  dining: { label: 'Dining', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: '🍽️' },
  spa: { label: 'Spa & Wellness', color: 'text-pink-500', bg: 'bg-pink-500/10', icon: '💆' },
  services: { label: 'Services', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: '🛎️' },
};

export const stayStatusMeta: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  confirmed: {
    label: 'Confirmed',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  checked_in: {
    label: 'Checked In',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
  checked_out: {
    label: 'Checked Out',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
  no_show: {
    label: 'No Show',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    dot: 'bg-danger',
  },
};

export const serviceStatusMeta: Record<
  string,
  { label: string; color: string; dot: string; icon: string }
> = {
  operational: {
    label: 'Operational',
    color: 'text-accent',
    dot: 'bg-accent',
    icon: 'CheckCircle2',
  },
  degraded: { label: 'Degraded', color: 'text-warning', dot: 'bg-warning', icon: 'AlertTriangle' },
  maintenance: { label: 'Maintenance', color: 'text-info', dot: 'bg-info', icon: 'Wrench' },
  unavailable: { label: 'Unavailable', color: 'text-danger', dot: 'bg-danger', icon: 'XCircle' },
};

export function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'pre-arrival':
      return 'text-info';
    case 'in-stay':
      return 'text-accent';
    default:
      return 'text-text-muted';
  }
}

export function getPhaseBadge(phase: string) {
  switch (phase) {
    case 'pre-arrival':
      return { label: 'Upcoming', bg: 'bg-info/10', color: 'text-info', border: 'border-info/20' };
    case 'in-stay':
      return {
        label: 'Checked In',
        bg: 'bg-accent/10',
        color: 'text-accent',
        border: 'border-accent/20',
      };
    default:
      return {
        label: 'Completed',
        bg: 'bg-neutral/10',
        color: 'text-text-muted',
        border: 'border-border',
      };
  }
}

export const tierBenefits: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    dot: string;
    benefits: string[];
    pointsMultiplier: number;
    pointsRequired: number;
  }
> = {
  bronze: {
    label: 'Bronze',
    color: 'text-amber-700',
    bg: 'bg-amber-700/10',
    border: 'border-amber-700/20',
    dot: 'bg-amber-700',
    benefits: ['Free Wi-Fi', 'Late checkout (12pm)', 'Member rates'],
    pointsMultiplier: 1.0,
    pointsRequired: 0,
  },
  silver: {
    label: 'Silver',
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/20',
    dot: 'bg-slate-400',
    benefits: ['All Bronze benefits', 'Room upgrade (subject to availability)', 'Welcome drink'],
    pointsMultiplier: 1.25,
    pointsRequired: 5000,
  },
  gold: {
    label: 'Gold',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    dot: 'bg-yellow-500',
    benefits: [
      'All Silver benefits',
      'Guaranteed room upgrade',
      'Free breakfast',
      'Early check-in',
    ],
    pointsMultiplier: 1.5,
    pointsRequired: 10000,
  },
  platinum: {
    label: 'Platinum',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    dot: 'bg-purple-500',
    benefits: [
      'All Gold benefits',
      'Suite upgrade',
      'Executive lounge access',
      'Free parking',
      'Spa credit',
    ],
    pointsMultiplier: 2.0,
    pointsRequired: 25000,
  },
};
