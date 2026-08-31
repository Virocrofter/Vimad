/* src/app/admin/dashboard/PlanDistribution.jsx */
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Tag } from 'lucide-react';
import { cn } from '../../../lib/utils';

export default function PlanDistribution({ data }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Plan Distribution</h3>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-6">
          {/* Mini Pie Chart */}
          <div className="h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={44}
                  paddingAngle={3}
                  dataKey="count"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value} tenants`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5">
            {data.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-text-primary">{item.plan}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-xs text-text-muted">({item.percentage}%)</span>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="text-xs text-text-muted">Total</span>
              <span className="text-sm font-mono font-bold text-text-primary">{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
