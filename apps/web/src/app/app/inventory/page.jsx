/* apps/web/src/app/app/inventory/page.jsx — I1 sellable room inventory.
 * Status-tiered availability grid, allocations with live pickup tracking,
 * audit-backed adjustment history, overbooking rules, OTA sync. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  History,
  LayoutGrid,
  Lock,
  Percent,
  RefreshCw,
  Settings2,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import { inventoryApi } from '../../../api/inventory';

const DAY_MS = 86400_000;
const fmt = (d) => d.toISOString().slice(0, 10);
const today = () => fmt(new Date());
const addDays = (s, n) => fmt(new Date(new Date(`${s}T00:00:00Z`).getTime() + n * DAY_MS));
const weekday = (s) => new Date(`${s}T00:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short' });
const nice = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
const niceFull = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const HOLD_TYPES = [
  ['group_hold', 'Group / block'],
  ['channel_allotment', 'Channel allotment'],
  ['maintenance_block', 'Maintenance block'],
  ['comp_hold', 'Comp / house use'],
];

const STATUS = {
  available: { label: 'Available', dot: 'bg-emerald-500', cell: 'bg-emerald-500/5' },
  low: { label: 'Low', dot: 'bg-violet-500', cell: 'bg-violet-500/10' },
  critical: { label: 'Critical', dot: 'bg-amber-500', cell: 'bg-amber-500/15' },
  soldout: { label: 'Sold Out', dot: 'bg-slate-400', cell: 'bg-slate-500/15 opacity-70' },
  overbooked: {
    label: 'Overbooked',
    dot: 'bg-rose-500',
    cell: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
  stopsell: { label: 'Stop-sell', dot: 'bg-slate-600', cell: 'bg-slate-600/20 opacity-60' },
};

const cellStatus = (c) =>
  c.stopSell
    ? 'stopsell'
    : c.remaining < 0
      ? 'overbooked'
      : c.remaining === 0
        ? 'soldout'
        : c.remaining <= 2
          ? 'critical'
          : c.remaining <= 5
            ? 'low'
            : 'available';

const errMsg = (e) => e?.response?.data?.error?.message || e?.message || 'Request failed';

export default function InventoryPage() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(addDays(today(), 13));
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [tab, setTab] = useState('grid');
  const [cell, setCell] = useState(null);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [overbook, setOverbook] = useState([]);
  const [holds, setHolds] = useState([]);
  const [holdFilter, setHoldFilter] = useState('active');
  const [history, setHistory] = useState([]);
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const flash = (msg, isErr = false) => {
    setNotice({ msg, isErr });
    setTimeout(() => setNotice(null), 4000);
  };

  // ─── Data ───

  const loadGrid = useCallback(() => {
    setLoading(true);
    setError('');
    inventoryApi
      .grid(from, to)
      .then(setGrid)
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, [from, to]);

  const loadHolds = useCallback(() => {
    inventoryApi
      .listAllocations({})
      .then((res) => setHolds(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const loadOverbook = useCallback(() => {
    inventoryApi
      .listOverbooking()
      .then((res) => setOverbook(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  const loadHistory = useCallback(() => {
    inventoryApi
      .history()
      .then((res) => setHistory(Array.isArray(res) ? res : []))
      .catch(() => {});
  }, []);

  useEffect(loadGrid, [loadGrid]);
  useEffect(() => {
    if (tab === 'allocations') loadHolds();
    if (tab === 'overbook') loadOverbook();
    if (tab === 'history') loadHistory();
  }, [tab, loadHolds, loadOverbook, loadHistory]);

  // ─── Actions ───

  const saveRestriction = async (patch) => {
    try {
      await inventoryApi.setRestriction({
        roomTypeId: cell.roomType.id,
        date: cell.cell.date,
        ...patch,
      });
      flash('Saved');
      setCell(null);
      loadGrid();
    } catch (err) {
      flash(errMsg(err), true);
    }
  };

  const saveOverbook = async (roomTypeId, limit) => {
    try {
      await inventoryApi.setOverbooking(roomTypeId, limit);
      flash('Overbooking rule saved');
      loadOverbook();
      loadGrid();
    } catch (err) {
      flash(errMsg(err), true);
    }
  };

  const releaseHold = async (ids) => {
    try {
      await Promise.all(ids.map((id) => inventoryApi.releaseAllocation(id)));
      flash('Allocation released');
      loadHolds();
      loadGrid();
      loadHistory();
    } catch (err) {
      flash(errMsg(err), true);
    }
  };

  const syncOtas = async () => {
    setSyncing(true);
    try {
      const res = await inventoryApi.pushChannels();
      const results = res?.results ?? [];
      if (!res?.pushed) {
        flash('No channel connections configured — add one on the Channel Manager page');
      } else {
        const ok = results.filter((r) => r.success).length;
        flash(`Availability pushed to ${ok}/${res.pushed} channels (${res.records} date rows)`);
      }
      loadGrid();
    } catch (err) {
      flash('OTA push failed: ' + errMsg(err), true);
    } finally {
      setSyncing(false);
    }
  };

  const exportCsv = (rows, name) => {
    const csv = rows
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = name;
    a.click();
  };

  const exportGrid = () => {
    if (!grid) return;
    const rows = [
      [
        'RoomType',
        'Code',
        'Date',
        'Status',
        'Total',
        'OOO',
        'Occupied',
        'Held',
        'Adjustment',
        'Sellable',
        'OverbookLimit',
        'Remaining',
        'StopSell',
        'CTA',
        'CTD',
      ],
    ];
    for (const rt of grid.roomTypes)
      for (const c of rt.cells)
        rows.push([
          rt.name,
          rt.code,
          c.date,
          STATUS[cellStatus(c)].label,
          c.total,
          c.ooo,
          c.occupied,
          c.held,
          c.adjustment,
          c.sellable,
          c.overbookingLimit,
          c.remaining,
          c.stopSell,
          c.closeToArrival,
          c.closeToDeparture,
        ]);
    exportCsv(rows, `inventory-${grid.property?.code ?? 'property'}-${from}_${to}.csv`);
  };

  const exportHistory = () => {
    exportCsv(
      [
        ['Time', 'Event', 'RoomType', 'Date', 'Rooms', 'Reason', 'User'],
        ...history.map((h) => [
          h.at,
          h.label,
          h.roomType ?? '',
          h.date ?? '',
          h.rooms ?? '',
          h.reason ?? '',
          h.user ? `${h.user.firstName ?? ''} ${h.user.lastName ?? ''}`.trim() || h.user.email : '',
        ]),
      ],
      `inventory-history-${today()}.csv`
    );
  };

  const shiftWindow = (n) => {
    setFrom(addDays(from, n));
    setTo(addDays(to, n));
  };

  const totals = grid?.totals;
  const occupancyPct =
    totals && totals.sellable > 0 ? Math.round((totals.occupied / totals.sellable) * 100) : 0;

  const kpis = [
    ['Total Rooms', totals?.physicalRooms ?? '—', BedDouble, 'text-slate-700 dark:text-slate-200'],
    [
      'Available',
      totals ? totals.sellable - totals.occupied : '—',
      CalendarDays,
      'text-emerald-600',
    ],
    ['Sellable', totals?.sellable ?? '—', TrendingUp, 'text-violet-600'],
    ['Occupancy', totals ? `${occupancyPct}%` : '—', Percent, 'text-indigo-600'],
    ['OOO', totals?.ooo ?? '—', Wrench, 'text-amber-600'],
    [
      'Overbooked',
      totals?.oversoldCells ?? '—',
      AlertTriangle,
      totals?.oversoldCells > 0 ? 'text-rose-600' : 'text-slate-400',
    ],
  ];

  const visibleRoomTypes = useMemo(
    () => (grid?.roomTypes ?? []).filter((rt) => !roomTypeFilter || rt.id === roomTypeFilter),
    [grid, roomTypeFilter]
  );
  const dates = grid?.roomTypes?.[0]?.cells?.map((c) => c.date) ?? [];

  const TABS = [
    ['grid', 'Availability Grid', LayoutGrid],
    ['allocations', 'Allocations', Lock],
    ['history', 'Adjustment History', History],
    ['overbook', 'Overbooking Rules', Settings2],
  ];

  return (
    <div className="p-6 space-y-5">
      {notice && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${notice.isErr ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}
        >
          {notice.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm opacity-60">
            {grid?.property?.name ?? 'Availability, allocations, and room status controls'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg border px-3 py-2 text-sm flex items-center gap-1"
            onClick={exportGrid}
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white flex items-center gap-1 disabled:opacity-50"
            onClick={syncOtas}
            disabled={syncing}
          >
            <Zap className="h-4 w-4" /> {syncing ? 'Syncing…' : 'Sync OTAs'}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(([label, value, Icon, color]) => (
          <div key={label} className="rounded-xl border p-4 flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
            </div>
            <Icon className="h-6 w-6 opacity-40" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        {TABS.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* ─── GRID TAB ─── */}
      {tab === 'grid' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="rounded-lg border px-2 py-2" onClick={() => shiftWindow(-14)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium px-2">
                {niceFull(from)} — {niceFull(to)}
              </span>
              <button className="rounded-lg border px-2 py-2" onClick={() => shiftWindow(14)}>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                className="text-sm text-blue-600 dark:text-blue-400 px-2"
                onClick={() => {
                  setFrom(today());
                  setTo(addDays(today(), 13));
                }}
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  className="rounded-lg border px-3 py-2 text-sm flex items-center gap-1"
                  onClick={() => setShowFilter((v) => !v)}
                >
                  <Filter className="h-4 w-4" /> Filter
                </button>
                {showFilter && (
                  <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border bg-white dark:bg-slate-900 p-3 space-y-2 shadow-lg">
                    <label className="text-xs font-medium opacity-70">Room type</label>
                    <select
                      className="w-full rounded-lg border px-2 py-1.5 bg-transparent text-sm"
                      value={roomTypeFilter}
                      onChange={(e) => setRoomTypeFilter(e.target.value)}
                    >
                      <option value="">All room types</option>
                      {(grid?.roomTypes ?? []).map((rt) => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button
                className="rounded-lg border px-3 py-2 text-sm flex items-center gap-1"
                onClick={() => setTab('overbook')}
              >
                <Settings2 className="h-4 w-4" /> Overbooking Rules
              </button>
              <button
                className="rounded-lg border px-3 py-2 text-sm flex items-center gap-1"
                onClick={loadGrid}
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white flex items-center gap-1"
                onClick={() => setShowHoldModal(true)}
              >
                <Lock className="h-4 w-4" /> New Allocation
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border px-4 py-2.5 text-xs">
            <span className="opacity-60 font-medium">Status:</span>
            {Object.entries(STATUS).map(([key, s]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="rounded-xl border p-10 text-center text-sm opacity-60">
              Loading grid…
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="sticky left-0 bg-inherit px-4 py-3 font-semibold min-w-[180px]">
                      Room Type / Date
                    </th>
                    {dates.map((d) => (
                      <th key={d} className="px-2 py-3 text-center font-semibold min-w-[72px]">
                        <div className="text-xs opacity-60">{weekday(d)}</div>
                        <div>{nice(d)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRoomTypes.map((rt) => (
                    <tr key={rt.id} className="border-b last:border-0">
                      <td className="sticky left-0 bg-inherit px-4 py-2">
                        <div className="font-semibold flex items-center gap-2">
                          <BedDouble className="h-4 w-4 opacity-40" /> {rt.name}
                        </div>
                        <div className="text-xs opacity-60">
                          {rt.totalRooms} total · OB +{rt.overbookingLimit}
                        </div>
                      </td>
                      {rt.cells.map((c) => {
                        const st = STATUS[cellStatus(c)];
                        return (
                          <td key={c.date} className={`px-1 py-1 text-center ${st.cell}`}>
                            <button
                              className="w-full rounded-lg py-2 hover:ring-2 hover:ring-blue-500"
                              onClick={() => setCell({ roomType: rt, cell: c })}
                              title={`${rt.name} ${c.date} — click to manage`}
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                                <span className="text-base font-bold">
                                  {c.stopSell ? '×' : c.remaining}
                                </span>
                              </div>
                              <div className="text-[10px] opacity-60">
                                {c.occupied}/{c.sellable}
                              </div>
                              <div className="flex justify-center gap-0.5 text-[9px] leading-none min-h-[10px]">
                                {c.ooo > 0 && <span className="opacity-70">OOO {c.ooo}</span>}
                                {c.held > 0 && <span className="opacity-70">H{c.held}</span>}
                                {c.adjustment !== 0 && (
                                  <span className="opacity-70">±{c.adjustment}</span>
                                )}
                                {c.stopSell && <Ban className="h-3 w-3" />}
                                {cellStatus(c) === 'critical' && (
                                  <span className="text-amber-600 font-medium">Low</span>
                                )}
                                {cellStatus(c) === 'soldout' && (
                                  <span className="font-medium">Full</span>
                                )}
                                {cellStatus(c) === 'overbooked' && (
                                  <span className="text-rose-600 font-medium">OB</span>
                                )}
                              </div>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {grid && visibleRoomTypes.length === 0 && (
                    <tr>
                      <td colSpan={dates.length + 1} className="px-4 py-10 text-center opacity-60">
                        No room types match the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ─── ALLOCATIONS TAB ─── */}
      {tab === 'allocations' && (
        <AllocationsTab
          holds={holds}
          holdFilter={holdFilter}
          setHoldFilter={setHoldFilter}
          onRelease={releaseHold}
        />
      )}

      {/* ─── HISTORY TAB ─── */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Adjustment History</h2>
              <p className="text-sm opacity-60">Recent inventory changes and maintenance events</p>
            </div>
            <button
              className="rounded-lg border px-3 py-2 text-sm flex items-center gap-1"
              onClick={exportHistory}
            >
              <Download className="h-4 w-4" /> Export Log
            </button>
          </div>
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Room Type</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-center">Rooms</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-xs opacity-70">
                      {new Date(h.at).toLocaleDateString('en-ZA')}{' '}
                      {new Date(h.at).toLocaleTimeString('en-ZA', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs border ${
                          h.label?.includes('released')
                            ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                            : h.label?.includes('hold') || h.label?.includes('Allocation')
                              ? 'border-violet-500/40 text-violet-600 dark:text-violet-400'
                              : h.label?.includes('Out of Order')
                                ? 'border-amber-500/40 text-amber-600 dark:text-amber-400'
                                : 'border-slate-500/40 opacity-80'
                        }`}
                      >
                        {h.label ?? h.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{h.roomType ?? '—'}</td>
                    <td className="px-4 py-3 text-xs opacity-70">{h.date ?? '—'}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {h.rooms == null ? '—' : h.rooms > 0 ? `+${h.rooms}` : h.rooms}
                    </td>
                    <td className="px-4 py-3 text-xs opacity-80">
                      {h.reason ?? h.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs opacity-70">
                      {h.user
                        ? `${h.user.firstName ?? ''} ${h.user.lastName ?? ''}`.trim() ||
                          h.user.email
                        : 'system'}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center opacity-60">
                      No inventory events yet — stop-sell, holds and adjustments will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── OVERBOOKING TAB ─── */}
      {tab === 'overbook' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Overbooking Rules</h2>
            <p className="text-sm opacity-60">
              Extra sellable units above physical inventory — honoured by the grid and by the
              booking-time check. Industry standard: 0–2% of stock, never on arrival-heavy dates
              without a walk plan.
            </p>
          </div>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 font-semibold">Room type</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Physical rooms</th>
                  <th className="px-4 py-3 font-semibold">Oversell limit</th>
                  <th className="px-4 py-3 font-semibold">Last changed</th>
                </tr>
              </thead>
              <tbody>
                {(overbook.length > 0
                  ? overbook
                  : (grid?.roomTypes ?? []).map((rt) => ({
                      roomTypeId: rt.id,
                      name: rt.name,
                      code: rt.code,
                      limit: rt.overbookingLimit,
                      updatedAt: null,
                    }))
                ).map((row) => (
                  <OverbookRow
                    key={row.roomTypeId}
                    row={row}
                    physical={
                      grid?.roomTypes?.find((r) => r.id === row.roomTypeId)?.totalRooms ?? '—'
                    }
                    onSave={saveOverbook}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {cell && (
        <CellModal
          roomType={cell.roomType}
          cell={cell.cell}
          onClose={() => setCell(null)}
          onSave={saveRestriction}
        />
      )}

      {showHoldModal && (
        <HoldModal
          roomTypes={grid?.roomTypes ?? []}
          defaultDate={from}
          onClose={() => setShowHoldModal(false)}
          onSave={async (body) => {
            try {
              await inventoryApi.createAllocation(body);
              flash('Allocation created');
              setShowHoldModal(false);
              loadGrid();
              if (tab === 'allocations') loadHolds();
              loadHistory();
            } catch (err) {
              flash(errMsg(err), true);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Allocations (grouped by dedupeKey = one row per block) ───

function AllocationsTab({ holds, holdFilter, setHoldFilter, onRelease }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const h of holds) {
      const key = h.dedupeKey || h.id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: h.name,
          type: h.type,
          roomTypeName: h.roomType?.name ?? '—',
          dates: [],
          blocked: 0,
          pickedUp: 0,
          status: h.status,
          ids: [],
        });
      }
      const g = map.get(key);
      g.dates.push(String(h.date).slice(0, 10));
      g.blocked += h.quantity;
      g.pickedUp += h.pickedUp ?? 0;
      g.ids.push(h.id);
      if (h.status === 'active') g.status = 'active';
    }
    return [...map.values()]
      .map((g) => {
        const sorted = [...g.dates].sort();
        return {
          ...g,
          from: sorted[0],
          to: sorted[sorted.length - 1],
          pct: g.blocked > 0 ? Math.min(100, Math.round((100 * g.pickedUp) / g.blocked)) : 0,
        };
      })
      .filter((g) => (holdFilter === '' ? true : g.status === holdFilter))
      .sort((a, b) => (a.from < b.from ? -1 : 1));
  }, [holds, holdFilter]);

  const typeLabel = (t) => HOLD_TYPES.find(([k]) => k === t)?.[1] ?? t;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Room Allocations</h2>
          <p className="text-sm opacity-60">
            Group blocks, OTA allotments, and held inventory — with live pickup
          </p>
        </div>
        <div className="flex gap-2">
          {['active', 'released', ''].map((v) => (
            <button
              key={v || 'all'}
              onClick={() => setHoldFilter(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${holdFilter === v ? 'bg-blue-600 text-white' : 'border'}`}
            >
              {v === '' ? 'All' : v}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-4 py-3 font-semibold">Allocation</th>
              <th className="px-4 py-3 font-semibold">Room Type</th>
              <th className="px-4 py-3 font-semibold">Dates</th>
              <th className="px-4 py-3 font-semibold text-center">Blocked</th>
              <th className="px-4 py-3 font-semibold">Picked Up</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 opacity-40" /> {g.name}
                  </div>
                  <div className="text-xs opacity-60">{typeLabel(g.type)}</div>
                </td>
                <td className="px-4 py-3">{g.roomTypeName}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap">
                  {g.from} → {g.to}
                </td>
                <td className="px-4 py-3 text-center font-semibold">{g.blocked}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-slate-500/15 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${g.pct >= 100 ? 'bg-emerald-500' : g.pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${g.pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-10">{g.pct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${g.status === 'active' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-500/10 opacity-60'}`}
                  >
                    {g.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {g.status === 'active' && (
                    <button
                      className="rounded-lg border px-3 py-1 text-xs"
                      onClick={() => onRelease(g.ids)}
                    >
                      Release
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center opacity-60">
                  No allocations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverbookRow({ row, physical, onSave }) {
  const [value, setValue] = useState(row.limit);
  useEffect(() => setValue(row.limit), [row.limit]);
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3 font-medium">{row.name}</td>
      <td className="px-4 py-3 opacity-60">{row.code}</td>
      <td className="px-4 py-3">{physical}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="50"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-20 rounded-lg border px-2 py-1 bg-transparent"
          />
          {value !== row.limit && (
            <button
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white"
              onClick={() => onSave(row.roomTypeId, value)}
            >
              Save
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-xs opacity-60">
        {row.updatedAt ? new Date(row.updatedAt).toLocaleString('en-ZA') : 'never'}
      </td>
    </tr>
  );
}

function CellModal({ roomType, cell, onClose, onSave }) {
  const [adjustment, setAdjustment] = useState(cell.adjustment);
  const [notes, setNotes] = useState(cell.notes ?? '');
  useEffect(() => {
    setAdjustment(cell.adjustment);
    setNotes(cell.notes ?? '');
  }, [cell]);
  const st = STATUS[cellStatus(cell)];
  const row = (label, value) => (
    <div className="flex justify-between py-1">
      <span className="opacity-60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-white dark:bg-slate-900 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{roomType.name}</h3>
            <p className="text-sm opacity-60">
              {roomType.code} · {cell.date} ·{' '}
              <span className={`inline-block h-2 w-2 rounded-full ${st.dot}`} /> {st.label}
            </p>
          </div>
          <button className="rounded-lg border px-2 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="rounded-xl border p-4 text-sm">
          {row('Physical rooms', cell.total)}
          {row('Out of order', cell.ooo)}
          {row('Occupied', cell.occupied)}
          {row('On hold', cell.held)}
          {row('Adjustment', cell.adjustment > 0 ? `+${cell.adjustment}` : cell.adjustment)}
          {row('Sellable', cell.sellable)}
          {row('Oversell allowance', `+${cell.overbookingLimit}`)}
          <div className="flex justify-between border-t mt-1 pt-2 font-bold">
            <span>Remaining</span>
            <span
              className={
                cell.oversold ? 'text-rose-500' : cell.remaining === 0 ? 'text-amber-500' : ''
              }
            >
              {cell.remaining}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <ToggleBtn
            active={cell.stopSell}
            onClick={() => onSave({ stopSell: !cell.stopSell })}
            label="Stop-sell"
            icon={<Ban className="h-4 w-4" />}
          />
          <ToggleBtn
            active={cell.closeToArrival}
            onClick={() => onSave({ closeToArrival: !cell.closeToArrival })}
            label="Close arrival"
          />
          <ToggleBtn
            active={cell.closeToDeparture}
            onClick={() => onSave({ closeToDeparture: !cell.closeToDeparture })}
            label="Close depart."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium opacity-70">
            Manual adjustment (units, -500…+500)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="-500"
              max="500"
              value={adjustment}
              onChange={(e) => setAdjustment(Number(e.target.value))}
              className="w-28 rounded-lg border px-3 py-2 bg-transparent"
            />
            <input
              placeholder="Reason (audit trail)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 rounded-lg border px-3 py-2 bg-transparent text-sm"
            />
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-40"
              disabled={adjustment === cell.adjustment}
              onClick={() => onSave({ adjustment, notes })}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleBtn({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium ${active ? 'bg-blue-600 text-white border-blue-600' : ''}`}
    >
      {icon}
      {label}
    </button>
  );
}

function HoldModal({ roomTypes, defaultDate, onClose, onSave }) {
  const [form, setForm] = useState({
    roomTypeId: roomTypes[0]?.id ?? '',
    type: 'group_hold',
    name: '',
    quantity: 1,
    date: defaultDate,
    endDate: '',
    notes: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border bg-white dark:bg-slate-900 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Lock className="h-5 w-5" /> New Allocation
          </h3>
          <button className="rounded-lg border px-2 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-medium opacity-70">Room type</span>
            <select
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
              value={form.roomTypeId}
              onChange={set('roomTypeId')}
            >
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} ({rt.code})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium opacity-70">Type</span>
            <select
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
              value={form.type}
              onChange={set('type')}
            >
              {HOLD_TYPES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium opacity-70">Quantity</span>
            <input
              type="number"
              min="1"
              max="500"
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
              value={form.quantity}
              onChange={set('quantity')}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium opacity-70">Date</span>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
              value={form.date}
              onChange={set('date')}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium opacity-70">Repeat until (optional)</span>
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
              value={form.endDate}
              onChange={set('endDate')}
            />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-medium opacity-70">Name</span>
            <input
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
              placeholder="e.g. TechConf 2026 group block"
              value={form.name}
              onChange={set('name')}
            />
          </label>
          <label className="col-span-2 space-y-1">
            <span className="text-xs font-medium opacity-70">Notes</span>
            <input
              className="w-full rounded-lg border px-3 py-2 bg-transparent"
              value={form.notes}
              onChange={set('notes')}
            />
          </label>
        </div>
        <button
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          disabled={!form.roomTypeId || !form.name.trim()}
          onClick={() =>
            onSave({
              ...form,
              quantity: Number(form.quantity),
              endDate: form.endDate || undefined,
              notes: form.notes || undefined,
            })
          }
        >
          Create allocation
        </button>
      </div>
    </div>
  );
}
