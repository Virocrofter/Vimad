import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Settings,
  Plus,
  Search,
  Filter,
  ChevronRight,
  BedDouble,
  DollarSign,
  MapPin,
  Wifi,
  Zap,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Edit3,
  X,
  Save,
  Play,
  Pause,
  ArrowRightLeft,
  LayoutGrid,
  List,
  Download,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const otaConnections = [
  {
    id: 'conn-1',
    name: 'Booking.com',
    type: 'ota',
    status: 'connected',
    lastSync: '2026-08-12 11:45 AM',
    nextSync: '2026-08-12 12:15 PM',
    syncFrequency: 'Every 30 min',
    mappedRoomTypes: 4,
    totalRoomTypes: 4,
    mappedRatePlans: 3,
    totalRatePlans: 3,
    reservationsToday: 12,
    revenueToday: 2840,
    apiKey: 'bk_••••4242',
    webhookUrl: 'https://api.unifiedpms.com/v1/webhooks/bookingcom',
    logoColor: 'bg-blue-500',
    isActive: true,
  },
  {
    id: 'conn-2',
    name: 'Expedia',
    type: 'ota',
    status: 'syncing',
    lastSync: '2026-08-12 11:58 AM',
    nextSync: 'In progress...',
    syncFrequency: 'Every 30 min',
    mappedRoomTypes: 3,
    totalRoomTypes: 4,
    mappedRatePlans: 2,
    totalRatePlans: 3,
    reservationsToday: 8,
    revenueToday: 1650,
    apiKey: 'exp_••••8891',
    webhookUrl: 'https://api.unifiedpms.com/v1/webhooks/expedia',
    logoColor: 'bg-yellow-500',
    isActive: true,
  },
  {
    id: 'conn-3',
    name: 'Airbnb',
    type: 'ota',
    status: 'error',
    lastSync: '2026-08-12 10:15 AM',
    nextSync: 'Retrying...',
    syncFrequency: 'Every 60 min',
    mappedRoomTypes: 2,
    totalRoomTypes: 4,
    mappedRatePlans: 1,
    totalRatePlans: 3,
    reservationsToday: 0,
    revenueToday: 0,
    apiKey: 'abnb_••••3312',
    webhookUrl: 'https://api.unifiedpms.com/v1/webhooks/airbnb',
    logoColor: 'bg-rose-500',
    isActive: true,
    errorMessage: 'Authentication token expired. Please reconnect.',
  },
  {
    id: 'conn-4',
    name: 'Hotelbeds',
    type: 'wholesaler',
    status: 'connected',
    lastSync: '2026-08-12 11:30 AM',
    nextSync: '2026-08-12 12:30 PM',
    syncFrequency: 'Every 60 min',
    mappedRoomTypes: 4,
    totalRoomTypes: 4,
    mappedRatePlans: 3,
    totalRatePlans: 3,
    reservationsToday: 5,
    revenueToday: 920,
    apiKey: 'hb_••••7721',
    webhookUrl: 'https://api.unifiedpms.com/v1/webhooks/hotelbeds',
    logoColor: 'bg-indigo-500',
    isActive: true,
  },
  {
    id: 'conn-5',
    name: 'Agoda',
    type: 'ota',
    status: 'disconnected',
    lastSync: 'Never',
    nextSync: '—',
    syncFrequency: 'Every 30 min',
    mappedRoomTypes: 0,
    totalRoomTypes: 4,
    mappedRatePlans: 0,
    totalRatePlans: 3,
    reservationsToday: 0,
    revenueToday: 0,
    apiKey: '',
    webhookUrl: '',
    logoColor: 'bg-purple-500',
    isActive: false,
  },
  {
    id: 'conn-6',
    name: 'Direct Website',
    type: 'direct',
    status: 'connected',
    lastSync: 'Real-time',
    nextSync: 'Real-time',
    syncFrequency: 'Real-time',
    mappedRoomTypes: 4,
    totalRoomTypes: 4,
    mappedRatePlans: 3,
    totalRatePlans: 3,
    reservationsToday: 6,
    revenueToday: 1340,
    apiKey: 'dir_••••9999',
    webhookUrl: 'https://api.unifiedpms.com/v1/webhooks/direct',
    logoColor: 'bg-emerald-500',
    isActive: true,
  },
];

