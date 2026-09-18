/* src/app/app/groups/detail/page.jsx */
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Users,
  X,
  Edit3,
  Mail,
  BedDouble,
  Check,
  DollarSign,
  Clock,
  LayoutGrid,
  List,
  Briefcase,
  Building2,
  Plus,
  Upload,
  UserPlus,
  MoreHorizontal,
  ChevronLeft,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Ban,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useGroupStore } from '../store';
import { floorPlan, formatCurrency, downloadTemplate, statusMeta, blockTypeMeta } from '../data';
import { StatusBadge, BlockTypeBadge } from '../components';

/* ─── Mock Sub-data ─── */
const roomingList = [
  { name: 'John Smith', room: '204', type: 'Deluxe King', checkedIn: true },
  { name: 'Jane Smith', room: '205', type: 'Deluxe King', checkedIn: true },
  { name: 'Mike Brown', room: null, type: 'Standard Queen', checkedIn: false },
  { name: 'Emily Davis', room: null, type: 'Suite', checkedIn: false },
];

const folioTransactions = [
  { id: 1, date: '2026-08-20', description: 'Room Deposit — 12 rooms', charge: 1788.0, payment: 0 },
  {
    id: 2,
    date: '2026-08-20',
    description: 'Event Space — Grand Ballroom',
    charge: 2500.0,
    payment: 0,
  },
  { id: 3, date: '2026-08-20', description: 'Payment — Wire Transfer', charge: 0, payment: 4288.0 },
];

const events = [
  {
    id: 'EVT-001',
    name: 'Grand Ballroom — Reception',
    date: '2026-08-20',
    time: '6:00 PM — 11:00 PM',
    guests: 120,
    status: 'confirmed',
    tags: ['AV Package', 'Open Bar', 'Buffet Dinner', 'Dance Floor'],
  },
];

