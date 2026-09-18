/* src/app/admin/integrations/components.jsx */
import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Activity,
  Globe,
  MessageSquare,
  Mail,
  CreditCard,
  BarChart3,
  HardDrive,
  Sparkles,
  Bell,
  Plane,
  HelpCircle,
  Settings,
  Key,
  TrendingUp,
  TrendingDown,
  Minus,
  Wifi,
  WifiOff,
  Loader2,
  Check,
  X,
  Plus,
  Search,
  Filter,
  Code,
  Terminal,
  Send,
  ArrowRight,
  RotateCcw,
  Save,
  Edit3,
  MoreHorizontal,
  FileJson,
  Webhook,
  Plug,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import {
  statusMeta,
  healthMeta,
  webhookStatusMeta,
  methodMeta,
  categoryMeta,
  formatNumber,
  timeAgo,
} from './data';

/* ─── Status Badge ─── */
export function IntegrationStatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.disconnected;
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

/* ─── Health Badge ─── */
export function HealthBadge({ health }) {
  const meta = healthMeta[health] || healthMeta.unknown;
  const Icon =
    {
      CheckCircle2,
      AlertTriangle,
      XCircle,
      HelpCircle,
    }[meta.icon] || HelpCircle;

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', meta.color)}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

/* ─── Webhook Status Badge ─── */
export function WebhookStatusBadge({ status }) {
  const meta = webhookStatusMeta[status] || webhookStatusMeta.failed;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── HTTP Method Badge ─── */
export function MethodBadge({ method }) {
  const meta = methodMeta[method] || methodMeta.GET;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider',
        meta.bg,
        meta.color,
        meta.border
      )}
    >
      {method}
    </span>
  );
}

/* ─── Category Badge ─── */
export function CategoryBadge({ category }) {
  const meta = categoryMeta[category] || categoryMeta.payments;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        meta.bg,
        meta.color,
        'border-current/20'
      )}
    >
      {meta.label}
    </span>
  );
}

