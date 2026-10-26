// apps/web/src/app/app/support/page.jsx
// Staff Support Desk — tickets with SLA tracking, assignment, threading,
// internal notes and CSAT. Wired to /v1/tickets (SUPPORT module).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Inbox,
  UserCheck,
  Star,
  Send,
  X,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { PermissionGuard } from '../../../components/PermissionGuard';
import { useTickets, useTicket, useTicketStats } from '../../../hooks/useTickets';
import { createTicket } from '../../../api/tickets';
import { listGuests } from '../../../api/guests';
import { useHousekeepingStaff } from '../../../hooks/useHousekeeping';
import { extractList, cn } from '../../../lib/utils';

// ─── Domain constants ───
const CATEGORIES = [
  { value: 'billing', label: 'Billing' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'technology', label: 'Technology' },
  { value: 'room_service', label: 'Room Service' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'general', label: 'General' },
];

const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_guest', label: 'Waiting Guest' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_META = {
  open: { label: 'Open', chip: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  in_progress: { label: 'In Progress', chip: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  waiting_guest: {
    label: 'Waiting Guest',
    chip: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  resolved: { label: 'Resolved', chip: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  closed: { label: 'Closed', chip: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const PRIORITY_META = {
  low: { label: 'Low', chip: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  medium: { label: 'Medium', chip: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  high: { label: 'High', chip: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  urgent: { label: 'Urgent', chip: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// ─── Helpers ───
const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

function timeAgo(d) {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function StatusChip({ status }) {
  const meta = STATUS_META[status] ?? { label: status, chip: '' };
  return (
    <Badge variant="outline" className={cn('border', meta.chip)}>
      {meta.label}
    </Badge>
  );
}

function PriorityChip({ priority }) {
  const meta = PRIORITY_META[priority] ?? { label: priority, chip: '' };
  return (
    <Badge variant="outline" className={cn('border', meta.chip)}>
      {meta.label}
    </Badge>
  );
}

// ─── Page ───
export default function SupportPage() {
  return (
    <PermissionGuard resource="ticket" action="read">
      <SupportDesk />
    </PermissionGuard>
  );
}

function SupportDesk() {
  const { tickets, meta, loading, error, params, setParams, refresh } = useTickets();
  const [statsKey, setStatsKey] = useState(0);
  const stats = useTicketStats(statsKey);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [sla, setSla] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Debounced search → params
  useEffect(() => {
    const t = setTimeout(() => {
      setParams((p) => ({ ...p, q: q || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  const applyFilter = (key, value) => {
    const setter = { status: setStatus, priority: setPriority, category: setCategory, sla: setSla }[
      key
    ];
    setter(value);
    setParams((p) => ({ ...p, [key]: value || undefined, page: 1 }));
  };

  const bump = useCallback(() => {
    refresh();
    setStatsKey((k) => k + 1);
  }, [refresh]);

  const statCards = [
    { label: 'Total', value: stats?.total, icon: Inbox, tone: 'text-foreground' },
    { label: 'Open', value: stats?.open, icon: AlertTriangle, tone: 'text-blue-600' },
    { label: 'In Progress', value: stats?.inProgress, icon: Clock, tone: 'text-amber-600' },
    {
      label: 'Waiting Guest',
      value: stats?.waitingGuest,
      icon: UserCheck,
      tone: 'text-purple-600',
    },
    {
      label: 'Unassigned',
      value: stats?.unassigned,
      icon: LifeBuoy,
      tone: stats?.unassigned > 0 ? 'text-red-600' : 'text-foreground',
    },
    {
      label: 'SLA Breached',
      value: stats?.slaBreached,
      icon: AlertTriangle,
      tone: stats?.slaBreached > 0 ? 'text-red-600' : 'text-emerald-600',
    },
    {
      label: 'Avg CSAT',
      value: stats?.avgSatisfaction != null ? `${stats.avgSatisfaction.toFixed(1)}★` : '—',
      icon: Star,
      tone: 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-sm text-muted-foreground">
            Guest tickets from the portal, email and staff — SLA-tracked with escalation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={bump} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className={cn('h-5 w-5 shrink-0', s.tone)} />
              <div className="min-w-0">
                <div className={cn('text-xl font-bold leading-none', s.tone)}>{s.value ?? '—'}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subject, number, guest…"
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => applyFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={priority}
          onChange={(e) => applyFilter('priority', e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={category}
          onChange={(e) => applyFilter('category', e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={sla}
          onChange={(e) => applyFilter('sla', e.target.value)}
        >
          <option value="">SLA: all</option>
          <option value="ok">SLA: on track</option>
          <option value="due_soon">SLA: due soon</option>
          <option value="breached">SLA: breached</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">SLA</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      </td>
                    </tr>
                  ))}
                {!loading && tickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <Inbox className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      No tickets match these filters.
                    </td>
                  </tr>
                )}
                {!loading &&
                  tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        'cursor-pointer border-b transition-colors hover:bg-muted/40',
                        selectedId === t.id && 'bg-muted/60'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.subject}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{t.number}</span>
                          <span>·</span>
                          <span>
                            {CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                          </span>
                          <span>·</span>
                          <span className="capitalize">{t.source.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.guestName ?? <span className="opacity-50">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={t.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityChip priority={t.priority} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.assigneeName ?? <span className="text-red-600">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        {t.slaBreached ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Breached
                          </span>
                        ) : t.slaResolveDueAt ? (
                          <span className="text-xs text-muted-foreground">
                            due {timeAgo(t.slaResolveDueAt).replace(' ago', '')}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {timeAgo(t.lastMessageAt || t.updatedAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>
              {meta.total} ticket{meta.total === 1 ? '' : 's'} · page {meta.page} of{' '}
              {meta.totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={params.page <= 1}
                onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={params.page >= meta.totalPages}
                onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedId && (
        <TicketDrawer id={selectedId} onClose={() => setSelectedId(null)} onChanged={bump} />
      )}
      {createOpen && (
        <CreateTicketModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            setSelectedId(null);
            bump();
          }}
        />
      )}
    </div>
  );
}

// ─── Detail drawer ───
function TicketDrawer({ id, onClose, onChanged }) {
  const { ticket, loading, error, comment, assign, setStatus, close } = useTicket(id);
  const staffQuery = useHousekeepingStaff();
  const staff = useMemo(() => extractList(staffQuery.data), [staffQuery.data]);

  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const run = useCallback(
    async (fn) => {
      setBusy(true);
      setActionError(null);
      try {
        await fn();
        onChanged();
      } catch (e) {
        setActionError(e?.message ?? 'Action failed');
      } finally {
        setBusy(false);
        setConfirmClose(false);
      }
    },
    [onChanged]
  );

  const sendReply = () => {
    if (!reply.trim()) return;
    run(async () => {
      await comment(reply.trim(), internal);
      setReply('');
      setInternal(false);
    });
  };

  const messages = useMemo(
    () =>
      [...(ticket?.messages ?? [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [ticket?.messages]
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l bg-background shadow-xl">
        {/* Drawer header */}
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            {loading && !ticket ? (
              <div className="h-6 w-56 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{ticket?.subject}</h2>
                  {ticket?.slaBreached && (
                    <Badge
                      variant="outline"
                      className="border border-red-500/20 bg-red-500/10 text-red-600"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      SLA breached
                    </Badge>
                  )}
                  {ticket?.escalationLevel >= 2 && (
                    <Badge
                      variant="outline"
                      className="border border-red-500/20 bg-red-500/10 text-red-600"
                    >
                      Escalated
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{ticket?.number}</span>
                  <span>·</span>
                  <StatusChip status={ticket?.status} />
                  <span>·</span>
                  <PriorityChip priority={ticket?.priority} />
                  <span>·</span>
                  <span className="capitalize">{ticket?.source?.replace(/_/g, ' ')}</span>
                </div>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {actionError && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </div>
          )}

          {ticket && (
            <>
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-md border p-3 text-sm">
                <Meta label="Guest" value={ticket.guestName ?? '—'} />
                <Meta label="Reservation" value={ticket.reservation?.confirmationNumber ?? '—'} />
                <Meta label="Property" value={ticket.property?.name ?? '—'} />
                <Meta
                  label="Created"
                  value={`${fmtDate(ticket.createdAt)} · ${ticket.assigneeName ?? 'Unassigned'}`}
                />
                <Meta
                  label="Response due"
                  value={ticket.slaResponseDueAt ? fmtDate(ticket.slaResponseDueAt) : '—'}
                />
                <Meta
                  label="Resolve due"
                  value={ticket.slaResolveDueAt ? fmtDate(ticket.slaResolveDueAt) : '—'}
                />
              </div>

              {/* Description */}
              <div>
                <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                  Original request
                </div>
                <p className="whitespace-pre-wrap rounded-md border p-3 text-sm">
                  {ticket.description}
                </p>
              </div>

              {/* CSAT */}
              {ticket.satisfactionRating != null && (
                <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  Guest rated {ticket.satisfactionRating}/5
                  {ticket.satisfactionComment && (
                    <span className="text-muted-foreground">— “{ticket.satisfactionComment}”</span>
                  )}
                </div>
              )}

              {/* Thread */}
              <div>
                <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Conversation
                </div>
                <div className="space-y-2">
                  {messages.length === 0 && (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'rounded-md border p-3 text-sm',
                        m.isInternal
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : m.authorType === 'guest'
                            ? 'bg-muted/40'
                            : 'bg-background'
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{m.authorName}</span>
                        <span className="capitalize">{m.authorType}</span>
                        {m.isInternal && (
                          <Badge
                            variant="outline"
                            className="border border-amber-500/20 bg-amber-500/10 text-amber-600"
                          >
                            Internal
                          </Badge>
                        )}
                        <span>·</span>
                        <span>{fmtDate(m.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer: actions + reply */}
        {ticket && (
          <div className="space-y-3 border-t px-5 py-4">
            {/* Status + assign row */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={ticket.assigneeId ?? ''}
                disabled={busy}
                onChange={(e) => run(() => assign(e.target.value || null))}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>

              {ticket.status !== 'in_progress' && ticket.status !== 'closed' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => setStatus('in_progress'))}
                >
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  Start
                </Button>
              )}
              {ticket.status === 'in_progress' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => setStatus('waiting_guest'))}
                >
                  <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                  Waiting guest
                </Button>
              )}
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => setStatus('resolved'))}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Resolve
                </Button>
              )}
              {ticket.status === 'resolved' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => setStatus('open'))}
                >
                  Reopen
                </Button>
              )}
              {ticket.status !== 'closed' &&
                (confirmClose ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => run(close)}
                    >
                      Confirm close
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setConfirmClose(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setConfirmClose(true)}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Close
                  </Button>
                ))}
            </div>

            {/* Reply box */}
            {ticket.status !== 'closed' && (
              <div className="space-y-2">
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Reply to guest, or tick internal note for a staff-only note…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={internal}
                      onChange={(e) => setInternal(e.target.checked)}
                    />
                    Internal note (guest never sees this)
                  </label>
                  <Button size="sm" disabled={busy || !reply.trim()} onClick={sendReply}>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="truncate">{value}</div>
    </div>
  );
}

// ─── Create ticket modal ───
function CreateTicketModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });
  const [guest, setGuest] = useState(null); // { id, name }
  const [guestQ, setGuestQ] = useState('');
  const [guestResults, setGuestResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const searchRef = useRef(null);

  // Debounced guest search
  useEffect(() => {
    if (!guestQ.trim()) {
      setGuestResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await listGuests({ search: guestQ.trim(), pageSize: 6 });
        const rows = res?.data ?? [];
        setGuestResults(
          rows.map((g) => ({
            id: g.id,
            name: `${g.firstName} ${g.lastName}`,
            email: g.email,
          }))
        );
      } catch {
        setGuestResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [guestQ]);

  useEffect(() => {
    const onDoc = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setGuestResults([]);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const submit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      setFormError('Subject and description are required.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await createTicket({
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        guestId: guest?.id,
        message: form.message.trim() || undefined,
      });
      onCreated();
    } catch (e) {
      setFormError(e?.message ?? 'Failed to create ticket');
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-lg border bg-background p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">New ticket</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {formError && (
          <div className="mb-3 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Subject *
            </label>
            <Input
              value={form.subject}
              onChange={set('subject')}
              placeholder="Short summary of the issue"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description *
            </label>
            <textarea
              className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={set('description')}
              placeholder="What happened, what the guest needs, any room/folio references…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Category
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={set('category')}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Priority
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.priority}
                onChange={set('priority')}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Guest picker (optional) */}
          <div ref={searchRef} className="relative">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Guest (optional)
            </label>
            {guest ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{guest.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setGuest(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <Input
                  value={guestQ}
                  onChange={(e) => setGuestQ(e.target.value)}
                  placeholder="Search guest by name or email…"
                />
                {searching && <p className="mt-1 text-xs text-muted-foreground">Searching…</p>}
                {guestResults.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-md border bg-background shadow-lg">
                    {guestResults.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setGuest(g);
                          setGuestQ('');
                          setGuestResults([]);
                        }}
                      >
                        <span>{g.name}</span>
                        <span className="text-xs text-muted-foreground">{g.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              First reply (optional)
            </label>
            <textarea
              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.message}
              onChange={set('message')}
              placeholder="Sent to the guest as the first staff response…"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Creating…' : 'Create ticket'}
          </Button>
        </div>
      </div>
    </div>
  );
}
