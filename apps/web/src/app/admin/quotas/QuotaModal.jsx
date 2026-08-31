/* src/app/admin/quotas/QuotaModal.jsx */
import { useState, useEffect } from 'react';
import { X, Check, Zap, Tag, Building2, Globe, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { resourceMeta, actionMeta, periodMeta } from './data';

const resources = Object.keys(resourceMeta);
const scopes = [
  { id: 'plan', label: 'Subscription Plan', icon: Tag },
  { id: 'tenant', label: 'Specific Tenant', icon: Building2 },
  { id: 'global', label: 'Global (All Tenants)', icon: Globe },
];
const actions = Object.keys(actionMeta);
const periods = Object.keys(periodMeta);
const plans = ['Starter', 'Professional', 'Enterprise'];

export default function QuotaModal({ rule, onClose, onSave, tenants }) {
  const isEditing = !!rule;
  const [form, setForm] = useState({
    name: '',
    description: '',
    resource: 'api_calls',
    scope: 'plan',
    scopeTarget: 'Starter',
    limit: 25000,
    unit: 'calls',
    period: 'monthly',
    action: 'throttle',
    throttleRate: 10,
    overageEnabled: false,
    overageRate: 0,
    overageCap: 0,
    warnThreshold: 80,
    hardLimit: 100,
    enabled: true,
  });

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name || '',
        description: rule.description || '',
        resource: rule.resource || 'api_calls',
        scope: rule.scope || 'plan',
        scopeTarget: rule.scopeTarget || '',
        limit: rule.limit || 0,
        unit: rule.unit || 'calls',
        period: rule.period || 'monthly',
        action: rule.action || 'throttle',
        throttleRate: rule.throttleRate || 10,
        overageEnabled: rule.overageEnabled || false,
        overageRate: rule.overageRate || 0,
        overageCap: rule.overageCap || 0,
        warnThreshold: rule.warnThreshold || 80,
        hardLimit: rule.hardLimit || 100,
        enabled: rule.enabled !== false,
      });
    }
  }, [rule]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleResourceChange = (resource) => {
    update('resource', resource);
    const unitMap = { api_calls: 'calls', storage: 'GB', rooms: 'rooms', users: 'users' };
    update('unit', unitMap[resource] || 'units');
  };

  const handleScopeChange = (scope) => {
    update('scope', scope);
    if (scope === 'plan') update('scopeTarget', 'Starter');
    else if (scope === 'tenant') update('scopeTarget', tenants?.[0]?.id || '');
    else update('scopeTarget', null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: rule?.id || `QR-${Date.now().toString(36).toUpperCase()}`,
      createdAt: rule?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Zap className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">{isEditing ? 'Edit Quota Rule' : 'Create Quota Rule'}</h3>
              <p className="text-xs text-text-muted">{isEditing ? rule.id : 'Define limits and enforcement'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Rule Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. API Requests — Starter Plan"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={2}
                placeholder="What does this quota control?"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Resource Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Resource Type</label>
            <div className="grid grid-cols-4 gap-3">
              {resources.map((res) => {
                const meta = resourceMeta[res];
                const active = form.resource === res;
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => handleResourceChange(res)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-3 text-left transition-all',
                      active ? 'border-secondary bg-secondary/5' : 'border-border bg-surface hover:border-secondary/30'
                    )}
                  >
                    <div className={cn('h-2 w-2 rounded-full', meta.color.replace('text-', 'bg-'))} />
                    <span className={cn('text-sm font-medium', active ? 'text-secondary' : 'text-text-primary')}>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Scope</label>
            <div className="grid grid-cols-3 gap-3">
              {scopes.map((s) => {
                const Icon = s.icon;
                const active = form.scope === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleScopeChange(s.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                      active ? 'border-secondary bg-secondary/5' : 'border-border bg-surface hover:border-secondary/30'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', active ? 'text-secondary' : 'text-text-muted')} />
                    <div>
                      <p className={cn('text-sm font-medium', active ? 'text-secondary' : 'text-text-primary')}>{s.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scope Target */}
            {form.scope === 'plan' && (
              <div className="grid grid-cols-3 gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => update('scopeTarget', plan)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      form.scopeTarget === plan
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            )}
            {form.scope === 'tenant' && (
              <select
                value={form.scopeTarget || ''}
                onChange={(e) => update('scopeTarget', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {tenants?.map((t) => (
                  <option key={t.id} value={t.id}>{t.id} — {t.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Limit & Period */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Limit Configuration</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Limit Value</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.limit}
                  onChange={(e) => update('limit', parseInt(e.target.value) || 0)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Unit</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => update('unit', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Period</label>
                <select
                  value={form.period}
                  onChange={(e) => update('period', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>{periodMeta[p].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Warn Threshold (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={form.warnThreshold}
                    onChange={(e) => update('warnThreshold', parseInt(e.target.value))}
                    className="flex-1 accent-secondary"
                  />
                  <span className="text-sm font-mono font-medium text-text-primary w-10 text-right">{form.warnThreshold}%</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Hard Limit (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="100"
                    max="200"
                    value={form.hardLimit}
                    onChange={(e) => update('hardLimit', parseInt(e.target.value))}
                    className="flex-1 accent-danger"
                  />
                  <span className="text-sm font-mono font-medium text-text-primary w-10 text-right">{form.hardLimit}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Enforcement Action</label>
            <div className="grid grid-cols-3 gap-3">
              {actions.map((act) => {
                const meta = actionMeta[act];
                const active = form.action === act;
                return (
                  <button
                    key={act}
                    type="button"
                    onClick={() => update('action', act)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-all',
                      active ? cn(meta.class, 'border-current') : 'border-border bg-surface hover:bg-surface-elevated'
                    )}
                  >
                    <p className={cn('text-sm font-medium', active ? meta.class.split(' ')[1] : 'text-text-primary')}>{meta.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{meta.desc}</p>
                  </button>
                );
              })}
            </div>
            {form.action === 'throttle' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Throttle Rate (requests/sec)</label>
                <input
                  type="number"
                  min="1"
                  value={form.throttleRate || ''}
                  onChange={(e) => update('throttleRate', parseInt(e.target.value) || null)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}
          </div>

          {/* Overage Billing */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Overage Billing</h4>
                <p className="text-xs text-text-muted mt-0.5">Charge tenants for usage beyond the limit</p>
              </div>
              <button
                type="button"
                onClick={() => update('overageEnabled', !form.overageEnabled)}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  form.overageEnabled ? 'bg-accent' : 'bg-border'
                )}
              >
                <span className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                  form.overageEnabled ? 'translate-x-6' : 'translate-x-1'
                )} />
              </button>
            </div>

            {form.overageEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Rate per Unit ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={form.overageRate}
                    onChange={(e) => update('overageRate', parseFloat(e.target.value) || 0)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">Monthly Cap ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.overageCap}
                    onChange={(e) => update('overageCap', parseFloat(e.target.value) || 0)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Enable Rule</p>
              <p className="text-xs text-text-muted">{form.enabled ? 'Rule is actively enforced' : 'Rule is disabled'}</p>
            </div>
            <button
              type="button"
              onClick={() => update('enabled', !form.enabled)}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                form.enabled ? 'bg-accent' : 'bg-border'
              )}
            >
              <span className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                form.enabled ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" /> {isEditing ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
