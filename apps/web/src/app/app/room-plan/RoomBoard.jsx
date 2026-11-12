/* apps/web/src/app/app/room-plan/RoomBoard.jsx
 * Room board v2 (roadmap addendum 5.3, Phase 3 slice #3) — space-status grid
 * on the P5 room matrix. Rules honored:
 *  - transition buttons come from the server's validTransitions ONLY (the
 *    existing /housekeeping/rooms/:id/status endpoint keeps enforcing);
 *  - assignable is server-computed (active + ready only) — blocked rooms and
 *    rooms awaiting inspection never show an assignment path;
 *  - OOO/OOS/dirty transitions require a reason (inline prompt — enforcement
 *    contract: reason is MANDATORY for dirty/OOO/OOS, 400 REASON_REQUIRED);
 *  - bulk transitions show a preview count before applying;
 *  - card drawer shows room history (status events + recent stays) so staff
 *    never module-hop for room context;
 *  - loading/error never masquerade as zero; color always paired with text.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BedDouble,
  BedSingle,
  Check,
  History,
  Loader2,
  RefreshCw,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useRoomBoard, useRoomBoardDetail } from '../../../hooks/useRoomBoard';
import { transitionRoomStatus } from '../../../api/housekeeping';
import { cn } from '../../../lib/utils';

const HK = {
  ready: { label: 'Ready', cls: 'bg-accent/10 text-accent-foreground border-accent/30' },
  clean: { label: 'Clean', cls: 'bg-info/10 text-info border-info/30' },
  inspected: { label: 'Inspected', cls: 'bg-secondary/10 text-secondary border-secondary/30' },
  dirty: { label: 'Dirty', cls: 'bg-warning/10 text-warning border-warning/30' },
  in_progress: { label: 'In progress', cls: 'bg-warning/10 text-warning border-warning/30' },
};
const SERVICE = {
  active: { label: 'In service', cls: 'bg-surface-elevated text-text-secondary' },
  ooo: { label: 'Out of order', cls: 'bg-danger/10 text-danger border-danger/30' },
  oos: { label: 'Out of service', cls: 'bg-danger/10 text-danger border-danger/30' },
};
const rel = (iso) => {
  if (!iso) return '—';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function ReasonPrompt({ transition, onConfirm, onCancel, busy }) {
  const [reason, setReason] = useState('');
  return (
    <div className="mt-1.5 rounded-md border border-warning/40 bg-surface p-2">
      <p className="text-[11px] font-medium text-text-primary">
        {transition.label} — reason required
      </p>
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. leaking AC"
        className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs"
      />
      <div className="mt-1.5 flex gap-1.5">
        <button
          disabled={busy || !reason.trim()}
          onClick={() => onConfirm(transition, reason.trim())}
          className="rounded bg-danger px-2 py-0.5 text-[11px] font-medium text-white disabled:opacity-40"
        >
          {busy ? '…' : 'Confirm'}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-border px-2 py-0.5 text-[11px] text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RoomCard({ room, selected, onSelect, onTransition, busy }) {
  const [pending, setPending] = useState(null); // transition awaiting reason
  const hk = HK[room.housekeepingStatus] ?? HK.dirty;
  const svc = SERVICE[room.serviceStatus] ?? SERVICE.active;
  const confirm = (t, reason) => {
    setPending(null);
    onTransition(room, t, reason);
  };
  return (
    <div
      className={cn(
        'relative rounded-xl border bg-surface p-3 transition-shadow',
        room.blocked ? 'border-danger/30' : 'border-border hover:shadow-md',
        selected && 'ring-2 ring-primary/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(room.id)}
            className="h-3.5 w-3.5 accent-[#1f7a78]"
            aria-label={'Select room ' + room.number}
          />
          <span className="text-base font-bold text-text-primary">{room.number}</span>
          <span className="text-[10px] text-text-muted">
            {room.roomType.code}
            {room.childCount ? ` · +${room.childCount}` : ''}
          </span>
        </div>
        {room.blocked && (
          <span className="flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
            <AlertTriangle className="h-3 w-3" /> {svc.label}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', hk.cls)}>
          {hk.label}
        </span>
        {!room.blocked && (
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', svc.cls)}>
            {svc.label}
          </span>
        )}
        {room.assignable && (
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
            Assignable
          </span>
        )}
      </div>

      {room.serviceReason && <p className="mt-1.5 text-[11px] text-danger">{room.serviceReason}</p>}
      {room.occupant ? (
        <p className="mt-1.5 truncate text-xs text-text-primary">
          <Users className="mr-1 inline h-3 w-3 text-text-muted" />
          {room.occupant.guestName}{' '}
          <span className="text-text-muted">· until {String(room.occupant.date).slice(5, 10)}</span>
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-text-muted">
          {room.nextStay
            ? `Next: ${room.nextStay.guestName} ${String(room.nextStay.date).slice(5, 10)}`
            : 'Vacant'}
        </p>
      )}
      {room.openTasks.length > 0 && (
        <p className="mt-1 text-[11px] text-warning">
          {room.openTasks.length} open task{room.openTasks.length > 1 ? 's' : ''}:{' '}
          {room.openTasks[0].title}
        </p>
      )}
      <p className="mt-1 text-[10px] text-text-muted">changed {rel(room.statusChangedAt)}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {room.validTransitions
          .filter((t) => !t.reasonRequired)
          .map((t) => (
            <button
              key={t.field + t.to}
              disabled={busy}
              onClick={() => onTransition(room, t)}
              className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary hover:bg-surface-elevated disabled:opacity-40"
            >
              {t.label}
            </button>
          ))}
        {room.validTransitions
          .filter((t) => t.reasonRequired)
          .map((t) => (
            <button
              key={t.field + t.to}
              disabled={busy}
              onClick={() => setPending(pending?.to === t.to ? null : t)}
              className={cn(
                'rounded border px-1.5 py-0.5 text-[10px] font-medium disabled:opacity-40',
                t.field === 'serviceStatus'
                  ? 'border-danger/30 text-danger hover:bg-danger/10'
                  : 'border-warning/40 text-warning hover:bg-warning/10'
              )}
            >
              {t.label}
            </button>
          ))}
        <button
          onClick={() => onSelect(room.id, true)}
          className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted hover:text-text-primary"
          title="History"
        >
          <History className="h-3 w-3" />
        </button>
      </div>
      {pending && (
        <ReasonPrompt
          transition={pending}
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}

function Drawer({ roomId, onClose }) {
  const q = useRoomBoardDetail(roomId);
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-border bg-surface p-5 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary">Room {q.data?.number ?? '…'}</h3>
        <button onClick={onClose} className="rounded p-1 text-text-muted hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      </div>
      {q.isLoading && <div className="mt-4 h-40 animate-pulse rounded-lg bg-surface-elevated" />}
      {q.isError && <p className="mt-4 text-xs text-danger">Failed to load room detail.</p>}
      {q.data && (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                (HK[q.data.housekeepingStatus] ?? HK.dirty).cls
              )}
            >
              {(HK[q.data.housekeepingStatus] ?? HK.dirty).label}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                (SERVICE[q.data.serviceStatus] ?? SERVICE.active).cls
              )}
            >
              {(SERVICE[q.data.serviceStatus] ?? SERVICE.active).label}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-medium',
                q.data.assignable
                  ? 'bg-accent/10 text-accent-foreground'
                  : 'bg-surface-elevated text-text-muted'
              )}
            >
              {q.data.assignable ? 'Assignable' : 'Not assignable'}
            </span>
          </div>
          {q.data.serviceReason && (
            <p className="mt-2 text-xs text-danger">{q.data.serviceReason}</p>
          )}

          <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Open tasks
          </h4>
          {q.data.openTasks.length === 0 ? (
            <p className="mt-1 text-xs text-text-muted">None.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {q.data.openTasks.map((t) => (
                <li key={t.id} className="text-xs text-text-secondary">
                  • {t.title}{' '}
                  <span className="text-text-muted">
                    ({t.department}, {t.priority})
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Status history
          </h4>
          {q.data.history.length === 0 ? (
            <p className="mt-1 text-xs text-text-muted">No recorded changes.</p>
          ) : (
            <ul className="mt-1 space-y-1.5">
              {q.data.history.slice(0, 15).map((e, i) => (
                <li key={i} className="text-xs">
                  <span className="text-text-muted">{rel(e.at)}</span>{' '}
                  <span className="font-medium text-text-primary">
                    {e.field === 'serviceStatus' ? 'Service' : 'HK'}: {e.from ?? '—'} → {e.to}
                  </span>
                  {e.reason && <span className="text-text-secondary"> — {e.reason}</span>}
                </li>
              ))}
            </ul>
          )}

          <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Recent stays
          </h4>
          {q.data.recentStays.length === 0 ? (
            <p className="mt-1 text-xs text-text-muted">None.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {q.data.recentStays.slice(0, 10).map((s, i) => (
                <li key={i} className="flex justify-between text-xs">
                  <span className="text-text-secondary">
                    {String(s.date).slice(0, 10)} · {s.guestName}
                  </span>
                  <span className="font-mono text-text-muted">
                    {s.confirmationNumber.slice(0, 12)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}

export default function RoomBoard() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(() => new Set());
  const [drawer, setDrawer] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(null); // {to,label,field,count}
  const q = useRoomBoard(date);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['room-board'] });

  const doTransition = async (room, t, reason) => {
    setBusyId(room.id);
    setErr(null);
    try {
      await transitionRoomStatus(room.id, {
        ...(t.field === 'housekeepingStatus'
          ? { housekeepingStatus: t.to }
          : { serviceStatus: t.to }),
        ...(reason ? { reason } : {}),
      });
      await invalidate();
    } catch (e) {
      setErr(e?.response?.data?.error?.message ?? e.message);
    } finally {
      setBusyId(null);
    }
  };

  const doBulk = async () => {
    const { to, field } = bulkPreview;
    setBusyId('bulk');
    setErr(null);
    try {
      const rooms = (q.data?.rooms ?? []).filter((r) => selected.has(r.id));
      for (const r of rooms) {
        const legal = r.validTransitions.some(
          (t) => t.field === field && t.to === to && !t.reasonRequired
        );
        if (!legal) continue; // server enforces anyway; skip non-legal in preview set
        await transitionRoomStatus(
          r.id,
          field === 'housekeepingStatus' ? { housekeepingStatus: to } : { serviceStatus: to }
        );
      }
      setSelected(new Set());
      setBulkPreview(null);
      await invalidate();
    } catch (e) {
      setErr(e?.response?.data?.error?.message ?? e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (q.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-elevated" />
        ))}
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="rounded-xl border border-danger/30 bg-surface p-6 text-center">
        <p className="text-sm font-medium">Room board failed to load</p>
        <p className="mt-1 text-xs text-text-secondary">
          {q.error?.response?.data?.error?.message ?? q.error?.message}
        </p>
        <button
          onClick={() => q.refetch()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const d = q.data;
  const filters = [
    ['all', 'All'],
    ['assignable', 'Assignable'],
    ['dirty', 'Dirty'],
    ['in_progress', 'In progress'],
    ['inspected', 'Inspected'],
    ['blocked', 'Blocked'],
  ];
  const visible = d.rooms.filter((r) =>
    filter === 'all'
      ? true
      : filter === 'assignable'
        ? r.assignable
        : filter === 'blocked'
          ? r.blocked
          : r.housekeepingStatus === filter
  );
  const bulkTargets = ['dirty', 'clean', 'inspected', 'ready']
    .map((to) => {
      const legal = (d.rooms ?? []).filter(
        (r) =>
          selected.has(r.id) &&
          r.validTransitions.some(
            (t) => t.field === 'housekeepingStatus' && t.to === to && !t.reasonRequired
          )
      );
      return {
        to,
        field: 'housekeepingStatus',
        count: legal.length,
        label: {
          dirty: 'Mark dirty',
          clean: 'Mark clean',
          inspected: 'Inspect',
          ready: 'Make ready',
        }[to],
      };
    })
    .filter((b) => b.count > 0);

  return (
    <section aria-label="Room board" className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        {[
          [d.stats.total, 'Rooms', BedDouble],
          [d.stats.assignable, 'Assignable', Check],
          [d.stats.dirty, 'Dirty', ArrowDownToLine],
          [d.stats.inProgress, 'In progress', Loader2],
          [d.stats.blocked, 'Blocked', Wrench],
          [d.cards.arrivals, 'Arrivals', ArrowUpFromLine],
        ].map(([v, label, Icon], i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-3">
            <p className="text-xl font-bold text-text-primary">{v}</p>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              <Icon className="mr-1 inline h-3 w-3" />
              {label}
            </p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <BedSingle className="h-3.5 w-3.5" /> Stayovers {d.cards.stayovers} · Departures{' '}
        {d.cards.departures}
        <span className="ml-auto flex items-center gap-2">
          Business date
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelected(new Set());
            }}
            className="rounded border border-border bg-surface px-2 py-1 text-xs"
          />
        </span>
      </div>

      {/* Filters + bulk bar */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              filter === k
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-text-secondary hover:bg-surface-elevated'
            )}
          >
            {label}
          </button>
        ))}
        {selected.size > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5">
            <span className="text-xs font-medium text-text-primary">{selected.size} selected</span>
            {bulkTargets.map((b) => (
              <button
                key={b.to}
                onClick={() => setBulkPreview(b)}
                className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                {b.label} ({b.count})
              </button>
            ))}
            <button
              onClick={() => setSelected(new Set())}
              className="text-[11px] text-text-muted hover:text-text-primary"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {err && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {err}
        </p>
      )}
      {bulkPreview && (
        <div
          className="flex items-center gap-3 rounded-lg border border-warning/40 bg-surface px-4 py-2.5"
          role="alert"
        >
          <p className="text-xs text-text-primary">
            Bulk {bulkPreview.label.toLowerCase()}: <strong>{bulkPreview.count}</strong> of{' '}
            {selected.size} selected rooms can transition. Others will be skipped.
          </p>
          <button
            disabled={busyId === 'bulk'}
            onClick={doBulk}
            className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40"
          >
            {busyId === 'bulk' ? '…' : 'Apply'}
          </button>
          <button onClick={() => setBulkPreview(null)} className="text-xs text-text-muted">
            Cancel
          </button>
        </div>
      )}

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-xs text-text-muted">
          No rooms match this filter for {d.property.name}.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              busy={busyId === room.id || busyId === 'bulk'}
              selected={selected.has(room.id)}
              onSelect={(id, drawerOpen) =>
                drawerOpen
                  ? setDrawer(id)
                  : setSelected((prev) => {
                      const n = new Set(prev);
                      n.has(id) ? n.delete(id) : n.add(id);
                      return n;
                    })
              }
              onTransition={doTransition}
            />
          ))}
        </div>
      )}
      {drawer && <Drawer roomId={drawer} onClose={() => setDrawer(null)} />}
    </section>
  );
}
