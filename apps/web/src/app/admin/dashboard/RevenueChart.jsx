/* src/app/admin/dashboard/RevenueChart.jsx */
import { useMemo } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { formatCurrency } from './data';

function SimpleAreaChart({ data, color = '#3b82f6', height = 120 }) {
  const padding = { top: 10, right: 0, bottom: 0, left: 0 };
  const chartWidth = 100;
  const chartHeight = height;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - padding.top - ((d.value - min) / range) * (chartHeight - padding.top);
    return { x, y, label: d.label };
  });

  const areaPath = `
    M ${points[0].x} ${chartHeight}
    ${points.map((p) => `L ${p.x} ${p.y}`).join(' ')}
    L ${points[points.length - 1].x} ${chartHeight}
    Z
  `;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGradient)" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={color}
      />
    </svg>
  );
}

export default function RevenueChart({ mrrData }) {
  const chartData = useMemo(() => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return mrrData.map((value, i) => ({ label: months[i], value }));
  }, [mrrData]);

  const currentMRR = mrrData[mrrData.length - 1];
  const previousMRR = mrrData[mrrData.length - 2];
  const momChange = (((currentMRR - previousMRR) / previousMRR) * 100).toFixed(1);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">MRR Trend</h3>
        </div>
        <Link
          to="/admin/analytics"
          className="inline-flex items-center gap-1 text-xs text-secondary hover:underline"
        >
          Analytics <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-5">
        {/* Big Number */}
        <div className="mb-4">
          <p className="text-2xl font-bold font-mono text-text-primary">
            {formatCurrency(currentMRR)}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                'text-xs font-medium',
                parseFloat(momChange) >= 0 ? 'text-accent' : 'text-danger'
              )}
            >
              {parseFloat(momChange) >= 0 ? '+' : ''}
              {momChange}%
            </span>
            <span className="text-xs text-text-muted">vs last month</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-32">
          <SimpleAreaChart data={chartData} color="#3b82f6" />
        </div>

        {/* X-axis labels */}
        <div className="mt-2 flex justify-between text-[10px] text-text-muted">
          {chartData
            .filter((_, i) => i % 2 === 0)
            .map((d) => (
              <span key={d.label}>{d.label}</span>
            ))}
        </div>
      </div>
    </div>
  );
}
