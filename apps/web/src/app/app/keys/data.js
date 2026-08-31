// src/app/app/keys/data.js
// Mock data, status metadata, and helpers for the Key Management Module

// ─────────────────────────────────────────────
// STATUS METADATA
// ─────────────────────────────────────────────

export const KEY_STATUS = {
  ACTIVE:     { label: 'Active',     color: '#22c55e', bg: '#dcfce7', icon: 'CheckCircle' },
  INACTIVE:   { label: 'Inactive',   color: '#6b7280', bg: '#f3f4f6', icon: 'PauseCircle' },
  EXPIRED:    { label: 'Expired',    color: '#ef4444', bg: '#fee2e2', icon: 'AlertCircle' },
  REVOKED:    { label: 'Revoked',    color: '#f97316', bg: '#ffedd5', icon: 'XCircle' },
  PENDING:    { label: 'Pending',    color: '#3b82f6', bg: '#dbeafe', icon: 'Clock' },
  SUSPENDED:  { label: 'Suspended',  color: '#a855f7', bg: '#f3e8ff', icon: 'Ban' },
};

export const KEY_TYPE = {
  API_KEY:      { label: 'API Key',       description: 'Server-to-server authentication' },
  ACCESS_TOKEN: { label: 'Access Token',  description: 'Short-lived bearer token' },
  REFRESH_TOKEN:{ label: 'Refresh Token', description: 'Long-lived token for renewal' },
  CLIENT_SECRET:{ label: 'Client Secret', description: 'OAuth client credentials' },
  SIGNING_KEY:  { label: 'Signing Key',   description: 'JWT / webhook signature key' },
  ENCRYPTION:   { label: 'Encryption Key',description: 'Data encryption / decryption' },
};

export const KEY_PERMISSIONS = [
  { id: 'read',      label: 'Read',      scope: 'GET endpoints',      level: 1 },
  { id: 'write',     label: 'Write',     scope: 'POST/PUT/PATCH',     level: 2 },
  { id: 'delete',    label: 'Delete',    scope: 'DELETE endpoints',   level: 3 },
  { id: 'admin',     label: 'Admin',     scope: 'Full access',        level: 4 },
  { id: 'webhook',   label: 'Webhook',   scope: 'Receive webhooks',   level: 1 },
  { id: 'billing',   label: 'Billing',   scope: 'Billing operations', level: 2 },
];

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────

