import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
  Users, LogIn, LogOut, BedDouble, Search, Filter,
  Plus, Check, X, Clock, ArrowRight, DoorOpen, Key,
  ChevronDown, ChevronUp, MapPin, Star, Zap,
  Calendar, CreditCard, Sparkles, Moon, FileText
} from 'lucide-react';

/* ─── Mock Data ─── */
const allGuests = [
  { id: '4021', guest: 'John Smith', room: '204', roomType: 'Deluxe King', arrival: '2026-08-12', departure: '2026-08-15', status: 'arrival', nights: 3, rate: 189, vip: true },
  { id: '4022', guest: 'Sarah Johnson', room: '312', roomType: 'Standard Twin', arrival: '2026-08-11', departure: '2026-08-14', status: 'departure', nights: 3, rate: 145, vip: false },
  { id: '4023', guest: 'Michael Brown', room: null, roomType: 'Suite', arrival: '2026-08-15', departure: '2026-08-20', status: 'arrival', nights: 5, rate: 320, vip: true },
  { id: '4024', guest: 'Emily Davis', room: '401', roomType: 'Deluxe King', arrival: '2026-08-12', departure: '2026-08-13', status: 'inhouse', nights: 1, rate: 189, vip: false },
  { id: '4025', guest: 'Robert Chen', room: '118', roomType: 'Standard Queen', arrival: '2026-08-10', departure: '2026-08-12', status: 'departure', nights: 2, rate: 135, vip: false },
  { id: '4026', guest: 'Lisa Wong', room: '310', roomType: 'Deluxe King', arrival: '2026-08-12', departure: '2026-08-16', status: 'arrival', nights: 4, rate: 189, vip: false },
  { id: '4027', guest: 'David Miller', room: '205', roomType: 'Standard Twin', arrival: '2026-08-08', departure: '2026-08-12', status: 'inhouse', nights: 4, rate: 145, vip: false },
  { id: '4028', guest: 'Amanda Wilson', room: '105', roomType: 'Suite', arrival: '2026-08-09', departure: '2026-08-12', status: 'departure', nights: 3, rate: 320, vip: true },
];

const floorPlan = [
  { floor: 1, rooms: [
    { id: '101', type: 'Standard Twin', status: 'clean' },
    { id: '102', type: 'Standard Twin', status: 'occupied' },
    { id: '103', type: 'Standard Queen', status: 'dirty' },
    { id: '104', type: 'Deluxe King', status: 'clean' },
    { id: '105', type: 'Suite', status: 'occupied' },
  ]},
  { floor: 2, rooms: [
    { id: '201', type: 'Standard Twin', status: 'clean' },
    { id: '202', type: 'Standard Twin', status: 'inspected' },
    { id: '203', type: 'Deluxe King', status: 'dirty' },
    { id: '204', type: 'Deluxe King', status: 'occupied' },
    { id: '205', type: 'Standard Twin', status: 'occupied' },
  ]},
  { floor: 3, rooms: [
    { id: '301', type: 'Standard Twin', status: 'clean' },
    { id: '302', type: 'Standard Queen', status: 'clean' },
    { id: '303', type: 'Deluxe King', status: 'inspected' },
    { id: '304', type: 'Deluxe King', status: 'clean' },
    { id: '310', type: 'Deluxe King', status: 'clean' },
  ]},
];

