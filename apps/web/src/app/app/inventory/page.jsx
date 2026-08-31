import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid3X3,
  BedDouble,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Settings,
  ArrowUpDown,
  Filter,
  Download,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  X,
  Save,
  History,
  TrendingUp,
  DoorOpen,
  Ban,
  Info,
  MoreHorizontal,
  Edit3,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const roomTypes = [
  { id: 'std-twin', name: 'Standard Twin', total: 20, overbookingLimit: 22 },
  { id: 'del-king', name: 'Deluxe King', total: 15, overbookingLimit: 17 },
  { id: 'suite', name: 'Executive Suite', total: 8, overbookingLimit: 9 },
  { id: 'std-queen', name: 'Standard Queen', total: 12, overbookingLimit: 13 },
  { id: 'accessible', name: 'Accessible King', total: 4, overbookingLimit: 4 },
];

const generateDates = (startDate, days) => {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDate = (date) => date.toISOString().split('T')[0];
const formatDisplay = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const generateInventoryData = (dates, rooms) => {
  const data = {};
  dates.forEach((date) => {
    const dateStr = formatDate(date);
    data[dateStr] = {};
    rooms.forEach((room) => {
      const booked = Math.floor(Math.random() * (room.total + 3));
      const ooo = Math.random() > 0.85 ? Math.floor(Math.random() * 2) + 1 : 0;
      const held = Math.random() > 0.9 ? Math.floor(Math.random() * 2) : 0;
      const available = room.total - booked - ooo - held;
      data[dateStr][room.id] = {
        total: room.total,
        booked,
        available,
        ooo,
        held,
        overbookingLimit: room.overbookingLimit,
        sellable: room.overbookingLimit - booked,
        maintenanceNote: ooo > 0 ? (Math.random() > 0.5 ? 'HVAC Repair' : 'Plumbing') : null,
      };
    });
  });
  return data;
};

const initialAdjustments = [
  {
    id: 1,
    date: '2026-08-12',
    roomType: 'Deluxe King',
    type: 'ooo',
    rooms: 1,
    reason: 'HVAC Repair',
    user: 'Mike C.',
    time: '08:30 AM',
  },
  {
    id: 2,
    date: '2026-08-12',
    roomType: 'Standard Twin',
    type: 'allocation',
    rooms: 5,
    reason: 'TechConf 2026 group block',
    user: 'Sarah J.',
    time: '09:15 AM',
  },
  {
    id: 3,
    date: '2026-08-13',
    roomType: 'Executive Suite',
    type: 'ooo',
    rooms: 1,
    reason: 'Deep cleaning',
    user: 'Maria G.',
    time: '07:00 AM',
  },
  {
    id: 4,
    date: '2026-08-14',
    roomType: 'Standard Queen',
    type: 'release',
    rooms: 2,
    reason: 'Maintenance completed',
    user: 'James L.',
    time: '10:45 AM',
  },
];

const allocations = [
  {
    id: 'ALLOC-1',
    name: 'TechConf 2026',
    roomType: 'Standard Twin',
    rooms: 5,
    pickedUp: 2,
    from: '2026-09-15',
    to: '2026-09-18',
  },
  {
    id: 'ALLOC-2',
    name: 'Smith Wedding',
    roomType: 'Deluxe King',
    rooms: 8,
    pickedUp: 6,
    from: '2026-08-20',
    to: '2026-08-22',
  },
  {
    id: 'ALLOC-3',
    name: 'OTA-Expedia',
    roomType: 'Standard Queen',
    rooms: 4,
    pickedUp: 1,
    from: '2026-08-12',
    to: '2026-08-19',
  },
];

/* ─── Status Helpers ─── */
function getAvailabilityStatus(available, total, ooo, sellable) {
  const effective = available;
  if (sellable < 0)
    return {
      label: 'Overbooked',
      class: 'bg-danger/15 text-danger border-danger/30',
      dot: 'bg-danger',
      severity: 'danger',
    };
  if (effective <= 0)
    return {
      label: 'Sold Out',
      class: 'bg-neutral/10 text-text-muted border-border',
      dot: 'bg-text-muted',
      severity: 'neutral',
    };
  if (effective <= total * 0.1)
    return {
      label: 'Critical',
      class: 'bg-warning/15 text-warning border-warning/30',
      dot: 'bg-warning',
      severity: 'warning',
    };
  if (effective <= total * 0.3)
    return {
      label: 'Low',
      class: 'bg-info/15 text-info border-info/30',
      dot: 'bg-info',
      severity: 'info',
    };
  return {
    label: 'Available',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    severity: 'success',
  };
}

function getSellableColor(sellable, limit) {
  const ratio = sellable / limit;
  if (sellable < 0) return 'text-danger';
  if (ratio <= 0.1) return 'text-warning';
  if (ratio <= 0.3) return 'text-info';
  return 'text-accent';
}

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend && (
            <p
              className={cn('mt-1 text-xs font-medium', trend > 0 ? 'text-accent' : 'text-danger')}
            >
              {trend > 0 ? '+' : ''}
              {trend}% vs last week
            </p>
          )}
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

