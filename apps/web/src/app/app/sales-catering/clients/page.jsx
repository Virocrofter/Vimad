/* src/app/app/sales-catering/clients/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, User, Users, Phone, Mail, MapPin, Calendar, DollarSign,
  Star, TrendingUp, Search, X, Tag, MessageSquare,
  PartyPopper, FileText, ArrowUpRight, ArrowLeft, Plus,
  PhoneCall, Mail as MailIcon, Video, StickyNote, Award,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

/* ─── Mock Data ─── */
const clientTypeMeta = {
  corporate: { label: 'Corporate', icon: Building2, color: 'text-secondary', bg: 'bg-secondary/10' },
  wedding: { label: 'Wedding', icon: PartyPopper, color: 'text-accent', bg: 'bg-accent/10' },
  social: { label: 'Social', icon: Users, color: 'text-info', bg: 'bg-info/10' },
  nonprofit: { label: 'Nonprofit', icon: Award, color: 'text-warning', bg: 'bg-warning/10' },
  individual: { label: 'Individual', icon: User, color: 'text-text-muted', bg: 'bg-neutral/10' },
};

const activityIcons = {
  call: PhoneCall,
  email: MailIcon,
  meeting: Video,
  note: StickyNote,
};

const initialClients = [
  {
    id: 'CLI-1001',
    name: 'Acme Corporation',
    type: 'corporate',
    primaryContact: 'Sarah Williams',
    email: 's.williams@acme.com',
    phone: '+1 555-1001',
    address: '400 Market St, San Francisco, CA',
    clientSince: '2024-03-12',
    accountManager: 'James M.',
    tags: ['Repeat Client', 'Net-30'],
    lifetimeValue: 96400,
    totalEvents: 4,
    lastEventDate: '2026-05-18',
    nextEventDate: '2026-10-05',
    notes: 'Prefers working lunches over plated service. Always requests breakout rooms for offsites.',
    history: [
      { id: 1, type: 'email', date: '2026-08-12', by: 'James M.', summary: 'Sent revised proposal for Q4 offsite with breakout room pricing.' },
      { id: 2, type: 'call', date: '2026-08-05', by: 'James M.', summary: 'Discussed AV requirements and headcount estimate for October event.' },
      { id: 3, type: 'meeting', date: '2026-07-22', by: 'Maria G.', summary: 'Site walkthrough of Conference Center A with facilities lead.' },
      { id: 4, type: 'note', date: '2026-05-19', by: 'James M.', summary: 'Post-event survey came back 9/10 — praised catering and AV support.' },
    ],
    events: [
      { id: 'EVT-2026-0518-002', name: 'Q2 Leadership Offsite', date: '2026-05-18', type: 'Corporate Meeting', guests: 40, revenue: 12800, status: 'completed' },
      { id: 'EVT-2025-1112-001', name: 'Sales Kickoff', date: '2025-11-12', type: 'Corporate Meeting', guests: 60, revenue: 21600, status: 'completed' },
      { id: 'EVT-2025-0608-003', name: 'Product Launch Reception', date: '2025-06-08', type: 'Cocktail Reception', guests: 90, revenue: 28000, status: 'completed' },
      { id: 'EVT-2024-0910-001', name: 'Regional Sales Meeting', date: '2024-09-10', type: 'Corporate Meeting', guests: 35, revenue: 34000, status: 'completed' },
    ],
  },
  {
    id: 'CLI-1002',
    name: 'Smith Wedding',
    type: 'wedding',
    primaryContact: 'Jane Smith',
    email: 'jane@smithwedding.com',
    phone: '+1 555-0201',
    address: '12 Willow Ln, Sausalito, CA',
    clientSince: '2026-02-01',
    accountManager: 'Maria G.',
    tags: ['VIP'],
    lifetimeValue: 28400,
    totalEvents: 1,
    lastEventDate: null,
    nextEventDate: '2026-08-20',
    notes: 'Bride is detail-oriented — weekly check-ins requested leading up to the event. Deposit received.',
    history: [
      { id: 1, type: 'email', date: '2026-08-11', by: 'Maria G.', summary: 'Confirmed final headcount at 150 guests and floor plan sign-off.' },
      { id: 2, type: 'call', date: '2026-08-04', by: 'Maria G.', summary: 'Walked through timeline for ceremony-to-reception transition.' },
      { id: 3, type: 'meeting', date: '2026-07-15', by: 'Maria G.', summary: 'Tasting session — selected plated dinner menu and bar package.' },
      { id: 4, type: 'note', date: '2026-06-02', by: 'Maria G.', summary: 'Contract signed, 50% deposit received via wire transfer.' },
    ],
    events: [],
  },
  {
    id: 'CLI-1003',
    name: 'DevSummit Inc.',
    type: 'corporate',
    primaryContact: 'Michael Chen',
    email: 'm.chen@devsummit.io',
    phone: '+1 555-1003',
    address: '88 Tech Way, Austin, TX',
    clientSince: '2025-11-20',
    accountManager: 'James M.',
    tags: ['Multi-day', 'Price Sensitive'],
    lifetimeValue: 45200,
    totalEvents: 1,
    lastEventDate: null,
    nextEventDate: '2026-09-15',
    notes: 'Comparing us against a competitor venue on rate — needs a decision by 8/20.',
    history: [
      { id: 1, type: 'call', date: '2026-08-10', by: 'James M.', summary: 'Client pushing back on room rate; exploring bundled AV discount.' },
      { id: 2, type: 'email', date: '2026-08-03', by: 'James M.', summary: 'Sent conference package comparison with breakout session pricing.' },
    ],
    events: [],
  },
  {
    id: 'CLI-1004',
    name: 'Nexus Pharma',
    type: 'corporate',
    primaryContact: 'David Park',
    email: 'd.park@nexuspharma.com',
    phone: '+1 555-1002',
    address: '220 Innovation Dr, San Diego, CA',
    clientSince: '2023-06-15',
    accountManager: 'Maria G.',
    tags: ['Repeat Client', 'VIP', 'Net-30'],
    lifetimeValue: 214600,
    totalEvents: 6,
    lastEventDate: '2026-02-14',
    nextEventDate: '2026-11-10',
    notes: 'One of our highest-value corporate accounts. Annual sales kickoff is a standing booking each November.',
    history: [
      { id: 1, type: 'meeting', date: '2026-08-12', by: 'Maria G.', summary: 'BEO review for November kickoff — finalized AV and staging needs.' },
      { id: 2, type: 'email', date: '2026-08-01', by: 'Maria G.', summary: 'Signed contract received for Sales Kickoff 2026.' },
      { id: 3, type: 'call', date: '2026-02-15', by: 'Maria G.', summary: 'Post-event debrief — client requested earlier load-in time next year.' },
    ],
    events: [
      { id: 'EVT-2026-0214-001', name: 'Regional Training Summit', date: '2026-02-14', type: 'Corporate Meeting', guests: 55, revenue: 31200, status: 'completed' },
      { id: 'EVT-2025-1108-002', name: 'Sales Kickoff', date: '2025-11-08', type: 'Corporate Meeting', guests: 70, revenue: 42800, status: 'completed' },
      { id: 'EVT-2025-0312-001', name: 'Product Advisory Board Dinner', date: '2025-03-12', type: 'Plated Dinner', guests: 20, revenue: 18400, status: 'completed' },
      { id: 'EVT-2024-1105-001', name: 'Sales Kickoff', date: '2024-11-05', type: 'Corporate Meeting', guests: 65, revenue: 39200, status: 'completed' },
    ],
  },
  {
    id: 'CLI-1005',
    name: 'State Youth Soccer League',
    type: 'nonprofit',
    primaryContact: 'Coach Martinez',
    email: 'coach.m@sysl.org',
    phone: '+1 555-1004',
    address: '900 Field Rd, Sacramento, CA',
    clientSince: '2026-07-01',
    accountManager: 'James M.',
    tags: ['Budget Conscious'],
    lifetimeValue: 3200,
    totalEvents: 0,
    lastEventDate: null,
    nextEventDate: '2026-08-14',
    notes: 'First-time client. Tight budget — needs menu options under $35/pp.',
    history: [
      { id: 1, type: 'call', date: '2026-08-08', by: 'James M.', summary: 'Discussed buffet options and applied 15% nonprofit discount.' },
    ],
    events: [],
  },
  {
    id: 'CLI-1006',
    name: 'Grand Hotel Corp',
    type: 'corporate',
    primaryContact: 'Events Team',
    email: 'events@grandhotel.com',
    phone: '+1 555-1005',
    address: '1 Harbor Plaza, Oakland, CA',
    clientSince: '2022-09-01',
    accountManager: 'Maria G.',
    tags: ['Repeat Client'],
    lifetimeValue: 168000,
    totalEvents: 5,
    lastEventDate: '2026-07-28',
    nextEventDate: null,
    notes: 'Sister-property referral partner — sends overflow gala bookings each summer.',
    history: [
      { id: 1, type: 'note', date: '2026-08-01', by: 'Maria G.', summary: 'Post-event survey sent for Corporate Gala; awaiting response.' },
      { id: 2, type: 'meeting', date: '2026-07-10', by: 'Maria G.', summary: 'Final walkthrough and vendor coordination for gala.' },
    ],
    events: [
      { id: 'EVT-2026-0728-001', name: 'Corporate Gala', date: '2026-07-28', type: 'Corporate Gala', guests: 200, revenue: 42000, status: 'completed' },
      { id: 'EVT-2025-0730-001', name: 'Corporate Gala', date: '2025-07-30', type: 'Corporate Gala', guests: 180, revenue: 38400, status: 'completed' },
      { id: 'EVT-2024-0801-001', name: 'Corporate Gala', date: '2024-08-01', type: 'Corporate Gala', guests: 170, revenue: 35600, status: 'completed' },
    ],
  },
  {
    id: 'CLI-1007',
    name: 'Coastal Realty Group',
    type: 'social',
    primaryContact: 'Tom Ellis',
    email: 't.ellis@coastalrealty.com',
    phone: '+1 555-1006',
    address: '55 Bayview Ave, San Rafael, CA',
    clientSince: '2026-01-10',
    accountManager: 'James M.',
    tags: [],
    lifetimeValue: 8600,
    totalEvents: 1,
    lastEventDate: '2026-02-20',
    nextEventDate: null,
    notes: 'Declined most recent proposal over budget — worth a follow-up next quarter.',
    history: [
      { id: 1, type: 'email', date: '2026-08-12', by: 'James M.', summary: 'Client went with a competitor venue for the September dinner.' },
      { id: 2, type: 'call', date: '2026-02-21', by: 'James M.', summary: 'Positive feedback on Client Appreciation Dinner service.' },
    ],
    events: [
      { id: 'EVT-2026-0220-001', name: 'Client Appreciation Dinner', date: '2026-02-20', type: 'Plated Dinner', guests: 50, revenue: 8600, status: 'completed' },
    ],
  },
];

