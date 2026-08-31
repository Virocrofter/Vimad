import { useState, useMemo } from 'react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Calendar, DollarSign, Tag, AlertTriangle, TrendingUp, TrendingDown,
  ChevronLeft, ChevronRight, Plus, Trash2, Edit3, Save, X, Copy,
  Check, Filter, Download, Settings, Grid3X3, BedDouble, Clock,
  Ban, Users, ArrowRight, Minus, Percent, Hash, Info, Globe
} from 'lucide-react';

/* ─── Mock Data ─── */
const roomTypes = [
  { id: 'std-twin', name: 'Standard Twin', baseRate: 145 },
  { id: 'del-king', name: 'Deluxe King', baseRate: 189 },
  { id: 'suite', name: 'Executive Suite', baseRate: 320 },
  { id: 'std-queen', name: 'Standard Queen', baseRate: 135 },
];

const generateDates = (startDate, days) => {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
};

const formatDate = (date) => date.toISOString().split('T')[0];
const formatDisplay = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const generateRateData = (dates, rooms) => {
  const data = {};
  dates.forEach((date) => {
    const dateStr = formatDate(date);
    data[dateStr] = {};
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isHoliday = [5, 12, 19].includes(date.getDate()); // mock holidays
    rooms.forEach((room) => {
      let rate = room.baseRate;
      if (isWeekend) rate *= 1.15;
      if (isHoliday) rate *= 1.25;
      // Add some randomness
      rate += Math.floor(Math.random() * 20) - 10;
      data[dateStr][room.id] = Math.round(rate);
    });
  });
  return data;
};

const generateAvailabilityData = (dates, rooms) => {
  const data = {};
  dates.forEach((date) => {
    const dateStr = formatDate(date);
    data[dateStr] = {};
    rooms.forEach((room) => {
      const totalRooms = room.id === 'suite' ? 8 : room.id === 'del-king' ? 15 : 20;
      const booked = Math.floor(Math.random() * (totalRooms + 3));
      data[dateStr][room.id] = {
        total: totalRooms,
        booked,
        available: totalRooms - booked,
        ooo: Math.random() > 0.9 ? 1 : 0,
        overbookingLimit: Math.floor(totalRooms * 1.1),
      };
    });
  });
  return data;
};

const initialRateCodes = [
  {
    id: 'rack',
    name: 'Rack Rate',
    code: 'RACK',
    description: 'Best available rate — no restrictions',
    baseRate: 189,
    derivationType: 'fixed',
    derivationValue: 0,
    minStay: 1,
    maxStay: null,
    advanceBooking: 0,
    channels: ['Direct', 'Booking.com', 'Expedia'],
    isActive: true,
    restrictions: [],
  },
  {
    id: 'corp',
    name: 'Corporate',
    code: 'CORP',
    description: 'Negotiated corporate rate',
    baseRate: 165,
    derivationType: 'percent_off',
    derivationValue: 12,
    minStay: 1,
    maxStay: 14,
    advanceBooking: 0,
    channels: ['Direct'],
    isActive: true,
    restrictions: ['Corporate ID required at check-in'],
  },
  {
    id: 'advance',
    name: 'Advance Purchase',
    code: 'ADV',
    description: 'Non-refundable, 14+ days ahead',
    baseRate: 149,
    derivationType: 'fixed_off',
    derivationValue: 40,
    minStay: 2,
    maxStay: null,
    advanceBooking: 14,
    channels: ['Direct', 'Booking.com'],
    isActive: true,
    restrictions: ['Non-refundable', 'Full prepayment required'],
  },
  {
    id: 'member',
    name: 'Member Rate',
    code: 'MEM',
    description: 'Loyalty member exclusive',
    baseRate: 155,
    derivationType: 'percent_off',
    derivationValue: 18,
    minStay: 1,
    maxStay: null,
    advanceBooking: 0,
    channels: ['Direct'],
    isActive: true,
    restrictions: ['Valid membership required'],
  },
  {
    id: 'group',
    name: 'Group Rate',
    code: 'GRP',
    description: '10+ rooms block rate',
    baseRate: 135,
    derivationType: 'percent_off',
    derivationValue: 28,
    minStay: 1,
    maxStay: null,
    advanceBooking: 30,
    channels: ['Direct'],
    isActive: false,
    restrictions: ['Min 10 rooms', 'Master folio required'],
  },
];

const tabs = [
  { id: 'calendar', label: 'Rate Calendar', icon: Calendar },
  { id: 'codes', label: 'Rate Codes', icon: Tag },
  { id: 'availability', label: 'Availability', icon: Grid3X3 },
];

