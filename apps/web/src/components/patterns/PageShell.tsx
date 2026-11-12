import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageShellProps {
  breadcrumb?: Crumb[];
  title: ReactNode;
  context?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageShell({
  breadcrumb,
  title,
  context,
  primaryAction,
  secondaryActions,
  tabs,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 py-6', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex items-center gap-1 hq-text-caption text-text-muted"
        >
          {breadcrumb.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {c.href ? (
                <a href={c.href} className="hover:text-text-primary">
                  {c.label}
                </a>
              ) : (
                <span aria-current={i === breadcrumb.length - 1 ? 'page' : undefined}>
                  {c.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="hq-text-title font-semibold text-text-primary">{title}</h1>
          {context && <div className="mt-1 hq-text-body text-text-secondary">{context}</div>}
        </div>
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </header>
      {tabs && <div className="mb-4">{tabs}</div>}
      {children}
    </div>
  );
}
