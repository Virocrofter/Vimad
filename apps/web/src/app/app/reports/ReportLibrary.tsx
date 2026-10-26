import { useEffect, useMemo, useState } from 'react';
import { ReportDefinition, ReportRunItem, getDefinitions, getRuns } from '../../../api/reports';

const CATEGORIES = ['All', 'Operations', 'Revenue', 'Guests', 'Finance'];

export default function ReportLibrary({ onRun }: { onRun: (def: ReportDefinition) => void }) {
  const [defs, setDefs] = useState<ReportDefinition[]>([]);
  const [recent, setRecent] = useState<ReportRunItem[]>([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');

  useEffect(() => {
    getDefinitions()
      .then(setDefs)
      .catch(() => setDefs([]));
    getRuns(1)
      .then((r) => setRecent(r.items.slice(0, 5)))
      .catch(() => setRecent([]));
  }, []);

  const filtered = useMemo(
    () =>
      defs.filter(
        (d) =>
          (cat === 'All' || d.category === cat) &&
          (!q || `${d.name} ${d.description}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [defs, q, cat]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reports…"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${cat === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => (
          <div
            key={d.key}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-slate-900">{d.name}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                {d.category}
              </span>
            </div>
            <p className="mt-2 flex-1 text-sm text-slate-500">{d.description}</p>
            <button
              onClick={() => onRun(d)}
              className="mt-4 self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Run report
            </button>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Recently run</h4>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-sm last:border-0"
              >
                <span className="text-slate-700">
                  {r.name}{' '}
                  <span className="text-slate-400">· {new Date(r.createdAt).toLocaleString()}</span>
                </span>
                <span className={r.status === 'FAILED' ? 'text-red-600' : 'text-emerald-600'}>
                  {r.status === 'FAILED' ? 'Failed' : `${r.rowCount} rows`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
