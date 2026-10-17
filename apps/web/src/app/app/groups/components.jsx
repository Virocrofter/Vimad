/* src/app/app/groups/components.jsx */
import { Users, Check, Clock, TrendingUp, BedDouble, Flag } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { statusMeta, blockTypeMeta } from './data';

export function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.prospect;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      {meta.label}
    </span>
  );
}

export function BlockTypeBadge({ type }) {
  const meta = blockTypeMeta[type] || blockTypeMeta.courtesy;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        meta.class
      )}
    >
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
          className={cn(
            'h-full rounded-full transition-all',
            pct >= 80 ? 'bg-accent' : pct >= 50 ? 'bg-secondary' : 'bg-warning'
          )}
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

/* ─── Booking pipeline: prospect → tentative → definite → in house → concluded ─── */

export const PIPELINE_STAGES = [
  { id: 'prospect', label: 'Prospect', icon: Users },
  { id: 'tentative', label: 'Tentative', icon: Clock },
  { id: 'definite', label: 'Definite', icon: Check },
  { id: 'in_house', label: 'In House', icon: BedDouble },
  { id: 'concluded', label: 'Concluded', icon: Flag },
];

export function GroupPipeline({ status, onMove, pending }) {
  const cancelled = status === 'cancelled';
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.id === status);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {cancelled && (
        <p className="mb-3 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
          This block is cancelled. Click a stage below to restore it to the pipeline.
        </p>
      )}
      <div className="flex items-center">
        {PIPELINE_STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const done = !cancelled && i < currentIdx;
          const current = !cancelled && i === currentIdx;
          const clickable = !cancelled && !current && !pending;
          return (
            <div key={stage.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onMove(stage.id)}
                title={clickable ? `Move block to ${stage.label}` : stage.label}
                className={
                  'flex flex-col items-center gap-1.5 rounded-lg px-2 py-1 transition-colors ' +
                  (clickable ? 'cursor-pointer hover:bg-background' : 'cursor-default')
                }
              >
                <span
                  className={
                    'flex h-9 w-9 items-center justify-center rounded-full border ' +
                    (done
                      ? 'border-accent bg-accent text-white'
                      : current
                        ? 'border-secondary bg-secondary text-white ring-2 ring-secondary/30'
                        : 'border-border bg-background text-text-muted')
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={
                    'text-[10px] font-medium uppercase tracking-wider ' +
                    (current ? 'text-secondary' : done ? 'text-accent' : 'text-text-muted')
                  }
                >
                  {stage.label}
                </span>
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <div
                  className={
                    'mx-1 h-px flex-1 ' +
                    (!cancelled && (done || current) ? 'bg-accent' : 'bg-border')
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
