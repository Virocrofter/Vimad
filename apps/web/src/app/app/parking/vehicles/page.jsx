/* apps/web/src/app/app/parking/vehicles/page.jsx — T4 guest vehicle registry */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Star, Zap, CircleAlert } from 'lucide-react';
import {
  fetchVehicles,
  createVehicle,
  updateVehicle,
  deactivateVehicle,
  fetchGuests,
} from '../../../../api/parking';

export default function ParkingVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [guests, setGuests] = useState([]);
  const [plateFilter, setPlateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    guestId: '',
    plate: '',
    make: '',
    model: '',
    color: '',
    isElectric: false,
    isPrimary: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [vs, gs] = await Promise.all([fetchVehicles({ includeInactive: true }), fetchGuests()]);
      setVehicles(vs);
      setGuests(gs?.data ?? gs ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => vehicles.filter((v) => v.plate.toLowerCase().includes(plateFilter.toLowerCase())),
    [vehicles, plateFilter]
  );

  const add = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createVehicle(form);
      setForm({
        guestId: '',
        plate: '',
        make: '',
        model: '',
        color: '',
        isElectric: false,
        isPrimary: false,
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id, p) => {
    setError('');
    try {
      await updateVehicle(id, p);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deactivate = async (id) => {
    setError('');
    try {
      await deactivateVehicle(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Vehicles</h1>
        <p className="text-sm text-text-muted">
          Guest vehicle registry — plates are captured at check-in and used for auto bay assignment.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          <CircleAlert size={16} /> {error}
        </div>
      )}

      {/* Add vehicle */}
      <form
        onSubmit={add}
        className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-4 lg:grid-cols-8"
      >
        <select
          required
          value={form.guestId}
          onChange={(e) => setForm({ ...form, guestId: e.target.value })}
          className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
        >
          <option value="">Guest…</option>
          {guests.map((g) => (
            <option key={g.id} value={g.id}>
              {g.firstName} {g.lastName}
            </option>
          ))}
        </select>
        <input
          required
          value={form.plate}
          onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
          placeholder="PLATE"
          className="rounded-md border border-border bg-surface-elevated px-3 py-2 font-mono text-sm uppercase text-text-primary"
        />
        <input
          value={form.make}
          onChange={(e) => setForm({ ...form, make: e.target.value })}
          placeholder="Make"
          className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
        />
        <input
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          placeholder="Model"
          className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
        />
        <input
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          placeholder="Color"
          className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
        />
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={form.isElectric}
            onChange={(e) => setForm({ ...form, isElectric: e.target.checked })}
          />
          <Zap size={14} className="text-info" /> EV
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
          />
          <Star size={14} /> Primary
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {/* Filter */}
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={plateFilter}
          onChange={(e) => setPlateFilter(e.target.value)}
          placeholder="Filter by plate…"
          className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text-primary"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-text-muted">Loading vehicles…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Plate</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Flags</th>
                <th className="px-4 py-3">Parked at</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className={`border-b border-border last:border-0 ${v.active ? '' : 'opacity-50'}`}
                >
                  <td className="px-4 py-3 font-mono font-medium text-text-primary">{v.plate}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {[v.color, v.make, v.model].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {v.guest.firstName} {v.guest.lastName}
                  </td>
                  <td className="px-4 py-3">
                    {v.isElectric && <Zap size={14} className="mr-1 inline text-info" />}
                    {v.isPrimary && <Star size={14} className="mr-1 inline text-warning" />}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {v.assignments?.[0]?.bay?.label ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${v.active ? 'bg-success/10 text-success' : 'bg-surface-elevated text-text-secondary'}`}
                    >
                      {v.active ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      {!v.isPrimary && v.active && (
                        <button
                          onClick={() => patch(v.id, { isPrimary: true })}
                          className="rounded-md border border-border px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
                        >
                          Make primary
                        </button>
                      )}
                      <button
                        onClick={() => patch(v.id, { active: !v.active })}
                        className="rounded-md border border-border px-2 py-1 text-xs text-text-secondary hover:text-text-primary"
                      >
                        {v.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => deactivate(v.id)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-danger hover:bg-surface-elevated"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted">
                    No vehicles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
