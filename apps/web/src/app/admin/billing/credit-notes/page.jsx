/* src/app/admin/billing/credit-notes/page.jsx */
import { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Clock,
  Download,
  Eye,
  RotateCcw,
  Send,
  Printer,
  Copy,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { getCreditNotes, createCreditNote, applyCreditNote } from '../../../../api/billing';
import { api } from '../../../../api/client';
import { useApiFetch } from '../../../../hooks/useApiFetch';
import { useApiMutation } from '../../../../hooks/useApiMutation';
import { useApiError } from '../../../../hooks/useApiError';
import { useToast } from '../../../../hooks/use-toast';

/* ─── Metadata ─── */
const reasonMeta = {
  service_outage: {
    label: 'Service Outage',
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
  },
  billing_error: {
    label: 'Billing Error',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  goodwill: {
    label: 'Goodwill',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  feature_delay: {
    label: 'Feature Delay',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  promotional: {
    label: 'Promotional',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
};

const statusMeta = {
  issued: { label: 'Issued', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20' },
  applied: {
    label: 'Applied',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  partially_applied: {
    label: 'Partially Applied',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  refunded: {
    label: 'Refunded',
    dot: 'bg-secondary',
    class: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  expired: {
    label: 'Expired',
    dot: 'bg-text-muted',
    class: 'bg-neutral/10 text-text-muted border-border',
  },
  voided: { label: 'Voided', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20' },
};

const typeMeta = {
  full: { label: 'Full', icon: ArrowDownLeft },
  partial: { label: 'Partial', icon: ArrowUpRight },
};

/* ─── Helpers ─── */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toISOString().split('T')[0];
}

function daysUntil(dateStr) {
  if (!dateStr) return 0;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

/* Normalize the API credit note into the shape the UI expects */
function normalizeCreditNote(n) {
  const amount = n.amount ?? 0;
  const remaining = n.remaining ?? n.remainingAmount ?? (n.status === 'issued' ? amount : 0);
  return {
    id: n.id ?? n.creditNoteId ?? '',
    tenantId: n.tenantId ?? '',
    tenantName: n.tenantName ?? n.tenantId ?? 'Unknown',
    invoiceId: n.invoiceId ?? null,
    amount,
    currency: n.currency ?? 'USD',
    reason: n.reason ?? 'goodwill',
    reasonDetail: n.reasonDetail ?? n.description ?? '',
    status: n.status ?? 'issued',
    type: n.type ?? (n.invoiceId ? 'partial' : 'full'),
    issuedAt: formatDate(n.issuedAt ?? n.createdAt),
    appliedAt: n.appliedAt ? formatDate(n.appliedAt) : null,
    refundedAt: n.refundedAt ? formatDate(n.refundedAt) : null,
    expiresAt: formatDate(n.expiresAt),
    remaining,
    appliedTo: (n.appliedTo ?? n.applications ?? []).map((a) => ({
      invoiceId: a.invoiceId ?? '',
      amount: a.amount ?? 0,
      date: formatDate(a.date ?? a.appliedAt),
    })),
    createdBy: n.createdBy ?? n.createdByName ?? 'System',
    notes: n.notes ?? '',
  };
}

/* ─── Components ─── */
function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.issued;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

function ReasonBadge({ reason }) {
  const meta = reasonMeta[reason] || reasonMeta.goodwill;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.bg,
        meta.color,
        meta.border
      )}
    >
      {meta.label}
    </span>
  );
}

function StatCard({ label, value, subtext, icon: Icon, color }) {
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

/* ─── Create Modal ─── */
function CreateCreditNoteModal({ isOpen, onClose, onCreate, tenants, saving }) {
  const [form, setForm] = useState({
    tenantId: '',
    invoiceId: '',
    amount: '',
    reason: 'service_outage',
    reasonDetail: '',
    type: 'full',
    notes: '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tenant = tenants.find((t) => t.id === form.tenantId);
    // Parent performs the API call and closes the modal on success
    const ok = await onCreate({
      tenantId: form.tenantId,
      tenantName: tenant?.name || form.tenantId,
      invoiceId: form.invoiceId || null,
      amount: parseFloat(form.amount) || 0,
      currency: 'USD',
      reason: form.reason,
      reasonDetail: form.reasonDetail,
      type: form.type,
      notes: form.notes,
    });
    if (ok !== false) {
      setForm({
        tenantId: '',
        invoiceId: '',
        amount: '',
        reason: 'service_outage',
        reasonDetail: '',
        type: 'full',
        notes: '',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Create Credit Note</h3>
              <p className="text-xs text-text-muted">Issue a new credit to a tenant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Tenant
            </label>
            <select
              value={form.tenantId}
              onChange={(e) => update('tenantId', e.target.value)}
              required
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select tenant...</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Reference Invoice (optional)
            </label>
            <input
              type="text"
              value={form.invoiceId}
              onChange={(e) => update('invoiceId', e.target.value)}
              placeholder="e.g. INV-2026-0812"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Amount ($)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['full', 'partial'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => update('type', type)}
                    className={cn(
                      'h-10 rounded-md border px-3 text-sm font-medium transition-colors',
                      form.type === type
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {type === 'full' ? 'Full' : 'Partial'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Reason
            </label>
            <select
              value={form.reason}
              onChange={(e) => update('reason', e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Object.entries(reasonMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Detail
            </label>
            <textarea
              value={form.reasonDetail}
              onChange={(e) => update('reasonDetail', e.target.value)}
              rows={3}
              placeholder="Describe the reason for this credit note..."
              required
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Internal Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              placeholder="Internal notes (not visible to tenant)..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              {saving ? 'Creating…' : 'Create Credit Note'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Detail Drawer ─── */
function CreditNoteDrawer({ note, onClose, onVoid, onRefund, onApply, actionLoading }) {
  const [activeTab, setActiveTab] = useState('details');
  if (!note) return null;

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'history', label: 'Application History', icon: Clock },
  ];

  const handleVoid = () => {
    if (confirm(`Void credit note ${note.id}? This cannot be undone.`)) {
      onVoid(note.id);
    }
  };

  const handleRefund = () => {
    if (confirm(`Refund ${formatCurrency(note.remaining)} to tenant?`)) {
      onRefund(note.id);
    }
  };

  const handleApply = () => {
    const invoiceId = window.prompt('Apply credit to invoice ID:', note.invoiceId || '');
    if (invoiceId) onApply(note.id, invoiceId);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <FileText className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{note.id}</h2>
                <p className="text-xs text-text-muted">{note.tenantName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={note.status} />
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                    active
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Amount Card */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">
                      Credit Amount
                    </p>
                    <p className="mt-1 text-3xl font-bold font-mono text-text-primary">
                      {formatCurrency(note.amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Remaining</p>
                    <p
                      className={cn(
                        'mt-1 text-2xl font-bold font-mono',
                        note.remaining > 0 ? 'text-secondary' : 'text-accent'
                      )}
                    >
                      {formatCurrency(note.remaining)}
                    </p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      note.remaining === 0 ? 'bg-accent' : 'bg-secondary'
                    )}
                    style={{
                      width: `${note.amount > 0 ? ((note.amount - note.remaining) / note.amount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted text-right">
                  {formatCurrency(note.amount - note.remaining)} used ·{' '}
                  {formatCurrency(note.remaining)} remaining
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Tenant</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">{note.tenantName}</p>
                  <p className="text-xs text-text-muted font-mono">{note.tenantId}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">
                    Reference Invoice
                  </p>
                  <p className="mt-1 text-sm font-medium text-text-primary">
                    {note.invoiceId || '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Issued</p>
                  <p className="mt-1 text-sm text-text-primary">{note.issuedAt}</p>
                  <p className="text-xs text-text-muted">by {note.createdBy}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Expires</p>
                  <p className="mt-1 text-sm text-text-primary">{note.expiresAt}</p>
                  <p
                    className={cn(
                      'text-xs',
                      daysUntil(note.expiresAt) < 30 ? 'text-warning' : 'text-text-muted'
                    )}
                  >
                    {daysUntil(note.expiresAt) > 0
                      ? `${daysUntil(note.expiresAt)} days remaining`
                      : 'Expired'}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ReasonBadge reason={note.reason} />
                  <span className="text-xs text-text-muted">
                    {typeMeta[note.type]?.label || note.type}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{note.reasonDetail}</p>
              </div>

              {/* Notes */}
              {note.notes && (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Internal Notes
                  </p>
                  <p className="text-sm text-text-secondary">{note.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                {note.status === 'issued' && note.remaining > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApply}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefund}
                      disabled={actionLoading}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Refund
                    </Button>
                  </>
                )}
                {(note.status === 'issued' || note.status === 'partially_applied') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger border-danger/30 hover:bg-danger/10"
                    onClick={handleVoid}
                    disabled={actionLoading}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" /> Void
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard?.writeText(note.id)}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy ID
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {note.appliedTo.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface p-8 text-center">
                  <Clock className="mx-auto h-10 w-10 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">No application history yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {note.appliedTo.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <Check className="h-4 w-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          Applied to {entry.invoiceId}
                        </p>
                        <p className="text-xs text-text-muted">
                          {entry.date} · {formatCurrency(entry.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function CreditNotesPage() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'issuedAt', dir: 'desc' });

  // Fetch credit notes
  const notesQuery = useApiFetch(() => getCreditNotes(), [], { initialData: [] });
  useApiError(notesQuery.error);

  // Fetch tenants for the create-modal dropdown
  const tenantsQuery = useApiFetch(() => api.get('/admin/tenants'), [], { initialData: [] });

  const notes = useMemo(
    () => (notesQuery.data?.data ?? notesQuery.data ?? []).map(normalizeCreditNote),
    [notesQuery.data]
  );

  const tenants = useMemo(
    () =>
      (tenantsQuery.data?.data ?? tenantsQuery.data ?? []).map((t) => ({
        id: t.id ?? t.tenantId,
        name: t.name ?? t.tenantName ?? t.id,
      })),
    [tenantsQuery.data]
  );

  // Create mutation
  const createMutation = useApiMutation(createCreditNote, {
    onSuccess: () => {
      toast.success('Credit note created');
      setShowCreate(false);
      notesQuery.refetch();
    },
    onError: (err) => toast.error(err?.message || 'Failed to create credit note'),
  });

  // Apply mutation
  const applyMutation = useApiMutation((id) => applyCreditNote(id), {
    onSuccess: () => {
      toast.success('Credit note applied');
      setSelectedNote(null);
      notesQuery.refetch();
    },
    onError: (err) => toast.error(err?.message || 'Failed to apply credit note'),
  });

  // Void mutation — POST /admin/billing/credit-notes/:id/void
  const voidMutation = useApiMutation((id) => api.post(`/admin/billing/credit-notes/${id}/void`), {
    onSuccess: () => {
      toast.success('Credit note voided');
      setSelectedNote(null);
      notesQuery.refetch();
    },
    onError: (err) => toast.error(err?.message || 'Failed to void credit note'),
  });

  // Refund mutation — POST /admin/billing/credit-notes/:id/refund
  const refundMutation = useApiMutation(
    (id) => api.post(`/admin/billing/credit-notes/${id}/refund`),
    {
      onSuccess: () => {
        toast.success('Credit note refunded');
        setSelectedNote(null);
        notesQuery.refetch();
      },
      onError: (err) => toast.error(err?.message || 'Failed to refund credit note'),
    }
  );

  const actionLoading = applyMutation.loading || voidMutation.loading || refundMutation.loading;

  const filteredNotes = useMemo(() => {
    let result = notes.filter((n) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !query ||
        n.id.toLowerCase().includes(q) ||
        n.tenantName.toLowerCase().includes(q) ||
        n.reasonDetail.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchesReason = reasonFilter === 'all' || n.reason === reasonFilter;
      return matchesQuery && matchesStatus && matchesReason;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'issuedAt') {
        return sortConfig.dir === 'asc'
          ? new Date(a.issuedAt) - new Date(b.issuedAt)
          : new Date(b.issuedAt) - new Date(a.issuedAt);
      }
      if (sortConfig.key === 'amount') {
        return sortConfig.dir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortConfig.key === 'remaining') {
        return sortConfig.dir === 'asc' ? a.remaining - b.remaining : b.remaining - a.remaining;
      }
      return 0;
    });

    return result;
  }, [notes, query, statusFilter, reasonFilter, sortConfig]);

  const stats = useMemo(
    () => ({
      total: notes.length,
      issued: notes.filter((n) => n.status === 'issued').length,
      totalOutstanding: notes.filter((n) => n.remaining > 0).reduce((s, n) => s + n.remaining, 0),
      refunded: notes.filter((n) => n.status === 'refunded').length,
    }),
    [notes]
  );

  const handleCreate = async (payload) => {
    try {
      await createMutation.mutate(payload);
      return true;
    } catch {
      return false;
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filteredNotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'credit-notes-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Credit Notes</h1>
          <p className="text-sm text-text-secondary">
            Manage credits, refunds, and tenant adjustments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => notesQuery.refetch()}
            disabled={notesQuery.loading}
          >
            <RefreshCw className={cn('h-4 w-4', notesQuery.loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Credit Note
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Notes"
          value={stats.total}
          icon={FileText}
          color="text-text-primary"
          subtext="All time"
        />
        <StatCard
          label="Issued"
          value={stats.issued}
          icon={Clock}
          color="text-info"
          subtext="Awaiting use"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.totalOutstanding)}
          icon={DollarSign}
          color="text-secondary"
          subtext="Unapplied balance"
        />
        <StatCard
          label="Refunded"
          value={stats.refunded}
          icon={RotateCcw}
          color="text-accent"
          subtext="Cash back issued"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by ID, tenant, or reason..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Reasons</option>
            {Object.entries(reasonMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredNotes.length}</span> of{' '}
        {notes.length} credit notes
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                {[
                  { key: 'id', label: 'Credit Note' },
                  { key: 'tenantName', label: 'Tenant' },
                  { key: 'reason', label: 'Reason' },
                  { key: 'status', label: 'Status' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'remaining', label: 'Remaining' },
                  { key: 'issuedAt', label: 'Issued' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key &&
                        (sortConfig.dir === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notesQuery.loading && notes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                    Loading credit notes…
                  </td>
                </tr>
              ) : (
                <>
                  {filteredNotes.map((note) => (
                    <tr
                      key={note.id}
                      className="hover:bg-background/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedNote(note)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                            <FileText className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary font-mono">
                              {note.id}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {note.invoiceId || 'No invoice'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-primary">{note.tenantName}</p>
                        <p className="text-[10px] text-text-muted font-mono">{note.tenantId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <ReasonBadge reason={note.reason} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={note.status} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-medium text-text-primary">
                          {formatCurrency(note.amount)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className={cn(
                            'text-sm font-mono font-medium',
                            note.remaining > 0 ? 'text-secondary' : 'text-accent'
                          )}
                        >
                          {formatCurrency(note.remaining)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{note.issuedAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNote(note);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredNotes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        <FileText className="mx-auto h-10 w-10 mb-3" />
                        <p>No credit notes match your filters.</p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateCreditNoteModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          tenants={tenants}
          saving={createMutation.loading}
        />
      )}

      {selectedNote && (
        <CreditNoteDrawer
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onVoid={(id) => voidMutation.mutate(id)}
          onRefund={(id) => refundMutation.mutate(id)}
          onApply={(id) => applyMutation.mutate(id)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}
