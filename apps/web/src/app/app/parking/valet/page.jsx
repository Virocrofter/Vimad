/* apps/web/src/app/app/parking/valet/page.jsx — T4 valet queue */
import { useCallback, useEffect, useState } from 'react';
import { KeyRound, LogOut, Save, CircleAlert } from 'lucide-react';
import { fetchValetQueue, updateAssignment, checkOutAssignment } from '../../../../api/parking';

export default function ParkingValetPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [draft, setDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQueue(await fetchValetQueue());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const t = setInterval(() => load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  const save = async (a) => {
    setBusyId(a.id);
    setError('');
    try {
      await updateAssignment(a.id, {
        valetInstructions: draft[`${a.id}-instructions`] ?? a.valetInstructions,
        valetKeyLocation: draft[`${a.id}-key`] ?? a.valetKeyLocation,
      });
      setDraft((d) => {
        const next = { ...d };
        delete next[`${a.id}-instructions`];
        delete next[`${a.id}-key`];
        return next;
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const checkOut = async (a) => {
    setBusyId(a.id);
    setError('');
    try {
      await checkOutAssignment(a.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Valet queue</h1>
        <p className="text-sm text-text-muted">
          Cars on valet — instructions and key location travel with the assignment.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          <CircleAlert size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-text-muted">Loading valet queue…</div>
      ) : queue.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-text-muted">
          <KeyRound size={28} className="mx-auto mb-2 text-text-muted" />
          No cars on valet right now. Valet assignments appear when auto-assign overflows to the
          valet zone, or when front desk flags an assignment as valet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {queue.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-lg font-semibold text-text-primary">
                    {a.plateAtCheckin ?? a.vehicle.plate}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {a.vehicle.guest.firstName} {a.vehicle.guest.lastName} · {a.vehicle.make}{' '}
                    {a.vehicle.model}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${a.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}
                >
                  {a.status}
                </span>
              </div>

              <div className="mt-3 text-xs text-text-muted">
                Bay <span className="font-mono text-text-secondary">{a.bay?.label ?? '—'}</span> ·
                scheduled for{' '}
                <span className="text-text-secondary">{a.scheduledFor?.slice?.(0, 10)}</span>
              </div>

              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-text-muted">
                Instructions
              </label>
              <textarea
                rows={2}
                value={draft[`${a.id}-instructions`] ?? a.valetInstructions ?? ''}
                onChange={(e) => setDraft({ ...draft, [`${a.id}-instructions`]: e.target.value })}
                placeholder="e.g. Child seat in the boot — handle with care"
                className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
              />

              <label className="mt-2 block text-xs font-medium uppercase tracking-wide text-text-muted">
                Key location
              </label>
              <input
                value={draft[`${a.id}-key`] ?? a.valetKeyLocation ?? ''}
                onChange={(e) => setDraft({ ...draft, [`${a.id}-key`]: e.target.value })}
                placeholder="e.g. Key box 4 / Front desk hook 12"
                className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
              />

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => save(a)}
                  disabled={busyId === a.id}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary disabled:opacity-50"
                >
                  <Save size={13} /> Save
                </button>
                {a.status === 'active' && (
                  <button
                    onClick={() => checkOut(a)}
                    disabled={busyId === a.id}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    <LogOut size={13} /> Return car
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
