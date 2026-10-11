/* src/app/admin/billing/dunning/page.jsx */
import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  SkipForward,
  X,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  Ban,
  DollarSign,
  CreditCard,
  Eye,
  Download,
  Loader2,
  History,
  Settings,
  Shield,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { triggerDunning } from '../../../../api/billing';
import { api } from '../../../../api/client';
import { useApiFetch } from '../../../../hooks/useApiFetch';
import { useApiMutation } from '../../../../hooks/useApiMutation';
import { useApiError } from '../../../../hooks/useApiError';
import { useToast } from '../../../../hooks/use-toast';

/* ─── Default Dunning Config (used until the API returns one) ─── */
const defaultDunningConfig = {
  stages: [
    {
      id: 1,
      name: 'Friendly Reminder',
      delay: 0,
      action: 'email',
      template: 'payment_failed_friendly',
      retryInterval: 24,
    },
    {
      id: 2,
      name: 'Urgent Notice',
      delay: 3,
      action: 'email',
      template: 'payment_failed_urgent',
      retryInterval: 24,
    },
    {
      id: 3,
      name: 'Phone Outreach',
      delay: 5,
      action: 'phone',
      template: 'payment_failed_phone',
      retryInterval: 48,
    },
    {
      id: 4,
      name: 'Final Notice / Suspend',
      delay: 7,
      action: 'suspend',
      template: 'payment_failed_final',
      retryInterval: 0,
    },
  ],
  retrySchedule: [24, 24, 48, 48, 72], // hours between retries
  autoSuspendAfterStage: 4,
  gracePeriodDays: 3,
  maxRetriesPerInvoice: 5,
};

/* ─── Metadata ─── */
const statusMeta = {
  active: {
    label: 'Active',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  on_hold: { label: 'On Hold', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20' },
  resolved: {
    label: 'Resolved',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  suspended: {
    label: 'Suspended',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-text-muted',
    class: 'bg-neutral/10 text-text-muted border-border',
  },
};

const failureReasonMeta = {
  insufficient_funds: { label: 'Insufficient Funds', color: 'text-warning' },
  expired_card: { label: 'Expired Card', color: 'text-info' },
  bank_account_closed: { label: 'Account Closed', color: 'text-danger' },
  do_not_honor: { label: 'Do Not Honor', color: 'text-danger' },
  processing_error: { label: 'Processing Error', color: 'text-info' },
};

/* ─── Helpers ─── */
function formatCurrency(amount, currency = 'ZAR') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}

function formatDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString().replace('T', ' ').slice(0, 19);
}

function timeUntil(dateStr) {
  if (!dateStr) return '—';
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60));
  if (diff < 0) return 'Overdue';
  if (diff < 1) return '< 1h';
  if (diff < 24) return `${diff}h`;
  return `${Math.floor(diff / 24)}d ${diff % 24}h`;
}

/* Normalize an API dunning record/case into the shape the UI expects */
function normalizeDunningRecord(r) {
  const statusMap = {
    onhold: 'on_hold',
    'on-hold': 'on_hold',
    paused: 'on_hold',
    cancelled: 'cancelled',
  };
  const rawStatus = (r.status ?? 'active').toLowerCase();
  return {
    id: r.id ?? r.dunningId ?? '',
    tenantId: r.tenantId ?? '',
    tenantName: r.tenantName ?? r.tenantId ?? 'Unknown',
    invoiceId: r.invoiceId ?? '',
    invoiceAmount: r.invoiceAmount ?? r.amountDue ?? r.amount ?? 0,
    amountDue: r.amountDue ?? r.amount ?? 0,
    currency: r.currency ?? 'ZAR',
    status: statusMap[rawStatus] ?? rawStatus,
    stage: r.stage ?? r.currentStage ?? 0,
    maxStages: r.maxStages ?? 4,
    retryCount: r.retryCount ?? r.retries ?? 0,
    maxRetries: r.maxRetries ?? 5,
    lastRetryAt: formatDateTime(r.lastRetryAt),
    nextRetryAt: formatDateTime(r.nextRetryAt),
    paymentMethod: r.paymentMethod ?? r.paymentMethodLabel ?? '—',
    failureReason: r.failureReason ?? r.failureCode ?? 'processing_error',
    failureDetail: r.failureDetail ?? r.failureMessage ?? '',
    createdAt: formatDateTime(r.createdAt)?.slice(0, 10) ?? '',
    escalatedAt: r.escalatedAt ?? null,
    suspendedAt: r.suspendedAt ?? null,
    history: (r.history ?? r.events ?? []).map((h) => ({
      date: formatDateTime(h.date ?? h.createdAt) ?? '',
      action: h.action ?? h.type ?? 'Event',
      type: h.type ?? 'info',
      actor: h.actor ?? h.triggeredBy ?? 'System',
      detail: h.detail ?? h.message ?? undefined,
    })),
    communications: (r.communications ?? r.emails ?? []).map((c) => ({
      type: c.type ?? 'email',
      sentAt: formatDateTime(c.sentAt ?? c.createdAt) ?? '',
      status: c.status ?? 'sent',
      subject: c.subject ?? '',
      opened: c.opened ?? undefined,
    })),
    autoRetry: r.autoRetry ?? true,
    manualHold: r.manualHold ?? rawStatus === 'on_hold',
  };
}

