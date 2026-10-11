/* apps/web/src/app/app/rates/AvailabilityGrid.jsx */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, BedDouble, AlertTriangle } from 'lucide-react';
import { getAvailability } from '../../../api/rates-api';
import { formatDate, formatShortDay } from './RateUtils';
import { cn } from '../../../lib/utils';

// Status bucket from available count
function bucket(available) {
  if (available < 0)
    return {
      key: 'overbooked',
      label: 'Overbooked',
      chip: 'bg-danger/10 text-danger',
      dot: 'bg-danger',
    };
  if (available === 0)
    return {
      key: 'soldout',
      label: 'Sold Out',
      chip: 'bg-neutral/10 text-text-muted',
      dot: 'bg-neutral',
    };
  if (available <= 2)
    return {
      key: 'critical',
      label: 'Critical',
      chip: 'bg-warning/10 text-warning',
      dot: 'bg-warning',
    };
  if (available <= 5)
    return {
      key: 'low',
      label: 'Low',
      chip: 'bg-primary/10 text-primary',
      dot: 'bg-primary',
    };
  return {
    key: 'available',
    label: 'Available',
    chip: 'bg-accent/10 text-accent',
    dot: 'bg-accent',
  };
}

const LEGEND = [
  { key: 'available', label: 'Available', dot: 'bg-accent/60' },
  { key: 'low', label: 'Low', dot: 'bg-primary/60' },
  { key: 'critical', label: 'Critical', dot: 'bg-warning/60' },
  { key: 'soldout', label: 'Sold Out', dot: 'bg-neutral/60' },
  { key: 'overbooked', label: 'Overbooked', dot: 'bg-danger/60' },
];

export default function AvailabilityGrid() {
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState('all');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i + dateOffset);
      result.push(date.toISOString().split('T')[0]);
    }
    return result;
  }, [today, dateOffset]);

  const { data: availability, isLoading } = useQuery({
    queryKey: ['availability', dates[0], dates[dates.length - 1]],
    queryFn: () => getAvailability({ from: dates[0], to: dates[dates.length - 1] }),
  });

  const rows = useMemo(() => {
    const all = availability?.data ?? [];
    if (selectedRoomType === 'all') return all;
    return all.filter((r) => r.roomType.id === selectedRoomType);
  }, [availability, selectedRoomType]);

  const roomTypes = useMemo(() => availability?.data.map((r) => r.roomType) ?? [], [availability]);

  const hasOverbooking = rows.some((r) => dates.some((d) => (r.days[d]?.available ?? 0) < 0));

  const dateNav = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setDateOffset((prev) => prev - 14)}
        className="flex items-center justify-center h-8 w-8 border border-border rounded-md text-text-secondary hover:bg-surface-elevated"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2 px-2">
        <Calendar className="h-4 w-4 text-text-secondary" />
        <span className="font-medium text-text-primary text-sm">
          {formatDate(dates[0])} — {formatDate(dates[dates.length - 1])}
        </span>
      </div>
      <button
        onClick={() => setDateOffset((prev) => prev + 14)}
        className="flex items-center justify-center h-8 w-8 border border-border rounded-md text-text-secondary hover:bg-surface-elevated"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={() => setDateOffset(0)}
        className="ml-2 px-3 py-1.5 text-sm border border-border rounded-md text-text-secondary hover:bg-surface-elevated"
      >
        Today
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Subheading — matches old design */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Availability Grid</h2>
          <p className="text-sm text-text-secondary">Real-time inventory with overbooking alerts</p>
        </div>
      </div>

      {/* Date Navigation + Filter */}
      <div className="flex items-center justify-between bg-surface rounded-xl border border-border p-4">
        {dateNav}
        <select
          value={selectedRoomType}
          onChange={(e) => setSelectedRoomType(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-surface text-sm text-text-primary"
        >
          <option value="all">All Room Types</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
        <span className="font-medium">Status:</span>
        {LEGEND.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full', l.dot)} /> {l.label}
          </span>
        ))}
      </div>

      {/* Overbooking banner */}
      {hasOverbooking && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Overbooking detected in this window — more rooms sold than exist for at least one room
          type and date.
        </div>
      )}

      {/* Availability Grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 bg-surface px-4 py-3 text-left font-medium text-text-secondary min-w-44">
                Room Type / Date
              </th>
              {dates.map((date) => {
                const { dow, day, weekend } = formatShortDay(date);
                return (
                  <th
                    key={date}
                    className={`px-2 py-3 text-center font-medium min-w-20 ${
                      weekend ? 'text-warning' : 'text-text-secondary'
                    }`}
                  >
                    <div>{dow}</div>
                    <div className="text-xs font-normal opacity-80">{day}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={dates.length + 1} className="px-4 py-12 text-center text-text-muted">
                  Loading availability…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={dates.length + 1} className="px-4 py-12 text-center text-text-muted">
                  No room types found.
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row) => {
                const firstDay = row.days[dates[0]];
                return (
                  <tr key={row.roomType.id} className="border-b border-border last:border-0">
                    <td className="sticky left-0 bg-surface px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-text-muted shrink-0" />
                        <div>
                          <p className="font-medium text-text-primary">{row.roomType.name}</p>
                          <p className="text-xs text-text-muted">{firstDay?.total ?? 0} total</p>
                        </div>
                      </div>
                    </td>
                    {dates.map((date) => {
                      const av = row.days[date];
                      if (!av) {
                        return (
                          <td key={date} className="px-1.5 py-2 text-center">
                            <span className="text-xs text-text-muted">—</span>
                          </td>
                        );
                      }
                      const b = bucket(av.available);
                      return (
                        <td key={date} className="px-1.5 py-2 text-center">
                          <div
                            className={cn(
                              'rounded-lg px-2 py-1.5 flex flex-col items-center gap-0.5',
                              b.chip
                            )}
                          >
                            <p className="font-semibold flex items-center gap-1.5">
                              <span className={cn('h-1.5 w-1.5 rounded-full', b.dot)} />
                              {av.available}
                            </p>
                            <p className="text-[10px] opacity-80">
                              {av.booked}/{av.total} booked
                            </p>
                            {(b.key === 'overbooked' || b.key === 'critical') && (
                              <p className="text-[10px] font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {b.label}
                              </p>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