/* ─── Rooming List Upload Modal ─── */
function RoomingListModal({ group, onClose }) {
  const [step, setStep] = useState('upload');
  const [parsedData, setParsedData] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = () => {
    setParsedData([
      {
        lastName: 'Smith',
        firstName: 'John',
        email: 'john@email.com',
        phone: '+15550101',
        roomType: 'Deluxe King',
        arrival: group.arrival,
        departure: group.departure,
        specialRequests: 'High floor',
        valid: true,
      },
      {
        lastName: 'Smith',
        firstName: 'Jane',
        email: 'jane@email.com',
        phone: '+15550102',
        roomType: 'Deluxe King',
        arrival: group.arrival,
        departure: group.departure,
        specialRequests: 'Adjoining to John',
        valid: true,
      },
      {
        lastName: 'Brown',
        firstName: 'Mike',
        email: 'mike@email.com',
        phone: '+15550103',
        roomType: 'Standard Queen',
        arrival: group.arrival,
        departure: group.departure,
        specialRequests: '',
        valid: true,
      },
      {
        lastName: 'Davis',
        firstName: 'Emily',
        email: 'emily@email.com',
        phone: '+15550104',
        roomType: 'Suite',
        arrival: group.arrival,
        departure: group.departure,
        specialRequests: 'Early check-in',
        valid: true,
      },
    ]);
    setStep('preview');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-bold text-text-primary">Rooming List — {group.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile();
              }}
              className={cn(
                'rounded-xl border-2 border-dashed p-12 text-center transition-colors',
                dragOver ? 'border-secondary bg-secondary/5' : 'border-border bg-surface'
              )}
            >
              <Upload className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="text-sm font-medium text-text-primary">
                Drag & drop your rooming list here
              </p>
              <p className="text-xs text-text-muted mt-1">CSV or Excel (.csv, .xlsx)</p>
              <button
                onClick={handleFile}
                className="mt-3 text-sm font-medium text-secondary hover:underline"
              >
                Browse files
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <FileSpreadsheet className="h-4 w-4 text-text-muted" />
                Need a template?
              </div>
              <button
                onClick={downloadTemplate}
                className="text-sm font-medium text-secondary hover:underline flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Download CSV Template
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Room Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Dates
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Requests
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedData.map((row, i) => (
                    <tr key={i} className="hover:bg-surface/50">
                      <td className="px-3 py-2 text-text-primary">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">{row.email}</td>
                      <td className="px-3 py-2 text-text-secondary text-xs">{row.roomType}</td>
                      <td className="px-3 py-2 text-text-secondary text-xs">
                        {row.arrival} → {row.departure}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">
                        {row.specialRequests || '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.valid ? (
                          <Check className="h-4 w-4 text-accent mx-auto" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-danger mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                Back
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">
                  {parsedData.length} guests ready to import
                </span>
                <Button size="sm" onClick={() => setStep('done')}>
                  <Check className="mr-1.5 h-4 w-4" /> Confirm Import
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-6 w-6 text-accent" />
            </div>
            <h4 className="text-lg font-semibold text-text-primary">Rooming List Imported</h4>
            <p className="text-sm text-text-secondary">
              {parsedData.length} guests added to {group.name}
            </p>
            <Button onClick={onClose} className="mt-2">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Detail Page ─── */
export default function GroupDetailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const group = useGroupStore((s) => s.getGroupById(id));

  const [activeTab, setActiveTab] = useState('allocation');
  const [showRoomingUpload, setShowRoomingUpload] = useState(false);

  if (!group) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-text-muted mb-3" />
          <p className="text-text-muted">Group not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/app/groups')}>
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'allocation', label: 'Room Allocation', icon: LayoutGrid },
    { id: 'rooming', label: 'Rooming List', icon: List },
    { id: 'folio', label: 'Group Folio', icon: DollarSign },
    { id: 'events', label: 'Events & BEO', icon: Briefcase },
  ];

  const folioBalance = folioTransactions.reduce((acc, t) => acc + t.charge - t.payment, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/groups')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated text-text-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border',
                group.color
              )}
            >
              <Users className={cn('h-5 w-5', group.textColor)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{group.name}</h1>
              <p className="text-sm text-text-muted">
                {group.id} · {group.company || 'No company'} · <StatusBadge status={group.status} />
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Rooms Blocked', value: group.roomsBlocked, icon: BedDouble },
          { label: 'Picked Up', value: group.roomsPickedUp, icon: Check },
          { label: 'Group Rate', value: formatCurrency(group.rate), icon: DollarSign },
          { label: 'Cut-off', value: group.cutOffDate, icon: Clock },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</p>
            <p className="mt-1 text-lg font-bold font-mono text-text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
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
                  'inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
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

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* ─── Allocation ─── */}
        {activeTab === 'allocation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Visual Room Allocation</h4>
                <p className="text-xs text-text-muted">Click rooms to assign group members</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent border border-accent/20">
                  <Check className="h-3 w-3" /> Assigned
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning border border-warning/20">
                  <Clock className="h-3 w-3" /> Pending
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary border border-secondary/20">
                  <Users className="h-3 w-3" /> Group Block
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {floorPlan.map((floor) => (
                <div key={floor.floor}>
                  <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Floor {floor.floor}
                  </h5>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {floor.rooms.map((room) => {
                      const assigned = roomingList.find((r) => r.room === room.id);
                      const isBlocked = ['101', '102', '103', '104', '201', '202', '203'].includes(
                        room.id
                      );
                      return (
                        <div
                          key={room.id}
                          className={cn(
                            'relative rounded-lg border p-3 text-left transition-all hover:shadow-md',
                            assigned
                              ? 'border-accent bg-accent/5'
                              : isBlocked
                                ? 'border-secondary bg-secondary/5'
                                : 'border-border bg-surface opacity-50'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-text-primary">{room.id}</span>
                            {assigned && <Check className="h-3.5 w-3.5 text-accent" />}
                            {isBlocked && !assigned && (
                              <Users className="h-3.5 w-3.5 text-secondary" />
                            )}
                          </div>
                          <p className="text-[10px] text-text-muted">{room.type}</p>
                          {assigned && (
                            <p className="mt-1 text-[10px] font-medium text-accent truncate">
                              {assigned.name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Rooming ─── */}
        {activeTab === 'rooming' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">
                Rooming List ({roomingList.length} guests)
              </h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowRoomingUpload(true)}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload List
                </Button>
                <Button variant="outline" size="sm">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Add Guest
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Guest
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Room
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roomingList.map((guest, i) => (
                    <tr key={i} className="hover:bg-surface/50">
                      <td className="px-3 py-2 text-text-primary">{guest.name}</td>
                      <td className="px-3 py-2 font-mono text-text-secondary">
                        {guest.room || '—'}
                      </td>
                      <td className="px-3 py-2 text-text-secondary text-xs">{guest.type}</td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border',
                            guest.checkedIn
                              ? 'bg-accent/10 text-accent border-accent/20'
                              : 'bg-warning/10 text-warning border-warning/20'
                          )}
                        >
                          {guest.checkedIn ? 'Checked In' : 'Not Arrived'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button className="text-text-muted hover:text-text-primary">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showRoomingUpload && (
              <RoomingListModal group={group} onClose={() => setShowRoomingUpload(false)} />
            )}
          </div>
        )}

        {/* ─── Folio ─── */}
        {activeTab === 'folio' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">Group Master Folio</h4>
              <Button variant="outline" size="sm">
                <DollarSign className="mr-1.5 h-3.5 w-3.5" /> Post Charge
              </Button>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                      Charge
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {folioTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-surface/50">
                      <td className="px-3 py-2 text-text-secondary">{t.date}</td>
                      <td className="px-3 py-2 text-text-primary">{t.description}</td>
                      <td className="px-3 py-2 text-right font-mono text-text-primary">
                        {t.charge > 0 ? formatCurrency(t.charge) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-accent">
                        {t.payment > 0 ? formatCurrency(t.payment) : '—'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface font-semibold">
                    <td className="px-3 py-2 text-text-primary" colSpan={2}>
                      Balance
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-primary" colSpan={2}>
                      <span className={folioBalance > 0 ? 'text-danger' : 'text-accent'}>
                        {formatCurrency(folioBalance)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Events ─── */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-text-primary">
                Events & Banquet Event Orders
              </h4>
              <Button variant="outline" size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Event
              </Button>
            </div>

            {events.map((evt) => (
              <div key={evt.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <Building2 className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-text-primary">{evt.name}</h5>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent border border-accent/20">
                        {evt.status.charAt(0).toUpperCase() + evt.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      {evt.date} · {evt.time} · {evt.guests} guests
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {evt.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-text-secondary border border-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {events.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <Briefcase className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-text-muted">No events scheduled for this group.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
