'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  DollarSign,
  Ban,
  AlertTriangle,
  Activity,
  Gauge,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import {
  fetchQuotaRules,
  fetchQuotaUsage,
  fetchOverages,
  fetchThrottleEvents,
  fetchQuotaStats,
  createQuotaRule,
  updateQuotaRule,
  deleteQuotaRule,
  updateOverageStatus,
} from '@/api/quotas';

import {
  QuotaStatCard,
  QuotaRuleCard,
  UsageBar,
  OverageHistoryRow,
  ThrottleEventRow,
  ResourceBadge,
  ScopeBadge,
  ActionBadge,
  OverageStatusBadge,
} from './components';

import { QuotaModal } from './QuotaModal';
import { OverageModal } from './OverageModal';

// ─── Constants ───

const TABS = [
  { id: 'rules', label: 'Quota Rules', icon: BarChart3 },
  { id: 'usage', label: 'Usage Monitor', icon: Activity },
  { id: 'overages', label: 'Overage Billing', icon: DollarSign },
  { id: 'throttles', label: 'Throttle Log', icon: Gauge },
];

const RESOURCE_OPTIONS = [
  { value: 'all', label: 'All Resources' },
  { value: 'api_calls', label: 'API Calls' },
  { value: 'storage', label: 'Storage' },
  { value: 'reservations', label: 'Reservations' },
  { value: 'users', label: 'Users' },
  { value: 'properties', label: 'Properties' },
  { value: 'bandwidth', label: 'Bandwidth' },
];

// ─── Main Component ───