/* ─── Integration Icon ─── */
export function IntegrationIcon({ id, className }) {
  const icons = {
    stripe: CreditCard,
    twilio: MessageSquare,
    sendgrid: Mail,
    slack: MessageSquare,
    'google-analytics': BarChart3,
    bookingcom: Globe,
    expedia: Plane,
    openai: Sparkles,
    'aws-s3': HardDrive,
    zapier: Zap,
  };
  const Icon = icons[id] || Plug;
  return <Icon className={className} />;
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
              {trend}% vs last period
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
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Integration Card ─── */
export function IntegrationCard({ integration, onToggle, onConfigure, onDisconnect }) {
  const [showSecret, setShowSecret] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const meta = categoryMeta[integration.category] || categoryMeta.payments;

  return (
    <div
      className={cn(
        'rounded-xl border bg-surface transition-all hover:shadow-md',
        integration.status === 'error'
          ? 'border-danger/30'
          : integration.status === 'pending'
            ? 'border-warning/30'
            : integration.status === 'connected'
              ? 'border-border hover:border-secondary/30'
              : 'border-border'
      )}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', meta.bg)}>
              <IntegrationIcon id={integration.id} className={cn('h-5 w-5', meta.color)} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{integration.name}</h3>
              <p className="text-[10px] text-text-muted">
                {integration.version} ·{' '}
                {integration.connectedAt
                  ? `Connected ${timeAgo(integration.connectedAt + ' 00:00:00')}`
                  : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IntegrationStatusBadge status={integration.status} />
            {integration.health && integration.status === 'connected' && (
              <HealthBadge health={integration.health} />
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-text-secondary leading-relaxed">
          {integration.description}
        </p>

        {/* Features */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {integration.features?.map((feature) => (
            <span
              key={feature}
              className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Quick Stats */}
        {integration.status === 'connected' &&
          integration.stats &&
          Object.keys(integration.stats).length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border bg-background p-3">
              {Object.entries(integration.stats)
                .slice(0, 4)
                .map(([key, value]) => {
                  const labels = {
                    transactionsToday: 'Today',
                    revenueToday: 'Revenue',
                    successRate: 'Success',
                    avgProcessingTime: 'Avg Time',
                    messagesToday: 'Messages',
                    deliveredRate: 'Delivered',
                    failedRate: 'Failed',
                    avgDeliveryTime: 'Avg Time',
                    emailsToday: 'Emails',
                    openRate: 'Open Rate',
                    clickRate: 'Click Rate',
                    bounceRate: 'Bounce',
                    notificationsToday: 'Alerts',
                    channelsConnected: 'Channels',
                    responseTime: 'Response',
                    sessionsToday: 'Sessions',
                    avgSessionDuration: 'Duration',
                    conversionRate: 'Conversion',
                    requestsToday: 'Requests',
                    avgLatency: 'Latency',
                    tokensUsed: 'Tokens',
                    costToday: 'Cost',
                    objectsStored: 'Objects',
                    storageUsed: 'Storage',
                    uploadsToday: 'Uploads',
                    downloadBandwidth: 'Bandwidth',
                    lastError: 'Error',
                    failedSyncs: 'Failed',
                  };
                  return (
                    <div key={key}>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">
                        {labels[key] || key}
                      </p>
                      <p className="text-sm font-mono font-medium text-text-primary">
                        {typeof value === 'number' ? formatNumber(value) : value}
                        {key.includes('Rate') || key === 'successRate' ? '%' : ''}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}

        {/* Error Alert */}
        {integration.status === 'error' && integration.stats?.lastError && (
          <div className="mt-3 rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-danger">{integration.stats.lastError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {integration.status === 'connected' ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
                <Settings className="mr-1.5 h-3.5 w-3.5" /> {expanded ? 'Hide' : 'Configure'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onToggle?.(integration.id)}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10 ml-auto"
                onClick={() => onDisconnect?.(integration.id)}
              >
                <WifiOff className="mr-1.5 h-3.5 w-3.5" /> Disconnect
              </Button>
            </>
          ) : integration.status === 'pending' ? (
            <Button size="sm" onClick={() => onConfigure?.(integration.id)}>
              <Plug className="mr-1.5 h-3.5 w-3.5" /> Complete Setup
            </Button>
          ) : integration.status === 'error' ? (
            <>
              <Button size="sm" onClick={() => onConfigure?.(integration.id)}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reconnect
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger/10"
                onClick={() => onDisconnect?.(integration.id)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => onConfigure?.(integration.id)}>
              <Plug className="mr-1.5 h-3.5 w-3.5" /> Connect
            </Button>
          )}
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-xs text-secondary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Docs
          </a>
        </div>
      </div>

      {/* Expanded Config */}
      {expanded && integration.status === 'connected' && (
        <div className="border-t border-border bg-background/50 p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Configuration
          </h4>
          {Object.entries(integration.config).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-xs text-text-secondary capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <div className="flex items-center gap-2">
                <code className="rounded-md bg-surface border border-border px-2 py-1 text-xs font-mono text-text-primary">
                  {showSecret ? value : String(value).replace(/./g, '•').slice(0, 24)}
                </code>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-text-muted hover:text-text-primary"
                  title={showSecret ? 'Hide' : 'Show'}
                >
                  {showSecret ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(String(value))}
                  className="text-text-muted hover:text-text-primary"
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Webhook Row ─── */
export function WebhookRow({ webhook, expanded, onToggle, onTest, onPause, onDelete }) {
  return (
    <>
      <tr className="hover:bg-background/50 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="font-mono text-xs text-text-muted">{webhook.id}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-text-primary">{webhook.name}</p>
        </td>
        <td className="px-4 py-3">
          <WebhookStatusBadge status={webhook.status} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {webhook.events.map((evt) => (
              <span
                key={evt}
                className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary"
              >
                {evt}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3 text-text-secondary text-xs font-mono truncate max-w-[200px]">
          {webhook.endpoint}
        </td>
        <td className="px-4 py-3 text-text-secondary text-xs">{timeAgo(webhook.lastTriggered)}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTest?.();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              title="Test"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPause?.();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
              title={webhook.status === 'active' ? 'Pause' : 'Resume'}
            >
              {webhook.status === 'active' ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-background/50">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Total Deliveries
                  </p>
                  <p className="font-mono font-medium text-text-primary">
                    {formatNumber(webhook.totalDeliveries)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Failed</p>
                  <p
                    className={cn(
                      'font-mono font-medium',
                      webhook.failedDeliveries > 0 ? 'text-danger' : 'text-accent'
                    )}
                  >
                    {webhook.failedDeliveries}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Avg Latency
                  </p>
                  <p className="font-mono font-medium text-text-primary">{webhook.avgLatency}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Retry Policy
                  </p>
                  <p className="text-text-secondary">
                    {webhook.retryPolicy.maxRetries} retries · {webhook.retryPolicy.backoff} backoff
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">
                    Signing Secret
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="rounded-md bg-background border border-border px-2 py-1 text-xs font-mono text-text-primary">
                      {webhook.secret}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(webhook.secret)}
                      className="text-text-muted hover:text-text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {Object.keys(webhook.headers).length > 0 && (
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                    Custom Headers
                  </p>
                  <div className="space-y-1">
                    {Object.entries(webhook.headers).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-text-secondary">{k}:</span>
                        <span className="text-text-primary">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onTest?.()}>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Test Delivery
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(webhook.endpoint)}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy URL
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── API Endpoint Card ─── */
export function EndpointCard({ endpoint, onTry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-background/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-text-primary">{endpoint.path}</code>
        <span className="text-xs text-text-muted ml-2">{endpoint.description}</span>
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 text-text-muted transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </div>

      {expanded && (
        <div className="border-t border-border bg-background/50 px-4 py-4 space-y-4">
          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
                Parameters
              </h4>
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">Type</th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">
                        Required
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-text-secondary">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {endpoint.parameters.map((param) => (
                      <tr key={param.name}>
                        <td className="px-3 py-2 font-mono text-text-primary">
                          {param.name}
                          {param.in === 'path' && (
                            <span className="text-text-muted text-[10px]"> (path)</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">{param.type}</td>
                        <td className="px-3 py-2">
                          {param.required ? (
                            <span className="text-danger font-medium">Required</span>
                          ) : (
                            <span className="text-text-muted">Optional</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-text-secondary">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Response Example */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">
              Response Example
            </h4>
            <div className="rounded-lg border border-border bg-background p-3 overflow-x-auto">
              <pre className="text-xs font-mono text-text-secondary">
                {JSON.stringify(endpoint.responseExample, null, 2)}
              </pre>
            </div>
          </div>

          {/* Try It */}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => onTry?.(endpoint)}>
              <Terminal className="mr-1.5 h-3.5 w-3.5" /> Try It
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigator.clipboard.writeText(JSON.stringify(endpoint.responseExample, null, 2))
              }
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Response
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── API Playground Panel ─── */
export function ApiPlayground({ endpoint, onClose, onSend }) {
  const [params, setParams] = useState(() => {
    const initial = {};
    endpoint.parameters.forEach((p) => {
      initial[p.name] = p.default !== undefined ? String(p.default) : '';
    });
    return initial;
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setResponse({
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Request-ID': `req_${Date.now()}` },
      body: endpoint.responseExample,
      latency: `${(Math.random() * 200 + 50).toFixed(0)}ms`,
    });
    setLoading(false);
    onSend?.(endpoint, params);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MethodBadge method={endpoint.method} />
            <code className="text-sm font-mono text-text-primary">{endpoint.path}</code>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Parameters Form */}
          {endpoint.parameters.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Parameters
              </h3>
              {endpoint.parameters.map((param) => (
                <div key={param.name}>
                  <label className="text-xs font-medium text-text-secondary">
                    {param.name}
                    {param.required && <span className="text-danger ml-0.5">*</span>}
                  </label>
                  <input
                    type={param.type === 'integer' || param.type === 'number' ? 'number' : 'text'}
                    value={params[param.name] || ''}
                    onChange={(e) => setParams({ ...params, [param.name]: e.target.value })}
                    placeholder={param.description}
                    className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Send Button */}
          <Button className="w-full" onClick={handleSend} isLoading={loading}>
            <Send className="mr-1.5 h-4 w-4" /> Send Request
          </Button>

          {/* Response */}
          {response && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Response
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={cn(
                      'font-mono font-medium',
                      response.status < 300
                        ? 'text-accent'
                        : response.status < 400
                          ? 'text-warning'
                          : 'text-danger'
                    )}
                  >
                    {response.status} {response.status < 300 ? 'OK' : 'Error'}
                  </span>
                  <span className="text-text-muted">{response.latency}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="border-b border-border bg-surface px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Headers
                  </p>
                </div>
                <div className="p-3 space-y-1">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-text-secondary">{k}:</span>
                      <span className="text-text-primary">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="border-b border-border bg-surface px-3 py-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Body
                  </p>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(JSON.stringify(response.body, null, 2))
                    }
                    className="text-text-muted hover:text-text-primary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-text-secondary">
                    {JSON.stringify(response.body, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── New Webhook Modal ─── */
export function NewWebhookModal({ isOpen, onClose, onCreate, eventTypes }) {
  const [form, setForm] = useState({
    name: '',
    endpoint: '',
    events: [],
    secret: '',
  });

  if (!isOpen) return null;

  const toggleEvent = (evt) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(evt)
        ? prev.events.filter((e) => e !== evt)
        : [...prev.events, evt],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...form,
      id: `wh-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      status: 'active',
      totalDeliveries: 0,
      failedDeliveries: 0,
      avgLatency: '—',
      createdAt: new Date().toISOString().split('T')[0],
      lastTriggered: null,
      retryPolicy: { maxRetries: 3, backoff: 'exponential' },
      headers: {},
    });
    onClose();
  };

  const groupedEvents = eventTypes.reduce((acc, evt) => {
    if (!acc[evt.category]) acc[evt.category] = [];
    acc[evt.category].push(evt);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Webhook className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">New Webhook</h3>
              <p className="text-xs text-text-muted">Configure endpoint and events</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Reservation Notifications"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Endpoint URL
            </label>
            <input
              type="url"
              required
              value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              placeholder="https://your-app.com/webhooks"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Signing Secret (optional)
            </label>
            <input
              type="text"
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              placeholder="whsec_..."
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Events
            </label>
            <div className="space-y-3 max-h-64 overflow-auto rounded-lg border border-border bg-surface p-3">
              {Object.entries(groupedEvents).map(([category, events]) => (
                <div key={category}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                    {category}
                  </p>
                  <div className="space-y-1">
                    {events.map((evt) => (
                      <button
                        key={evt.value}
                        type="button"
                        onClick={() => toggleEvent(evt.value)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                          form.events.includes(evt.value)
                            ? 'bg-secondary/10 text-secondary'
                            : 'text-text-secondary hover:bg-background'
                        )}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                            form.events.includes(evt.value)
                              ? 'bg-secondary border-secondary'
                              : 'border-border'
                          )}
                        >
                          {form.events.includes(evt.value) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        {evt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="mr-1.5 h-4 w-4" /> Create Webhook
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
