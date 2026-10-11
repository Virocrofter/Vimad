/* apps/web/src/app/app/billing/payment-requests/page.jsx
 * Payment requests + deposit automation (RoomRaccoon parity).
 */
import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Copy,
  Check,
  Mail,
  Ban,
  RefreshCw,
  Clock,
  AlertTriangle,
  Banknote,
  Percent,
  X,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  usePaymentRequests,
  usePaymentRequestSummary,
  usePaymentRequestMutations,
} from '../../../../hooks/usePaymentRequests';
import { paymentRequestsApi } from '../../../../api/payment-requests';
import { apiGet } from '../../../../api/client';

const fmtMoney = (minor, currency) => {
  const sym = currency === 'ZAR' ? 'R' : '$';
  return `${sym} ${((minor ?? 0) / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const STATUS_STYLE = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  sent: 'bg-secondary/10 text-secondary border-secondary/20',
  paid: 'bg-accent/10 text-accent border-accent/20',
  expired: 'bg-danger/10 text-danger border-danger/20',
  cancelled: 'bg-neutral/10 text-text-muted border-border',
};

export default function PaymentRequestsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(null);

  const params = useMemo(
    () => ({ page, pageSize: 15, ...(status ? { status } : {}), ...(search ? { search } : {}) }),
    [status, search, page]
  );

  const { data, meta, loading, error, refetch } = usePaymentRequests(params);
  const { summary, refetch: refetchSummary } = usePaymentRequestSummary();
  const mutations = usePaymentRequestMutations(() => {
    refetch();
    refetchSummary();
  });

  const copyLink = (row) => {
    if (!row.hostedUrl) return;
    navigator.clipboard.writeText(row.hostedUrl);
    setCopied(row.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6 p-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Payment Requests</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Email guests a pay-now deposit link · automatic reminders · auto-cancel unpaid bookings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              refetch();
              refetchSummary();
            }}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Payment Request
          </Button>
        </div>
      </div>

      {/* ─── Stat cards ─── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Awaiting payment"
          value={summary?.pending.count ?? '—'}
          sub={fmtMoney(summary?.pending.amountMinor, 'ZAR')}
          tone="text-warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={summary?.overdue.count ?? '—'}
          sub={fmtMoney(summary?.overdue.amountMinor, 'ZAR')}
          tone="text-danger"
        />
        <StatCard
          icon={Banknote}
          label="Collected this month"
          value={summary?.paidThisMonth.count ?? '—'}
          sub={fmtMoney(summary?.paidThisMonth.amountMinor, 'ZAR')}
          tone="text-accent"
        />
        <StatCard
          icon={Percent}
          label="Collection rate"
          value={summary ? `${summary.collectionRate}%` : '—'}
          sub="of all requests"
          tone="text-secondary"
        />
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            className="pl-9"
            placeholder="Search reference, confirmation, guest…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {['', 'sent', 'pending', 'paid', 'expired', 'cancelled'].map((s) => (
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
              <th className="px-4 py-3 font-medium">Guest / Reservation</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Reminders</th>
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
                  No payment requests yet — create one from a confirmed reservation.
                </td>
              </tr>
            )}
            {!loading &&
              data.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-background/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">
                      {row.reservation?.guest
                        ? `${row.reservation.guest.firstName} ${row.reservation.guest.lastName}`
                        : '—'}
                    </div>
                    <div className="text-xs text-text-muted">
                      {row.reservation?.confirmationNumber ?? row.reference}
                      {row.reservation && ` · arrives ${row.reservation.arrivalDate.slice(0, 10)}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">
                      {fmtMoney(row.amountMinor, row.currency)}
                    </div>
                    <div className="text-xs text-text-muted">
                      {row.depositPercent}% deposit · {row.currency}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
                        STATUS_STYLE[row.status]
                      )}
                    >
                      {row.status}
                    </span>
                    {row.reservationCancelled && (
                      <div className="mt-1 text-xs text-danger">Reservation auto-cancelled</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    <div>{new Date(row.dueDate).toLocaleDateString()}</div>
                    {['pending', 'sent'].includes(row.status) &&
                      new Date(row.dueDate) < new Date() && (
                        <div className="text-xs text-danger">Overdue</div>
                      )}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {row.remindersSent}/{row.reminderOffsetsHours.length || 3} sent
                    {row.autoCancelEnabled && <div className="mt-0.5">Auto-cancel on</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {row.hostedUrl && (
                        <button
                          onClick={() => copyLink(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="Copy pay link"
                        >
                          {copied === row.id ? (
                            <Check className="h-4 w-4 text-accent" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {['pending', 'sent'].includes(row.status) && (
                        <>
                          <button
                            onClick={() => mutations.send(row.id)}
                            disabled={mutations.busy === `send-${row.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50"
                            title="Send reminder"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const note = window.prompt('Cancel reason (optional)') ?? undefined;
                              mutations.cancel(row.id, note || undefined);
                            }}
                            disabled={mutations.busy === `cancel-${row.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-danger disabled:opacity-50"
                            title="Cancel request"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-text-muted">{meta.total} requests</span>
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

      {showCreate && (
        <CreateRequestModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refetch();
            refetchSummary();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-text-muted">
        <Icon className={cn('h-4 w-4', tone)} /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-text-primary">{value}</div>
      <div className="mt-0.5 text-xs text-text-muted">{sub}</div>
    </div>
  );
}

/* ─── Create modal ─── */
function CreateRequestModal({ onClose, onCreated }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    depositPercent: 50,
    dueInHours: 72,
    autoCancelEnabled: true,
    autoCancelHoursBeforeArrival: 48,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const searchReservations = async (term) => {
    setQ(term);
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await apiGet('/v1/reservations', {
        params: { search: term, status: 'confirmed', pageSize: 8 },
      });
      setResults((res.data ?? []).filter((r) => r.status === 'confirmed'));
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await paymentRequestsApi.create({
        reservationId: selected.id,
        depositPercent: Number(form.depositPercent),
        dueInHours: Number(form.dueInHours),
        autoCancelEnabled: form.autoCancelEnabled,
        autoCancelHoursBeforeArrival: Number(form.autoCancelHoursBeforeArrival),
      });
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create request');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">New Payment Request</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!selected ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">
              Find a confirmed reservation
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                className="pl-9"
                placeholder="Confirmation number or guest name…"
                value={q}
                onChange={(e) => searchReservations(e.target.value)}
              />
            </div>
            {searching && <p className="text-xs text-text-muted">Searching…</p>}
            <div className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {results.map((r) => (
                <button
                  key={r.id}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-surface-elevated"
                  onClick={() => setSelected(r)}
                >
                  <span className="font-medium text-text-primary">
                    {r.guest?.firstName} {r.guest?.lastName}
                  </span>
                  <span className="ml-2 text-text-muted">
                    {r.confirmationNumber} · {r.arrivalDate?.slice(0, 10)} · balance {r.balance}
                  </span>
                  {!r.guest?.email && (
                    <span className="mt-0.5 block text-xs text-danger">
                      No guest email on file — add one first
                    </span>
                  )}
                </button>
              ))}
              {!searching && q.length >= 2 && results.length === 0 && (
                <p className="px-4 py-6 text-center text-xs text-text-muted">
                  No confirmed reservations found
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-text-primary">
                  {selected.guest?.firstName} {selected.guest?.lastName}
                </span>
                <span className="ml-2 text-text-muted">{selected.confirmationNumber}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Change
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Deposit %</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={form.depositPercent}
                  onChange={(e) => setForm({ ...form, depositPercent: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Due in (hours)</label>
                <Input
                  type="number"
                  min="1"
                  value={form.dueInHours}
                  onChange={(e) => setForm({ ...form, dueInHours: e.target.value })}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={form.autoCancelEnabled}
                onChange={(e) => setForm({ ...form, autoCancelEnabled: e.target.checked })}
              />
              Auto-cancel reservation if deposit unpaid
            </label>
            {form.autoCancelEnabled && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">
                  Cancel this many hours before arrival
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.autoCancelHoursBeforeArrival}
                  onChange={(e) =>
                    setForm({ ...form, autoCancelHoursBeforeArrival: e.target.value })
                  }
                />
              </div>
            )}

            <p className="text-xs text-text-muted">
              The guest is emailed a secure Paystack pay-now link. Reminders go out 72h, 24h and 12h
              before the due date automatically.
            </p>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={busy || !selected.guest?.email}>
                {busy ? 'Sending…' : 'Send pay-now link'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
