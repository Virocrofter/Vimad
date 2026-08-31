/* src/app/admin/rbac/data.js */

/* ─── System Roles ─── */
export const systemRoles = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    description:
      'Full platform access. Can manage tenants, billing, system settings, and all admin functions.',
    type: 'system',
    isDefault: false,
    isLocked: true,
    userCount: 3,
    permissions: ['*'], // wildcard = all
    createdAt: '2025-01-01',
    updatedAt: '2026-08-15',
    createdBy: 'System',
  },
  {
    id: 'role-platform-admin',
    name: 'Platform Admin',
    description:
      'Manage tenants, feature flags, health monitoring, and platform-wide settings. No billing access.',
    type: 'system',
    isDefault: false,
    isLocked: true,
    userCount: 8,
    permissions: [
      'tenant:read',
      'tenant:create',
      'tenant:update',
      'tenant:delete',
      'tenant:suspend',
      'feature_flag:read',
      'feature_flag:create',
      'feature_flag:update',
      'feature_flag:delete',
      'health:read',
      'health:alert:manage',
      'analytics:read',
      'audit:read',
      'user:read',
      'user:update',
      'settings:read',
      'settings:update',
    ],
    createdAt: '2025-01-01',
    updatedAt: '2026-08-10',
    createdBy: 'System',
  },
  {
    id: 'role-billing-admin',
    name: 'Billing Admin',
    description: 'Manage subscriptions, invoices, payment methods, and revenue reporting.',
    type: 'system',
    isDefault: false,
    isLocked: true,
    userCount: 4,
    permissions: [
      'tenant:read',
      'billing:read',
      'billing:update',
      'billing:refund',
      'billing:invoice:manage',
      'analytics:read',
      'analytics:revenue',
      'report:read',
    ],
    createdAt: '2025-01-01',
    updatedAt: '2026-08-12',
    createdBy: 'System',
  },
  {
    id: 'role-support-agent',
    name: 'Support Agent',
    description:
      'View tenant details, respond to support tickets, and access read-only health data.',
    type: 'system',
    isDefault: false,
    isLocked: false,
    userCount: 12,
    permissions: [
      'tenant:read',
      'support:read',
      'support:update',
      'support:escalate',
      'health:read',
      'user:read',
    ],
    createdAt: '2025-01-01',
    updatedAt: '2026-08-14',
    createdBy: 'System',
  },
  {
    id: 'role-readonly',
    name: 'Read-Only',
    description:
      'View-only access to tenants, analytics, and health dashboards. Cannot modify anything.',
    type: 'system',
    isDefault: true,
    isLocked: true,
    userCount: 6,
    permissions: [
      'tenant:read',
      'analytics:read',
      'health:read',
      'audit:read',
      'report:read',
      'user:read',
    ],
    createdAt: '2025-01-01',
    updatedAt: '2026-08-01',
    createdBy: 'System',
  },
];

/* ─── Custom Roles ─── */
export const customRoles = [
  {
    id: 'role-custom-onboarding',
    name: 'Onboarding Specialist',
    description: 'Manages new tenant onboarding, trial conversions, and initial setup assistance.',
    type: 'custom',
    isDefault: false,
    isLocked: false,
    userCount: 5,
    permissions: [
      'tenant:read',
      'tenant:create',
      'tenant:update',
      'tenant:onboarding:manage',
      'feature_flag:read',
      'support:read',
      'support:update',
      'analytics:read',
    ],
    createdAt: '2026-03-15',
    updatedAt: '2026-07-20',
    createdBy: 'Sarah Jenkins',
  },
  {
    id: 'role-custom-security',
    name: 'Security Auditor',
    description:
      'Access to audit logs, security reports, and compliance dashboards. Read-only for most systems.',
    type: 'custom',
    isDefault: false,
    isLocked: false,
    userCount: 2,
    permissions: [
      'audit:read',
      'audit:export',
      'tenant:read',
      'security:read',
      'security:report',
      'user:read',
      'health:read',
    ],
    createdAt: '2026-05-10',
    updatedAt: '2026-06-22',
    createdBy: 'Robert Chen',
  },
];

