/* src/app/app/guests/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Star, Crown, Gem, User, Users, Mail, Phone, MapPin,
  Calendar, BedDouble, DollarSign, Clock, ChevronRight, MoreHorizontal,
  Heart, Utensils, Wifi, Coffee, Snowflake, Sun, Moon, X,
  Check, Plus, Edit3, Trash2, MessageSquare, TrendingUp,
  Shield, Award, ArrowUpDown, LayoutGrid, List, Download, Globe
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const mockGuests = [
  {
    id: 'G-1001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1 555-0101',
    address: '123 Maple Ave, Boston, MA 02101',
    country: 'US',
    dateOfBirth: '1985-03-15',
    loyaltyTier: 'platinum',
    vipStatus: true,
    vipNotes: 'Repeat high-value guest. Prefers Suite 204.',
    lifetimeValue: 12450,
    totalStays: 18,
    totalNights: 47,
    preferences: {
      roomType: 'Deluxe King',
      floor: 'High',
      bedType: 'King',
      pillowType: 'Feather',
      temperature: '68°F',
      smoking: false,
      accessibility: [],
      dietary: ['Gluten-free'],
      amenities: ['Late Checkout', 'Extra Towels', 'Mini-bar Stocked'],
      communication: 'Email',
      language: 'English',
    },
    notes: [
      { id: 1, author: 'Sarah J.', date: '2026-08-10', content: 'Celebrating anniversary. Arrange champagne in room.' },
      { id: 2, author: 'Mike C.', date: '2026-07-22', content: 'Complained about AC noise in 312. Avoid assigning that room.' },
    ],
    stays: [
      { id: 'R-4021', arrival: '2026-08-12', departure: '2026-08-15', nights: 3, room: '204', roomType: 'Deluxe King', rate: 189, revenue: 567, status: 'checked_in' },
      { id: 'R-3890', arrival: '2026-03-15', departure: '2026-03-18', nights: 3, room: '312', roomType: 'Deluxe King', rate: 189, revenue: 567, status: 'completed' },
      { id: 'R-3542', arrival: '2025-11-22', departure: '2025-11-26', nights: 4, room: '204', roomType: 'Deluxe King', rate: 179, revenue: 716, status: 'completed' },
      { id: 'R-3101', arrival: '2025-08-10', departure: '2025-08-12', nights: 2, room: '105', roomType: 'Suite', rate: 320, revenue: 640, status: 'completed' },
    ],
  },
  {
    id: 'G-1002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 555-0102',
    address: '456 Oak St, New York, NY 10001',
    country: 'US',
    dateOfBirth: '1990-07-22',
    loyaltyTier: 'gold',
    vipStatus: false,
    lifetimeValue: 8320,
    totalStays: 12,
    totalNights: 28,
    preferences: {
      roomType: 'Standard Twin',
      floor: 'Any',
      bedType: 'Twin',
      pillowType: 'Foam',
      temperature: '70°F',
      smoking: false,
      accessibility: ['Hearing Aid Compatible'],
      dietary: ['Vegetarian'],
      amenities: ['Quiet Room', 'High Floor'],
      communication: 'SMS',
      language: 'English',
    },
    notes: [
      { id: 3, author: 'Sarah J.', date: '2026-08-11', content: 'Business traveler. Always requests early check-in.' },
    ],
    stays: [
      { id: 'R-4022', arrival: '2026-08-11', departure: '2026-08-14', nights: 3, room: '312', roomType: 'Standard Twin', rate: 145, revenue: 435, status: 'checked_out' },
      { id: 'R-3650', arrival: '2026-01-10', departure: '2026-01-14', nights: 4, room: '215', roomType: 'Standard Twin', rate: 145, revenue: 580, status: 'completed' },
    ],
  },
  {
    id: 'G-1003',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'mbrown@email.com',
    phone: '+1 555-0103',
    address: '789 Pine Rd, Chicago, IL 60601',
    country: 'US',
    dateOfBirth: '1978-11-05',
    loyaltyTier: 'silver',
    vipStatus: true,
    vipNotes: 'Corporate account. Direct bill authorized.',
    lifetimeValue: 15800,
    totalStays: 24,
    totalNights: 62,
    preferences: {
      roomType: 'Suite',
      floor: 'Top',
      bedType: 'King',
      pillowType: 'Hypoallergenic',
      temperature: '66°F',
      smoking: false,
      accessibility: [],
      dietary: [],
      amenities: ['Airport Shuttle', 'Business Center Access'],
      communication: 'Email',
      language: 'English',
    },
    notes: [
      { id: 4, author: 'Front Desk', date: '2026-08-01', content: 'VIP arrival next week. Confirm airport pickup.' },
    ],
    stays: [
      { id: 'R-4023', arrival: '2026-08-15', departure: '2026-08-20', nights: 5, room: '105', roomType: 'Suite', rate: 320, revenue: 1600, status: 'confirmed' },
      { id: 'R-3780', arrival: '2026-04-05', departure: '2026-04-10', nights: 5, room: '105', roomType: 'Suite', rate: 310, revenue: 1550, status: 'completed' },
    ],
  },
  {
    id: 'G-1004',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phone: '+1 555-0104',
    address: '321 Birch Ln, Seattle, WA 98101',
    country: 'US',
    dateOfBirth: '1995-01-30',
    loyaltyTier: 'bronze',
    vipStatus: false,
    lifetimeValue: 2100,
    totalStays: 3,
    totalNights: 5,
    preferences: {
      roomType: 'Deluxe King',
      floor: 'Mid',
      bedType: 'Queen',
      pillowType: 'Down',
      temperature: '72°F',
      smoking: false,
      accessibility: [],
      dietary: ['Vegan', 'Nut Allergy'],
      amenities: ['Eco-friendly', 'Room Service'],
      communication: 'Email',
      language: 'English',
    },
    notes: [],
    stays: [
      { id: 'R-4024', arrival: '2026-08-12', departure: '2026-08-13', nights: 1, room: '401', roomType: 'Deluxe King', rate: 189, revenue: 189, status: 'confirmed' },
    ],
  },
  {
    id: 'G-1005',
    firstName: 'Robert',
    lastName: 'Chen',
    email: 'robert.chen@email.com',
    phone: '+1 555-0105',
    address: '654 Cedar Ct, San Francisco, CA 94102',
    country: 'US',
    dateOfBirth: '1982-09-12',
    loyaltyTier: 'none',
    vipStatus: false,
    lifetimeValue: 540,
    totalStays: 1,
    totalNights: 2,
    preferences: {
      roomType: 'Standard Queen',
      floor: 'Any',
      bedType: 'Queen',
      pillowType: 'Foam',
      temperature: '69°F',
      smoking: false,
      accessibility: ['Wheelchair Accessible'],
      dietary: [],
      amenities: ['Ground Floor', 'Accessible Bathroom'],
      communication: 'Phone',
      language: 'English',
    },
    notes: [],
    stays: [
      { id: 'R-4025', arrival: '2026-08-10', departure: '2026-08-12', nights: 2, room: '118', roomType: 'Standard Queen', rate: 135, revenue: 270, status: 'no_show' },
    ],
  },
  {
    id: 'G-1006',
    firstName: 'Lisa',
    lastName: 'Wong',
    email: 'lisa.wong@email.com',
    phone: '+1 555-0106',
    address: '987 Spruce Way, Los Angeles, CA 90001',
    country: 'US',
    dateOfBirth: '1988-05-18',
    loyaltyTier: 'gold',
    vipStatus: true,
    vipNotes: 'Influencer partner. Comp upgrades approved.',
    lifetimeValue: 9870,
    totalStays: 15,
    totalNights: 38,
    preferences: {
      roomType: 'Deluxe King',
      floor: 'High',
      bedType: 'King',
      pillowType: 'Feather',
      temperature: '68°F',
      smoking: false,
      accessibility: [],
      dietary: ['Dairy-free'],
      amenities: ['Late Checkout', 'Spa Access', 'Welcome Gift'],
      communication: 'SMS',
      language: 'English',
    },
    notes: [
      { id: 5, author: 'Manager', date: '2026-08-05', content: 'Social media influencer. Ensure room is photo-ready.' },
    ],
    stays: [
      { id: 'R-4026', arrival: '2026-08-12', departure: '2026-08-16', nights: 4, room: '310', roomType: 'Deluxe King', rate: 189, revenue: 756, status: 'cancelled' },
      { id: 'R-3400', arrival: '2026-02-14', departure: '2026-02-18', nights: 4, room: '310', roomType: 'Deluxe King', rate: 189, revenue: 756, status: 'completed' },
    ],
  },
  {
    id: 'G-1007',
    firstName: 'David',
    lastName: 'Miller',
    email: 'david.miller@email.com',
    phone: '+1 555-0107',
    address: '147 Willow Dr, Austin, TX 78701',
    country: 'US',
    dateOfBirth: '1975-12-03',
    loyaltyTier: 'silver',
    vipStatus: false,
    lifetimeValue: 4200,
    totalStays: 6,
    totalNights: 14,
    preferences: {
      roomType: 'Standard Twin',
      floor: 'Low',
      bedType: 'Twin',
      pillowType: 'Foam',
      temperature: '70°F',
      smoking: false,
      accessibility: [],
      dietary: [],
      amenities: ['Extra Pillows', 'Work Desk'],
      communication: 'Email',
      language: 'English',
    },
    notes: [],
    stays: [
      { id: 'R-4027', arrival: '2026-08-18', departure: '2026-08-22', nights: 4, room: null, roomType: 'Standard Twin', rate: 145, revenue: 580, status: 'waitlist' },
    ],
  },
  {
    id: 'G-1008',
    firstName: 'Amanda',
    lastName: 'Wilson',
    email: 'amanda.w@email.com',
    phone: '+1 555-0108',
    address: '258 Aspen Blvd, Denver, CO 80201',
    country: 'US',
    dateOfBirth: '1992-04-25',
    loyaltyTier: 'platinum',
    vipStatus: true,
    vipNotes: 'Lifetime Platinum. Always upgrade to best available.',
    lifetimeValue: 22100,
    totalStays: 32,
    totalNights: 89,
    preferences: {
      roomType: 'Suite',
      floor: 'Top',
      bedType: 'King',
      pillowType: 'Hypoallergenic',
      temperature: '67°F',
      smoking: false,
      accessibility: [],
      dietary: ['Keto'],
      amenities: ['Late Checkout', 'Spa Access', 'Concierge', 'Airport Transfer'],
      communication: 'Email',
      language: 'English',
    },
    notes: [
      { id: 6, author: 'GM', date: '2026-08-01', content: 'Lifetime Platinum member. Spouse allergic to down pillows — always hypoallergenic.' },
      { id: 7, author: 'Housekeeping', date: '2026-07-15', content: 'Prefers extra water bottles and no decorative pillows.' },
    ],
    stays: [
      { id: 'R-4028', arrival: '2026-08-13', departure: '2026-08-15', nights: 2, room: '205', roomType: 'Suite', rate: 320, revenue: 640, status: 'checked_in' },
      { id: 'R-3900', arrival: '2026-05-01', departure: '2026-05-07', nights: 6, room: '205', roomType: 'Suite', rate: 320, revenue: 1920, status: 'completed' },
      { id: 'R-3600', arrival: '2026-02-10', departure: '2026-02-14', nights: 4, room: '205', roomType: 'Suite', rate: 310, revenue: 1240, status: 'completed' },
    ],
  },
];

const tierMeta = {
  platinum: { label: 'Platinum', icon: Crown, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  gold: { label: 'Gold', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  silver: { label: 'Silver', icon: Award, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
  bronze: { label: 'Bronze', icon: Gem, color: 'text-orange-600', bg: 'bg-orange-600/10', border: 'border-orange-600/20' },
  none: { label: 'Member', icon: User, color: 'text-text-muted', bg: 'bg-surface-elevated', border: 'border-border' },
};

const stayStatusMeta = {
  checked_in: { label: 'Checked In', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  checked_out: { label: 'Checked Out', class: 'bg-neutral/10 text-text-muted border-border' },
  confirmed: { label: 'Confirmed', class: 'bg-accent/10 text-accent border-accent/20' },
  completed: { label: 'Completed', class: 'bg-info/10 text-info border-info/20' },
  cancelled: { label: 'Cancelled', class: 'bg-danger/10 text-danger border-danger/20' },
  no_show: { label: 'No-Show', class: 'bg-danger/10 text-danger border-danger/20' },
  waitlist: { label: 'Waitlist', class: 'bg-warning/10 text-warning border-warning/20' },
};

/* ─── Components ─── */
function GuestAvatar({ guest, size = 'md' }) {
  const initials = `${guest.firstName[0]}${guest.lastName[0]}`.toUpperCase();
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-20 w-20 text-2xl',
  };
  return (
    <div className={cn(
      'flex items-center justify-center rounded-full font-bold text-secondary bg-secondary/10',
      sizeClasses[size]
    )}>
      {initials}
    </div>
  );
}

