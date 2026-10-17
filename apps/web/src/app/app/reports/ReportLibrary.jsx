/* src/app/app/reports/ReportLibrary.jsx — real data for core reports, sample fallback preserved */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Clock,
  Plus,
  Star,
  Eye,
  BarChart3,
  ArrowLeft,
  Download,
  Database,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { apiClient } from '../../../api/client';
import { libraryReports, generateReportData, reportTableColumns } from './data';
import { ExportToolbar, ReportDataTable, ReportChartRenderer } from './components';
import LiveReportChart from './LiveReportChart';
import { useChartTheme } from './useChartTheme';

const iconMap = {/* unchanged icon map if your data.js uses string icons */};

const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/* Real dataset fetchers — endpoints confirmed mounted in apps/api/src/index.ts */
async function fetchRealDataset(report, from, to) {
  const params = { pageSize: 500 };
  if (from) params.startDate = from;
  if (to) params.endDate = to;
  const key = `${report.category || ''} ${report.title}`.toLowerCase();

  if (key.includes('revenue') || key.includes('financial')) {
    const r = await apiClient.get('/v1/reservations', { params }).catch(() => null);
    const rows = (r?.data?.data ?? []).map((res) => ({
      confirmation: res.confirmationNumber,
      guest: res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : '—',
      arrival: fmtDate(res.arrivalDate),
      departure: fmtDate(res.departureDate),
      nights: res.nights,
      total: Number(res.totalAmount ?? 0),
      balance: Number(res.balance ?? 0),
      status: res.status,
    }));
    return {
      rows,
      columns: [
        { key: 'confirmation', label: 'Confirmation' },
        { key: 'guest', label: 'Guest' },
        { key: 'arrival', label: 'Arrival' },
        { key: 'departure', label: 'Departure' },
        { key: 'nights', label: 'Nights' },
        { key: 'total', label: 'Total' },
        { key: 'balance', label: 'Balance' },
        { key: 'status', label: 'Status' },
      ],
      real: true,
    };
  }
  if (key.includes('occupancy') || key.includes('room')) {
    const r = await apiClient.get('/v1/rooms', { params: { pageSize: 500 } }).catch(() => null);
    const rows = (r?.data?.data ?? []).map((room) => ({
      room: room.number,
      type: room.roomType?.name ?? room.roomTypeId ?? '—',
      status: room.status,
      housekeeping: room.housekeepingStatus,
    }));
    return {
      rows,
      columns: [
        { key: 'room', label: 'Room' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'housekeeping', label: 'Housekeeping' },
      ],
      real: true,
    };
  }
  if (key.includes('guest') || key.includes('crm') || key.includes('loyalty')) {
    const r = await apiClient.get('/v1/guests', { params }).catch(() => null);
    const rows = (r?.data?.data ?? []).map((g) => ({
      name: `${g.firstName} ${g.lastName}`,
      email: g.email ?? '',
      phone: g.phone ?? '',
      points: g.loyaltyPoints ?? 0,
      vip: g.vipStatus ?? '',
    }));
    return {
      rows,
      columns: [
        { key: 'name', label: 'Guest' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'points', label: 'Points' },
        { key: 'vip', label: 'VIP' },
      ],
      real: true,
    };
  }
  return null; // → sample fallback below
}

export default function ReportLibrary({ onOpenBuilder }) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [favorites, setFavorites] = useState(
    () => new Set(libraryReports.filter((r) => r.favorite).map((r) => r.id))
  );
  const today = new Date();
  const twoWeeksAgo = new Date(today.getTime() - 14 * 86400000);
  const [dateRange, setDateRange] = useState({ from: fmtDate(twoWeeksAgo), to: fmtDate(today) });
  const [dataset, setDataset] = useState(null); // { rows, columns, real }
  const [loadingData, setLoadingData] = useState(false);
  const colors = useChartTheme();

  const categories = ['all', ...Array.from(new Set(libraryReports.map((r) => r.category)))];

  const filtered = useMemo(() => {
    return libraryReports.filter((r) => {
      const matchesQuery =
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase());
      const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [query, categoryFilter]);

  const toggleFavorite = (id) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runReport = useCallback(async (report, from, to) => {
    setLoadingData(true);
    try {
      const real = await fetchRealDataset(report, from, to);
      if (real) {
        setDataset(real);
      } else {
        setDataset({
          rows: generateReportData(report.id),
          columns: reportTableColumns[report.id] || [],
          real: false,
        });
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  const openReport = (report) => {
    setSelectedReport(report);
    runReport(report, dateRange.from, dateRange.to);
  };

  const reportData = dataset?.rows ?? [];
  const columns = dataset?.columns ?? [];

  const exportCsv = () => {
    if (!reportData.length) return;
    const headers = columns.map((c) => c.label).join(',');
    const rows = reportData.map((row) =>
      columns.map((c) => (c.format ? c.format(row) : row[c.key])).join(',')
    );
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search reports…"
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
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>
        <Button size="sm" onClick={onOpenBuilder}>
          <Plus className="mr-1.5 h-4 w-4" /> Build Custom Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((report) => {
          const Icon = BarChart3;
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
                  className={cn(
                    'rounded-md p-1 transition-colors',
                    isFav ? 'text-warning' : 'text-text-muted hover:text-warning'
                  )}
                >
                  <Star className={cn('h-4 w-4', isFav && 'fill-warning')} />
                </button>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-text-primary group-hover:text-secondary transition-colors">
                {report.title}
              </h3>
              <p className="mt-1 text-xs text-text-secondary line-clamp-2">{report.description}</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-text-muted uppercase tracking-wider">
                <span className="rounded-full bg-background px-2 py-0.5 border border-border">
                  {report.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {report.lastRun}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openReport(report)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openReport(report)}>
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

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          />
          <div className="relative w-full max-w-4xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      {selectedReport.title}
                      {dataset && !dataset.real && (
                        <span className="rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                          Sample data
                        </span>
                      )}
                      {dataset?.real && (
                        <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent flex items-center gap-1">
                          <Database className="h-3 w-3" /> Live
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-text-muted">{selectedReport.description}</p>
                  </div>
                </div>
                <ExportToolbar
                  onCsv={exportCsv}
                  onPrint={() => window.print()}
                  onPdf={() => window.print()}
                />
              </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => runReport(selectedReport, dateRange.from, dateRange.to)}
                  disabled={loadingData}
                >
                  <Clock className="mr-1.5 h-3 w-3" /> {loadingData ? 'Running…' : 'Run'}
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {loadingData ? (
                <div className="rounded-xl border border-border bg-surface p-12 text-center text-text-muted">
                  Loading report data…
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="rounded-xl border border-border bg-surface p-4">
                      <LiveReportChart data={reportData} columns={columns} colors={colors} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-primary">Report Data</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">{reportData.length} rows</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportCsv}
                          disabled={!reportData.length}
                        >
                          <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                        </Button>
                      </div>
                    </div>
                    <ReportDataTable
                      columns={columns}
                      data={reportData}
                      reportId={selectedReport.id}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
