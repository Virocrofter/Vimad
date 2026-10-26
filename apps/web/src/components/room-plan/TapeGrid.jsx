import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import ReservationBlock from './ReservationBlock';
import ReservationPopover from './ReservationPopover';
import { addDays, dayKeysBetween, todayKey, WEEKDAY_SHORT, formatMoney } from './TapeChart';

const STATUS_META_LOCAL = {
  confirmed: { label: 'Confirmed', color: '#6366f1', soft: '#eef2ff', text: '#3730a3' },
  checked_in: { label: 'In house', color: '#10b981', soft: '#ecfdf5', text: '#065f46' },
  checked_out: { label: 'Departed', color: '#94a3b8', soft: '#f1f5f9', text: '#475569' },
};

const HK_DOT = {
  clean: '#10b981',
  dirty: '#f59e0b',
  inspected: '#0ea5e9',
  pickup: '#8b5cf6',
  maintenance: '#f43f5e',
};

const LABEL_W = 190;

function buildSegments(stays, from, to) {
  const byResRoom = new Map();
  for (const s of stays) {
    if (s.date < from || s.date >= to) continue;
    const k = `${s.reservationId}|${s.roomId}`;
    if (!byResRoom.has(k)) byResRoom.set(k, []);
    byResRoom.get(k).push(s.date);
  }
  const segs = [];
  for (const [k, dates] of byResRoom) {
    const [reservationId, roomId] = k.split('|');
    const sorted = [...new Set(dates)].sort();
    if (!sorted.length) continue;
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      if (i === sorted.length || sorted[i] !== addDays(prev, 1)) {
        segs.push({ reservationId, roomId, start, end: addDays(prev, 1) });
        if (i < sorted.length) start = sorted[i];
      }
      if (i < sorted.length) prev = sorted[i];
    }
  }
  return segs;
}

