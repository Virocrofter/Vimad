/* apps/web/src/app/app/dashboard/CommandPalette.jsx
 * D3 — Ctrl/Cmd+K command palette: jump to a guest, a reservation, or an
 * action. Search reuses GET /v1/guests?search= and /v1/reservations?search=
 * — no new backend. Flat item list, arrow-key navigation, Enter to go.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  LogIn,
  MessagesSquare,
  MoonStar,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { cn } from '../../lib/utils';
import { guestUrl, LINKS, reservationUrl } from '../../lib/dashLinks';
import { usePermissionChecker } from '../../hooks/usePermissions';

const ACTIONS = [
  {
    label: 'New Reservation',
    perm: 'reservation:create',
    hint: 'action',
    icon: CalendarCheck,
    to: LINKS.newReservation,
    keywords: 'new booking create',
  },
  ,
  {
    label: 'Add Guest',
    perm: 'guest:create',
    hint: 'action',
    icon: Users,
    to: '/app/guests',
    keywords: 'new guest create profile',
  },
  ,
  {
    label: 'Create Task',
    perm: 'task:create',
    hint: 'action',
    icon: ClipboardList,
    to: LINKS.tasks,
    keywords: 'new task assign department',
  },
  ,
  {
    label: 'Message Guest',
    perm: 'sms:send',
    hint: 'action',
    icon: MessagesSquare,
    to: '/app/comms',
    keywords: 'message chat sms email guest',
  },
  ,
  {
    label: 'Walk-In Check-in',
    perm: 'reservation:checkin',
    hint: 'action',
    icon: LogIn,
    to: LINKS.arrivalsBoard,
    keywords: 'walkin checkin front desk arrivals',
  },
  ,
  {
    label: 'Post Charge / Take Payment',
    perm: 'folio:payment',
    hint: 'action',
    icon: DollarSign,
    to: LINKS.billing,
    keywords: 'folio charge payment billing',
  },
  ,
  {
    label: 'Tasks Board',
    perm: 'task:read',
    hint: 'action',
    icon: ClipboardList,
    to: LINKS.tasks,
    keywords: 'tasks spine departments',
  },
  ,
  {
    label: 'Night Audit',
    perm: 'night_audit:run',
    hint: 'action',
    icon: MoonStar,
    to: LINKS.nightAudit,
    keywords: 'roll date close day audit',
  },
  ,
  {
    label: 'Reports',
    perm: 'report:read',
    hint: 'action',
    icon: TrendingUp,
    to: LINKS.reports,
    keywords: 'reports revenue occupancy',
  },
  ,
  {
    label: 'Room Plan / Tape Chart',
    perm: 'reservation:read',
    hint: 'action',
    icon: BedDouble,
    to: LINKS.roomPlan,
    keywords: 'rooms tape chart availability grid',
  },
];

export default function CommandPalette({ open, onOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [guestHits, setGuestHits] = useState([]);
  const [resHits, setResHits] = useState([]);
  const [roomHits, setRoomHits] = useState([]);
  const [taskHits, setTaskHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  // Global hotkey — works whether the palette is open or not
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else {
          setQuery('');
          setGuestHits([]);
          setResHits([]);
          setIndex(0);
          onOpen();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpen, onClose]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Debounced live search (guests + reservations in parallel)
  useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setGuestHits([]);
      setResHits([]);
      setRoomHits([]);
      setTaskHits([]);
      return undefined;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const [g, r, rm, t] = await Promise.all([
          apiClient.get('/guests', { params: { search: q, pageSize: 5 } }),
          apiClient.get('/reservations', { params: { search: q, pageSize: 5 } }),
          apiClient.get('/rooms', { params: { search: q, pageSize: 5 } }),
          apiClient.get('/tasks', { params: { q, pageSize: 5 } }),
        ]);
        setGuestHits(g.data?.data ?? []);
        setResHits(r.data?.data ?? []);
        setRoomHits(rm.data?.data ?? []);
        setTaskHits(t.data?.data ?? []);
      } catch {
        setGuestHits([]);
        setResHits([]);
        setRoomHits([]);
        setTaskHits([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, open]);

  const can = usePermissionChecker();
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = ACTIONS.filter((a) => !a.perm || can(a.perm));
    const actions = q
      ? visible.filter((a) => `${a.label} ${a.keywords}`.toLowerCase().includes(q))
      : visible;
    return [
      ...actions.map((a) => ({ ...a, key: `action-${a.label}` })),
      ...guestHits.map((g) => ({
        key: `guest-${g.id}`,
        label: `${g.firstName ?? ''} ${g.lastName ?? ''}`.trim() || 'Guest',
        hint: g.email ?? 'guest',
        icon: Users,
        to: guestUrl(g.id),
      })),
      ...resHits.map((r) => ({
        key: `res-${r.id}`,
        label: r.guestName ?? r.confirmationNumber ?? 'Reservation',
        hint: `${r.confirmationNumber ?? ''}${r.status ? ` · ${r.status.replace('_', ' ')}` : ''}`,
        icon: CalendarCheck,
        to: reservationUrl(r.id),
      })),
      ...roomHits.map((rm) => ({
        key: `room-${rm.id}`,
        label: `Room ${rm.number}`,
        hint: [rm.floor ? `floor ${rm.floor}` : null, rm.status].filter(Boolean).join(' · '),
        icon: BedDouble,
        to: `/app/rooms?room=${encodeURIComponent(rm.number)}`,
      })),
      ...taskHits.map((t) => ({
        key: `task-${t.id}`,
        label: t.title,
        hint: `task · ${String(t.status).replace('_', ' ')}`,
        icon: ClipboardList,
        to: '/app/tasks',
      })),
    ];
  }, [query, guestHits, resHits, roomHits, taskHits]);

  useEffect(() => setIndex(0), [items.length, query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  if (!open) return null;

  const go = (item) => {
    if (!item?.to) return;
    onClose();
    navigate(item.to);
  };

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(items[index]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search guests, reservations, rooms, tasks, or type an action…"
            className="w-full bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-auto p-2" role="listbox">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-text-muted">
              {searching ? 'Searching…' : 'No matches — try a name, conf #, or action'}
            </p>
          ) : (
            items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  data-active={i === index}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => go(item)}
                  role="option"
                  aria-selected={i === index}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left',
                    i === index ? 'bg-secondary/10' : 'hover:bg-surface-elevated'
                  )}
                >
                  <span className="rounded-md bg-surface-elevated p-1.5">
                    <Icon className="h-3.5 w-3.5 text-text-secondary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-text-primary">{item.label}</span>
                    {item.hint && (
                      <span className="block truncate text-[11px] text-text-muted">
                        {item.hint}
                      </span>
                    )}
                  </span>
                  {i === index && (
                    <kbd className="shrink-0 rounded border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
                      ↵
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
