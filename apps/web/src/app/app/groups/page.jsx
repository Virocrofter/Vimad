/* src/app/app/groups/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BedDouble,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  Clock,
  TrendingUp,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { useGroupStore } from './store';
import { formatCurrency } from './data';
import { StatusBadge, BlockTypeBadge, PickupBar, GroupStatCard } from './components';

export default function GroupsPage() {
  const navigate = useNavigate();
  const groups = useGroupStore((s) => s.groups);
  const removeGroup = useGroupStore((s) => s.removeGroup);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [sortConfig, setSortConfig] = useState({ key: 'arrival', dir: 'asc' });

  const filtered = useMemo(() => {
    let data = groups.filter((g) => {
      const matchesQuery =
        !query ||
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.id.toLowerCase().includes(query.toLowerCase()) ||
        (g.company && g.company.toLowerCase().includes(query.toLowerCase())) ||
        g.contact.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    data.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [groups, query, statusFilter, sortConfig]);

  const stats = useMemo(
    () => ({
      total: groups.length,
      definite: groups
        .filter((g) => g.status === 'definite')
        .reduce((s, g) => s + g.roomsBlocked, 0),
      tentative: groups
        .filter((g) => g.status === 'tentative')
        .reduce((s, g) => s + g.roomsBlocked, 0),
      totalPickup: groups.reduce((s, g) => s + g.roomsPickedUp, 0),
      totalBlocked: groups.reduce((s, g) => s + g.roomsBlocked, 0),
    }),
    [groups]
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Groups & Blocks</h1>
          <p className="text-sm text-text-secondary">
            Manage group reservations, rooming lists, and event blocks
          </p>
        </div>
        <Button onClick={() => navigate('/app/groups/new')}>
          <Plus className="mr-1.5 h-4 w-4" /> New Block
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GroupStatCard
          label="Active Blocks"
          value={stats.total}
          icon={Users}
          color="text-secondary"
        />
        <GroupStatCard
          label="Definite Rooms"
          value={stats.definite}
          icon={Check}
          color="text-accent"
        />
        <GroupStatCard
          label="Tentative Rooms"
          value={stats.tentative}
          icon={Clock}
          color="text-warning"
        />
        <GroupStatCard
          label="Pickup Rate"
          value={`${stats.totalBlocked > 0 ? Math.round((stats.totalPickup / stats.totalBlocked) * 100) : 0}%`}
          icon={TrendingUp}
          color="text-info"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search group, company, contact..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="definite">Definite</option>
            <option value="tentative">Tentative</option>
            <option value="prospect">Prospect</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-background shadow-sm text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-sm transition-colors',
                viewMode === 'grid'
                  ? 'bg-background shadow-sm text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  {[
                    { key: 'name', label: 'Group / Contact' },
                    { key: 'arrival', label: 'Dates' },
                    { key: 'status', label: 'Status' },
                    { key: 'roomsBlocked', label: 'Pickup' },
                    { key: 'rate', label: 'Rate' },
                    { key: 'eventSpace', label: 'Event Space' },
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
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg border',
                            g.color
                          )}
                        >
                          <Users className={cn('h-4 w-4', g.textColor)} />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{g.name}</p>
                          <p className="text-xs text-text-muted">
                            {g.contact} · {g.company || 'Individual'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-primary text-xs">
                        {g.arrival} → {g.departure}
                      </div>
                      <p className="text-[10px] text-text-muted">Cut-off: {g.cutOffDate}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={g.status} />
                        <BlockTypeBadge type={g.blockType} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PickupBar picked={g.roomsPickedUp} blocked={g.roomsBlocked} />
                      <p className="text-[10px] text-text-muted mt-1">
                        {g.roomsPickedUp} / {g.roomsBlocked} rooms
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-text-primary">
                      {formatCurrency(g.rate)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{g.eventSpace || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/app/groups/detail?id=${g.id}`)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeGroup(g.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                          title="Cancel"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                      No groups match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <div
              key={g.id}
              onClick={() => navigate(`/app/groups/detail?id=${g.id}`)}
              className={cn(
                'rounded-xl border bg-surface p-5 cursor-pointer transition-all hover:shadow-lg hover:border-secondary/30',
                g.status === 'cancelled' ? 'border-danger/20 opacity-60' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border',
                    g.color
                  )}
                >
                  <Users className={cn('h-5 w-5', g.textColor)} />
                </div>
                <StatusBadge status={g.status} />
              </div>
              <h3 className="font-semibold text-text-primary">{g.name}</h3>
              <p className="text-xs text-text-muted">{g.company || g.contact}</p>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  {g.arrival} → {g.departure}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <BedDouble className="h-3.5 w-3.5 text-text-muted" />
                  {g.roomsPickedUp} / {g.roomsBlocked} rooms picked up
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <DollarSign className="h-3.5 w-3.5 text-text-muted" />
                  {formatCurrency(g.rate)} per night
                </div>
                {g.eventSpace && (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Users className="h-3.5 w-3.5 text-text-muted" />
                    {g.eventSpace}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <PickupBar picked={g.roomsPickedUp} blocked={g.roomsBlocked} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <p className="text-text-muted">No groups match your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
