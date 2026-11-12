/* apps/web/src/app/app/rates/RateGridManager.jsx
 * E1x — day-of-week + seasonal rate grids.
 * API: POST /v1/rates/day-of-week | /seasonal (both rate_plan:update guarded).
 * DOW applies only after evaluation (P3-C pinned); this UI runs evaluate
 * over a 1-year window after creating a DOW grid so the grid is live
 * immediately. Seasonal materializes server-side at creation.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Percent } from 'lucide-react';
import { listRatePlans, createDayOfWeekGrid, createSeasonalGrid } from '../../../api/rates-api';
import { listRoomTypes } from '../../../api/room-types';
import { apiPost } from '../../../api/client';
import { usePermission } from '../../../hooks/usePermissions';

const DOW = [
  { n: 1, label: 'Mon' },
  { n: 2, label: 'Tue' },
  { n: 3, label: 'Wed' },
  { n: 4, label: 'Thu' },
  { n: 5, label: 'Fri' },
  { n: 6, label: 'Sat' },
  { n: 0, label: 'Sun' },
];
const iso = (d) => d.toISOString().slice(0, 10);

export default function RateGridManager() {
  const canEdit = usePermission('rate_plan', 'update');
  const qc = useQueryClient();
  const { data: roomsData } = useQuery({
    queryKey: ['room-types'],
    queryFn: () => listRoomTypes(),
  });
  const { data: plansData } = useQuery({
    queryKey: ['rate-plans'],
    queryFn: () => listRatePlans(),
  });
  const rooms = roomsData ?? [];
  const plans = plansData ?? [];

  const [roomTypeId, setRoomTypeId] = useState('');
  const [ratePlanId, setRatePlanId] = useState('');
  const [dowName, setDowName] = useState('');
  const [days, setDays] = useState([]);
  const [pct, setPct] = useState(10);
  const [seName, setSeName] = useState('');
  const [start, setStart] = useState(iso(new Date()));
  const [end, setEnd] = useState(iso(new Date(Date.now() + 6 * 86400_000)));
  const [seRate, setSeRate] = useState('');
  const [msg, setMsg] = useState(null);

  const propId = rooms.find((r) => r.id === roomTypeId)?.propertyId;

  const runEvaluate = async (from, to) => {
    if (!propId) return;
    await apiPost('/v1/rates/rules/evaluate?propertyId=' + propId, { from, to });
  };

  const toggleDay = (n) =>
    setDays((d) => (d.includes(n) ? d.filter((x) => x !== n) : [...d, n].sort()));

  const submitDow = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await createDayOfWeekGrid({
        name: dowName,
        roomTypeId,
        ratePlanId,
        daysOfWeek: days,
        adjustmentPercent: Number(pct),
      });
      await runEvaluate(iso(new Date()), iso(new Date(Date.now() + 365 * 86400_000)));
      setMsg({ ok: true, text: 'Day-of-week grid created and evaluated (live immediately).' });
    } catch (err) {
      setMsg({ ok: false, text: err?.message ?? 'Failed to create grid' });
    }
  };

  const submitSeasonal = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await createSeasonalGrid({
        name: seName,
        roomTypeId,
        ratePlanId,
        startDate: start,
        endDate: end,
        rate: Number(seRate),
      });
      qc.invalidateQueries({ queryKey: ['availability'] });
      setMsg({ ok: true, text: 'Seasonal grid created — rates live on the calendar now.' });
    } catch (err) {
      setMsg({ ok: false, text: err?.message ?? 'Failed to create grid' });
    }
  };

  const selectCls =
    'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary';
  const inputCls = selectCls;

  return (
    <div className="px-4 py-4 space-y-6">
      {!canEdit && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          You need the rate_plan:update permission to create grids — view only.
        </p>
      )}
      {msg && (
        <p
          className={`text-sm rounded-lg px-3 py-2 border ${
            msg.ok
              ? 'text-teal-800 bg-teal-50 border-teal-200'
              : 'text-red-700 bg-red-50 border-red-200'
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={submitDow}
          className="space-y-4 rounded-xl border border-border bg-surface p-5"
        >
          <h3 className="flex items-center gap-2 font-semibold text-text-primary">
            <Percent className="h-4 w-4" /> Day-of-Week Grid
          </h3>
          <input
            className={inputCls}
            placeholder="Grid name (e.g. Weekend +10%)"
            value={dowName}
            onChange={(e) => setDowName(e.target.value)}
            required
          />
          <div className="flex flex-wrap gap-1.5">
            {DOW.map((d) => (
              <button
                type="button"
                key={d.n}
                onClick={() => canEdit && toggleDay(d.n)}
                className={`px-3 py-1.5 text-xs rounded-full border ${
                  days.includes(d.n)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <label className="block text-sm text-text-secondary">
            Adjustment %
            <input
              type="number"
              min="-90"
              max="500"
              className={inputCls + ' mt-1'}
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              required
            />
          </label>
          <SubmitRow canEdit={canEdit} label="Create + Evaluate" />
        </form>

        <form
          onSubmit={submitSeasonal}
          className="space-y-4 rounded-xl border border-border bg-surface p-5"
        >
          <h3 className="flex items-center gap-2 font-semibold text-text-primary">
            <LayoutGrid className="h-4 w-4" /> Seasonal Grid
          </h3>
          <input
            className={inputCls}
            placeholder="Grid name (e.g. High Season)"
            value={seName}
            onChange={(e) => setSeName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-text-secondary">
              Start
              <input
                type="date"
                className={inputCls + ' mt-1'}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm text-text-secondary">
              End
              <input
                type="date"
                className={inputCls + ' mt-1'}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="block text-sm text-text-secondary">
            Nightly rate (absolute)
            <input
              type="number"
              min="1"
              step="0.01"
              className={inputCls + ' mt-1'}
              value={seRate}
              onChange={(e) => setSeRate(e.target.value)}
              required
            />
          </label>
          <SubmitRow canEdit={canEdit} label="Create Seasonal Grid" />
        </form>
      </div>

      <ScopePicker
        rooms={rooms}
        plans={plans}
        roomTypeId={roomTypeId}
        setRoomTypeId={setRoomTypeId}
        ratePlanId={ratePlanId}
        setRatePlanId={setRatePlanId}
        selectCls={selectCls}
      />
    </div>
  );
}

function SubmitRow({ canEdit, label }) {
  return (
    <button
      type="submit"
      disabled={!canEdit}
      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function ScopePicker({
  rooms,
  plans,
  roomTypeId,
  setRoomTypeId,
  ratePlanId,
  setRatePlanId,
  selectCls,
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
      <h3 className="font-semibold text-text-primary">Scope (applies to both grids above)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          className={selectCls}
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value)}
          required
        >
          <option value="">Room type…</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          className={selectCls}
          value={ratePlanId}
          onChange={(e) => setRatePlanId(e.target.value)}
          required
        >
          <option value="">Rate plan…</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
