/* src/app/admin/quotas/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Search,
  Filter,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  HardDrive,
  BedDouble,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Gauge,
  Ban,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  Settings,
  FileText,
  Bell,
  BellRing,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  quotaRules,
  tenantUsage,
  overageHistory,
  throttleEvents,
  resourceMeta,
  actionMeta,
  getUsagePercent,
  getUsageColor,
  getUsageBarColor,
  formatNumber,
  formatCurrency,
} from './data';
import {
  QuotaStatCard,
  QuotaRuleCard,
  TenantUsageRow,
  OverageHistoryRow,
  ThrottleEventRow,
  ResourceBadge,
  ActionBadge,
  ScopeBadge,
  MiniProgressRing,
} from './components';
import QuotaModal from './QuotaModal';
import OverageModal from './OverageModal';

/* ─── Mock tenants for scope selection ─── */
const mockTenants = [
  { id: 'TNT-001', name: 'Grand Hotel Boston' },
  { id: 'TNT-002', name: 'Seaside Resort Miami' },
  { id: 'TNT-003', name: 'Mountain Lodge Aspen' },
  { id: 'TNT-004', name: 'Downtown Suites Chicago' },
  { id: 'TNT-005', name: 'Coastal Inn San Diego' },
  { id: 'TNT-006', name: 'Lakeside Resort Tahoe' },
  { id: 'TNT-007', name: 'Urban Hotel NYC' },
  { id: 'TNT-008', name: 'Desert Oasis Phoenix' },
];

