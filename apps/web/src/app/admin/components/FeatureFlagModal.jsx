/* src/app/admin/components/FeatureFlagModal.jsx */
import { useState } from 'react';
import { X, Check, ToggleLeft, Percent, Building2, Globe, Tag } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { flagCategoryMeta, impactMeta, regions, plans } from '../data';

const rolloutTypes = [
  {
    id: 'percentage',
    label: 'Percentage Rollout',
    icon: Percent,
    desc: 'Gradually release to X% of tenants',
  },
  { id: 'plan', label: 'Plan-Based', icon: Tag, desc: 'Enable for specific subscription plans' },
  {
    id: 'tenant',
    label: 'Tenant Allowlist',
    icon: Building2,
    desc: 'Enable only for specific tenants',
  },
  {
    id: 'region',
    label: 'Region-Based',
    icon: Globe,
    desc: 'Enable for specific geographic regions',
  },
];

export default function FeatureFlagModal({ flag, onClose, onSave, tenants }) {
  const isEditing = !!flag;
  const [form, setForm] = useState({
    name: flag?.name || '',
    label: flag?.label || '',
    description: flag?.description || '',
    status: flag?.status || 'inactive',
    category: flag?.category || 'guest-experience',
    impact: flag?.impact || 'medium',
    rollout: flag?.rollout || { type: 'percentage', value: 0 },
    targeting: flag?.targeting || { tenants: [], plans: [], regions: [] },
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateRollout = (key, value) =>
    setForm((prev) => ({ ...prev, rollout: { ...prev.rollout, [key]: value } }));
  const updateTargeting = (key, value) =>
    setForm((prev) => ({ ...prev, targeting: { ...prev.targeting, [key]: value } }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: flag?.id || `FF-${Date.now().toString(36).toUpperCase()}`,
      createdAt: flag?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      createdBy: flag?.createdBy || 'Admin',
      history: flag?.history || [
        { date: new Date().toISOString().split('T')[0], action: 'Flag created', user: 'Admin' },
      ],
    });
    onClose();
  };

  const toggleArrayValue = (arr, val) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10">
              <ToggleLeft className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Feature Flag' : 'Create Feature Flag'}
              </h3>
              <p className="text-xs text-text-muted">
                {isEditing ? flag.id : 'Configure rollout and targeting rules'}
              </p>
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
                Flag Name (slug)
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. new-dashboard-ui"
                required
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Display Label
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => update('label', e.target.value)}
                placeholder="e.g. New Dashboard UI"
                required
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="What does this flag control?"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Category & Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(flagCategoryMeta).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Impact Level
              </label>
              <select
                value={form.impact}
                onChange={(e) => update('impact', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(impactMeta).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rollout Type */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Rollout Strategy
            </label>
            <div className="grid grid-cols-2 gap-3">
              {rolloutTypes.map((type) => {
                const Icon = type.icon;
                const active = form.rollout.type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateRollout('type', type.id)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
                      active
                        ? 'border-danger bg-danger/5'
                        : 'border-border bg-surface hover:border-secondary/30'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 mt-0.5',
                        active ? 'text-danger' : 'text-text-muted'
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          'text-sm font-medium',
                          active ? 'text-danger' : 'text-text-primary'
                        )}
                      >
                        {type.label}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{type.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rollout Config */}
          {form.rollout.type === 'percentage' && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-3 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Rollout Percentage
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.rollout.value || 0}
                  onChange={(e) => updateRollout('value', parseInt(e.target.value))}
                  className="flex-1 accent-danger"
                />
                <span className="text-lg font-bold font-mono text-text-primary w-16 text-right">
                  {form.rollout.value || 0}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-danger transition-all"
                  style={{ width: `${form.rollout.value || 0}%` }}
                />
              </div>
            </div>
          )}

          {form.rollout.type === 'plan' && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-3 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Target Plans
              </label>
              <div className="flex flex-wrap gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() =>
                      updateTargeting('plans', toggleArrayValue(form.targeting.plans, plan))
                    }
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      form.targeting.plans.includes(plan)
                        ? 'bg-danger/10 text-danger border-danger/30'
                        : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {form.targeting.plans.includes(plan) && <Check className="h-3 w-3 mr-1" />}
                    {plan}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.rollout.type === 'tenant' && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-3 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Tenant Allowlist
              </label>
              <div className="max-h-48 overflow-auto space-y-1">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() =>
                      updateTargeting(
                        'tenants',
                        toggleArrayValue(form.targeting.tenants, tenant.id)
                      )
                    }
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      form.targeting.tenants.includes(tenant.id)
                        ? 'bg-danger/5 text-danger'
                        : 'text-text-secondary hover:bg-background'
                    )}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                        form.targeting.tenants.includes(tenant.id)
                          ? 'bg-danger border-danger'
                          : 'border-border'
                      )}
                    >
                      {form.targeting.tenants.includes(tenant.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="font-mono text-xs text-text-muted">{tenant.id}</span>
                    <span className="flex-1 truncate">{tenant.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.rollout.type === 'region' && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-3 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Target Regions
              </label>
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() =>
                      updateTargeting('regions', toggleArrayValue(form.targeting.regions, region))
                    }
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      form.targeting.regions.includes(region)
                        ? 'bg-danger/10 text-danger border-danger/30'
                        : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {form.targeting.regions.includes(region) && <Check className="h-3 w-3 mr-1" />}
                    {region}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Flag Status</p>
              <p className="text-xs text-text-muted">
                {form.status === 'active'
                  ? 'Flag is currently enabled'
                  : 'Flag is currently disabled'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => update('status', form.status === 'active' ? 'inactive' : 'active')}
              className={cn(
                'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                form.status === 'active' ? 'bg-danger' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                  form.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" /> {isEditing ? 'Save Changes' : 'Create Flag'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
