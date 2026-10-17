/* src/app/app/reports/LiveReportChart.jsx — chart renderer for LIVE dataset shapes */
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ThemeTooltip } from './components';
import { useChartTheme } from './useChartTheme';

const PALETTE_FALLBACK = ['#863bff', '#22c55e', '#eab308', '#3b82f6', '#ef4444', '#64748b'];

/** Group rows by `key`, summing `valueKey`. */
function groupSum(rows, key, valueKey) {
  const m = new Map();
  for (const r of rows) {
    const k = r[key] || 'Unknown';
    m.set(k, (m.get(k) ?? 0) + (Number(r[valueKey]) || 0));
  }
  return [...m.entries()].map(([label, value]) => ({ label, value }));
}

/** Count rows by `key`. */
function groupCount(rows, key) {
  const m = new Map();
  for (const r of rows) m.set(r[key] || 'Unknown', (m.get(r[key] || 'Unknown') ?? 0) + 1);
  return [...m.entries()].map(([label, value]) => ({ label, value }));
}

export default function LiveReportChart({ data = [], columns = [], colors }) {
  const theme = useChartTheme();
  const c = colors ?? theme;
  const isDark = c.primary === '#F8FAFC';
  const palette = c.chartColors ?? PALETTE_FALLBACK;

  const hasCol = (key) => columns.some((col) => col.key === key);

  /* ─── Shape detection ─── */
  let chart = null;

  if (hasCol('balance') && hasCol('total')) {
    // Reservations / revenue dataset → bar of revenue by status
    const rows = groupSum(data, 'status', 'total').sort((a, b) => b.value - a.value);
    chart = (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={c.text} fontSize={12} />
          <YAxis
            stroke={c.text}
            fontSize={12}
            tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={<ThemeTooltip isDark={isDark} />}
            cursor={{ fill: c.grid, fillOpacity: 0.2 }}
          />
          <Bar dataKey="value" name="Revenue" fill={c.secondary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  } else if (hasCol('housekeeping')) {
    // Rooms / occupancy dataset → pie of room status + bar of housekeeping
    const byStatus = groupCount(data, 'status');
    chart = (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={byStatus}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {byStatus.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip content={<ThemeTooltip isDark={isDark} />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={groupCount(data, 'housekeeping')}>
            <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke={c.text} fontSize={12} />
            <YAxis stroke={c.text} fontSize={12} allowDecimals={false} />
            <Tooltip content={<ThemeTooltip isDark={isDark} />} />
            <Bar dataKey="value" name="Rooms" fill={c.accent} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  } else if (hasCol('vip') || hasCol('points')) {
    // Guests dataset → bar of guests by VIP tier
    const rows = groupCount(data, 'vip');
    chart = (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={c.text} fontSize={12} />
          <YAxis stroke={c.text} fontSize={12} allowDecimals={false} />
          <Tooltip content={<ThemeTooltip isDark={isDark} />} />
          <Bar dataKey="value" name="Guests" fill={c.secondary} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  } else {
    // Generic: first column as label, first numeric column as value
    const labelKey = columns[0]?.key;
    const numericKey = columns.find((col) => data.some((r) => typeof r[col.key] === 'number'))?.key;
    if (labelKey && numericKey) {
      const rows = groupSum(data, labelKey, numericKey).slice(0, 20);
      chart = (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rows}>
            <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              stroke={c.text}
              fontSize={11}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis stroke={c.text} fontSize={12} />
            <Tooltip content={<ThemeTooltip isDark={isDark} />} />
            <Bar dataKey="value" name={numericKey} fill={c.secondary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  }

  if (!chart) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        No chartable columns in this dataset — see the table below.
      </p>
    );
  }
  return chart;
}
