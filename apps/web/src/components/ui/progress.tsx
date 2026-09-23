import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { className, value, max = 100, ...props },
  ref
) {
  const pct = value == null ? null : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-border', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-secondary transition-all"
        style={{ width: pct == null ? '100%' : `${pct}%` }}
      />
    </div>
  );
});
