/* src/app/admin/demo-access/components.jsx */
import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  TrendingUp,
  Zap,
  Users,
  BedDouble,
  DollarSign,
  Calendar,
  Activity,
  Mail,
  Phone,
  Globe,
  Building2,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Percent,
  Timer,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { demoStatusMeta, tierConfig, formatCurrency, getUsagePercent } from './data';

/* ─── Demo Status Badge ─── */
export function DemoStatusBadge({ status }) {
  const meta = demoStatusMeta[status] || demoStatusMeta.active;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Tier Badge ─── */
export function TierBadge({ tier }) {
  const meta = tierConfig[tier] || tierConfig.Starter;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.bg,
        meta.color,
        'border-current/20'
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Stat Card ─── */
export function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last month
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
              .replace('purple-500', 'purple-500/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Mini Usage Bar ─── */
export function MiniUsageBar({ used, total, label, unit = '' }) {
  const pct = typeof total === 'number' ? getUsagePercent(used, total) : null;
  const colorClass = pct >= 90 ? 'text-danger' : pct >= 75 ? 'text-warning' : 'text-accent';
  const barColor = pct >= 90 ? 'bg-danger' : pct >= 75 ? 'bg-warning' : 'bg-accent';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-text-muted">{label}</span>
        <span className={cn('font-mono font-medium', colorClass)}>
          {used}
          {unit} / {typeof total === 'string' ? total : `${total}${unit}`}
        </span>
      </div>
      {pct !== null && (
        <div className="h-1 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Days Remaining Badge ─── */
export function DaysRemainingBadge({ days, total }) {
  const pct = Math.round((days / total) * 100);
  let color = 'text-accent';
  let bg = 'bg-accent/10';
  if (days <= 3) {
    color = 'text-danger';
    bg = 'bg-danger/10';
  } else if (days <= 7) {
    color = 'text-warning';
    bg = 'bg-warning/10';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color.replace('text-', 'bg-'))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs font-mono font-medium', color)}>{days}d left</span>
    </div>
  );
}

/* ─── Feature Usage Tag ─── */
export function FeatureTag({ feature, active }) {
  const labels = {
    'booking-engine': 'Booking',
    'guest-portal': 'Portal',
    'channel-manager': 'Channels',
    'crm-loyalty': 'CRM',
    'marketing-automation': 'Marketing',
    'ai-revenue': 'AI Revenue',
    'advanced-analytics': 'Analytics',
    'white-label-portal': 'White Label',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        active ? 'bg-secondary/10 text-secondary' : 'bg-border text-text-muted'
      )}
    >
      {labels[feature] || feature}
    </span>
  );
}

/* ─── Conversion Funnel Bar ─── */
export function ConversionFunnel({ data }) {
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((stage) => {
        const pct = max > 0 ? (stage.count / max) * 100 : 0;
        return (
          <div key={stage.key} className="flex items-center gap-3">
            <span className="w-24 text-xs text-text-secondary text-right">{stage.label}</span>
            <div className="flex-1 h-6 rounded-md bg-border overflow-hidden relative">
              <div
                className={cn(
                  'h-full rounded-md transition-all flex items-center px-2',
                  stage.color
                )}
                style={{ width: `${pct}%`, opacity: 0.85 }}
              >
                <span className="text-xs font-medium text-white">{stage.count}</span>
              </div>
            </div>
            <span className="w-10 text-xs font-mono text-text-muted">{pct.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Source Breakdown ─── */
export function SourceBreakdown({ sources }) {
  const total = sources.reduce((s, src) => s + src.count, 0);
  return (
    <div className="space-y-2">
      {sources.map((src) => {
        const pct = total > 0 ? (src.count / total) * 100 : 0;
        const convRate = src.count > 0 ? ((src.converted / src.count) * 100).toFixed(1) : '0.0';
        return (
          <div key={src.source} className="flex items-center gap-3">
            <span className="w-20 text-xs text-text-secondary capitalize">{src.source}</span>
            <div className="flex-1 h-4 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-secondary/70 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-primary w-6 text-right">
                {src.count}
              </span>
              <span className="text-[10px] text-text-muted">({convRate}% conv)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Feature Popularity Chart ─── */
export function FeaturePopularityChart({ features }) {
  const max = Math.max(...features.map((f) => f.usage));
  return (
    <div className="space-y-2">
      {features.map((f) => {
        const pct = max > 0 ? (f.usage / max) * 100 : 0;
        const labels = {
          'booking-engine': 'Booking Engine',
          'guest-portal': 'Guest Portal',
          'channel-manager': 'Channel Manager',
          'crm-loyalty': 'CRM & Loyalty',
          'marketing-automation': 'Marketing Automation',
          'ai-revenue': 'AI Revenue Manager',
          'advanced-analytics': 'Advanced Analytics',
          'white-label-portal': 'White-Label Portal',
        };
        return (
          <div key={f.feature} className="flex items-center gap-3">
            <span className="w-32 text-xs text-text-secondary truncate">
              {labels[f.feature] || f.feature}
            </span>
            <div className="flex-1 h-3 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-accent/80 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-text-muted w-8 text-right">{f.usage}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Demo Detail Drawer ─── */
export function DemoDetailDrawer({
  demo,
  onClose,
  onExtend,
  onConvert,
  onLock,
  onUnlock,
  onSendReminder,
}) {
  const [extendDays, setExtendDays] = useState(7);
  const [showExtend, setShowExtend] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [convertPlan, setConvertPlan] = useState(demo?.tier || 'Professional');
  const [activeTab, setActiveTab] = useState('overview');

  if (!demo) return null;

  const tier = tierConfig[demo.tier] || tierConfig.Starter;
  const status = demoStatusMeta[demo.status] || demoStatusMeta.active;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'usage', label: 'Usage', icon: BarChart3 },
    { id: 'activity', label: 'Activity', icon: Clock },
  ];

  const usageMetrics = [
    { label: 'Rooms Configured', used: demo.roomsConfigured, total: tier.rooms, unit: '' },
    { label: 'Users Invited', used: demo.usersInvited, total: tier.users, unit: '' },
    { label: 'Reservations', used: demo.reservationsCreated, total: '—', unit: '' },
    {
      label: 'Revenue Simulated',
      used: formatCurrency(demo.revenueSimulated),
      total: '—',
      unit: '',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', tier.bg)}>
                <Building2 className={cn('h-5 w-5', tier.color)} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{demo.tenantName}</h2>
                <p className="text-xs text-text-muted">
                  {demo.id} · {demo.subdomain}.unifiedpms.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DemoStatusBadge status={demo.status} />
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <XCircle className="h-5 w-5" />
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
                    active
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                      {demo.contactName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <span>{demo.contactName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Mail className="h-4 w-4 text-text-muted" />
                    {demo.contactEmail}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Phone className="h-4 w-4 text-text-muted" />
                    {demo.contactPhone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Globe className="h-4 w-4 text-text-muted" />
                    <span className="capitalize">{demo.region}</span>
                  </div>
                </div>
              </div>

              {/* Trial Info */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Trial Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-muted">Tier</span>
                    <div className="mt-1">
                      <TierBadge tier={demo.tier} />
                    </div>
                  </div>
                  <div>
                    <span className="text-text-muted">Status</span>
                    <div className="mt-1">
                      <DemoStatusBadge status={demo.status} />
                    </div>
                  </div>
                  <div>
                    <span className="text-text-muted">Started</span>
                    <p className="mt-1 font-medium text-text-primary">{demo.createdAt}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Expires</span>
                    <p
                      className={cn(
                        'mt-1 font-medium',
                        demo.daysRemaining <= 3 ? 'text-danger' : 'text-text-primary'
                      )}
                    >
                      {demo.expiresAt}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-muted">Days Remaining</span>
                    <div className="mt-1">
                      <DaysRemainingBadge days={demo.daysRemaining} total={demo.totalDays} />
                    </div>
                  </div>
                  <div>
                    <span className="text-text-muted">Source</span>
                    <p className="mt-1 font-medium text-text-primary capitalize">{demo.source}</p>
                  </div>
                </div>
              </div>

              {/* Features Used */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Features Explored
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(tierConfig[demo.tier]?.features || []).map((_, idx) => {
                    const feature = tierConfig[demo.tier].features[idx];
                    const active = demo.featuresUsed.includes(feature);
                    return <FeatureTag key={feature} feature={feature} active={active} />;
                  })}
                </div>
              </div>

              {/* Notes */}
              {demo.notes && (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-text-secondary">{demo.notes}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {demo.status === 'active' || demo.status === 'expiring_soon' ? (
                  <>
                    {!showExtend ? (
                      <button
                        onClick={() => setShowExtend(true)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
                      >
                        <Calendar className="h-4 w-4" /> Extend Trial
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={extendDays}
                          onChange={(e) => setExtendDays(parseInt(e.target.value) || 7)}
                          className="h-8 w-16 rounded border border-border bg-surface px-2 text-sm text-text-primary"
                        />
                        <span className="text-xs text-text-muted">days</span>
                        <button
                          onClick={() => {
                            onExtend(demo.id, extendDays);
                            setShowExtend(false);
                          }}
                          className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary/90"
                        >
                          Extend
                        </button>
                        <button
                          onClick={() => setShowExtend(false)}
                          className="text-xs text-text-muted hover:text-text-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {!showConvert ? (
                      <button
                        onClick={() => setShowConvert(true)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20"
                      >
                        <TrendingUp className="h-4 w-4" /> Convert to Paid
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 p-2">
                        <select
                          value={convertPlan}
                          onChange={(e) => setConvertPlan(e.target.value)}
                          className="h-8 rounded border border-border bg-surface px-2 text-sm text-text-primary"
                        >
                          <option value="Starter">Starter ($199/mo)</option>
                          <option value="Professional">Professional ($499/mo)</option>
                          <option value="Enterprise">Enterprise ($999/mo)</option>
                        </select>
                        <button
                          onClick={() => {
                            onConvert(demo.id, convertPlan);
                            setShowConvert(false);
                          }}
                          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
                        >
                          Convert
                        </button>
                        <button
                          onClick={() => setShowConvert(false)}
                          className="text-xs text-text-muted hover:text-text-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {!demo.reminderSent && (
                      <button
                        onClick={() => onSendReminder(demo.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
                      >
                        <Mail className="h-4 w-4" /> Send Reminder
                      </button>
                    )}

                    <button
                      onClick={() => onLock(demo.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/20"
                    >
                      <Lock className="h-4 w-4" /> Lock Now
                    </button>
                  </>
                ) : demo.status === 'locked' || demo.status === 'expired' ? (
                  <>
                    <button
                      onClick={() => onUnlock(demo.id, 7)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-secondary/30 bg-secondary/10 px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary/20"
                    >
                      <Zap className="h-4 w-4" /> Reactivate (7d)
                    </button>
                    <button
                      onClick={() => onConvert(demo.id, demo.tier)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/20"
                    >
                      <TrendingUp className="h-4 w-4" /> Convert to Paid
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {usageMetrics.slice(0, 2).map((m) => (
                  <MiniUsageBar
                    key={m.label}
                    used={m.used}
                    total={m.total}
                    label={m.label}
                    unit={m.unit}
                  />
                ))}
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
                  Engagement Metrics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MousePointerClick className="h-4 w-4 text-secondary" />
                      <span className="text-xs text-text-muted">Total Sessions</span>
                    </div>
                    <p className="text-xl font-bold font-mono text-text-primary">
                      {demo.sessionsCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="h-4 w-4 text-secondary" />
                      <span className="text-xs text-text-muted">Last Active</span>
                    </div>
                    <p className="text-sm font-medium text-text-primary">{demo.lastActive}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BedDouble className="h-4 w-4 text-secondary" />
                      <span className="text-xs text-text-muted">Reservations</span>
                    </div>
                    <p className="text-xl font-bold font-mono text-text-primary">
                      {demo.reservationsCreated}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-secondary" />
                      <span className="text-xs text-text-muted">Revenue Simulated</span>
                    </div>
                    <p className="text-xl font-bold font-mono text-text-primary">
                      {formatCurrency(demo.revenueSimulated)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Onboarding Progress
                </h3>
                <div className="flex items-center gap-2">
                  {['started', 'onboarded', 'active_usage', 'converted'].map((step, idx) => {
                    const isActive = demo.onboardingStep === step;
                    const isPast =
                      ['started', 'onboarded', 'active_usage', 'converted'].indexOf(
                        demo.onboardingStep
                      ) >= idx;
                    const labels = {
                      started: 'Started',
                      onboarded: 'Onboarded',
                      active_usage: 'Active',
                      converted: 'Converted',
                    };
                    return (
                      <div key={step} className="flex items-center gap-2 flex-1">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                            isPast ? 'bg-secondary text-white' : 'bg-border text-text-muted'
                          )}
                        >
                          {isPast ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            isActive
                              ? 'text-secondary'
                              : isPast
                                ? 'text-text-secondary'
                                : 'text-text-muted'
                          )}
                        >
                          {labels[step]}
                        </span>
                        {idx < 3 && (
                          <div
                            className={cn(
                              'flex-1 h-0.5',
                              isPast &&
                                idx <
                                  ['started', 'onboarded', 'active_usage', 'converted'].indexOf(
                                    demo.onboardingStep
                                  )
                                ? 'bg-secondary'
                                : 'bg-border'
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                  Activity Timeline
                </h3>
                <div className="space-y-3">
                  {[
                    { date: demo.lastActive, action: 'Last platform activity', type: 'info' },
                    { date: demo.createdAt, action: 'Demo account created', type: 'success' },
                    demo.convertedAt && {
                      date: demo.convertedAt,
                      action: `Converted to ${demo.convertedPlan}`,
                      type: 'success',
                    },
                    demo.reminderSent && {
                      date: demo.expiresAt,
                      action: 'Expiry reminder sent',
                      type: 'warning',
                    },
                  ]
                    .filter(Boolean)
                    .map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-1 h-2 w-2 rounded-full shrink-0',
                            item.type === 'success'
                              ? 'bg-accent'
                              : item.type === 'warning'
                                ? 'bg-warning'
                                : 'bg-info'
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

/* ─── New Demo Modal ─── */
export function NewDemoModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    tenantName: '',
    subdomain: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    tier: 'Professional',
    duration: 30,
    autoLock: true,
    source: 'website',
    region: 'us-east',
    notes: '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date();
    const expiry = new Date(now.getTime() + form.duration * 24 * 60 * 60 * 1000);
    const tier = tierConfig[form.tier];
    onCreate({
      id: `DEMO-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      tenantName: form.tenantName,
      subdomain: form.subdomain,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      tier: form.tier,
      status: 'active',
      createdAt: now.toISOString().split('T')[0],
      expiresAt: expiry.toISOString().split('T')[0],
      daysRemaining: form.duration,
      totalDays: form.duration,
      roomsConfigured: 0,
      usersInvited: 0,
      reservationsCreated: 0,
      revenueSimulated: 0,
      lastActive: null,
      sessionsCount: 0,
      featuresUsed: [],
      onboardingStep: 'started',
      notes: form.notes,
      autoLockEnabled: form.autoLock,
      reminderSent: false,
      convertedAt: null,
      convertedPlan: null,
      source: form.source,
      region: form.region,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Zap className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Grant Demo Access</h3>
              <p className="text-xs text-text-muted">Create a new trial account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Property Name
            </label>
            <input
              type="text"
              required
              value={form.tenantName}
              onChange={(e) => update('tenantName', e.target.value)}
              placeholder="e.g. Sunset Beach Resort"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Subdomain
            </label>
            <div className="flex items-center">
              <input
                type="text"
                required
                value={form.subdomain}
                onChange={(e) =>
                  update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
                placeholder="sunsetbeach"
                className="h-10 flex-1 rounded-l-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="inline-flex h-10 items-center rounded-r-md border border-l-0 border-border bg-background px-3 text-sm text-text-muted">
                .unifiedpms.com
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Contact Name
              </label>
              <input
                type="text"
                required
                value={form.contactName}
                onChange={(e) => update('contactName', e.target.value)}
                placeholder="Full name"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Contact Email
              </label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={(e) => update('contactEmail', e.target.value)}
                placeholder="email@company.com"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => update('contactPhone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Region
              </label>
              <select
                value={form.region}
                onChange={(e) => update('region', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="us-east">US East</option>
                <option value="us-west">US West</option>
                <option value="us-central">US Central</option>
                <option value="eu-west">EU West</option>
                <option value="ap-southeast">AP Southeast</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Starter', 'Professional', 'Enterprise'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update('tier', t)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    form.tier === t
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Duration (days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={form.duration}
                onChange={(e) => update('duration', parseInt(e.target.value) || 30)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Source
              </label>
              <select
                value={form.source}
                onChange={(e) => update('source', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="website">Website</option>
                <option value="ads">Ads</option>
                <option value="referral">Referral</option>
                <option value="event">Event</option>
                <option value="partner">Partner</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3">
            <input
              type="checkbox"
              id="autoLock"
              checked={form.autoLock}
              onChange={(e) => update('autoLock', e.target.checked)}
              className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
            />
            <label htmlFor="autoLock" className="text-sm text-text-secondary">
              Auto-lock when demo expires
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              placeholder="Any special notes about this prospect..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-md bg-secondary px-4 text-sm font-medium text-white hover:bg-secondary/90"
            >
              <Zap className="inline mr-1.5 h-4 w-4" /> Grant Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