/* ─── Rate Heat Map Color ─── */
function getRateColor(rate, baseRate, theme) {
  const ratio = rate / baseRate;
  if (ratio >= 1.3) return theme === 'dark' ? 'bg-danger/30 text-danger' : 'bg-danger/15 text-danger';
  if (ratio >= 1.15) return theme === 'dark' ? 'bg-warning/30 text-warning' : 'bg-warning/15 text-warning';
  if (ratio >= 1.0) return theme === 'dark' ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent';
  if (ratio >= 0.85) return theme === 'dark' ? 'bg-info/20 text-info' : 'bg-info/10 text-info';
  return theme === 'dark' ? 'bg-secondary/20 text-secondary' : 'bg-secondary/10 text-secondary';
}

function getAvailabilityStatus(available, total, ooo, overbookingLimit) {
  const effective = available - ooo;
  if (effective < 0) return { label: 'Overbooked', class: 'bg-danger/15 text-danger border-danger/30', dot: 'bg-danger' };
  if (effective === 0) return { label: 'Sold Out', class: 'bg-neutral/10 text-text-muted border-border', dot: 'bg-text-muted' };
  if (effective <= total * 0.1) return { label: 'Critical', class: 'bg-warning/15 text-warning border-warning/30', dot: 'bg-warning' };
  if (effective <= total * 0.3) return { label: 'Low', class: 'bg-info/15 text-info border-info/30', dot: 'bg-info' };
  return { label: 'Available', class: 'bg-accent/10 text-accent border-accent/20', dot: 'bg-accent' };
}

/* ─── Components ─── */
function RateCell({ value, baseRate, onChange, isEditing, onStartEdit, onSave, onCancel }) {
  const [editValue, setEditValue] = useState(value);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-16 h-7 text-xs rounded border border-secondary bg-background text-text-primary px-1 text-center focus:outline-none focus:ring-1 focus:ring-secondary"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(Number(editValue));
            if (e.key === 'Escape') onCancel();
          }}
        />
        <button onClick={() => onSave(Number(editValue))} className="text-accent hover:text-accent/80">
          <Check className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStartEdit}
      className={cn(
        'w-full h-full flex items-center justify-center text-xs font-mono font-medium rounded transition-all hover:ring-1 hover:ring-secondary/50',
        getRateColor(value, baseRate, 'light')
      )}
    >
      ${value}
    </button>
  );
}

