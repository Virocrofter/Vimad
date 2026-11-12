/* apps/web/src/app/app/exceptions/page.jsx
 * Phase 4 — the "Needs attention" queue (roadmap audit §6).
 * ONE worklist for situations needing a human, across payment, rooms,
 * requests and channels. Each row carries the server's recommended action
 * and a deep link; ack/assign/resolve/dismiss ride the P12 lifecycle
 * (dismiss REQUIRES a reason — audited server-side).
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useExceptions } from '../../../hooks/useExceptions';
import {
  ackException,
  assignException,
  dismissException,
  resolveException,
} from '../../../api/exceptions';
import { flags } from '../../../lib/flags';
import { cn } from '../../../lib/utils';

const SEV = {
  critical: 'border-danger/30 bg-danger/10 text-danger',
  high: 'border-warning/40 bg-warning/10 text-warning',
  medium: 'border-info/30 bg-info/10 text-info',
  low: 'border-border bg-surface-elevated text-text-muted',
};

function ReasonPrompt({ title, requireReason, onConfirm, onCancel, busy }) {
  const [text, setText] = useState('');
  return (
    <div className="mt-2 rounded-md border border-warning/40 bg-surface p-2">
      <p className="text-[11px] font-medium text-text-primary">{title}</p>
      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={requireReason ? 'Reason required (audited)' : 'Note (optional)'}
        className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs"
      />
      <div className="mt-1.5 flex gap-1.5">
        <button
          disabled={busy || (requireReason && !text.trim())}
          onClick={() => onConfirm(text.trim() || undefined)}
          className="rounded bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
        >
          {busy ? '…' : 'Confirm'}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-border px-2 py-0.5 text-[11px] text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const TABS = [
  ['active', 'Active'],
  ['acknowledged', 'Acknowledged'],
  ['in_progress', 'In progress'],
  ['all', 'All'],
];

export default function ExceptionsPage() {
  const [tab, setTab] = useState('active');
  const [prompt, setPrompt] = useState(null); // {kind, item}
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);
  const q = useExceptions(tab);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['exceptions'] });

  if (!flags.exceptions) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-center text-xs text-text-muted">
        The exception queue is behind{' '}
        <code className="text-text-primary">VITE_FLAG_EXCEPTIONS</code>. Add it to{' '}
        <code className="text-text-primary">.env</code> and restart the dev server.
      </p>
    );
  }

  const run = (item, kind, fn) => async () => {
    setBusyId(item.id + kind);
    setErr(null);
    try {
      await fn();
      setPrompt(null);
      await invalidate();
    } catch (e) {
      setErr(e?.response?.data?.error?.message ?? e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (q.isLoading) return <div className="h-48 animate-pulse rounded-xl bg-surface-elevated" />;
  if (q.isError) {
    return (
      <div className="rounded-xl border border-danger/30 bg-surface p-6 text-center">
        <p className="text-sm font-medium">Exception queue failed to load</p>
        <p className="mt-1 text-xs text-text-secondary">
          {q.error?.response?.data?.error?.message ?? q.error?.message}
        </p>
        <button
          onClick={() => q.refetch()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const d = q.data;
  const items = d.items;
  const activeCount =
    (d.counts.open ?? 0) + (d.counts.acknowledged ?? 0) + (d.counts.in_progress ?? 0);

  return (
    <section aria-label="Needs attention" className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold text-text-primary">Needs attention</h1>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold',
            activeCount ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent-foreground'
          )}
        >
          {activeCount}
        </span>
        <span className="ml-auto text-[11px] text-text-muted">
          updated{' '}
          {new Date(d.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              tab === k
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {label} ({k === 'active' ? activeCount : (d.counts[k] ?? 0)})
          </button>
        ))}
      </div>

      {err && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {err}
        </p>
      )}

      {items.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-6 text-xs text-text-muted">
          <ShieldCheck className="h-4 w-4 text-accent-foreground" /> No exceptions in this view.
          Everything is under control.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-text-muted">
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Exception</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">SLA</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                        SEV[item.severity] ?? SEV.medium
                      )}
                    >
                      {item.severity === 'critical' ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-text-primary">{item.title}</p>
                    {item.detail && (
                      <p className="mt-0.5 text-[11px] text-text-secondary">{item.detail}</p>
                    )}
                    {item.recommendedAction && (
                      <p className="mt-1 text-[11px] text-text-muted">→ {item.recommendedAction}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      {item.status.replace('_', ' ')}
                    </span>
                    {item.resolutionNote && (
                      <p className="mt-1 max-w-40 text-[10px] text-text-muted">
                        {item.resolutionNote}
                      </p>
                    )}
                    {item.dismissReason && (
                      <p className="mt-1 max-w-40 text-[10px] text-text-muted">
                        dismissed: {item.dismissReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-text-muted">
                    {item.slaDueAt
                      ? new Date(item.slaDueAt).toLocaleString([], {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {item.actionUrl && (
                        <a
                          href={item.actionUrl}
                          className="rounded border border-border px-2 py-1 text-[11px] font-medium text-text-secondary hover:bg-surface-elevated"
                        >
                          Open <ArrowRight className="ml-0.5 inline h-3 w-3" />
                        </a>
                      )}
                      {item.status === 'open' && (
                        <button
                          disabled={!!busyId}
                          onClick={run(item, 'ack', () => ackException(item.id))}
                          className="rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground disabled:opacity-40"
                        >
                          <CheckCheck className="mr-1 inline h-3 w-3" />
                          Acknowledge
                        </button>
                      )}
                      {['open', 'acknowledged'].includes(item.status) && (
                        <button
                          disabled={!!busyId}
                          onClick={run(item, 'assign', () => assignException(item.id))}
                          className="rounded border border-border px-2 py-1 text-[11px] text-text-secondary disabled:opacity-40"
                        >
                          <UserPlus className="mr-1 inline h-3 w-3" />
                          Take
                        </button>
                      )}
                      {['open', 'acknowledged', 'in_progress'].includes(item.status) && (
                        <>
                          <button
                            disabled={!!busyId}
                            onClick={() => setPrompt({ kind: 'resolve', item })}
                            className="rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
                          >
                            <CheckCircle2 className="mr-1 inline h-3 w-3" />
                            Resolve
                          </button>
                          <button
                            disabled={!!busyId}
                            onClick={() => setPrompt({ kind: 'dismiss', item })}
                            className="rounded border border-warning/40 px-2 py-1 text-[11px] font-medium text-warning disabled:opacity-40"
                          >
                            <X className="mr-1 inline h-3 w-3" />
                            Dismiss
                          </button>
                        </>
                      )}
                    </div>
                    {prompt?.item?.id === item.id && (
                      <ReasonPrompt
                        title={
                          prompt.kind === 'dismiss'
                            ? `Dismiss — reason required (audited)`
                            : 'Resolve — how was it fixed?'
                        }
                        requireReason={prompt.kind === 'dismiss'}
                        busy={busyId === item.id + prompt.kind}
                        onConfirm={(text) =>
                          prompt.kind === 'dismiss'
                            ? run(item, 'dismiss', () => dismissException(item.id, text))()
                            : run(item, 'resolve', () => resolveException(item.id, text))()
                        }
                        onCancel={() => setPrompt(null)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
