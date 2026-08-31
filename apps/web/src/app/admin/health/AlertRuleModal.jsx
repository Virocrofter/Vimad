/* src/app/admin/health/AlertRuleModal.jsx */
import { useState, useEffect } from 'react';
import { X, Check, Bell, Plus, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { alertMetricMeta, alertConditions, alertSeverityMeta } from './alert-data';

const availableChannels = [
  { id: 'email', label: 'Email' },
  { id: 'slack', label: 'Slack' },
  { id: 'pagerduty', label: 'PagerDuty' },
  { id: 'webhook', label: 'Webhook' },
  { id: 'sms', label: 'SMS' },
];

export default function AlertRuleModal({ rule, onClose, onSave }) {
  const isEditing = !!rule;
  const [form, setForm] = useState({
    name: '',
    description: '',
    metric: 'cpu',
    condition: 'gt',
    threshold: 80,
    duration: 300,
    severity: 'warning',
    enabled: true,
    channels: ['email'],
  });

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name || '',
        description: rule.description || '',
        metric: rule.metric || 'cpu',
        condition: rule.condition || 'gt',
        threshold: rule.threshold || 0,
        duration: rule.duration || 60,
        severity: rule.severity || 'warning',
        enabled: rule.enabled !== false,
        channels: rule.channels || ['email'],
      });
    }
  }, [rule]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleChannel = (ch) => {
    const current = form.channels;
    update('channels', current.includes(ch) ? current.filter(c => c !== ch) : [...current, ch]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: rule?.id || `ALERT-${Date.now().toString(36).toUpperCase()}`,
      createdAt: rule?.createdAt || new Date().toISOString().split('T')[0],
      lastTriggered: rule?.lastTriggered || null,
      triggerCount: rule?.triggerCount || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10">
              <Bell className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">{isEditing ? 'Edit Alert Rule' : 'New Alert Rule'}</h3>
              <p className="text-xs text-text-muted">{isEditing ? rule.id : 'Configure monitoring and notification'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Rule Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. High CPU Usage"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={2}
                placeholder="What does this alert monitor?"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Metric & Condition */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Condition</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Metric</label>
                <select
                  value={form.metric}
                  onChange={(e) => update('metric', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(alertMetricMeta).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Operator</label>
                <select
                  value={form.condition}
                  onChange={(e) => update('condition', e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {alertConditions.map(c => (
                    <option key={c.key} value={c.key}>{c.label} ({c.symbol})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Threshold</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={form.threshold}
                    onChange={(e) => update('threshold', parseFloat(e.target.value) || 0)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 pr-8 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                    {alertMetricMeta[form.metric]?.unit || ''}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary">Duration (seconds)</label>
                <input
                  type="number"
                  min="10"
                  value={form.duration}
                  onChange={(e) => update('duration', parseInt(e.target.value) || 60)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">Severity</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(alertSeverityMeta).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => update('severity', key)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    form.severity === key
                      ? cn(meta.class, 'border-current')
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">Notification Channels</label>
            <div className="flex flex-wrap gap-2">
              {availableChannels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    form.channels.includes(ch.id)
                      ? 'bg-secondary/10 text-secondary border-secondary/30'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {form.channels.includes(ch.id) && <Check className="h-3 w-3" />}
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Enable Rule</p>
              <p className="text-xs text-text-muted">{form.enabled ? 'Rule is active and monitoring' : 'Rule is disabled'}</p>
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