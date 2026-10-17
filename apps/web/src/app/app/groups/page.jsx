/* src/app/app/groups/page.jsx — G1: live groups board */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BedDouble,
  Calendar,
  DollarSign,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  Clock,
  TrendingUp,
  LayoutGrid,
  List,
  Eye,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { useGroups, useDeleteGroup } from '../../../hooks/useGroups';
import { useProperties } from '../../../hooks/useProperties';
import { formatCurrency, fmtDate, groupColor } from './data';
import { StatusBadge, BlockTypeBadge, PickupBar, GroupStatCard } from './components';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [sortConfig, setSortConfig] = useState({ key: 'arrivalDate', dir: 'asc' });
  const [cancelTarget, setCancelTarget] = useState(null);

  const { properties } = useProperties();
  const propertyId = properties?.[0]?.id;
  const { groups, meta, isLoading, error, refetch } = useGroups(
    propertyId
      ? {
          propertyId,
          q: query || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }
      : { q: query || undefined }
  );
  const deleteGroup = useDeleteGroup();

  const stats = useMemo(() => {
    const definite = groups
      .filter((g) => g.status === 'definite')
      .reduce((s, g) => s + g.roomsBlocked, 0);
    const tentative = groups
      .filter((g) => g.status === 'tentative')
      .reduce((s, g) => s + g.roomsBlocked, 0);
    const totalPickup = groups.reduce((s, g) => s + g.roomsPickedUp, 0);
    const totalBlocked = groups.reduce((s, g) => s + g.roomsBlocked, 0);
    return {
      total: meta?.total ?? groups.length,
      definite,
      tentative,
      pickupRate: totalBlocked > 0 ? Math.round((totalPickup / totalBlocked) * 100) : 0,
    };
  }, [groups, meta]);

  const filtered = useMemo(() => {
    const data = [...groups];
    data.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'rate') {
        aVal = a.rate ?? 0;
        bVal = b.rate ?? 0;
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [groups, sortConfig]);

  const handleSort = (key) =>
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));

  const openDetail = (g) => navigate(`/app/groups/detail?id=${g.id}`);

  return (
    <div className="space-y-6">
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
          value={`${stats.pickupRate}%`}
          icon={TrendingUp}
          color="text-info"
        />
      </div>

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
            <option value="completed">Completed</option>
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

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Failed to load groups: {error.message}
          <button onClick={() => refetch()} className="ml-3 font-medium underline">
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-text-muted">
          Loading groups…
        </div>
      ) : viewMode === 'list' ? (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  {[
                    { key: 'name', label: 'Group / Contact' },
                    { key: 'arrivalDate', label: 'Dates' },
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
                {filtered.map((g) => {
                  const c = groupColor(g.blockType);
                  return (
                    <tr key={g.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-9 w-9 items-center justify-center rounded-lg border',
                              c.color
                            )}
                          >
                            <Users className={cn('h-4 w-4', c.textColor)} />
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{g.name}</p>
                            <p className="text-xs text-text-muted">
                              {g.code} · {g.contactName || 'No contact'}
                              {g.company ? ` · ${g.company}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-text-primary text-xs">
                          {fmtDate(g.arrivalDate)} → {fmtDate(g.departureDate)}
                        </div>
                        <p className="text-[10px] text-text-muted">
                          Cut-off: {fmtDate(g.cutOffDate)}
                        </p>
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
                        {g.rate ? formatCurrency(g.rate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {g.eventSpace || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetail(g)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setCancelTarget(g)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                            title="Cancel block"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                      {query || statusFilter !== 'all'
                        ? 'No groups match your filters.'
                        : 'No groups yet — create your first block.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => {
            const c = groupColor(g.blockType);
            return (
              <div
                key={g.id}
                onClick={() => openDetail(g)}
                className={cn(
                  'rounded-xl border bg-surface p-5 cursor-pointer transition-all hover:shadow-lg hover:border-secondary/30',
                  g.status === 'cancelled' ? 'border-danger/20 opacity-60' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border',
                      c.color
                    )}
                  >
                    <Users className={cn('h-5 w-5', c.textColor)} />
                  </div>
                  <StatusBadge status={g.status} />
                </div>
                <h3 className="font-semibold text-text-primary">{g.name}</h3>
                <p className="text-xs text-text-muted">{g.company || g.contactName || g.code}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    {fmtDate(g.arrivalDate)} → {fmtDate(g.departureDate)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <BedDouble className="h-3.5 w-3.5 text-text-muted" />
                    {g.roomsPickedUp} / {g.roomsBlocked} rooms picked up
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <DollarSign className="h-3.5 w-3.5 text-text-muted" />
                    {g.rate ? `${formatCurrency(g.rate)} per night` : 'Rate on request'}
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
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <p className="text-text-muted">No groups match your filters.</p>
            </div>
          )}
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text-primary">Cancel {cancelTarget.name}?</h3>
            <p className="mt-2 text-sm text-text-secondary">
              The block will be marked cancelled. Reservations already picked up stay attached so
              folios and history remain intact.
            </p>
            {deleteGroup.error && (
              <p className="mt-3 text-sm text-danger">{deleteGroup.error.message}</p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCancelTarget(null)}>
                Keep block
              </Button>
              <Button
                variant="destructive"
                disabled={deleteGroup.isPending}
                onClick={() =>
                  deleteGroup.mutate(cancelTarget.id, { onSuccess: () => setCancelTarget(null) })
                }
              >
                {deleteGroup.isPending ? 'Cancelling…' : 'Cancel block'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
