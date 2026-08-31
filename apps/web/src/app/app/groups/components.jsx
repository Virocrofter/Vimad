/* src/app/app/groups/components.jsx */
import { Users, Check, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { statusMeta, blockTypeMeta } from './data';

export function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.prospect;
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', meta.class)}>
      {meta.label}
    </span>
  );
}

export function BlockTypeBadge({ type }) {
  const meta = blockTypeMeta[type] || blockTypeMeta.courtesy;
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', meta.class)}>
      {meta.label}
    </span>
  );
}

export function PickupBar({ picked, blocked }) {
  const pct = blocked > 0 ? Math.round((picked / blocked) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 max-w-24 rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', pct >= 80 ? 'bg-accent' : pct >= 50 ? 'bg-secondary' : 'bg-warning')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-text-secondary">{pct}%</span>
    </div>
  );
}

export function GroupStatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <Icon className={cn('h-6 w-6', color)} />
      </div>
    </div>
  );
}