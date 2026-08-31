/* src/app/admin/rbac/ApiKeyModal.jsx */
import { useState } from 'react';
import { X, Check, Key, Copy, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { permissionCategories } from './data';

const environments = [
  { key: 'production', label: 'Production' },
  { key: 'staging', label: 'Staging' },
  { key: 'development', label: 'Development' },
];

export default function ApiKeyModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    environment: 'production',
    scopes: [],
    expiresIn: '90', // days
    rateLimit: '1000',
  });
  const [generatedKey, setGeneratedKey] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleScope = (scopeKey) => {
    if (scopeKey === '*') {
      setForm(prev => ({
        ...prev,
        scopes: prev.scopes.includes('*') ? [] : ['*'],
      }));
      return;
    }
    setForm(prev => {
      if (prev.scopes.includes('*')) return { ...prev, scopes: [scopeKey] };
      return {
        ...prev,
        scopes: prev.scopes.includes(scopeKey)
          ? prev.scopes.filter(s => s !== scopeKey)
          : [...prev.scopes, scopeKey],
      };
    });
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    const prefix = form.environment === 'production' ? 'pk_live_' : 'pk_test_';
    const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const key = `${prefix}${random}`;
    
    setGeneratedKey({
      ...form,
      id: `key-${Date.now().toString(36)}`,
      keyFull: key,
      keyPrefix: `${key.slice(0, 12)}...`,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: form.expiresIn ? new Date(Date.now() + parseInt(form.expiresIn) * 86400000).toISOString().split('T')[0] : null,
      lastUsedAt: null,
      createdBy: 'You',
      usageCount: 0,
    });
  };

  const handleSave = () => {
    if (!generatedKey) return;
    onSave(generatedKey);
    onClose();
  };

  const allPerms = permissionCategories.flatMap(c => c.permissions.map(p => p.key));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Key className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Create API Key</h3>
              <p className="text-xs text-text-muted">Generate a new API key with scoped permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!generatedKey ? (
          <form onSubmit={handleGenerate} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Key Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Production Webhook"
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Environment</label>
                  <select
                    value={form.environment}
                    onChange={(e) => update('environment', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {environments.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Expires In</label>
                  <select
                    value={form.expiresIn}
                    onChange={(e) => update('expiresIn', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                    <option value="">Never</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Rate Limit</label>
                  <select
                    value={form.rateLimit}
                    onChange={(e) => update('rateLimit', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="100">100/min</option>
                    <option value="1000">1,000/min</option>
                    <option value="5000">5,000/min</option>
                    <option value="10000">10,000/min</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scopes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Scopes</h4>
                <button
                  type="button"
                  onClick={() => toggleScope('*')}
                  className={cn(
                    'text-xs font-medium',
                    form.scopes.includes('*') ? 'text-danger' : 'text-secondary hover:underline'
                  )}
                >
                  {form.scopes.includes('*') ? 'Clear All' : 'Grant All'}
                </button>
              </div>
              
              <div className="space-y-2">
                {permissionCategories.map((cat) => (
                  <div key={cat.key} className="rounded-lg border border-border bg-surface p-3">
                    <p className="text-xs font-semibold text-text-secondary mb-2">{cat.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.permissions.map((perm) => (
                        <button
                          key={perm.key}
                          type="button"
                          onClick={() => toggleScope(perm.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                            form.scopes.includes(perm.key) || form.scopes.includes('*')
                              ? 'bg-accent/10 text-accent border-accent/30'
                              : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                          )}
                        >
                          {(form.scopes.includes(perm.key) || form.scopes.includes('*')) && <Check className="h-3 w-3" />}
                          {perm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="secondary">
                <Key className="mr-1.5 h-4 w-4" /> Generate Key
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6">
            {/* Key Reveal */}
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Key className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-text-primary">API Key Generated</h4>
                <p className="text-sm text-text-secondary">Copy this key now. You won't be able to see it again.</p>
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <code className="rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono text-text-primary break-all max-w-md">
                  {showKey ? generatedKey.keyFull : generatedKey.keyPrefix}
                </code>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedKey.keyFull)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Store this key securely. It cannot be retrieved later.</span>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Name</span>
                <span className="text-text-primary font-medium">{generatedKey.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Environment</span>
                <span className="text-text-primary capitalize">{generatedKey.environment}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Scopes</span>
                <span className="text-text-primary">{generatedKey.scopes.includes('*') ? 'All permissions' : `${generatedKey.scopes.length} permissions`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Expires</span>
                <span className="text-text-primary">{generatedKey.expiresAt || 'Never'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setGeneratedKey(null)}>
                Regenerate
              </Button>
              <Button variant="secondary" onClick={handleSave}>
                <Check className="mr-1.5 h-4 w-4" /> Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}