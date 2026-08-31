/* src/app/admin/feature-flags/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ToggleLeft, ToggleRight, Search, Filter, Plus, X, Check,
  ChevronDown, ChevronUp, Save, Trash2, Edit3, Copy, Globe,
  Users, Building2, Clock, AlertTriangle, Info, Shield,
  Percent, Target, Zap, ArrowUpDown, MoreHorizontal,
  Eye, EyeOff, RefreshCw, Download, Upload, Tag
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const initialFlags = [
  {
    id: 'ff-001',
    key: 'new-booking-engine',
    name: 'New Booking Engine',
    description: 'Redesigned guest-facing booking engine with AI recommendations and dynamic pricing display.',
    category: 'guest-experience',
    status: 'active',
    rollout: { type: 'percentage', value: 100 },
    targeting: [
      { type: 'tenant', operator: 'in', value: ['grandhotel', 'seasideresort', 'desertpalm'] },
    ],
    createdAt: '2026-06-01',
    updatedAt: '2026-08-15',
    createdBy: 'Robert Chen',
    environments: ['production', 'staging'],
    requiresRestart: false,
    auditLog: [
      { date: '2026-08-15', user: 'Robert Chen', action: 'Increased rollout from 75% to 100%' },
      { date: '2026-07-20', user: 'Sarah J.', action: 'Added targeting for Enterprise tenants' },
      { date: '2026-06-01', user: 'Robert Chen', action: 'Created flag at 0%' },
    ],
  },
  {
    id: 'ff-002',
    key: 'ai-revenue-manager',
    name: 'AI Revenue Manager',
    description: 'Machine learning-powered dynamic pricing and demand forecasting for room rates.',
    category: 'revenue',
    status: 'active',
    rollout: { type: 'percentage', value: 35 },
    targeting: [
      { type: 'plan', operator: 'eq', value: 'Enterprise' },
      { type: 'tenant', operator: 'in', value: ['seasideresort', 'highlandmanor'] },
    ],
    createdAt: '2026-05-15',
    updatedAt: '2026-08-10',
    createdBy: 'David Park',
    environments: ['production'],
    requiresRestart: false,
    auditLog: [
      { date: '2026-08-10', user: 'David Park', action: 'Increased rollout from 20% to 35%' },
      { date: '2026-06-15', user: 'David Park', action: 'Enabled for Enterprise plan only' },
    ],
  },
  {
    id: 'ff-003',
    key: 'contactless-checkin',
    name: 'Contactless Check-in',
    description: 'Mobile key issuance, digital registration card, and self-service kiosk check-in flow.',
    category: 'operations',
    status: 'active',
    rollout: { type: 'percentage', value: 60 },
    targeting: [
      { type: 'plan', operator: 'in', value: ['Professional', 'Enterprise'] },
    ],
    createdAt: '2026-04-20',
    updatedAt: '2026-08-12',
    createdBy: 'Lisa Wong',
    environments: ['production', 'staging'],
    requiresRestart: true,
    auditLog: [
      { date: '2026-08-12', user: 'Lisa Wong', action: 'Increased rollout from 50% to 60%' },
      { date: '2026-05-01', user: 'Lisa Wong', action: 'Launched beta for Professional+ plans' },
    ],
  },
  {
    id: 'ff-004',
    key: 'white-label-portal',
    name: 'White-Label Guest Portal',
    description: 'Custom branded guest portal with hotel logo, colors, and custom domain support.',
    category: 'guest-experience',
    status: 'inactive',
    rollout: { type: 'percentage', value: 0 },
    targeting: [],
    createdAt: '2026-07-01',
    updatedAt: '2026-07-01',
    createdBy: 'James Miller',
    environments: ['staging'],
    requiresRestart: false,
    auditLog: [
      { date: '2026-07-01', user: 'James Miller', action: 'Created flag in staging' },
    ],
  },
  {
    id: 'ff-005',
    key: 'advanced-analytics',
    name: 'Advanced Analytics Dashboard',
    description: 'Predictive analytics, cohort analysis, and custom report builder with data export.',
    category: 'reporting',
    status: 'active',
    rollout: { type: 'percentage', value: 100 },
    targeting: [
      { type: 'plan', operator: 'eq', value: 'Enterprise' },
    ],
    createdAt: '2026-03-10',
    updatedAt: '2026-08-01',
    createdBy: 'Maria Garcia',
    environments: ['production'],
    requiresRestart: false,
    auditLog: [
      { date: '2026-08-01', user: 'Maria Garcia', action: 'Full rollout to all Enterprise tenants' },
      { date: '2026-04-01', user: 'Maria Garcia', action: 'Beta launch for 5 pilot tenants' },
    ],
  },
  {
    id: 'ff-006',
    key: 'multi-property-dashboard',
    name: 'Multi-Property Dashboard',
    description: 'Unified dashboard for managing multiple properties with cross-property reporting and user management.',
    category: 'operations',
    status: 'active',
    rollout: { type: 'percentage', value: 100 },
    targeting: [
      { type: 'plan', operator: 'eq', value: 'Enterprise' },
    ],
    createdAt: '2026-02-15',
    updatedAt: '2026-06-01',
    createdBy: 'Robert Chen',
    environments: ['production'],
    requiresRestart: false,
    auditLog: [
      { date: '2026-06-01', user: 'Robert Chen', action: 'Full GA release' },
    ],
  },
  {
    id: 'ff-007',
    key: 'channel-manager-v2',
    name: 'Channel Manager v2 API',
    description: 'Next-generation channel manager with real-time sync, conflict resolution, and rate parity monitoring.',
    category: 'integrations',
    status: 'active',
    rollout: { type: 'percentage', value: 15 },
    targeting: [
      { type: 'tenant', operator: 'in', value: ['grandhotel'] },
    ],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-14',
    createdBy: 'Mike Chen',
    environments: ['production'],
    requiresRestart: true,
    auditLog: [
      { date: '2026-08-14', user: 'Mike Chen', action: 'Increased from 5% to 15% for pilot' },
      { date: '2026-08-01', user: 'Mike Chen', action: 'Created for Grand Hotel pilot' },
    ],
  },
  {
    id: 'ff-008',
    key: 'sms-notifications',
    name: 'SMS Guest Notifications',
    description: 'Automated SMS alerts for check-in reminders, room ready, and checkout confirmations.',
    category: 'guest-experience',
    status: 'inactive',
    rollout: { type: 'percentage', value: 0 },
    targeting: [],
    createdAt: '2026-07-20',
    updatedAt: '2026-07-20',
    createdBy: 'Sarah J.',
    environments: ['staging'],
    requiresRestart: false,
    auditLog: [
      { date: '2026-07-20', user: 'Sarah J.', action: 'Created in staging environment' },
    ],
  },
];

const categories = [
  { key: 'guest-experience', label: 'Guest Experience', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'revenue', label: 'Revenue', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { key: 'operations', label: 'Operations', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'reporting', label: 'Reporting', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'integrations', label: 'Integrations', color: 'text-rose-500', bg: 'bg-rose-500/10' },
];

const rolloutTypes = [
  { key: 'percentage', label: 'Percentage Rollout', icon: Percent },
  { key: 'tenant', label: 'Tenant Targeting', icon: Building2 },
  { key: 'plan', label: 'Plan Targeting', icon: Target },
  { key: 'all', label: 'All Users', icon: Globe },
];

/* ─── Helpers ─── */
function getCategoryMeta(key) {
  return categories.find(c => c.key === key) || categories[0];
}

