/* src/app/admin/rbac/RoleModal.jsx — wired: async onSave, loading state (Phase 3D) */
import { useState } from 'react';
import { X, Check, Shield, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
// Static permission catalogue (reference metadata, not mock entities)
import { permissionCategories } from './data';
import { PermissionMatrixRow } from './components';

export default function RoleModal({ role, onClose, onSave, loading = false }) {
  const isEditing = !!role;
  const [form, setForm] = useState({
    name: '',
    description: '',
    permissions: [],
    isDefault: false,
  });

  const [prevRole, setPrevRole] = useState(null);
  if (role !== prevRole) {
    setPrevRole(role);
    if (role) {
      setForm({
        name: role.name || '',
        description: role.description || '',
        permissions: [...(role.permissions || [])],
        isDefault: role.isDefault || false,
      });
    }
  }

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const togglePermission = (key) => {
    if (form.permissions.includes('*')) return; // wildcard blocks individual toggles
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const toggleWildcard = () => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes('*') ? [] : ['*'],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Parent calls createRole/updateRole via useApiMutation and closes on success.
    await onSave({
      ...form,
      id: role?.id,
      type: role?.type ?? 'custom',
      isLocked: role?.isLocked ?? false,
      tenantId: role?.tenantId,
    });
  };

  const allPermissions = permissionCategories.flatMap((c) => c.permissions.map((p) => p.key));
  const grantedCount = form.permissions.includes('*')
    ? allPermissions.length
    : form.permissions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Shield className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Role' : 'Create Custom Role'}
              </h3>
              <p className="text-xs text-text-muted">{grantedCount} permissions granted</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Role Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Marketing Manager"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={2}
                placeholder="What does this role do?"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Wildcard Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Full Access (Wildcard)</p>
              <p className="text-xs text-text-muted">
                Grants all permissions across all categories
              </p>
            </div>
            <button
              type="button"
              onClick={toggleWildcard}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                form.permissions.includes('*') ? 'bg-danger' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                  form.permissions.includes('*') ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Permission Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Permission Matrix
            </h4>
            {permissionCategories.map((category) => (
              <PermissionMatrixRow
                key={category.key}
                category={category}
                rolePermissions={form.permissions}
                onToggle={togglePermission}
                readOnly={form.permissions.includes('*')}
              />
            ))}
          </div>

          {/* Default Role Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Default Role for New Users</p>
              <p className="text-xs text-text-muted">
                Automatically assign this role to new admin sign-ups
              </p>
            </div>
            <button
              type="button"
              onClick={() => update('isDefault', !form.isDefault)}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                form.isDefault ? 'bg-accent' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                  form.isDefault ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-4 w-4" />
              )}
              {isEditing ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
