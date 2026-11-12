import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface WorklistProps {
  toolbar?: ReactNode;
  bulkBar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Worklist({ toolbar, bulkBar, children, footer, className }: WorklistProps) {
  return (
    <section className={cn('hq-card overflow-hidden p-0', className)}>
      {(toolbar || bulkBar) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          {bulkBar && <div className="flex items-center gap-2">{bulkBar}</div>}
        </div>
      )}
      <div className="divide-y divide-border">{children}</div>
      {footer && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          {footer}
        </div>
      )}
    </section>
  );
}
