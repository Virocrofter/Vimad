/* apps/web/src/app/app/parking/page.jsx — T4 Parking board
 * Bay map for the day: live occupancy, arrivals with a vehicle on file
 * auto-assigned to bays, plate captured at check-in, valet overflow.
 */
import { NavLink } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Car,
  RefreshCw,
  Zap,
  Accessibility,
  KeyRound,
  Wrench,
  CircleAlert,
  LogIn,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import {
  fetchBoard,
  runAutoAssign,
  checkInAssignment,
  checkOutAssignment,
  cancelAssignment,
  ZONES,
  BAY_STATUS_STYLE,
  CHARGING_STYLE,
} from '../../../api/parking';

const ZONE_ICON = { standard: Car, accessible: Accessibility, ev: Zap, valet: KeyRound };

const PARKING_TABS = [
  { to: '/app/parking', end: true, label: 'Board' },
  { to: '/app/parking/spots', label: 'Bay map' },
  { to: '/app/parking/vehicles', label: 'Vehicles' },
  { to: '/app/parking/valet', label: 'Valet' },
  { to: '/app/parking/ev-charging', label: 'EV charging' },
];

function ParkingTabs() {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-surface-elevated p-1">
      {PARKING_TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors ${
              isActive ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}

const todayStr = () => new Date().toISOString().slice(0, 10);

function PlateDialog({ bay, onConfirm, onClose }) {
  const [plate, setPlate] = useState(bay.assignment?.vehicle?.plate ?? '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-5">
        <h3 className="text-lg font-semibold text-text-primary">Check in — bay {bay.label}</h3>
        <p className="mt-1 text-sm text-text-muted">
          {bay.assignment?.vehicle?.guest?.firstName} {bay.assignment?.vehicle?.guest?.lastName} ·{' '}
          {bay.assignment?.vehicle?.make} {bay.assignment?.vehicle?.model}
        </p>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-text-muted">
          Plate at the gate
        </label>
        <input
          autoFocus
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm font-mono uppercase text-text-primary"
          placeholder="ND 123 456"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(plate.trim())}
            disabled={!plate.trim()}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Confirm check-in
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ParkingBoardPage() {
  const [date, setDate] = useState(todayStr());
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [plateBay, setPlateBay] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBoard(await fetchBoard(date));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);
  // light polling — the gate view stays fresh
  useEffect(() => {
    const t = setInterval(() => load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  const autoAssign = async () => {
    setBusy(true);
    setNotice('');
    try {
      const r = await runAutoAssign({ date });
      setNotice(
        `Assigned ${r.assigned}${r.valet ? ` (+${r.valet} valet overflow)` : ''}` +
          `${r.activated ? ` · activated ${r.activated}` : ''}` +
          `${r.skipped ? ` · ${r.skipped} skipped (no free bays)` : ''}`
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const act = async (id, fn) => {
    setBusyId(id);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const groups = useMemo(() => {
    if (!board) return [];
    return ZONES.map((z) => ({
      ...z,
      bays: board.bays.filter((b) => b.zone === z.value),
    })).filter((g) => g.bays.length > 0);
  }, [board]);

  const stats = board?.stats;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Parking board</h1>
          <p className="text-sm text-text-muted">
            Bay map · plates captured at check-in · arrivals with a vehicle on file auto-assign.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={autoAssign}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Sparkles size={16} /> {busy ? 'Assigning…' : 'Auto-assign arrivals'}
          </button>
        </div>
      </div>

      <ParkingTabs />

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          <CircleAlert size={16} /> {error}
        </div>
      )}
      {notice && (
        <div className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">{notice}</div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {[
            ['Total bays', stats.total, ''],
            ['Available', stats.available, 'text-success'],
            ['Reserved', stats.reserved, 'text-warning'],
            ['Occupied', stats.occupied, 'text-primary'],
            ['Out of service', stats.outOfService, 'text-danger'],
            ['EV charging', stats.evCharging, 'text-info'],
            ['Valet on hand', stats.valetQueue, 'text-text-secondary'],
            [
              'Unassigned arrivals',
              stats.unassignedArrivals,
              stats.unassignedArrivals > 0 ? 'text-danger' : '',
            ],
          ].map(([label, value, cls]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-3">
              <div className={`text-2xl font-bold ${cls || 'text-text-primary'}`}>{value}</div>
              <div className="text-xs text-text-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Unassigned arrivals */}
      {board && board.unassigned.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              Arrivals with a vehicle — no bay ({board.unassigned.length})
            </h2>
            <button
              onClick={autoAssign}
              disabled={busy}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Auto-assign now
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {board.unassigned.map((u) => (
              <span
                key={`${u.reservation.id}:${u.vehicle.id}`}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary"
              >
                <span className="font-medium text-text-primary">
                  {u.guest.firstName} {u.guest.lastName}
                </span>{' '}
                · {u.vehicle.plate} · {u.reservation.confirmationNumber}
                {u.vehicle.isElectric && <Zap size={12} className="ml-1 inline text-info" />}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bay map by zone */}
      {loading && !board ? (
        <div className="text-sm text-text-muted">Loading bay map…</div>
      ) : (
        groups.map((g) => {
          const Icon = ZONE_ICON[g.value] ?? Car;
          return (
            <section key={g.value}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Icon size={16} className="text-text-muted" /> {g.label}
                <span className="text-xs font-normal text-text-muted">
                  {g.bays.filter((b) => b.status === 'available').length}/{g.bays.length} free
                </span>
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {g.bays.map((bay) => {
                  const a = bay.assignment;
                  const gName = a ? `${a.vehicle.guest.firstName} ${a.vehicle.guest.lastName}` : '';
                  return (
                    <div
                      key={bay.id}
                      className={`rounded-xl border p-3 ${
                        bay.status === 'out_of_service'
                          ? 'border-danger/30 bg-danger/5 opacity-70'
                          : 'border-border bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-text-primary">
                          {bay.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BAY_STATUS_STYLE[bay.status]}`}
                        >
                          {bay.status.replace('_', ' ')}
                        </span>
                      </div>

                      {bay.evCharger && (
                        <div className="mt-1 flex items-center gap-1">
                          <Zap size={12} className="text-info" />
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CHARGING_STYLE[bay.chargingStatus]}`}
                          >
                            {bay.chargingStatus}
                          </span>
                        </div>
                      )}

                      {a ? (
                        <div className="mt-2 text-xs text-text-secondary">
                          <div className="font-medium text-text-primary">{gName}</div>
                          <div className="font-mono">{a.plateAtCheckin ?? a.vehicle.plate}</div>
                          <div>
                            {a.vehicle.make} {a.vehicle.model}
                          </div>
                          {bay.reservation && (
                            <div className="mt-0.5 text-text-muted">
                              {bay.reservation.confirmationNumber}
                            </div>
                          )}
                          {a.valet && (
                            <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                              <KeyRound size={11} /> valet
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-text-muted">
                          {bay.status === 'out_of_service' ? (
                            <span className="inline-flex items-center gap-1">
                              <Wrench size={12} /> Out of service
                            </span>
                          ) : (
                            'Free'
                          )}
                        </div>
                      )}

                      {a && (
                        <div className="mt-2 flex gap-1">
                          {a.status === 'scheduled' && (
                            <button
                              onClick={() => setPlateBay(bay)}
                              disabled={busyId === a.id}
                              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                            >
                              <LogIn size={12} /> Check in
                            </button>
                          )}
                          {a.status === 'active' && (
                            <button
                              onClick={() => act(a.id, () => checkOutAssignment(a.id))}
                              disabled={busyId === a.id}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary disabled:opacity-50"
                            >
                              <LogOut size={12} /> Check out
                            </button>
                          )}
                          {a.status === 'scheduled' && (
                            <button
                              onClick={() => act(a.id, () => cancelAssignment(a.id))}
                              disabled={busyId === a.id}
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-danger disabled:opacity-50"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {plateBay && (
        <PlateDialog
          bay={plateBay}
          onClose={() => setPlateBay(null)}
          onConfirm={async (plate) => {
            const id = plateBay.assignment.id;
            setPlateBay(null);
            await act(id, () => checkInAssignment(id, plate));
          }}
        />
      )}
    </div>
  );
}
