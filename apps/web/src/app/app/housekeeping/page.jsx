import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Sparkles,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  ChevronDown,
  Plus,
  ArrowUpDown,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';

/* ─── Mock Data ─── */
const initialRooms = [
  // Floor 1
  {
    id: '101',
    floor: 1,
    type: 'Standard King',
    status: 'clean',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
  {
    id: '102',
    floor: 1,
    type: 'Standard King',
    status: 'occupied',
    guest: 'John Smith',
    vip: false,
    arrival: '2026-08-12',
    departure: '2026-08-15',
  },
  {
    id: '103',
    floor: 1,
    type: 'Deluxe Queen',
    status: 'dirty',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
  {
    id: '104',
    floor: 1,
    type: 'Accessible',
    status: 'inspected',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
  {
    id: '105',
    floor: 1,
    type: 'Standard Twin',
    status: 'ooo',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
    oooReason: 'HVAC Repair',
  },
  // Floor 2
  {
    id: '201',
    floor: 2,
    type: 'Deluxe King',
    status: 'clean',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
  {
    id: '202',
    floor: 2,
    type: 'Deluxe King',
    status: 'occupied',
    guest: 'Sarah Chen',
    vip: true,
    arrival: '2026-08-11',
    departure: '2026-08-14',
  },
  {
    id: '203',
    floor: 2,
    type: 'Suite',
    status: 'dirty',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
  {
    id: '204',
    floor: 2,
    type: 'Deluxe King',
    status: 'occupied',
    guest: 'Mike Brown',
    vip: false,
    arrival: '2026-08-10',
    departure: '2026-08-13',
  },
  {
    id: '205',
    floor: 2,
    type: 'Standard Queen',
    status: 'clean',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
  // Floor 3
  {
    id: '301',
    floor: 3,
    type: 'Suite',
    status: 'inspected',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
  {
    id: '302',
    floor: 3,
    type: 'Deluxe King',
    status: 'occupied',
    guest: 'Emily Davis',
    vip: true,
    arrival: '2026-08-12',
    departure: '2026-08-16',
  },
  {
    id: '303',
    floor: 3,
    type: 'Standard Twin',
    status: 'dirty',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
  {
    id: '304',
    floor: 3,
    type: 'Deluxe Queen',
    status: 'ooo',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
    oooReason: 'Plumbing',
  },
  {
    id: '305',
    floor: 3,
    type: 'Suite',
    status: 'clean',
    guest: null,
    vip: false,
    arrival: null,
    departure: null,
  },
];

const attendants = [
  {
    id: 1,
    name: 'Maria G.',
    initials: 'MG',
    shift: '7:00 AM - 3:00 PM',
    assigned: ['101', '103', '201', '203', '303'],
    completed: ['101', '201'],
  },
  {
    id: 2,
    name: 'James L.',
    initials: 'JL',
    shift: '7:00 AM - 3:00 PM',
    assigned: ['102', '104', '202', '204', '205'],
    completed: ['104', '205'],
  },
  {
    id: 3,
    name: 'Priya K.',
    initials: 'PK',
    shift: '3:00 PM - 11:00 PM',
    assigned: ['301', '302', '303', '304', '305'],
    completed: ['301'],
  },
];

const statusMeta = {
  clean: {
    label: 'Clean',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: CheckCircle2,
  },
  dirty: {
    label: 'Dirty',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: AlertTriangle,
  },
  inspected: {
    label: 'Inspected',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    icon: Sparkles,
  },
  ooo: {
    label: 'OOO',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
    icon: Wrench,
  },
  occupied: {
    label: 'Occupied',
    class: 'bg-secondary/10 text-secondary border-secondary/20',
    dot: 'bg-secondary',
    icon: BedDouble,
  },
};

const floors = [1, 2, 3];

/* ─── Components ─── */
function RoomCard({ room, onStatusChange, isDragging, onDragStart, onDragEnd, onDrop }) {
  const meta = statusMeta[room.status];
  const StatusIcon = meta.icon;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('roomId', room.id);
        onDragStart(room.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData('roomId');
        if (fromId && fromId !== room.id) {
          onDrop(fromId, room.id);
        }
      }}
      className={cn(
        'group relative rounded-xl border p-4 transition-all cursor-grab active:cursor-grabbing hover:shadow-md',
        meta.class,
        isDragging && 'opacity-50 scale-95',
        'bg-surface'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-text-primary">{room.id}</span>
        <span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />
      </div>
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
        {room.type}
      </p>

      {room.guest && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
          <User className="h-3 w-3" />
          <span className="truncate">{room.guest}</span>
          {room.vip && (
            <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-warning">
              VIP
            </span>
          )}
        </div>
      )}

      {room.oooReason && (
        <p className="mt-1.5 text-[10px] font-medium text-warning">{room.oooReason}</p>
      )}

      <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {Object.keys(statusMeta).map(
          (s) =>
            s !== room.status && (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(room.id, s);
                }}
                className={cn(
                  'h-6 w-6 rounded-full border flex items-center justify-center transition-colors',
                  statusMeta[s].class
                )}
                title={`Mark ${statusMeta[s].label}`}
              >
                <div className={cn('h-2 w-2 rounded-full', statusMeta[s].dot)} />
              </button>
            )
        )}
      </div>
    </div>
  );
}

function StatusColumn({
  status,
  rooms,
  onStatusChange,
  onDragStart,
  onDragEnd,
  onDrop,
  draggedRoom,
}) {
  const meta = statusMeta[status];
  const StatusIcon = meta.icon;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const roomId = e.dataTransfer.getData('roomId');
        if (roomId) onDrop(roomId, status);
      }}
      className={cn(
        'rounded-xl border-2 border-dashed p-3 transition-colors min-h-50',
        draggedRoom ? 'border-border bg-background' : 'border-transparent'
      )}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <StatusIcon className={cn('h-4 w-4', meta.class.split(' ')[1])} />
        <span className="text-sm font-semibold text-text-primary">{meta.label}</span>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text-muted border border-border">
          {rooms.length}
        </span>
      </div>
      <div className="space-y-2">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onStatusChange={onStatusChange}
            isDragging={draggedRoom === room.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
          />
        ))}
      </div>
    </div>
  );
}

