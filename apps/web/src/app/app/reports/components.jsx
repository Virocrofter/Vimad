/* src/app/admin/reports/components.jsx */
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart as ReBarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Download, FileText, Printer } from 'lucide-react';

/* ─── Theme Tooltip ─── */
export function ThemeTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  const bg = isDark ? '#1E293B' : '#FFFFFF';
  const border = isDark ? '#475569' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
      }}
    >
      <p style={{ color: text, fontWeight: 600, marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || text }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: p.color,
              marginRight: '6px',
            }}
          />
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── Export Toolbar ─── */
export function ExportToolbar({ onCsv, onPrint, onPdf }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onCsv}>
        <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={onPdf}>
        <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={onPrint}>
        <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
      </Button>
    </div>
  );
}

/* ─── Report Data Table ─── */
export function ReportDataTable({ columns, data, reportId }) {
  if (!columns || !data?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-background/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-text-primary">
                    {col.format ? col.format(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Report Chart Renderer ─── */
export function ReportChartRenderer({ report, data, colors }) {
  const isDark = colors.primary === '#F8FAFC';
  const tooltip = <ThemeTooltip isDark={isDark} />;

  if (report.type === 'pie') {
    const pieColors = [
      colors.accent,
      colors.warning,
      colors.secondary,
      colors.info,
      colors.neutral,
    ];
    return (
      <ResponsiveContainer width="100%" height={320}>
        <RePieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
            ))}
          </Pie>
          <Tooltip content={tooltip} />
          <Legend />
        </RePieChart>
      </ResponsiveContainer>
    );
  }

  if (report.type === 'line') {
    const keys = Object.keys(data[0] || {}).filter((k) => k !== 'label');
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={colors.text} fontSize={12} />
          <YAxis stroke={colors.text} fontSize={12} />
          <Tooltip content={tooltip} />
          <Legend />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={[colors.secondary, colors.accent, colors.warning, colors.info][i % 4]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (report.type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={colors.text} fontSize={12} />
          <YAxis stroke={colors.text} fontSize={12} />
          <Tooltip content={tooltip} />
          <Legend />
          <Area
            type="monotone"
            dataKey="charges"
            stroke={colors.secondary}
            fill={colors.secondary}
            fillOpacity={0.15}
          />
          <Area
            type="monotone"
            dataKey="payments"
            stroke={colors.accent}
            fill={colors.accent}
            fillOpacity={0.15}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default bar
  const keys = Object.keys(data[0] || {}).filter((k) => k !== 'label');
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ReBarChart data={data}>
        <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
        <XAxis dataKey="label" stroke={colors.text} fontSize={12} />
        <YAxis stroke={colors.text} fontSize={12} />
        <Tooltip content={tooltip} />
        <Legend />
        {keys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={
              [colors.secondary, colors.accent, colors.warning, colors.info, colors.danger][i % 5]
            }
            radius={[4, 4, 0, 0]}
          />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  );
}