function getRolloutLabel(flag) {
  if (flag.status === 'inactive') return 'Disabled';
  if (flag.rollout.type === 'percentage') return `${flag.rollout.value}%`;
  if (flag.rollout.type === 'all') return 'All Users';
  if (flag.targeting.length > 0) return `${flag.targeting.length} rule${flag.targeting.length > 1 ? 's' : ''}`;
  return '0%';
}

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
        </div>
        <div className={cn('rounded-lg p-2.5', color.replace('text-', 'bg-').replace('danger', 'danger/10').replace('accent', 'accent/10').replace('warning', 'warning/10').replace('info', 'info/10').replace('secondary', 'secondary/10'))}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }) {
  const meta = getCategoryMeta(category);
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider', meta.bg, meta.color, 'border-current/20')}>
      <Tag className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-neutral/10 px-2.5 py-0.5 text-xs font-medium text-text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted" />
      Inactive
    </span>
  );
}

function RolloutBar({ value, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', pct >= 80 ? 'bg-accent' : pct >= 40 ? 'bg-secondary' : 'bg-warning')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono font-medium text-text-secondary">{value}%</span>
    </div>
  );
}

/* ─── Flag Detail Drawer ─── */
function FlagDetailDrawer({ flag, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [editRollout, setEditRollout] = useState(flag.rollout.value);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onUpdate(flag.id, {
      rollout: { ...flag.rollout, value: editRollout },
      updatedAt: new Date().toISOString().split('T')[0],
    });
    setIsEditing(false);
  };

  const toggleStatus = () => {
    onUpdate(flag.id, {
      status: flag.status === 'active' ? 'inactive' : 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'targeting', label: 'Targeting Rules', icon: Target },
    { id: 'audit', label: 'Audit Log', icon: Clock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', flag.status === 'active' ? 'bg-accent/10' : 'bg-neutral/10')}>
                <Zap className={cn('h-5 w-5', flag.status === 'active' ? 'text-accent' : 'text-text-muted')} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{flag.name}</h2>
                <p className="text-xs text-text-muted font-mono">{flag.key}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleStatus}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                  flag.status === 'active' ? 'bg-accent' : 'bg-border'
                )}
              >
                <span className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                  flag.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                )} />
              </button>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                    active ? 'border-secondary text-secondary' : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">Current Status</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={flag.status} />
                      <CategoryBadge category={flag.category} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted uppercase tracking-wider">Last Updated</p>
                    <p className="text-sm text-text-primary">{flag.updatedAt}</p>
                  </div>
                </div>

                {/* Rollout Control */}
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-text-primary">Rollout Percentage</p>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-secondary hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={handleSave} className="text-xs text-accent hover:underline flex items-center gap-1">
                          <Check className="h-3 w-3" /> Save
                        </button>
                        <button onClick={() => { setIsEditing(false); setEditRollout(flag.rollout.value); }} className="text-xs text-text-muted hover:underline">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editRollout}
                        onChange={(e) => setEditRollout(parseInt(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-border accent-secondary"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">0%</span>
                        <span className="text-lg font-bold font-mono text-secondary">{editRollout}%</span>
                        <span className="text-xs text-text-muted">100%</span>
                      </div>
                    </div>
                  ) : (
                    <RolloutBar value={flag.rollout.value} />
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Description</h3>
                <p className="text-sm text-text-secondary">{flag.description}</p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Created</p>
                  <p className="mt-1 text-sm text-text-primary">{flag.createdAt}</p>
                  <p className="text-xs text-text-muted">by {flag.createdBy}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Environments</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {flag.environments.map(env => (
                      <span key={env} className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary capitalize">
                        {env}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Requires Restart</p>
                  <p className={cn('mt-1 text-sm font-medium', flag.requiresRestart ? 'text-warning' : 'text-accent')}>
                    {flag.requiresRestart ? 'Yes — Service restart required' : 'No — Instant toggle'}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Flag ID</p>
                  <p className="mt-1 text-sm font-mono text-text-primary">{flag.id}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Key
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh Cache
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-danger border-danger/30 hover:bg-danger/10">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Archive
                </Button>
              </div>
            </div>
          )}

          {/* Targeting Tab */}
          {activeTab === 'targeting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Targeting Rules</h3>
                <Button size="sm" variant="outline">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Rule
                </Button>
              </div>

              {flag.targeting.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface p-8 text-center">
                  <Target className="mx-auto h-10 w-10 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">No targeting rules configured.</p>
                  <p className="text-xs text-text-muted mt-1">This flag applies to all users based on rollout percentage only.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flag.targeting.map((rule, i) => (
                    <div key={i} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-secondary/10 px-2 py-0.5 text-xs font-mono font-medium text-secondary">
                            {rule.type}
                          </span>
                          <span className="text-xs text-text-muted">{rule.operator}</span>
                        </div>
                        <button className="text-text-muted hover:text-danger">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(rule.value) ? rule.value.map(v => (
                          <span key={v} className="rounded-full bg-background border border-border px-2.5 py-0.5 text-xs text-text-secondary">
                            {v}
                          </span>
                        )) : (
                          <span className="rounded-full bg-background border border-border px-2.5 py-0.5 text-xs text-text-secondary">
                            {rule.value}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rule Builder Preview */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Add New Rule</h4>
                <div className="grid grid-cols-3 gap-3">
                  <select className="h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select type...</option>
                    <option value="tenant">Tenant</option>
                    <option value="plan">Plan</option>
                    <option value="region">Region</option>
                    <option value="user">User</option>
                  </select>
                  <select className="h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Operator...</option>
                    <option value="eq">Equals</option>
                    <option value="in">In list</option>
                    <option value="neq">Not equals</option>
                    <option value="contains">Contains</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value..."
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button size="sm" className="mt-3" variant="secondary">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Rule
                </Button>
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Change History</h3>
              <div className="space-y-3">
                {flag.auditLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                      <Clock className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary">{entry.action}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                        <span>{entry.user}</span>
                        <span>·</span>
                        <span>{entry.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── New Flag Modal ─── */
function NewFlagModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    key: '',
    description: '',
    category: 'guest-experience',
    rollout: 0,
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      ...form,
      id: `ff-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
      status: 'inactive',
      rollout: { type: 'percentage', value: form.rollout },
      targeting: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      createdBy: 'You',
      environments: ['staging'],
      requiresRestart: false,
      auditLog: [{ date: new Date().toISOString().split('T')[0], user: 'You', action: 'Created flag' }],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Create Feature Flag</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Flag Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. New Booking Engine"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Key</label>
            <input
              type="text"
              required
              value={form.key}
              onChange={(e) => update('key', e.target.value)}
              placeholder="e.g. new-booking-engine"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-[10px] text-text-muted">Used in code: useFlag(&quot;{form.key || 'your-flag-key'}&quot;)</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder="What does this flag control?"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Category</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Initial Rollout</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.rollout}
                  onChange={(e) => update('rollout', parseInt(e.target.value) || 0)}
                  className="h-10 w-full rounded-md border border-border bg-surface px-3 pr-8 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="secondary">
              <Plus className="mr-1.5 h-4 w-4" /> Create Flag
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function FeatureFlagsPage() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState(initialFlags);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [showNewFlag, setShowNewFlag] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', dir: 'desc' });

  const filteredFlags = useMemo(() => {
    let result = flags.filter((f) => {
      const matchesQuery = !query ||
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.key.toLowerCase().includes(query.toLowerCase()) ||
        f.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'updatedAt') {
        return sortConfig.dir === 'asc'
          ? new Date(a.updatedAt) - new Date(b.updatedAt)
          : new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      if (sortConfig.key === 'name') {
        return sortConfig.dir === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'rollout') {
        return sortConfig.dir === 'asc'
          ? a.rollout.value - b.rollout.value
          : b.rollout.value - a.rollout.value;
      }
      return 0;
    });

    return result;
  }, [flags, query, categoryFilter, statusFilter, sortConfig]);

  const stats = useMemo(() => ({
    total: flags.length,
    active: flags.filter(f => f.status === 'active').length,
    inactive: flags.filter(f => f.status === 'inactive').length,
    avgRollout: flags.filter(f => f.status === 'active').length > 0
      ? Math.round(flags.filter(f => f.status === 'active').reduce((s, f) => s + f.rollout.value, 0) / flags.filter(f => f.status === 'active').length)
      : 0,
  }), [flags]);

  const handleUpdate = (id, updates) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleCreate = (newFlag) => {
    setFlags(prev => [newFlag, ...prev]);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Feature Flags</h1>
          <p className="text-sm text-text-secondary">Rollout management, targeting rules, and feature toggles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowNewFlag(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Flag
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Flags" value={stats.total} icon={ToggleRight} color="text-text-primary" subtext="Across all environments" />
        <StatCard label="Active" value={stats.active} icon={Zap} color="text-accent" subtext="Currently enabled" />
        <StatCard label="Inactive" value={stats.inactive} icon={EyeOff} color="text-text-muted" subtext="Disabled or staging" />
        <StatCard label="Avg. Rollout" value={`${stats.avgRollout}%`} icon={Percent} color="text-secondary" subtext="Of active flags" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search flags by name, key, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredFlags.length}</span> of {flags.length} feature flags
      </p>

      {/* Flags Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-10">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                {[
                  { key: 'name', label: 'Flag' },
                  { key: 'category', label: 'Category' },
                  { key: 'status', label: 'Status' },
                  { key: 'rollout', label: 'Rollout' },
                  { key: 'updatedAt', label: 'Last Updated' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key && (
                        sortConfig.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFlags.map((flag) => (
                <tr
                  key={flag.id}
                  className="hover:bg-background/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedFlag(flag)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', flag.status === 'active' ? 'bg-accent/10' : 'bg-neutral/10')}>
                        <Zap className={cn('h-4 w-4', flag.status === 'active' ? 'text-accent' : 'text-text-muted')} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{flag.name}</p>
                        <p className="text-[10px] text-text-muted font-mono">{flag.key}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge category={flag.category} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={flag.status} />
                  </td>
                  <td className="px-4 py-3">
                    <RolloutBar value={flag.rollout.value} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {flag.updatedAt}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedFlag(flag); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdate(flag.id, { status: flag.status === 'active' ? 'inactive' : 'active' }); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                        title={flag.status === 'active' ? 'Disable' : 'Enable'}
                      >
                        {flag.status === 'active' ? <ToggleRight className="h-4 w-4 text-accent" /> : <ToggleLeft className="h-4 w-4 text-text-muted" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFlags.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <Zap className="mx-auto h-10 w-10 mb-3" />
                    <p>No flags match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showNewFlag && (
        <NewFlagModal onClose={() => setShowNewFlag(false)} onCreate={handleCreate} />
      )}

      {selectedFlag && (
        <FlagDetailDrawer
          flag={selectedFlag}
          onClose={() => setSelectedFlag(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
