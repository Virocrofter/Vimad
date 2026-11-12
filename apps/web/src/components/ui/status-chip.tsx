import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type RoomStatus = 'ready' | 'clean' | 'dirty' | 'in_progress' | 'inspected' | 'ooo' | 'oos';

const LABELS: Record<RoomStatus, string> = {
  ready: 'Ready',
  clean: 'Clean',
  dirty: 'Dirty',
  in_progress: 'In progress',
  inspected: 'Inspected',
  ooo: 'Out of order',
  oos: 'Out of service',
};

interface StatusChipProps {
  status: RoomStatus;
  label?: ReactNode;
  className?: string;
}

export function StatusChip({ status, label, className }: StatusChipProps) {
  const tone = status.replace('_', '-');
  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 font-medium hq-text-caption',
        `hq-status-${tone}`,
        className
      )}
    >
      <span className={cn('hq-status-dot', tone)} aria-hidden="true" />
      {label ?? LABELS[status]}
    </span>
  );
}
