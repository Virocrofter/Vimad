import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface FilterBarProps {
  children: ReactNode;
  activeCount?: number;
  className?: string;
}

export function FilterBar({ children, activeCount, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-[var(--hq-radius-sm)] border border-border bg-surface px-3 py-2',
        className
      )}
    >
      {children}
      {typeof activeCount === 'number' && activeCount > 0 && (
        <span className="hq-text-caption rounded-full bg-secondary px-2 py-0.5 font-medium text-white hq-tnum">
          {activeCount} active
        </span>
      )}
    </div>
  );
}
