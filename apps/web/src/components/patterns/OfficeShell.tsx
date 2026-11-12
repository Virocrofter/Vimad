import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface OfficeShellProps {
  briefing?: ReactNode;
  shiftReport?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function OfficeShell({
  briefing,
  shiftReport,
  rail,
  children,
  className,
}: OfficeShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-[1600px] px-4 py-6', className)}>
      {briefing && <div className="mb-4">{briefing}</div>}
      {shiftReport && <div className="mb-4">{shiftReport}</div>}
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">{children}</div>
        {rail && (
          <aside className="hidden w-80 shrink-0 xl:block">
            <div className="sticky top-16 space-y-4">{rail}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
