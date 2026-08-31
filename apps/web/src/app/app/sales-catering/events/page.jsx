/* src/app/app/sales-catering/beos/event/page.jsx */
import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  Users,
  MapPin,
  Utensils,
  Wine,
  Coffee,
  Mic,
  Projector,
  Music,
  Camera,
  Wifi,
  Printer,
  Flower2,
  Gift,
  Check,
  X,
  Edit3,
  Printer as PrinterIcon,
  Download,
  Mail,
  Phone,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Clock as ClockIcon,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  Ban,
  ArrowUpDown,
  MoreHorizontal,
  Tag,
  DollarSign,
  Receipt,
  Building2,
  User,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';

/* ─── Mock Data ─── */
const eventData = {
  id: 'BEO-2026-0842',
  status: 'confirmed',
  version: 3,
  lastPrinted: '2026-08-14 09:30 AM',
  eventName: 'TechConf 2026 — Welcome Reception',
  eventType: 'Cocktail Reception',
  functionSpace: 'Grand Ballroom',
  alternateSpace: null,
  setupStyle: 'Cocktail — High Tables',
  date: '2026-09-15',
  startTime: '6:00 PM',
  endTime: '9:00 PM',
  setupStart: '4:00 PM',
  teardownEnd: '10:30 PM',
  guestCount: 120,
  guaranteedCount: 110,

  client: {
    company: 'DevSummit Inc.',
    contactName: 'Michael Chen',
    contactTitle: 'Event Coordinator',
    email: 'm.chen@devsummit.io',
    phone: '+1 555-0202',
    accountNumber: 'ACC-4521',
    billingAddress: '300 Tech Blvd, San Francisco, CA 94102',
    taxId: '45-6789012',
  },

  booking: {
    blockId: 'GRP-1002',
    bookingType: 'Corporate',
    market: 'Corporate Meetings',
    salesManager: 'Sarah Williams',
    contractNumber: 'CNT-2026-0891',
    contractDate: '2026-07-20',
    deposit: 2500,
    depositPaid: true,
    paymentTerms: 'Net 30',
  },

  menu: {
    serviceStyle: "Passed Hors d'Oeuvres + Stationed Displays",
    dietaryNotes: '5 vegan, 3 gluten-free, 2 nut allergy',
    courses: [
      {
        category: "Passed Hors d'Oeuvres",
        items: [
          { name: 'Ahi Tuna Tartare on Crispy Wonton', qty: 120, portion: 'each', price: 4.5 },
          { name: 'Mini Beef Wellington', qty: 120, portion: 'each', price: 5.25 },
          { name: 'Caprese Skewers with Balsamic Glaze', qty: 120, portion: 'each', price: 3.75 },
          { name: 'Truffle Arancini', qty: 120, portion: 'each', price: 4.0 },
        ],
      },
      {
        category: 'Stationed Displays',
        items: [
          { name: 'Artisan Charcuterie & Cheese Board', qty: 4, portion: 'display', price: 185.0 },
          { name: 'Mediterranean Mezze Station', qty: 2, portion: 'display', price: 145.0 },
          { name: 'Sushi & Sashimi Bar', qty: 1, portion: 'chef-station', price: 450.0 },
        ],
      },
      {
        category: 'Dessert',
        items: [
          { name: 'Assorted Macarons', qty: 120, portion: 'each', price: 2.5 },
          { name: 'Chocolate Fondue Station', qty: 1, portion: 'station', price: 220.0 },
        ],
      },
    ],
  },

  beverage: {
    serviceStyle: 'Open Bar — Premium',
    notes: 'Signature cocktail: "TechTonic" (gin, elderflower, cucumber)',
    packages: [
      { name: 'Premium Open Bar (3 hrs)', qty: 120, price: 28.0 },
      { name: 'Champagne Toast', qty: 120, price: 12.0 },
      { name: 'Specialty Coffee & Tea Station', qty: 1, price: 350.0 },
    ],
  },

  resources: [
    {
      category: 'AV & Technology',
      items: [
        { name: 'Wireless Microphone (Handheld)', qty: 2, price: 45.0 },
        { name: 'Projector & Screen (120")', qty: 1, price: 185.0 },
        { name: 'LED Uplighting — Ballroom', qty: 16, price: 25.0 },
        { name: 'Wi-Fi Upgrade (500 Mbps)', qty: 1, price: 150.0 },
      ],
    },
    {
      category: 'Furniture & Décor',
      items: [
        { name: 'Highboy Tables (30")', qty: 15, price: 18.0 },
        { name: 'Bar Stools', qty: 30, price: 8.0 },
        { name: 'Linen — Black Velvet', qty: 15, price: 22.0 },
        { name: 'Floral Centerpieces (High)', qty: 8, price: 85.0 },
      ],
    },
    {
      category: 'Service Staff',
      items: [
        { name: 'Bartender', qty: 3, price: 185.0 },
        { name: 'Server / Passer', qty: 6, price: 155.0 },
        { name: 'Event Captain', qty: 1, price: 250.0 },
        { name: 'Security', qty: 2, price: 125.0 },
      ],
    },
  ],

  roomSetup: {
    diagramUrl: null,
    entrance: 'Main Ballroom Entry',
    coatCheck: true,
    registrationTable: true,
    vipArea: 'Mezzanine overlook — reserved',
    danceFloor: false,
    stage: false,
    notes: 'TechConf branding on digital displays. Welcome screen with agenda.',
  },

  timeline: [
    {
      time: '4:00 PM',
      department: 'Setup',
      task: 'Room flip from afternoon session',
      owner: 'Banquet',
      status: 'pending',
    },
    {
      time: '4:30 PM',
      department: 'AV',
      task: 'Sound check & lighting preset',
      owner: 'Tech Team',
      status: 'pending',
    },
    {
      time: '5:00 PM',
      department: 'F&B',
      task: 'Final food prep & plating',
      owner: 'Kitchen',
      status: 'pending',
    },
    {
      time: '5:30 PM',
      department: 'Banquet',
      task: 'Bar setup & stock',
      owner: 'F&B',
      status: 'pending',
    },
    {
      time: '5:45 PM',
      department: 'Front Office',
      task: 'Registration table ready',
      owner: 'Events',
      status: 'pending',
    },
    {
      time: '6:00 PM',
      department: 'All',
      task: 'Doors open / Guest arrival',
      owner: 'Captain',
      status: 'pending',
    },
    {
      time: '6:30 PM',
      department: 'AV',
      task: 'Welcome remarks — MC mic check',
      owner: 'Tech Team',
      status: 'pending',
    },
    {
      time: '7:00 PM',
      department: 'F&B',
      task: 'Passed service begins',
      owner: 'Kitchen',
      status: 'pending',
    },
    {
      time: '8:00 PM',
      department: 'F&B',
      task: 'Champagne toast',
      owner: 'Captain',
      status: 'pending',
    },
    {
      time: '9:00 PM',
      department: 'All',
      task: 'Last call / Event conclusion',
      owner: 'Captain',
      status: 'pending',
    },
    {
      time: '9:30 PM',
      department: 'Banquet',
      task: 'Breakdown & clearing',
      owner: 'Banquet',
      status: 'pending',
    },
    {
      time: '10:30 PM',
      department: 'All',
      task: 'Room reset complete',
      owner: 'Banquet',
      status: 'pending',
    },
  ],

  notes: {
    internal: [
      {
        id: 1,
        author: 'Sarah W.',
        date: '2026-08-10',
        content:
          'Client requested extra power strips near registration. Housekeeping to place 4 strips.',
      },
      {
        id: 2,
        author: 'Mike C.',
        date: '2026-08-12',
        content:
          'VIP guest list updated — 12 C-suite attendees. Ensure mezzanine is prepped early.',
      },
    ],
    external: [
      {
        id: 3,
        author: 'Sarah W.',
        date: '2026-08-05',
        content:
          'Please confirm final guest count 72 hours prior to event. Menu pricing based on 110 guaranteed.',
      },
    ],
  },

  charges: {
    foodTotal: 2845.0,
    beverageTotal: 3710.0,
    rentalTotal: 1620.0,
    laborTotal: 2345.0,
    serviceCharge: 1052.0,
    tax: 952.8,
    subtotal: 11572.8,
    grandTotal: 12525.6,
  },
};