function LoyaltyBadge({ tier }) {
  const meta = tierMeta[tier] || tierMeta.none;
  const Icon = meta.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
      meta.bg, meta.color, meta.border
    )}>
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function PreferenceChip({ icon: Icon, label, active = true }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
      active ? 'border-border bg-surface text-text-secondary' : 'border-border/50 bg-background text-text-muted opacity-60'
    )}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={cn('rounded-lg p-2.5', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

/* ─── Guest Detail Drawer ─── */
function GuestDetailDrawer({ guest, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState(guest.notes);

  if (!guest) return null;

  const addNote = () => {
    if (!newNote.trim()) return;
    setNotes([
      { id: Date.now(), author: 'You', date: new Date().toISOString().split('T')[0], content: newNote.trim() },
      ...notes,
    ]);
    setNewNote('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stays', label: 'Stay History', icon: Calendar },
    { id: 'preferences', label: 'Preferences', icon: Heart },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
  ];

  const totalRevenue = guest.stays.reduce((s, stay) => s + stay.revenue, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GuestAvatar guest={guest} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary">{guest.firstName} {guest.lastName}</h2>
                  {guest.vipStatus && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">
                      <Star className="h-3 w-3 fill-warning" /> VIP
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <LoyaltyBadge tier={guest.loyaltyTier} />
                  <span className="text-xs text-text-muted">ID: {guest.id}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
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
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Lifetime Value</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">${guest.lifetimeValue.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Stays</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">{guest.totalStays} <span className="text-sm font-normal text-text-muted">({guest.totalNights} nights)</span></p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Contact Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Mail className="h-4 w-4 text-text-muted" />
                    {guest.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Phone className="h-4 w-4 text-text-muted" />
                    {guest.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary sm:col-span-2">
                    <MapPin className="h-4 w-4 text-text-muted" />
                    {guest.address}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Calendar className="h-4 w-4 text-text-muted" />
                    DOB: {guest.dateOfBirth}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-primary">
                    <Globe className="h-4 w-4 text-text-muted" />
                    {guest.country}
                  </div>
                </div>
              </div>

              {/* Recent Stays Preview */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Recent Stays</h3>
                  <button onClick={() => setActiveTab('stays')} className="text-xs text-secondary hover:underline">View All</button>
                </div>
                <div className="space-y-2">
                  {guest.stays.slice(0, 3).map((stay) => (
                    <div key={stay.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <BedDouble className="h-4 w-4 text-text-muted" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">Room {stay.room || 'TBA'} — {stay.roomType}</p>
                          <p className="text-xs text-text-muted">{stay.arrival} → {stay.departure} · {stay.nights} nights</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium text-text-primary">${stay.revenue}</p>
                        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', stayStatusMeta[stay.status].class)}>
                          {stayStatusMeta[stay.status].label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VIP Notes */}
              {guest.vipStatus && guest.vipNotes && (
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-warning" />
                    <h3 className="text-sm font-semibold text-text-primary">VIP Notes</h3>
                  </div>
                  <p className="text-sm text-text-secondary">{guest.vipNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Stays Tab */}
          {activeTab === 'stays' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Revenue</p>
                  <p className="text-xl font-bold font-mono text-text-primary">${totalRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Avg. per Stay</p>
                  <p className="text-xl font-bold font-mono text-text-primary">${Math.round(totalRevenue / guest.stays.length).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Nights</p>
                  <p className="text-xl font-bold font-mono text-text-primary">{guest.totalNights}</p>
                </div>
              </div>

              <div className="space-y-2">
                {guest.stays.map((stay) => (
                  <div key={stay.id} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-secondary/10 px-2 py-1 text-xs font-mono font-medium text-secondary">{stay.id}</span>
                        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', stayStatusMeta[stay.status].class)}>
                          {stayStatusMeta[stay.status].label}
                        </span>
                      </div>
                      <span className="text-sm font-mono font-bold text-text-primary">${stay.revenue}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Calendar className="h-3.5 w-3.5 text-text-muted" />
                        {stay.arrival} → {stay.departure}
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <BedDouble className="h-3.5 w-3.5 text-text-muted" />
                        {stay.roomType} {stay.room && `(Room ${stay.room})`}
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Clock className="h-3.5 w-3.5 text-text-muted" />
                        {stay.nights} nights
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <DollarSign className="h-3.5 w-3.5 text-text-muted" />
                        ${stay.rate}/night
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">Room Preferences</h3>
                  <div className="space-y-2">
                    <PreferenceChip icon={BedDouble} label={`${guest.preferences.roomType} • ${guest.preferences.bedType}`} />
                    <PreferenceChip icon={ArrowUpDown} label={`${guest.preferences.floor} Floor`} />
                    <PreferenceChip icon={guest.preferences.temperature > '68' ? Sun : Snowflake} label={`${guest.preferences.temperature}`} />
                    <PreferenceChip icon={Coffee} label={guest.preferences.pillowType + ' Pillows'} />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">Dietary & Health</h3>
                  <div className="space-y-2">
                    {guest.preferences.dietary.length > 0 ? (
                      guest.preferences.dietary.map((d) => (
                        <PreferenceChip key={d} icon={Utensils} label={d} />
                      ))
                    ) : (
                      <PreferenceChip icon={Utensils} label="No restrictions" active={false} />
                    )}
                    {guest.preferences.smoking ? (
                      <PreferenceChip icon={Coffee} label="Smoking Room" />
                    ) : (
                      <PreferenceChip icon={Shield} label="Non-Smoking" />
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">Accessibility</h3>
                  <div className="space-y-2">
                    {guest.preferences.accessibility.length > 0 ? (
                      guest.preferences.accessibility.map((a) => (
                        <PreferenceChip key={a} icon={Shield} label={a} />
                      ))
                    ) : (
                      <PreferenceChip icon={Shield} label="None requested" active={false} />
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">Communication</h3>
                  <div className="space-y-2">
                    <PreferenceChip icon={Mail} label={guest.preferences.communication} />
                    <PreferenceChip icon={Globe} label={guest.preferences.language} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">Requested Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {guest.preferences.amenities.map((a) => (
                    <PreferenceChip key={a} icon={Check} label={a} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">Add Note</h3>
                <div className="flex gap-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write an internal note about this guest..."
                    rows={3}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                  <Button onClick={addNote} className="self-end" size="sm">
                    <Plus className="mr-1.5 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                          {note.author[0]}
                        </div>
                        <span className="text-sm font-medium text-text-primary">{note.author}</span>
                      </div>
                      <span className="text-xs text-text-muted">{note.date}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{note.content}</p>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="text-center py-8 text-text-muted text-sm">No notes yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function GuestsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [tierFilter, setTierFilter] = useState('all');
  const [vipFilter, setVipFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredGuests = useMemo(() => {
    let result = mockGuests.filter((g) => {
      const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
      const matchesQuery =
        fullName.includes(query.toLowerCase()) ||
        g.email.toLowerCase().includes(query.toLowerCase()) ||
        g.phone.includes(query) ||
        g.id.toLowerCase().includes(query.toLowerCase());
      const matchesTier = tierFilter === 'all' || g.loyaltyTier === tierFilter;
      const matchesVip = vipFilter === 'all' || (vipFilter === 'vip' ? g.vipStatus : !g.vipStatus);
      return matchesQuery && matchesTier && matchesVip;
    });

    result.sort((a, b) => {
      if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      if (sortBy === 'ltv') return b.lifetimeValue - a.lifetimeValue;
      if (sortBy === 'stays') return b.totalStays - a.totalStays;
      if (sortBy === 'recent') return new Date(b.stays[0]?.arrival || 0) - new Date(a.stays[0]?.arrival || 0);
      return 0;
    });

    return result;
  }, [query, tierFilter, vipFilter, sortBy]);

  const stats = useMemo(() => ({
    total: mockGuests.length,
    vip: mockGuests.filter((g) => g.vipStatus).length,
    returning: mockGuests.filter((g) => g.totalStays > 1).length,
    avgLTV: Math.round(mockGuests.reduce((s, g) => s + g.lifetimeValue, 0) / mockGuests.length),
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Guests & CRM</h1>
          <p className="text-sm text-text-secondary">Manage guest profiles, preferences, and stay history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Guest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Guests" value={stats.total} icon={Users} color="bg-secondary" />
        <StatCard label="VIP Guests" value={stats.vip} icon={Crown} color="bg-warning" />
        <StatCard label="Returning" value={stats.returning} icon={TrendingUp} color="bg-accent" />
        <StatCard label="Avg. LTV" value={`$${stats.avgLTV.toLocaleString()}`} icon={DollarSign} color="bg-info" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, phone, guest ID..."
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
              showFilters ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="name">Sort by Name</option>
            <option value="ltv">Sort by LTV</option>
            <option value="stays">Sort by Stays</option>
            <option value="recent">Sort by Recent</option>
          </select>
          <div className="flex rounded-md border border-border bg-surface p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'grid' ? 'bg-secondary text-white' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded transition-colors',
                viewMode === 'table' ? 'bg-secondary text-white' : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Loyalty Tier</label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Tiers</option>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
                <option value="none">Member</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">VIP Status</label>
              <select
                value={vipFilter}
                onChange={(e) => setVipFilter(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Guests</option>
                <option value="vip">VIP Only</option>
                <option value="regular">Regular Guests</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setTierFilter('all'); setVipFilter('all'); setQuery(''); }}
                className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredGuests.length}</span> of {mockGuests.length} guests
      </p>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGuests.map((guest) => (
            <button
              key={guest.id}
              onClick={() => setSelectedGuest(guest)}
              className="group rounded-xl border border-border bg-surface p-5 text-left transition-all hover:border-secondary/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <GuestAvatar guest={guest} size="md" />
                <div className="flex flex-col items-end gap-1.5">
                  <LoyaltyBadge tier={guest.loyaltyTier} />
                  {guest.vipStatus && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase text-warning">
                      <Star className="h-3 w-3 fill-warning" /> VIP
                    </span>
                  )}
                </div>
              </div>

              <h3 className="mt-3 text-base font-semibold text-text-primary group-hover:text-secondary transition-colors">
                {guest.firstName} {guest.lastName}
              </h3>
              <p className="text-xs text-text-muted">{guest.id}</p>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Mail className="h-3.5 w-3.5 text-text-muted" />
                  <span className="truncate">{guest.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone className="h-3.5 w-3.5 text-text-muted" />
                  {guest.phone}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Stays</p>
                  <p className="text-sm font-bold text-text-primary">{guest.totalStays}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">LTV</p>
                  <p className="text-sm font-bold font-mono text-text-primary">${guest.lifetimeValue.toLocaleString()}</p>
                </div>
              </div>

              {guest.stays.length > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
                  <Calendar className="h-3 w-3" />
                  Last stay: {guest.stays[0].arrival}
                </div>
              )}
            </button>
          ))}
          {filteredGuests.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-12 text-center">
              <User className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No guests match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Guest</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Tier</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">Stays</th>
                  <th className="px-4 py-3 text-right font-medium text-text-secondary">LTV</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Last Stay</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    onClick={() => setSelectedGuest(guest)}
                    className="hover:bg-background/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <GuestAvatar guest={guest} size="sm" />
                        <div>
                          <p className="font-medium text-text-primary flex items-center gap-1.5">
                            {guest.firstName} {guest.lastName}
                            {guest.vipStatus && <Star className="h-3 w-3 fill-warning text-warning" />}
                          </p>
                          <p className="text-xs text-text-muted">{guest.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text-secondary text-xs">{guest.email}</p>
                      <p className="text-text-muted text-xs">{guest.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <LoyaltyBadge tier={guest.loyaltyTier} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-primary">{guest.totalStays}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">${guest.lifetimeValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {guest.stays[0]?.arrival || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </td>
                  </tr>
                ))}
                {filteredGuests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                      No guests match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedGuest && (
        <GuestDetailDrawer
          guest={selectedGuest}
          onClose={() => setSelectedGuest(null)}
        />
      )}
    </div>
  );
}