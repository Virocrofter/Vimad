/* src/app/admin/rbac/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, Key, Globe, Plus, Search, Filter, BarChart3,
  Activity, Lock, Unlock, Zap, CheckCircle2, AlertTriangle,
  ChevronRight, RefreshCw, Trash2, Edit3, Eye, ArrowLeft,
  SlidersHorizontal, Download, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  systemRoles, customRoles, apiKeys, ssoProviders, adminUsers,
  permissionCategories, roleTypeMeta, apiKeyStatusMeta, environmentMeta,
  getKeyStatus, getPermissionLabel
} from './data';
import {
  RoleCard, RoleTypeBadge, PermissionMatrixRow, ApiKeyRow,
  SSOCard, RbacStatCard, UserAssignmentRow
} from './components';
import RoleModal from './RoleModal';
import ApiKeyModal from './ApiKeyModal';
import SSOModal from './SSOModal';

const tabs = [
  { id: 'roles', label: 'Roles', icon: Shield, count: () => systemRoles.length + customRoles.length },
  { id: 'api-keys', label: 'API Keys', icon: Key, count: () => apiKeys.length },
  { id: 'sso', label: 'SSO', icon: Globe, count: () => ssoProviders.length },
  { id: 'users', label: 'Users', icon: Users, count: () => adminUsers.length },
];

export default function AdminRbacPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('roles');
  const [search, setSearch] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSSOModal, setShowSSOModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingSSO, setEditingSSO] = useState(null);
  const [roles, setRoles] = useState([...systemRoles, ...customRoles]);
  const [keys, setKeys] = useState(apiKeys);
  const [ssos, setSSOs] = useState(ssoProviders);
  const [users, setUsers] = useState(adminUsers);
  const [expandedRole, setExpandedRole] = useState(null);

  // Stats
  const stats = useMemo(() => {
    const activeKeys = keys.filter(k => getKeyStatus(k) === 'active').length;
    const revokedKeys = keys.filter(k => getKeyStatus(k) === 'revoked').length;
    const expiredKeys = keys.filter(k => getKeyStatus(k) === 'expired').length;
    const activeSSO = ssos.filter(s => s.status === 'active').length;
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;

    return [
      { label: 'Total Roles', value: roles.length, subtext: `${roles.filter(r => r.type === 'custom').length} custom`, icon: Shield, color: 'text-secondary', trend: 12 },
      { label: 'Active API Keys', value: activeKeys, subtext: `${revokedKeys} revoked · ${expiredKeys} expired`, icon: Key, color: 'text-accent', trend: 8 },
      { label: 'SSO Providers', value: activeSSO, subtext: `${ssos.length - activeSSO} inactive`, icon: Globe, color: 'text-info', trend: 0 },
      { label: 'Admin Users', value: totalUsers, subtext: `${activeUsers} active`, icon: Users, color: 'text-warning', trend: -2 },
    ];
  }, [roles, keys, ssos, users]);

  // Filtered data
  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [roles, search]);

  const filteredKeys = useMemo(() => {
    if (!search) return keys;
    const q = search.toLowerCase();
    return keys.filter(k => k.name.toLowerCase().includes(q) || k.id.toLowerCase().includes(q));
  }, [keys, search]);

  const filteredSSOs = useMemo(() => {
    if (!search) return ssos;
    const q = search.toLowerCase();
    return ssos.filter(s => s.name.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q));
  }, [ssos, search]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  // Actions
  const handleSaveRole = (role) => {
    setRoles(prev => {
      const idx = prev.findIndex(r => r.id === role.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = role;
        return next;
      }
      return [...prev, role];
    });
    setShowRoleModal(false);
    setEditingRole(null);
  };

  const handleDeleteRole = (role) => {
    if (role.isLocked) return;
    if (confirm(`Delete role "${role.name}"? This will affect ${role.userCount} users.`)) {
      setRoles(prev => prev.filter(r => r.id !== role.id));
    }
  };

  const handleSaveKey = (key) => {
    setKeys(prev => [...prev, key]);
    setShowApiKeyModal(false);
  };

  const handleRevokeKey = (key) => {
    if (confirm(`Revoke API key "${key.name}"? This cannot be undone.`)) {
      setKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: 'revoked', revokedAt: new Date().toISOString(), revokedBy: 'You' } : k));
    }
  };

  const handleRegenerateKey = (key) => {
    if (confirm(`Regenerate API key "${key.name}"? The old key will be invalidated immediately.`)) {
      const prefix = key.environment === 'production' ? 'pk_live_' : 'pk_test_';
      const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      setKeys(prev => prev.map(k => k.id === key.id ? {
        ...k,
        keyFull: `${prefix}${random}`,
        keyPrefix: `${prefix}${random.slice(0, 12)}...`,
        createdAt: new Date().toISOString().split('T')[0],
        usageCount: 0,
        lastUsedAt: null,
      } : k));
    }
  };

  const handleToggleSSO = (provider) => {
    setSSOs(prev => prev.map(s => s.id === provider.id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s));
  };

  const handleSaveSSO = (sso) => {
    setSSOs(prev => {
      const idx = prev.findIndex(s => s.id === sso.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...sso, updatedAt: new Date().toISOString().split('T')[0] };
        return next;
      }
      return [...prev, { ...sso, id: `sso-${Date.now().toString(36)}`, createdAt: new Date().toISOString().split('T')[0], userCount: 0, syncErrors: 0 }];
    });
    setShowSSOModal(false);
    setEditingSSO(null);
  };

  const handleDeleteSSO = (provider) => {
    if (confirm(`Delete SSO provider "${provider.name}"? Users will no longer be able to sign in via this provider.`)) {
      setSSOs(prev => prev.filter(s => s.id !== provider.id));
    }
  };

  const handleUserRoleChange = (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleSyncSSO = (provider) => {
    alert(`Syncing ${provider.name}... (mock)`);
  };

  const activeTabConfig = tabs.find(t => t.id === activeTab);
  const ActiveIcon = activeTabConfig?.icon || Shield;

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
            <p className="text-sm text-text-secondary">Roles, API keys, SSO, and user permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                isActive
                  ? 'text-secondary'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                isActive ? 'bg-secondary/10 text-secondary' : 'bg-border text-text-muted'
              )}>
                {tab.count()}
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
            <Button onClick={() => { setEditingRole(null); setShowRoleModal(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Role
            </Button>
          )}
          {activeTab === 'api-keys' && (
            <Button onClick={() => setShowApiKeyModal(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create API Key
            </Button>
          )}
          {activeTab === 'sso' && (
            <Button onClick={() => { setEditingSSO(null); setShowSSOModal(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> Add SSO
            </Button>
          )}
        </div>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* System Roles */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-info" /> System Roles
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoles.filter(r => r.type === 'system').map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={(r) => { setEditingRole(r); setShowRoleModal(true); }}
                  onDelete={handleDeleteRole}
                  onAssign={(r) => setActiveTab('users')}
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
              {filteredRoles.filter(r => r.type === 'custom').map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={(r) => { setEditingRole(r); setShowRoleModal(true); }}
                  onDelete={handleDeleteRole}
                  onAssign={(r) => setActiveTab('users')}
                />
              ))}
            </div>
          </div>

          {/* Permission Reference */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Shield className="h-4 w-4 text-secondary" /> Permission Reference
              </h3>
              <span className="text-xs text-text-muted">{permissionCategories.length} categories</span>
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
      {activeTab === 'api-keys' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Key</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Scopes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Usage</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Last Used</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Expires</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredKeys.map((key) => (
                  <ApiKeyRow
                    key={key.id}
                    apiKey={key}
                    onRevoke={handleRevokeKey}
                    onRegenerate={handleRegenerateKey}
                    onView={(k) => alert(`Key: ${k.name}\\nFull: ${k.keyFull}\\nScopes: ${k.scopes.join(', ')}`)}
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
      {activeTab === 'sso' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSSOs.map((provider) => (
            <SSOCard
              key={provider.id}
              provider={provider}
              onEdit={(p) => { setEditingSSO(p); setShowSSOModal(true); }}
              onToggle={handleToggleSSO}
              onSync={handleSyncSSO}
              onDelete={handleDeleteSSO}
            />
          ))}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => (
                  <UserAssignmentRow
                    key={user.id}
                    user={user}
                    roles={roles}
                    onRoleChange={handleUserRoleChange}
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
          onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
          onSave={handleSaveRole}
        />
      )}
      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => setShowApiKeyModal(false)}
          onSave={handleSaveKey}
        />
      )}
      {showSSOModal && (
        <SSOModal
          isOpen={showSSOModal}
          onClose={() => { setShowSSOModal(false); setEditingSSO(null); }}
          ssoConfig={editingSSO}
          onSave={handleSaveSSO}
        />
      )}
    </div>
  );
}
