/* src/app/admin/announcements/AnnouncementModal.jsx */
import { useState, useEffect } from 'react';
import {
  X, Check, Sparkles, Globe, Tag, Building2, Calendar, Clock,
  Pin, Type, AlertTriangle, Info, Wrench, ChevronDown
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  announcementTypeMeta, priorityMeta, audienceMeta, plans, regions
} from './data';

const types = [
  { id: 'feature', label: 'Feature', icon: Sparkles },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'alert', label: 'Alert', icon: AlertTriangle },
  { id: 'update', label: 'Update', icon: Info },
];

const priorities = [
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const audiences = [
  { id: 'all', label: 'All Tenants' },
  { id: 'plan', label: 'By Subscription Plan' },
  { id: 'tenant', label: 'Specific Tenants' },
];

export default function AnnouncementModal({ announcement, onClose, onSave, tenants = [] }) {
  const isEditing = !!announcement;
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'feature',
    priority: 'medium',
    status: 'draft',
    audience: 'all',
    targetPlans: [],
    targetTenants: [],
    scheduledAt: '',
    expiresAt: '',
    ctaLabel: '',
    ctaUrl: '',
    pinned: false,
  });

  useEffect(() => {
    if (announcement) {
      setForm({
        title: announcement.title || '',
        content: announcement.content || '',
        type: announcement.type || 'feature',
        priority: announcement.priority || 'medium',
        status: announcement.status || 'draft',
        audience: announcement.audience || 'all',
        targetPlans: announcement.targetPlans || [],
        targetTenants: announcement.targetTenants || [],
        scheduledAt: announcement.scheduledAt
          ? new Date(announcement.scheduledAt).toISOString().slice(0, 16)
          : '',
        expiresAt: announcement.expiresAt
          ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
          : '',
        ctaLabel: announcement.cta?.label || '',
        ctaUrl: announcement.cta?.url || '',
        pinned: announcement.pinned || false,
      });
    }
  }, [announcement]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const togglePlan = (plan) => {
    const current = form.targetPlans;
    update('targetPlans', current.includes(plan) ? current.filter(p => p !== plan) : [...current, plan]);
  };

  const toggleTenant = (tenantId) => {
    const current = form.targetTenants;
    update('targetTenants', current.includes(tenantId) ? current.filter(t => t !== tenantId) : [...current, tenantId]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      id: announcement?.id || `ANN-${Date.now().toString(36).toUpperCase()}`,
      cta: form.ctaLabel && form.ctaUrl ? { label: form.ctaLabel, url: form.ctaUrl } : null,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      createdBy: announcement?.createdBy || 'Admin',
      createdAt: announcement?.createdAt || new Date().toISOString(),
      publishedAt: form.status === 'published' && !announcement?.publishedAt
        ? new Date().toISOString()
        : announcement?.publishedAt || null,
      readCount: announcement?.readCount || 0,
      totalRecipients: form.audience === 'all' ? tenants.length || 156 :
        form.audience === 'plan' ? Math.floor((tenants.length || 156) * (form.targetPlans.length / 3)) :
        form.targetTenants.length,
    };
    onSave(payload);
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
              <Type className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Announcement' : 'Create Announcement'}
              </h3>
              <p className="text-xs text-text-muted">
                {isEditing ? announcement.id : 'Compose and target your message'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title & Content */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. New Feature Now Available"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Content</label>
              <textarea
                required
                value={form.content}
                onChange={(e) => update('content', e.target.value)}
                rows={4}
                placeholder="Describe the announcement..."
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {types.map((t) => {
                  const Icon = t.icon;
                  const active = form.type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => update('type', t.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</label>
              <div className="space-y-1.5">
                {priorities.map((p) => {
                  const meta = priorityMeta[p.id];
                  const active = form.priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => update('priority', p.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? cn(meta.bg, meta.color, meta.border)
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audience Targeting */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Target Audience</label>
            <div className="flex gap-2">
              {audiences.map((a) => {
                const active = form.audience === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => update('audience', a.id)}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>

            {form.audience === 'plan' && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <label className="mb-2 block text-xs font-medium text-text-secondary">Select Plans</label>
                <div className="flex flex-wrap gap-2">
                  {plans.map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => togglePlan(plan)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        form.targetPlans.includes(plan)
                          ? 'bg-secondary/10 text-secondary border-secondary/30'
                          : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {form.targetPlans.includes(plan) && <Check className="h-3 w-3" />}
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.audience === 'tenant' && (
              <div className="rounded-xl border border-border bg-surface p-4">
                <label className="mb-2 block text-xs font-medium text-text-secondary">Select Tenants</label>
                <div className="max-h-48 overflow-auto space-y-1">
                  {tenants.length === 0 ? (
                    <p className="text-sm text-text-muted py-4 text-center">No tenants available</p>
                  ) : (
                    tenants.map((tenant) => (
                      <button
                        key={tenant.id}
                        type="button"
                        onClick={() => toggleTenant(tenant.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                          form.targetTenants.includes(tenant.id)
                            ? 'bg-secondary/5 text-secondary'
                            : 'text-text-secondary hover:bg-background'
                        )}
                      >
                        <div className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                          form.targetTenants.includes(tenant.id) ? 'bg-secondary border-secondary' : 'border-border'
                        )}>
                          {form.targetTenants.includes(tenant.id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="font-mono text-xs text-text-muted">{tenant.id}</span>
                        <span className="flex-1 truncate">{tenant.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Schedule (optional)
                </span>
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => update('scheduledAt', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="mt-1 text-[10px] text-text-muted">Leave empty to publish immediately</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Expires (optional)
                </span>
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => update('expiresAt', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Call to Action (optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] text-text-muted">Button Label</label>
                <input
                  type="text"
                  value={form.ctaLabel}
                  onChange={(e) => update('ctaLabel', e.target.value)}
                  placeholder="e.g. Learn More"
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-text-muted">URL</label>
                <input
                  type="url"
                  value={form.ctaUrl}
                  onChange={(e) => update('ctaUrl', e.target.value)}
                  placeholder="/app/feature"
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Pin & Status */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => update('pinned', !form.pinned)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  form.pinned
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                )}
              >
                <Pin className="h-4 w-4" />
                {form.pinned ? 'Pinned' : 'Pin to top'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-secondary">Status:</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" />
              {isEditing ? 'Save Changes' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