const syncLogs = [
  {
    id: 1,
    time: '2026-08-12 11:58:02',
    channel: 'Expedia',
    action: 'Push inventory',
    status: 'success',
    details: 'Updated 4 room types, 14 date ranges',
  },
  {
    id: 2,
    time: '2026-08-12 11:58:15',
    channel: 'Expedia',
    action: 'Pull reservations',
    status: 'success',
    details: '2 new bookings imported',
  },
  {
    id: 3,
    time: '2026-08-12 11:45:00',
    channel: 'Booking.com',
    action: 'Push rates',
    status: 'success',
    details: 'Updated 12 rate plans',
  },
  {
    id: 4,
    time: '2026-08-12 11:30:22',
    channel: 'Hotelbeds',
    action: 'Push inventory',
    status: 'warning',
    details: '1 room type blocked — OOO mismatch',
  },
  {
    id: 5,
    time: '2026-08-12 11:15:45',
    channel: 'Airbnb',
    action: 'Auth refresh',
    status: 'error',
    details: 'Token expired (HTTP 401)',
  },
  {
    id: 6,
    time: '2026-08-12 11:00:00',
    channel: 'Booking.com',
    action: 'Push inventory',
    status: 'success',
    details: 'Updated 4 room types, 14 date ranges',
  },
  {
    id: 7,
    time: '2026-08-12 10:45:30',
    channel: 'Direct Website',
    action: 'Booking received',
    status: 'success',
    details: 'Reservation #4031 confirmed',
  },
];

const pmsRoomTypes = [
  { id: 'std-twin', name: 'Standard Twin', total: 20 },
  { id: 'del-king', name: 'Deluxe King', total: 15 },
  { id: 'suite', name: 'Executive Suite', total: 8 },
  { id: 'std-queen', name: 'Standard Queen', total: 12 },
];

const otaRoomTypeMappings = {
  'conn-1': [
    { otaRoomId: 'bk-101', otaName: 'Standard Twin Room', pmsRoomId: 'std-twin', mapped: true },
    { otaRoomId: 'bk-102', otaName: 'Deluxe King Room', pmsRoomId: 'del-king', mapped: true },
    { otaRoomId: 'bk-103', otaName: 'Executive Suite', pmsRoomId: 'suite', mapped: true },
    { otaRoomId: 'bk-104', otaName: 'Standard Queen Room', pmsRoomId: 'std-queen', mapped: true },
  ],
  'conn-2': [
    { otaRoomId: 'exp-201', otaName: 'Twin Room', pmsRoomId: 'std-twin', mapped: true },
    { otaRoomId: 'exp-202', otaName: 'King Room', pmsRoomId: 'del-king', mapped: true },
    { otaRoomId: 'exp-203', otaName: 'Suite', pmsRoomId: 'suite', mapped: true },
    { otaRoomId: 'exp-204', otaName: 'Queen Room', pmsRoomId: null, mapped: false },
  ],
  'conn-3': [
    { otaRoomId: 'abnb-301', otaName: 'Cozy Twin', pmsRoomId: 'std-twin', mapped: true },
    { otaRoomId: 'abnb-302', otaName: 'Luxury King', pmsRoomId: null, mapped: false },
    { otaRoomId: 'abnb-303', otaName: 'Penthouse Suite', pmsRoomId: null, mapped: false },
    { otaRoomId: 'abnb-304', otaName: 'Queen Retreat', pmsRoomId: null, mapped: false },
  ],
};

const otaRatePlanMappings = {
  'conn-1': [
    { otaPlanId: 'bk-rack', otaName: 'Standard Rate', pmsPlanId: 'rack', mapped: true },
    { otaPlanId: 'bk-nonref', otaName: 'Non-Refundable', pmsPlanId: 'advance', mapped: true },
    { otaPlanId: 'bk-corp', otaName: 'Corporate Rate', pmsPlanId: 'corp', mapped: true },
  ],
  'conn-2': [
    { otaPlanId: 'exp-rack', otaName: 'Best Available', pmsPlanId: 'rack', mapped: true },
    { otaPlanId: 'exp-adv', otaName: 'Advance Purchase', pmsPlanId: 'advance', mapped: true },
    { otaPlanId: 'exp-member', otaName: 'Member Rate', pmsPlanId: null, mapped: false },
  ],
};

