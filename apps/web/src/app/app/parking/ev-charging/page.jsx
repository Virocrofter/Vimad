/* src/app/app/parking/ev-charging/page.jsx */
import { useState, useMemo } from 'react';
import {
  Zap,
  MapPin,
  BatteryCharging,
  Battery,
  BatteryFull,
  Plug,
  PlugZap,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Download,
  User,
  Calendar,
  ChevronRight,
  Wrench,
  Ban,
  Gauge,
  Timer,
  Car,
  QrCode,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

/* ─── Mock Data ─── */
const initialStations = [
  {
    id: 'EV-B01',
    spot: 'P1-B01',
    zone: 'B',
    connector: 'CCS',
    power: 150,
    status: 'charging',
    vehicle: 'BMW iX',
    plate: 'EV-2026',
    guest: 'Emily Davis',
    room: '401',
    sessionStart: '08:30 AM',
    kwh: 34.2,
    chargeLevel: 78,
    ratePerKwh: 0.42,
    targetLevel: 90,
  },
  {
    id: 'EV-B02',
    spot: 'P1-B02',
    zone: 'B',
    connector: 'CCS',
    power: 150,
    status: 'idle',
    vehicle: 'Rivian R1T',
    plate: 'RIV-8842',
    guest: 'David Park',
    room: '502',
    sessionStart: null,
    kwh: 0,
    chargeLevel: 92,
    ratePerKwh: 0.42,
    targetLevel: null,
  },
  {
    id: 'EV-B03',
    spot: 'P1-B03',
    zone: 'B',
    connector: 'Type 2',
    power: 22,
    status: 'available',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    sessionStart: null,
    kwh: 0,
    chargeLevel: 0,
    ratePerKwh: 0.35,
    targetLevel: null,
  },
  {
    id: 'EV-B04',
    spot: 'P1-B06',
    zone: 'B',
    connector: 'Type 2',
    power: 22,
    status: 'charging',
    vehicle: 'Hyundai Ioniq 5',
    plate: 'ION-4471',
    guest: 'Priya Nair',
    room: '215',
    sessionStart: '11:05 AM',
    kwh: 9.6,
    chargeLevel: 54,
    ratePerKwh: 0.35,
    targetLevel: 100,
  },
  {
    id: 'EV-C01',
    spot: 'P2-C06',
    zone: 'C',
    connector: 'CHAdeMO',
    power: 50,
    status: 'reserved',
    vehicle: null,
    plate: null,
    guest: 'Robert Chen',
    room: '118',
    sessionStart: null,
    kwh: 0,
    chargeLevel: 0,
    ratePerKwh: 0.38,
    targetLevel: null,
    reservedFor: '2:00 PM',
  },
  {
    id: 'EV-C02',
    spot: 'P2-C07',
    zone: 'C',
    connector: 'CCS',
    power: 150,
    status: 'available',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    sessionStart: null,
    kwh: 0,
    chargeLevel: 0,
    ratePerKwh: 0.42,
    targetLevel: null,
  },
  {
    id: 'EV-C03',
    spot: 'P2-C08',
    zone: 'C',
    connector: 'Type 2',
    power: 11,
    status: 'offline',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    sessionStart: null,
    kwh: 0,
    chargeLevel: 0,
    ratePerKwh: 0.35,
    targetLevel: null,
    note: 'Breaker fault — vendor ticket #4471 open',
  },
  {
    id: 'EV-D01',
    spot: 'P3-D01',
    zone: 'D',
    connector: 'CCS',
    power: 250,
    status: 'charging',
    vehicle: 'Porsche Taycan',
    plate: 'TYC-0099',
    guest: 'Michael Chen',
    room: 'VIP',
    sessionStart: '09:15 AM',
    kwh: 41.8,
    chargeLevel: 87,
    ratePerKwh: 0.48,
    targetLevel: 100,
  },
  {
    id: 'EV-D02',
    spot: 'P3-D02',
    zone: 'D',
    connector: 'Type 2',
    power: 22,
    status: 'available',
    vehicle: null,
    plate: null,
    guest: null,
    room: null,
    sessionStart: null,
    kwh: 0,
    chargeLevel: 0,
    ratePerKwh: 0.35,
    targetLevel: null,
  },
];

const initialSessions = [
  {
    id: 'CHG-3391',
    station: 'EV-B01',
    guest: 'Emily Davis',
    room: '401',
    kwh: 34.2,
    rate: 0.42,
    status: 'active',
    start: '08:30 AM',
    method: 'Room Charge',
  },
  {
    id: 'CHG-3392',
    station: 'EV-D01',
    guest: 'Michael Chen',
    room: 'VIP',
    kwh: 41.8,
    rate: 0.48,
    status: 'active',
    start: '09:15 AM',
    method: 'Room Charge',
  },
  {
    id: 'CHG-3390',
    station: 'EV-B04',
    guest: 'Priya Nair',
    room: '215',
    kwh: 9.6,
    rate: 0.35,
    status: 'active',
    start: '11:05 AM',
    method: 'Room Charge',
  },
  {
    id: 'CHG-3387',
    station: 'EV-B02',
    guest: 'David Park',
    room: '502',
    kwh: 28.4,
    rate: 0.42,
    status: 'complete',
    start: 'Yesterday, 6:40 PM',
    end: 'Yesterday, 9:55 PM',
    method: 'Room Charge',
  },
  {
    id: 'CHG-3384',
    station: 'EV-C02',
    guest: 'Lisa Wong',
    room: '310',
    kwh: 16.1,
    rate: 0.42,
    status: 'complete',
    start: 'Yesterday, 2:10 PM',
    end: 'Yesterday, 3:35 PM',
    method: 'Credit Card',
  },
  {
    id: 'CHG-3379',
    station: 'EV-D02',
    guest: 'Amanda Wilson',
    room: '205',
    kwh: 21.7,
    rate: 0.35,
    status: 'complete',
    start: 'Yesterday, 8:05 AM',
    end: 'Yesterday, 10:15 AM',
    method: 'Room Charge',
  },
];

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZAR' }).format(amount);
}

