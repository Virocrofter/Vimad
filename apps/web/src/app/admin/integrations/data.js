/* apps/web/src/app/admin/integrations/data.js */
export const mockIntegrations = [
  {
    id: 'int-1',
    provider: 'stripe',
    name: 'Stripe',
    description: 'Payment processing',
    category: 'payment',
    status: 'connected',
    config: { apiKey: 'sk_***' },
    webhooks: [{ url: 'https://api.example.com/webhooks/stripe', events: ['payment.success'] }],
    lastSyncAt: '2026-09-09T10:00:00Z',
    lastSyncStatus: 'success',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
  },
];

export const mockProviders = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing for hotels',
    category: 'payment',
    authType: 'api_key',
    requiredConfig: [
      { key: 'apiKey', label: 'API Key', type: 'string', required: true, sensitive: true },
    ],
    supportedOperations: ['charge', 'refund', 'subscription'],
    webhookSupport: true,
  },
];

/* ─── Integration Status Metadata ─── */
export const statusMeta = {
  connected: {
    label: 'Connected',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  error: {
    label: 'Error',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
  disconnected: {
    label: 'Disconnected',
    dot: 'bg-text-muted',
    class: 'bg-neutral/10 text-text-muted border-border',
  },
};

/* ─── Integration Health Metadata ─── */
export const healthMeta = {
  healthy: { label: 'Healthy', icon: 'CheckCircle2', color: 'text-accent' },
  degraded: { label: 'Degraded', icon: 'AlertTriangle', color: 'text-warning' },
  failing: { label: 'Failing', icon: 'XCircle', color: 'text-danger' },
  unknown: { label: 'Unknown', icon: 'HelpCircle', color: 'text-text-muted' },
};

/* ─── Webhook Status Metadata ─── */
export const webhookStatusMeta = {
  active: {
    label: 'Active',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  paused: {
    label: 'Paused',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

/* ─── HTTP Method Metadata ─── */
export const methodMeta = {
  GET: { bg: 'bg-info/10', color: 'text-info', border: 'border-info/20' },
  POST: { bg: 'bg-accent/10', color: 'text-accent', border: 'border-accent/20' },
  PUT: { bg: 'bg-warning/10', color: 'text-warning', border: 'border-warning/20' },
  PATCH: { bg: 'bg-warning/10', color: 'text-warning', border: 'border-warning/20' },
  DELETE: { bg: 'bg-danger/10', color: 'text-danger', border: 'border-danger/20' },
};

/* ─── Category Metadata ─── */
export const categoryMeta = {
  channel: {
    label: 'Channel Manager',
    bg: 'bg-info/10',
    color: 'text-info',
  },
  payment: {
    label: 'Payments',
    bg: 'bg-accent/10',
    color: 'text-accent',
  },
  communication: {
    label: 'Communication',
    bg: 'bg-secondary/10',
    color: 'text-secondary',
  },
  analytics: {
    label: 'Analytics',
    bg: 'bg-warning/10',
    color: 'text-warning',
  },
  productivity: {
    label: 'Productivity',
    bg: 'bg-purple-500/10',
    color: 'text-purple-500',
  },
  storage: {
    label: 'Storage',
    bg: 'bg-info/10',
    color: 'text-info',
  },
  notifications: {
    label: 'Notifications',
    bg: 'bg-danger/10',
    color: 'text-danger',
  },
  payments: {
    label: 'Payments',
    bg: 'bg-accent/10',
    color: 'text-accent',
  },
};

/* ─── Helpers ─── */
export function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toLocaleString('en-US');
}

export function timeAgo(date) {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (Number.isNaN(seconds)) return '—';
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