export const mockKeys = [
  {
    id: 'key_001',
    name: 'Production API Key',
    type: 'API_KEY',
    status: 'ACTIVE',
    value: 'sk_live_51Hx9vB...kL2mN',
    maskedValue: 'sk_live_••••••kL2mN',
    permissions: ['read', 'write', 'delete'],
    createdAt: '2026-01-15T09:30:00Z',
    expiresAt: '2027-01-15T09:30:00Z',
    lastUsedAt: '2026-08-15T10:22:00Z',
    usageCount: 124_583,
    rateLimit: 10_000,
    owner: { id: 'usr_001', name: 'Alice Chen', email: 'alice@company.com' },
    environment: 'production',
    ipWhitelist: ['203.0.113.0/24', '198.51.100.10'],
    metadata: { service: 'payment-gateway', region: 'us-east-1' },
    rotationPolicy: { autoRotate: true, intervalDays: 90, nextRotation: '2026-10-15T09:30:00Z' },
    auditLog: [
      { action: 'CREATED',      actor: 'Alice Chen',   timestamp: '2026-01-15T09:30:00Z', details: 'Initial creation' },
      { action: 'ROTATED',      actor: 'System',       timestamp: '2026-04-15T09:30:00Z', details: 'Scheduled rotation' },
      { action: 'PERMS_UPDATED',actor: 'Alice Chen',   timestamp: '2026-06-01T14:00:00Z', details: 'Added delete permission' },
    ],
  },
  {
    id: 'key_002',
    name: 'Staging Access Token',
    type: 'ACCESS_TOKEN',
    status: 'ACTIVE',
    value: 'at_staging_7f3a...9e2d',
    maskedValue: 'at_staging_••••••9e2d',
    permissions: ['read', 'write'],
    createdAt: '2026-06-10T11:00:00Z',
    expiresAt: '2026-09-10T11:00:00Z',
    lastUsedAt: '2026-08-14T16:45:00Z',
    usageCount: 8_421,
    rateLimit: 5_000,
    owner: { id: 'usr_002', name: 'Bob Martinez', email: 'bob@company.com' },
    environment: 'staging',
    ipWhitelist: [],
    metadata: { service: 'user-service', region: 'eu-west-1' },
    rotationPolicy: { autoRotate: false, intervalDays: null, nextRotation: null },
    auditLog: [
      { action: 'CREATED', actor: 'Bob Martinez', timestamp: '2026-06-10T11:00:00Z', details: 'For integration testing' },
    ],
  },
  {
    id: 'key_003',
    name: 'Mobile App Client Secret',
    type: 'CLIENT_SECRET',
    status: 'ACTIVE',
    value: 'cs_mobile_a4b2...c8f1',
    maskedValue: 'cs_mobile_••••••c8f1',
    permissions: ['read', 'webhook'],
    createdAt: '2026-03-20T08:15:00Z',
    expiresAt: null,
    lastUsedAt: '2026-08-15T09:10:00Z',
    usageCount: 256_000,
    rateLimit: 50_000,
    owner: { id: 'usr_003', name: 'Carol Park', email: 'carol@company.com' },
    environment: 'production',
    ipWhitelist: ['0.0.0.0/0'],
    metadata: { service: 'mobile-app', platform: 'iOS/Android' },
    rotationPolicy: { autoRotate: true, intervalDays: 180, nextRotation: '2026-09-20T08:15:00Z' },
    auditLog: [
      { action: 'CREATED', actor: 'Carol Park', timestamp: '2026-03-20T08:15:00Z', details: 'Mobile app OAuth' },
      { action: 'USED',    actor: 'Mobile App', timestamp: '2026-08-15T09:10:00Z', details: 'Token refresh' },
    ],
  },
  {
    id: 'key_004',
    name: 'Legacy Integration Key',
    type: 'API_KEY',
    status: 'EXPIRED',
    value: 'sk_legacy_9x2k...m4p7',
    maskedValue: 'sk_legacy_••••••m4p7',
    permissions: ['read'],
    createdAt: '2025-05-01T00:00:00Z',
    expiresAt: '2026-05-01T00:00:00Z',
    lastUsedAt: '2026-04-28T22:00:00Z',
    usageCount: 45_200,
    rateLimit: 2_000,
    owner: { id: 'usr_004', name: 'David Kim', email: 'david@company.com' },
    environment: 'production',
    ipWhitelist: ['198.51.100.5'],
    metadata: { service: 'legacy-crm', deprecated: true },
    rotationPolicy: { autoRotate: false, intervalDays: null, nextRotation: null },
    auditLog: [
      { action: 'CREATED',  actor: 'David Kim', timestamp: '2025-05-01T00:00:00Z', details: 'Legacy CRM integration' },
      { action: 'EXPIRED',  actor: 'System',    timestamp: '2026-05-01T00:00:00Z', details: 'Natural expiration' },
    ],
  },
  {
    id: 'key_005',
    name: 'Webhook Signing Key',
    type: 'SIGNING_KEY',
    status: 'ACTIVE',
    value: 'whsec_3k9m...n7q2',
    maskedValue: 'whsec_••••••n7q2',
    permissions: ['webhook'],
    createdAt: '2026-07-01T10:00:00Z',
    expiresAt: null,
    lastUsedAt: '2026-08-15T08:30:00Z',
    usageCount: 12_340,
    rateLimit: null,
    owner: { id: 'usr_005', name: 'Eva Rodriguez', email: 'eva@company.com' },
    environment: 'production',
    ipWhitelist: [],
    metadata: { service: 'webhook-handler', algorithm: 'HMAC-SHA256' },
    rotationPolicy: { autoRotate: true, intervalDays: 365, nextRotation: '2027-07-01T10:00:00Z' },
    auditLog: [
      { action: 'CREATED', actor: 'Eva Rodriguez', timestamp: '2026-07-01T10:00:00Z', details: 'Webhook verification' },
    ],
  },
  {
    id: 'key_006',
    name: 'Dev Testing Token',
    type: 'ACCESS_TOKEN',
    status: 'REVOKED',
    value: 'at_dev_2p5r...s8w3',
    maskedValue: 'at_dev_••••••s8w3',
    permissions: ['read', 'write', 'delete', 'admin'],
    createdAt: '2026-02-10T14:00:00Z',
    expiresAt: '2026-08-10T14:00:00Z',
    lastUsedAt: '2026-07-20T11:00:00Z',
    usageCount: 3_100,
    rateLimit: 1_000,
    owner: { id: 'usr_006', name: 'Frank Liu', email: 'frank@company.com' },
    environment: 'development',
    ipWhitelist: ['127.0.0.1', '::1'],
    metadata: { service: 'dev-testing', temporary: true },
    rotationPolicy: { autoRotate: false, intervalDays: null, nextRotation: null },
    auditLog: [
      { action: 'CREATED',  actor: 'Frank Liu', timestamp: '2026-02-10T14:00:00Z', details: 'Development testing' },
      { action: 'REVOKED',  actor: 'Frank Liu', timestamp: '2026-07-25T09:00:00Z', details: 'No longer needed' },
    ],
  },
  {
    id: 'key_007',
    name: 'Billing Service Key',
    type: 'API_KEY',
    status: 'SUSPENDED',
    value: 'sk_billing_6t1y...v4b8',
    maskedValue: 'sk_billing_••••••v4b8',
    permissions: ['read', 'billing'],
    createdAt: '2026-04-05T07:30:00Z',
    expiresAt: '2027-04-05T07:30:00Z',
    lastUsedAt: '2026-07-30T15:20:00Z',
    usageCount: 67_890,
    rateLimit: 15_000,
    owner: { id: 'usr_007', name: 'Grace Okafor', email: 'grace@company.com' },
    environment: 'production',
    ipWhitelist: ['203.0.113.50', '203.0.113.51'],
    metadata: { service: 'billing-engine', pciCompliant: true },
    rotationPolicy: { autoRotate: true, intervalDays: 90, nextRotation: '2026-10-05T07:30:00Z' },
    auditLog: [
      { action: 'CREATED',    actor: 'Grace Okafor', timestamp: '2026-04-05T07:30:00Z', details: 'Billing integration' },
      { action: 'SUSPENDED',  actor: 'Admin',        timestamp: '2026-08-01T00:00:00Z', details: 'Security review pending' },
    ],
  },
  {
    id: 'key_008',
    name: 'New Service — Pending Approval',
    type: 'API_KEY',
    status: 'PENDING',
    value: 'sk_new_4h7j...z1x5',
    maskedValue: 'sk_new_••••••z1x5',
    permissions: ['read'],
    createdAt: '2026-08-14T16:00:00Z',
    expiresAt: '2027-08-14T16:00:00Z',
    lastUsedAt: null,
    usageCount: 0,
    rateLimit: 1_000,
    owner: { id: 'usr_008', name: 'Hassan Ali', email: 'hassan@company.com' },
    environment: 'staging',
    ipWhitelist: [],
    metadata: { service: 'analytics-pipeline', requestNote: 'Need read access to events table' },
    rotationPolicy: { autoRotate: false, intervalDays: null, nextRotation: null },
    auditLog: [
      { action: 'CREATED', actor: 'Hassan Ali', timestamp: '2026-08-14T16:00:00Z', details: 'Awaiting admin approval' },
    ],
  },
];

