'use client';

import { useState } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const RESOURCE_OPTIONS = [
  { value: 'api_calls', label: 'API Calls' },
  { value: 'storage', label: 'Storage' },
  { value: 'reservations', label: 'Reservations' },
  { value: 'users', label: 'Users' },
  { value: 'properties', label: 'Properties' },
  { value: 'bandwidth', label: 'Bandwidth' },
];

const SCOPE_OPTIONS = [
  { value: 'plan', label: 'Plan Level' },
  { value: 'tenant', label: 'Specific Tenant' },
  { value: 'global', label: 'Global' },
];

const PERIOD_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
];

const ACTION_OPTIONS = [
  { value: 'throttle', label: 'Throttle (Slow Down)' },
  { value: 'block', label: 'Block (Hard Stop)' },
  { value: 'notify', label: 'Notify Only' },
];

const PLAN_TARGETS = ['Starter', 'Professional', 'Enterprise'];

export function QuotaModal({ rule, onClose, onSave, loading }) {
  const isEditing = !!rule;

  const [form, setForm] = useState({
    name: '',
    description: '',
    resource: 'api_calls',
    scope: 'plan',
    scopeTarget: 'Starter',
    limit: '',
    unit: '',
    period: 'monthly',
    action: 'throttle',
    throttleRate: '',
    overageEnabled: false,
    overageRate: '',
    overageCap: '',
    warnThreshold: 80,
    hardLimit: 100,
    enabled: true,
  });

  const [errors, setErrors] = useState({});

  const [prevRule, setPrevRule] = useState(null);
  if (rule !== prevRule) {
    setPrevRule(rule);
    if (rule) {
      setForm({
        name: rule.name || '',
        description: rule.description || '',
        resource: rule.resource || 'api_calls',
        scope: rule.scope || 'plan',
        scopeTarget: rule.scopeTarget || 'Starter',
        limit: rule.limit?.toString() || '',
        unit: rule.unit || '',
        period: rule.period || 'monthly',
        action: rule.action || 'throttle',
        throttleRate: rule.throttleRate?.toString() || '',
        overageEnabled: rule.overageEnabled || false,
        overageRate: rule.overageRate?.toString() || '',
        overageCap: rule.overageCap?.toString() || '',
        warnThreshold: rule.warnThreshold || 80,
        hardLimit: rule.hardLimit || 100,
        enabled: rule.enabled ?? true,
      });
    }
  }

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.limit || parseInt(form.limit) <= 0) newErrors.limit = 'Limit must be positive';
    if (form.action === 'throttle' && (!form.throttleRate || parseInt(form.throttleRate) <= 0)) {
      newErrors.throttleRate = 'Throttle rate is required';
    }
    if (form.overageEnabled && (!form.overageRate || parseFloat(form.overageRate) <= 0)) {
      newErrors.overageRate = 'Overage rate is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...(isEditing && { id: rule.id }),
      name: form.name,
      description: form.description,
      resource: form.resource,
      scope: form.scope,
      scopeTarget: form.scopeTarget,
      limit: parseInt(form.limit),
      unit: form.unit || getDefaultUnit(form.resource),
      period: form.period,
      action: form.action,
      throttleRate: form.action === 'throttle' ? parseInt(form.throttleRate) : null,
      overageEnabled: form.overageEnabled,
      overageRate: form.overageEnabled ? parseFloat(form.overageRate) : 0,
      overageCap: form.overageEnabled ? parseFloat(form.overageCap) || 0 : 0,
      warnThreshold: parseInt(form.warnThreshold) || 80,
      hardLimit: parseInt(form.hardLimit) || 100,
      enabled: form.enabled,
    };

    try {
      await onSave(payload);
    } catch (err) {
      // Error handling is done by parent
    }
  };

  const getDefaultUnit = (resource) => {
    const units = {
      api_calls: 'calls',
      storage: 'GB',
      reservations: 'bookings',
      users: 'users',
      properties: 'properties',
      bandwidth: 'GB',
    };
    return units[resource] || 'units';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {isEditing ? 'Edit Quota Rule' : 'New Quota Rule'}
            </h2>
            <p className="text-sm text-text-muted">
              {isEditing ? `Editing ${rule.name}` : 'Define resource limits and enforcement'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-neutral/10 hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., API Requests — Starter Plan"
                className={cn(errors.name && 'border-danger')}
              />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this quota rule"
              />
            </div>
          </div>

          {/* Resource & Scope */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Resource *</Label>
              <Select
                value={form.resource}
                onValueChange={(v) => setForm({ ...form, resource: v, unit: getDefaultUnit(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Scope *</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scope Target */}
          {form.scope === 'plan' && (
            <div>
              <Label>Plan Tier *</Label>
              <Select
                value={form.scopeTarget}
                onValueChange={(v) => setForm({ ...form, scopeTarget: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TARGETS.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.scope === 'tenant' && (
            <div>
              <Label htmlFor="scopeTarget">Tenant ID *</Label>
              <Input
                id="scopeTarget"
                value={form.scopeTarget}
                onChange={(e) => setForm({ ...form, scopeTarget: e.target.value })}
                placeholder="Enter tenant ID"
              />
            </div>
          )}

          {/* Limit Configuration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="limit">Limit *</Label>
              <Input
                id="limit"
                type="number"
                min="1"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
                className={cn(errors.limit && 'border-danger')}
              />
              {errors.limit && <p className="mt-1 text-xs text-danger">{errors.limit}</p>}
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder={getDefaultUnit(form.resource)}
              />
            </div>

            <div>
              <Label>Period *</Label>
              <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Configuration */}
          <div className="space-y-4">
            <div>
              <Label>Enforcement Action *</Label>
              <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.action === 'throttle' && (
              <div>
                <Label htmlFor="throttleRate">Throttle Rate (requests/sec) *</Label>
                <Input
                  id="throttleRate"
                  type="number"
                  min="1"
                  value={form.throttleRate}
                  onChange={(e) => setForm({ ...form, throttleRate: e.target.value })}
                  className={cn(errors.throttleRate && 'border-danger')}
                />
                {errors.throttleRate && (
                  <p className="mt-1 text-xs text-danger">{errors.throttleRate}</p>
                )}
              </div>
            )}
          </div>

          {/* Thresholds */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warnThreshold">Warning Threshold (%)</Label>
              <Input
                id="warnThreshold"
                type="number"
                min="1"
                max="100"
                value={form.warnThreshold}
                onChange={(e) => setForm({ ...form, warnThreshold: e.target.value })}
              />
              <p className="mt-1 text-xs text-text-muted">
                Alert when usage reaches this percentage
              </p>
            </div>

            <div>
              <Label htmlFor="hardLimit">Hard Limit (%)</Label>
              <Input
                id="hardLimit"
                type="number"
                min="1"
                max="100"
                value={form.hardLimit}
                onChange={(e) => setForm({ ...form, hardLimit: e.target.value })}
              />
              <p className="mt-1 text-xs text-text-muted">Absolute maximum before blocking</p>
            </div>
          </div>

          {/* Overage Configuration */}
          <div className="rounded-lg border border-border bg-background p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="overageEnabled" className="text-sm font-medium">
                  Enable Overage Billing
                </Label>
                <p className="text-xs text-text-muted">Charge tenants for usage beyond the limit</p>
              </div>
              <Switch
                id="overageEnabled"
                checked={form.overageEnabled}
                onCheckedChange={(v) => setForm({ ...form, overageEnabled: v })}
              />
            </div>

            {form.overageEnabled && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <Label htmlFor="overageRate">Rate per Unit ($) *</Label>
                  <Input
                    id="overageRate"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={form.overageRate}
                    onChange={(e) => setForm({ ...form, overageRate: e.target.value })}
                    className={cn(errors.overageRate && 'border-danger')}
                  />
                  {errors.overageRate && (
                    <p className="mt-1 text-xs text-danger">{errors.overageRate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="overageCap">Monthly Cap ($)</Label>
                  <Input
                    id="overageCap"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.overageCap}
                    onChange={(e) => setForm({ ...form, overageCap: e.target.value })}
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
            <div>
              <Label htmlFor="enabled" className="text-sm font-medium">
                Rule Enabled
              </Label>
              <p className="text-xs text-text-muted">Disabled rules are not enforced</p>
            </div>
            <Switch
              id="enabled"
              checked={form.enabled}
              onCheckedChange={(v) => setForm({ ...form, enabled: v })}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