/* ─── Adjustment Modal ─── */
function AdjustmentModal({ isOpen, onClose, roomType, dateStr, currentData, onSave }) {
  const [type, setType] = useState('ooo');
  const [rooms, setRooms] = useState(1);
  const [reason, setReason] = useState('');

  if (!isOpen || !currentData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      date: dateStr,
      roomType: roomType.name,
      type,
      rooms: parseInt(rooms) || 0,
      reason: reason || 'Inventory adjustment',
      user: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Adjust Inventory</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-surface p-3">
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{roomType.name}</span> · {dateStr}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Total: {currentData.total} · Booked: {currentData.booked} · OOO: {currentData.ooo} ·
            Available: {currentData.available}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'ooo', label: 'Out of Order', icon: Wrench, color: 'text-warning' },
                { key: 'allocation', label: 'Allocation', icon: Lock, color: 'text-info' },
                { key: 'release', label: 'Release', icon: Unlock, color: 'text-accent' },
                {
                  key: 'inventory',
                  label: 'Inventory +/-',
                  icon: ArrowUpDown,
                  color: 'text-secondary',
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setType(opt.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                    type === opt.key
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  <opt.icon className={cn('h-4 w-4', opt.color)} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Rooms
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRooms(Math.max(0, rooms - 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="0"
                value={rooms}
                onChange={(e) => setRooms(parseInt(e.target.value) || 0)}
                className="h-9 w-20 rounded-md border border-border bg-surface px-3 text-center text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setRooms(rooms + 1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Reason / Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Maintenance, group block, etc."
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Save className="mr-1.5 h-4 w-4" /> Save Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Cell Detail Drawer ─── */
function CellDetailDrawer({ roomType, dateStr, data, onClose, onAdjust }) {
  if (!data) return null;
  const status = getAvailabilityStatus(data.available, data.total, data.ooo, data.sellable);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text-primary">{roomType.name}</h3>
              <p className="text-sm text-text-muted">{dateStr}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={cn('rounded-lg border p-4', status.class)}>
            <div className="flex items-center gap-2">
              <span className={cn('h-2.5 w-2.5 rounded-full', status.dot)} />
              <span className="text-sm font-semibold">{status.label}</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              Sellable inventory:{' '}
              <span
                className={cn(
                  'font-mono font-bold',
                  getSellableColor(data.sellable, roomType.overbookingLimit)
                )}
              >
                {data.sellable}
              </span>{' '}
              / {roomType.overbookingLimit} limit
            </p>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Inventory Breakdown
            </h4>
            {[
              {
                label: 'Total Physical Rooms',
                value: data.total,
                icon: BedDouble,
                color: 'text-text-primary',
              },
              {
                label: 'Booked / Occupied',
                value: data.booked,
                icon: Lock,
                color: 'text-secondary',
              },
              { label: 'Out of Order', value: data.ooo, icon: Wrench, color: 'text-warning' },
              { label: 'Held / Allocations', value: data.held, icon: Ban, color: 'text-info' },
              {
                label: 'Available',
                value: data.available,
                icon: CheckCircle2,
                color: 'text-accent',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <item.icon className={cn('h-4 w-4', item.color)} />
                  {item.label}
                </div>
                <span className={cn('text-sm font-mono font-bold', item.color)}>{item.value}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">Overbooking Limit</span>
              <span className="text-sm font-mono font-bold text-text-primary">
                {roomType.overbookingLimit}
              </span>
            </div>
          </div>

          {data.maintenanceNote && (
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 flex gap-2">
              <Wrench className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-warning">Maintenance Note</p>
                <p className="text-sm text-text-secondary">{data.maintenanceNote}</p>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={onAdjust}>
            <Edit3 className="mr-1.5 h-4 w-4" /> Adjust Inventory
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function InventoryPage() {
  const navigate = useNavigate();
  const [dateOffset, setDateOffset] = useState(0);
  const [inventoryData, setInventoryData] = useState(() => {
    const today = new Date();
    const dates = generateDates(today, 14);
    return generateInventoryData(dates, roomTypes);
  });
  const [adjustments, setAdjustments] = useState(initialAdjustments);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'allocations' | 'history'
  const [filterRoomType, setFilterRoomType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const today = new Date();
  today.setDate(today.getDate() + dateOffset);
  const dates = useMemo(() => generateDates(today, 14), [today]);
  const dateStrs = useMemo(() => dates.map(formatDate), [dates]);

  // Refresh data when dates change (simulate API fetch)
  useMemo(() => {
    setInventoryData(generateInventoryData(dates, roomTypes));
  }, [dateOffset]);

  const filteredRoomTypes =
    filterRoomType === 'all' ? roomTypes : roomTypes.filter((r) => r.id === filterRoomType);

  /* Stats */
  const stats = useMemo(() => {
    const firstDate = dateStrs[0];
    let totalRooms = 0;
    let totalAvailable = 0;
    let totalOoo = 0;
    let totalOverbooked = 0;
    let totalSellable = 0;

    roomTypes.forEach((rt) => {
      const d = inventoryData[firstDate]?.[rt.id];
      if (d) {
        totalRooms += d.total;
        totalAvailable += d.available;
        totalOoo += d.ooo;
        totalSellable += d.sellable;
        if (d.sellable < 0) totalOverbooked += Math.abs(d.sellable);
      }
    });

    return {
      totalRooms,
      totalAvailable,
      totalOoo,
      totalOverbooked,
      totalSellable,
      occupancy:
        totalRooms > 0 ? Math.round(((totalRooms - totalAvailable) / totalRooms) * 100) : 0,
    };
  }, [inventoryData, dateStrs]);

  const handleSaveAdjustment = (adj) => {
    setAdjustments((prev) => [adj, ...prev]);
    // Update inventory data mock
    setInventoryData((prev) => {
      const next = { ...prev };
      if (next[adj.date]) {
        const rt = roomTypes.find((r) => r.name === adj.roomType);
        if (rt && next[adj.date][rt.id]) {
          const cell = { ...next[adj.date][rt.id] };
          if (adj.type === 'ooo') cell.ooo += adj.rooms;
          if (adj.type === 'release') cell.ooo = Math.max(0, cell.ooo - adj.rooms);
          if (adj.type === 'allocation') cell.held += adj.rooms;
          if (adj.type === 'inventory') cell.total += adj.rooms;
          cell.available = cell.total - cell.booked - cell.ooo - cell.held;
          cell.sellable = cell.overbookingLimit - cell.booked;
          next[adj.date] = { ...next[adj.date], [rt.id]: cell };
        }
      }
      return next;
    });
  };

  const openAdjustment = (roomType, dateStr) => {
    setAdjustmentTarget({ roomType, dateStr, data: inventoryData[dateStr]?.[roomType.id] });
    setShowAdjustment(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Inventory Management</h1>
          <p className="text-sm text-text-secondary">
            Availability, allocations, and room status controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Sync OTAs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Rooms"
          value={stats.totalRooms}
          icon={BedDouble}
          color="text-text-primary"
        />
        <StatCard
          label="Available"
          value={stats.totalAvailable}
          icon={DoorOpen}
          color="text-accent"
        />
        <StatCard
          label="Sellable"
          value={stats.totalSellable}
          icon={TrendingUp}
          color="text-secondary"
        />
        <StatCard
          label="Occupancy"
          value={`${stats.occupancy}%`}
          icon={Grid3X3}
          color="text-info"
        />
        <StatCard label="OOO" value={stats.totalOoo} icon={Wrench} color="text-warning" />
        <StatCard
          label="Overbooked"
          value={stats.totalOverbooked}
          icon={AlertTriangle}
          color="text-danger"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {[
            { id: 'grid', label: 'Availability Grid', icon: Grid3X3 },
            { id: 'allocations', label: 'Allocations', icon: Lock },
            { id: 'history', label: 'Adjustment History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Grid Tab ─── */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDateOffset((o) => o - 14)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-text-primary min-w-[180px] text-center">
                {formatDisplay(dates[0])} — {formatDisplay(dates[dates.length - 1])}
              </span>
              <button
                onClick={() => setDateOffset((o) => o + 14)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDateOffset(0)}
                className="ml-2 text-xs text-secondary hover:underline"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-1 h-3.5 w-3.5" /> Filter
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="mr-1 h-3.5 w-3.5" /> Overbooking Rules
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3">
              <label className="text-xs text-text-secondary">Room Type:</label>
              <select
                value={filterRoomType}
                onChange={(e) => setFilterRoomType(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text-primary"
              >
                <option value="all">All Types</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setFilterRoomType('all')}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Reset
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
            <span className="text-xs text-text-muted font-medium">Status:</span>
            {[
              { label: 'Available', dot: 'bg-accent' },
              { label: 'Low', dot: 'bg-info' },
              { label: 'Critical', dot: 'bg-warning' },
              { label: 'Sold Out', dot: 'bg-text-muted' },
              { label: 'Overbooked', dot: 'bg-danger' },
            ].map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className={cn('h-2 w-2 rounded-full', s.dot)} />
                {s.label}
              </span>
            ))}
          </div>

          {/* Availability Grid */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-muted sticky left-0 bg-background z-10 min-w-[160px]">
                      Room Type / Date
                    </th>
                    {dates.map((date) => {
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      const isToday = formatDate(date) === formatDate(new Date());
                      return (
                        <th
                          key={formatDate(date)}
                          className={cn(
                            'px-2 py-2 text-center text-xs font-medium min-w-[80px]',
                            isToday
                              ? 'bg-secondary/5 text-secondary'
                              : isWeekend
                                ? 'text-warning bg-warning/5'
                                : 'text-text-secondary'
                          )}
                        >
                          <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div
                            className={cn(
                              'font-mono',
                              isToday
                                ? 'text-secondary font-bold'
                                : isWeekend && 'text-warning font-semibold'
                            )}
                          >
                            {date.getDate()}
                          </div>
                          {isToday && (
                            <div className="text-[9px] uppercase tracking-wider text-secondary mt-0.5">
                              Today
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRoomTypes.map((room) => (
                    <tr key={room.id} className="hover:bg-background/50">
                      <td className="px-3 py-2 sticky left-0 bg-surface z-10 border-r border-border">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-secondary" />
                          <div>
                            <p className="text-sm font-medium text-text-primary">{room.name}</p>
                            <p className="text-[10px] text-text-muted">
                              {room.total} total · OB {room.overbookingLimit}
                            </p>
                          </div>
                        </div>
                      </td>
                      {dateStrs.map((dateStr) => {
                        const data = inventoryData[dateStr]?.[room.id];
                        if (!data)
                          return (
                            <td key={dateStr} className="px-2 py-2 text-center text-text-muted">
                              —
                            </td>
                          );

                        const status = getAvailabilityStatus(
                          data.available,
                          data.total,
                          data.ooo,
                          data.sellable
                        );
                        const isOverbooked = data.sellable < 0;
                        const isLow = data.sellable >= 0 && data.available <= data.total * 0.1;

                        return (
                          <td key={dateStr} className="px-2 py-2">
                            <button
                              onClick={() => setSelectedCell({ roomType: room, dateStr, data })}
                              className={cn(
                                'w-full rounded-lg border p-2 text-center transition-all hover:shadow-sm hover:ring-1 hover:ring-secondary/50',
                                status.class
                              )}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                                <span
                                  className={cn(
                                    'text-lg font-bold font-mono',
                                    isOverbooked ? 'text-danger' : 'text-text-primary'
                                  )}
                                >
                                  {data.sellable}
                                </span>
                              </div>
                              <div className="mt-1 text-[10px] text-text-muted">
                                {data.booked}/{data.total}
                              </div>
                              {data.ooo > 0 && (
                                <div className="mt-1 text-[10px] text-warning font-medium">
                                  {data.ooo} OOO
                                </div>
                              )}
                              {isOverbooked && (
                                <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-danger font-bold">
                                  <AlertTriangle className="h-3 w-3" /> Over
                                </div>
                              )}
                              {isLow && !isOverbooked && (
                                <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-warning font-medium">
                                  <AlertTriangle className="h-3 w-3" /> Low
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roomTypes.map((room) => {
              const firstDate = dateStrs[0];
              const data = inventoryData[firstDate]?.[room.id];
              if (!data) return null;
              const overbookedDays = dateStrs.filter((ds) => {
                const d = inventoryData[ds]?.[room.id];
                return d && d.sellable < 0;
              }).length;
              const lowDays = dateStrs.filter((ds) => {
                const d = inventoryData[ds]?.[room.id];
                return d && d.sellable >= 0 && d.available <= d.total * 0.1;
              }).length;

              return (
                <div key={room.id} className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BedDouble className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium text-text-primary">{room.name}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">Overbooked days</span>
                      <span
                        className={cn(
                          'font-bold font-mono',
                          overbookedDays > 0 ? 'text-danger' : 'text-accent'
                        )}
                      >
                        {overbookedDays}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">Low inventory days</span>
                      <span
                        className={cn(
                          'font-bold font-mono',
                          lowDays > 0 ? 'text-warning' : 'text-accent'
                        )}
                      >
                        {lowDays}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">OOO today</span>
                      <span className="font-bold font-mono text-text-primary">{data.ooo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Allocations Tab ─── */}
      {activeTab === 'allocations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Room Allocations</h3>
              <p className="text-xs text-text-muted">
                Group blocks, OTA allotments, and held inventory
              </p>
            </div>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> New Allocation
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">
                      Allocation
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">
                      Room Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Dates</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">
                      Blocked
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">
                      Picked Up
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allocations.map((alloc) => {
                    const pct =
                      alloc.rooms > 0 ? Math.round((alloc.pickedUp / alloc.rooms) * 100) : 0;
                    return (
                      <tr key={alloc.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                              <Lock className="h-4 w-4 text-secondary" />
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{alloc.name}</p>
                              <p className="text-xs text-text-muted">{alloc.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{alloc.roomType}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          {alloc.from} → {alloc.to}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {alloc.rooms}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {alloc.pickedUp}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 rounded-full bg-border overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  pct >= 80
                                    ? 'bg-accent'
                                    : pct >= 50
                                      ? 'bg-secondary'
                                      : 'bg-warning'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-text-secondary">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-text-muted hover:text-text-primary">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── History Tab ─── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Adjustment History</h3>
              <p className="text-xs text-text-muted">
                Recent inventory changes and maintenance events
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" /> Export Log
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Time</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">
                      Room Type
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Rooms</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {adjustments.map((adj) => {
                    const typeMeta = {
                      ooo: {
                        label: 'Out of Order',
                        class: 'bg-warning/10 text-warning border-warning/20',
                        icon: Wrench,
                      },
                      allocation: {
                        label: 'Allocation',
                        class: 'bg-info/10 text-info border-info/20',
                        icon: Lock,
                      },
                      release: {
                        label: 'Release',
                        class: 'bg-accent/10 text-accent border-accent/20',
                        icon: Unlock,
                      },
                      inventory: {
                        label: 'Inventory',
                        class: 'bg-secondary/10 text-secondary border-secondary/20',
                        icon: ArrowUpDown,
                      },
                    }[adj.type] || {
                      label: adj.type,
                      class: 'bg-neutral/10 text-text-muted border-border',
                      icon: Info,
                    };

                    return (
                      <tr key={adj.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3 text-text-secondary text-xs">
                          <div>{adj.date}</div>
                          <div className="text-text-muted">{adj.time}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                              typeMeta.class
                            )}
                          >
                            <typeMeta.icon className="h-3 w-3" />
                            {typeMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-primary">{adj.roomType}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                          {adj.type === 'release' || (adj.type === 'inventory' && adj.rooms < 0)
                            ? ''
                            : '+'}
                          {adj.rooms}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs max-w-xs truncate">
                          {adj.reason}
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{adj.user}</td>
                      </tr>
                    );
                  })}
                  {adjustments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                        No adjustments recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {selectedCell && (
        <CellDetailDrawer
          roomType={selectedCell.roomType}
          dateStr={selectedCell.dateStr}
          data={selectedCell.data}
          onClose={() => setSelectedCell(null)}
          onAdjust={() => {
            setSelectedCell(null);
            openAdjustment(selectedCell.roomType, selectedCell.dateStr);
          }}
        />
      )}

      {showAdjustment && adjustmentTarget && (
        <AdjustmentModal
          isOpen={showAdjustment}
          onClose={() => setShowAdjustment(false)}
          roomType={adjustmentTarget.roomType}
          dateStr={adjustmentTarget.dateStr}
          currentData={adjustmentTarget.data}
          onSave={handleSaveAdjustment}
        />
      )}
    </div>
  );
}
