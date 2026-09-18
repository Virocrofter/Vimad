/* src/app/admin/rbac/page.jsx — wired to api/rbac.ts (Phase 3D) */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Key,
  Globe,
  Plus,
  Search,
  ArrowLeft,
  SlidersHorizontal,
  Download,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '../../../hooks/useApiMutation';
import { useToast } from '../../../hooks/use-toast';
import { useApiError } from '../../../hooks/useApiError';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getSSOConfigs,
  createSSOConfig,
  updateSSOConfig,
  deleteSSOConfig,
} from '../../../api/rbac';
import { api } from '../../../api/client';
// Static reference metadata only (labels, permission catalogue, helpers).
// All entity data (roles/keys/SSO/users) now comes from the API.
import { permissionCategories, getKeyStatus } from './data';
import {
  RoleCard,
  PermissionMatrixRow,
  ApiKeyRow,
  SSOCard,
  RbacStatCard,
  UserAssignmentRow,
} from './components';
import RoleModal from './RoleModal';
import ApiKeyModal from './ApiKeyModal';
import SSOModal from './SSOModal';

/* ─── Admin user endpoints (thin wrapper — add to api/rbac.ts when backend lands) ─── */
const getAdminUsers = () => api.get('/admin/rbac/users');
const assignUserRole = (userId, roleId) =>
  api.patch(`/admin/rbac/users/${userId}/role`, { roleId });

/* ─── Normalizers: map API shapes → the shapes the existing components expect ─── */
const normalizeRole = (r) => ({
  userCount: 0,
  description: '',
  ...r,
  permissions: r.permissions ?? [],
});

const normalizeKey = (k) => ({
  rateLimit: '1000/min',
  environment: 'production',
  usageCount: 0,
  ...k,
  scopes: k.scopes ?? [],
  // Full secret is only available at creation time; otherwise show prefix only.
  keyFull: k.keyFull ?? k.keyPrefix,
});

const ssoProviderNames = {
  google: 'Google Workspace',
  microsoft: 'Microsoft Entra ID',
  okta: 'Okta',
  saml: 'SAML 2.0',
  custom: 'Custom SSO',
};

const normalizeSSO = (s) => ({
  ...s,
  name: s.name ?? ssoProviderNames[s.provider] ?? s.provider,
  status: s.enabled ? 'active' : 'inactive',
  domains: s.domains ?? (s.domain ? [s.domain] : []),
  forceSSO: s.forceSSO ?? false,
  userCount: s.userCount ?? 0,
  syncErrors: s.syncErrors ?? 0,
  lastSyncAt: s.lastSyncAt ?? null,
});

const normalizeUser = (u) => ({
  ...u,
  name: u.name ?? [u.firstName, u.lastName].filter(Boolean).join(' ') ?? u.email,
  lastActive: u.lastActive ?? u.lastLoginAt ?? null,
});

