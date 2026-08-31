/* src/app/admin/reports/ReportLibrary.jsx */
import { useState, useMemo } from 'react';
import {
  Search, Clock, Plus, Star, Eye, BarChart3, ArrowLeft,
  BedDouble, DollarSign, Users, TrendingUp, FileText
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { libraryReports, generateReportData, reportTableColumns } from './data';
import { useChartTheme, ExportToolbar, ReportDataTable, ReportChartRenderer } from './components';

/* ─── Icon Map (string → component) ─── */
const iconMap = {
  BedDouble,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
};

export default function ReportLibrary({ onOpenBuilder }) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [favorites, setFavorites] = useState(() => new Set(libraryReports.filter((r) => r.favorite).map((r) => r.id)));
  const [dateRange, setDateRange] = useState({ from: '2026-08-01', to: '2026-08-14' });
  const colors = useChartTheme();

  const categories = ['all', ...Array.from(new Set(libraryReports.map((r) => r.category)))];

  const filtered = useMemo(() => {
    return libraryReports.filter((r) => {
      const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase()) || r.description.toLowerCase().includes(query.toLowerCase());
      const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [query, categoryFilter]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reportData = useMemo(() => {
    if (!selectedReport) return [];
    return generateReportData(selectedReport.id);
  }, [selectedReport]);

  const columns = selectedReport ? reportTableColumns[selectedReport.id] || [] : [];

  const exportCsv = () => {
    if (!reportData.length) return;
    const headers = columns.map((c) => c.label).join(',');
    const rows = reportData.map((row) => columns.map((c) => (c.format ? c.format(row) : row[c.key])).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search reports..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
        <Button size="sm" onClick={onOpenBuilder}>
          <Plus className="mr-1.5 h-4 w-4" /> Build Custom Report
        </Button>
      </div>

      {/* Report Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((report) => {
          const Icon = iconMap[report.icon] || BarChart3;
          const isFav = favorites.has(report.id);
          return (
            <div
              key={report.id}
              className="group relative rounded-xl border border-border bg-surface p-5 transition-all hover:border-secondary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <Icon className="h-5 w-5 text-secondary" />
                </div>
                <button
                  onClick={() => toggleFavorite(report.id)}
                  className={cn('rounded-md p-1 transition-colors', isFav ? 'text-warning' : 'text-text-muted hover:text-warning')}
                >
                  <Star className={cn('h-4 w-4', isFav && 'fill-warning')} />
                </button>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text-primary group-hover:text-secondary transition-colors">
                {report.title}
              </h3>
              <p className="mt-1 text-xs text-text-secondary line-clamp-2">{report.description}</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted uppercase tracking-wider">
                <span className="rounded-full bg-background px-2 py-0.5 border border-border">{report.category}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {report.lastRun}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedReport(report)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                  <BarChart3 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
            <Search className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-text-muted">No reports match your search.</p>
          </div>
        )}
      </div>

      {/* Report Detail Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
          <div className="relative w-full max-w-4xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedReport(null)} className="rounded-md p-1 hover:bg-surface-elevated text-text-muted">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">{selectedReport.title}</h2>
                    <p className="text-xs text-text-muted">{selectedReport.description}</p>
                  </div>
                </div>
                <ExportToolbar onCsv={exportCsv} onPrint={() => window.print()} onPdf={() => window.print()} />
              </div>

              {/* Date Filter */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange((p) => ({ ...p, from: e.target.value }))}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text-primary"
                />
                <span className="text-text-muted">→</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange((p) => ({ ...p, to: e.target.value }))}
                  className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text-primary"
                />
                <Button variant="outline" size="sm" className="ml-2">
                  <Clock className="mr-1.5 h-3 w-3" /> Run
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Chart */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <ReportChartRenderer report={selectedReport} data={reportData} colors={colors} />
              </div>

              {/* Data Table */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text-primary">Report Data</h3>
                  <span className="text-xs text-text-muted">{reportData.length} rows</span>
                </div>
                <ReportDataTable columns={columns} data={reportData} reportId={selectedReport.id} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}