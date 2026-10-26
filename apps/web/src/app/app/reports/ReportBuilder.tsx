import { useEffect, useState } from 'react';
import {
  ReportDefinition,
  ReportRunItem,
  ReportParamDef,
  getProperties,
  runReport,
} from '../../../api/reports';
import ReportViewer from './ReportViewer';

const today = () => new Date().toISOString().slice(0, 10);
const weekAgo = () => new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

function ParamField({
  p,
  value,
  onChange,
  properties,
}: {
  p: ReportParamDef;
  value: string;
  onChange: (v: string) => void;
  properties: { id: string; name: string }[];
}) {
  const base =
    'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';
  if (p.dynamicOptions === 'properties') {
    return (
      <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All properties</option>
        {properties.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    );
  }
  if (p.type === 'select') {
    return (
      <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
        {(p.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input type="date" className={base} value={value} onChange={(e) => onChange(e.target.value)} />
  );
}

export default function ReportBuilder({ definition }: { definition: ReportDefinition | null }) {
  const [params, setParams] = useState<Record<string, string>>({});
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<ReportRunItem | null>(null);

  useEffect(() => {
    getProperties().then(setProperties);
  }, []);

  useEffect(() => {
    setRun(null);
    setError(null);
    if (!definition) return;
    const init: Record<string, string> = {};
    for (const p of definition.params) {
      if (p.key === 'dateFrom') init[p.key] = weekAgo();
      else if (p.key === 'dateTo' || p.key === 'asOfDate') init[p.key] = today();
      else if (p.type === 'select') init[p.key] = p.options?.[0]?.value ?? '';
      else init[p.key] = '';
    }
    setParams(init);
  }, [definition]);

  if (!definition)
    return (
      <p className="py-16 text-center text-slate-400">
        Pick a report from the Library to build it.
      </p>
    );

  const submit = async () => {
    setRunning(true);
    setError(null);
    try {
      const r = await runReport(definition.key, params);
      setRun(r);
      if (r.status === 'FAILED') setError(r.error ?? 'Report failed');
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? 'Failed to run report');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">{definition.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{definition.description}</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {definition.params.map((p) => (
            <label key={p.key} className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {p.label}
              </span>
              <ParamField
                p={p}
                value={params[p.key] ?? ''}
                properties={properties}
                onChange={(v) => setParams((s) => ({ ...s, [p.key]: v }))}
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={running}
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {running ? 'Running…' : 'Run report'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
      {run && run.status === 'COMPLETED' && <ReportViewer run={run} />}
    </div>
  );
}