// ─────────────────────────────────────────────
// ACTIVITY / AUDIT MOCK DATA
// ─────────────────────────────────────────────

export const mockActivityLog = [
  { id: 'act_001', keyId: 'key_001', action: 'API_CALL',      actor: 'payment-gateway', timestamp: '2026-08-15T10:22:00Z', ip: '203.0.113.12', userAgent: 'Node.js/20', status: 'SUCCESS', endpoint: '/v1/charges', responseTime: 45 },
  { id: 'act_002', keyId: 'key_001', action: 'API_CALL',      actor: 'payment-gateway', timestamp: '2026-08-15T10:21:00Z', ip: '203.0.113.12', userAgent: 'Node.js/20', status: 'SUCCESS', endpoint: '/v1/customers', responseTime: 32 },
  { id: 'act_003', keyId: 'key_002', action: 'API_CALL',      actor: 'integration-test', timestamp: '2026-08-14T16:45:00Z', ip: '198.51.100.20', userAgent: 'Jest/29', status: 'SUCCESS', endpoint: '/v2/users', responseTime: 28 },
  { id: 'act_004', keyId: 'key_003', action: 'TOKEN_REFRESH', actor: 'mobile-app', timestamp: '2026-08-15T09:10:00Z', ip: '203.0.113.88', userAgent: 'iOS/17.5', status: 'SUCCESS', endpoint: '/oauth/token', responseTime: 12 },
  { id: 'act_005', keyId: 'key_007', action: 'API_CALL',      actor: 'billing-engine', timestamp: '2026-07-30T15:20:00Z', ip: '203.0.113.50', userAgent: 'Python/3.11', status: 'RATE_LIMITED', endpoint: '/v1/invoices', responseTime: 0 },
  { id: 'act_006', keyId: 'key_005', action: 'WEBHOOK_DELIVERY', actor: 'stripe', timestamp: '2026-08-15T08:30:00Z', ip: '54.187.174.169', userAgent: 'Stripe/1.0', status: 'SUCCESS', endpoint: '/webhooks/payment', responseTime: 89 },
  { id: 'act_007', keyId: 'key_001', action: 'API_CALL',      actor: 'payment-gateway', timestamp: '2026-08-15T10:20:00Z', ip: '203.0.113.12', userAgent: 'Node.js/20', status: 'UNAUTHORIZED', endpoint: '/v1/refunds', responseTime: 5 },
];

