import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  Check,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit3,
  LogIn,
  XCircle,
  Calendar,
  User,
  BedDouble,
  Phone,
  Mail,
  CheckSquare,
  Square,
  Trash2,
  Download,
  Printer,
  Plus,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const mockReservations = [
  {
    id: '4021',
    guest: 'John Smith',
    email: 'john@email.com',
    phone: '+1 555-0101',
    room: '204',
    roomType: 'Deluxe King',
    arrival: '2026-08-12',
    departure: '2026-08-15',
    nights: 3,
    status: 'checked_in',
    rate: 189,
    balance: 0,
    source: 'Direct',
  },
  {
    id: '4022',
    guest: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '+1 555-0102',
    room: '312',
    roomType: 'Standard Twin',
    arrival: '2026-08-11',
    departure: '2026-08-14',
    nights: 3,
    status: 'checked_out',
    rate: 145,
    balance: 0,
    source: 'Booking.com',
  },
  {
    id: '4023',
    guest: 'Michael Brown',
    email: 'mbrown@email.com',
    phone: '+1 555-0103',
    room: '105',
    roomType: 'Suite',
    arrival: '2026-08-15',
    departure: '2026-08-20',
    nights: 5,
    status: 'confirmed',
    rate: 320,
    balance: 320,
    source: 'Expedia',
  },
  {
    id: '4024',
    guest: 'Emily Davis',
    email: 'emily@email.com',
    phone: '+1 555-0104',
    room: '401',
    roomType: 'Deluxe King',
    arrival: '2026-08-12',
    departure: '2026-08-13',
    nights: 1,
    status: 'confirmed',
    rate: 189,
    balance: 189,
    source: 'Direct',
  },
  {
    id: '4025',
    guest: 'Robert Chen',
    email: 'robert@email.com',
    phone: '+1 555-0105',
    room: '118',
    roomType: 'Standard Queen',
    arrival: '2026-08-10',
    departure: '2026-08-12',
    nights: 2,
    status: 'no_show',
    rate: 135,
    balance: 135,
    source: 'Walk-in',
  },
  {
    id: '4026',
    guest: 'Lisa Wong',
    email: 'lisa@email.com',
    phone: '+1 555-0106',
    room: '310',
    roomType: 'Deluxe King',
    arrival: '2026-08-12',
    departure: '2026-08-16',
    nights: 4,
    status: 'cancelled',
    rate: 189,
    balance: 0,
    source: 'Booking.com',
  },
  {
    id: '4027',
    guest: 'David Miller',
    email: 'david@email.com',
    phone: '+1 555-0107',
    room: null,
    roomType: 'Standard Twin',
    arrival: '2026-08-18',
    departure: '2026-08-22',
    nights: 4,
    status: 'waitlist',
    rate: 145,
    balance: 0,
    source: 'Direct',
  },
  {
    id: '4028',
    guest: 'Amanda Wilson',
    email: 'amanda@email.com',
    phone: '+1 555-0108',
    room: '205',
    roomType: 'Suite',
    arrival: '2026-08-13',
    departure: '2026-08-15',
    nights: 2,
    status: 'checked_in',
    rate: 320,
    balance: 120,
    source: 'Direct',
  },
];

const statusMeta = {
  confirmed: { label: 'Confirmed', class: 'bg-accent/10 text-accent border-accent/20' },
  checked_in: { label: 'Checked In', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  checked_out: { label: 'Checked Out', class: 'bg-neutral/10 text-text-muted border-border' },
  no_show: { label: 'No-Show', class: 'bg-danger/10 text-danger border-danger/20' },
  cancelled: { label: 'Cancelled', class: 'bg-danger/10 text-danger border-danger/20' },
  waitlist: { label: 'Waitlist', class: 'bg-warning/10 text-warning border-warning/20' },
};

/* ─── Status Badge ─── */
function StatusBadge({ status }) {
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

/* ─── Inline Actions ─── */
function InlineActions({ status, onView, onCheckIn, onCancel }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onView}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        onClick={onCheckIn}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
        title="Edit"
      >
        <Edit3 className="h-4 w-4" />
      </button>
      {status === 'confirmed' && (
        <button
          onClick={onCheckIn}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-secondary/10 hover:text-secondary"
          title="Check In"
        >
          <LogIn className="h-4 w-4" />
        </button>
      )}
      {(status === 'confirmed' || status === 'waitlist') && (
        <button
          onClick={onCancel}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
          title="Cancel"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function ReservationsPage() {
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  /* Filters */
  const filtered = useMemo(() => {
    return mockReservations.filter((r) => {
      const matchesQuery =
        r.guest.toLowerCase().includes(query.toLowerCase()) ||
        r.id.includes(query) ||
        r.email.toLowerCase().includes(query.toLowerCase()) ||
        (r.room && r.room.includes(query));
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || r.source === sourceFilter;
      const matchesFrom = !dateFrom || r.arrival >= dateFrom;
      const matchesTo = !dateTo || r.departure <= dateTo;
      return matchesQuery && matchesStatus && matchesSource && matchesFrom && matchesTo;
    });
  }, [query, statusFilter, sourceFilter, dateFrom, dateTo]);

  /* Selection */
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };
  const clearSelection = () => setSelected(new Set());

  /* Bulk actions */
  const selectedItems = mockReservations.filter((r) => selected.has(r.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Reservations</h2>
          <p className="text-sm text-text-secondary">{filtered.length} reservations found</p>
        </div>
        <Link
          to="/app/reservations?action=new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-secondary px-4 text-sm font-medium text-white hover:bg-secondary/90"
        >
          <Plus className="h-4 w-4" /> New Reservation
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, conf#, email, room..."
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
          {filtersOpen ? (
            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Advanced Filter Drawer */}
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
                <option value="waitlist">Waitlist</option>
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
                <option value="Direct">Direct</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Expedia">Expedia</option>
                <option value="Walk-in">Walk-in</option>
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

      {/* Bulk Actions Toolbar */}
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
            <Button variant="outline" size="sm">
              <LogIn className="mr-1.5 h-3.5 w-3.5" /> Check In
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
            <Button variant="danger" size="sm">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Results Table */}
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
                    {selected.size === filtered.length && filtered.length > 0 ? (
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
                <th className="px-4 py-3 font-medium text-text-secondary text-right">Balance</th>
                <th className="px-4 py-3 font-medium text-text-secondary">Source</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    'transition-colors hover:bg-background',
                    selected.has(r.id) && 'bg-secondary/5'
                  )}
                >
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                        {r.guest
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{r.guest}</p>
                        <p className="text-xs text-text-muted">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary">{r.room || '—'}</div>
                    <div className="text-xs text-text-muted">{r.roomType}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-text-primary">
                      <Calendar className="h-3.5 w-3.5 text-text-muted" />
                      {r.arrival}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {r.nights} nights → {r.departure}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text-primary">${r.rate}</td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-medium',
                      r.balance > 0 ? 'text-danger' : 'text-accent'
                    )}
                  >
                    ${r.balance}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{r.source}</td>
                  <td className="px-4 py-3">
                    <InlineActions
                      status={r.status}
                      onView={() => console.log('View', r.id)}
                      onCheckIn={() => console.log('Check-in', r.id)}
                      onCancel={() => console.log('Cancel', r.id)}
                    />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-text-muted">
                    No reservations match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
