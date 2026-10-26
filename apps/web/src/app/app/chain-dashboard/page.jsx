/* apps/web/src/app/app/chain-dashboard/page.jsx — C2 Chain Dashboard */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';
import { getScope } from '../../../api/chains';
import { getChainTapeChart, getChainRollup, getChainExceptions } from '../../../api/chainDashboard';

const DAY_MS = 86400000;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function shiftDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
const weekday = (dateStr) =>
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][new Date(`${dateStr}T00:00:00`).getDay()];
const shortDay = (dateStr) => dateStr.slice(8);
const fmtMoney = (v, cur) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: cur || 'ZAR',
    maximumFractionDigits: 0,
  }).format(v || 0);
const fmtPct = (v) => `${(v ?? 0).toFixed(1)}%`;

const TABS = [
  { key: 'tape', label: 'Tape Chart', icon: LayoutGrid },
  { key: 'rollup', label: 'Rollup', icon: BarChart3 },
  { key: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
];

const STATE_STYLE = {
  vacant: { background: 'rgba(148,163,184,0.14)' },
  occupied: { background: '#6366f1' },
  arrival: { background: '#10b981' },
  departure: { background: '#f59e0b' },
  turn: { background: 'linear-gradient(135deg, #10b981 50%, #f59e0b 50%)' },
  ooo: {
    background:
      'repeating-linear-gradient(45deg, rgba(239,68,68,0.35), rgba(239,68,68,0.35) 4px, rgba(239,68,68,0.15) 4px, rgba(239,68,68,0.15) 8px)',
  },
};
const LEGEND = [
  { key: 'occupied', label: 'Occupied' },
  { key: 'arrival', label: 'Arrival' },
  { key: 'departure', label: 'Departure' },
  { key: 'turn', label: 'Arrive + Depart' },
  { key: 'vacant', label: 'Vacant' },
  { key: 'ooo', label: 'Out of order' },
];
const SEV_ICON = { critical: AlertOctagon, warning: AlertTriangle, info: Info };
const SEV_COLOR = { critical: 'text-red-500', warning: 'text-amber-500', info: 'text-sky-500' };
const SEV_CHIP = {
  critical: 'bg-red-500/10 text-red-500',
  warning: 'bg-amber-500/10 text-amber-500',
  info: 'bg-sky-500/10 text-sky-500',
};

function Skeleton() {
  return <div className="h-48 animate-pulse rounded-lg bg-surface-elevated" />;
}

function QueryError({ error }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-text-primary">
      Failed to load chain data: {error?.message ?? 'unknown error'}
    </div>
  );
}

function TapeCellView({ cell }) {
  const c = cell ?? { state: 'vacant' };
  const label = c.guestName
    ? `${c.guestName} · ${c.confirmationNumber ?? ''} · ${c.state}${c.vipStatus ? ` · VIP ${c.vipStatus}` : ''}`
    : c.state;
  return (
    <div
      title={label}
      className="h-7 border-l border-border/50 first:border-l-0"
      style={STATE_STYLE[c.state] ?? STATE_STYLE.vacant}
    />
  );
}