// ─────────────────────────────────────────────
// USAGE STATISTICS MOCK DATA
// ─────────────────────────────────────────────

export const mockUsageStats = {
  key_001: {
    daily: [
      { date: '2026-08-09', calls: 18_200, errors: 12 },
      { date: '2026-08-10', calls: 19_100, errors: 8 },
      { date: '2026-08-11', calls: 17_800, errors: 15 },
      { date: '2026-08-12', calls: 20_500, errors: 5 },
      { date: '2026-08-13', calls: 19_300, errors: 10 },
      { date: '2026-08-14', calls: 18_900, errors: 7 },
      { date: '2026-08-15', calls: 10_773, errors: 3 },
    ],
    topEndpoints: [
      { endpoint: '/v1/charges',        calls: 45_000, pct: 36 },
      { endpoint: '/v1/customers',      calls: 32_000, pct: 26 },
      { endpoint: '/v1/refunds',        calls: 18_000, pct: 14 },
      { endpoint: '/v1/subscriptions',  calls: 15_000, pct: 12 },
      { endpoint: '/v1/invoices',       calls: 14_583, pct: 12 },
    ],
  },
  key_003: {
    daily: [
      { date: '2026-08-09', calls: 38_000, errors: 2 },
      { date: '2026-08-10', calls: 39_500, errors: 1 },
      { date: '2026-08-11', calls: 37_200, errors: 3 },
      { date: '2026-08-12', calls: 40_100, errors: 0 },
      { date: '2026-08-13', calls: 38_800, errors: 2 },
      { date: '2026-08-14', calls: 39_200, errors: 1 },
      { date: '2026-08-15', calls: 23_200, errors: 0 },
    ],
    topEndpoints: [
      { endpoint: '/oauth/token',       calls: 180_000, pct: 70 },
      { endpoint: '/v2/user/profile',   calls: 45_000, pct: 18 },
      { endpoint: '/v2/user/settings',  calls: 31_000, pct: 12 },
    ],
  },
};

