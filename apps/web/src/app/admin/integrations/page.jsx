/* src/app/admin/integrations/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plug,
  Webhook,
  Code,
  Terminal,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Download,
  Shield,
  Activity,
  Globe,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  integrations,
  webhooks,
  apiEndpoints,
  eventTypes,
  categoryMeta,
  statusMeta,
  formatNumber,
} from './data';
import {
  StatCard,
  IntegrationCard,
  WebhookRow,
  EndpointCard,
  ApiPlayground,
  NewWebhookModal,
  IntegrationStatusBadge,
  CategoryBadge,
} from './components';

/* ─── Main Page ─── */
export default function IntegrationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview | connectors | webhooks | playground
  const [integrationList, setIntegrationList] = useState(integrations);
  const [webhookList, setWebhookList] = useState(webhooks);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedWebhooks, setExpandedWebhooks] = useState(new Set());
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  /* ─── Computed Stats ─── */
  const stats = useMemo(() => {
    const connected = integrationList.filter((i) => i.status === 'connected').length;
    const disconnected = integrationList.filter((i) => i.status === 'disconnected').length;
    const error = integrationList.filter((i) => i.status === 'error').length;
    const pending = integrationList.filter((i) => i.status === 'pending').length;
    const totalWebhooks = webhookList.length;
    const activeWebhooks = webhookList.filter((w) => w.status === 'active').length;
    const totalDeliveries = webhookList.reduce((s, w) => s + w.totalDeliveries, 0);
    return {
      connected,
      disconnected,
      error,
      pending,
      totalWebhooks,
      activeWebhooks,
      totalDeliveries,
    };
  }, [integrationList, webhookList]);

  /* ─── Filtered Integrations ─── */
  const filteredIntegrations = useMemo(() => {
    return integrationList.filter((i) => {
      const matchesQuery =
        !query ||
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.description.toLowerCase().includes(query.toLowerCase()) ||
        i.id.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [integrationList, query, categoryFilter, statusFilter]);

  /* ─── Filtered Webhooks ─── */
  const filteredWebhooks = useMemo(() => {
    return webhookList.filter((w) => {
      const matchesQuery =
        !query ||
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        w.endpoint.toLowerCase().includes(query.toLowerCase()) ||
        w.id.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
  }, [webhookList, query]);

  /* ─── Filtered Endpoints ─── */
  const filteredEndpoints = useMemo(() => {
    return apiEndpoints.filter((e) => {
      const matchesQuery =
        !query ||
        e.path.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
  }, [query]);

  /* ─── Handlers ─── */
  const toggleWebhook = (id) => {
    setExpandedWebhooks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleIntegration = (id) => {
    setIntegrationList((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: i.status === 'connected' ? 'disconnected' : 'connected',
              lastSync: i.status === 'connected' ? null : new Date().toISOString(),
            }
          : i
      )
    );
  };

  const handleDisconnect = (id) => {
    setIntegrationList((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'disconnected', health: 'unknown', lastSync: null } : i
      )
    );
  };

  const handleCreateWebhook = (newWebhook) => {
    setWebhookList((prev) => [newWebhook, ...prev]);
  };

  const handleTestWebhook = (id) => {
    setWebhookList((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              lastTriggered: new Date().toISOString().replace('T', ' ').slice(0, 19),
              totalDeliveries: w.totalDeliveries + 1,
            }
          : w
      )
    );
  };

  const handlePauseWebhook = (id) => {
    setWebhookList((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w
      )
    );
  };

  const handleDeleteWebhook = (id) => {
    setWebhookList((prev) => prev.filter((w) => w.id !== id));
  };

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'connectors', label: 'Connectors', icon: Plug, badge: stats.connected },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook, badge: stats.activeWebhooks },
    { id: 'playground', label: 'API Playground', icon: Terminal },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Integrations Hub</h1>
          <p className="text-sm text-text-secondary">
            Manage third-party connectors, webhooks, and explore the API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm">
            <Shield className="mr-1.5 h-4 w-4" /> API Keys
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Connected"
          value={stats.connected}
          icon={CheckCircle2}
          color="text-accent"
          subtext={`of ${integrationList.length} integrations`}
        />
        <StatCard
          label="Webhooks Active"
          value={stats.activeWebhooks}
          icon={Webhook}
          color="text-secondary"
          subtext={`${stats.totalWebhooks} total configured`}
        />
        <StatCard
          label="Total Deliveries"
          value={formatNumber(stats.totalDeliveries)}
          icon={Zap}
          color="text-info"
          subtext="All time webhook calls"
        />
        <StatCard
          label="Issues"
          value={stats.error + stats.pending}
          icon={AlertTriangle}
          color={stats.error > 0 ? 'text-danger' : 'text-warning'}
          subtext={`${stats.error} errors · ${stats.pending} pending`}
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
                onClick={() => {
                  setActiveTab(tab.id);
                  setQuery('');
                }}
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
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary" /> Recent Activity
              </h3>
              <button className="text-xs text-secondary hover:underline">View All</button>
            </div>
            <div className="divide-y divide-border">
              {integrationList
                .filter((i) => i.lastSync)
                .sort((a, b) => new Date(b.lastSync) - new Date(a.lastSync))
                .slice(0, 5)
                .map((integration) => (
                  <div
                    key={integration.id}
                    className="flex items-center gap-4 px-6 py-3 hover:bg-background/50 transition-colors"
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        integration.health === 'healthy'
                          ? 'bg-accent/10'
                          : integration.health === 'degraded'
                            ? 'bg-warning/10'
                            : integration.health === 'critical'
                              ? 'bg-danger/10'
                              : 'bg-neutral/10'
                      )}
                    >
                      {integration.health === 'healthy' ? (
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      ) : integration.health === 'degraded' ? (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      ) : integration.health === 'critical' ? (
                        <XCircle className="h-4 w-4 text-danger" />
                      ) : (
                        <Clock className="h-4 w-4 text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">
                        <span className="font-medium">{integration.name}</span>{' '}
                        <span className="text-text-secondary">synced successfully</span>
                      </p>
                      <p className="text-xs text-text-muted">{integration.lastSync}</p>
                    </div>
                    <IntegrationStatusBadge status={integration.status} />
                  </div>
                ))}
            </div>
          </div>

          {/* Integration Health Grid */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-secondary" /> Integration Health
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {integrationList.map((integration) => {
                const meta = categoryMeta[integration.category] || categoryMeta.payments;
                return (
                  <button
                    key={integration.id}
                    onClick={() => setActiveTab('connectors')}
                    className="rounded-xl border border-border bg-surface p-4 text-left hover:border-secondary/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          meta.bg
                        )}
                      >
                        <span className={cn('text-sm font-bold', meta.color)}>
                          {integration.name.charAt(0)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          integration.status === 'connected' && integration.health === 'healthy'
                            ? 'bg-accent'
                            : integration.status === 'connected' &&
                                integration.health === 'degraded'
                              ? 'bg-warning'
                              : integration.status === 'error'
                                ? 'bg-danger'
                                : integration.status === 'pending'
                                  ? 'bg-warning'
                                  : 'bg-text-muted'
                        )}
                      />
                    </div>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {integration.name}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {integration.status === 'connected'
                        ? 'Connected'
                        : integration.status === 'error'
                          ? 'Error'
                          : 'Not connected'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={() => setActiveTab('connectors')}
              className="rounded-xl border border-border bg-surface p-5 text-left hover:border-secondary/30 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 mb-3">
                <Plug className="h-5 w-5 text-secondary" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Browse Connectors</h4>
              <p className="text-xs text-text-secondary mt-1">
                Connect Stripe, Twilio, SendGrid, and more
              </p>
              <ArrowRight className="h-4 w-4 text-secondary mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => setActiveTab('webhooks')}
              className="rounded-xl border border-border bg-surface p-5 text-left hover:border-secondary/30 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 mb-3">
                <Webhook className="h-5 w-5 text-secondary" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Manage Webhooks</h4>
              <p className="text-xs text-text-secondary mt-1">
                Configure endpoints and event subscriptions
              </p>
              <ArrowRight className="h-4 w-4 text-secondary mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => setActiveTab('playground')}
              className="rounded-xl border border-border bg-surface p-5 text-left hover:border-secondary/30 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 mb-3">
                <Terminal className="h-5 w-5 text-secondary" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary">API Playground</h4>
              <p className="text-xs text-text-secondary mt-1">Test endpoints and explore the API</p>
              <ArrowRight className="h-4 w-4 text-secondary mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      )}

      {/* ─── CONNECTORS TAB ─── */}
      {activeTab === 'connectors' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search integrations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryMeta).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
                <option value="error">Error</option>
                <option value="pending">Pending</option>
              </select>
              <div className="flex rounded-md border border-border bg-surface p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                    viewMode === 'grid'
                      ? 'bg-secondary text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                    viewMode === 'list'
                      ? 'bg-secondary text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredIntegrations.length}</span> of{' '}
            {integrationList.length} integrations
          </p>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onToggle={handleToggleIntegration}
                  onConfigure={(id) => {
                    const int = integrationList.find((i) => i.id === id);
                    if (int?.status === 'disconnected' || int?.status === 'pending') {
                      setIntegrationList((prev) =>
                        prev.map((i) =>
                          i.id === id
                            ? {
                                ...i,
                                status: 'connected',
                                health: 'healthy',
                                connectedAt: new Date().toISOString().split('T')[0],
                                lastSync: new Date().toISOString().replace('T', ' ').slice(0, 19),
                              }
                            : i
                        )
                      );
                    }
                  }}
                  onDisconnect={handleDisconnect}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                        Integration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                        Health
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                        Last Sync
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredIntegrations.map((integration) => {
                      const meta = categoryMeta[integration.category] || categoryMeta.payments;
                      return (
                        <tr
                          key={integration.id}
                          className="hover:bg-background/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-lg',
                                  meta.bg
                                )}
                              >
                                <span className={cn('text-xs font-bold', meta.color)}>
                                  {integration.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-primary">
                                  {integration.name}
                                </p>
                                <p className="text-[10px] text-text-muted">{integration.version}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <CategoryBadge category={integration.category} />
                          </td>
                          <td className="px-4 py-3">
                            <IntegrationStatusBadge status={integration.status} />
                          </td>
                          <td className="px-4 py-3">
                            {integration.health ? (
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  integration.health === 'healthy'
                                    ? 'text-accent'
                                    : integration.health === 'degraded'
                                      ? 'text-warning'
                                      : integration.health === 'critical'
                                        ? 'text-danger'
                                        : 'text-text-muted'
                                )}
                              >
                                {integration.health.charAt(0).toUpperCase() +
                                  integration.health.slice(1)}
                              </span>
                            ) : (
                              <span className="text-xs text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-text-secondary">
                            {integration.lastSync || 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {integration.status === 'connected' ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-danger hover:bg-danger/10"
                                  onClick={() => handleDisconnect(integration.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setIntegrationList((prev) =>
                                      prev.map((i) =>
                                        i.id === integration.id
                                          ? {
                                              ...i,
                                              status: 'connected',
                                              health: 'healthy',
                                              connectedAt: new Date().toISOString().split('T')[0],
                                              lastSync: new Date()
                                                .toISOString()
                                                .replace('T', ' ')
                                                .slice(0, 19),
                                            }
                                          : i
                                      )
                                    );
                                  }}
                                >
                                  <Plug className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── WEBHOOKS TAB ─── */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search webhooks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button size="sm" onClick={() => setShowNewWebhook(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Webhook
            </Button>
          </div>

          {/* Results */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredWebhooks.length}</span>{' '}
            of {webhookList.length} webhooks
          </p>

          {/* Webhooks Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase w-10"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Events
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Endpoint
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                      Last Triggered
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredWebhooks.map((webhook) => (
                    <WebhookRow
                      key={webhook.id}
                      webhook={webhook}
                      expanded={expandedWebhooks.has(webhook.id)}
                      onToggle={() => toggleWebhook(webhook.id)}
                      onTest={() => handleTestWebhook(webhook.id)}
                      onPause={() => handlePauseWebhook(webhook.id)}
                      onDelete={() => handleDeleteWebhook(webhook.id)}
                    />
                  ))}
                  {filteredWebhooks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                        <Webhook className="mx-auto h-10 w-10 mb-3" />
                        <p>No webhooks match your search.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── API PLAYGROUND TAB ─── */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search endpoints by path or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'tenants', 'reservations', 'rooms', 'system', 'webhooks'].map((cat) => (
              <button
                key={cat}
                onClick={() => setQuery(cat === 'all' ? '' : cat)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  (cat === 'all' && !query) || query === cat
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                )}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Results */}
          <p className="text-sm text-text-muted">
            Showing{' '}
            <span className="font-medium text-text-primary">{filteredEndpoints.length}</span> of{' '}
            {apiEndpoints.length} endpoints
          </p>

          {/* Endpoints */}
          <div className="space-y-3">
            {filteredEndpoints.map((endpoint) => (
              <EndpointCard
                key={endpoint.id}
                endpoint={endpoint}
                onTry={() => setSelectedEndpoint(endpoint)}
              />
            ))}
            {filteredEndpoints.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-12 text-center text-text-muted">
                <Code className="mx-auto h-10 w-10 mb-3" />
                <p>No endpoints match your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {showNewWebhook && (
        <NewWebhookModal
          isOpen={showNewWebhook}
          onClose={() => setShowNewWebhook(false)}
          onCreate={handleCreateWebhook}
          eventTypes={eventTypes}
        />
      )}

      {selectedEndpoint && (
        <ApiPlayground
          endpoint={selectedEndpoint}
          onClose={() => setSelectedEndpoint(null)}
          onSend={(ep, params) => console.log('API Call:', ep.path, params)}
        />
      )}
    </div>
  );
}