function TapePropertySection({ property, days }) {
  const occValues = days.map((d) => property.occupancy[d]?.pct ?? 0);
  const windowPct = occValues.length
    ? (occValues.reduce((a, b) => a + b, 0) / occValues.length).toFixed(1)
    : '0.0';
  const cols = `180px repeat(${days.length}, minmax(40px, 1fr))`;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">{property.name}</h3>
            <Link
              to="/app/room-plan"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              room plan <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-xs text-text-muted">
            {property.code}
            {property.city ? ` · ${property.city}` : ''} · {property.roomCount} rooms · business
            date {property.businessDate}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-text-primary">{windowPct}%</div>
          <div className="text-[10px] uppercase tracking-wide text-text-muted">
            window occupancy
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="grid" style={{ gridTemplateColumns: cols }}>
            <div className="sticky left-0 z-10 bg-surface px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Room
            </div>
            {days.map((d) => (
              <div key={d} className="py-1.5 text-center text-[10px] text-text-muted">
                <div className="font-semibold text-text-secondary">{shortDay(d)}</div>
                <div>{weekday(d)}</div>
              </div>
            ))}
          </div>
          {property.rooms.map((room) => (
            <div
              key={room.id}
              className="grid border-t border-border/60"
              style={{ gridTemplateColumns: cols }}
            >
              <div className="sticky left-0 z-10 flex items-center justify-between gap-2 bg-surface px-3 py-1">
                <span className="text-xs font-medium text-text-primary">{room.number}</span>
                <span className="truncate text-[10px] text-text-muted">
                  {room.roomTypeName}
                  {room.ooo ? ' · OOO' : ''}
                </span>
              </div>
              {days.map((d) => (
                <TapeCellView key={d} cell={property.cells[room.id]?.[d]} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TapeView({ data }) {
  if (data.properties.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-text-muted">
        This chain has no properties yet. Attach properties under{' '}
        <Link to="/app/properties" className="text-primary hover:underline">
          Properties
        </Link>
        .
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Legend
        </span>
        {LEGEND.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="inline-block h-3.5 w-6 rounded-sm border border-border"
              style={STATE_STYLE[l.key]}
            />
            {l.label}
          </span>
        ))}
      </div>
      {data.properties.map((p) => (
        <TapePropertySection key={p.id} property={p} days={data.days} />
      ))}
    </div>
  );
}

function RollupView({ data }) {
  const [expanded, setExpanded] = useState(null);
  const cur = data.currency || 'ZAR';
  const t = data.consolidated?.totals;
  const cards = [
    { label: 'Occupancy', value: fmtPct(t?.occupancyPct) },
    { label: 'Room revenue', value: fmtMoney(t?.roomRevenue, cur) },
    { label: 'Folio revenue', value: fmtMoney(t?.folioRevenue, cur) },
    { label: 'ADR', value: fmtMoney(t?.adr, cur) },
    { label: 'RevPAR', value: fmtMoney(t?.revpar, cur) },
    { label: 'Room nights', value: `${t?.occupiedNights ?? 0} / ${t?.availableNights ?? 0}` },
  ];
  const daily = data.consolidated?.daily ?? [];
  const maxOcc = Math.max(1, ...daily.map((d) => d.occupancyPct));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-surface p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              {c.label}
            </div>
            <div className="mt-1 text-lg font-bold text-text-primary">{c.value}</div>
          </div>
        ))}
      </div>

      {daily.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">
            Consolidated daily occupancy
          </h3>
          <div className="flex h-20 items-end gap-1">
            {daily.map((d) => (
              <div
                key={d.date}
                title={`${d.date} — ${fmtPct(d.occupancyPct)} occ · ${fmtMoney(d.roomRevenue, cur)}`}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${Math.max(4, (d.occupancyPct / maxOcc) * 100)}%`,
                  background: '#6366f1',
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-text-muted">
            <span>{daily[0]?.date}</span>
            <span>{daily[daily.length - 1]?.date}</span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
              <th className="px-4 py-2.5">Property</th>
              <th className="px-2 py-2.5">Rooms</th>
              <th className="px-2 py-2.5">Occ nights</th>
              <th className="px-2 py-2.5">Occupancy</th>
              <th className="px-2 py-2.5 text-right">Room revenue</th>
              <th className="px-2 py-2.5 text-right">Folio revenue</th>
              <th className="px-2 py-2.5 text-right">ADR</th>
              <th className="px-2 py-2.5 text-right">RevPAR</th>
              <th className="px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {data.properties.map((p) => (
              <>
                <tr
                  key={p.id}
                  onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  className="cursor-pointer border-b border-border/60 hover:bg-surface-elevated"
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-text-primary">{p.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {p.code}
                      {p.city ? ` · ${p.city}` : ''}
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-text-secondary">
                    {p.availableRooms}/{p.totalRooms}
                  </td>
                  <td className="px-2 py-2.5 text-text-secondary">{p.totals.occupiedNights}</td>
                  <td className="px-2 py-2.5 text-text-secondary">
                    {fmtPct(p.totals.occupancyPct)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-text-primary">
                    {fmtMoney(p.totals.roomRevenue, cur)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-text-primary">
                    {fmtMoney(p.totals.folioRevenue, cur)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-text-secondary">
                    {fmtMoney(p.totals.adr, cur)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-text-secondary">
                    {fmtMoney(p.totals.revpar, cur)}
                  </td>
                  <td className="px-2 py-2.5 text-text-muted">{expanded === p.id ? '▲' : '▼'}</td>
                </tr>
                {expanded === p.id && (
                  <tr
                    key={`${p.id}-daily`}
                    className="border-b border-border/60 bg-surface-elevated/40"
                  >
                    <td colSpan={9} className="px-6 py-3">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                        {p.daily.map((d) => (
                          <div
                            key={d.date}
                            className="rounded-md border border-border bg-surface px-2.5 py-2"
                          >
                            <div className="text-[10px] text-text-muted">{d.date}</div>
                            <div className="text-xs font-semibold text-text-primary">
                              {fmtPct(d.occupancyPct)}
                            </div>
                            <div className="text-[11px] text-text-secondary">
                              {d.occupied}/{d.available} · {fmtMoney(d.roomRevenue, cur)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {t && (
              <tr className="bg-surface-elevated/60 font-semibold">
                <td className="px-4 py-2.5 text-text-primary">Consolidated</td>
                <td className="px-2 py-2.5 text-text-secondary" colSpan={2}>
                  {t.occupiedNights}/{t.availableNights} nights
                </td>
                <td className="px-2 py-2.5 text-text-primary">{fmtPct(t.occupancyPct)}</td>
                <td className="px-2 py-2.5 text-right text-text-primary">
                  {fmtMoney(t.roomRevenue, cur)}
                </td>
                <td className="px-2 py-2.5 text-right text-text-primary">
                  {fmtMoney(t.folioRevenue, cur)}
                </td>
                <td className="px-2 py-2.5 text-right text-text-primary">{fmtMoney(t.adr, cur)}</td>
                <td className="px-2 py-2.5 text-right text-text-primary">
                  {fmtMoney(t.revpar, cur)}
                </td>
                <td className="px-2 py-2.5" />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExceptionsView({ data }) {
  const [sev, setSev] = useState('all');
  const [propFilter, setPropFilter] = useState('all');
  const propertyOptions = useMemo(() => {
    const map = new Map();
    for (const e of data.exceptions) map.set(e.propertyId, e.propertyName);
    return [...map.entries()];
  }, [data]);
  const filtered = data.exceptions.filter(
    (e) =>
      (sev === 'all' || e.severity === sev) && (propFilter === 'all' || e.propertyId === propFilter)
  );
  const chip = (key, label, count) => (
    <button
      key={key}
      onClick={() => setSev(key)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        sev === key ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-elevated'
      }`}
    >
      {label}
      {count != null && <span className="ml-1 text-text-muted">({count})</span>}
    </button>
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        {chip('all', 'All', data.exceptions.length)}
        {chip('critical', 'Critical', data.summary.critical)}
        {chip('warning', 'Warning', data.summary.warning)}
        {chip('info', 'Info', data.summary.info)}
        <select
          value={propFilter}
          onChange={(e) => setPropFilter(e.target.value)}
          className="ml-auto rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary"
        >
          <option value="all">All properties</option>
          {propertyOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-text-muted">
          generated {new Date(data.generatedAt).toLocaleTimeString()}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center text-sm text-text-muted">
          No exceptions match this filter.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {filtered.map((e) => {
            const Icon = SEV_ICON[e.severity] ?? Info;
            return (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                <Icon
                  className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${SEV_COLOR[e.severity] ?? SEV_COLOR.info}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{e.title}</span>
                    <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] text-text-secondary">
                      {e.propertyName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${SEV_CHIP[e.severity] ?? SEV_CHIP.info}`}
                    >
                      {e.severity}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-secondary">{e.detail}</p>
                </div>
                {e.date && <span className="shrink-0 text-[11px] text-text-muted">{e.date}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ChainDashboardPage() {
  const scopeQuery = useQuery({ queryKey: ['chain-dashboard-scope'], queryFn: getScope });
  const chains = scopeQuery.data?.chains ?? [];
  const [chainId, setChainId] = useState('');
  const effectiveChainId = chainId || chains[0]?.id || '';
  const [tab, setTab] = useState('tape');
  const [rangeDays, setRangeDays] = useState(14);
  const [offset, setOffset] = useState(0);
  const from = useMemo(() => shiftDays(todayStr(), offset), [offset]);
  const to = useMemo(() => shiftDays(from, rangeDays - 1), [from, rangeDays]);

  const tapeQuery = useQuery({
    queryKey: ['chain-tape', effectiveChainId, from, to],
    queryFn: () => getChainTapeChart(effectiveChainId, from, to),
    enabled: !!effectiveChainId,
  });
  const rollupQuery = useQuery({
    queryKey: ['chain-rollup', effectiveChainId, from, to],
    queryFn: () => getChainRollup(effectiveChainId, from, to),
    enabled: !!effectiveChainId,
  });
  const exceptionsQuery = useQuery({
    queryKey: ['chain-exceptions', effectiveChainId],
    queryFn: () => getChainExceptions(effectiveChainId, 7),
    enabled: !!effectiveChainId,
    refetchInterval: 60_000,
  });

  const excCount = exceptionsQuery.data?.exceptions?.length ?? 0;
  const activeQuery = tab === 'tape' ? tapeQuery : tab === 'rollup' ? rollupQuery : exceptionsQuery;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Chain Dashboard</h1>
          <p className="text-sm text-text-muted">
            All properties, one grid — occupancy, revenue rollup and cross-property exceptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={effectiveChainId}
            onChange={(e) => setChainId(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          >
            {chains.length === 0 && <option value="">No chains</option>}
            {chains.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {effectiveChainId && (
            <button
              onClick={() => {
                tapeQuery.refetch();
                rollupQuery.refetch();
                exceptionsQuery.refetch();
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-secondary hover:bg-surface-elevated"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          )}
        </div>
      </div>

      {!effectiveChainId && !scopeQuery.isLoading ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10 text-center">
          <Building2 className="h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-secondary">No chain configured for this account.</p>
          <Link to="/app/properties" className="text-sm text-primary hover:underline">
            Create a chain under Properties →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border bg-surface p-0.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      tab === t.key
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                    {t.key === 'exceptions' && excCount > 0 && (
                      <span className="rounded-full bg-red-500/10 px-1.5 text-[10px] font-semibold text-red-500">
                        {excCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {tab !== 'exceptions' && (
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => setOffset((o) => o - rangeDays)}
                  className="rounded-md border border-border bg-surface p-1.5 text-text-secondary hover:bg-surface-elevated"
                  aria-label="Previous window"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOffset(0)}
                  className={`rounded-md border border-border px-3 py-1.5 text-xs font-medium ${
                    offset === 0
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface text-text-secondary hover:bg-surface-elevated'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setOffset((o) => Math.min(0, o + rangeDays))}
                  disabled={offset === 0}
                  className="rounded-md border border-border bg-surface p-1.5 text-text-secondary hover:bg-surface-elevated disabled:opacity-40"
                  aria-label="Next window"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <select
                  value={rangeDays}
                  onChange={(e) => {
                    setRangeDays(Number(e.target.value));
                    setOffset(0);
                  }}
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-primary"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
                <span className="text-xs text-text-muted">
                  {from} → {to}
                </span>
              </div>
            )}
          </div>

          {scopeQuery.isLoading || activeQuery.isLoading ? (
            <Skeleton />
          ) : activeQuery.isError ? (
            <QueryError error={activeQuery.error} />
          ) : tab === 'tape' ? (
            <TapeView data={tapeQuery.data} />
          ) : tab === 'rollup' ? (
            <RollupView data={rollupQuery.data} />
          ) : (
            <ExceptionsView data={exceptionsQuery.data} />
          )}
        </>
      )}
    </div>
  );
}