/* ─── Helpers ─── */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function avgEventValue(client) {
  return client.totalEvents > 0 ? client.lifetimeValue / client.totalEvents : 0;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date('2026-08-15');
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

/* ─── Components ─── */
function StatCard({ label, value, subtext, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
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

function ClientCard({ client, onClick }) {
  const type = clientTypeMeta[client.type];
  const TypeIcon = type.icon;
  const next = daysUntil(client.nextEventDate);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-surface p-5 text-left transition-all hover:border-secondary/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', type.bg)}>
            <TypeIcon className={cn('h-5 w-5', type.color)} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-text-primary truncate">{client.name}</h4>
            <p className="text-xs text-text-muted truncate">{client.primaryContact}</p>
          </div>
        </div>
        {client.tags.includes('VIP') && <Star className="h-4 w-4 shrink-0 text-warning fill-warning" />}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Lifetime Value</p>
          <p className="text-sm font-bold font-mono text-text-primary">{formatCurrency(client.lifetimeValue)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Events</p>
          <p className="text-sm font-bold font-mono text-text-primary">{client.totalEvents}</p>
        </div>
      </div>

      {client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {client.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary">
              <Tag className="h-2.5 w-2.5" /> {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-text-muted">
        <span>{client.lastEventDate ? `Last event ${client.lastEventDate}` : 'No past events'}</span>
        {client.nextEventDate && (
          <span className={cn('font-medium', next <= 3 ? 'text-warning' : 'text-text-secondary')}>
            Next in {next}d
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Client Detail Modal ─── */
function ClientDetailModal({ client, onClose, onNavigateProposals }) {
  const [tab, setTab] = useState('overview');
  const type = clientTypeMeta[client.type];
  const TypeIcon = type.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', type.bg)}>
              <TypeIcon className={cn('h-5 w-5', type.color)} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-text-primary truncate">{client.name}</h3>
                {client.tags.includes('VIP') && <Star className="h-4 w-4 shrink-0 text-warning fill-warning" />}
              </div>
              <p className="text-xs text-text-muted">{client.id} · {type.label} · Client since {client.clientSince}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onNavigateProposals}>
              <FileText className="mr-1.5 h-3.5 w-3.5" /> New Proposal
            </Button>
            <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border bg-surface px-6 shrink-0">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'history', label: 'Contact History' },
            { id: 'events', label: 'Past Events' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.id ? 'border-secondary text-secondary' : 'border-transparent text-text-muted hover:text-text-primary'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {tab === 'overview' && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4 text-center">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Lifetime Value</p>
                  <p className="mt-1 text-xl font-bold font-mono text-text-primary">{formatCurrency(client.lifetimeValue)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 text-center">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Events</p>
                  <p className="mt-1 text-xl font-bold font-mono text-secondary">{client.totalEvents}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4 text-center">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Avg. Event Value</p>
                  <p className="mt-1 text-xl font-bold font-mono text-accent">{formatCurrency(avgEventValue(client))}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Contact Information</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <User className="h-4 w-4 text-text-muted" /> {client.primaryContact}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <Mail className="h-4 w-4 text-text-muted" /> {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <Phone className="h-4 w-4 text-text-muted" /> {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <MapPin className="h-4 w-4 text-text-muted" /> {client.address}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    <ArrowUpRight className="h-4 w-4 text-text-muted" /> Account Manager: {client.accountManager}
                  </div>
                  {client.nextEventDate && (
                    <div className="flex items-center gap-2 text-sm text-text-primary">
                      <Calendar className="h-4 w-4 text-text-muted" /> Next event: {client.nextEventDate}
                    </div>
                  )}
                </div>
                {client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                    {client.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2.5 py-1 text-xs text-text-secondary">
                        <Tag className="h-3 w-3" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Account Notes</h4>
                <p className="text-sm text-text-secondary leading-relaxed">{client.notes}</p>
              </div>
            </>
          )}

          {tab === 'history' && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Contact History</h4>
                <Button variant="ghost" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Contact
                </Button>
              </div>
              {client.history.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">No contact history recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {client.history.map((entry) => {
                    const Icon = activityIcons[entry.type] || MessageSquare;
                    return (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-text-primary">{entry.summary}</p>
                          <p className="text-xs text-text-muted mt-0.5">{entry.date} · {entry.by}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'events' && (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="border-b border-border bg-background px-5 py-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Past Events</h4>
              </div>
              {client.events.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">No completed events on file yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary uppercase">Event</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary uppercase">Guests</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-text-secondary uppercase">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {client.events.map((event) => (
                        <tr key={event.id} className="hover:bg-background/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-text-primary font-medium">{event.name}</p>
                            <p className="text-xs text-text-muted">{event.type}</p>
                          </td>
                          <td className="px-4 py-3 text-text-secondary">{event.date}</td>
                          <td className="px-4 py-3 text-right text-text-secondary font-mono">{event.guests}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">{formatCurrency(event.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients] = useState(initialClients);
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('ltv');
  const [selectedClient, setSelectedClient] = useState(null);

  const filteredClients = useMemo(() => {
    const filtered = clients.filter((c) => {
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      const matchesQuery = !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.primaryContact.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
    const sorted = [...filtered];
    if (sortBy === 'ltv') sorted.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
    if (sortBy === 'events') sorted.sort((a, b) => b.totalEvents - a.totalEvents);
    if (sortBy === 'recent') sorted.sort((a, b) => (b.lastEventDate || '').localeCompare(a.lastEventDate || ''));
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [clients, typeFilter, query, sortBy]);

  const stats = useMemo(() => {
    const totalLTV = clients.reduce((sum, c) => sum + c.lifetimeValue, 0);
    const avgLTV = clients.length > 0 ? totalLTV / clients.length : 0;
    const vipCount = clients.filter((c) => c.tags.includes('VIP')).length;
    const upcoming = clients.filter((c) => c.nextEventDate).length;
    return { totalLTV, avgLTV, vipCount, upcoming };
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => navigate('/app/sales-catering')}
            className="mb-1 flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-3 w-3" /> Sales & Catering
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Clients & Accounts</h1>
          <p className="text-sm text-text-secondary">Contact history, past events, and lifetime value by account</p>
        </div>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> New Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Lifetime Value" value={formatCurrency(stats.totalLTV)} icon={DollarSign} color="text-secondary" subtext={`${clients.length} accounts`} />
        <StatCard label="Avg. Account Value" value={formatCurrency(stats.avgLTV)} icon={TrendingUp} color="text-accent" />
        <StatCard label="VIP Accounts" value={stats.vipCount} icon={Star} color="text-warning" />
        <StatCard label="Upcoming Events" value={stats.upcoming} icon={Calendar} color="text-info" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ltv">Sort: Lifetime Value</option>
            <option value="events">Sort: Total Events</option>
            <option value="recent">Sort: Most Recent</option>
            <option value="name">Sort: Name (A–Z)</option>
          </select>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTypeFilter('all')}
          className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors border', typeFilter === 'all' ? 'bg-secondary text-white border-secondary' : 'bg-surface text-text-secondary border-border')}
        >
          All Accounts
        </button>
        {Object.entries(clientTypeMeta).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors border flex items-center gap-1.5',
              typeFilter === key ? cn(meta.bg, meta.color, 'border-transparent') : 'bg-surface text-text-secondary border-border'
            )}
          >
            <meta.icon className="h-3 w-3" /> {meta.label}
          </button>
        ))}
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <ClientCard key={client.id} client={client} onClick={() => setSelectedClient(client)} />
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-text-muted">No clients match your filters.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onNavigateProposals={() => navigate('/app/sales-catering/proposals')}
        />
      )}
    </div>
  );
}