export default function HousekeepingPage() {
  const [rooms, setRooms] = useState(initialRooms);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'board'
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [draggedRoom, setDraggedRoom] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('2026-08-12');

  const stats = useMemo(() => {
    const total = rooms.length;
    const clean = rooms.filter((r) => r.status === 'clean').length;
    const dirty = rooms.filter((r) => r.status === 'dirty').length;
    const inspected = rooms.filter((r) => r.status === 'inspected').length;
    const ooo = rooms.filter((r) => r.status === 'ooo').length;
    const occupied = rooms.filter((r) => r.status === 'occupied').length;
    return { total, clean, dirty, inspected, ooo, occupied };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesFloor = floorFilter === 'all' || r.floor === parseInt(floorFilter);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesQuery =
        !query ||
        r.id.includes(query) ||
        r.type.toLowerCase().includes(query.toLowerCase()) ||
        (r.guest && r.guest.toLowerCase().includes(query.toLowerCase()));
      return matchesFloor && matchesStatus && matchesQuery;
    });
  }, [rooms, floorFilter, statusFilter, query]);

  const handleStatusChange = (roomId, newStatus) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r)));
  };

  const handleDropToStatus = (roomId, newStatus) => {
    handleStatusChange(roomId, newStatus);
    setDraggedRoom(null);
  };

  const handleDropSwap = (fromId, toId) => {
    // Simple swap for demo
    setRooms((prev) => {
      const fromIndex = prev.findIndex((r) => r.id === fromId);
      const toIndex = prev.findIndex((r) => r.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const tempFloor = next[fromIndex].floor;
      next[fromIndex] = { ...next[fromIndex], floor: next[toIndex].floor };
      next[toIndex] = { ...next[toIndex], floor: tempFloor };
      return next;
    });
    setDraggedRoom(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Housekeeping</h1>
          <p className="text-sm text-text-secondary">
            Room status, schedules, and attendant assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'board' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List className="mr-1.5 h-4 w-4" />
            ) : (
              <LayoutGrid className="mr-1.5 h-4 w-4" />
            )}
            {viewMode === 'grid' ? 'Board View' : 'Grid View'}
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Schedule Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-text-primary', bg: 'bg-surface' },
          { label: 'Clean', value: stats.clean, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Dirty', value: stats.dirty, color: 'text-danger', bg: 'bg-danger/10' },
          { label: 'Inspected', value: stats.inspected, color: 'text-info', bg: 'bg-info/10' },
          { label: 'OOO', value: stats.ooo, color: 'text-warning', bg: 'bg-warning/10' },
          {
            label: 'Occupied',
            value: stats.occupied,
            color: 'text-secondary',
            bg: 'bg-secondary/10',
          },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl border border-border p-4', s.bg)}>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {s.label}
            </p>
            <p className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search room, type, guest..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Floors</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                Floor {f}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusMeta).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {floors.map((floor) => {
            const floorRooms = filteredRooms.filter((r) => r.floor === floor);
            if (floorRooms.length === 0) return null;
            return (
              <div key={floor}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Floor {floor}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {floorRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onStatusChange={handleStatusChange}
                      isDragging={draggedRoom === room.id}
                      onDragStart={setDraggedRoom}
                      onDragEnd={() => setDraggedRoom(null)}
                      onDrop={handleDropSwap}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {filteredRooms.length === 0 && (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <p className="text-text-muted">No rooms match your filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Board View (Kanban-style) */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.keys(statusMeta).map((status) => (
            <StatusColumn
              key={status}
              status={status}
              rooms={filteredRooms.filter((r) => r.status === status)}
              onStatusChange={handleStatusChange}
              onDragStart={setDraggedRoom}
              onDragEnd={() => setDraggedRoom(null)}
              onDrop={handleDropToStatus}
              draggedRoom={draggedRoom}
            />
          ))}
        </div>
      )}

      {/* Schedule Board */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary" /> Attendant Schedule
          </h3>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Attendant</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Shift</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">
                  Assigned Rooms
                </th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Progress</th>
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendants.map((a) => {
                const progress = Math.round((a.completed.length / a.assigned.length) * 100);
                return (
                  <tr key={a.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                          {a.initials}
                        </div>
                        <span className="font-medium text-text-primary">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-text-muted" />
                        {a.shift}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.assigned.map((roomId) => {
                          const isDone = a.completed.includes(roomId);
                          const room = rooms.find((r) => r.id === roomId);
                          return (
                            <span
                              key={roomId}
                              className={cn(
                                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border',
                                isDone
                                  ? 'bg-accent/10 text-accent border-accent/20'
                                  : 'bg-background text-text-secondary border-border'
                              )}
                            >
                              {roomId}
                              {isDone && <CheckCircle2 className="ml-1 h-3 w-3" />}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 max-w-30 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-secondary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-text-secondary">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
                          progress === 100
                            ? 'bg-accent/10 text-accent border-accent/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        )}
                      >
                        {progress === 100 ? 'Complete' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
