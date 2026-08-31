/* src/app/app/sales-catering/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Plus,
  Filter,
  Search,
  ChevronRight,
  BarChart3,
  PieChart,
  Target,
  Award,
  FileText,
  MessageSquare,
  Star,
  MoreHorizontal,
  Building2,
  Utensils,
  PartyPopper,
  X,
  Download,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

/* ─── Mock Data ─── */
const pipelineStages = [
  {
    id: 'inquiry',
    label: 'Inquiry',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
  },
  {
    id: 'proposal',
    label: 'Proposal Sent',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  {
    id: 'negotiation',
    label: 'Negotiation',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    id: 'contract',
    label: 'Contract',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  {
    id: 'definite',
    label: 'Definite',
    color: 'text-success',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    id: 'completed',
    label: 'Completed',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
  },
];

const leads = [
  {
    id: 'LEAD-2026-0812-001',
    client: 'Acme Corporation',
    contact: 'Sarah Williams',
    email: 's.williams@acme.com',
    phone: '+1 555-1001',
    stage: 'proposal',
    eventType: 'Corporate Meeting',
    eventDate: '2026-10-05',
    revenue: 18500,
    probability: 70,
    lastActivity: '2026-08-12',
    nextFollowUp: '2026-08-15',
    assignedTo: 'James M.',
    notes: 'Waiting on AV requirements. Client wants breakout rooms.',
  },
  {
    id: 'LEAD-2026-0812-002',
    client: 'Smith Wedding',
    contact: 'Jane Smith',
    email: 'jane@smithwedding.com',
    phone: '+1 555-0201',
    stage: 'contract',
    eventType: 'Wedding Reception',
    eventDate: '2026-08-20',
    revenue: 28400,
    probability: 90,
    lastActivity: '2026-08-11',
    nextFollowUp: '2026-08-13',
    assignedTo: 'Maria G.',
    notes: 'Contract sent for signature. Deposit pending.',
  },
  {
    id: 'LEAD-2026-0812-003',
    client: 'DevSummit Inc.',
    contact: 'Michael Chen',
    email: 'm.chen@devsummit.io',
    phone: '+1 555-1003',
    stage: 'negotiation',
    eventType: 'Tech Conference',
    eventDate: '2026-09-15',
    revenue: 45200,
    probability: 60,
    lastActivity: '2026-08-10',
    nextFollowUp: '2026-08-14',
    assignedTo: 'James M.',
    notes: 'Pushing back on room rate. Considering competitor venue.',
  },
  {
    id: 'LEAD-2026-0812-004',
    client: 'Nexus Pharma',
    contact: 'David Park',
    email: 'd.park@nexuspharma.com',
    phone: '+1 555-1002',
    stage: 'definite',
    eventType: 'Sales Kickoff',
    eventDate: '2026-11-10',
    revenue: 67800,
    probability: 100,
    lastActivity: '2026-08-12',
    nextFollowUp: '2026-08-20',
    assignedTo: 'Maria G.',
    notes: 'Signed contract received. BEO draft in progress.',
  },
  {
    id: 'LEAD-2026-0812-005',
    client: 'State Youth Soccer League',
    contact: 'Coach Martinez',
    email: 'coach.m@sysl.org',
    phone: '+1 555-1004',
    stage: 'inquiry',
    eventType: 'Tournament Banquet',
    eventDate: '2026-08-14',
    revenue: 3200,
    probability: 30,
    lastActivity: '2026-08-08',
    nextFollowUp: '2026-08-13',
    assignedTo: 'James M.',
    notes: 'Budget concerns. Needs menu options under $35/pp.',
  },
  {
    id: 'LEAD-2026-0812-006',
    client: 'Grand Hotel Corp',
    contact: 'Events Team',
    email: 'events@grandhotel.com',
    phone: '+1 555-1005',
    stage: 'completed',
    eventType: 'Corporate Gala',
    eventDate: '2026-07-28',
    revenue: 42000,
    probability: 100,
    lastActivity: '2026-08-01',
    nextFollowUp: null,
    assignedTo: 'Maria G.',
    notes: 'Event completed successfully. Post-event survey sent.',
  },
];

const upcomingEvents = [
  {
    id: 'EVT-2026-0814-001',
    name: 'Youth Soccer Tournament Banquet',
    client: 'State Youth Soccer League',
    date: '2026-08-14',
    startTime: '18:00',
    endTime: '21:00',
    venue: 'Grand Ballroom',
    guests: 120,
    status: 'confirmed',
    setup: 'Banquet Rounds',
    catering: 'Buffet Dinner',
    revenue: 3200,
  },
  {
    id: 'EVT-2026-0815-001',
    name: 'Johnson Family Reunion Dinner',
    client: 'Johnson Family',
    date: '2026-08-15',
    startTime: '19:00',
    endTime: '22:00',
    venue: 'Terrace Room',
    guests: 45,
    status: 'confirmed',
    setup: 'Family Style',
    catering: 'Plated Dinner',
    revenue: 2800,
  },
  {
    id: 'EVT-2026-0820-001',
    name: 'Smith Wedding Reception',
    client: 'Smith Wedding',
    date: '2026-08-20',
    startTime: '17:00',
    endTime: '23:00',
    venue: 'Grand Ballroom + Terrace',
    guests: 150,
    status: 'confirmed',
    setup: 'Banquet Rounds + Dance Floor',
    catering: 'Wedding Package B',
    revenue: 28400,
  },
  {
    id: 'EVT-2026-0822-001',
    name: 'Acme Corp Q3 Planning Session',
    client: 'Acme Corporation',
    date: '2026-08-22',
    startTime: '09:00',
    endTime: '17:00',
    venue: 'Conference Center A',
    guests: 25,
    status: 'tentative',
    setup: 'U-Shape',
    catering: 'Working Lunch + Breaks',
    revenue: 1850,
  },
];

const monthlyRevenue = [
  { month: 'Mar', revenue: 42000, target: 45000 },
  { month: 'Apr', revenue: 38000, target: 45000 },
  { month: 'May', revenue: 52000, target: 50000 },
  { month: 'Jun', revenue: 61000, target: 55000 },
  { month: 'Jul', revenue: 48000, target: 55000 },
  { month: 'Aug', revenue: 34200, target: 50000 },
];

const eventTypeBreakdown = [
  { type: 'Corporate', count: 12, revenue: 186000, color: 'bg-secondary' },
  { type: 'Wedding', count: 8, revenue: 142000, color: 'bg-accent' },
  { type: 'Social', count: 6, revenue: 34000, color: 'bg-info' },
  { type: 'Conference', count: 4, revenue: 98000, color: 'bg-warning' },
  { type: 'Banquet', count: 5, revenue: 28000, color: 'bg-danger' },
];

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const today = new Date('2026-08-15');
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function getStageMeta(stageId) {
  return pipelineStages.find((s) => s.id === stageId) || pipelineStages[0];
}

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color, trend }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn(
                'mt-1 text-xs font-medium flex items-center gap-1',
                trend >= 0 ? 'text-accent' : 'text-danger'
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend >= 0 ? '+' : ''}
              {trend}% vs last month
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

function PipelineColumn({ stage, leads, onLeadClick }) {
  const meta = getStageMeta(stage);
  const stageLeads = leads.filter((l) => l.stage === stage);
  const totalValue = stageLeads.reduce((s, l) => s + l.revenue * (l.probability / 100), 0);

  return (
    <div className="flex flex-col min-w-[260px] max-w-[260px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', meta.color.replace('text-', 'bg-'))} />
          <span className="text-sm font-semibold text-text-primary">{meta.label}</span>
        </div>
        <span className="text-xs text-text-muted">{stageLeads.length}</span>
      </div>
      <div className="space-y-3">
        {stageLeads.map((lead) => (
          <button
            key={lead.id}
            onClick={() => onLeadClick(lead)}
            className="w-full rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-secondary/50 hover:shadow-md group"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-text-primary group-hover:text-secondary transition-colors">
                {lead.client}
              </h4>
              <span
                className={cn(
                  'text-xs font-bold font-mono',
                  lead.probability >= 80
                    ? 'text-accent'
                    : lead.probability >= 50
                      ? 'text-warning'
                      : 'text-info'
                )}
              >
                {lead.probability}%
              </span>
            </div>
            <p className="text-xs text-text-muted mb-2">{lead.eventType}</p>
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
              <Calendar className="h-3 w-3 text-text-muted" />
              {lead.eventDate}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono text-text-primary">
                {formatCurrency(lead.revenue)}
              </span>
              <span className="text-[10px] text-text-muted">{lead.assignedTo}</span>
            </div>
            {lead.nextFollowUp && daysUntil(lead.nextFollowUp) <= 2 && (
              <div className="mt-2 flex items-center gap-1 text-[10px] text-warning">
                <Clock className="h-3 w-3" />
                Follow-up{' '}
                {daysUntil(lead.nextFollowUp) === 0
                  ? 'today'
                  : daysUntil(lead.nextFollowUp) === 1
                    ? 'tomorrow'
                    : `in ${daysUntil(lead.nextFollowUp)} days`}
              </div>
            )}
          </button>
        ))}
        {stageLeads.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <p className="text-xs text-text-muted">No leads</p>
          </div>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-text-muted text-center">
          Weighted:{' '}
          <span className="font-mono font-medium text-text-primary">
            {formatCurrency(totalValue)}
          </span>
        </p>
      </div>
    </div>
  );
}

function EventCard({ event, compact = false }) {
  const days = daysUntil(event.date);
  const statusMeta = {
    confirmed: { class: 'bg-accent/10 text-accent border-accent/20', label: 'Confirmed' },
    tentative: { class: 'bg-warning/10 text-warning border-warning/20', label: 'Tentative' },
    cancelled: { class: 'bg-danger/10 text-danger border-danger/20', label: 'Cancelled' },
  }[event.status] || { class: 'bg-neutral/10 text-text-muted border-border', label: 'Draft' };

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 hover:bg-background/50 transition-colors">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            statusMeta.class.split(' ')[0]
          )}
        >
          <Calendar className={cn('h-5 w-5', statusMeta.class.split(' ')[1])} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{event.name}</p>
          <p className="text-xs text-text-muted">
            {event.venue} · {event.guests} guests
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-text-primary">{event.date}</p>
          <p
            className={cn('text-[10px]', days <= 1 ? 'text-danger font-medium' : 'text-text-muted')}
          >
            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 hover:border-secondary/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              statusMeta.class.split(' ')[0]
            )}
          >
            <PartyPopper className={cn('h-5 w-5', statusMeta.class.split(' ')[1])} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text-primary">{event.name}</h4>
            <p className="text-xs text-text-muted">{event.client}</p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium',
            statusMeta.class
          )}
        >
          {statusMeta.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Calendar className="h-3.5 w-3.5 text-text-muted" />
          {event.date}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Clock className="h-3.5 w-3.5 text-text-muted" />
          {event.startTime} — {event.endTime}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Building2 className="h-3.5 w-3.5 text-text-muted" />
          {event.venue}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Users className="h-3.5 w-3.5 text-text-muted" />
          {event.guests} guests
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{event.setup}</span>
          <span className="text-xs text-text-muted">·</span>
          <span className="text-xs text-text-muted">{event.catering}</span>
        </div>
        <span className="text-sm font-bold font-mono text-text-primary">
          {formatCurrency(event.revenue)}
        </span>
      </div>
    </div>
  );
}