export default function QuotasPage() {
  const navigate = useNavigate();
  const [rules, setRules] = useState(quotaRules);
  const [usage] = useState(tenantUsage);
  const [overages, setOverages] = useState(overageHistory);
  const [throttles] = useState(throttleEvents);

  const [activeTab, setActiveTab] = useState('rules');
  const [query, setQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showOverageModal, setShowOverageModal] = useState(false);
  const [editingOverage, setEditingOverage] = useState(null);

  const [expandedUsage, setExpandedUsage] = useState(new Set());

  /* ─── Computed Data ─── */
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchesQuery =
        !query ||
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.id.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase());
      const matchesResource = resourceFilter === 'all' || r.resource === resourceFilter;
      const matchesScope = scopeFilter === 'all' || r.scope === scopeFilter;
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'enabled' ? r.enabled : !r.enabled);
      return matchesQuery && matchesResource && matchesScope && matchesStatus;
    });
  }, [rules, query, resourceFilter, scopeFilter, statusFilter]);

  const filteredUsage = useMemo(() => {
    return usage.filter((u) => {
      const matchesQuery =
        !query ||
        u.tenantName.toLowerCase().includes(query.toLowerCase()) ||
        u.tenantId.toLowerCase().includes(query.toLowerCase());
      const matchesResource = resourceFilter === 'all' || u.resource === resourceFilter;
      return matchesQuery && matchesResource;
    });
  }, [usage, query, resourceFilter]);

  const filteredOverages = useMemo(() => {
    return overages.filter((o) => {
      const matchesQuery =
        !query ||
        o.tenantName.toLowerCase().includes(query.toLowerCase()) ||
        o.tenantId.toLowerCase().includes(query.toLowerCase());
      const matchesResource = resourceFilter === 'all' || o.resource === resourceFilter;
      return matchesQuery && matchesResource;
    });
  }, [overages, query, resourceFilter]);

  const filteredThrottles = useMemo(() => {
    return throttles.filter((t) => {
      const matchesQuery =
        !query ||
        t.tenantId.toLowerCase().includes(query.toLowerCase()) ||
        t.reason.toLowerCase().includes(query.toLowerCase());
      const matchesResource = resourceFilter === 'all' || t.resource === resourceFilter;
      return matchesQuery && matchesResource;
    });
  }, [throttles, query, resourceFilter]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const enabled = rules.filter((r) => r.enabled).length;
    const throttling = rules.filter((r) => r.enabled && r.action === 'throttle').length;
    const blocking = rules.filter((r) => r.enabled && r.action === 'block').length;
    const totalOverages = overages.reduce((s, o) => s + o.charge, 0);
    const projectedOverages = overages
      .filter((o) => o.status === 'projected')
      .reduce((s, o) => s + o.charge, 0);
    const activeThrottles = throttles.filter((t) => !t.resolved).length;
    const criticalUsage = usage.filter((u) => getUsagePercent(u.used, u.limit) >= 90).length;
    return {
      enabled,
      throttling,
      blocking,
      totalOverages,
      projectedOverages,
      activeThrottles,
      criticalUsage,
      total: rules.length,
    };
  }, [rules, overages, throttles, usage]);

  /* ─── Handlers ─── */
  const handleToggleRule = (id) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleDeleteRule = (id) => {
    if (confirm('Delete this quota rule? This cannot be undone.')) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSaveRule = (rule) => {
    setRules((prev) => {
      const exists = prev.find((r) => r.id === rule.id);
      if (exists) return prev.map((r) => (r.id === rule.id ? rule : r));
      return [rule, ...prev];
    });
  };

  const handleSaveOverage = (entry) => {
    setOverages((prev) => {
      const exists = prev.find((o) => o.id === entry.id);
      if (exists) return prev.map((o) => (o.id === entry.id ? entry : o));
      return [entry, ...prev];
    });
  };

  const toggleUsage = (key) => {
    setExpandedUsage((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'rules', label: 'Quota Rules', icon: Shield, badge: null },
    { id: 'usage', label: 'Tenant Usage', icon: BarChart3, badge: stats.criticalUsage },
    { id: 'overages', label: 'Overage Billing', icon: DollarSign, badge: null },
    { id: 'throttles', label: 'Throttle Log', icon: Gauge, badge: stats.activeThrottles },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rate Limiting & Quotas</h1>
          <p className="text-sm text-text-secondary">
            Per-tenant API limits, storage caps, room ceilings, and overage controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          {activeTab === 'rules' && (
            <Button
              size="sm"
              onClick={() => {
                setEditingRule(null);
                setShowQuotaModal(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> New Rule
            </Button>
          )}
          {activeTab === 'overages' && (
            <Button
              size="sm"
              onClick={() => {
                setEditingOverage(null);
                setShowOverageModal(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Record Overage
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <QuotaStatCard
          label="Active Rules"
          value={stats.enabled}
          icon={Shield}
          color="text-accent"
          subtext={`of ${stats.total} total`}
        />
        <QuotaStatCard
          label="Throttling"
          value={stats.throttling}
          icon={Gauge}
          color="text-warning"
          subtext="Rate-limit enforced"
        />
        <QuotaStatCard
          label="Overage Revenue"
          value={formatCurrency(stats.totalOverages)}
          icon={DollarSign}
          color="text-secondary"
          subtext={`${formatCurrency(stats.projectedOverages)} projected`}
        />
        <QuotaStatCard
          label="Critical Usage"
          value={stats.criticalUsage}
          icon={AlertTriangle}
          color="text-danger"
          subtext="Tenants near limit"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, ID, tenant..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showFilters
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Resource</label>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Resources</option>
                {Object.entries(resourceMeta).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === 'rules' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Scope</label>
                  <select
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Scopes</option>
                    <option value="plan">Plan</option>
                    <option value="tenant">Tenant</option>
                    <option value="global">Global</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Statuses</option>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setResourceFilter('all');
                setScopeFilter('all');
                setStatusFilter('all');
                setQuery('');
              }}
              className="h-9 rounded-md border border-border bg-background px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* ─── QUOTA RULES TAB ─── */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredRules.length}</span> of{' '}
            {rules.length} rules
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRules.map((rule) => (
              <QuotaRuleCard
                key={rule.id}
                rule={rule}
                onEdit={(r) => {
                  setEditingRule(r);
                  setShowQuotaModal(true);
                }}
                onToggle={handleToggleRule}
                onDelete={handleDeleteRule}
              />
            ))}
            {filteredRules.length === 0 && (
              <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
                <Shield className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">No quota rules match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TENANT USAGE TAB ─── */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          {/* Usage Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(resourceMeta).map(([key, meta]) => {
              const resourceUsage = usage.filter((u) => u.resource === key);
              const avgPct =
                resourceUsage.length > 0
                  ? Math.round(
                      resourceUsage.reduce((s, u) => s + getUsagePercent(u.used, u.limit), 0) /
                        resourceUsage.length
                    )
                  : 0;
              return (
                <div key={key} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-muted uppercase tracking-wider">
                      {meta.label}
                    </span>
                    <MiniProgressRing percent={avgPct} size={36} strokeWidth={3} />
                  </div>
                  <p className={cn('text-lg font-bold font-mono', getUsageColor(avgPct))}>
                    {avgPct}% avg
                  </p>
                  <p className="text-xs text-text-muted">{resourceUsage.length} tenants tracked</p>
                </div>
              );
            })}
          </div>

          {/* Usage Table */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredUsage.length}</span> of{' '}
            {usage.length} usage records
          </p>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsage.map((u) => (
                    <TenantUsageRow
                      key={`${u.tenantId}-${u.resource}`}
                      usage={u}
                      expanded={expandedUsage.has(`${u.tenantId}-${u.resource}`)}
                      onToggle={() => toggleUsage(`${u.tenantId}-${u.resource}`)}
                    />
                  ))}
                  {filteredUsage.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                        <BarChart3 className="mx-auto h-10 w-10 mb-3" />
                        <p>No usage records match your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── OVERAGE BILLING TAB ─── */}
      {activeTab === 'overages' && (
        <div className="space-y-6">
          {/* Overage Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <QuotaStatCard
              label="Total Billed"
              value={formatCurrency(
                overages.filter((o) => o.status === 'billed').reduce((s, o) => s + o.charge, 0)
              )}
              icon={DollarSign}
              color="text-accent"
              subtext="Collected revenue"
            />
            <QuotaStatCard
              label="Projected"
              value={formatCurrency(
                overages.filter((o) => o.status === 'projected').reduce((s, o) => s + o.charge, 0)
              )}
              icon={TrendingUp}
              color="text-info"
              subtext="Current cycle estimate"
            />
            <QuotaStatCard
              label="Waived"
              value={formatCurrency(
                overages.filter((o) => o.status === 'waived').reduce((s, o) => s + o.charge, 0)
              )}
              icon={Ban}
              color="text-text-muted"
              subtext="Forgiven charges"
            />
            <QuotaStatCard
              label="Disputed"
              value={formatCurrency(
                overages.filter((o) => o.status === 'disputed').reduce((s, o) => s + o.charge, 0)
              )}
              icon={AlertTriangle}
              color="text-warning"
              subtext="Under review"
            />
          </div>

          {/* Overage Table */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredOverages.length}</span>{' '}
            of {overages.length} entries
          </p>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Excess
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Charge
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOverages.map((entry) => (
                    <OverageHistoryRow key={entry.id} entry={entry} />
                  ))}
                  {filteredOverages.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        <DollarSign className="mx-auto h-10 w-10 mb-3" />
                        <p>No overage records found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── THROTTLE LOG TAB ─── */}
      {activeTab === 'throttles' && (
        <div className="space-y-6">
          {/* Throttle Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <QuotaStatCard
              label="Total Events"
              value={throttles.length}
              icon={Activity}
              color="text-text-primary"
              subtext="All time"
            />
            <QuotaStatCard
              label="Active Now"
              value={stats.activeThrottles}
              icon={Gauge}
              color="text-warning"
              subtext="Currently throttled"
            />
            <QuotaStatCard
              label="Avg Duration"
              value="105s"
              icon={Clock}
              color="text-info"
              subtext="Mean throttle time"
            />
            <QuotaStatCard
              label="Resolution Rate"
              value="96%"
              icon={CheckCircle2}
              color="text-accent"
              subtext="Auto-resolved"
            />
          </div>

          {/* Throttle Table */}
          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredThrottles.length}</span> of{' '}
            {throttles.length} events
          </p>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredThrottles.map((event) => (
                    <ThrottleEventRow key={event.id} event={event} />
                  ))}
                  {filteredThrottles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                        <Gauge className="mx-auto h-10 w-10 mb-3" />
                        <p>No throttle events match your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {showQuotaModal && (
        <QuotaModal
          rule={editingRule}
          onClose={() => {
            setShowQuotaModal(false);
            setEditingRule(null);
          }}
          onSave={handleSaveRule}
          tenants={mockTenants}
        />
      )}

      {showOverageModal && (
        <OverageModal
          entry={editingOverage}
          onClose={() => {
            setShowOverageModal(false);
            setEditingOverage(null);
          }}
          onSave={handleSaveOverage}
        />
      )}
    </div>
  );
}