/* ─── Permission Definitions ─── */
export const permissionCategories = [
  {
    key: 'tenant',
    label: 'Tenant Management',
    description: 'Manage properties, subscriptions, and tenant lifecycle',
    permissions: [
      { key: 'tenant:read', label: 'View Tenants', description: 'View tenant list and details' },
      {
        key: 'tenant:create',
        label: 'Create Tenants',
        description: 'Add new tenants to the platform',
      },
      {
        key: 'tenant:update',
        label: 'Edit Tenants',
        description: 'Modify tenant settings and plans',
      },
      { key: 'tenant:delete', label: 'Delete Tenants', description: 'Permanently remove tenants' },
      {
        key: 'tenant:suspend',
        label: 'Suspend/Reactivate',
        description: 'Pause or restore tenant access',
      },
      {
        key: 'tenant:onboarding:manage',
        label: 'Onboarding',
        description: 'Manage onboarding workflows',
      },
    ],
  },
  {
    key: 'feature_flag',
    label: 'Feature Flags',
    description: 'Control feature rollouts and targeting',
    permissions: [
      {
        key: 'feature_flag:read',
        label: 'View Flags',
        description: 'View feature flag configurations',
      },
      { key: 'feature_flag:create', label: 'Create Flags', description: 'Add new feature flags' },
      {
        key: 'feature_flag:update',
        label: 'Edit Flags',
        description: 'Modify rollout and targeting',
      },
      { key: 'feature_flag:delete', label: 'Delete Flags', description: 'Remove feature flags' },
    ],
  },
  {
    key: 'billing',
    label: 'Billing & Revenue',
    description: 'Manage payments, invoices, and subscriptions',
    permissions: [
      { key: 'billing:read', label: 'View Billing', description: 'Access billing dashboards' },
      { key: 'billing:update', label: 'Edit Billing', description: 'Modify subscription details' },
      { key: 'billing:refund', label: 'Process Refunds', description: 'Issue refunds to tenants' },
      {
        key: 'billing:invoice:manage',
        label: 'Manage Invoices',
        description: 'Create and edit invoices',
      },
    ],
  },
  {
    key: 'health',
    label: 'System Health',
    description: 'Monitor platform performance and alerts',
    permissions: [
      { key: 'health:read', label: 'View Health', description: 'Access health dashboards' },
      { key: 'health:alert:manage', label: 'Manage Alerts', description: 'Configure alert rules' },
    ],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Platform-wide analytics and reporting',
    permissions: [
      {
        key: 'analytics:read',
        label: 'View Analytics',
        description: 'Access analytics dashboards',
      },
      {
        key: 'analytics:revenue',
        label: 'Revenue Reports',
        description: 'View revenue breakdowns',
      },
    ],
  },
  {
    key: 'audit',
    label: 'Audit & Compliance',
    description: 'Track changes and ensure compliance',
    permissions: [
      { key: 'audit:read', label: 'View Audit Log', description: 'Access audit trail' },
      { key: 'audit:export', label: 'Export Audit', description: 'Export audit data' },
    ],
  },
  {
    key: 'user',
    label: 'User Management',
    description: 'Manage admin users and their access',
    permissions: [
      { key: 'user:read', label: 'View Users', description: 'View user list' },
      { key: 'user:create', label: 'Create Users', description: 'Add new admin users' },
      { key: 'user:update', label: 'Edit Users', description: 'Modify user roles and details' },
      { key: 'user:delete', label: 'Delete Users', description: 'Remove admin users' },
    ],
  },
  {
    key: 'rbac',
    label: 'RBAC & Permissions',
    description: 'Manage roles, permissions, and access control',
    permissions: [
      { key: 'rbac:read', label: 'View RBAC', description: 'View roles and permissions' },
      { key: 'rbac:manage', label: 'Manage RBAC', description: 'Create and edit roles' },
      {
        key: 'rbac:api_key:manage',
        label: 'Manage API Keys',
        description: 'Create and revoke API keys',
      },
      { key: 'rbac:sso:manage', label: 'Manage SSO', description: 'Configure SSO providers' },
    ],
  },
  {
    key: 'settings',
    label: 'Platform Settings',
    description: 'Global platform configuration',
    permissions: [
      { key: 'settings:read', label: 'View Settings', description: 'View platform settings' },
      {
        key: 'settings:update',
        label: 'Edit Settings',
        description: 'Modify platform configuration',
      },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    description: 'Handle support tickets and escalations',
    permissions: [
      { key: 'support:read', label: 'View Tickets', description: 'Access support tickets' },
      { key: 'support:update', label: 'Update Tickets', description: 'Respond and update tickets' },
      { key: 'support:escalate', label: 'Escalate', description: 'Escalate to engineering' },
    ],
  },
  {
    key: 'security',
    label: 'Security',
    description: 'Security operations and incident response',
    permissions: [
      { key: 'security:read', label: 'View Security', description: 'Access security dashboards' },
      {
        key: 'security:report',
        label: 'Security Reports',
        description: 'Generate security reports',
      },
    ],
  },
  {
    key: 'report',
    label: 'Reports',
    description: 'Platform reporting and data exports',
    permissions: [
      { key: 'report:read', label: 'View Reports', description: 'Access generated reports' },
      { key: 'report:export', label: 'Export Reports', description: 'Export report data' },
    ],
  },
];

/* ─── API Keys ─── */
export const apiKeys = [
  {
    id: 'key-001',
    name: 'Production Webhook',
    keyPrefix: 'pk_live_...',
    keyFull: 'pk_live_51NzQ9xK8LpM2vJdE4R5tY6uI7oP8aQ9bS0cD1fG2hJ3kL4mN5',
    scopes: ['tenant:read', 'billing:read', 'analytics:read'],
    status: 'active',
    createdAt: '2026-01-15',
    expiresAt: '2027-01-15',
    lastUsedAt: '2026-08-16 14:32:00',
    createdBy: 'Robert Chen',
    usageCount: 284720,
    rateLimit: '1000/min',
    environment: 'production',
  },
  {
    id: 'key-002',
    name: 'Staging Integration',
    keyPrefix: 'pk_test_...',
    keyFull: 'pk_test_51NzQ9xK8LpM2vJdE4R5tY6uI7oP8aQ9bS0cD1fG2hJ3kL4mN5_test',
    scopes: ['*'],
    status: 'active',
    createdAt: '2026-03-20',
    expiresAt: '2026-12-31',
    lastUsedAt: '2026-08-16 12:15:00',
    createdBy: 'DevOps Team',
    usageCount: 45230,
    rateLimit: '5000/min',
    environment: 'staging',
  },
  {
    id: 'key-003',
    name: 'Analytics Pipeline',
    keyPrefix: 'pk_live_...',
    keyFull: 'pk_live_71PzR2xM9NpO4vKdF6S7uV8wX9yZ0bA1cD2eF3gH4iJ5kL6mN7',
    scopes: ['analytics:read', 'report:read', 'tenant:read'],
    status: 'active',
    createdAt: '2026-05-01',
    expiresAt: '2027-05-01',
    lastUsedAt: '2026-08-16 14:28:00',
    createdBy: 'Maria Garcia',
    usageCount: 892100,
    rateLimit: '10000/min',
    environment: 'production',
  },
  {
    id: 'key-004',
    name: 'Legacy Channel Manager',
    keyPrefix: 'pk_live_...',
    keyFull: 'pk_live_91XzT4vP1QrS6wMdG8U9yW2xZ3aB4cD5eF6gH7iJ8kL9mN0oP1',
    scopes: ['tenant:read', 'tenant:update', 'feature_flag:read'],
    status: 'revoked',
    createdAt: '2025-08-10',
    expiresAt: '2026-08-10',
    lastUsedAt: '2026-07-30 09:45:00',
    createdBy: 'James Miller',
    usageCount: 124500,
    rateLimit: '1000/min',
    environment: 'production',
    revokedAt: '2026-08-01',
    revokedBy: 'Security Team',
    revokeReason: 'Migrated to new integration',
  },
  {
    id: 'key-005',
    name: 'Mobile App Backend',
    keyPrefix: 'pk_live_...',
    keyFull: 'pk_live_11AbC3dE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3xY4zA5bC6dE7',
    scopes: ['tenant:read', 'billing:read', 'support:read', 'user:read'],
    status: 'active',
    createdAt: '2026-06-15',
    expiresAt: '2027-06-15',
    lastUsedAt: '2026-08-16 14:30:00',
    createdBy: 'David Park',
    usageCount: 567800,
    rateLimit: '5000/min',
    environment: 'production',
  },
  {
    id: 'key-006',
    name: 'CI/CD Deployment',
    keyPrefix: 'pk_test_...',
    keyFull: 'pk_test_21BcD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8',
    scopes: ['feature_flag:read', 'feature_flag:update', 'health:read'],
    status: 'active',
    createdAt: '2026-04-01',
    expiresAt: null,
    lastUsedAt: '2026-08-16 14:00:00',
    createdBy: 'DevOps Team',
    usageCount: 23400,
    rateLimit: '100/min',
    environment: 'staging',
  },
];

/* ─── SSO Providers ─── */
export const ssoProviders = [
  {
    id: 'sso-google',
    name: 'Google Workspace',
    provider: 'google',
    status: 'active',
    clientId: '1084923423456-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com',
    domains: ['unifiedpms.com', 'vimad.io'],
    autoProvision: true,
    defaultRole: 'role-readonly',
    forceSSO: false,
    createdAt: '2025-01-10',
    updatedAt: '2026-08-01',
    lastSyncAt: '2026-08-16 14:00:00',
    syncErrors: 0,
    userCount: 24,
  },
  {
    id: 'sso-microsoft',
    name: 'Microsoft Entra ID',
    provider: 'microsoft',
    status: 'active',
    clientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    domains: ['unifiedpms.com'],
    autoProvision: true,
    defaultRole: 'role-readonly',
    forceSSO: true,
    createdAt: '2025-03-15',
    updatedAt: '2026-07-20',
    lastSyncAt: '2026-08-16 13:55:00',
    syncErrors: 0,
    userCount: 18,
  },
  {
    id: 'sso-okta',
    name: 'Okta (Enterprise)',
    provider: 'okta',
    status: 'active',
    clientId: '0oa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5',
    domains: ['vimad.io', 'partner-hotels.com'],
    autoProvision: false,
    defaultRole: 'role-support-agent',
    forceSSO: false,
    createdAt: '2026-01-20',
    updatedAt: '2026-08-10',
    lastSyncAt: '2026-08-16 14:05:00',
    syncErrors: 2,
    userCount: 7,
    metadataUrl: 'https://vimad.okta.com/app/exk1234567890abcdef/sso/saml/metadata',
  },
  {
    id: 'sso-saml-custom',
    name: 'Corporate SAML',
    provider: 'saml',
    status: 'inactive',
    clientId: 'vimad-corp-saml-2026',
    domains: ['corp.vimad.io'],
    autoProvision: false,
    defaultRole: 'role-readonly',
    forceSSO: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
    lastSyncAt: null,
    syncErrors: 0,
    userCount: 0,
    metadataUrl: 'https://idp.corp.vimad.io/metadata.xml',
  },
];

/* ─── Admin Users (for assignment) ─── */
export const adminUsers = [
  {
    id: 'usr-001',
    name: 'Robert Chen',
    email: 'robert@unifiedpms.com',
    role: 'role-super-admin',
    status: 'active',
    lastActive: '2026-08-16 14:32',
  },
  {
    id: 'usr-002',
    name: 'Sarah Jenkins',
    email: 'sarah@unifiedpms.com',
    role: 'role-platform-admin',
    status: 'active',
    lastActive: '2026-08-16 13:45',
  },
  {
    id: 'usr-003',
    name: 'Mike Torres',
    email: 'mike@unifiedpms.com',
    role: 'role-billing-admin',
    status: 'active',
    lastActive: '2026-08-16 12:20',
  },
  {
    id: 'usr-004',
    name: 'Lisa Wong',
    email: 'lisa@unifiedpms.com',
    role: 'role-custom-onboarding',
    status: 'active',
    lastActive: '2026-08-16 11:15',
  },
  {
    id: 'usr-005',
    name: 'James Miller',
    email: 'james@unifiedpms.com',
    role: 'role-support-agent',
    status: 'active',
    lastActive: '2026-08-16 10:30',
  },
  {
    id: 'usr-006',
    name: 'Maria Garcia',
    email: 'maria@unifiedpms.com',
    role: 'role-custom-security',
    status: 'active',
    lastActive: '2026-08-15 16:00',
  },
  {
    id: 'usr-007',
    name: 'David Park',
    email: 'david@unifiedpms.com',
    role: 'role-readonly',
    status: 'active',
    lastActive: '2026-08-16 09:45',
  },
  {
    id: 'usr-008',
    name: 'Amanda Wilson',
    email: 'amanda@unifiedpms.com',
    role: 'role-platform-admin',
    status: 'suspended',
    lastActive: '2026-08-10 14:00',
  },
];

/* ─── Metadata ─── */
export const roleTypeMeta = {
  system: { label: 'System', color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  custom: {
    label: 'Custom',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
};

export const apiKeyStatusMeta = {
  active: { label: 'Active', dot: 'bg-accent', class: 'bg-accent/10 text-accent border-accent/20' },
  revoked: {
    label: 'Revoked',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
  expired: {
    label: 'Expired',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
};

export const ssoProviderMeta = {
  google: { label: 'Google', icon: 'Globe', color: 'text-red-500', bg: 'bg-red-500/10' },
  microsoft: {
    label: 'Microsoft',
    icon: 'Building2',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  okta: { label: 'Okta', icon: 'Shield', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  saml: { label: 'SAML 2.0', icon: 'KeyRound', color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

export const environmentMeta = {
  production: { label: 'Production', color: 'text-accent', bg: 'bg-accent/10' },
  staging: { label: 'Staging', color: 'text-warning', bg: 'bg-warning/10' },
  development: { label: 'Development', color: 'text-info', bg: 'bg-info/10' },
};

/* ─── Helpers ─── */
export function getPermissionLabel(key) {
  for (const cat of permissionCategories) {
    const perm = cat.permissions.find((p) => p.key === key);
    if (perm) return perm.label;
  }
  return key;
}

export function getPermissionCategory(key) {
  return key.split(':')[0];
}

export function formatKeyDate(dateStr) {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getKeyStatus(key) {
  if (key.status === 'revoked') return 'revoked';
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'expired';
  return 'active';
}