/* ─── Lead Detail Modal ─── */
function LeadDetailModal({ lead, onClose }) {
  if (!lead) return null;
  const meta = getStageMeta(lead.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-text-primary">{lead.client}</h3>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    meta.bg,
                    meta.color,
                    meta.border
                  )}
                >
                  {meta.label}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {lead.id} · {lead.eventType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <FileText className="mr-1.5 h-3.5 w-3.5" /> Proposal
              </Button>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Potential Revenue</p>
              <p className="mt-1 text-xl font-bold font-mono text-text-primary">
                {formatCurrency(lead.revenue)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Probability</p>
              <p
                className={cn(
                  'mt-1 text-xl font-bold font-mono',
                  lead.probability >= 80
                    ? 'text-accent'
                    : lead.probability >= 50
                      ? 'text-warning'
                      : 'text-info'
                )}
              >
                {lead.probability}%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <p className="text-xs text-text-muted uppercase tracking-wider">Weighted Value</p>
              <p className="mt-1 text-xl font-bold font-mono text-secondary">
                {formatCurrency(lead.revenue * (lead.probability / 100))}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Users className="h-4 w-4 text-text-muted" /> {lead.contact}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Mail className="h-4 w-4 text-text-muted" /> {lead.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Phone className="h-4 w-4 text-text-muted" /> {lead.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Calendar className="h-4 w-4 text-text-muted" /> Event: {lead.eventDate}
              </div>
            </div>
          </div>

          {/* Pipeline Progress */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
              Pipeline Progress
            </h4>
            <div className="flex items-center">
              {pipelineStages.map((stage, i) => {
                const isActive = pipelineStages.findIndex((s) => s.id === lead.stage) >= i;
                const isCurrent = stage.id === lead.stage;
                return (
                  <div key={stage.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors',
                          isCurrent
                            ? 'border-secondary bg-secondary text-white'
                            : isActive
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border bg-background text-text-muted'
                        )}
                      >
                        {isActive ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <span
                        className={cn(
                          'mt-1.5 text-[10px] font-medium text-center',
                          isActive ? 'text-text-primary' : 'text-text-muted'
                        )}
                      >
                        {stage.label}
                      </span>
                    </div>
                    {i < pipelineStages.length - 1 && (
                      <div
                        className={cn('h-0.5 flex-1 mx-1', isActive ? 'bg-accent' : 'bg-border')}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Internal Notes
            </h4>
            <p className="text-sm text-text-secondary leading-relaxed">{lead.notes}</p>
          </div>

          {/* Activity */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              Recent Activity
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                  JM
                </div>
                <div>
                  <p className="text-sm text-text-primary">
                    Updated probability to {lead.probability}%
                  </p>
                  <p className="text-xs text-text-muted">
                    {lead.lastActivity} · {lead.assignedTo}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-info/10 text-xs font-bold text-info">
                  SY
                </div>
                <div>
                  <p className="text-sm text-text-primary">Initial inquiry received via website</p>
                  <p className="text-xs text-text-muted">2026-08-01 · System</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function SalesCateringPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'pipeline'
  const [stageFilter, setStageFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  /* ─── Computed Data ─── */
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesStage = stageFilter === 'all' || l.stage === stageFilter;
      const matchesQuery =
        !query ||
        l.client.toLowerCase().includes(query.toLowerCase()) ||
        l.contact.toLowerCase().includes(query.toLowerCase()) ||
        l.eventType.toLowerCase().includes(query.toLowerCase()) ||
        l.id.toLowerCase().includes(query.toLowerCase());
      return matchesStage && matchesQuery;
    });
  }, [stageFilter, query]);

  const stats = useMemo(() => {
    const activeLeads = leads.filter((l) => l.stage !== 'completed');
    const totalPipeline = activeLeads.reduce((s, l) => s + l.revenue * (l.probability / 100), 0);
    const totalPotential = activeLeads.reduce((s, l) => s + l.revenue, 0);
    const thisMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1].revenue;
    const winRate =
      (leads.filter((l) => l.stage === 'completed').length /
        leads.filter((l) => l.stage === 'completed' || l.stage === 'definite').length) *
      100;
    return { totalPipeline, totalPotential, thisMonthRevenue, winRate: Math.round(winRate) || 0 };
  }, []);

  const upcomingThisWeek = upcomingEvents.filter((e) => daysUntil(e.date) <= 7);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sales & Catering</h1>
          <p className="text-sm text-text-secondary">
            Event pipeline, lead management, and revenue tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export Report
          </Button>
          <Button size="sm" onClick={() => navigate('/app/sales-catering/leads')}>
            <Plus className="mr-1.5 h-4 w-4" /> New Lead
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Pipeline Value"
          value={formatCurrency(stats.totalPipeline)}
          icon={Target}
          color="text-secondary"
          subtext={`${leads.filter((l) => l.stage !== 'completed').length} active leads`}
        />
        <StatCard
          label="Potential Revenue"
          value={formatCurrency(stats.totalPotential)}
          icon={DollarSign}
          color="text-accent"
          subtext="If all close at 100%"
        />
        <StatCard
          label="This Month"
          value={formatCurrency(stats.thisMonthRevenue)}
          icon={BarChart3}
          color="text-info"
          trend={-12}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          icon={Award}
          color="text-warning"
          subtext="Closed vs Definite"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: PieChart },
            { id: 'pipeline', label: 'Pipeline', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Dashboard Tab ─── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Upcoming Events */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-secondary" /> Upcoming Events
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/app/sales-catering/events')}
                >
                  View Calendar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {upcomingThisWeek.length > 0 && (
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning shrink-0" />
                  <p className="text-xs text-text-secondary">
                    <span className="font-medium">{upcomingThisWeek.length} events</span> happening
                    in the next 7 days
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Revenue Breakdown */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-secondary" /> Revenue by Type
                </h3>
                <div className="space-y-3">
                  {eventTypeBreakdown.map((item) => (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary">{item.type}</span>
                        <span className="text-xs font-mono font-bold text-text-primary">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', item.color)}
                          style={{ width: `${(item.revenue / 490000) * 100}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-text-muted">{item.count} events</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">Total YTD</span>
                    <span className="font-bold font-mono text-text-primary">
                      {formatCurrency(490000)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Trend */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary" /> Monthly Trend
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {monthlyRevenue.map((m) => {
                    const pct = (m.revenue / 70000) * 100;
                    const targetPct = (m.target / 70000) * 100;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="relative w-full flex justify-center"
                          style={{ height: `${targetPct}%` }}
                        >
                          <div
                            className="absolute bottom-0 w-full max-w-[28px] rounded-t bg-border/50"
                            style={{ height: '100%' }}
                          />
                          <div
                            className={cn(
                              'absolute bottom-0 w-full max-w-[28px] rounded-t transition-all',
                              m.revenue >= m.target ? 'bg-accent' : 'bg-warning'
                            )}
                            style={{ height: `${(m.revenue / m.target) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-muted font-medium">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-accent" /> Actual
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-border" /> Target
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => navigate('/app/sales-catering/events')}
                  >
                    <Calendar className="mr-2 h-4 w-4" /> Event Calendar
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => navigate('/app/sales-catering/leads')}
                  >
                    <Briefcase className="mr-2 h-4 w-4" /> Manage Leads
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => navigate('/app/sales-catering/catering')}
                  >
                    <Utensils className="mr-2 h-4 w-4" /> Catering Menus
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => navigate('/app/sales-catering/venues')}
                  >
                    <Building2 className="mr-2 h-4 w-4" /> Venue Setup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Pipeline Tab ─── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search leads..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
                  showFilters
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                )}
              >
                <Filter className="h-4 w-4" /> Filter
              </button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="rounded-lg border border-border bg-surface p-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-text-muted">Stage:</span>
              <button
                onClick={() => setStageFilter('all')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  stageFilter === 'all'
                    ? 'bg-secondary text-white'
                    : 'bg-background text-text-secondary border border-border'
                )}
              >
                All
              </button>
              {pipelineStages
                .filter((s) => s.id !== 'completed')
                .map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setStageFilter(stage.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                      stageFilter === stage.id
                        ? stage.bg + ' ' + stage.color + ' ' + stage.border
                        : 'bg-background text-text-secondary border-border'
                    )}
                  >
                    {stage.label}
                  </button>
                ))}
            </div>
          )}

          {/* Pipeline Board */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-max">
              {pipelineStages
                .filter((s) => s.id !== 'completed')
                .map((stage) => (
                  <PipelineColumn
                    key={stage.id}
                    stage={stage.id}
                    leads={filteredLeads}
                    onLeadClick={setSelectedLead}
                  />
                ))}
            </div>
          </div>

          {/* Completed Section */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" /> Recently Completed
              </h3>
              <span className="text-xs text-text-muted">
                {leads.filter((l) => l.stage === 'completed').length} events
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {leads
                .filter((l) => l.stage === 'completed')
                .map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="rounded-lg border border-border bg-background p-4 text-left hover:border-secondary/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-text-primary">{lead.client}</h4>
                      <Star className="h-4 w-4 text-warning fill-warning" />
                    </div>
                    <p className="text-xs text-text-muted mb-2">
                      {lead.eventType} · {lead.eventDate}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-mono text-accent">
                        {formatCurrency(lead.revenue)}
                      </span>
                      <span className="text-[10px] text-text-muted">{lead.assignedTo}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
