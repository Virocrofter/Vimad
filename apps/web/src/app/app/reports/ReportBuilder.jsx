/* src/app/admin/reports/ReportBuilder.jsx */
import { useState, useMemo } from 'react';
import {
  Filter, List, BarChart, LineChart as LineChartIcon, PieChart,
  Download, Printer, Save
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  BarChart as ReBarChart, Bar, PieChart as RePieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { builderFields, builderMockData } from './data';
import { useChartTheme, ThemeTooltip } from './components';

export default function ReportBuilder() {
  const [selectedFields, setSelectedFields] = useState(new Set(['guestName', 'arrival', 'departure', 'roomType', 'status', 'rate']));
  const [filters, setFilters] = useState({ status: 'all', roomType: 'all', source: 'all', from: '', to: '' });
  const [groupBy, setGroupBy] = useState('none');
  const [chartType, setChartType] = useState('table');
  const [reportName, setReportName] = useState('');
  const colors = useChartTheme();

  const toggleField = (key) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredData = useMemo(() => {
    return builderMockData.filter((row) => {
      if (filters.status !== 'all' && row.status !== filters.status) return false;
      if (filters.roomType !== 'all' && row.roomType !== filters.roomType) return false;
      if (filters.source !== 'all' && row.source !== filters.source) return false;
      if (filters.from && row.arrival < filters.from) return false;
      if (filters.to && row.departure > filters.to) return false;
      return true;
    });
  }, [filters]);

  const groupedData = useMemo(() => {
    if (groupBy === 'none') return filteredData;
    const groups = {};
    filteredData.forEach((row) => {
      const key = row[groupBy] || 'Unknown';
      if (!groups[key]) groups[key] = { label: key, count: 0, revenue: 0 };
      groups[key].count += 1;
      groups[key].revenue += row.roomRevenue || 0;
    });
    return Object.values(groups);
  }, [filteredData, groupBy]);

  const activeFields = useMemo(() => {
    const all = builderFields.flatMap((c) => c.fields);
    return all.filter((f) => selectedFields.has(f.key));
  }, [selectedFields]);

  const exportCsv = () => {
    const dataToExport = groupBy === 'none' ? filteredData : groupedData;
    const cols = groupBy === 'none' ? activeFields : [{ key: 'label', label: groupBy }, { key: 'count', label: 'Count' }, { key: 'revenue', label: 'Revenue' }];
    const headers = cols.map((c) => c.label).join(',');
    const rows = dataToExport.map((row) => cols.map((c) => row[c.key]).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName || 'custom_report'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewChartData = groupedData;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Sidebar */}
      <div className="lg:col-span-3 space-y-6">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Fields</h3>
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
            {builderFields.map((cat) => (
              <div key={cat.category}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">{cat.category}</p>
                <div className="space-y-1">
                  {cat.fields.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-background cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields.has(f.key)}
                        onChange={() => toggleField(f.key)}
                        className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="lg:col-span-6 space-y-6">
        {/* Filters */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-secondary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Filters</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium uppercase text-text-muted">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-text-primary"
              >
                <option value="all">All</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="confirmed">Confirmed</option>
                <option value="no_show">No-Show</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase text-text-muted">Room Type</label>
              <select
                value={filters.roomType}
                onChange={(e) => setFilters((p) => ({ ...p, roomType: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-text-primary"
              >
                <option value="all">All</option>
                <option value="Deluxe King">Deluxe King</option>
                <option value="Standard Twin">Standard Twin</option>
                <option value="Suite">Suite</option>
                <option value="Standard Queen">Standard Queen</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase text-text-muted">Source</label>
              <select
                value={filters.source}
                onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-text-primary"
              >
                <option value="all">All</option>
                <option value="Direct">Direct</option>
                <option value="Booking.com">Booking.com</option>
                <option value="Expedia">Expedia</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase text-text-muted">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-text-primary"
              >
                <option value="none">None (Raw)</option>
                <option value="status">Status</option>
                <option value="roomType">Room Type</option>
                <option value="source">Source</option>
                <option value="loyaltyTier">Loyalty Tier</option>
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Preview</h3>
            <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
              {[
                { key: 'table', icon: List },
                { key: 'bar', icon: BarChart },
                { key: 'line', icon: LineChartIcon },
                { key: 'pie', icon: PieChart },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setChartType(t.key)}
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded transition-colors',
                    chartType === t.key ? 'bg-secondary text-white' : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          {chartType === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    {activeFields.map((f) => (
                      <th key={f.key} className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredData.map((row, i) => (
                    <tr key={i} className="hover:bg-background/50">
                      {activeFields.map((f) => (
                        <td key={f.key} className="px-3 py-2 text-text-primary whitespace-nowrap">{row[f.key]}</td>
                      ))}
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr><td colSpan={activeFields.length} className="px-3 py-8 text-center text-text-muted">No data matches filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {chartType !== 'table' && previewChartData.length > 0 && (
            <div className="py-4">
              {chartType === 'pie' ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RePieChart>
                    <Pie data={previewChartData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                      {previewChartData.map((_, i) => (
                        <Cell key={i} fill={[colors.secondary, colors.accent, colors.warning, colors.info, colors.danger, colors.neutral][i % 6]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ThemeTooltip isDark={colors.primary === '#F8FAFC'} />} />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ReBarChart data={previewChartData}>
                    <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="label" stroke={colors.text} fontSize={12} />
                    <YAxis stroke={colors.text} fontSize={12} />
                    <Tooltip content={<ThemeTooltip isDark={colors.primary === '#F8FAFC'} />} />
                    <Bar dataKey="count" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill={colors.accent} radius={[4, 4, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-3 space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Save Report</h3>
          <Input
            placeholder="Report name..."
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="mb-3"
          />
          <Button className="w-full" size="sm" disabled={!reportName || activeFields.length === 0}>
            <Save className="mr-1.5 h-4 w-4" /> Save to Library
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Export</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download CSV
            </Button>
            <Button variant="outline" className="w-full" size="sm" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Rows</span>
              <span className="font-mono font-medium text-text-primary">{filteredData.length}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Fields</span>
              <span className="font-mono font-medium text-text-primary">{activeFields.length}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Revenue</span>
              <span className="font-mono font-medium text-text-primary">
                ${filteredData.reduce((s, r) => s + (r.roomRevenue || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}