/* ─── Status Helpers ─── */
const statusMeta = {
  connected: {
    label: 'Connected',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: CheckCircle2,
  },
  syncing: {
    label: 'Syncing',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    icon: RefreshCw,
  },
  error: {
    label: 'Error',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: AlertTriangle,
  },
  disconnected: {
    label: 'Disconnected',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
    icon: Unlink,
  },
  pending: {
    label: 'Pending',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
    icon: Clock,
  },
};

const logStatusMeta = {
  success: { dot: 'bg-accent', text: 'text-accent' },
  warning: { dot: 'bg-warning', text: 'text-warning' },
  error: { dot: 'bg-danger', text: 'text-danger' },
};

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold', color)}>{value}</p>
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

function ConnectionCard({ connection, onConfigure, onToggle, onSync, onMap }) {
  const meta = statusMeta[connection.status];
  const StatusIcon = meta.icon;
  const mappingPct =
    Math.round(
      ((connection.mappedRoomTypes + connection.mappedRatePlans) /
        (connection.totalRoomTypes + connection.totalRatePlans)) *
        100
    ) || 0;

  return (
    <div
      className={cn(
        'group rounded-xl border bg-surface p-5 transition-all hover:shadow-md',
        connection.status === 'error'
          ? 'border-danger/30 hover:border-danger/50'
          : connection.status === 'syncing'
            ? 'border-info/30 hover:border-info/50'
            : connection.status === 'connected'
              ? 'border-border hover:border-secondary/50'
              : 'border-border hover:border-secondary/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm',
              connection.logoColor
            )}
          >
            {connection.name[0]}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{connection.name}</h3>
            <p className="text-xs text-text-muted capitalize">
              {connection.type} • {connection.syncFrequency}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              meta.class
            )}
          >
            <StatusIcon
              className={cn('h-3 w-3', connection.status === 'syncing' && 'animate-spin')}
            />
            {meta.label}
          </span>
          <button
            onClick={() => onConfigure(connection)}
            className="rounded-md p-1 text-text-muted hover:bg-surface-elevated hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Sync Info */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-text-muted">Last Sync</p>
          <p className="mt-0.5 font-medium text-text-primary">{connection.lastSync}</p>
        </div>
        <div>
          <p className="text-text-muted">Next Sync</p>
          <p
            className={cn(
              'mt-0.5 font-medium',
              connection.status === 'error' ? 'text-danger' : 'text-text-primary'
            )}
          >
            {connection.nextSync}
          </p>
        </div>
      </div>

      {connection.errorMessage && (
        <div className="mt-3 rounded-lg border border-danger/20 bg-danger/5 p-2.5 flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger">{connection.errorMessage}</p>
        </div>
      )}

      {/* Mapping Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-muted">Mapping Complete</span>
          <span
            className={cn(
              'text-xs font-bold',
              mappingPct === 100 ? 'text-accent' : mappingPct >= 50 ? 'text-warning' : 'text-danger'
            )}
          >
            {mappingPct}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              mappingPct === 100 ? 'bg-accent' : mappingPct >= 50 ? 'bg-warning' : 'bg-danger'
            )}
            style={{ width: `${mappingPct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-text-muted">
          {connection.mappedRoomTypes}/{connection.totalRoomTypes} room types •{' '}
          {connection.mappedRatePlans}/{connection.totalRatePlans} rate plans
        </p>
      </div>

      {/* Stats Row */}
      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <BedDouble className="h-3.5 w-3.5 text-text-muted" />
          {connection.reservationsToday} bookings
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <DollarSign className="h-3.5 w-3.5 text-text-muted" />$
          {connection.revenueToday.toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        {connection.status === 'disconnected' ? (
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => onConfigure(connection)}
          >
            <Link2 className="mr-1.5 h-3.5 w-3.5" /> Connect
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onSync(connection)}
              disabled={connection.status === 'syncing'}
            >
              <RefreshCw
                className={cn(
                  'mr-1.5 h-3.5 w-3.5',
                  connection.status === 'syncing' && 'animate-spin'
                )}
              />
              {connection.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onMap(connection)}
            >
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" /> Map
            </Button>
          </>
        )}
        <button
          onClick={() => onToggle(connection.id)}
          className={cn(
            'relative inline-flex h-7 w-11 items-center rounded-full transition-colors shrink-0',
            connection.isActive ? 'bg-secondary' : 'bg-border'
          )}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
              connection.isActive ? 'translate-x-[22px]' : 'translate-x-1'
            )}
          />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ChannelManagerPage() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState(otaConnections);
  const [viewMode, setViewMode] = useState('grid');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [showMapping, setShowMapping] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [mappingTab, setMappingTab] = useState('rooms');
  const [roomTypeMap, setRoomTypeMap] = useState(otaRoomTypeMappings);
  const [ratePlanMap, setRatePlanMap] = useState(otaRatePlanMappings);

  const filteredConnections = useMemo(() => {
    return connections.filter((c) => {
      const matchesQuery =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.type.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [connections, query, statusFilter]);

  const stats = useMemo(() => {
    const connected = connections.filter(
      (c) => c.status === 'connected' || c.status === 'syncing'
    ).length;
    const errors = connections.filter((c) => c.status === 'error').length;
    const totalBookings = connections.reduce((s, c) => s + c.reservationsToday, 0);
    const totalRevenue = connections.reduce((s, c) => s + c.revenueToday, 0);
    return { connected, errors, totalBookings, totalRevenue };
  }, [connections]);

  const handleToggle = (id) => {
    setConnections((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const nextActive = !c.isActive;
        return {
          ...c,
          isActive: nextActive,
          status: nextActive
            ? c.status === 'disconnected'
              ? 'pending'
              : c.status
            : 'disconnected',
        };
      })
    );
  };

  const handleSync = (connection) => {
    setConnections((prev) =>
      prev.map((c) => {
        if (c.id !== connection.id) return c;
        return { ...c, status: 'syncing', lastSync: 'In progress...' };
      })
    );
    setTimeout(() => {
      setConnections((prev) =>
        prev.map((c) => {
          if (c.id !== connection.id) return c;
          return {
            ...c,
            status: 'connected',
            lastSync: new Date().toLocaleString(),
            nextSync: 'Auto',
          };
        })
      );
    }, 2500);
  };

  const openMapping = (connection) => {
    setSelectedConnection(connection);
    setShowMapping(true);
    setMappingTab('rooms');
  };

  const openConfig = (connection) => {
    setSelectedConnection(connection);
    setShowConfig(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Channel Manager</h1>
          <p className="text-sm text-text-secondary">
            OTA connections, inventory mapping, and sync controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export Logs
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Connection
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Active Channels"
          value={stats.connected}
          icon={Wifi}
          color="text-accent"
          subtext={`of ${connections.length} total`}
        />
        <StatCard
          label="Errors"
          value={stats.errors}
          icon={AlertTriangle}
          color="text-danger"
          subtext="Require attention"
        />
        <StatCard
          label="Today's Bookings"
          value={stats.totalBookings}
          icon={BedDouble}
          color="text-secondary"
          subtext="Across all channels"
        />
        <StatCard
          label="Today's Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="text-info"
          subtext="Channel-driven"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search channels..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="connected">Connected</option>
            <option value="syncing">Syncing</option>
            <option value="error">Error</option>
            <option value="disconnected">Disconnected</option>
          </select>
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-secondary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-secondary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Connection Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConnections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onConfigure={openConfig}
              onToggle={handleToggle}
              onSync={handleSync}
              onMap={openMapping}
            />
          ))}
          {filteredConnections.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <Globe className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No channels match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Connection List */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Channel</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Last Sync</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Mapping</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Today</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredConnections.map((c) => {
                  const meta = statusMeta[c.status];
                  const StatusIcon = meta.icon;
                  const mappingPct =
                    Math.round(
                      ((c.mappedRoomTypes + c.mappedRatePlans) /
                        (c.totalRoomTypes + c.totalRatePlans)) *
                        100
                    ) || 0;
                  return (
                    <tr key={c.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold',
                              c.logoColor
                            )}
                          >
                            {c.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{c.name}</p>
                            <p className="text-xs text-text-muted capitalize">{c.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
                            meta.class
                          )}
                        >
                          <StatusIcon
                            className={cn('h-3 w-3', c.status === 'syncing' && 'animate-spin')}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{c.lastSync}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                mappingPct === 100
                                  ? 'bg-accent'
                                  : mappingPct >= 50
                                    ? 'bg-warning'
                                    : 'bg-danger'
                              )}
                              style={{ width: `${mappingPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-muted">{mappingPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-medium text-text-primary">
                          {c.reservationsToday}{' '}
                          <span className="text-text-muted text-xs">bkgs</span>
                        </p>
                        <p className="text-xs text-text-muted">
                          ${c.revenueToday.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSync(c)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            title="Sync"
                          >
                            <RefreshCw
                              className={cn('h-4 w-4', c.status === 'syncing' && 'animate-spin')}
                            />
                          </button>
                          <button
                            onClick={() => openMapping(c)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            title="Map"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openConfig(c)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                            title="Settings"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredConnections.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                      No channels match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Sync Logs ─── */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Clock className="h-4 w-4 text-secondary" /> Recent Sync Activity
          </h3>
          <Button variant="ghost" size="sm">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Channel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {syncLogs.map((log) => {
                const meta = logStatusMeta[log.status];
                return (
                  <tr key={log.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3 text-text-secondary text-xs font-mono">{log.time}</td>
                    <td className="px-4 py-3 text-text-primary font-medium">{log.channel}</td>
                    <td className="px-4 py-3 text-text-secondary">{log.action}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                        <span className={cn('text-xs font-medium capitalize', meta.text)}>
                          {log.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{log.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* ─── Mapping Modal ─── */}
      {showMapping && selectedConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMapping(false)}
          />
          <div className="relative w-full max-w-4xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold',
                    selectedConnection.logoColor
                  )}
                >
                  {selectedConnection.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Map {selectedConnection.name}
                  </h3>
                  <p className="text-xs text-text-muted">
                    Link OTA inventory to your PMS room types and rate plans
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMapping(false)}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-border bg-background px-6">
              <div className="flex gap-1">
                {[
                  { id: 'rooms', label: 'Room Types', icon: BedDouble },
                  { id: 'rates', label: 'Rate Plans', icon: DollarSign },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = mappingTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setMappingTab(tab.id)}
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

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {mappingTab === 'rooms' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-surface p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-medium text-text-primary">
                        Room Type Mapping
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {roomTypeMap[selectedConnection.id]?.filter((m) => m.mapped).length || 0} of{' '}
                      {pmsRoomTypes.length} mapped
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(roomTypeMap[selectedConnection.id] || []).map((mapping) => (
                      <div
                        key={mapping.otaRoomId}
                        className={cn(
                          'flex items-center gap-4 rounded-xl border p-4 transition-all',
                          mapping.mapped
                            ? 'border-accent/30 bg-accent/5'
                            : 'border-border bg-surface'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-text-muted bg-background px-1.5 py-0.5 rounded border border-border">
                              {mapping.otaRoomId}
                            </span>
                            <span className="text-sm font-medium text-text-primary">
                              {mapping.otaName}
                            </span>
                          </div>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <select
                            value={mapping.pmsRoomId || ''}
                            onChange={(e) => {
                              const val = e.target.value || null;
                              setRoomTypeMap((prev) => ({
                                ...prev,
                                [selectedConnection.id]: prev[selectedConnection.id].map((m) =>
                                  m.otaRoomId === mapping.otaRoomId
                                    ? { ...m, pmsRoomId: val, mapped: !!val }
                                    : m
                                ),
                              }));
                            }}
                            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">— Unmapped —</option>
                            {pmsRoomTypes.map((rt) => (
                              <option key={rt.id} value={rt.id}>
                                {rt.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {mapping.mapped ? (
                          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mappingTab === 'rates' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-surface p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-medium text-text-primary">
                        Rate Plan Mapping
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {ratePlanMap[selectedConnection.id]?.filter((m) => m.mapped).length || 0}{' '}
                      mapped
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(ratePlanMap[selectedConnection.id] || []).map((mapping) => (
                      <div
                        key={mapping.otaPlanId}
                        className={cn(
                          'flex items-center gap-4 rounded-xl border p-4 transition-all',
                          mapping.mapped
                            ? 'border-accent/30 bg-accent/5'
                            : 'border-border bg-surface'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-text-muted bg-background px-1.5 py-0.5 rounded border border-border">
                              {mapping.otaPlanId}
                            </span>
                            <span className="text-sm font-medium text-text-primary">
                              {mapping.otaName}
                            </span>
                          </div>
                        </div>
                        <ArrowRightLeft className="h-4 w-4 text-text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <select
                            value={mapping.pmsPlanId || ''}
                            onChange={(e) => {
                              const val = e.target.value || null;
                              setRatePlanMap((prev) => ({
                                ...prev,
                                [selectedConnection.id]: prev[selectedConnection.id].map((m) =>
                                  m.otaPlanId === mapping.otaPlanId
                                    ? { ...m, pmsPlanId: val, mapped: !!val }
                                    : m
                                ),
                              }));
                            }}
                            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">— Unmapped —</option>
                            <option value="rack">Rack Rate</option>
                            <option value="corp">Corporate</option>
                            <option value="advance">Advance Purchase</option>
                            <option value="member">Member Rate</option>
                          </select>
                        </div>
                        {mapping.mapped ? (
                          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
                        )}
                      </div>
                    ))}
                    {(!ratePlanMap[selectedConnection.id] ||
                      ratePlanMap[selectedConnection.id].length === 0) && (
                      <div className="text-center py-12 text-text-muted text-sm">
                        No rate plans available for this channel.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-surface px-6 py-4 flex items-center justify-between shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setShowMapping(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setShowMapping(false)}>
                <Save className="mr-1.5 h-4 w-4" /> Save Mapping
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Configuration Drawer ─── */}
      {showConfig && selectedConnection && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConfig(false)}
          />
          <div className="relative w-full max-w-md bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-xs',
                    selectedConnection.logoColor
                  )}
                >
                  {selectedConnection.name[0]}
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  {selectedConnection.name} Settings
                </h3>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Connection Status */}
              {(() => {
                const meta = statusMeta[selectedConnection.status];
                const StatusIcon = meta.icon;
                return (
                  <div className={cn('rounded-lg border p-4', meta.class)}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn('h-4 w-4', meta.dot.replace('bg-', 'text-'))} />
                      <span className="text-sm font-semibold">{meta.label}</span>
                    </div>
                    {selectedConnection.errorMessage && (
                      <p className="mt-1 text-xs text-danger">{selectedConnection.errorMessage}</p>
                    )}
                  </div>
                );
              })()}

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedConnection.apiKey}
                    readOnly
                    className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary"
                  />
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated text-text-secondary">
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Webhook URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedConnection.webhookUrl}
                    readOnly
                    className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary"
                  />
                  <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated text-text-secondary">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Sync Frequency */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Sync Frequency
                </label>
                <select
                  defaultValue={selectedConnection.syncFrequency}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option>Real-time</option>
                  <option>Every 15 min</option>
                  <option>Every 30 min</option>
                  <option>Every 60 min</option>
                  <option>Manual only</option>
                </select>
              </div>

              {/* Inventory Push Settings */}
              <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Push Settings
                </h4>
                <label className="flex items-center justify-between text-sm text-text-primary cursor-pointer">
                  <span>Auto-push inventory</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                  />
                </label>
                <label className="flex items-center justify-between text-sm text-text-primary cursor-pointer">
                  <span>Auto-push rates</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                  />
                </label>
                <label className="flex items-center justify-between text-sm text-text-primary cursor-pointer">
                  <span>Close on stop-sell</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-border">
                <Button variant="outline" className="w-full" size="sm">
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Test Connection
                </Button>
                {selectedConnection.status !== 'disconnected' ? (
                  <Button
                    variant="outline"
                    className="w-full text-danger border-danger/30 hover:bg-danger/10"
                    size="sm"
                  >
                    <Unlink className="mr-1.5 h-4 w-4" /> Disconnect Channel
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" size="sm">
                    <Link2 className="mr-1.5 h-4 w-4" /> Connect Channel
                  </Button>
                )}
                <Button variant="ghost" className="w-full text-danger hover:bg-danger/10" size="sm">
                  <Trash2 className="mr-1.5 h-4 w-4" /> Remove Connection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
