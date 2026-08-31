/* src/app/admin/dashboard/KpiCards.jsx */
import { Building2, DollarSign, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { formatCurrency } from './data';

function MiniSparkline({ data, color = 'text-secondary', isInverse = false }) {
  const values = data;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const colorClass = color.replace('text-', '');
  const strokeColors = {
    secondary: '#3b82f6',
    accent: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#6366f1',
  };

  const stroke = strokeColors[colorClass] || strokeColors.secondary;

  return (
    <svg viewBox="0 0 100 100" className="h-10 w-24" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx={100}
        cy={100 - ((values[values.length - 1] - min) / range) * 100}
        r="3"
        fill={stroke}
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  change,
  changeLabel,
  isInverse = false,
  icon: Icon,
  color,
  trend,
}) {
  const isPositive = change >= 0;
  const isGood = isInverse ? !isPositive : isPositive;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1.5 text-2xl font-bold font-mono', color)}>
            {label.includes('MRR') || label.includes('Revenue')
              ? formatCurrency(value)
              : value.toLocaleString()}
            {label.includes('Churn') && '%'}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className={cn('h-3.5 w-3.5', isGood ? 'text-accent' : 'text-danger')} />
            ) : (
              <TrendingDown className={cn('h-3.5 w-3.5', isGood ? 'text-accent' : 'text-danger')} />
            )}
            <span className={cn('text-xs font-medium', isGood ? 'text-accent' : 'text-danger')}>
              {isPositive ? '+' : ''}
              {change}%
            </span>
            <span className="text-xs text-text-muted">{changeLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              'rounded-lg p-2.5',
              color
                .replace('text-', 'bg-')
                .replace('danger', 'danger/10')
                .replace('accent', 'accent/10')
                .replace('secondary', 'secondary/10')
                .replace('info', 'info/10')
            )}
          >
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          <MiniSparkline data={trend} color={color} isInverse={isInverse} />
        </div>
      </div>
    </div>
  );
}

export default function KpiCards({ data }) {
  const cards = [
    {
      label: 'Total Tenants',
      value: data.totalTenants.value,
      change: data.totalTenants.change,
      changeLabel: data.totalTenants.changeLabel,
      icon: Building2,
      color: 'text-secondary',
      trend: data.totalTenants.trend,
    },
    {
      label: 'Monthly Recurring Revenue',
      value: data.mrr.value,
      change: data.mrr.change,
      changeLabel: data.mrr.changeLabel,
      icon: DollarSign,
      color: 'text-accent',
      trend: data.mrr.trend,
    },
    {
      label: 'Churn Rate',
      value: data.churnRate.value,
      change: data.churnRate.change,
      changeLabel: data.churnRate.changeLabel,
      isInverse: true,
      icon: TrendingDown,
      color: 'text-danger',
      trend: data.churnRate.trend,
    },
    {
      label: 'Active Users',
      value: data.activeUsers.value,
      change: data.activeUsers.change,
      changeLabel: data.activeUsers.changeLabel,
      icon: Users,
      color: 'text-info',
      trend: data.activeUsers.trend,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
