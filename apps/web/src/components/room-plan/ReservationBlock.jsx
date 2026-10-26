import { Star, Lock, Flag, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const STATUS_META = {
  confirmed: { label: 'Confirmed', color: '#6366f1', soft: '#eef2ff', text: '#3730a3' },
  checked_in: { label: 'In house', color: '#10b981', soft: '#ecfdf5', text: '#065f46' },
  checked_out: { label: 'Departed', color: '#94a3b8', soft: '#f1f5f9', text: '#475569' },
};

export default function ReservationBlock({
  reservation: r,
  selected,
  compact,
  draggable,
  onDragStart,
  onDragEnd,
  onClick,
  onContextMenu,
  onHover,
  onLeave,
}) {
  const meta = STATUS_META[r.status] ?? STATUS_META.confirmed;
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={(e) => onHover && onHover(e, r.id)}
      onMouseLeave={onLeave}
      className={cn(
        'flex h-full cursor-pointer items-center gap-1 overflow-hidden rounded-md border px-1.5 transition-shadow hover:shadow-md',
        selected && 'ring-2 ring-primary ring-offset-1'
      )}
      style={{
        background: meta.soft,
        borderColor: meta.color,
        color: meta.text,
      }}
      title={`${r.guestName} · ${r.confirmationNumber}`}
    >
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{r.guestName}</span>
      {!compact && (
        <span className="hidden shrink-0 text-[10px] opacity-70 sm:inline">
          {r.confirmationNumber}
        </span>
      )}
      {r.vipStatus && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
      {r.fixedRoom && <Lock className="h-3 w-3 shrink-0 opacity-70" />}
      {r.openTraces > 0 && (
        <span className="flex shrink-0 items-center gap-0.5 text-rose-600">
          <Flag className="h-3 w-3" />
          {r.openTraces}
        </span>
      )}
      {r.companionsCount > 0 && (
        <span className="flex shrink-0 items-center gap-0.5 opacity-70">
          <Users className="h-3 w-3" />
          {r.companionsCount}
        </span>
      )}
      {Number(r.balance) > 0 && r.status === 'checked_in' && (
        <span className="shrink-0 rounded bg-rose-100 px-1 text-[9px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {Number(r.balance).toFixed(0)}
        </span>
      )}
      {r.houseUse && (
        <span className="shrink-0 rounded bg-slate-200 px-1 text-[9px] font-semibold text-slate-600">
          HU
        </span>
      )}
    </div>
  );
}