/* ─── Main Page ─── */
export default function RatesPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedRateCode, setSelectedRateCode] = useState(null);
  const [rateCodes, setRateCodes] = useState(initialRateCodes);
  const [editingCell, setEditingCell] = useState(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterRoomType, setFilterRoomType] = useState('all');

  const today = new Date();
  today.setDate(today.getDate() + dateOffset);
  const dates = useMemo(() => generateDates(today, 14), [today]);
  const dateStrs = useMemo(() => dates.map(formatDate), [dates]);

  const [rateData, setRateData] = useState(() => generateRateData(dates, roomTypes));
  const [availabilityData] = useState(() => generateAvailabilityData(dates, roomTypes));

  // Refresh rate data when dates change
  useMemo(() => {
    setRateData(generateRateData(dates, roomTypes));
  }, [dateOffset]);

  const filteredRoomTypes = filterRoomType === 'all'
    ? roomTypes
    : roomTypes.filter((r) => r.id === filterRoomType);

  const handleRateUpdate = (dateStr, roomId, newRate) => {
    setRateData((prev) => ({
      ...prev,
      [dateStr]: { ...prev[dateStr], [roomId]: newRate },
    }));
    setEditingCell(null);
  };

  const handleBulkApply = () => {
    const val = Number(bulkEditValue);
    if (!val || val <= 0) return;
    const newData = { ...rateData };
    selectedCells.forEach((key) => {
      const [dateStr, roomId] = key.split('|');
      if (newData[dateStr]) {
        newData[dateStr] = { ...newData[dateStr], [roomId]: val };
      }
    });
    setRateData(newData);
    setSelectedCells(new Set());
    setBulkEditOpen(false);
    setBulkEditValue('');
  };

  const toggleCellSelection = (dateStr, roomId) => {
    const key = `${dateStr}|${roomId}`;
    setSelectedCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllVisible = () => {
    const all = new Set();
    dateStrs.forEach((ds) => {
      filteredRoomTypes.forEach((rt) => all.add(`${ds}|${rt.id}`));
    });
    setSelectedCells(all);
  };

  const stats = useMemo(() => {
    const allRates = [];
    dateStrs.forEach((ds) => {
      filteredRoomTypes.forEach((rt) => {
        allRates.push(rateData[ds]?.[rt.id] || rt.baseRate);
      });
    });
    if (allRates.length === 0) return { min: 0, max: 0, avg: 0 };
    return {
      min: Math.min(...allRates),
      max: Math.max(...allRates),
      avg: Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length),
    };
  }, [rateData, dateStrs, filteredRoomTypes]);

  /* ─── Rate Calendar Tab ─── */
  const renderRateCalendar = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateOffset((o) => o - 14)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-text-primary min-w-[180px] text-center">
            {formatDisplay(dates[0])} — {formatDisplay(dates[dates.length - 1])}
          </span>
          <button
            onClick={() => setDateOffset((o) => o + 14)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDateOffset(0)}
            className="ml-2 text-xs text-secondary hover:underline"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedCells.size > 0 && (
            <>
              <span className="text-xs text-text-muted">{selectedCells.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => setBulkEditOpen(true)}>
                <Edit3 className="mr-1 h-3.5 w-3.5" /> Bulk Edit
              </Button>
              <button onClick={() => setSelectedCells(new Set())} className="text-xs text-text-muted hover:text-text-primary">
                Clear
              </button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={selectAllVisible}>
            <Copy className="mr-1 h-3.5 w-3.5" /> Select All
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-1 h-3.5 w-3.5" /> Filter
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3">
          <label className="text-xs text-text-secondary">Room Type:</label>
          <select
            value={filterRoomType}
            onChange={(e) => setFilterRoomType(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text-primary"
          >
            <option value="all">All Types</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {[
          { label: 'Min Rate', value: `$${stats.min}`, icon: TrendingDown, color: 'text-secondary' },
          { label: 'Max Rate', value: `$${stats.max}`, icon: TrendingUp, color: 'text-accent' },
          { label: 'Avg Rate', value: `$${stats.avg}`, icon: DollarSign, color: 'text-info' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center gap-2">
              <s.icon className={cn('h-4 w-4', s.color)} />
              <span className="text-xs text-text-muted">{s.label}</span>
            </div>
            <p className="mt-1 text-lg font-bold font-mono text-text-primary">{s.value}</p>
          </div>
        ))}
        <div className="rounded-lg border border-border bg-surface p-3 col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-4 w-4 text-text-muted" />
            <span className="text-xs text-text-muted">Rate Heat Map</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary" /> Below Base</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Base</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Premium</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" /> Peak</span>
          </div>
        </div>
      </div>

      {/* Rate Grid */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted sticky left-0 bg-background z-10 min-w-[140px]">
                  Room Type / Date
                </th>
                {dates.map((date) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <th
                      key={formatDate(date)}
                      className={cn(
                        'px-2 py-2 text-center text-xs font-medium min-w-[72px]',
                        isWeekend ? 'text-warning bg-warning/5' : 'text-text-secondary'
                      )}
                    >
                      <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className={cn('font-mono', isWeekend && 'text-warning font-semibold')}>
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRoomTypes.map((room) => (
                <tr key={room.id} className="hover:bg-background/50">
                  <td className="px-3 py-2 sticky left-0 bg-surface z-10 border-r border-border">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-secondary" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{room.name}</p>
                        <p className="text-[10px] text-text-muted">Base ${room.baseRate}</p>
                      </div>
                    </div>
                  </td>
                  {dateStrs.map((dateStr) => {
                    const rate = rateData[dateStr]?.[room.id] ?? room.baseRate;
                    const cellKey = `${dateStr}|${room.id}`;
                    const isSelected = selectedCells.has(cellKey);
                    const isEditing = editingCell === cellKey;
                    return (
                      <td
                        key={dateStr}
                        className={cn(
                          'px-1 py-1 text-center cursor-pointer transition-all',
                          isSelected && 'ring-2 ring-secondary ring-inset'
                        )}
                        onClick={() => toggleCellSelection(dateStr, room.id)}
                      >
                        <RateCell
                          value={rate}
                          baseRate={room.baseRate}
                          isEditing={isEditing}
                          onStartEdit={() => {
                            setEditingCell(cellKey);
                            setSelectedCells(new Set());
                          }}
                          onSave={(val) => handleRateUpdate(dateStr, room.id, val)}
                          onCancel={() => setEditingCell(null)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {bulkEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBulkEditOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-text-primary">Bulk Edit Rates</h3>
            <p className="text-xs text-text-muted mt-1">{selectedCells.size} cells selected</p>
            <div className="mt-4 space-y-3">
              <Input
                label="New Rate ($)"
                type="number"
                placeholder="189"
                value={bulkEditValue}
                onChange={(e) => setBulkEditValue(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleBulkApply}>Apply</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ─── Rate Codes Tab ─── */
  const renderRateCodes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Rate Codes</h3>
          <p className="text-xs text-text-muted">Manage pricing strategies and derivation rules</p>
        </div>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add Rate Code
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rate Code List */}
        <div className="lg:col-span-1 space-y-2">
          {rateCodes.map((code) => (
            <button
              key={code.id}
              onClick={() => setSelectedRateCode(code)}
              className={cn(
                'w-full text-left rounded-lg border p-3 transition-all',
                selectedRateCode?.id === code.id
                  ? 'border-secondary bg-secondary/5 ring-1 ring-secondary'
                  : 'border-border bg-surface hover:bg-surface-elevated'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className={cn('h-4 w-4', code.isActive ? 'text-secondary' : 'text-text-muted')} />
                  <span className="text-sm font-medium text-text-primary">{code.name}</span>
                </div>
                <span className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded',
                  code.isActive ? 'bg-accent/10 text-accent' : 'bg-neutral/10 text-text-muted'
                )}>
                  {code.code}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-secondary truncate">{code.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-text-primary">${code.baseRate}</span>
                <span className="text-[10px] text-text-muted">
                  {code.derivationType === 'percent_off' && `-${code.derivationValue}%`}
                  {code.derivationType === 'fixed_off' && `-$${code.derivationValue}`}
                  {code.derivationType === 'fixed' && 'Fixed'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Rate Code Detail */}
        <div className="lg:col-span-2">
          {selectedRateCode ? (
            <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-text-primary">{selectedRateCode.name}</h3>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      selectedRateCode.isActive ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'
                    )}>
                      {selectedRateCode.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{selectedRateCode.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="danger" size="sm">
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Base Rate', value: `$${selectedRateCode.baseRate}`, icon: DollarSign },
                  { label: 'Min Stay', value: `${selectedRateCode.minStay} night${selectedRateCode.minStay > 1 ? 's' : ''}`, icon: Clock },
                  { label: 'Advance', value: selectedRateCode.advanceBooking > 0 ? `${selectedRateCode.advanceBooking} days` : 'None', icon: Calendar },
                  { label: 'Channels', value: selectedRateCode.channels.length.toString(), icon: Globe },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <stat.icon className="h-3.5 w-3.5" />
                      <span className="text-[10px] uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <p className="mt-1 text-lg font-bold font-mono text-text-primary">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Derivation Rules */}
              <div className="rounded-lg border border-border bg-background p-4">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Settings className="h-4 w-4 text-secondary" /> Derivation Rules
                </h4>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Calculation Method</span>
                    <span className="text-sm font-medium text-text-primary capitalize">
                      {selectedRateCode.derivationType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Value</span>
                    <span className="text-sm font-medium text-text-primary">
                      {selectedRateCode.derivationType === 'percent_off' && `${selectedRateCode.derivationValue}%`}
                      {selectedRateCode.derivationType === 'fixed_off' && `$${selectedRateCode.derivationValue}`}
                      {selectedRateCode.derivationType === 'fixed' && '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-text-secondary">Effective Rate (from Rack)</span>
                    <span className="text-sm font-bold font-mono text-accent">
                      ${selectedRateCode.baseRate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-text-secondary">Max Stay</span>
                    <span className="text-sm font-medium text-text-primary">
                      {selectedRateCode.maxStay ? `${selectedRateCode.maxStay} nights` : 'Unlimited'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Restrictions */}
              <div className="rounded-lg border border-border bg-background p-4">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Ban className="h-4 w-4 text-danger" /> Restrictions & Policies
                </h4>
                {selectedRateCode.restrictions.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {selectedRateCode.restrictions.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-muted">No restrictions applied.</p>
                )}
              </div>

              {/* Channel Distribution */}
              <div className="rounded-lg border border-border bg-background p-4">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Globe className="h-4 w-4 text-info" /> Channel Distribution
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedRateCode.channels.map((ch) => (
                    <span key={ch} className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                      <Check className="mr-1 h-3 w-3" /> {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-border bg-surface">
              <div className="text-center">
                <Tag className="mx-auto h-10 w-10 text-text-muted" />
                <p className="mt-3 text-sm text-text-secondary">Select a rate code to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ─── Availability Tab ─── */
  const renderAvailability = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Availability Grid</h3>
          <p className="text-xs text-text-muted">Real-time inventory with overbooking alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateOffset((o) => o - 14)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-text-primary min-w-[180px] text-center">
            {formatDisplay(dates[0])} — {formatDisplay(dates[dates.length - 1])}
          </span>
          <button
            onClick={() => setDateOffset((o) => o + 14)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-elevated"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDateOffset(0)}
            className="ml-2 text-xs text-secondary hover:underline"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
        <span className="text-xs text-text-muted font-medium">Status:</span>
        {[
          { label: 'Available', dot: 'bg-accent' },
          { label: 'Low', dot: 'bg-info' },
          { label: 'Critical', dot: 'bg-warning' },
          { label: 'Sold Out', dot: 'bg-text-muted' },
          { label: 'Overbooked', dot: 'bg-danger' },
        ].map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={cn('h-2 w-2 rounded-full', s.dot)} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Availability Grid */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-3 py-2 text-left text-xs font-medium text-text-muted sticky left-0 bg-background z-10 min-w-[140px]">
                  Room Type / Date
                </th>
                {dates.map((date) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  return (
                    <th
                      key={formatDate(date)}
                      className={cn(
                        'px-2 py-2 text-center text-xs font-medium min-w-[80px]',
                        isWeekend ? 'text-warning bg-warning/5' : 'text-text-secondary'
                      )}
                    >
                      <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className={cn('font-mono', isWeekend && 'text-warning font-semibold')}>
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roomTypes.map((room) => (
                <tr key={room.id} className="hover:bg-background/50">
                  <td className="px-3 py-2 sticky left-0 bg-surface z-10 border-r border-border">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-secondary" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{room.name}</p>
                        <p className="text-[10px] text-text-muted">{room.id === 'suite' ? 8 : room.id === 'del-king' ? 15 : 20} total</p>
                      </div>
                    </div>
                  </td>
                  {dateStrs.map((dateStr) => {
                    const avail = availabilityData[dateStr]?.[room.id];
                    if (!avail) return <td key={dateStr} className="px-2 py-2 text-center text-text-muted">—</td>;

                    const status = getAvailabilityStatus(avail.available, avail.total, avail.ooo, avail.overbookingLimit);
                    const isOverbooked = avail.available - avail.ooo < 0;
                    const isLow = avail.available - avail.ooo <= avail.total * 0.1 && !isOverbooked;

                    return (
                      <td key={dateStr} className="px-2 py-2">
                        <div className={cn(
                          'rounded-lg border p-2 text-center transition-all hover:shadow-sm',
                          status.class
                        )}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                            <span className={cn(
                              'text-lg font-bold font-mono',
                              isOverbooked ? 'text-danger' : 'text-text-primary'
                            )}>
                              {avail.available - avail.ooo}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-text-muted">
                            {avail.booked}/{avail.total} booked
                          </div>
                          {avail.ooo > 0 && (
                            <div className="mt-1 text-[10px] text-danger font-medium">
                              {avail.ooo} OOO
                            </div>
                          )}
                          {isOverbooked && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-danger font-bold">
                              <AlertTriangle className="h-3 w-3" /> Overbooked
                            </div>
                          )}
                          {isLow && !isOverbooked && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-warning font-medium">
                              <AlertTriangle className="h-3 w-3" /> Low
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overbooking Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roomTypes.map((room) => {
          const overbookedDays = dateStrs.filter((ds) => {
            const a = availabilityData[ds]?.[room.id];
            return a && a.available - a.ooo < 0;
          }).length;
          const lowDays = dateStrs.filter((ds) => {
            const a = availabilityData[ds]?.[room.id];
            return a && a.available - a.ooo >= 0 && a.available - a.ooo <= a.total * 0.1;
          }).length;

          return (
            <div key={room.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-2 mb-2">
                <BedDouble className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-text-primary">{room.name}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">Overbooked days</span>
                  <span className={cn('font-bold font-mono', overbookedDays > 0 ? 'text-danger' : 'text-accent')}>
                    {overbookedDays}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">Low inventory days</span>
                  <span className={cn('font-bold font-mono', lowDays > 0 ? 'text-warning' : 'text-accent')}>
                    {lowDays}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rates & Inventory</h1>
          <p className="text-sm text-text-secondary">Manage pricing, rate codes, and room availability</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> New Rate
          </Button>
        </div>
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
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'calendar' && renderRateCalendar()}
      {activeTab === 'codes' && renderRateCodes()}
      {activeTab === 'availability' && renderAvailability()}
    </div>
  );
}