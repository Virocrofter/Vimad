import { useEffect, useState } from 'react';
import {
  ReportDefinition,
  ScheduledReportItem,
  createSchedule,
  deleteSchedule,
  getDefinitions,
  getSchedules,
  updateSchedule,
} from '../../../api/reports';

const FREQ_LABEL: Record<string, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ReportScheduler({ refreshKey }: { refreshKey: number }) {
  const [defs, setDefs] = useState<ReportDefinition[]>([]);
  const [items, setItems] = useState<ScheduledReportItem[]>([]);
  const [form, setForm] = useState({
    definitionKey: '',
    name: '',
    frequency: 'DAILY',
    timeOfDay: '06:00',
    dayOfWeek: 1,
    dayOfMonth: 1,
    recipients: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    getSchedules()
      .then(setItems)
      .catch(() => setItems([]));
  useEffect(() => {
    getDefinitions()
      .then((d) => {
        setDefs(d);
        setForm((f) => ({ ...f, definitionKey: d[0]?.key ?? '' }));
      })
      .catch(() => setDefs([]));
  }, []);
  useEffect(() => {
    load();
  }, [refreshKey]);

  const defName = (k: string) => defs.find((d) => d.key === k)?.name ?? k;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const dateFrom = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      const dateTo = new Date().toISOString().slice(0, 10);
      await createSchedule({
        definitionKey: form.definitionKey,
        name: form.name || `${defName(form.definitionKey)} (${FREQ_LABEL[form.frequency]})`,
        params: { dateFrom, dateTo },
        frequency: form.frequency,
        dayOfWeek: form.frequency === 'WEEKLY' ? form.dayOfWeek : undefined,
        dayOfMonth: form.frequency === 'MONTHLY' ? form.dayOfMonth : undefined,
        timeOfDay: form.timeOfDay,
        recipients: form.recipients
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: true,
      });
      setForm((f) => ({ ...f, name: '', recipients: '' }));
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (s: ScheduledReportItem) => {
    await updateSchedule(s.id, { isActive: !s.isActive }).catch(() => undefined);
    await load();
  };

  const input =
    'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">New scheduled report</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select
            className={input}
            value={form.definitionKey}
            onChange={(e) => setForm({ ...form, definitionKey: e.target.value })}
          >
            {defs.map((d) => (
              <option key={d.key} value={d.key}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            className={input}
            placeholder="Name (optional)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className={input}
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
          {form.frequency === 'WEEKLY' && (
            <select
              className={input}
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
            >
              {WEEKDAYS.map((w, i) => (
                <option key={w} value={i}>
                  {w}
                </option>
              ))}
            </select>
          )}
          {form.frequency === 'MONTHLY' && (
            <select
              className={input}
              value={form.dayOfMonth}
              onChange={(e) => setForm({ ...form, dayOfMonth: Number(e.target.value) })}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
          )}
          <input
            type="time"
            className={input}
            value={form.timeOfDay}
            onChange={(e) => setForm({ ...form, timeOfDay: e.target.value })}
          />
          <input
            className={input}
            placeholder="Emails, comma separated"
            value={form.recipients}
            onChange={(e) => setForm({ ...form, recipients: e.target.value })}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={saving || !form.definitionKey}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Schedule'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {[
                'Name',
                'Report',
                'Frequency',
                'Next run',
                'Last run',
                'Recipients',
                'Active',
                '',
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-2.5 text-slate-600">{defName(s.definitionKey)}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {FREQ_LABEL[s.frequency]}
                  {s.frequency === 'WEEKLY' && s.dayOfWeek != null
                    ? ` · ${WEEKDAYS[s.dayOfWeek]}`
                    : ''}
                  {s.frequency === 'MONTHLY' && s.dayOfMonth ? ` · day ${s.dayOfMonth}` : ''}{' '}
                  {s.timeOfDay}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {s.nextRunAt ? new Date(s.nextRunAt).toLocaleString() : '-'}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'Never'}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {s.recipients.length ? s.recipients.join(', ') : '-'}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => toggle(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {s.isActive ? 'Active' : 'Paused'}
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => deleteSchedule(s.id).then(load)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No scheduled reports yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