export default function AdminRbacPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('roles');
  const [search, setSearch] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSSOModal, setShowSSOModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingSSO, setEditingSSO] = useState(null);

  /* ─── Data fetching ─── */
  const rolesQuery = useApiFetch(async () => {
    const res = await getRoles({ pageSize: 100 });
    return (res?.data ?? res ?? []).map(normalizeRole);
  }, []);

  const keysQuery = useApiFetch(async () => {
    const res = await getApiKeys({ pageSize: 100 });
    return (res?.data ?? res ?? []).map(normalizeKey);
  }, []);

  const ssoQuery = useApiFetch(async () => {
    const res = await getSSOConfigs();
    return (Array.isArray(res) ? res : (res?.data ?? [])).map(normalizeSSO);
  }, []);

  const usersQuery = useApiFetch(async () => {
    const res = await getAdminUsers();
    return (res?.data ?? res ?? []).map(normalizeUser);
  }, []);

  useApiError(rolesQuery.error);
  useApiError(keysQuery.error);
  useApiError(ssoQuery.error);
  useApiError(usersQuery.error);

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const keys = useMemo(() => keysQuery.data ?? [], [keysQuery.data]);
  const ssos = useMemo(() => ssoQuery.data ?? [], [ssoQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  const pageLoading =
    rolesQuery.loading || keysQuery.loading || ssoQuery.loading || usersQuery.loading;

  /* ─── Mutations ─── */
  const { mutate: saveRole, loading: savingRole } = useApiMutation(
    (role) =>
      role.id && !String(role.id).startsWith('role-custom-')
        ? updateRole(role.id, role)
        : roles.some((r) => r.id === role.id)
          ? updateRole(role.id, role)
          : createRole(role),
    {
      onSuccess: () => {
        toast({ title: 'Role saved' });
        rolesQuery.refetch();
        setShowRoleModal(false);
        setEditingRole(null);
      },
      onError: (err) =>
        toast({ title: 'Failed to save role', description: err.message, variant: 'destructive' }),
    }
  );

  const { mutate: removeRole } = useApiMutation((role) => deleteRole(role.id), {
    onSuccess: () => {
      toast({ title: 'Role deleted' });
      rolesQuery.refetch();
    },
    onError: (err) =>
      toast({ title: 'Failed to delete role', description: err.message, variant: 'destructive' }),
  });

  const { mutate: generateKey, loading: generatingKey } = useApiMutation(
    (form) =>
      createApiKey({
        name: form.name,
        scopes: form.scopes,
        environment: form.environment,
        expiresAt: form.expiresIn
          ? new Date(Date.now() + parseInt(form.expiresIn, 10) * 86400000).toISOString()
          : undefined,
      }),
    {
      onSuccess: () => keysQuery.refetch(),
      onError: (err) =>
        toast({
          title: 'Failed to create API key',
          description: err.message,
          variant: 'destructive',
        }),
    }
  );

  const { mutate: revokeKey } = useApiMutation(
    (key) => revokeApiKey(key.id, 'Revoked from admin console'),
    {
      onSuccess: () => {
        toast({ title: 'API key revoked' });
        keysQuery.refetch();
      },
      onError: (err) =>
        toast({ title: 'Failed to revoke key', description: err.message, variant: 'destructive' }),
    }
  );

  const { mutate: regenerateKey } = useApiMutation(
    // Backend rotates the secret; response carries the new secret once.
    (key) => api.post(`/admin/rbac/api-keys/${key.id}/regenerate`),
    {
      onSuccess: (res) => {
        if (res?.secret) {
          navigator.clipboard?.writeText(res.secret).catch(() => {});
          toast({ title: 'Key regenerated', description: 'New secret copied to clipboard.' });
        } else {
          toast({ title: 'Key regenerated' });
        }
        keysQuery.refetch();
      },
      onError: (err) =>
        toast({
          title: 'Failed to regenerate key',
          description: err.message,
          variant: 'destructive',
        }),
    }
  );

  const { mutate: saveSSO, loading: savingSSO } = useApiMutation(
    ({ id, ...form }) =>
      id
        ? updateSSOConfig(id, {
            provider: form.providerType,
            clientId: form.clientId,
            domain: form.issuerUrl || undefined,
            enabled: form.isEnabled,
          })
        : createSSOConfig({
            provider: form.providerType,
            clientId: form.clientId,
            domain: form.issuerUrl || undefined,
            enabled: form.isEnabled,
            autoProvision: true,
            defaultRole: 'role-readonly',
          }),
    {
      onSuccess: () => {
        toast({ title: 'SSO configuration saved' });
        ssoQuery.refetch();
        setShowSSOModal(false);
        setEditingSSO(null);
      },
      onError: (err) =>
        toast({
          title: 'Failed to save SSO config',
          description: err.message,
          variant: 'destructive',
        }),
    }
  );

  const { mutate: toggleSSO } = useApiMutation(
    (provider) => updateSSOConfig(provider.id, { enabled: provider.status !== 'active' }),
    {
      onSuccess: () => ssoQuery.refetch(),
      onError: (err) =>
        toast({ title: 'Failed to update SSO', description: err.message, variant: 'destructive' }),
    }
  );

  const { mutate: removeSSO } = useApiMutation((provider) => deleteSSOConfig(provider.id), {
    onSuccess: () => {
      toast({ title: 'SSO provider deleted' });
      ssoQuery.refetch();
    },
    onError: (err) =>
      toast({ title: 'Failed to delete SSO', description: err.message, variant: 'destructive' }),
  });

  const { mutate: changeUserRole } = useApiMutation(
    ({ userId, roleId }) => assignUserRole(userId, roleId),
    {
      onSuccess: () => {
        toast({ title: 'Role assigned' });
        usersQuery.refetch();
      },
      onError: (err) =>
        toast({ title: 'Failed to assign role', description: err.message, variant: 'destructive' }),
    }
  );

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const activeKeys = keys.filter((k) => getKeyStatus(k) === 'active').length;
    const revokedKeys = keys.filter((k) => getKeyStatus(k) === 'revoked').length;
    const expiredKeys = keys.filter((k) => getKeyStatus(k) === 'expired').length;
    const activeSSO = ssos.filter((s) => s.status === 'active').length;
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;

    return [
      {
        label: 'Total Roles',
        value: roles.length,
        subtext: `${roles.filter((r) => r.type === 'custom').length} custom`,
        icon: Shield,
        color: 'text-secondary',
      },
      {
        label: 'Active API Keys',
        value: activeKeys,
        subtext: `${revokedKeys} revoked · ${expiredKeys} expired`,
        icon: Key,
        color: 'text-accent',
      },
      {
        label: 'SSO Providers',
        value: activeSSO,
        subtext: `${ssos.length - activeSSO} inactive`,
        icon: Globe,
        color: 'text-info',
      },
      {
        label: 'Admin Users',
        value: totalUsers,
        subtext: `${activeUsers} active`,
        icon: Users,
        color: 'text-warning',
      },
    ];
  }, [roles, keys, ssos, users]);

  /* ─── Filters ─── */
  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) => r.name?.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)
    );
  }, [roles, search]);

  const filteredKeys = useMemo(() => {
    if (!search) return keys;
    const q = search.toLowerCase();
    return keys.filter((k) => k.name?.toLowerCase().includes(q) || k.id.toLowerCase().includes(q));
  }, [keys, search]);

  const filteredSSOs = useMemo(() => {
    if (!search) return ssos;
    const q = search.toLowerCase();
    return ssos.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.provider?.toLowerCase().includes(q)
    );
  }, [ssos, search]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  /* ─── Handlers ─── */
  const handleDeleteRole = (role) => {
    if (role.isLocked) return;
    if (window.confirm(`Delete role "${role.name}"? This will affect ${role.userCount} users.`)) {
      removeRole(role);
    }
  };

  const handleRevokeKey = (key) => {
    if (window.confirm(`Revoke API key "${key.name}"? This cannot be undone.`)) revokeKey(key);
  };

  const handleRegenerateKey = (key) => {
    if (
      window.confirm(
        `Regenerate API key "${key.name}"? The old key will be invalidated immediately.`
      )
    )
      regenerateKey(key);
  };

  const handleDeleteSSO = (provider) => {
    if (
      window.confirm(
        `Delete SSO provider "${provider.name}"? Users will no longer be able to sign in via this provider.`
      )
    )
      removeSSO(provider);
  };

  const handleSyncSSO = useCallback(
    async (provider) => {
      try {
        await api.post(`/admin/rbac/sso/${provider.id}/sync`);
        toast({ title: `Sync started for ${provider.name}` });
        ssoQuery.refetch();
      } catch (err) {
        toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
      }
    },
    [toast, ssoQuery]
  );

  const tabs = [
    { id: 'roles', label: 'Roles', icon: Shield, count: roles.length },
    { id: 'api-keys', label: 'API Keys', icon: Key, count: keys.length },
    { id: 'sso', label: 'SSO', icon: Globe, count: ssos.length },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
  ];

  const refetchAll = () => {
    rolesQuery.refetch();
    keysQuery.refetch();
    ssoQuery.refetch();
    usersQuery.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Access Control</h1>
            <p className="text-sm text-text-secondary">
              Roles, API keys, SSO, and user permissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetchAll} disabled={pageLoading}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', pageLoading && 'animate-spin')} /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <RbacStatCard key={i} {...stat} />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive ? 'text-secondary' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  isActive ? 'bg-secondary/10 text-secondary' : 'bg-border text-text-muted'
                )}
              >
                {tab.count}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-secondary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab.replace('-', ' ')}...`}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'roles' && (
            <Button
              onClick={() => {
                setEditingRole(null);
                setShowRoleModal(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create Role
            </Button>
          )}
          {activeTab === 'api-keys' && (
            <Button onClick={() => setShowApiKeyModal(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create API Key
            </Button>
          )}
          {activeTab === 'sso' && (
            <Button
              onClick={() => {
                setEditingSSO(null);
                setShowSSOModal(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add SSO
            </Button>
          )}
        </div>
      </div>

      {/* Loading / error states */}
      {pageLoading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-12 text-sm text-text-muted">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading access control data…
        </div>
      )}

      {/* Roles Tab */}
      {!pageLoading && activeTab === 'roles' && (
        <div className="space-y-6">
          {/* System Roles */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-info" /> System Roles
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoles
                .filter((r) => r.type === 'system')
                .map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onEdit={(r) => {
                      setEditingRole(r);
                      setShowRoleModal(true);
                    }}
                    onDelete={handleDeleteRole}
                    onAssign={() => setActiveTab('users')}
                  />
                ))}
            </div>
          </div>

          {/* Custom Roles */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-secondary" /> Custom Roles
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoles
                .filter((r) => r.type === 'custom')
                .map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onEdit={(r) => {
                      setEditingRole(r);
                      setShowRoleModal(true);
                    }}
                    onDelete={handleDeleteRole}
                    onAssign={() => setActiveTab('users')}
                  />
                ))}
              {filteredRoles.filter((r) => r.type === 'custom').length === 0 && (
                <p className="text-sm text-text-muted col-span-full py-6 text-center">
                  No custom roles yet.
                </p>
              )}
            </div>
          </div>

          {/* Permission Reference */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Shield className="h-4 w-4 text-secondary" /> Permission Reference
              </h3>
              <span className="text-xs text-text-muted">
                {permissionCategories.length} categories
              </span>
            </div>
            <div className="p-4 space-y-2">
              {permissionCategories.map((cat) => (
                <PermissionMatrixRow
                  key={cat.key}
                  category={cat}
                  rolePermissions={[]}
                  onToggle={() => {}}
                  readOnly={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {!pageLoading && activeTab === 'api-keys' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Scopes
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredKeys.map((key) => (
                  <ApiKeyRow
                    key={key.id}
                    apiKey={key}
                    onRevoke={handleRevokeKey}
                    onRegenerate={handleRegenerateKey}
                    onView={(k) =>
                      window.alert(
                        `Key: ${k.name}\nPrefix: ${k.keyPrefix}\nScopes: ${k.scopes.join(', ')}`
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
          {filteredKeys.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Key className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No API keys found.</p>
            </div>
          )}
        </div>
      )}

      {/* SSO Tab */}
      {!pageLoading && activeTab === 'sso' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSSOs.map((provider) => (
            <SSOCard
              key={provider.id}
              provider={provider}
              onEdit={(p) => {
                setEditingSSO({
                  id: p.id,
                  providerType: p.provider,
                  displayName: p.name,
                  clientId: p.clientId ?? '',
                  issuerUrl: p.domain ?? '',
                  isEnabled: p.status === 'active',
                });
                setShowSSOModal(true);
              }}
              onToggle={(p) => toggleSSO(p)}
              onSync={handleSyncSSO}
              onDelete={handleDeleteSSO}
            />
          ))}
          {filteredSSOs.length === 0 && (
            <div className="col-span-full px-4 py-12 text-center rounded-xl border border-border bg-surface">
              <Globe className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No SSO providers configured.</p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {!pageLoading && activeTab === 'users' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <UserAssignmentRow
                    key={user.id}
                    user={user}
                    roles={roles}
                    onRoleChange={(userId, roleId) => changeUserRole({ userId, roleId })}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm text-text-muted">No users found.</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showRoleModal && (
        <RoleModal
          role={editingRole}
          loading={savingRole}
          onClose={() => {
            setShowRoleModal(false);
            setEditingRole(null);
          }}
          onSave={saveRole}
        />
      )}
      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onGenerate={generateKey}
          generating={generatingKey}
        />
      )}
      {showSSOModal && (
        <SSOModal
          isOpen={showSSOModal}
          onClose={() => {
            setShowSSOModal(false);
            setEditingSSO(null);
          }}
          ssoConfig={editingSSO}
          onSave={saveSSO}
          saving={savingSSO}
        />
      )}
    </div>
  );
}
