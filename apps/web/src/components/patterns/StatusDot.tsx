import { cn } from '../../lib/utils';

export type DotStatus = 'live' | 'stale' | 'offline';

interface StatusDotProps {
  status: DotStatus;
  text?: string;
  className?: string;
}

const COLORS: Record<DotStatus, string> = {
  live: 'bg-primary',
  stale: 'bg-warning',
  offline: 'bg-text-muted',
};

const DEFAULT_TEXT: Record<DotStatus, string> = {
  live: 'Live',
  stale: 'Stale',
  offline: 'Offline',
};

export function StatusDot({ status, text, className }: StatusDotProps) {
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 hq-text-caption text-text-secondary',
        className
      )}
    >
      <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', COLORS[status])} />
      {text ?? DEFAULT_TEXT[status]}
    </span>
  );
}