export default function TapeGrid({
  property,
  rooms,
  roomTypes,
  reservations,
  stays,
  blocks,
  restrictions,
  holds,
  dayStats,
  from,
  to,
  density,
  selectedIds,
  collapsedTypes,
  onToggleType,
  onToggleSelect,
  onCellContext,
  onCellDoubleClick,
  onReservationContext,
  onReservationClick,
  onBlockContext,
  onMoveReservation,
}) {
  const [dragResId, setDragResId] = useState(null);
  const [dragOverRoomId, setDragOverRoomId] = useState(null);
  const [hover, setHover] = useState(null);

  const compact = density === 'compact';
  const dayW = compact ? 44 : 60;
  const rowH = compact ? 32 : 44;
  const days = useMemo(() => dayKeysBetween(from, to), [from, to]);
  const colCount = days.length;
  const today = todayKey();
  const todayIdx = days.indexOf(today);

  const template = `${LABEL_W}px repeat(${colCount}, ${dayW}px)`;

  const resById = useMemo(() => new Map(reservations.map((r) => [r.id, r])), [reservations]);

  const segments = useMemo(() => buildSegments(stays, from, to), [stays, from, to]);

  const segsByRoom = useMemo(() => {
    const m = new Map();
    for (const s of segments) {
      if (!m.has(s.roomId)) m.set(s.roomId, []);
      m.get(s.roomId).push(s);
    }
    return m;
  }, [segments]);

  const blocksByRoom = useMemo(() => {
    const m = new Map();
    for (const b of blocks) {
      if (!b.roomId) continue;
      if (b.endDate <= from || b.startDate >= to) continue;
      if (!m.has(b.roomId)) m.set(b.roomId, []);
      m.get(b.roomId).push(b);
    }
    return m;
  }, [blocks, from, to]);

  const statByDay = useMemo(() => new Map(dayStats.map((d) => [d.date, d])), [dayStats]);

  const occupiedByTypeDay = useMemo(() => {
    const roomTypeOf = new Map(rooms.map((r) => [r.id, r.roomTypeId]));
    const m = new Map();
    for (const s of stays) {
      const rt = roomTypeOf.get(s.roomId);
      if (!rt) continue;
      const k = `${rt}|${s.date}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [stays, rooms]);

  const roomsByType = useMemo(() => {
    const order = [];
    const m = new Map();
    for (const t of roomTypes) {
      const list = rooms.filter((r) => r.roomTypeId === t.id);
      if (list.length) {
        order.push(t);
        m.set(t.id, list);
      }
    }
    const untyped = rooms.filter((r) => !roomTypes.some((t) => t.id === r.roomTypeId));
    return { order, m, untyped };
  }, [rooms, roomTypes]);

  const colOf = (date) => {
    let i = 0;
    let cur = from;
    while (cur < date && i < colCount) {
      cur = addDays(cur, 1);
      i++;
    }
    return i;
  };

  const hoverTimer = useMemo(() => ({ t: null }), []);

  const showHover = (e, reservationId) => {
    clearTimeout(hoverTimer.t);
    hoverTimer.t = setTimeout(() => {
      setHover({ x: e.clientX, y: e.clientY, reservationId });
    }, 450);
  };
  const hideHover = () => {
    clearTimeout(hoverTimer.t);
    setHover(null);
  };

  const dayHeaderCell = (day) => {
    const stat = statByDay.get(day);
    const d = new Date(`${day}T00:00:00`);
    const isToday = day === today;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return (
      <div
        key={day}
        className={cn(
          'flex flex-col items-center justify-center border-l border-border text-[10px] leading-tight',
          isToday && 'bg-primary/10',
          !isToday && isWeekend && 'bg-muted/40'
        )}
        style={{ width: dayW, height: compact ? 46 : 54 }}
      >
        <span className="text-muted-foreground">{WEEKDAY_SHORT[d.getDay()]}</span>
        <span className={cn('text-sm font-semibold', isToday && 'text-primary')}>
          {d.getDate()}
        </span>
        {stat && (
          <>
            <span
              className={cn(
                'font-medium',
                stat.occupancyPct >= 90
                  ? 'text-rose-600'
                  : stat.occupancyPct >= 70
                    ? 'text-amber-600'
                    : 'text-emerald-600'
              )}
            >
              {Math.round(stat.occupancyPct)}%
            </span>
            {!compact && (
              <span className="text-muted-foreground">
                {formatMoney(stat.adr, property.currency)}
              </span>
            )}
          </>
        )}
      </div>
    );
  };

  const bandAvailability = (type, day) => {
    const total = roomsByType.m.get(type.id)?.length ?? 0;
    const occupied = occupiedByTypeDay.get(`${type.id}|${day}`) ?? 0;
    const adj =
      restrictions.find((r) => r.roomTypeId === type.id && r.date === day)?.adjustment ?? 0;
    const oooType = blocks.filter(
      (b) => b.roomTypeId === type.id && b.startDate <= day && b.endDate > day
    ).length;
    const sellable = Math.max(0, total - occupied - oooType + adj);
    const stopSell = restrictions.some(
      (r) => r.roomTypeId === type.id && r.date === day && r.stopSell
    );
    return { sellable, stopSell };
  };

  const rows = [];

  for (const type of roomsByType.order) {
    const isCollapsed = collapsedTypes.has(type.id);
    rows.push(
      <div
        key={`band-${type.id}`}
        className="sticky top-0 z-20 flex items-center border-y border-border bg-muted/80 backdrop-blur"
        style={{ width: LABEL_W + colCount * dayW, height: 30 }}
      >
        <button
          onClick={() => onToggleType(type.id)}
          className="flex items-center gap-1 px-2 text-xs font-semibold"
          style={{ width: LABEL_W }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {type.name}
          <span className="font-normal text-muted-foreground">
            ({roomsByType.m.get(type.id).length})
          </span>
        </button>
        <div className="flex">
          {days.map((day) => {
            const { sellable, stopSell } = bandAvailability(type, day);
            return (
              <div
                key={day}
                className={cn(
                  'flex items-center justify-center border-l border-border text-[10px]',
                  day === today && 'bg-primary/10',
                  stopSell && 'bg-rose-500/10 text-rose-600'
                )}
                style={{ width: dayW, height: 30 }}
                title={stopSell ? 'Stop-sell' : `${sellable} available`}
              >
                {stopSell ? <AlertTriangle className="h-3 w-3" /> : sellable}
              </div>
            );
          })}
        </div>
      </div>
    );

    if (isCollapsed) continue;

    for (const room of roomsByType.m.get(type.id)) {
      const roomSegs = segsByRoom.get(room.id) ?? [];
      const roomBlocks = blocksByRoom.get(room.id) ?? [];
      const covered = new Set();
      for (const s of roomSegs)
        for (let d = s.start; d < s.end && d < to; d = addDays(d, 1)) covered.add(d);
      for (const b of roomBlocks)
        for (
          let d = b.startDate < from ? from : b.startDate;
          d < b.endDate && d < to;
          d = addDays(d, 1)
        )
          covered.add(d);

      rows.push(
        <div
          key={room.id}
          className={cn(
            'relative flex border-b border-border',
            dragOverRoomId === room.id && 'bg-primary/10'
          )}
          style={{ width: LABEL_W + colCount * dayW, height: rowH }}
          onDragOver={(e) => {
            if (dragResId) {
              e.preventDefault();
              setDragOverRoomId(room.id);
            }
          }}
          onDragLeave={() => setDragOverRoomId((id) => (id === room.id ? null : id))}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverRoomId(null);
            const id = e.dataTransfer.getData('text/res-id');
            if (id && room.id !== dragResCurrentRoom(id)) onMoveReservation(id, room.id);
            setDragResId(null);
          }}
        >
          <div
            className="sticky left-0 z-10 flex items-center gap-1.5 border-r border-border bg-background px-2"
            style={{ width: LABEL_W, height: rowH }}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: HK_DOT[room.housekeepingStatus] ?? '#94a3b8' }}
              title={room.housekeepingStatus}
            />
            <span className="text-xs font-semibold">{room.number}</span>
            {!compact && (
              <span className="truncate text-[10px] text-muted-foreground">
                {room.roomType.name}
                {room.floor ? ` · F${room.floor}` : ''}
              </span>
            )}
          </div>
          <div className="relative" style={{ width: colCount * dayW, height: rowH }}>
            {days
              .filter((d) => !covered.has(d))
              .map((d) => (
                <div
                  key={d}
                  onContextMenu={(e) => onCellContext(e, room.id, d)}
                  onDoubleClick={() => onCellDoubleClick(room.id, d)}
                  className={cn(
                    'absolute top-0 border-l border-border/50',
                    d === today && 'bg-primary/5'
                  )}
                  style={{ left: colOf(d) * dayW, width: dayW, height: rowH }}
                />
              ))}
            {roomSegs.map((seg) => {
              const res = resById.get(seg.reservationId);
              if (!res) return null;
              const clipStart = seg.start < from ? from : seg.start;
              const clipEnd = seg.end > to ? to : seg.end;
              const c0 = colOf(clipStart);
              const c1 = colOf(clipEnd);
              if (c1 <= c0) return null;
              return (
                <div
                  key={`${seg.reservationId}-${seg.roomId}-${seg.start}`}
                  className="absolute top-0"
                  style={{ left: c0 * dayW + 2, width: (c1 - c0) * dayW - 4, height: rowH }}
                >
                  <ReservationBlock
                    reservation={res}
                    selected={selectedIds.has(res.id)}
                    compact={compact}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/res-id', res.id);
                      setDragResId(res.id);
                    }}
                    onDragEnd={() => {
                      setDragResId(null);
                      setDragOverRoomId(null);
                    }}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey) onToggleSelect(res.id);
                      else onReservationClick(res.id);
                    }}
                    onContextMenu={(e) => onReservationContext(e, res.id)}
                    onHover={showHover}
                    onLeave={hideHover}
                  />
                </div>
              );
            })}
            {roomBlocks.map((b) => {
              const clipStart = b.startDate < from ? from : b.startDate;
              const clipEnd = b.endDate > to ? to : b.endDate;
              const c0 = colOf(clipStart);
              const c1 = colOf(clipEnd);
              if (c1 <= c0) return null;
              return (
                <div
                  key={b.id}
                  onContextMenu={(e) => onBlockContext(e, b)}
                  className={cn(
                    'absolute top-0 flex items-center gap-1 overflow-hidden rounded px-1.5 text-[10px] font-medium text-white',
                    b.type === 'ooo' ? 'bg-rose-500/90' : 'bg-slate-500/90'
                  )}
                  style={{
                    left: c0 * dayW + 2,
                    width: (c1 - c0) * dayW - 4,
                    height: rowH - 4,
                    top: 2,
                  }}
                  title={b.reason ?? (b.type === 'ooo' ? 'Out of order' : 'Out of service')}
                >
                  <Lock className="h-3 w-3 shrink-0" />
                  {!compact && <span className="truncate">{b.reason ?? b.type.toUpperCase()}</span>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  function dragResCurrentRoom(resId) {
    const segs = segments.filter((s) => s.reservationId === resId);
    return segs.length ? segs[0].roomId : null;
  }

  return (
    <div className="relative flex-1 overflow-auto rounded-lg border bg-card">
      <div style={{ width: LABEL_W + colCount * dayW + 20 }}>
        <div
          className="sticky top-0 z-20 flex border-b border-border bg-background"
          style={{ width: LABEL_W + colCount * dayW }}
        >
          <div
            className="sticky left-0 z-10 flex items-center justify-between border-r border-border bg-background px-2 text-[10px] font-medium text-muted-foreground"
            style={{ width: LABEL_W, height: compact ? 46 : 54 }}
          >
            <span>Room</span>
            <span>{days.length} nights</span>
          </div>
          <div className="flex">{days.map(dayHeaderCell)}</div>
        </div>
        {rows}
      </div>
      {todayIdx >= 0 && (
        <div
          className="pointer-events-none absolute bottom-0 top-0 w-px bg-primary/60"
          style={{ left: LABEL_W + todayIdx * dayW }}
        />
      )}
      {hover && resById.get(hover.reservationId) && (
        <ReservationPopover
          reservation={resById.get(hover.reservationId)}
          currency={property.currency}
          x={hover.x}
          y={hover.y}
        />
      )}
    </div>
  );
}
