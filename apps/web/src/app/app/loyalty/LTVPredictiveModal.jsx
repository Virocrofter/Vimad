import { useMemo } from 'react';
import { X, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../../lib/utils';
import { tierMeta } from './data';
import { StatCard } from './components';

export function LTVPredictiveModal({ members, onClose }) {
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark
    ? { grid: '#334155', text: '#94A3B8', barCurrent: '#60A5FA', barProjected: '#34D399', tooltipBg: '#1E293B', tooltipBorder: '#475569' }
    : { grid: '#E2E8F0', text: '#64748B', barCurrent: '#3B82F6', barProjected: '#10B981', tooltipBg: '#FFFFFF', tooltipBorder: '#E2E8F0' };

  const data = useMemo(() => members.map(m => {
    const growthFactor = m.totalStays > 20 ? 0.4 : m.totalStays > 10 ? 0.25 : 0.12;
    const projected = Math.round(m.lifetimeValue * (1 + growthFactor));
    const risk = m.totalStays > 20 && m.points > 5000 ? 'low' : m.totalStays > 5 ? 'medium' : 'high';
    const predictedTier = Object.entries(tierMeta).reverse().find(([_, meta]) => projected >= meta.req * 2.2)?.[0] || m.tier;
    return { name: m.name.split(' ')[0], current: m.lifetimeValue, projected, risk, predictedTier, fullName: m.name };
  }), [members]);

  const riskMeta = {
    low: { label: 'Low Risk', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
    medium: { label: 'Medium Risk', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
    high: { label: 'High Risk', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' },
  };

  const avgProjected = Math.round(data.reduce((a, b) => a + b.projected, 0) / data.length) || 0;
  const atRisk = data.filter(d => d.risk === 'high').length;
  const upgradePotential = data.filter((d, i) => d.predictedTier !== members[i].tier && d.risk !== 'high').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Predictive LTV Analytics</h2>
            <p className="text-xs text-text-muted">6-month forward projections & churn risk</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Avg Projected LTV" value={`$${avgProjected.toLocaleString()}`} icon={TrendingUp} color="text-secondary" />
            <StatCard label="At-Risk Members" value={atRisk} icon={AlertTriangle} color="text-danger" />
            <StatCard label="Upgrade Potential" value={upgradePotential} icon={Zap} color="text-accent" />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-4">LTV Trajectory: Current vs Projected</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="name" stroke={colors.text} fontSize={12} />
                <YAxis stroke={colors.text} fontSize={12} tickFormatter={(v) => `$${Math.round(v/1000)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}`, borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="current" name="Current LTV" fill={colors.barCurrent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="projected" name="Projected LTV" fill={colors.barProjected} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-4 py-3">
              <h3 className="text-sm font-semibold text-text-primary">Member Risk & Prediction</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Member</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Current LTV</th>
                    <th className="px-4 py-3 text-right font-medium text-text-secondary">Projected</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Churn Risk</th>
                    <th className="px-4 py-3 text-left font-medium text-text-secondary">Predicted Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((row, idx) => {
                    const risk = riskMeta[row.risk];
                    const predMeta = tierMeta[row.predictedTier];
                    const PredIcon = predMeta.iconName || 'Crown';
                    return (
                      <tr key={idx} className="hover:bg-background/50">
                        <td className="px-4 py-3 text-text-primary font-medium">{row.fullName}</td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">${row.current.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-accent">${row.projected.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', risk.bg, risk.color, risk.border)}>
                            {risk.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 text-xs font-medium', predMeta.color)}>
                            {predMeta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}