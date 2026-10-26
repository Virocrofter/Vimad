import { ReportColumn, ReportRunItem, downloadRunCsv } from '../../../api/reports';

const fmt = (v: unknown, f?: string): string => {
  if (v == null || v === '') return '-';
  if (f === 'currency')
    return `R ${Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (f === 'percent') return `${(Number(v) * 100).toFixed(1)}%`;
  if (f === 'number') return Number(v).toLocaleString('en-ZA');
  return String(v);
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function ReportViewer({
  run,
  onExport,
}: {
  run: ReportRunItem;
  onExport?: (id: string) => void;
}) {
  const result = run.result;
  if (!result)
    return <p className="text-sm text-red-600">Run failed: {run.error ?? 'unknown error'}</p>;
  const cols: ReportColumn[] = result.columns;

  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const summaryHtml = result.summary
      .map(
        (s) =>
          `<div class="card"><div class="lbl">${esc(s.label)}</div><div class="val">${esc(fmt(s.value, s.format))}</div></div>`
      )
      .join('');
    const head = cols.map((c) => `<th>${esc(c.label)}</th>`).join('');
    const body = result.rows
      .map(
        (row) =>
          `<tr>${cols.map((c) => `<td>${esc(fmt(row[c.key], c.format))}</td>`).join('')}</tr>`
      )
      .join('');
    w.document
      .write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(run.name)}</title>
<style>
  body { font-family: -apple-system, 'Segoe UI', sans-serif; color: #0f172a; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
  .cards { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; }
  .lbl { font-size: 10px; text-transform: uppercase; color: #64748b; }
  .val { font-size: 16px; font-weight: 600; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th, td { border: 1px solid #e2e8f0; padding: 5px 8px; text-align: left; }
  th { background: #f8fafc; }
  tr:nth-child(even) { background: #fafafa; }
  @media print { body { margin: 12mm; } }
</style></head><body>
<h1>${esc(run.name)}</h1>
<div class="meta">Vimad Reports · run ${new Date(run.createdAt).toLocaleString()} · ${result.rows.length.toLocaleString()} rows${result.truncated ? ' (truncated)' : ''}</div>
<div class="cards">${summaryHtml}</div>
<table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${cols.length}">No data</td></tr>`}</tbody></table>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {result.summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{fmt(s.value, s.format)}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {result.rows.length.toLocaleString()} rows
          {result.truncated ? ' (truncated at 5,000)' : ''}
        </p>
        <div className="flex gap-2">
          <button
            onClick={exportPdf}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export PDF
          </button>
          <button
            onClick={() => (onExport ? onExport(run.id) : downloadRunCsv(run.id))}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className="px-4 py-3 text-left font-medium text-slate-600">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {result.rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50">
                {cols.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 text-slate-800">
                    {fmt(row[c.key], c.format)}
                  </td>
                ))}
              </tr>
            ))}
            {result.rows.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="px-4 py-8 text-center text-slate-400">
                  No data for this range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
