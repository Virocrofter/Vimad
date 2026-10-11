// apps/web/src/app/admin/rbac/page.jsx
// Wired to the real backend: /v1/rbac (roles + permissions) and /v1/api-keys.
// SSO tab removed — no backend in v1 (flag: adminSecurity).

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getRoles,
  createRole,
  deleteRole,
  getPermissions,
  getApiKeys,
  createApiKey,
  revokeApiKey,
} from '@/api/rbac';

const permLabel = (p) => (typeof p === 'string' ? p : p.key || p.name || p.id);

export default function AdminRbacPage() {
  const [tab, setTab] = useState('roles');
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Roles & Access</h1>
        <p className="mt-1 text-sm text-gray-500">Manage staff roles, permissions, and API keys.</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['roles', 'api-keys'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'roles' ? 'Roles' : 'API Keys'}
          </button>
        ))}
      </div>

      {tab === 'roles' ? <RolesTab /> : <ApiKeysTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

function RolesTab() {
  const qc = useQueryClient();
  const roles = useQuery({ queryKey: ['admin-roles'], queryFn: getRoles });
  const permissions = useQuery({ queryKey: ['admin-permissions'], queryFn: getPermissions });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState([]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-roles'] });

  const create = useMutation({
    mutationFn: () =>
      createRole({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: selected,
      }),
    onSuccess: () => {
      setName('');
      setDescription('');
      setSelected([]);
      invalidate();
    },
  });

  const remove = useMutation({ mutationFn: deleteRole, onSuccess: invalidate });

  const toggle = (key) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-gray-200 bg-white">
        <header className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Existing roles</h2>
        </header>
        {roles.isLoading && <p className="p-4 text-sm text-gray-500">Loading…</p>}
        {roles.isError && (
          <p className="p-4 text-sm text-red-600">Failed to load roles: {roles.error?.message}</p>
        )}
        <ul className="divide-y divide-gray-100">
          {(roles.data ?? []).map((role) => (
            <li key={role.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{role.name}</p>
                {role.description && <p className="text-xs text-gray-500">{role.description}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {(role.permissions ?? []).length} permission(s)
                  {typeof role.userCount === 'number' ? ` · ${role.userCount} user(s)` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Delete role "${role.name}"?`)) remove.mutate(role.id);
                }}
                disabled={remove.isPending}
                className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          ))}
          {roles.data?.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-400">No roles yet.</li>
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <header className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Create role</h2>
        </header>
        <form
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
        >
          <div>
            <label className="block text-xs font-medium text-gray-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Night Manager"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Permissions</label>
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
              {permissions.isLoading && (
                <p className="text-xs text-gray-400">Loading permissions…</p>
              )}
              {(permissions.data ?? []).map((p) => {
                const key = permLabel(p);
                return (
                  <label key={key} className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={selected.includes(key)}
                      onChange={() => toggle(key)}
                    />
                    <span className="font-mono">{key}</span>
                    {p.description && <span className="text-gray-400">— {p.description}</span>}
                  </label>
                );
              })}
              {permissions.data?.length === 0 && (
                <p className="text-xs text-gray-400">No permissions returned by the API.</p>
              )}
            </div>
          </div>
          {create.isError && (
            <p className="text-xs text-red-600">Create failed: {create.error?.message}</p>
          )}
          <button
            type="submit"
            disabled={create.isPending || !name.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create role'}
          </button>
        </form>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

function ApiKeysTab() {
  const qc = useQueryClient();
  const keys = useQuery({ queryKey: ['admin-api-keys'], queryFn: getApiKeys });
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-api-keys'] });

  const create = useMutation({
    mutationFn: () => createApiKey({ name: name.trim() }),
    onSuccess: (data) => {
      setName('');
      setNewKey(data?.key ?? null);
      invalidate();
    },
  });

  const revoke = useMutation({ mutationFn: revokeApiKey, onSuccess: invalidate });

  return (
    <div className="space-y-6">
      <form
        className="flex items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) create.mutate();
        }}
      >
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700">New key name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. Channel manager sync"
          />
        </div>
        <button
          type="submit"
          disabled={create.isPending || !name.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {create.isPending ? 'Creating…' : 'Create key'}
        </button>
      </form>

      {newKey && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            Copy this key now — it will not be shown again:
          </p>
          <code className="mt-2 block break-all rounded bg-white px-3 py-2 font-mono text-xs">
            {newKey}
          </code>
        </div>
      )}
      {create.isError && (
        <p className="text-xs text-red-600">Create failed: {create.error?.message}</p>
      )}

      <section className="rounded-lg border border-gray-200 bg-white">
        {keys.isLoading && <p className="p-4 text-sm text-gray-500">Loading…</p>}
        {keys.isError && (
          <p className="p-4 text-sm text-red-600">Failed to load API keys: {keys.error?.message}</p>
        )}
        <ul className="divide-y divide-gray-100">
          {(keys.data ?? []).map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{k.name}</p>
                <p className="text-xs text-gray-400">
                  {k.prefix ? <span className="font-mono">{k.prefix}…</span> : null}
                  {k.createdAt ? ` · created ${new Date(k.createdAt).toLocaleDateString()}` : ''}
                  {k.lastUsedAt
                    ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                    : ''}
                  {k.revokedAt ? ' · revoked' : ''}
                </p>
              </div>
              {!k.revokedAt && (
                <button
                  onClick={() => {
                    if (window.confirm(`Revoke key "${k.name}"? This cannot be undone.`))
                      revoke.mutate(k.id);
                  }}
                  disabled={revoke.isPending}
                  className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
          {keys.data?.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-400">No API keys yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