// ─────────────────────────────────────────────
// ENVIRONMENT OPTIONS
// ─────────────────────────────────────────────

export const ENVIRONMENTS = [
  { id: 'production',  label: 'Production',  color: '#dc2626', description: 'Live customer-facing environment' },
  { id: 'staging',     label: 'Staging',     color: '#ea580c', description: 'Pre-production testing' },
  { id: 'development', label: 'Development', color: '#16a34a', description: 'Local / dev sandbox' },
  { id: 'testing',     label: 'Testing',     color: '#2563eb', description: 'CI / automated tests' },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Get status metadata by status ID
 */
export const getStatusMeta = (statusId) => {
  return KEY_STATUS[statusId] || KEY_STATUS.INACTIVE;
};

/**
 * Get key type metadata by type ID
 */
export const getTypeMeta = (typeId) => {
  return KEY_TYPE[typeId] || { label: typeId, description: '' };
};

/**
 * Get environment metadata by env ID
 */
export const getEnvMeta = (envId) => {
  return ENVIRONMENTS.find(e => e.id === envId) || ENVIRONMENTS[0];
};

/**
 * Mask a key value, showing only last N characters
 */
export const maskKey = (value, visibleChars = 6) => {
  if (!value || value.length <= visibleChars + 4) return value;
  const prefix = value.slice(0, 4);
  const suffix = value.slice(-visibleChars);
  return `${prefix}••••••${suffix}`;
};

/**
 * Format a key value for display (copy-friendly)
 */
export const formatKeyDisplay = (value) => {
  if (!value) return '';
  return value.length > 32 ? `${value.slice(0, 16)}…${value.slice(-8)}` : value;
};

/**
 * Check if a key is currently active and usable
 */
export const isKeyUsable = (key) => {
  if (key.status !== 'ACTIVE') return false;
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return false;
  return true;
};

/**
 * Get days until expiration
 */
export const getDaysUntilExpiry = (key) => {
  if (!key.expiresAt) return Infinity;
  const diff = new Date(key.expiresAt) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Get expiration urgency level
 */
export const getExpiryUrgency = (key) => {
  const days = getDaysUntilExpiry(key);
  if (days === Infinity) return 'none';
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'safe';
};

/**
 * Format usage count with commas
 */
export const formatUsage = (count) => {
  if (count === null || count === undefined) return '—';
  return count.toLocaleString();
};

/**
 * Format date relative (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Filter keys by search query, status, type, environment
 */
export const filterKeys = (keys, { query = '', status = 'all', type = 'all', env = 'all' }) => {
  return keys.filter(key => {
    const matchesQuery = !query ||
      key.name.toLowerCase().includes(query.toLowerCase()) ||
      key.id.toLowerCase().includes(query.toLowerCase()) ||
      key.owner.name.toLowerCase().includes(query.toLowerCase()) ||
      key.owner.email.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'all' || key.status === status;
    const matchesType = type === 'all' || key.type === type;
    const matchesEnv = env === 'all' || key.environment === env;
    return matchesQuery && matchesStatus && matchesType && matchesEnv;
  });
};

/**
 * Sort keys by field and direction
 */
export const sortKeys = (keys, { field = 'createdAt', direction = 'desc' }) => {
  const sorted = [...keys].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];
    if (field === 'owner') { aVal = a.owner.name; bVal = b.owner.name; }
    if (field === 'usageCount') { aVal = aVal || 0; bVal = bVal || 0; }
    if (typeof aVal === 'string') {
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (aVal === null) return direction === 'asc' ? -1 : 1;
    if (bVal === null) return direction === 'asc' ? 1 : -1;
    return direction === 'asc' ? aVal - bVal : bVal - aVal;
  });
  return sorted;
};

