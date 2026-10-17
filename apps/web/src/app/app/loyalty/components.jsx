import { Gem, Award, Star, Crown } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { tierMeta } from './tierMeta';

const iconMap = { Gem, Award, Star, Crown };

export function TierBadge({ tier, size = 'md' }) {
  const meta = tierMeta[tier] || tierMeta.bronze;
  const Icon = iconMap[meta.iconName] || Gem;
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold uppercase tracking-wider',
        meta.bg,
        meta.color,
        meta.border,
        sizeClasses[size]
      )}
    >
      <Icon className={cn(size === 'lg' ? 'h-4 w-4' : 'h-3 w-3')} />
      {meta.label}
    </span>
  );
}

export function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

export function TierProgressBar({ current, nextTierReq, tier }) {
  const meta = tierMeta[tier] || tierMeta.bronze;
  const progress = Math.min(100, Math.max(0, (current / nextTierReq) * 100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-text-muted">{current.toLocaleString()} pts</span>
        <span className="text-xs font-medium text-text-secondary">
          {nextTierReq.toLocaleString()} pts
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', meta.dot)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