export default function QuotasPage() {
  const [activeTab, setActiveTab] = useState('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showOverageModal, setShowOverageModal] = useState(false);
  const [editingOverage, setEditingOverage] = useState(null);

  // ─── Data Fetching ───

  const {
    data: rules,
    loading: rulesLoading,
    error: rulesError,
    refetch: refetchRules,
  } = useApiFetch(fetchQuotaRules, []);

  const {
    data: usage,
    loading: usageLoading,
    error: usageError,
    refetch: refetchUsage,
  } = useApiFetch(
    () => fetchQuotaUsage({ resource: resourceFilter !== 'all' ? resourceFilter : undefined }),
    [resourceFilter]
  );

  const {
    data: overages,
    loading: overagesLoading,
    error: overagesError,
    refetch: refetchOverages,
  } = useApiFetch(
    () => fetchOverages({ status: statusFilter !== 'all' ? statusFilter : undefined }),
    [statusFilter]
  );

  const {
    data: throttles,
    loading: throttlesLoading,
    error: throttlesError,
    refetch: refetchThrottles,
  } = useApiFetch(
    () => fetchThrottleEvents({ resource: resourceFilter !== 'all' ? resourceFilter : undefined }),
    [resourceFilter]
  );

  const {
    data: stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useApiFetch(fetchQuotaStats, []);

  // ─── Mutations ───

  const saveRuleMutation = useApiMutation(async ({ id, ...data }) => {
    if (id) {
      return updateQuotaRule(id, data);
    }
    return createQuotaRule(data);
  });

  const deleteRuleMutation = useApiMutation(deleteQuotaRule);

  const updateOverageMutation = useApiMutation(({ id, status }) => updateOverageStatus(id, status));

  // ─── Handlers ───

  const handleSaveRule = useCallback(
    async (formData) => {
      try {
        await saveRuleMutation.mutate(formData);
        setShowQuotaModal(false);
        setEditingRule(null);
        refetchRules();
        refetchStats();
      } catch (err) {
        console.error('Failed to save rule:', err);
        throw err; // Let modal handle the error display
      }
    },
    [saveRuleMutation, refetchRules, refetchStats]
  );

  const handleDeleteRule = useCallback(
    async (ruleId) => {
      if (!confirm('Are you sure you want to delete this quota rule?')) return;
      try {
        await deleteRuleMutation.mutate(ruleId);
        refetchRules();
        refetchStats();
      } catch (err) {
        console.error('Failed to delete rule:', err);
        alert('Failed to delete rule. Please try again.');
      }
    },
    [deleteRuleMutation, refetchRules, refetchStats]
  );

  const handleToggleRule = useCallback(
    async (rule) => {
      try {
        await updateQuotaRule(rule.id, { enabled: !rule.enabled });
        refetchRules();
      } catch (err) {
        console.error('Failed to toggle rule:', err);
        alert('Failed to update rule. Please try again.');
      }
    },
    [refetchRules]
  );

  const handleSaveOverage = useCallback(
    async ({ id, status }) => {
      try {
        await updateOverageMutation.mutate({ id, status });
        setShowOverageModal(false);
        setEditingOverage(null);
        refetchOverages();
        refetchStats();
      } catch (err) {
        console.error('Failed to update overage:', err);
        throw err;
      }
    },
    [updateOverageMutation, refetchOverages, refetchStats]
  );

  const handleRefreshAll = useCallback(() => {
    refetchRules();
    refetchUsage();
    refetchOverages();
    refetchThrottles();
    refetchStats();
  }, [refetchRules, refetchUsage, refetchOverages, refetchThrottles, refetchStats]);

  // ─── Derived Data ───

  const filteredRules = useMemo(() => {
    if (!rules) return [];
    return rules.filter((rule) => {
      const matchesSearch =
        searchQuery === '' ||
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesResource = resourceFilter === 'all' || rule.resource === resourceFilter;
      return matchesSearch && matchesResource;
    });
  }, [rules, searchQuery, resourceFilter]);

  const filteredUsage = useMemo(() => {
    if (!usage) return [];
    return usage.filter((u) => {
      const matchesSearch =
        searchQuery === '' || u.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesResource = resourceFilter === 'all' || u.resource === resourceFilter;
      return matchesSearch && matchesResource;
    });
  }, [usage, searchQuery, resourceFilter]);

  const filteredOverages = useMemo(() => {
    if (!overages) return [];
    return overages.filter((o) => {
      const matchesSearch =
        searchQuery === '' || o.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [overages, searchQuery, statusFilter]);

  const filteredThrottles = useMemo(() => {
    if (!throttles) return [];
    return throttles.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesResource = resourceFilter === 'all' || t.resource === resourceFilter;
      return matchesSearch && matchesResource;
    });
  }, [throttles, searchQuery, resourceFilter]);

  // ─── Loading States ───

  const isLoading =
    activeTab === 'rules'
      ? rulesLoading
      : activeTab === 'usage'
        ? usageLoading
        : activeTab === 'overages'
          ? overagesLoading
          : throttlesLoading;

  const isError =
    activeTab === 'rules'
      ? rulesError
      : activeTab === 'usage'
        ? usageError
        : activeTab === 'overages'
          ? overagesError
          : throttlesError;

  // ─── Render ───

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quota Management</h1>
          <p className="mt-1 text-sm text-text-muted">
            Configure resource limits, monitor usage, and manage overage billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Implement CSV export
              console.log('Export CSV');
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {activeTab === 'rules' && (
            <Button
              size="sm"
              onClick={() => {
                setEditingRule(null);
                setShowQuotaModal(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4">
              <div className="h-4 w-20 animate-pulse rounded bg-neutral/20" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-neutral/20" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <QuotaStatCard
            label="Active Rules"
            value={stats.activeRules}
            icon={BarChart3}
            color="text-secondary"
            subtext={`${stats.totalRules} total`}
          />
          <QuotaStatCard
            label="Throttled Tenants"
            value={stats.throttledTenants}
            icon={Gauge}
            color="text-warning"
            subtext="Currently limited"
          />
          <QuotaStatCard
            label="Monthly Overages"
            value={stats.monthlyOverages}
            icon={DollarSign}
            color="text-accent"
            subtext="This billing cycle"
          />
          <QuotaStatCard
            label="Active Throttles"
            value={stats.activeThrottles}
            icon={Activity}
            color="text-danger"
            subtext="In progress now"
          />
        </div>
      ) : null}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-text-muted hover:border-border hover:text-text-primary'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-muted" />
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeTab === 'overages' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="projected">Projected</SelectItem>
                <SelectItem value="billed">Billed</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <ErrorState
          error={isError}
          onRetry={() => {
            if (activeTab === 'rules') refetchRules();
            else if (activeTab === 'usage') refetchUsage();
            else if (activeTab === 'overages') refetchOverages();
            else refetchThrottles();
          }}
        />
      ) : (
        <>
          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <>
              {filteredRules.length === 0 ? (
                <EmptyState
                  title="No quota rules"
                  description="Create your first quota rule to start limiting resource usage."
                  actionLabel="Create Rule"
                  onAction={() => {
                    setEditingRule(null);
                    setShowQuotaModal(true);
                  }}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRules.map((rule) => (
                    <QuotaRuleCard
                      key={rule.id}
                      rule={rule}
                      onEdit={() => {
                        setEditingRule(rule);
                        setShowQuotaModal(true);
                      }}
                      onToggle={() => handleToggleRule(rule)}
                      onDelete={() => handleDeleteRule(rule.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <>
              {filteredUsage.length === 0 ? (
                <EmptyState
                  title="No usage data"
                  description="Usage data will appear here once tenants start consuming resources."
                />
              ) : (
                <div className="rounded-xl border border-border bg-surface overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-background border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Tenant
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Resource
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Usage
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Limit
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Progress
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                            Reset At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredUsage.map((entry) => (
                          <UsageBar key={entry.id} entry={entry} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Overages Tab */}
          {activeTab === 'overages' && (
            <>
              {filteredOverages.length === 0 ? (
                <EmptyState
                  title="No overages"
                  description="No overage charges have been recorded."
                />
              ) : (
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
                          <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredOverages.map((entry) => (
                          <OverageHistoryRow
                            key={entry.id}
                            entry={entry}
                            onEdit={() => {
                              setEditingOverage(entry);
                              setShowOverageModal(true);
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Throttles Tab */}
          {activeTab === 'throttles' && (
            <>
              {filteredThrottles.length === 0 ? (
                <EmptyState
                  title="No throttle events"
                  description="No rate limiting events have occurred."
                />
              ) : (
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
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modals */}
      {showQuotaModal && (
        <QuotaModal
          rule={editingRule}
          onClose={() => {
            setShowQuotaModal(false);
            setEditingRule(null);
          }}
          onSave={handleSaveRule}
          loading={saveRuleMutation.loading}
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
          loading={updateOverageMutation.loading}
        />
      )}
    </div>
  );
}
