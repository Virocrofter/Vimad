import { useState } from 'react';
import { ReportDefinition, ReportRunItem, getRun, downloadRunCsv } from '../../../api/reports';
import ReportLibrary from './ReportLibrary';
import ReportBuilder from './ReportBuilder';
import ReportScheduler from './ReportScheduler';
import ReportViewer from './ReportViewer';

type Tab = 'library' | 'builder' | 'scheduler' | 'history';
const TABS: { key: Tab; label: string }[] = [
  { key: 'library', label: 'Library' },
  { key: 'builder', label: 'Report builder' },
  { key: 'scheduler', label: 'Scheduler' },
  { key: 'history', label: 'History' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('library');
  const [definition, setDefinition] = useState<ReportDefinition | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyRun, setHistoryRun] = useState<ReportRunItem | null>(null);

  const openBuilder = (def: ReportDefinition) => {
    setDefinition(def);
    setTab('builder');
  };
  const openHistoryRun = async (id: string) => {
    const run = await getRun(id).catch(() => null);
    if (run) setHistoryRun(run);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live operational, revenue and guest reporting for your property.
        </p>
      </div>
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'library' && <ReportLibrary onRun={openBuilder} />}
      {tab === 'builder' && <ReportBuilder definition={definition} />}
      {tab === 'scheduler' && <ReportScheduler refreshKey={refreshKey} />}
      {tab === 'history' && (
        <History
          viewing={historyRun}
          onView={openHistoryRun}
          onCloseView={() => setHistoryRun(null)}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function History({
  viewing,
  onView,
  onCloseView,
  onRefresh,
}: {
  viewing: ReportRunItem | null;
  onView: (id: string) => Promise<void>;
  onCloseView: () => void;
  onRefresh: () => void;
}) {
  const [runs, setRuns] = useState<ReportRunItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = (p: number) => {
    import('../../../api/reports')
      .then(({ getRuns }) => getRuns(p))
      .then((r) => {
        setRuns(r.items);
        setTotal(r.total);
        setPage(r.page);
        onRefresh();
      })
      .catch(() => setRuns([]));
  };
  useState(() => {
    load(1);
    return undefined as void;
  });

  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <div className="space-y-4">
      {viewing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              {viewing.name} · {new Date(viewing.createdAt).toLocaleString()}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => downloadRunCsv(viewing.id)}
                className="text-sm font-medium text-slate-700 hover:underline"
              >
                Export CSV
              </button>
              <button
                onClick={onCloseView}
                className="text-sm font-medium text-slate-500 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
          <ReportViewer run={viewing} />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Report', 'Range', 'Rows', 'Status', 'Run at', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-slate-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{r.name}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {r.params?.dateFrom
                    ? `${r.params.dateFrom} → ${r.params.dateTo ?? r.params.asOfDate ?? ''}`
                    : (r.params?.asOfDate ?? '-')}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{r.rowCount}</td>
                <td
                  className={`px-4 py-2.5 ${r.status === 'FAILED' ? 'text-red-600' : 'text-emerald-600'}`}
                >
                  {r.status}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => onView(r.id)}
                    className="text-xs font-medium text-slate-900 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No report runs yet — run one from the Builder
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
