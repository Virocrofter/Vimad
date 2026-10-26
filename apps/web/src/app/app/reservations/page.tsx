/* apps/web/src/app/app/reservations/page.tsx */
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  LogIn,
  XCircle,
  Calendar,
  CheckSquare,
  Square,
  Trash2,
  Download,
  Printer,
  Plus,
  ArrowRightToLine,
  BedDouble,
  ArrowLeftToLine,
  ListChecks,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonText } from '../../../components/ui/skeleton';
import type { Reservation } from '../../../types';
import { useReservations, useCheckIn, useCancelReservation } from '../../../hooks/useReservations';

const zar = (v: unknown) => formatCurrency(Number(v ?? 0));

const statusMeta: Record<string, { label: string; class: string }> = {
  confirmed: { label: 'Confirmed', class: 'bg-accent/10 text-accent border-accent/20' },
  checked_in: { label: 'Checked In', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  checked_out: { label: 'Checked Out', class: 'bg-neutral/10 text-text-muted border-border' },
  no_show: { label: 'No-Show', class: 'bg-danger/10 text-danger border-danger/20' },
  cancelled: { label: 'Cancelled', class: 'bg-danger/10 text-danger border-danger/20' },
};

function StatusBadge({ status }: { status: Reservation['status'] }) {
  const meta = statusMeta[status] || statusMeta.confirmed;
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

interface InlineActionsProps {
  status: Reservation['status'];
  disabled?: boolean;
  onView: () => void;
  onCheckIn: () => void;
  onCancel: () => void;
}

function InlineActions({ status, disabled, onView, onCheckIn, onCancel }: InlineActionsProps) {
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onView}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      {status === 'confirmed' && (
        <button
          onClick={onCheckIn}
          disabled={disabled}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-secondary/10 hover:text-secondary disabled:opacity-40"
          title="Check In"
        >
          <LogIn className="h-4 w-4" />
        </button>
      )}
      {(status === 'confirmed' || status === 'checked_in') && (
        <button
          onClick={onCancel}
          disabled={disabled}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger disabled:opacity-40"
          title="Cancel"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function guestNameOf(r: Reservation): string {
  if (r.guestName) return r.guestName;
  const g = r.guest as { firstName?: string; lastName?: string } | undefined;
  return g ? `${g.firstName ?? ''} ${g.lastName ?? ''}`.trim() : '';
}

const fmtDate = (iso?: string) => (iso ?? '').slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

type ViewTab = 'all' | 'arrivals' | 'inhouse' | 'departures';

const TAB_PARAMS: Record<ViewTab, Record<string, string>> = {
  all: {},
  arrivals: { status: 'confirmed', arrivalFrom: today(), arrivalTo: today() },
  inhouse: { status: 'checked_in' },
  departures: { status: 'checked_in', departureFrom: today(), departureTo: today() },
};

export default function ReservationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('search') ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tab, setTab] = useState<ViewTab>('all');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const resetKey = `${tab}|${statusFilter}|${sourceFilter}|${dateFrom}|${dateTo}|${debouncedQuery}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (prevResetKey !== resetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
    setSelected(new Set());
  }

  const params = useMemo(() => {
    const p: Record<string, string | number> = { page, pageSize: 25 };
    Object.assign(p, TAB_PARAMS[tab]);
    if (statusFilter !== 'all') p.status = statusFilter;
    if (sourceFilter !== 'all') p.source = sourceFilter;
    if (dateFrom) p.arrivalFrom = dateFrom;
    if (dateTo) p.arrivalTo = dateTo;
    if (debouncedQuery.trim()) p.search = debouncedQuery.trim();
    return p;
  }, [page, tab, statusFilter, sourceFilter, dateFrom, dateTo, debouncedQuery]);

  const { reservations, meta, isLoading, error, refetch } = useReservations(params);

  const arrivalsQ = useReservations({
    pageSize: 1,
    status: 'confirmed',
    arrivalFrom: today(),
    arrivalTo: today(),
  });
  const inhouseQ = useReservations({ pageSize: 1, status: 'checked_in' });
  const departuresQ = useReservations({
    pageSize: 1,
    status: 'checked_in',
    departureFrom: today(),
    departureTo: today(),
  });

  const counts: Record<ViewTab, number> = {
    all: meta?.total ?? 0,
    arrivals: arrivalsQ.meta?.total ?? 0,
    inhouse: inhouseQ.meta?.total ?? 0,
    departures: departuresQ.meta?.total ?? 0,
  };

  const checkIn = useCheckIn();
  const cancel = useCancelReservation();

  const handleCheckIn = (r: Reservation) => {
    setActionError(null);
    if (!r.roomNumber) {
      navigate(`/app/reservations/${r.id}`);
      return;
    }
    checkIn.mutate(r.id, {
      onError: (e: Error) => setActionError(e.message),
    });
  };

  const handleCancel = (r: Reservation) => {
    if (!window.confirm(`Cancel reservation ${r.confirmationNumber}?`)) return;
    setActionError(null);
    cancel.mutate({ id: r.id }, { onError: (e: Error) => setActionError(e.message) });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === reservations.length) setSelected(new Set());
    else setSelected(new Set(reservations.map((r: Reservation) => r.id)));
  };
  const clearSelection = () => setSelected(new Set());

  const bulkCheckIn = async () => {
    const targets = reservations.filter(
      (r: Reservation) => selected.has(r.id) && r.status === 'confirmed' && r.roomNumber
    );
    if (targets.length === 0) {
      setActionError(
        'No confirmed reservations selected. Note: check-in requires an assigned room.'
      );
      return;
    }
    setBusy(true);
    setActionError(null);
    const failures: string[] = [];
    for (const r of targets) {
      try {
        await checkIn.mutateAsync(r.id);
      } catch (e) {
        failures.push(`${r.confirmationNumber}: ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (failures.length) setActionError(failures.join(' | '));
    clearSelection();
  };

  const bulkCancel = async () => {
    const targets = reservations.filter((r: Reservation) => selected.has(r.id));
    if (targets.length === 0) return;
    if (!window.confirm(`Cancel ${targets.length} reservation(s)?`)) return;
    setBusy(true);
    setActionError(null);
    const failures: string[] = [];
    for (const r of targets) {
      try {
        await cancel.mutateAsync({ id: r.id });
      } catch (e) {
        failures.push(`${r.confirmationNumber}: ${(e as Error).message}`);
      }
    }
    setBusy(false);
    if (failures.length) setActionError(failures.join(' | '));
    clearSelection();
  };

  const exportCsv = () => {
    const rows = [
      [
        'Confirmation',
        'Guest',
        'Email',
        'Room',
        'Arrival',
        'Departure',
        'Nights',
        'Status',
        'Source',
        'Rate',
        'Total',
        'Balance',
      ],
      ...reservations.map((r: Reservation) => [
        r.confirmationNumber,
        guestNameOf(r),
        r.guestEmail ?? '',
        r.roomNumber ?? '',
        fmtDate(r.arrivalDate),
        fmtDate(r.departureDate),
        String(r.nights),
        r.status,
        r.source,
        String(r.rate ?? 0),
        String(r.totalAmount),
        String(r.balance),
      ]),
    ];
    const csv =
      '﻿' +
      rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reservations-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const viewTabs: Array<{ key: ViewTab; label: string; icon: typeof LogIn }> = [
    { key: 'all', label: 'All', icon: ListChecks },
    { key: 'arrivals', label: 'Arrivals', icon: ArrowRightToLine },
    { key: 'inhouse', label: 'In-House', icon: BedDouble },
    { key: 'departures', label: 'Departures', icon: ArrowLeftToLine },
  ];

  const totalPages = meta?.totalPages ?? 1;
  const mutationPending = checkIn.isPending || cancel.isPending || busy;

  const pageWindow = useMemo(() => {
    const win: number[] = [];
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    for (let i = start; i <= Math.min(totalPages, start + 4); i++) win.push(i);
    return win;
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Reservations</h2>
          <p className="text-sm text-text-secondary">
            {isLoading ? 'Loading reservations...' : `${meta?.total ?? 0} reservations`}
          </p>
        </div>
        <Link
          to="/app/reservations/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-secondary px-4 text-sm font-medium text-white hover:bg-secondary/90"
        >
          <Plus className="h-4 w-4" /> New Reservation
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or confirmation #..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
            filtersOpen
              ? 'border-secondary bg-secondary/10 text-secondary'
              : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
          )}
        >
          <Filter className="h-4 w-4" /> Filters{' '}
          <ChevronDown className={cn('h-3.5 w-3.5', filtersOpen && 'rotate-180')} />
        </button>
      </div>

      <div className="inline-flex rounded-lg border border-border bg-surface p-1">
        {viewTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition',
              tab === key
                ? 'bg-secondary text-secondary-foreground'
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <Icon size={14} /> {label}
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                tab === key ? 'bg-white/20' : 'bg-surface-elevated text-text-muted'
              )}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {filtersOpen && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="no_show">No-Show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Source</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Sources</option>
                <option value="direct">Direct</option>
                <option value="bookingcom">Booking.com</option>
                <option value="expedia">Expedia</option>
                <option value="walkin">Walk-in</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Arrival From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Arrival To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                setStatusFilter('all');
                setSourceFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-danger/20 bg-danger/5 px-4 py-2.5">
          <p className="text-sm text-danger">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-secondary/20 bg-secondary/5 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-secondary">{selected.size} selected</span>
            <button
              onClick={clearSelection}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={bulkCheckIn} disabled={mutationPending}>
              <LogIn className="mr-1.5 h-3.5 w-3.5" /> Check In
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
            <Button variant="danger" size="sm" onClick={bulkCancel} disabled={mutationPending}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-8 text-center">
          <p className="text-sm font-medium text-danger">Failed to load reservations</p>
          <p className="mt-1 text-xs text-text-muted">{(error as Error).message}</p>
          <Button onClick={() => refetch()} className="mt-4" size="sm">
            Retry
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonText className="w-1/4" />
                  <SkeletonText className="w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-text-muted hover:text-text-primary"
                    >
                      {selected.size === reservations.length && reservations.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-secondary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Conf #</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Guest</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Room</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Dates</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-right">Rate</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-text-secondary text-right">Balance</th>
                  <th className="px-4 py-3 font-medium text-text-secondary">Source</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((r: Reservation) => {
                  const guestName = guestNameOf(r);
                  const needsRoom =
                    r.status === 'confirmed' && fmtDate(r.arrivalDate) <= today() && !r.roomNumber;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/app/reservations/${r.id}`)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-background',
                        selected.has(r.id) && 'bg-secondary/5'
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelect(r.id)}
                          className="text-text-muted hover:text-text-primary"
                        >
                          {selected.has(r.id) ? (
                            <CheckSquare className="h-4 w-4 text-secondary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {r.confirmationNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                            {guestName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">
                              {guestName || 'Unnamed Guest'}
                            </p>
                            <p className="text-xs text-text-muted">{r.guestEmail ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.roomNumber ? (
                          <div>
                            <p className="font-medium text-text-primary">{r.roomNumber}</p>
                            <p className="text-xs text-text-muted">{r.roomTypeName ?? ''}</p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-warning">
                            <AlertTriangle className="h-3 w-3" /> Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-text-primary">
                          <Calendar className="h-3.5 w-3.5 text-text-muted" />
                          {fmtDate(r.arrivalDate)}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          → {fmtDate(r.departureDate)} · {r.nights} night{r.nights === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                        {needsRoom && (
                          <p className="mt-1 text-[10px] font-medium text-warning">Needs room</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">
                        {r.rate != null ? zar(r.rate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text-primary">
                        {zar(r.totalAmount)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right font-medium',
                          Number(r.balance) > 0 ? 'text-danger' : 'text-accent'
                        )}
                      >
                        {zar(r.balance)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{r.source}</td>
                      <td className="px-4 py-3">
                        <InlineActions
                          status={r.status}
                          disabled={mutationPending}
                          onView={() => navigate(`/app/reservations/${r.id}`)}
                          onCheckIn={() => handleCheckIn(r)}
                          onCancel={() => handleCancel(r)}
                        />
                      </td>
                    </tr>
                  );
                })}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-text-muted">
                      No reservations match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.total > 0 && (
            <div className="flex items-center justify-between border-t border-border bg-background px-4 py-3">
              <p className="text-xs text-text-muted">
                Page {meta.page} of {totalPages} · {meta.total} total
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {pageWindow.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'h-8 min-w-8 rounded-md px-2 text-sm font-medium',
                      p === page
                        ? 'bg-secondary text-white'
                        : 'text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {p}
                  </button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