const statusMeta = {
  confirmed: {
    label: 'Confirmed',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: CheckCircle2,
  },
  tentative: {
    label: 'Tentative',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
    icon: ClockIcon,
  },
  cancelled: {
    label: 'Cancelled',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: Ban,
  },
  completed: {
    label: 'Completed',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    icon: Check,
  },
};

const timelineStatusMeta = {
  pending: { dot: 'bg-text-muted', label: 'Pending' },
  in_progress: { dot: 'bg-info', label: 'In Progress' },
  completed: { dot: 'bg-accent', label: 'Done' },
  issue: { dot: 'bg-danger', label: 'Issue' },
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/* ─── Components ─── */
function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-background px-5 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-secondary" />}
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatPill({ label, value, color = 'text-text-primary' }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
      <p className={cn('text-sm font-bold font-mono mt-0.5', color)}>{value}</p>
    </div>
  );
}

function TimelineItem({ item, index, onToggle }) {
  const meta = timelineStatusMeta[item.status];
  return (
    <div className="flex items-start gap-3 group">
      <div className="flex flex-col items-center">
        <button
          onClick={() => onToggle(index)}
          className={cn(
            'h-3 w-3 rounded-full border-2 transition-colors',
            item.status === 'completed'
              ? 'bg-accent border-accent'
              : 'border-border bg-background hover:border-secondary'
          )}
        />
        {index < 11 && <div className="w-px h-full min-h-[28px] bg-border mt-1" />}
      </div>
      <div className={cn('flex-1 pb-3', item.status === 'completed' && 'opacity-60')}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary">{item.time}</span>
          <span className={cn('text-[10px] font-medium', meta.dot.replace('bg-', 'text-'))}>
            {meta.label}
          </span>
        </div>
        <p className="text-sm text-text-secondary mt-0.5">{item.task}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-text-muted bg-background px-1.5 py-0.5 rounded border border-border">
            {item.department}
          </span>
          <span className="text-[10px] text-text-muted">{item.owner}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BEOEventPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const beoId = searchParams.get('id') || eventData.id;

  const [activeTab, setActiveTab] = useState('overview');
  const [event, setEvent] = useState(eventData);
  const [timeline, setTimeline] = useState(eventData.timeline);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const meta = statusMeta[event.status];
  const StatusIcon = meta.icon;

  const toggleTimeline = (index) => {
    setTimeline((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const next = {
          pending: 'completed',
          completed: 'pending',
          in_progress: 'completed',
          issue: 'pending',
        };
        return { ...t, status: next[t.status] || 'pending' };
      })
    );
  };

  const completedCount = timeline.filter((t) => t.status === 'completed').length;
  const progress = Math.round((completedCount / timeline.length) * 100);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'menu', label: 'Menu & Beverage', icon: Utensils },
    { id: 'resources', label: 'Resources & Setup', icon: Briefcase },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'charges', label: 'Charges', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/sales-catering/beos')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated text-text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary">{event.eventName}</h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
                  meta.class
                )}
              >
                <StatusIcon className={cn('h-3 w-3', meta.dot.replace('bg-', 'text-'))} />
                {meta.label}
              </span>
              <span className="text-xs text-text-muted font-mono">
                {event.id} · v{event.version}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">
              {event.date} · {event.startTime} — {event.endTime} · {event.functionSpace}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> {editMode ? 'Done' : 'Edit'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPrintOptions(true)}>
              <PrinterIcon className="mr-1.5 h-3.5 w-3.5" /> Print BEO
            </Button>
            <Button size="sm">
              <Send className="mr-1.5 h-3.5 w-3.5" /> Send to Client
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatPill
            label="Guest Count"
            value={`${event.guestCount} (${event.guaranteedCount} guar.)`}
          />
          <StatPill label="Function Space" value={event.functionSpace} color="text-secondary" />
          <StatPill label="Setup Style" value={event.setupStyle} />
          <StatPill label="Event Type" value={event.eventType} />
          <StatPill label="Setup Start" value={event.setupStart} color="text-info" />
          <StatPill label="Teardown" value={event.teardownEnd} color="text-warning" />
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors -mb-px',
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

      {/* ─── Overview Tab ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Info */}
            <SectionCard title="Client & Booking Details" icon={Building2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Company</p>
                    <p className="text-sm font-medium text-text-primary">{event.client.company}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Contact</p>
                    <p className="text-sm text-text-primary">
                      {event.client.contactName} · {event.client.contactTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                    {event.client.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Phone className="h-3.5 w-3.5 text-text-muted" />
                    {event.client.phone}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Block ID</p>
                    <p className="text-sm font-mono text-text-primary">{event.booking.blockId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">
                      Sales Manager
                    </p>
                    <p className="text-sm text-text-primary">{event.booking.salesManager}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Contract</p>
                    <p className="text-sm font-mono text-text-primary">
                      {event.booking.contractNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">
                      Deposit:
                    </span>
                    <span
                      className={cn(
                        'text-xs font-bold',
                        event.booking.depositPaid ? 'text-accent' : 'text-danger'
                      )}
                    >
                      {event.booking.depositPaid ? 'Paid' : 'Pending'} ·{' '}
                      {formatCurrency(event.booking.deposit)}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Room Setup */}
            <SectionCard
              title="Room Setup & Layout"
              icon={MapPin}
              action={
                <Button variant="ghost" size="sm">
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View Diagram
                </Button>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Setup Style', value: event.roomSetup.setupStyle },
                  { label: 'Entrance', value: event.roomSetup.entrance },
                  {
                    label: 'Coat Check',
                    value: event.roomSetup.coatCheck ? 'Yes' : 'No',
                    color: event.roomSetup.coatCheck ? 'text-accent' : 'text-text-muted',
                  },
                  {
                    label: 'Registration',
                    value: event.roomSetup.registrationTable ? 'Yes' : 'No',
                    color: event.roomSetup.registrationTable ? 'text-accent' : 'text-text-muted',
                  },
                  { label: 'VIP Area', value: event.roomSetup.vipArea },
                  {
                    label: 'Dance Floor',
                    value: event.roomSetup.danceFloor ? 'Yes' : 'No',
                    color: event.roomSetup.danceFloor ? 'text-accent' : 'text-text-muted',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p
                      className={cn(
                        'text-sm font-medium mt-0.5',
                        item.color || 'text-text-primary'
                      )}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              {event.roomSetup.notes && (
                <div className="mt-3 rounded-lg border border-info/20 bg-info/5 p-3 flex gap-2">
                  <Sparkles className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary">{event.roomSetup.notes}</p>
                </div>
              )}
            </SectionCard>

            {/* Notes */}
            <SectionCard
              title="Notes"
              icon={FileText}
              action={
                <Button variant="ghost" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Note
                </Button>
              }
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Internal Notes
                  </h4>
                  <div className="space-y-2">
                    {event.notes.internal.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-text-primary">
                            {note.author}
                          </span>
                          <span className="text-[10px] text-text-muted">{note.date}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    External / Client Notes
                  </h4>
                  <div className="space-y-2">
                    {event.notes.external.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-accent/20 bg-accent/5 p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-text-primary">
                            {note.author}
                          </span>
                          <span className="text-[10px] text-text-muted">{note.date}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Event Progress */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Event Progress</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">Setup Tasks</span>
                <span className="text-xs font-bold text-text-primary">
                  {completedCount}/{timeline.length}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-secondary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-text-muted">{progress}% complete</p>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-surface p-5 space-y-2">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Quick Actions</h3>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" /> Email BEO to Client
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Receipt className="mr-2 h-4 w-4" /> Preview Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-danger border-danger/30 hover:bg-danger/10"
              >
                <Ban className="mr-2 h-4 w-4" /> Cancel Event
              </Button>
            </div>

            {/* Key Contacts */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Key Contacts</h3>
              <div className="space-y-3">
                {[
                  { role: 'Event Captain', name: 'James L.', phone: 'Ext. 4201' },
                  { role: 'Banquet Manager', name: 'Maria G.', phone: 'Ext. 4202' },
                  { role: 'AV Tech Lead', name: 'David P.', phone: 'Ext. 4301' },
                  { role: 'Sales Manager', name: event.booking.salesManager, phone: 'Ext. 3101' },
                ].map((contact) => (
                  <div key={contact.role} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-muted">{contact.role}</p>
                      <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                    </div>
                    <span className="text-xs font-mono text-text-secondary">{contact.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Printed */}
            <div className="rounded-lg border border-border bg-background p-3 flex items-center gap-2">
              <PrinterIcon className="h-4 w-4 text-text-muted" />
              <span className="text-xs text-text-muted">Last printed: {event.lastPrinted}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Menu & Beverage Tab ─── */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* Menu Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Menu & Beverage Service</h3>
              <p className="text-sm text-text-secondary">{event.menu.serviceStyle}</p>
            </div>
            {event.menu.dietaryNotes && (
              <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-xs text-warning">{event.menu.dietaryNotes}</span>
              </div>
            )}
          </div>

          {/* Food Menu */}
          <SectionCard
            title="Food Menu"
            icon={Utensils}
            action={
              <span className="text-sm font-bold font-mono text-text-primary">
                {formatCurrency(event.charges.foodTotal)}
              </span>
            }
          >
            <div className="space-y-5">
              {event.menu.courses.map((course) => (
                <div key={course.category}>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    {course.category}
                  </h4>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-background border-b border-border">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">
                            Item
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                            Unit
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                            Price
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {course.items.map((item, i) => (
                          <tr key={i} className="hover:bg-background/50">
                            <td className="px-3 py-2 text-text-primary">{item.name}</td>
                            <td className="px-3 py-2 text-right font-mono text-text-primary">
                              {item.qty}
                            </td>
                            <td className="px-3 py-2 text-right text-text-secondary text-xs">
                              {item.portion}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-text-secondary">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-medium text-text-primary">
                              {formatCurrency(item.qty * item.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Beverage */}
          <SectionCard
            title="Beverage Service"
            icon={Wine}
            action={
              <span className="text-sm font-bold font-mono text-text-primary">
                {formatCurrency(event.charges.beverageTotal)}
              </span>
            }
          >
            <div className="mb-3 rounded-lg border border-info/20 bg-info/5 p-3 flex gap-2">
              <Sparkles className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">{event.beverage.notes}</p>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">
                      Package
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                      Price
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {event.beverage.packages.map((pkg, i) => (
                    <tr key={i} className="hover:bg-background/50">
                      <td className="px-3 py-2 text-text-primary">{pkg.name}</td>
                      <td className="px-3 py-2 text-right font-mono text-text-primary">
                        {pkg.qty}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-text-secondary">
                        {formatCurrency(pkg.price)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-medium text-text-primary">
                        {formatCurrency(pkg.qty * pkg.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ─── Resources Tab ─── */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              Resources, Equipment & Setup
            </h3>
            <span className="text-sm font-bold font-mono text-text-primary">
              {formatCurrency(event.charges.rentalTotal + event.charges.laborTotal)}
            </span>
          </div>

          {event.resources.map((section) => (
            <SectionCard
              key={section.category}
              title={section.category}
              icon={
                section.category.includes('AV')
                  ? Mic
                  : section.category.includes('Furniture')
                    ? Flower2
                    : section.category.includes('Staff')
                      ? User
                      : Briefcase
              }
            >
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary">
                        Item
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                        Price
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {section.items.map((item, i) => (
                      <tr key={i} className="hover:bg-background/50">
                        <td className="px-3 py-2 text-text-primary">{item.name}</td>
                        <td className="px-3 py-2 text-right font-mono text-text-primary">
                          {item.qty}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-text-secondary">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium text-text-primary">
                          {formatCurrency(item.qty * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {/* ─── Timeline Tab ─── */}
      {activeTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectionCard
              title="Event Timeline & Run Sheet"
              icon={Clock}
              action={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">
                    {completedCount} of {timeline.length} done
                  </span>
                  <div className="h-2 w-20 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              }
            >
              <div className="space-y-1">
                {timeline.map((item, index) => (
                  <TimelineItem key={index} item={item} index={index} onToggle={toggleTimeline} />
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Department Filters</h3>
              <div className="space-y-2">
                {['All', 'Setup', 'AV', 'F&B', 'Banquet', 'Front Office'].map((dept) => (
                  <button
                    key={dept}
                    className="w-full text-left rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-background transition-colors"
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Legend</h3>
              <div className="space-y-2">
                {Object.entries(timelineStatusMeta).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
                    <span className="text-xs text-text-secondary">{meta.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Charges Tab ─── */}
      {activeTab === 'charges' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard title="Charge Summary" icon={DollarSign}>
              <div className="space-y-3">
                {[
                  { label: 'Food & Catering', value: event.charges.foodTotal },
                  { label: 'Beverage Service', value: event.charges.beverageTotal },
                  { label: 'Equipment & Rentals', value: event.charges.rentalTotal },
                  { label: 'Labor & Staffing', value: event.charges.laborTotal },
                ].map((line) => (
                  <div
                    key={line.label}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-text-secondary">{line.label}</span>
                    <span className="text-sm font-mono font-medium text-text-primary">
                      {formatCurrency(line.value)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">Service Charge (18%)</span>
                  <span className="text-sm font-mono text-text-primary">
                    {formatCurrency(event.charges.serviceCharge)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-text-secondary">Tax (8.25%)</span>
                  <span className="text-sm font-mono text-text-primary">
                    {formatCurrency(event.charges.tax)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-base font-bold text-text-primary">Grand Total</span>
                  <span className="text-xl font-bold font-mono text-secondary">
                    {formatCurrency(event.charges.grandTotal)}
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Payment Schedule" icon={Receipt}>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Deposit</p>
                    <p className="text-xs text-text-muted">
                      Due on signing · {event.booking.contractDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium text-text-primary">
                      {formatCurrency(event.booking.deposit)}
                    </p>
                    <span
                      className={cn(
                        'text-xs font-bold',
                        event.booking.depositPaid ? 'text-accent' : 'text-danger'
                      )}
                    >
                      {event.booking.depositPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Final Payment</p>
                    <p className="text-xs text-text-muted">
                      Due {event.booking.paymentTerms} after event
                    </p>
                  </div>
                  <p className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(event.charges.grandTotal - event.booking.deposit)}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Cost Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: 'Food', value: event.charges.foodTotal, color: 'bg-accent' },
                  { label: 'Beverage', value: event.charges.beverageTotal, color: 'bg-secondary' },
                  { label: 'Rentals', value: event.charges.rentalTotal, color: 'bg-info' },
                  { label: 'Labor', value: event.charges.laborTotal, color: 'bg-warning' },
                ].map((item) => {
                  const pct = (item.value / event.charges.subtotal) * 100;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-text-secondary">{item.label}</span>
                        <span className="text-xs font-mono font-medium text-text-primary">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', item.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Per-Guest Cost</h3>
              <div className="text-center">
                <p className="text-3xl font-bold font-mono text-secondary">
                  {formatCurrency(event.charges.grandTotal / event.guestCount)}
                </p>
                <p className="text-xs text-text-muted mt-1">Based on {event.guestCount} guests</p>
              </div>
              <div className="mt-3 pt-3 border-t border-border space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Food per guest</span>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(event.charges.foodTotal / event.guestCount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Beverage per guest</span>
                  <span className="font-mono text-text-primary">
                    {formatCurrency(event.charges.beverageTotal / event.guestCount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Print Options Modal ─── */}
      {showPrintOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPrintOptions(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Print BEO Options</h3>
              <button
                onClick={() => setShowPrintOptions(false)}
                className="rounded-md p-1 hover:bg-surface text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: 'Full BEO (All Sections)',
                  desc: 'Complete document with menu, resources, timeline, and charges',
                },
                {
                  label: 'Kitchen Copy (F&B Only)',
                  desc: 'Menu, dietary notes, and service timing for culinary team',
                },
                {
                  label: 'Banquet Copy (Setup Only)',
                  desc: 'Room setup, timeline, and staffing notes',
                },
                {
                  label: 'Client Copy (External Notes)',
                  desc: 'Sanitized version with external notes only',
                },
                {
                  label: 'AV / Tech Copy',
                  desc: 'Equipment list, setup timing, and technical requirements',
                },
              ].map((opt) => (
                <button
                  key={opt.label}
                  className="w-full text-left rounded-lg border border-border bg-surface p-3 hover:border-secondary/50 transition-colors"
                >
                  <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                  <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPrintOptions(false)}>
                Cancel
              </Button>
              <Button variant="secondary">
                <PrinterIcon className="mr-1.5 h-4 w-4" /> Print Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
