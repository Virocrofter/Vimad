/* src/app/admin/tickets/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, Search, Filter, Plus, X, Check, ChevronDown, ChevronUp,
  MessageSquare, Clock, AlertTriangle, CheckCircle2, Eye, Edit3,
  Trash2, Send, UserPlus, Building2, Tag, ArrowUpDown, MoreHorizontal,
  Star, StarOff, RefreshCw, Download, Mail, Phone, Link2, Shield,
  Zap, TrendingUp, TrendingDown, Minus, Calendar, Hash, Timer,
  Reply, Lock, Unlock, Archive
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  initialTickets, priorityMeta, statusMeta, categoryMeta,
  formatDateTime, timeAgo, getSlaStatus, getResponseTime,
  teamMembers
} from './data';
import {
  PriorityBadge, StatusBadge, CategoryBadge, SlaBadge,
  TicketStatCard, PriorityBar, SatisfactionStars,
  MessageBubble, TeamMemberCard, TimelineItem, TicketVolumeChart
} from './components';

/* ─── Ticket Detail Drawer ─── */
function TicketDetailDrawer({ ticket, onClose, onUpdate, teamMembers }) {
  const [activeTab, setActiveTab] = useState('conversation');
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  if (!ticket) return null;

  const tabs = [
    { id: 'conversation', label: 'Conversation', icon: MessageSquare },
    { id: 'details', label: 'Details', icon: Hash },
    { id: 'timeline', label: 'Timeline', icon: Clock },
  ];

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    const newMessage = {
      id: ticket.messages.length + 1,
      from: 'agent',
      author: 'You',
      timestamp: '2026-08-16 14:35:00',
      body: replyText,
      internal: isInternal,
    };
    onUpdate(ticket.id, {
      messages: [...ticket.messages, newMessage],
      updatedAt: '2026-08-16 14:35:00',
      status: ticket.status === 'open' ? 'in_progress' : ticket.status,
    });
    setReplyText('');
  };

  const handleAssign = (member) => {
    onUpdate(ticket.id, {
      assignee: { name: member.name, email: member.email, avatar: member.avatar },
      updatedAt: '2026-08-16 14:35:00',
    });
    setShowAssignModal(false);
  };

  const handleStatusChange = (newStatus) => {
    const updates = { status: newStatus, updatedAt: '2026-08-16 14:35:00' };
    if (newStatus === 'resolved') {
      updates.resolvedAt = '2026-08-16 14:35:00';
    }
    onUpdate(ticket.id, updates);
  };

  const sla = getSlaStatus(ticket);
  const responseTime = getResponseTime(ticket);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                ticket.priority === 'critical' ? 'bg-danger/10' :
                ticket.priority === 'high' ? 'bg-warning/10' :
                ticket.priority === 'medium' ? 'bg-info/10' : 'bg-neutral/10'
              )}>
                <Ticket className={cn('h-5 w-5',
                  ticket.priority === 'critical' ? 'text-danger' :
                  ticket.priority === 'high' ? 'text-warning' :
                  ticket.priority === 'medium' ? 'text-info' : 'text-text-muted'
                )} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{ticket.subject}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-text-muted font-mono">{ticket.id}</span>
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <button
                  onClick={() => handleStatusChange('resolved')}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                </button>
              )}
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
          {/* ─── Conversation Tab ─── */}
          {activeTab === 'conversation' && (
            <div className="space-y-6">
              {/* Ticket Info Bar */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-text-muted" />
                    <span className="text-text-secondary">{ticket.tenant.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-text-muted" />
                    <span className="text-text-secondary">{ticket.requester.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-text-muted" />
                    <CategoryBadge category={ticket.category} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-muted" />
                    <SlaBadge ticket={ticket} />
                  </div>
                </div>
                {ticket.assignee ? (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                    <span className="text-xs text-text-muted">Assigned to:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/10 text-[10px] font-bold text-secondary">
                        {ticket.assignee.avatar}
                      </div>
                      <span className="text-sm text-text-primary">{ticket.assignee.name}</span>
                    </div>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="ml-auto text-xs text-secondary hover:underline"
                    >
                      Reassign
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-secondary hover:underline"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign to agent
                    </button>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="space-y-4">
                {ticket.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isInternal={msg.internal} />
                ))}
              </div>

              {/* Reply Box */}
              {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">Reply</span>
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Lock className="h-3 w-3" /> Internal note
                    </label>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isInternal ? "Add an internal note..." : "Type your reply..."}
                    rows={4}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Link2 className="mr-1.5 h-3.5 w-3.5" /> Attach
                      </Button>
                    </div>
                    <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim()}>
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Send Reply
                    </Button>
                  </div>
                </div>
              )}

              {/* Satisfaction */}
              {ticket.status === 'resolved' && (
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">Customer Satisfaction</p>
                      <p className="text-xs text-text-muted">How the tenant rated this resolution</p>
                    </div>
                    <SatisfactionStars rating={ticket.satisfaction} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Details Tab ─── */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Description</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{ticket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Requester</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-text-muted" />
                      <span className="text-text-primary">{ticket.requester.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-text-muted" />
                      <span className="text-text-secondary">{ticket.requester.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-text-muted" />
                      <span className="text-text-secondary capitalize">{ticket.requester.role}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tenant</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-text-muted" />
                      <span className="text-text-primary">{ticket.tenant.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-text-muted" />
                      <span className="text-text-secondary font-mono">{ticket.tenant.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Metadata</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Created</span>
                    <span className="text-text-primary">{formatDateTime(ticket.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Updated</span>
                    <span className="text-text-primary">{formatDateTime(ticket.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Source</span>
                    <span className="capitalize text-text-primary">{ticket.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">First Response</span>
                    <span className="text-text-primary">{responseTime || '—'}</span>
                  </div>
                  {ticket.resolvedAt && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Resolved</span>
                      <span className="text-text-primary">{formatDateTime(ticket.resolvedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2.5 py-1 text-xs text-text-secondary">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Timeline Tab ─── */}
          {activeTab === 'timeline' && (
            <div className="space-y-2">
              <TimelineItem
                icon={Zap}
                iconColor="text-secondary"
                iconBg="bg-secondary/10"
                title="Ticket Created"
                time={formatDateTime(ticket.createdAt)}
                description={`By ${ticket.requester.name} via ${ticket.source}`}
              />
              {ticket.firstResponseAt && (
                <TimelineItem
                  icon={Reply}
                  iconColor="text-info"
                  iconBg="bg-info/10"
                  title="First Response"
                  time={formatDateTime(ticket.firstResponseAt)}
                  description={`Response time: ${responseTime}`}
                />
              )}
              {ticket.assignee && (
                <TimelineItem
                  icon={UserPlus}
                  iconColor="text-accent"
                  iconBg="bg-accent/10"
                  title={`Assigned to ${ticket.assignee.name}`}
                  time={formatDateTime(ticket.updatedAt)}
                />
              )}
              {ticket.status === 'resolved' && (
                <TimelineItem
                  icon={CheckCircle2}
                  iconColor="text-accent"
                  iconBg="bg-accent/10"
                  title="Ticket Resolved"
                  time={formatDateTime(ticket.resolvedAt)}
                />
              )}
              <TimelineItem
                icon={Clock}
                iconColor="text-text-muted"
                iconBg="bg-surface-elevated"
                title="Last Updated"
                time={formatDateTime(ticket.updatedAt)}
              />
            </div>
          )}
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
            <div className="relative w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
              <h3 className="text-lg font-bold text-text-primary mb-4">Assign Ticket</h3>
              <div className="space-y-1">
                {teamMembers.map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    member={member}
                    isSelected={ticket.assignee?.name === member.name}
                    onClick={() => handleAssign(member)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── New Ticket Modal ─── */
function NewTicketModal({ onClose, onCreate, tenants }) {
  const [form, setForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'billing',
    tenantId: tenants[0]?.id || '',
    requesterName: '',
    requesterEmail: '',
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const tenant = tenants.find(t => t.id === form.tenantId);
    onCreate({
      id: `TKT-${Date.now().toString(36).toUpperCase()}`,
      subject: form.subject,
      description: form.description,
      status: 'open',
      priority: form.priority,
      category: form.category,
      source: 'internal',
      tenant: tenant || { id: form.tenantId, name: 'Unknown' },
      requester: { name: form.requesterName, email: form.requesterEmail, role: 'admin' },
      assignee: null,
      createdAt: '2026-08-16 14:35:00',
      updatedAt: '2026-08-16 14:35:00',
      resolvedAt: null,
      firstResponseAt: null,
      slaDeadline: '2026-08-17 14:35:00',
      tags: [],
      satisfaction: null,
      messages: [{
        id: 1,
        from: 'system',
        author: form.requesterName,
        timestamp: '2026-08-16 14:35:00',
        body: form.description,
        internal: false,
      }],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Create Support Ticket</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Subject</label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => update('subject', e.target.value)}
              placeholder="Brief description of the issue"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              placeholder="Detailed description..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(priorityMeta).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Category</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.entries(categoryMeta).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Tenant</label>
            <select
              value={form.tenantId}
              onChange={(e) => update('tenantId', e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Requester Name</label>
              <input
                type="text"
                value={form.requesterName}
                onChange={(e) => update('requesterName', e.target.value)}
                placeholder="Name"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Requester Email</label>
              <input
                type="email"
                value={form.requesterEmail}
                onChange={(e) => update('requesterEmail', e.target.value)}
                placeholder="email@company.com"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">
              <Plus className="mr-1.5 h-4 w-4" /> Create Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(initialTickets);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', dir: 'desc' });

  /* ─── Tenant list for filters/modals ─── */
  const tenants = useMemo(() => {
    const map = new Map();
    tickets.forEach(t => map.set(t.tenant.id, t.tenant));
    return Array.from(map.values());
  }, [tickets]);

  /* ─── Filtered & Sorted Tickets ─── */
  const filteredTickets = useMemo(() => {
    let result = tickets.filter((t) => {
      const matchesQuery = !query ||
        t.subject.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase()) ||
        t.tenant.name.toLowerCase().includes(query.toLowerCase()) ||
        t.requester.name.toLowerCase().includes(query.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesAssignee = assigneeFilter === 'all' ||
        (assigneeFilter === 'unassigned' ? !t.assignee : t.assignee?.name === assigneeFilter);
      return matchesQuery && matchesStatus && matchesPriority && matchesCategory && matchesAssignee;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'updatedAt') {
        return sortConfig.dir === 'asc'
          ? new Date(a.updatedAt.replace(' ', 'T')) - new Date(b.updatedAt.replace(' ', 'T'))
          : new Date(b.updatedAt.replace(' ', 'T')) - new Date(a.updatedAt.replace(' ', 'T'));
      }
      if (sortConfig.key === 'createdAt') {
        return sortConfig.dir === 'asc'
          ? new Date(a.createdAt.replace(' ', 'T')) - new Date(b.createdAt.replace(' ', 'T'))
          : new Date(b.createdAt.replace(' ', 'T')) - new Date(a.createdAt.replace(' ', 'T'));
      }
      if (sortConfig.key === 'priority') {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        return sortConfig.dir === 'asc'
          ? order[a.priority] - order[b.priority]
          : order[b.priority] - order[a.priority];
      }
      if (sortConfig.key === 'subject') {
        return sortConfig.dir === 'asc'
          ? a.subject.localeCompare(b.subject)
          : b.subject.localeCompare(a.subject);
      }
      return 0;
    });

    return result;
  }, [tickets, query, statusFilter, priorityFilter, categoryFilter, assigneeFilter, sortConfig]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const unassigned = tickets.filter(t => !t.assignee && t.status !== 'resolved' && t.status !== 'closed').length;
    const breached = tickets.filter(t => getSlaStatus(t) === 'breached' && t.status !== 'resolved').length;
    const avgResponse = tickets.filter(t => t.firstResponseAt).reduce((sum, t) => {
      const created = new Date(t.createdAt.replace(' ', 'T'));
      const responded = new Date(t.firstResponseAt.replace(' ', 'T'));
      return sum + (responded - created);
    }, 0) / (tickets.filter(t => t.firstResponseAt).length || 1);
    const avgResponseMin = Math.round(avgResponse / (1000 * 60));

    const priorityCounts = {
      critical: tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length,
      high: tickets.filter(t => t.priority === 'high' && t.status !== 'resolved').length,
      medium: tickets.filter(t => t.priority === 'medium' && t.status !== 'resolved').length,
      low: tickets.filter(t => t.priority === 'low' && t.status !== 'resolved').length,
    };

    return { open, inProgress, pending, resolved, unassigned, breached, avgResponseMin, priorityCounts };
  }, [tickets]);

  /* ─── Volume data for chart ─── */
  const volumeData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((label, i) => ({
      label,
      count: tickets.filter(t => {
        const d = new Date(t.createdAt.replace(' ', 'T'));
        return d.getDay() === (i + 1) % 7;
      }).length,
    }));
  }, [tickets]);

  /* ─── Handlers ─── */
  const handleUpdate = (id, updates) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (selectedTicket?.id === id) {
      setSelectedTicket(prev => ({ ...prev, ...updates }));
    }
  };

  const handleCreate = (newTicket) => {
    setTickets(prev => [newTicket, ...prev]);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleBulkStatus = (status) => {
    // Would need selection state for bulk actions
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Support Tickets</h1>
          <p className="text-sm text-text-secondary">Manage customer issues, track SLAs, and coordinate resolutions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowNewTicket(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TicketStatCard
          label="Open"
          value={stats.open}
          icon={AlertTriangle}
          color="text-danger"
          subtext={`${stats.unassigned} unassigned`}
        />
        <TicketStatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="text-info"
          subtext="Being worked on"
        />
        <TicketStatCard
          label="SLA Breached"
          value={stats.breached}
          icon={Timer}
          color="text-warning"
          subtext="Require immediate attention"
        />
        <TicketStatCard
          label="Avg Response"
          value={`${stats.avgResponseMin}m`}
          icon={Zap}
          color="text-accent"
          subtext="First response time"
          trend={-12}
        />
      </div>

      {/* Priority Distribution & Volume */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Ticket Volume (This Week)</h3>
          <TicketVolumeChart data={volumeData} />
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Priority Queue</h3>
          <PriorityBar counts={stats.priorityCounts} />
          <div className="mt-4 space-y-2">
            {Object.entries(stats.priorityCounts).map(([key, count]) => {
              const meta = priorityMeta[key];
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                    <span className="text-text-secondary">{meta.label}</span>
                  </div>
                  <span className="font-mono font-medium text-text-primary">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search tickets by ID, subject, tenant, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showFilters ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <select
            value={sortConfig.key}
            onChange={(e) => setSortConfig({ key: e.target.value, dir: 'desc' })}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="updatedAt">Sort by Updated</option>
            <option value="createdAt">Sort by Created</option>
            <option value="priority">Sort by Priority</option>
            <option value="subject">Sort by Subject</option>
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusMeta).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Priorities</option>
                {Object.entries(priorityMeta).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryMeta).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Assignee</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Agents</option>
                <option value="unassigned">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
                setAssigneeFilter('all');
                setQuery('');
              }}
              className="text-xs text-secondary hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredTickets.length}</span> of {tickets.length} tickets
      </p>

      {/* Tickets Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-10">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                {[
                  { key: 'subject', label: 'Ticket' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'status', label: 'Status' },
                  { key: 'category', label: 'Category' },
                  { key: 'assignee', label: 'Assignee' },
                  { key: 'updatedAt', label: 'Last Update' },
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
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-background/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        ticket.priority === 'critical' ? 'bg-danger/10' :
                        ticket.priority === 'high' ? 'bg-warning/10' :
                        ticket.priority === 'medium' ? 'bg-info/10' : 'bg-neutral/10'
                      )}>
                        <Ticket className={cn('h-4 w-4',
                          ticket.priority === 'critical' ? 'text-danger' :
                          ticket.priority === 'high' ? 'text-warning' :
                          ticket.priority === 'medium' ? 'text-info' : 'text-text-muted'
                        )} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-text-muted font-mono">{ticket.id}</span>
                          <span className="text-[10px] text-text-muted">·</span>
                          <span className="text-[10px] text-text-muted truncate">{ticket.tenant.name}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge category={ticket.category} />
                  </td>
                  <td className="px-4 py-3">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary/10 text-[10px] font-bold text-secondary">
                          {ticket.assignee.avatar}
                        </div>
                        <span className="text-sm text-text-secondary">{ticket.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                        <AlertTriangle className="h-3 w-3" /> Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text-secondary text-xs">
                      {timeAgo(ticket.updatedAt)}
                    </div>
                    <SlaBadge ticket={ticket} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTicket(ticket); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdate(ticket.id, { status: 'resolved', resolvedAt: '2026-08-16 14:35:00' });
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-accent/10 hover:text-accent"
                          title="Resolve"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <Ticket className="mx-auto h-10 w-10 mb-3" />
                    <p>No tickets match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modals ─── */}
      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onCreate={handleCreate}
          tenants={tenants}
        />
      )}

      {selectedTicket && (
        <TicketDetailDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleUpdate}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}
