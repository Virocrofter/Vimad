import { Badge, type BadgeVariant } from './badge';
import type { ReservationStatus, RoomStatus, HousekeepingStatus, PaymentStatus } from '../../types';

const reservationStatusMap: Record<ReservationStatus, { label: string; variant: BadgeVariant }> = {
  confirmed: { label: 'Confirmed', variant: 'info' },
  checked_in: { label: 'Checked In', variant: 'accent' },
  checked_out: { label: 'Checked Out', variant: 'default' },
  no_show: { label: 'No Show', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

const roomStatusMap: Record<RoomStatus, { label: string; variant: BadgeVariant }> = {
  clean: { label: 'Clean', variant: 'accent' },
  dirty: { label: 'Dirty', variant: 'warning' },
  inspected: { label: 'Inspected', variant: 'info' },
  occupied: { label: 'Occupied', variant: 'secondary' },
  maintenance: { label: 'Maintenance', variant: 'danger' },
  out_of_order: { label: 'Out of Order', variant: 'danger' },
};

const housekeepingStatusMap: Record<HousekeepingStatus, { label: string; variant: BadgeVariant }> =
  {
    clean: { label: 'Clean', variant: 'accent' },
    dirty: { label: 'Dirty', variant: 'warning' },
    in_progress: { label: 'In Progress', variant: 'info' },
    inspected: { label: 'Inspected', variant: 'info' },
  };

const paymentStatusMap: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'accent' },
  refunded: { label: 'Refunded', variant: 'info' },
  failed: { label: 'Failed', variant: 'danger' },
};

interface StatusBadgeProps {
  status: ReservationStatus | RoomStatus | HousekeepingStatus | PaymentStatus;
  type: 'reservation' | 'room' | 'housekeeping' | 'payment';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  let config: { label: string; variant: BadgeVariant } | undefined;

  switch (type) {
    case 'reservation':
      config = reservationStatusMap[status as ReservationStatus];
      break;
    case 'room':
      config = roomStatusMap[status as RoomStatus];
      break;
    case 'housekeeping':
      config = housekeepingStatusMap[status as HousekeepingStatus];
      break;
    case 'payment':
      config = paymentStatusMap[status as PaymentStatus];
      break;
  }

  if (!config) return <Badge>{status}</Badge>;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