/* ─── Components ─── */
function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.active;
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

function StageIndicator({ stage, maxStages }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStages }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-2 rounded-full',
            i < stage ? 'bg-danger' : i === stage ? 'bg-warning animate-pulse' : 'bg-border'
          )}
        />
      ))}
      <span className="ml-1 text-xs text-text-muted">
        {stage}/{maxStages}
      </span>
    </div>
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

/* ─── Detail Drawer ─── */
function DunningDetailDrawer({ record, onClose, onAction, dunningConfig, actionLoading }) {
  const [activeTab, setActiveTab] = useState('timeline');
  if (!record) return null;

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: History },
    { id: 'communications', label: 'Communications', icon: Mail },
    { id: 'config', label: 'Dunning Config', icon: Settings },
  ];

  const handleRetry = () => onAction(record.id, 'retry', record);
  const handleHold = () => onAction(record.id, 'hold', record);
  const handleResume = () => onAction(record.id, 'resume', record);
  const handleSkip = () => onAction(record.id, 'skip', record);
  const handleResolve = () => onAction(record.id, 'resolve', record);
  const handleSuspend = () => onAction(record.id, 'suspend', record);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  record.status === 'suspended'
                    ? 'bg-danger/10'
                    : record.status === 'resolved'
                      ? 'bg-accent/10'
                      : 'bg-warning/10'
                )}
              >
                <AlertTriangle
                  className={cn(
                    'h-5 w-5',
                    record.status === 'suspended'
                      ? 'text-danger'
                      : record.status === 'resolved'
                        ? 'text-accent'
                        : 'text-warning'
                  )}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{record.id}</h2>
                <p className="text-xs text-text-muted">{record.tenantName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={record.status} />
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
          {/* Amount Card */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">Amount Due</p>
                <p className="mt-1 text-3xl font-bold font-mono text-text-primary">
                  {formatCurrency(record.amountDue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted uppercase tracking-wider">Invoice</p>
                <p className="mt-1 text-sm font-mono text-text-primary">{record.invoiceId}</p>
                <p className="text-xs text-text-muted">{formatCurrency(record.invoiceAmount)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-secondary">{record.paymentMethod}</span>
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  failureReasonMeta[record.failureReason]?.color || 'text-text-muted'
                )}
              >
                {failureReasonMeta[record.failureReason]?.label || record.failureReason}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Dunning Progress
              </p>
              <StageIndicator stage={record.stage} maxStages={record.maxStages} />
            </div>
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  record.status === 'resolved'
                    ? 'bg-accent'
                    : record.status === 'suspended'
                      ? 'bg-danger'
                      : 'bg-warning'
                )}
                style={{
                  width: `${record.maxStages > 0 ? (record.stage / record.maxStages) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-muted">Retry Count</p>
                <p className="font-mono font-medium text-text-primary">
                  {record.retryCount} / {record.maxRetries}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Next Retry</p>
                <p className="font-mono font-medium text-text-primary">
                  {record.nextRetryAt ? timeUntil(record.nextRetryAt) : '—'}
                </p>
              </div>
            </div>
          </div>

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Activity Timeline</h3>
              {record.history.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface p-8 text-center">
                  <History className="mx-auto h-10 w-10 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {record.history.map((entry, index) => (
                    <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                      {index < record.history.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                      )}
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                          entry.type === 'danger'
                            ? 'border-danger bg-danger/10'
                            : entry.type === 'warning'
                              ? 'border-warning bg-warning/10'
                              : entry.type === 'accent'
                                ? 'border-accent bg-accent/10'
                                : 'border-info bg-info/10'
                        )}
                      >
                        {entry.type === 'danger' ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                        ) : entry.type === 'warning' ? (
                          <Clock className="h-3.5 w-3.5 text-warning" />
                        ) : entry.type === 'accent' ? (
                          <Check className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <History className="h-3.5 w-3.5 text-info" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">{entry.action}</p>
                        {entry.detail && (
                          <p className="text-xs text-text-secondary mt-0.5">{entry.detail}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                          <span>{entry.actor}</span>
                          <span>·</span>
                          <span>{entry.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Communications</h3>
              {record.communications.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface p-8 text-center">
                  <Mail className="mx-auto h-10 w-10 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">No communications sent yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {record.communications.map((comm, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-text-muted" />
                          <span className="text-sm font-medium text-text-primary">
                            {comm.subject}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-medium uppercase px-2 py-0.5 rounded-full',
                            comm.status === 'delivered'
                              ? 'bg-accent/10 text-accent'
                              : comm.status === 'bounced'
                                ? 'bg-danger/10 text-danger'
                                : 'bg-warning/10 text-warning'
                          )}
                        >
                          {comm.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>{comm.type}</span>
                        <span>·</span>
                        <span>{comm.sentAt}</span>
                        {comm.opened !== undefined && (
                          <>
                            <span>·</span>
                            <span className={comm.opened ? 'text-accent' : 'text-text-muted'}>
                              {comm.opened ? 'Opened' : 'Unopened'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Dunning Configuration</h3>
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                {(dunningConfig.stages ?? []).map((stage) => (
                  <div
                    key={stage.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3',
                      stage.id <= record.stage
                        ? 'border-warning/30 bg-warning/5'
                        : 'border-border bg-background'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        stage.id <= record.stage
                          ? 'bg-warning text-white'
                          : 'bg-border text-text-muted'
                      )}
                    >
                      {stage.id}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">{stage.name}</p>
                      <p className="text-xs text-text-muted">
                        Day {stage.delay} · {stage.action} · Retry every {stage.retryInterval}h
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Grace Period</span>
                  <span className="font-mono text-text-primary">
                    {dunningConfig.gracePeriodDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Max Retries</span>
                  <span className="font-mono text-text-primary">
                    {dunningConfig.maxRetriesPerInvoice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Auto-Suspend After</span>
                  <span className="font-mono text-text-primary">
                    Stage {dunningConfig.autoSuspendAfterStage}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {record.status === 'active' && (
              <>
                <Button size="sm" onClick={handleRetry} disabled={actionLoading}>
                  {actionLoading ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Retry Now
                </Button>
                <Button size="sm" variant="outline" onClick={handleHold} disabled={actionLoading}>
                  <Pause className="mr-1.5 h-3.5 w-3.5" /> Hold
                </Button>
                <Button size="sm" variant="outline" onClick={handleSkip} disabled={actionLoading}>
                  <SkipForward className="mr-1.5 h-3.5 w-3.5" /> Skip Stage
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-accent border-accent/30 hover:bg-accent/10"
                  onClick={handleResolve}
                  disabled={actionLoading}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Mark Resolved
                </Button>
              </>
            )}
            {record.status === 'on_hold' && (
              <>
                <Button size="sm" onClick={handleResume} disabled={actionLoading}>
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Resume
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-accent border-accent/30 hover:bg-accent/10"
                  onClick={handleResolve}
                  disabled={actionLoading}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Mark Resolved
                </Button>
              </>
            )}
            {record.status === 'active' && record.stage >= 3 && (
              <Button
                size="sm"
                variant="outline"
                className="text-danger border-danger/30 hover:bg-danger/10 ml-auto"
                onClick={handleSuspend}
                disabled={actionLoading}
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Suspend Account
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function DunningPage() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', dir: 'desc' });

  // Fetch dunning records — GET /admin/dunning
  const recordsQuery = useApiFetch(() => api.get('/admin/dunning'), [], { initialData: [] });
  useApiError(recordsQuery.error);

  // Fetch dunning configuration — GET /admin/dunning/config (falls back to defaults)
  const configQuery = useApiFetch(() => api.get('/admin/dunning/config'), [], {
    initialData: defaultDunningConfig,
  });

  const dunningConfig = configQuery.data?.data ?? configQuery.data ?? defaultDunningConfig;

  const records = useMemo(
    () => (recordsQuery.data?.data ?? recordsQuery.data ?? []).map(normalizeDunningRecord),
    [recordsQuery.data]
  );

  // Single mutation driving every dunning action.
  // retry uses the billing API's triggerDunning(invoiceId); the rest post to /admin/dunning/:id/:action
  const actionMutation = useApiMutation(
    ({ id, action, record }) => {
      if (action === 'retry') {
        return triggerDunning(record?.invoiceId ?? id);
      }
      return api.post(`/admin/dunning/${id}/${action}`);
    },
    {
      onSuccess: (_data, vars) => {
        const labels = {
          retry: 'Retry triggered',
          hold: 'Record placed on hold',
          resume: 'Record resumed',
          skip: 'Stage skipped',
          resolve: 'Marked as resolved',
          suspend: 'Account suspended',
        };
        toast.success(labels[vars?.action] ?? 'Action completed');
        setSelectedRecord(null);
        recordsQuery.refetch();
      },
      onError: (err) => toast.error(err?.message || 'Dunning action failed'),
    }
  );

  const handleAction = (id, action, record) => {
    actionMutation.mutate({ id, action, record });
  };

  const filteredRecords = useMemo(() => {
    let result = records.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !query ||
        r.id.toLowerCase().includes(q) ||
        r.tenantName.toLowerCase().includes(q) ||
        r.invoiceId.toLowerCase().includes(q) ||
        r.failureReason.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'createdAt') {
        return sortConfig.dir === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortConfig.key === 'amountDue') {
        return sortConfig.dir === 'asc' ? a.amountDue - b.amountDue : b.amountDue - a.amountDue;
      }
      if (sortConfig.key === 'stage') {
        return sortConfig.dir === 'asc' ? a.stage - b.stage : b.stage - a.stage;
      }
      return 0;
    });

    return result;
  }, [records, query, statusFilter, sortConfig]);

  const stats = useMemo(
    () => ({
      total: records.length,
      active: records.filter((r) => r.status === 'active').length,
      onHold: records.filter((r) => r.status === 'on_hold').length,
      totalAtRisk: records
        .filter((r) => r.status === 'active')
        .reduce((s, r) => s + r.amountDue, 0),
      suspended: records.filter((r) => r.status === 'suspended').length,
      resolved: records.filter((r) => r.status === 'resolved').length,
    }),
    [records]
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filteredRecords, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dunning-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dunning Control</h1>
          <p className="text-sm text-text-secondary">
            Manage failed payments, retry logic, and collection workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => recordsQuery.refetch()}
            disabled={recordsQuery.loading}
          >
            <RefreshCw className={cn('h-4 w-4', recordsQuery.loading && 'animate-spin')} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" disabled title="Configure via API">
            <Settings className="mr-1.5 h-4 w-4" /> Configure
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Active"
          value={stats.active}
          icon={AlertTriangle}
          color="text-warning"
          subtext="In collection"
        />
        <StatCard
          label="On Hold"
          value={stats.onHold}
          icon={Pause}
          color="text-info"
          subtext="Manual pause"
        />
        <StatCard
          label="At Risk"
          value={formatCurrency(stats.totalAtRisk)}
          icon={DollarSign}
          color="text-danger"
          subtext="Outstanding"
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={Check}
          color="text-accent"
          subtext="This month"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by ID, tenant, invoice, or failure reason..."
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
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredRecords.length}</span> of{' '}
        {records.length} dunning records
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                {[
                  { key: 'id', label: 'Dunning ID' },
                  { key: 'tenantName', label: 'Tenant' },
                  { key: 'amountDue', label: 'Amount Due' },
                  { key: 'stage', label: 'Stage' },
                  { key: 'status', label: 'Status' },
                  { key: 'failureReason', label: 'Failure' },
                  { key: 'nextRetryAt', label: 'Next Retry' },
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
              {recordsQuery.loading && records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                    Loading dunning records…
                  </td>
                </tr>
              ) : (
                <>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-background/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg',
                              record.status === 'suspended'
                                ? 'bg-danger/10'
                                : record.status === 'resolved'
                                  ? 'bg-accent/10'
                                  : 'bg-warning/10'
                            )}
                          >
                            <AlertTriangle
                              className={cn(
                                'h-4 w-4',
                                record.status === 'suspended'
                                  ? 'text-danger'
                                  : record.status === 'resolved'
                                    ? 'text-accent'
                                    : 'text-warning'
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary font-mono">
                              {record.id}
                            </p>
                            <p className="text-[10px] text-text-muted">{record.invoiceId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text-primary">{record.tenantName}</p>
                        <p className="text-[10px] text-text-muted font-mono">{record.tenantId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-medium text-text-primary">
                          {formatCurrency(record.amountDue)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StageIndicator stage={record.stage} maxStages={record.maxStages} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-xs font-medium',
                            failureReasonMeta[record.failureReason]?.color || 'text-text-muted'
                          )}
                        >
                          {failureReasonMeta[record.failureReason]?.label || record.failureReason}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {record.nextRetryAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-text-muted" />
                            <span className="text-xs text-text-secondary">
                              {timeUntil(record.nextRetryAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecord(record);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {record.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(record.id, 'retry', record);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                              title="Retry Now"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        <Shield className="mx-auto h-10 w-10 mb-3 text-accent" />
                        <p>No dunning records match your filters.</p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selectedRecord && (
        <DunningDetailDrawer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onAction={handleAction}
          dunningConfig={dunningConfig}
          actionLoading={actionMutation.loading}
        />
      )}
    </div>
  );
}
