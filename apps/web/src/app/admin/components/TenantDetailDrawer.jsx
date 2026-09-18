/* src/app/admin/components/TenantDetailDrawer.jsx */
import { useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  Globe,
  Users,
  BedDouble,
  DollarSign,
  Calendar,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Edit3,
  Ban,
  Play,
  Pause,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { tenantStatusMeta, planMeta, formatCurrency, formatDate } from '../data';

export default function TenantDetailDrawer({ tenant, onClose, onUpdateStatus }) {
  const [activeTab, setActiveTab] = useState('overview');
  if (!tenant) return null;

  const statusMeta = tenantStatusMeta[tenant.status];
  const planMetaData = planMeta[tenant.plan];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'usage', label: 'Usage & Limits', icon: TrendingUp },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'features', label: 'Features', icon: CheckCircle2 },
    { id: 'notes', label: 'Notes & History', icon: FileText },
  ];

  const usagePercent = (used, limit) => Math.round((used / limit) * 100);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  planMetaData?.bg
                )}
              >
                <Building2 className={cn('h-5 w-5', planMetaData?.color)} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{tenant.name}</h2>
                <p className="text-xs text-text-muted">
                  {tenant.id} · {tenant.subdomain}.vimad.io
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  statusMeta.class
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
                {statusMeta.label}
              </span>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
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
                    'inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors -mb-px',
                    active
                      ? 'border-danger text-danger'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
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
                  <p className="text-xs text-text-muted uppercase tracking-wider">
                    Monthly Revenue
                  </p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    {formatCurrency(tenant.mrr)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Revenue</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    {formatCurrency(tenant.revenue)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Rooms</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    {tenant.rooms}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Team Size</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    {tenant.users}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Owner Information
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                      {tenant.owner.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <span>{tenant.owner.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Mail className="h-4 w-4 text-text-muted" />
                    {tenant.owner.email}
                  </div>
                </div>
              </div>

              {/* Domain & Region */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Configuration
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Globe className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary">{tenant.domain}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    <span className="text-text-primary capitalize">{tenant.region}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    Created:{' '}
                    <span className="text-text-primary">{formatDate(tenant.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Clock className="h-4 w-4 text-text-muted" />
                    Last Active: <span className="text-text-primary">{tenant.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {tenant.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-warning border-warning/30 hover:bg-warning/10"
                    onClick={() => onUpdateStatus(tenant.id, 'suspended')}
                  >
                    <Pause className="mr-1.5 h-3.5 w-3.5" /> Suspend
                  </Button>
                )}
                {tenant.status === 'suspended' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-accent border-accent/30 hover:bg-accent/10"
                    onClick={() => onUpdateStatus(tenant.id, 'active')}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                  </Button>
                )}
                {tenant.status === 'trial' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-accent border-accent/30 hover:bg-accent/10"
                    onClick={() => onUpdateStatus(tenant.id, 'active')}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Convert to Paid
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit Details
                </Button>
                {tenant.status !== 'cancelled' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10 ml-auto"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ─── Usage Tab ─── */}
          {activeTab === 'usage' && (
            <div className="space-y-6">
              {Object.entries(tenant.usage).map(([key, data]) => {
                const pct = usagePercent(data.used, data.limit);
                const label =
                  key === 'apiCalls' ? 'API Calls' : key === 'rooms' ? 'Rooms' : 'Storage';
                const unit = key === 'storage' ? 'GB' : key === 'apiCalls' ? '/mo' : '';
                return (
                  <div key={key} className="rounded-xl border border-border bg-surface p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
                      <span
                        className={cn(
                          'text-sm font-bold font-mono',
                          pct >= 90 ? 'text-danger' : pct >= 75 ? 'text-warning' : 'text-accent'
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          pct >= 90 ? 'bg-danger' : pct >= 75 ? 'bg-warning' : 'bg-accent'
                        )}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      {data.used.toLocaleString()}
                      {unit} used of {data.limit.toLocaleString()}
                      {unit} limit
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Billing Tab ─── */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Current Plan
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-text-primary">{tenant.plan}</p>
                    <p className="text-sm text-text-muted">{formatCurrency(tenant.mrr)}/month</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                      planMetaData?.bg,
                      planMetaData?.color,
                      'border-current/20'
                    )}
                  >
                    {tenant.plan}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Payment Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Payment Method</span>
                    <span className="text-text-primary">{tenant.billing.paymentMethod || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Next Invoice</span>
                    <span className="text-text-primary">{tenant.billing.nextInvoice || '—'}</span>
                  </div>
                  {tenant.billing.overdue && (
                    <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-center gap-2 mt-2">
                      <AlertTriangle className="h-4 w-4 text-danger" />
                      <span className="text-sm text-danger">
                        Overdue: {formatCurrency(tenant.billing.overdueAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Features Tab ─── */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Enabled Features
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tenant.features.map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-medium text-accent"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {feature
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </span>
                  ))}
                  {tenant.features.length === 0 && (
                    <p className="text-sm text-text-muted">No features enabled</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Available Add-ons
                </h3>
                <div className="space-y-2">
                  {[
                    'ai-revenue-manager',
                    'advanced-analytics',
                    'white-label-portal',
                    'multi-property-dashboard',
                  ].map((feature) => {
                    const enabled = tenant.features.includes(feature);
                    return (
                      <div key={feature} className="flex items-center justify-between py-2">
                        <span className="text-sm text-text-primary">
                          {feature
                            .split('-')
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')}
                        </span>
                        <button
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            enabled ? 'bg-accent' : 'bg-border'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              enabled ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── Notes Tab ─── */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                  Internal Notes
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">{tenant.notes}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Activity Timeline
                </h3>
                <div className="space-y-3">
                  {[
                    { date: tenant.lastActive, action: 'Last platform activity', type: 'info' },
                    { date: tenant.createdAt, action: 'Tenant created', type: 'success' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-1 h-2 w-2 rounded-full shrink-0',
                          item.type === 'success' ? 'bg-accent' : 'bg-info'
                        )}
                      />
                      <div>
                        <p className="text-sm text-text-primary">{item.action}</p>
                        <p className="text-xs text-text-muted">{item.date}</p>
                      </div>
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
