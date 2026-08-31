/* src/app/admin/feedback/FeatureRequestModal.jsx */
import { useState, useEffect } from 'react';
import {
  X,
  Check,
  Lightbulb,
  Tag,
  Calendar,
  ArrowUp,
  MessageSquare,
  Target,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

const categories = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'operations', label: 'Operations' },
  { key: 'guest-experience', label: 'Guest Experience' },
  { key: 'reporting', label: 'Reporting' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'performance', label: 'Performance' },
  { key: 'integrations', label: 'Integrations' },
];

const priorities = [
  { key: 'critical', label: 'Critical', desc: 'Blocking major functionality' },
  { key: 'high', label: 'High', desc: 'Significant impact on users' },
  { key: 'medium', label: 'Medium', desc: 'Nice to have, moderate impact' },
  { key: 'low', label: 'Low', desc: 'Minor improvement' },
];

const statuses = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'planned', label: 'Planned' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'declined', label: 'Declined' },
];

export default function FeatureRequestModal({ feature, onClose, onSave, tenants }) {
  const isEditing = !!feature;
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'operations',
    status: 'backlog',
    priority: 'medium',
    estimatedDelivery: '',
    tenantId: '',
    createdBy: '',
  });

  useEffect(() => {
    if (feature) {
      setForm({
        title: feature.title || '',
        description: feature.description || '',
        category: feature.category || 'operations',
        status: feature.status || 'backlog',
        priority: feature.priority || 'medium',
        estimatedDelivery: feature.estimatedDelivery || '',
        tenantId: feature.tenantId || '',
        createdBy: feature.createdBy || '',
      });
    }
  }, [feature]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      id: feature?.id || `FR-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      votes: feature?.votes || 0,
      voters: feature?.voters || [],
      npsLinked: feature?.npsLinked || [],
      createdAt: feature?.createdAt || new Date().toISOString().split('T')[0],
      comments: feature?.comments || 0,
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Lightbulb className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Feature Request' : 'Create Feature Request'}
              </h3>
              <p className="text-xs text-text-muted">
                {isEditing ? feature.id : 'Capture and prioritize customer requests'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. AI-Driven Dynamic Pricing"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              placeholder="Describe the feature, use cases, and expected impact..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Category & Priority */}
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
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {priorities.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Status
            </label>
            <div className="grid grid-cols-5 gap-2">
              {statuses.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => update('status', s.key)}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-xs font-medium transition-colors text-center',
                    form.status === s.key
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Delivery */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              <Calendar className="inline h-3.5 w-3.5 mr-1" /> Estimated Delivery
            </label>
            <input
              type="text"
              value={form.estimatedDelivery}
              onChange={(e) => update('estimatedDelivery', e.target.value)}
              placeholder="e.g. Q4 2026"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Tenant Attribution */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Requested By
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.tenantId}
                onChange={(e) => update('tenantId', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select tenant...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={form.createdBy}
                onChange={(e) => update('createdBy', e.target.value)}
                placeholder="User name"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary">
              <Check className="mr-1.5 h-4 w-4" /> {isEditing ? 'Save Changes' : 'Create Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
