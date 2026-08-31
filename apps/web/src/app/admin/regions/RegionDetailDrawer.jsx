/* src/app/admin/regions/RegionDetailDrawer.jsx */
import { useState } from 'react';
import {
  X, Globe, Server, Zap, HardDrive, Users, Shield, Clock,
  TrendingUp, Activity, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { regionStatusMeta, regionTenants, latencyHistory, formatDuration } from './data';
import { TenantRow, LatencySparkline } from './components';

export default function RegionDetailDrawer({ region, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  if (!region) return null;

  const meta = regionStatusMeta[region.status];
  const tenants = regionTenants[region.id] || [];
  const utilization = Math.round((region.tenantCount / region.capacity) * 100);
  const storagePct = Math.round((region.storageUsedTB / region.storageTotalTB) * 100);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'tenants', label: 'Tenants', icon: Users },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'compliance', label: 'Compliance', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', meta.class)}>
                <Globe className={cn('h-5 w-5', meta.iconColor)} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{region.name}</h2>
                <p className="text-xs text-text-muted">{region.id} · {region.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', meta.class)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                {meta.label}
              </span>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                    active ? 'border-secondary text-secondary' : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ─── Overview Tab ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Tenant Utilization</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">{utilization}%</p>
                  <p className="text-xs text-text-muted">{region.tenantCount} of {region.capacity} max</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Current Latency</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">{region.latencyMs}ms</p>
                  <p className="text-xs text-text-muted">p95 API response time</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Throughput</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">{region.throughputRps.toLocaleString()}</p>
                  <p className="text-xs text-text-muted">Requests per second</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Monthly Cost</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">${region.monthlyCost.toLocaleString()}</p>
                  <p className="text-xs text-text-muted">${region.costPerTenant}/tenant avg</p>
                </div>
              </div>

              {/* Storage */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Storage Usage</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Used</span>
                    <span className={cn('font-mono font-medium', storagePct > 80 ? 'text-danger' : 'text-text-primary')}>
                      {region.storageUsedTB} TB
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', storagePct > 80 ? 'bg-danger' : storagePct > 60 ? 'bg-warning' : 'bg-accent')}
                      style={{ width: `${storagePct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>0 TB</span>
                    <span>{region.storageTotalTB} TB total</span>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Certifications & Compliance</h3>
                <div className="flex flex-wrap gap-2">
                  {region.certifications.map((cert) => (
                    <span key={cert} className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-medium text-accent">
                      <Shield className="h-3 w-3" />
                      {cert}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Data Residency:</span> {region.dataResidency}
                </div>
              </div>

              {/* Replication */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Replication Targets</h3>
                <div className="space-y-2">
                  {region.replicationTargets.map((target) => (
                    <div key={target} className="flex items-center gap-3 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/10">
                        <Server className="h-3 w-3 text-secondary" />
                      </div>
                      <span className="text-text-primary font-mono text-xs">{target}</span>
                      <span className="text-text-muted text-xs">— Async replication enabled</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Incident */}
              {region.lastIncident && (
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h3 className="text-sm font-semibold text-warning">Last Incident</h3>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">{region.lastIncident}</p>
                </div>
              )}

              {!region.lastIncident && region.status === 'operational' && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-semibold text-accent">No Recent Incidents</h3>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">This region has been stable with no recorded incidents in the last 30 days.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Tenants Tab ─── */}
          {activeTab === 'tenants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Tenants in {region.name}
                </h3>
                <span className="text-xs text-text-muted">{tenants.length} shown</span>
              </div>
              {tenants.length > 0 ? (
                <div className="rounded-xl border border-border bg-surface overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-background border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Tenant</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Plan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">MRR</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Storage</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Last Active</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Compliance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {tenants.map((t) => (
                          <TenantRow key={t.id} tenant={t} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface p-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">No tenants in this region</p>
                </div>
              )}
            </div>
          )}

          {/* ─── Performance Tab ─── */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Latency Trend (24h)</h3>
                <LatencySparkline data={latencyHistory} regionKey={region.id} color="#863bff" width={500} height={80} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Avg Latency (24h)</p>
                  <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                    {Math.round(latencyHistory.reduce((s, d) => s + (d[region.id] || 0), 0) / latencyHistory.length)}ms
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Peak Latency (24h)</p>
                  <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                    {Math.max(...latencyHistory.map((d) => d[region.id] || 0))}ms
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Compliance Tab ─── */}
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Data Residency Policy</h3>
                <p className="text-sm text-text-secondary">{region.dataResidency}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {region.certifications.map((cert) => (
                    <span key={cert} className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-medium text-accent">
                      <Shield className="h-3 w-3" /> {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Replication Configuration</h3>
                <div className="space-y-2">
                  {region.replicationTargets.map((target) => (
                    <div key={target} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-secondary" />
                        <span className="text-sm text-text-primary font-mono">{target}</span>
                      </div>
                      <span className="text-xs text-accent">● Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
