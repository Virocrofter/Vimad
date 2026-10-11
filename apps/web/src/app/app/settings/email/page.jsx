/* apps/web/src/app/app/settings/email/page.jsx
 * A3 — Email Center: every transactional email, queued/sent/failed, with resend.
 */
import { useMemo, useState } from 'react';
import { Search, RefreshCw, RotateCcw, CheckCircle2, XCircle, Clock, Send } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { useEmailLogs, useEmailLogMutations } from '../../../../hooks/useEmailLogs';

const STATUS_STYLE = {
  queued: 'bg-warning/10 text-warning border-warning/20',
  sent: 'bg-accent/10 text-accent border-accent/20',
  failed: 'bg-danger/10 text-danger border-danger/20',
};

const STATUS_ICON = {
  queued: Clock,
  sent: CheckCircle2,
  failed: XCircle,
};

const TEMPLATE_LABELS = {
  'reservation-confirmation': 'Confirmation',
  'pre-arrival': 'Pre-arrival',
  'payment-receipt': 'Payment receipt',
  'folio-email': 'Folio',
  'payment-request': 'Deposit request',
  welcome: 'Welcome',
  'password-reset': 'Password reset',
  invoice: 'Invoice',
  maintenance: 'Maintenance',
  generic: 'Generic',
};

export default function EmailCenterPage() {
  const [status, setStatus] = useState('');
  const [template, setTemplate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      page,
      pageSize: 20,
      ...(status ? { status } : {}),
      ...(template ? { template } : {}),
      ...(search ? { search } : {}),
    }),
    [status, template, search, page]
  );

  const { data, meta, loading, error, refetch } = useEmailLogs(params);
  const mutations = useEmailLogMutations(refetch);

  const sentCount = data.filter((r) => r.status === 'sent').length;
  const failedCount = data.filter((r) => r.status === 'failed').length;

  return (
    <div className="space-y-6 p-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Email Center</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Every transactional email — confirmations, pre-arrival, receipts, folios — with full
            send status.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={refetch}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* ─── Quick stats (current page view) ─── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs font-medium uppercase text-text-muted">On this page</div>
          <div className="mt-2 text-2xl font-bold text-text-primary">{meta.total}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs font-medium uppercase text-text-muted">Sent</div>
          <div className="mt-2 text-2xl font-bold text-accent">{sentCount}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-xs font-medium uppercase text-text-muted">Failed</div>
          <div className="mt-2 text-2xl font-bold text-danger">{failedCount}</div>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            className="pl-9"
            placeholder="Search recipient, subject, reference…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={template}
          onChange={(e) => {
            setTemplate(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All templates</option>
          {Object.entries(TEMPLATE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {['', 'queued', 'sent', 'failed'].map((s) => (
            <button
              key={s || 'all'}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                status === s
                  ? 'bg-secondary text-white'
                  : 'text-text-secondary hover:bg-surface-elevated'
              )}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {mutations.error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {mutations.error}
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background text-left text-xs uppercase text-text-muted">
              <th className="px-4 py-3 font-medium">Recipient</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sent</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-danger">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                  No emails logged yet — they appear here when confirmations, pre-arrival, receipts
                  and folios go out.
                </td>
              </tr>
            )}
            {!loading &&
              data.map((row) => {
                const Icon = STATUS_ICON[row.status] ?? Clock;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0 hover:bg-background/50"
                  >
                    <td className="px-4 py-3">
                      <div className="text-text-primary">{row.to}</div>
                      {row.relatedType && (
                        <div className="text-xs text-text-muted capitalize">
                          {row.relatedType} · {row.relatedId?.slice(0, 12)}
                        </div>
                      )}
                    </td>
                    <td className="max-w-[320px] px-4 py-3">
                      <div className="truncate text-text-primary">{row.subject}</div>
                      {row.status === 'failed' && row.error && (
                        <div className="mt-0.5 truncate text-xs text-danger">{row.error}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {TEMPLATE_LABELS[row.template] ?? row.template}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
                          STATUS_STYLE[row.status]
                        )}
                      >
                        <Icon className="h-3 w-3" /> {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {row.sentAt ? new Date(row.sentAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => mutations.resend(row.id)}
                          disabled={mutations.busy === `resend-${row.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50"
                          title="Resend"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-text-muted">{meta.total} emails</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <span className="text-xs text-text-muted">
                {page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-text-muted">
        <Send className="h-3.5 w-3.5" />
        Confirmation fires automatically on reservation create. Pre-arrival fires automatically 24h
        before check-in. Receipts fire on payment settlement.
      </p>
    </div>
  );
}
