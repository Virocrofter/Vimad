/* apps/web/src/components/ui/status-badge.tsx */
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant = 'accent' | 'secondary' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeConfig {
  label: string;
  variant: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: 'bg-accent/10 text-accent border-accent/20',
  secondary: 'bg-secondary/10 text-secondary border-secondary/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-neutral/10 text-text-muted border-border',
};

const reservationStatusMap: Record<string, BadgeConfig> = {
  confirmed: { label: 'Confirmed', variant: 'accent' },
  checked_in: { label: 'Checked In', variant: 'secondary' },
  checked_out: { label: 'Checked Out', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  no_show: { label: 'No-Show', variant: 'danger' },
  waitlist: { label: 'Waitlist', variant: 'warning' },
};

const roomStatusMap: Record<string, BadgeConfig> = {
  clean: { label: 'Clean', variant: 'accent' },
  dirty: { label: 'Dirty', variant: 'warning' },
  inspected: { label: 'Inspected', variant: 'secondary' },
  occupied: { label: 'Occupied', variant: 'secondary' },
  out_of_order: { label: 'Out of Order', variant: 'danger' },
};

const housekeepingStatusMap: Record<string, BadgeConfig> = {
  clean: { label: 'Clean', variant: 'accent' },
  dirty: { label: 'Dirty', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info' },
  inspected: { label: 'Inspected', variant: 'secondary' },
  ready: { label: 'Ready', variant: 'accent' },
  attention: { label: 'Needs Attention', variant: 'danger' },
  out_of_service: { label: 'Out of Service', variant: 'danger' },
};

const paymentStatusMap: Record<string, BadgeConfig> = {
  pending: { label: 'Pending', variant: 'warning' },
  authorized: { label: 'Authorized', variant: 'info' },
  paid: { label: 'Paid', variant: 'accent' },
  refunded: { label: 'Refunded', variant: 'info' },
  failed: { label: 'Failed', variant: 'danger' },
};

interface StatusBadgeProps {
  status: string;
  type?: 'reservation' | 'room' | 'housekeeping' | 'payment';
  className?: string;
  children?: ReactNode;
}

export function StatusBadge({
  status,
  type = 'reservation',
  className,
  children,
}: StatusBadgeProps) {
  const map =
    type === 'room'
      ? roomStatusMap
      : type === 'housekeeping'
        ? housekeepingStatusMap
        : type === 'payment'
          ? paymentStatusMap
          : reservationStatusMap;

  const config = map[status] ?? { label: status, variant: 'neutral' as BadgeVariant };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[config.variant],
        className
      )}
    >
      {children ?? config.label}
    </span>
  );
}

export default StatusBadge;
