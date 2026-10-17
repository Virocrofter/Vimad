/* src/app/app/parking/spots/page.jsx — T4 bay management, fully wired */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Car,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  X,
  Sparkles,
  Zap,
  Wrench,
  KeyRound,
  CircleAlert,
  Loader2,
} from 'lucide-react';
import {
  fetchBoard,
  createBay,
  updateBay,
  deleteBay,
  createAssignment,
  checkInAssignment,
  checkOutAssignment,
  cancelAssignment,
} from '../../../../api/parking';
import { usePropertyStore } from '../../../../stores/propertyStore';

const ZONES = [
  { value: 'standard', label: 'Standard', icon: Car },
  { value: 'accessible', label: 'Accessible', icon: Car },
  { value: 'ev', label: 'EV charging', icon: Zap },
  { value: 'valet', label: 'Valet', icon: KeyRound },
];

const BAY_STATUS_STYLE = {
  available: 'bg-success/10 text-success',
  occupied: 'bg-primary/10 text-primary',
  reserved: 'bg-warning/10 text-warning',
  out_of_service: 'bg-danger/10 text-danger',
};

const inputCls =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ─── Add / edit bay modal ─── */
function BayModal({ bay, onClose, onSaved, propertyId }) {
  const isEdit = !!bay;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: bay?.label || '',
    zone: bay?.zone || 'standard',
    evCharger: bay?.evCharger ?? false,
    status: bay?.status || 'available',
    chargingStatus: bay?.chargingStatus || 'free',
    notes: bay?.notes || '',
  });
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await updateBay(bay.id, {
          zone: form.zone,
          status: form.status,
          evCharger: form.evCharger,
          ...(form.evCharger ? { chargingStatus: form.chargingStatus } : {}),
          notes: form.notes || null,
        });
      } else {
        await createBay({
          propertyId: propertyId || undefined,
          label: form.label.trim(),
          zone: form.zone,
          evCharger: form.evCharger,
          notes: form.notes || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold text-text-primary">
          {isEdit ? `Edit bay ${bay.label}` : 'New bay'}
        </h3>
        <div className="space-y-3">
          {!isEdit && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                Label
              </span>
              <input
                className={inputCls}
                placeholder="A-13"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                Zone
              </span>
              <select
                className={inputCls}
                value={form.zone}
                onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
              >
                {ZONES.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </label>
            {isEdit && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                  Status
                </span>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="available">Available</option>
                  <option value="out_of_service">Out of service</option>
                </select>
              </label>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={form.evCharger}
              onChange={(e) => setForm((f) => ({ ...f, evCharger: e.target.checked }))}
            />
            EV charger installed
          </label>
          {form.evCharger && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
                Charging status
              </span>
              <select
                className={inputCls}
                value={form.chargingStatus}
                onChange={(e) => setForm((f) => ({ ...f, chargingStatus: e.target.value }))}
              >
                <option value="free">Free</option>
                <option value="charging">Charging</option>
                <option value="full">Full</option>
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Notes
            </span>
            <input
              className={inputCls}
              placeholder="e.g. tight corner, near lift"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          {error && (
            <p className="flex items-center gap-1 text-sm text-danger">
              <CircleAlert size={14} /> {error}
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || (!isEdit && !form.label.trim())}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}{' '}
            {isEdit ? 'Save changes' : 'Create bay'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Assign a vehicle to a bay ─── */
function AssignModal({ bay, unassigned, date, onClose, onSaved }) {
  const [vehicleKey, setVehicleKey] = useState('');
  const [valet, setValet] = useState(bay.zone === 'valet');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!vehicleKey) return;
    const picked = unassigned.find((u) => `${u.vehicle.id}` === vehicleKey);
    if (!picked) return;
    setSaving(true);
    setError('');
    try {
      await createAssignment({
        bayId: bay.id,
        vehicleId: picked.vehicle.id,
        scheduledFor: date,
        valet: valet || undefined,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-bold text-text-primary">Assign bay {bay.label}</h3>
        <p className="mb-4 text-xs text-text-muted">
          Arrivals with a vehicle on file, not yet parked.
        </p>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Vehicle / guest
            </span>
            <select
              className={inputCls}
              value={vehicleKey}
              onChange={(e) => setVehicleKey(e.target.value)}
            >
              <option value="">— select —</option>
              {unassigned.map((u) => (
                <option key={u.vehicle.id} value={u.vehicle.id}>
                  {u.vehicle.plate} · {u.vehicle.make} {u.vehicle.model} · {u.guest.firstName}{' '}
                  {u.guest.lastName} ({u.reservation.confirmationNumber})
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={valet} onChange={(e) => setValet(e.target.checked)} />{' '}
            Valet service
          </label>
          {unassigned.length === 0 && (
            <p className="text-sm text-text-muted">
              No unassigned arrivals with a vehicle on file. Create a vehicle first (Vehicles tab).
            </p>
          )}
          {error && (
            <p className="flex items-center gap-1 text-sm text-danger">
              <CircleAlert size={14} /> {error}
            </p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !vehicleKey}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />} Assign
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function ParkingSpotsPage() {
  const propertyId = usePropertyStore((s) => s.currentPropertyId);
  const [date, setDate] = useState(todayStr());
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [bayModal, setBayModal] = useState(null); // null | {} | {bay}
  const [assignBay, setAssignBay] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchBoard(date);
      setBoard(data);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [date, propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, fn, okMsg) => {
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      await fn();
      if (okMsg) setNotice(okMsg);
      await load();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusyId(null);
    }
  };

  const groups = useMemo(() => {
    if (!board) return [];
    return ZONES.map((z) => ({ ...z, bays: board.bays.filter((b) => b.zone === z.value) })).filter(
      (g) => g.bays.length > 0
    );
  }, [board]);

  const stats = board?.stats;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bay map</h1>
          <p className="text-sm text-text-muted">
            Add, edit and retire bays · manually assign arrivals to bays.
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
            onClick={() => setBayModal({})}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
          >
            <Plus size={16} /> New bay
          </button>
        </div>
      </div>

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

      {loading && !board ? (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading bay map…
        </div>
      ) : (
        groups.map((g) => {
          const Icon = g.icon ?? Car;
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
                  const occupied = bay.status === 'occupied' || !!a;
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
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BAY_STATUS_STYLE[occupied ? 'occupied' : bay.status]}`}
                        >
                          {occupied ? 'occupied' : bay.status.replace('_', ' ')}
                        </span>
                      </div>

                      {bay.evCharger && (
                        <div className="mt-1 flex items-center gap-1">
                          <Zap size={12} className="text-info" />
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BAY_STATUS_STYLE.available}`}
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
                          ) : bay.notes ? (
                            bay.notes
                          ) : (
                            'Free'
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1">
                        {a?.status === 'scheduled' && (
                          <button
                            onClick={() =>
                              act(
                                a.id,
                                () => checkInAssignment(a.id),
                                `Checked in ${a.vehicle.plate} → ${bay.label}`
                              )
                            }
                            disabled={busyId === a.id}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                          >
                            <LogIn size={12} /> Check in
                          </button>
                        )}
                        {a?.status === 'active' && (
                          <button
                            onClick={() =>
                              act(
                                a.id,
                                () => checkOutAssignment(a.id),
                                `Checked out ${a.vehicle.plate}`
                              )
                            }
                            disabled={busyId === a.id}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary disabled:opacity-50"
                          >
                            <LogOut size={12} /> Check out
                          </button>
                        )}
                        {a?.status === 'scheduled' && (
                          <button
                            onClick={() => act(a.id, () => cancelAssignment(a.id))}
                            disabled={busyId === a.id}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-danger disabled:opacity-50"
                          >
                            <X size={12} />
                          </button>
                        )}
                        {!a && bay.status !== 'out_of_service' && (
                          <button
                            onClick={() => setAssignBay(bay)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary"
                          >
                            <Sparkles size={12} /> Assign
                          </button>
                        )}
                        <button
                          onClick={() => setBayModal({ bay })}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-text-secondary hover:text-text-primary"
                        >
                          <Edit3 size={12} />
                        </button>
                        {!a && (
                          <button
                            onClick={() =>
                              act(bay.id, () => deleteBay(bay.id), `Bay ${bay.label} deleted`)
                            }
                            disabled={busyId === bay.id}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-danger disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {bayModal && (
        <BayModal
          bay={bayModal.bay}
          propertyId={propertyId}
          onClose={() => setBayModal(null)}
          onSaved={() => {
            setNotice('Bay saved');
            load();
          }}
        />
      )}

      {assignBay && board && (
        <AssignModal
          bay={assignBay}
          unassigned={board.unassigned}
          date={date}
          onClose={() => setAssignBay(null)}
          onSaved={() => {
            setNotice(`Assigned to bay ${assignBay.label}`);
            load();
          }}
        />
      )}
    </div>
  );
}
