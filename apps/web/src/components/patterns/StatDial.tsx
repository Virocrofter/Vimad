import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface StatComparison {
  label: string;
  direction: 'up' | 'down' | 'flat';
  tone?: 'good' | 'bad' | 'neutral';
}

interface StatDialProps {
  label: string;
  value: ReactNode;
  comparison?: StatComparison;
  source?: string;
  freshness?: string;
  spark?: number[];
  href?: string;
  onClick?: () => void;
  className?: string;
}

const toneClass: Record<NonNullable<StatComparison['tone']>, string> = {
  good: 'text-primary',
  bad: 'text-danger',
  neutral: 'text-text-secondary',
};

const arrow: Record<StatComparison['direction'], string> = {
  up: '↑',
  down: '↓',
  flat: '→',
};

export function StatDial({
  label,
  value,
  comparison,
  source,
  freshness,
  spark,
  href,
  onClick,
  className,
}: StatDialProps) {
  const interactive = Boolean(href || onClick);
  const max = spark && spark.length ? Math.max(...spark) : 0;
  const min = spark && spark.length ? Math.min(...spark) : 0;
  const range = max - min || 1;

  const body = (
    <>
      <span className="hq-text-caption font-medium uppercase tracking-wide text-text-muted">
        {label}
      </span>
      <span className="hq-tnum hq-text-title font-semibold text-text-primary">{value}</span>
      {comparison && (
        <span
          className={cn(
            'hq-text-caption inline-flex items-center gap-1',
            toneClass[comparison.tone ?? 'neutral']
          )}
        >
          <span aria-hidden="true">{arrow[comparison.direction]}</span>
          {comparison.label}
        </span>
      )}
      {spark && spark.length > 1 && (
        <svg
          aria-hidden="true"
          viewBox={'0 0 ' + spark.length * 4 + ' 20'}
          className="mt-1 h-5 w-full text-primary"
          preserveAspectRatio="none"
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            points={spark.map((v, i) => i * 4 + ',' + (18 - ((v - min) / range) * 16)).join(' ')}
          />
        </svg>
      )}
      {(source || freshness) && (
        <span className="hq-text-caption mt-1 text-text-muted">
          {[source, freshness].filter(Boolean).join(' · ')}
        </span>
      )}
    </>
  );

  const cls = cn(
    'hq-card flex flex-col gap-1 p-4 text-left',
    interactive &&
      'cursor-pointer transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className
  );

  if (href) {
    return (
      <a href={href} className={cls}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