/**
 * Get activity log for a specific key
 */
export const getKeyActivity = (keyId) => {
  return mockActivityLog.filter(a => a.keyId === keyId);
};

/**
 * Get usage stats for a specific key
 */
export const getKeyUsageStats = (keyId) => {
  return mockUsageStats[keyId] || null;
};

/**
 * Get permission labels from permission IDs
 */
export const getPermissionLabels = (permIds) => {
  return permIds
    .map(id => KEY_PERMISSIONS.find(p => p.id === id))
    .filter(Boolean)
    .map(p => p.label);
};

/**
 * Generate a new mock key (for create simulation)
 */
export const generateMockKey = (partial = {}) => ({
  id: `key_${Math.random().toString(36).slice(2, 8).padStart(3, '0')}`,
  name: partial.name || 'New Key',
  type: partial.type || 'API_KEY',
  status: 'PENDING',
  value: `sk_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 8)}`,
  maskedValue: '',
  permissions: partial.permissions || ['read'],
  createdAt: new Date().toISOString(),
  expiresAt: null,
  lastUsedAt: null,
  usageCount: 0,
  rateLimit: partial.rateLimit || 1000,
  owner: partial.owner || { id: 'usr_000', name: 'Unknown', email: '' },
  environment: partial.environment || 'development',
  ipWhitelist: partial.ipWhitelist || [],
  metadata: partial.metadata || {},
  rotationPolicy: { autoRotate: false, intervalDays: null, nextRotation: null },
  auditLog: [{ action: 'CREATED', actor: partial.owner?.name || 'System', timestamp: new Date().toISOString(), details: 'Key created' }],
  ...partial,
});

/**
 * Get summary statistics for the key collection
 */
export const getKeySummary = (keys = mockKeys) => {
  const total = keys.length;
  const active = keys.filter(k => k.status === 'ACTIVE').length;
  const expired = keys.filter(k => k.status === 'EXPIRED').length;
  const revoked = keys.filter(k => k.status === 'REVOKED').length;
  const pending = keys.filter(k => k.status === 'PENDING').length;
  const suspended = keys.filter(k => k.status === 'SUSPENDED').length;
  const totalUsage = keys.reduce((sum, k) => sum + (k.usageCount || 0), 0);
  const expiringSoon = keys.filter(k => {
    const days = getDaysUntilExpiry(k);
    return days !== Infinity && days > 0 && days <= 7;
  }).length;

  return {
    total,
    active,
    expired,
    revoked,
    pending,
    suspended,
    inactive: total - active,
    totalUsage,
    expiringSoon,
    byType: Object.fromEntries(
      Object.keys(KEY_TYPE).map(t => [t, keys.filter(k => k.type === t).length])
    ),
    byEnvironment: Object.fromEntries(
      ENVIRONMENTS.map(e => [e.id, keys.filter(k => k.environment === e.id).length])
    ),
  };
};

/**
 * Simulate key rotation (returns updated key)
 */
export const rotateKey = (key, actor = 'System') => {
  const newValue = `sk_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    ...key,
    value: newValue,
    maskedValue: maskKey(newValue),
    lastRotatedAt: new Date().toISOString(),
    auditLog: [
      ...key.auditLog,
      { action: 'ROTATED', actor, timestamp: new Date().toISOString(), details: 'Manual key rotation' },
    ],
  };
};

/**
 * Simulate key revocation
 */
export const revokeKey = (key, actor = 'System', reason = '') => {
  return {
    ...key,
    status: 'REVOKED',
    auditLog: [
      ...key.auditLog,
      { action: 'REVOKED', actor, timestamp: new Date().toISOString(), details: reason || 'Key revoked' },
    ],
  };
};