const roomStatusMeta = {
  clean: { label: 'Clean', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' },
  dirty: { label: 'Dirty', class: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger' },
  inspected: { label: 'Inspected', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  occupied: { label: 'Occupied', class: 'bg-secondary/10 text-secondary border-secondary/20', dot: 'bg-secondary' },
};

const tabs = [
  { id: 'arrivals', label: 'Arrivals', icon: LogIn, count: 0 },
  { id: 'inhouse', label: 'In-House', icon: BedDouble, count: 0 },
  { id: 'departures', label: 'Departures', icon: LogOut, count: 0 },
];

/* ─── Components ─── */
function RoomStatusBadge({ status }) {
  const meta = roomStatusMeta[status] || roomStatusMeta.clean;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium', meta.class)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export default function FrontDeskPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('arrivals');
  const [query, setQuery] = useState('');
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [roomAssignOpen, setRoomAssignOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [walkInStep, setWalkInStep] = useState(0);
  const [walkInData, setWalkInData] = useState({ name: '', email: '', phone: '', roomType: 'del-king', nights: 1 });

  const arrivals = useMemo(() => allGuests.filter(g => g.status === 'arrival'), []);
  const departures = useMemo(() => allGuests.filter(g => g.status === 'departure'), []);
  const inhouse = useMemo(() => allGuests.filter(g => g.status === 'inhouse'), []);

  const currentList = activeTab === 'arrivals' ? arrivals : activeTab === 'departures' ? departures : inhouse;
  const filtered = currentList.filter(g =>
    g.guest.toLowerCase().includes(query.toLowerCase()) ||
    g.id.includes(query) ||
    (g.room && g.room.includes(query))
  );

  tabs[0].count = arrivals.length;
  tabs[1].count = inhouse.length;
  tabs[2].count = departures.length;

  const stats = [
    { label: 'Arrivals', value: arrivals.length, icon: LogIn, color: 'text-accent' },
    { label: 'Departures', value: departures.length, icon: LogOut, color: 'text-warning' },
    { label: 'In-House', value: inhouse.length, icon: BedDouble, color: 'text-secondary' },
    { label: 'Available', value: 12, icon: DoorOpen, color: 'text-info' },
  ];

  const openRoomAssign = (guest) => {
    setSelectedGuest(guest);
    setRoomAssignOpen(true);
  };

  const handleWalkInNext = () => {
    if (walkInStep < 2) setWalkInStep(s => s + 1);
    else {
      setWalkInOpen(false);
      setWalkInStep(0);
      setWalkInData({ name: '', email: '', phone: '', roomType: 'del-king', nights: 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Front Desk</h1>
          <p className="text-sm text-text-secondary">Manage arrivals, departures, and in-house guests</p>
        </div>
        <Button onClick={() => setWalkInOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Walk-In
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">{s.value}</p>
              </div>
              <s.icon className={cn('h-6 w-6', s.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Cross-Links to Related Modules */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/app/reservations/new')}>
          <Calendar className="mr-1.5 h-4 w-4" /> New Reservation
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/reservations')}>
          <FileText className="mr-1.5 h-4 w-4" /> All Reservations
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/billing')}>
          <CreditCard className="mr-1.5 h-4 w-4" /> Billing & Folio
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/housekeeping')}>
          <Sparkles className="mr-1.5 h-4 w-4" /> Housekeeping
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/night-audit')}>
          <Moon className="mr-1.5 h-4 w-4" /> Night Audit
        </Button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setQuery(''); }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active ? 'bg-secondary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className={cn('ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-white/20 text-white' : 'bg-background text-text-muted')}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search guest, room, conf#..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Guest</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Room</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Dates</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Rate</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 text-right w-48"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((g) => (
                <tr key={g.id} className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                        {g.guest.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary flex items-center gap-1.5">
                          {g.guest}
                          {g.vip && <Star className="h-3 w-3 fill-warning text-warning" />}
                        </p>
                        <p className="text-xs text-text-muted">#{g.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-primary">{g.room || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {g.arrival} → {g.departure}
                    </div>
                    <p className="mt-0.5">{g.nights} nights</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-text-primary">${g.rate}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      g.status === 'arrival' && 'bg-accent/10 text-accent',
                      g.status === 'departure' && 'bg-warning/10 text-warning',
                      g.status === 'inhouse' && 'bg-secondary/10 text-secondary',
                    )}>
                      {g.status === 'arrival' ? 'Arrival' : g.status === 'departure' ? 'Departure' : 'In-House'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {g.status === 'arrival' && (
                        <>
                          {!g.room && (
                            <Button variant="outline" size="sm" onClick={() => openRoomAssign(g)}>
                              <Key className="mr-1.5 h-3.5 w-3.5" /> Assign
                            </Button>
                          )}
                          <Button size="sm"><LogIn className="mr-1.5 h-3.5 w-3.5" /> Check In</Button>
                        </>
                      )}
                      {g.status === 'departure' && (
                        <Button size="sm" variant="outline"><LogOut className="mr-1.5 h-3.5 w-3.5" /> Check Out</Button>
                      )}
                      {g.status === 'inhouse' && (
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/reservations/${g.id}`)}>
                          View
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-text-muted">No guests match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Walk-In Modal ─── */}
      {walkInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop absolute inset-0" onClick={() => setWalkInOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Walk-In Reservation</h2>
              <button onClick={() => setWalkInOpen(false)} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
            </div>

            {walkInStep === 0 && (
              <div className="space-y-4">
                <Input label="Full Name" placeholder="John Doe" value={walkInData.name} onChange={e => setWalkInData({ ...walkInData, name: e.target.value })} />
                <Input label="Email" type="email" placeholder="john@email.com" value={walkInData.email} onChange={e => setWalkInData({ ...walkInData, email: e.target.value })} />
                <Input label="Phone" placeholder="+1 (555) 000-0000" value={walkInData.phone} onChange={e => setWalkInData({ ...walkInData, phone: e.target.value })} />
              </div>
            )}
            {walkInStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Room Type</label>
                  <select
                    value={walkInData.roomType}
                    onChange={e => setWalkInData({ ...walkInData, roomType: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                  >
                    <option value="std-twin">Standard Twin</option>
                    <option value="del-king">Deluxe King</option>
                    <option value="suite">Executive Suite</option>
                  </select>
                </div>
                <Input label="Nights" type="number" min="1" value={walkInData.nights} onChange={e => setWalkInData({ ...walkInData, nights: e.target.value })} />
              </div>
            )}
            {walkInStep === 2 && (
              <div className="rounded-lg border border-border bg-background p-4 space-y-2">
                <p className="text-sm text-text-primary"><strong>Guest:</strong> {walkInData.name || '—'}</p>
                <p className="text-sm text-text-primary"><strong>Room:</strong> {walkInData.roomType}</p>
                <p className="text-sm text-text-primary"><strong>Nights:</strong> {walkInData.nights}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setWalkInStep(s => Math.max(0, s - 1))} disabled={walkInStep === 0}>Back</Button>
              <Button onClick={handleWalkInNext}>
                {walkInStep === 2 ? 'Create & Check In' : 'Next'} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Room Assignment Modal ─── */}
      {roomAssignOpen && selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop absolute inset-0" onClick={() => setRoomAssignOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Assign Room</h2>
                <p className="text-sm text-text-secondary">{selectedGuest.guest} • {selectedGuest.roomType}</p>
              </div>
              <button onClick={() => setRoomAssignOpen(false)} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {floorPlan.map((floor) => (
                <div key={floor.floor}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Floor {floor.floor}</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {floor.rooms.map((room) => {
                      const isMatch = room.type === selectedGuest.roomType;
                      const disabled = room.status === 'occupied' || room.status === 'dirty';
                      return (
                        <button
                          key={room.id}
                          disabled={disabled}
                          className={cn(
                            'relative rounded-lg border p-3 text-left transition-all',
                            disabled ? 'opacity-50 cursor-not-allowed bg-background' : 'hover:shadow-md hover:border-secondary',
                            isMatch && !disabled ? 'border-secondary bg-secondary/5' : 'border-border bg-surface'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-text-primary">{room.id}</span>
                            <span className={cn('h-2 w-2 rounded-full', roomStatusMeta[room.status].dot)} />
                          </div>
                          <p className="text-[10px] text-text-muted">{room.type}</p>
                          {!disabled && isMatch && (
                            <div className="mt-2">
                              <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">Match</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setRoomAssignOpen(false)}>Cancel</Button>
              <Button onClick={() => setRoomAssignOpen(false)}>Assign Selected</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}