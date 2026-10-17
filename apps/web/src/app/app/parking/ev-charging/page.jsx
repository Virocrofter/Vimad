/* apps/web/src/app/app/parking/ev-charging/page.jsx — T4 EV bay board */
import { useCallback, useEffect, useState } from 'react';
import { Zap, RefreshCw, CircleAlert } from 'lucide-react';
import { fetchBays, setCharging, CHARGING_STYLE } from '../../../../api/parking';

const CHARGING_LABEL = { free: 'Free', charging: 'Charging', full: 'Charged' };

export default function EvChargingPage() {
  const [bays, setBays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBays(await fetchBays({ zone: 'ev' }));
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

  const setStatus = async (bay, status) => {
    setBusyId(bay.id);
    setError('');
    try {
      await setCharging(bay.id, status);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const charging = bays.filter((b) => b.chargingStatus === 'charging').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">EV charging</h1>
          <p className="text-sm text-text-muted">
            {bays.length} EV bay{bays.length === 1 ? '' : 's'} · {charging} currently charging.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          <CircleAlert size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-text-muted">Loading EV bays…</div>
      ) : bays.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-text-muted">
          <Zap size={28} className="mx-auto mb-2 text-info" />
          No EV bays yet. Add one in Parking → Spots and tick “EV charger”.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bays.map((bay) => {
            const a = bay.current;
            return (
              <div key={bay.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono font-semibold text-text-primary">
                    <Zap size={16} className="text-info" /> {bay.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CHARGING_STYLE[bay.chargingStatus]}`}
                  >
                    {CHARGING_LABEL[bay.chargingStatus] ?? bay.chargingStatus}
                  </span>
                </div>

                <div className="mt-2 text-xs text-text-secondary">
                  {a ? (
                    <>
                      <span className="font-mono text-text-primary">
                        {a.plateAtCheckin ?? a.vehicle.plate}
                      </span>
                      {' · '}
                      {a.vehicle.guest.firstName} {a.vehicle.guest.lastName}
                    </>
                  ) : (
                    <span className="text-text-muted">No vehicle</span>
                  )}
                </div>

                <div className="mt-3 flex gap-1">
                  {Object.keys(CHARGING_LABEL).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(bay, s)}
                      disabled={busyId === bay.id || bay.chargingStatus === s}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium disabled:opacity-40 ${
                        bay.chargingStatus === s
                          ? 'bg-primary/10 text-primary'
                          : 'border border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {CHARGING_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