function sessionCost(session) {
  return session.kwh * session.rate;
}

const statusMeta = {
  charging: {
    label: 'Charging',
    dot: 'bg-emerald-500',
    class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  idle: { label: 'Plugged In', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20' },
  available: {
    label: 'Available',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  reserved: {
    label: 'Reserved',
    dot: 'bg-secondary',
    class: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  offline: {
    label: 'Offline',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

const connectorMeta = {
  'Type 2': { label: 'Type 2 (AC)' },
  CCS: { label: 'CCS (DC Fast)' },
  CHAdeMO: { label: 'CHAdeMO (DC)' },
};

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs yesterday
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
              .replace('emerald-500', 'emerald-500/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

function StationCard({ station, onClick }) {
  const meta = statusMeta[station.status];
  const cost = station.kwh * station.ratePerKwh;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-xl border p-4 text-left transition-all hover:shadow-md w-full',
        station.status === 'offline'
          ? 'border-danger/30 bg-danger/5 opacity-70'
          : station.status === 'charging'
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : station.status === 'reserved'
              ? 'border-secondary/30 bg-secondary/5'
              : 'border-border bg-surface hover:border-accent/50'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold text-text-muted">{station.id}</span>
        <span
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            meta.dot,
            station.status === 'charging' && 'animate-pulse'
          )}
        />
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        {station.status === 'charging' ? (
          <PlugZap className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Plug className="h-3.5 w-3.5 text-text-muted" />
        )}
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          {station.connector} · {station.power}kW
        </span>
      </div>

      {station.vehicle ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-primary truncate">{station.vehicle}</p>
          <p className="text-xs font-mono text-text-secondary">{station.plate}</p>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted mt-1">
            <User className="h-3 w-3" />
            <span className="truncate">{station.guest}</span>
            {station.room && <span className="text-text-secondary">· {station.room}</span>}
          </div>

          {/* Charge level bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-text-muted">Battery</span>
              <span
                className={cn(
                  'text-[10px] font-mono font-semibold',
                  station.status === 'charging' ? 'text-emerald-500' : 'text-text-secondary'
                )}
              >
                {station.chargeLevel}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  station.status === 'charging' ? 'bg-emerald-500 animate-pulse' : 'bg-info'
                )}
                style={{ width: `${station.chargeLevel}%` }}
              />
            </div>
          </div>

          {station.status === 'charging' && (
            <div className="mt-2 flex items-center justify-between rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
              <span className="text-[10px] font-medium text-emerald-600">
                {station.kwh.toFixed(1)} kWh
              </span>
              <span className="text-[10px] font-mono font-semibold text-emerald-600">
                {formatCurrency(cost)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="py-2 text-center">
          <p className="text-xs text-text-muted">{meta.label}</p>
          {station.note && <p className="text-[10px] text-danger mt-1">{station.note}</p>}
          {station.reservedFor && (
            <p className="text-[10px] text-secondary mt-1">Hold for {station.reservedFor}</p>
          )}
        </div>
      )}
    </button>
  );
}

function StationDetailModal({ station, onClose, onUpdateStatus, onStopSession }) {
  const [newStatus, setNewStatus] = useState(station.status);
  const cost = station.kwh * station.ratePerKwh;

  const handleStatusChange = (status) => {
    setNewStatus(status);
    onUpdateStatus(station.id, status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Station {station.id}</h3>
            <p className="text-xs text-text-muted">
              {connectorMeta[station.connector].label} · {station.power}kW · Spot {station.spot}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div
            className={cn('rounded-lg border p-3', statusMeta[newStatus || station.status].class)}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2.5 w-2.5 rounded-full',
                  statusMeta[newStatus || station.status].dot
                )}
              />
              <span className="text-sm font-semibold">
                {statusMeta[newStatus || station.status].label}
              </span>
            </div>
          </div>

          {station.vehicle ? (
            <>
              {/* Vehicle Info */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Vehicle Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Car className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary font-medium">{station.vehicle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <QrCode className="h-4 w-4 text-text-muted" />
                    <span className="font-mono text-text-primary">{station.plate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <User className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">{station.guest}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">Room {station.room}</span>
                  </div>
                </div>
              </div>

              {/* Charging Status */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <BatteryCharging className="h-4 w-4 text-emerald-500" /> Charging Status
                  </h4>
                  <span
                    className={cn(
                      'text-sm font-bold font-mono',
                      station.status === 'charging' ? 'text-emerald-500' : 'text-text-muted'
                    )}
                  >
                    {station.chargeLevel}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      station.status === 'charging' ? 'bg-emerald-500 animate-pulse' : 'bg-info'
                    )}
                    style={{ width: `${station.chargeLevel}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  {station.sessionStart && (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Timer className="h-3.5 w-3.5 text-text-muted" />
                      <span>Started {station.sessionStart}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Gauge className="h-3.5 w-3.5 text-text-muted" />
                    <span>{station.kwh.toFixed(1)} kWh delivered</span>
                  </div>
                  {station.targetLevel && (
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <BatteryFull className="h-3.5 w-3.5 text-text-muted" />
                      <span>Target {station.targetLevel}%</span>
                    </div>
                  )}
                </div>
                {station.status === 'charging' && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      onStopSession(station.id);
                      onClose();
                    }}
                  >
                    <Ban className="mr-1.5 h-4 w-4" /> Stop Charging Session
                  </Button>
                )}
              </div>

              {/* Billing */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                  Billing
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Rate</span>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(station.ratePerKwh)} / kWh
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Energy delivered</span>
                  <span className="font-mono text-text-primary">{station.kwh.toFixed(1)} kWh</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span className="text-text-primary">Estimated total</span>
                  <span className="font-mono text-text-primary">{formatCurrency(cost)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <Plug className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">
                {station.status === 'reserved'
                  ? `Reserved for ${station.guest} · Room ${station.room}`
                  : 'No vehicle connected'}
              </p>
              {station.note && <p className="mt-2 text-xs text-danger">{station.note}</p>}
            </div>
          )}

          {/* Status Actions */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Change Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(statusMeta).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-xs font-medium transition-colors',
                    (newStatus || station.status) === key
                      ? meta.class
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {station.vehicle && (
              <Button variant="secondary" size="sm">
                <ArrowUpRight className="mr-1.5 h-4 w-4" /> View Guest Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function EvChargingPage() {
  const [stations, setStations] = useState(initialStations);
  const [sessions] = useState(initialSessions);
  const [selectedStation, setSelectedStation] = useState(null);
  const [zoneFilter, setZoneFilter] = useState('all');
  const [connectorFilter, setConnectorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  /* ─── Computed ─── */
  const stats = useMemo(() => {
    const total = stations.length;
    const charging = stations.filter((s) => s.status === 'charging').length;
    const available = stations.filter((s) => s.status === 'available').length;
    const offline = stations.filter((s) => s.status === 'offline').length;
    const kwhToday = sessions.reduce((sum, s) => sum + s.kwh, 0);
    const revenueToday = sessions.reduce((sum, s) => sum + sessionCost(s), 0);
    const avgPower =
      charging > 0
        ? Math.round(
            stations.filter((s) => s.status === 'charging').reduce((sum, s) => sum + s.power, 0) /
              charging
          )
        : 0;
    return { total, charging, available, offline, kwhToday, revenueToday, avgPower };
  }, [stations, sessions]);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchesZone = zoneFilter === 'all' || s.zone === zoneFilter;
      const matchesConnector = connectorFilter === 'all' || s.connector === connectorFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesZone && matchesConnector && matchesStatus;
    });
  }, [stations, zoneFilter, connectorFilter, statusFilter]);

  const zones = [...new Set(stations.map((s) => s.zone))];

  /* ─── Handlers ─── */
  const handleUpdateStatus = (stationId, status) => {
    setStations((prev) => prev.map((s) => (s.id === stationId ? { ...s, status } : s)));
  };

  const handleStopSession = (stationId) => {
    setStations((prev) => prev.map((s) => (s.id === stationId ? { ...s, status: 'idle' } : s)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">EV Charging Stations</h1>
          <p className="text-sm text-text-secondary">
            Availability, live charging status, and per-session billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Station
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Stations"
          value={stats.total}
          icon={MapPin}
          color="text-text-primary"
          subtext="All zones"
        />
        <StatCard
          label="Charging"
          value={stats.charging}
          icon={PlugZap}
          color="text-emerald-500"
          subtext={`Avg ${stats.avgPower}kW draw`}
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={CheckCircle2}
          color="text-accent"
        />
        <StatCard
          label="Offline"
          value={stats.offline}
          icon={AlertTriangle}
          color="text-danger"
          subtext={stats.offline > 0 ? 'Needs attention' : undefined}
        />
        <StatCard
          label="kWh Today"
          value={stats.kwhToday.toFixed(1)}
          icon={Gauge}
          color="text-info"
        />
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(stats.revenueToday)}
          icon={DollarSign}
          color="text-secondary"
          trend={11}
        />
      </div>

      {/* Offline Alert */}
      {stats.offline > 0 && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm text-text-primary">
            {stats.offline} station{stats.offline > 1 ? 's are' : ' is'} offline. Review vendor
            tickets to restore availability.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                Zone {z}
              </option>
            ))}
          </select>
          <select
            value={connectorFilter}
            onChange={(e) => setConnectorFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Connectors</option>
            {Object.entries(connectorMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
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
        <div className="flex items-center gap-2">
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

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {zones.map((zone) => {
            const zoneStations = filteredStations.filter((s) => s.zone === zone);
            if (zoneStations.length === 0) return null;
            return (
              <div key={zone}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Zone {zone}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {zoneStations.map((station) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      onClick={() => setSelectedStation(station)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {filteredStations.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <Zap className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No stations match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Station
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Connector
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Vehicle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                    Battery
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                    Est. Cost
                  </th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStations.map((station) => (
                  <tr
                    key={station.id}
                    className="hover:bg-background/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedStation(station)}
                  >
                    <td className="px-4 py-3 font-mono text-text-primary">{station.id}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {station.connector} · {station.power}kW
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          statusMeta[station.status].class
                        )}
                      >
                        <span
                          className={cn('h-1.5 w-1.5 rounded-full', statusMeta[station.status].dot)}
                        />
                        {statusMeta[station.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {station.vehicle ? (
                        <div>
                          <p className="text-sm text-text-primary">{station.vehicle}</p>
                          <p className="text-xs font-mono text-text-muted">{station.plate}</p>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {station.vehicle ? `${station.chargeLevel}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">
                      {station.vehicle ? formatCurrency(station.kwh * station.ratePerKwh) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </td>
                  </tr>
                ))}
                {filteredStations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                      No stations match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing / Recent Sessions */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-secondary" /> Charging Sessions & Billing
          </h3>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Session
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Guest
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Station
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                  kWh
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{session.id}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {session.guest}
                    <span className="block text-xs text-text-muted">Room {session.room}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{session.station}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">
                    {session.kwh.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-text-secondary">
                    {formatCurrency(session.rate)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">
                    {formatCurrency(sessionCost(session))}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{session.method}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        session.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-neutral/10 text-text-muted border-border'
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          session.status === 'active'
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-text-muted'
                        )}
                      />
                      {session.status === 'active' ? 'In Progress' : 'Complete'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onUpdateStatus={handleUpdateStatus}
          onStopSession={handleStopSession}
        />
      )}
    </div>
  );
}
