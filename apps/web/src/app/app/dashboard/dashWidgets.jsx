/* apps/web/src/app/app/dashboard/dashWidgets.jsx
 * D2 — operational widgets: today strip, tasks mini-board,
 * un-settled departures, VIP arrivals. Design tokens match components.jsx.
 */
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarCheck,
  CalendarX,
  ClipboardList,
  Crown,
  Sparkles,
} from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import { LINKS, reservationUrl } from './dashLinks';
import { VipBadge } from '../crm/components';

// ─── Today strip ─────────────────────────────────────────────────────────────

function StripItem({ icon: Icon, label, done, total, to, tone, badge }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <Link
      to={to}
      className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-elevated"
    >
      <Icon className="h-4 w-4 shrink-0 text-secondary" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-text-muted">
            {label}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            {done}/{total}
            {badge}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
          <div className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}

export function TodayStrip({ ops, loading }) {
  if (loading || !ops) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-surface">
        <div className="h-[62px]" />
      </div>
    );
  }
  const openTasks = ops.tasks.open + ops.tasks.inProgress;
  return (
    <div className="flex divide-x divide-border rounded-xl border border-border bg-surface">
      <StripItem
        icon={CalendarCheck}
        label="Check-ins"
        done={ops.arrivals.done}
        total={ops.arrivals.total}
        to={LINKS.arrivalsBoard}
        tone="bg-accent"
      />
      <StripItem
        icon={CalendarX}
        label="Check-outs"
        done={ops.departures.done}
        total={ops.departures.total}
        to={LINKS.arrivalsBoard}
        tone="bg-info"
      />
      <StripItem
        icon={BedDouble}
        label="Rooms turned"
        done={ops.rooms.turnedToday}
        total={ops.rooms.turnaroundTarget}
        to={LINKS.housekeeping}
        tone="bg-secondary"
      />
      <StripItem
        icon={ClipboardList}
        label="Open tasks"
        done={openTasks - ops.tasks.slaBreached}
        total={openTasks}
        to={LINKS.tasksOpen}
        tone="bg-warning"
        badge={
          ops.tasks.slaBreached > 0 ? (
            <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
              {ops.tasks.slaBreached} SLA
            </span>
          ) : null
        }
      />
    </div>
  );
}

// ─── Tasks mini-board ────────────────────────────────────────────────────────

const deptLabel = (d) => d.replace(/[_-]/g, ' ');

export function TasksMiniBoard({ tasks, loading }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Tasks Today</h3>
        </div>
        <Link
          to={LINKS.tasks}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          Open board <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      ) : !tasks || tasks.open + tasks.inProgress === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">No open tasks — board is clear</p>
      ) : (
        <>
          <div className="space-y-1.5">
            {tasks.byDepartment.map((d) => (
              <Link
                key={d.department}
                to={LINKS.tasksOpen}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-secondary/40"
              >
                <span className="flex items-center gap-2 text-sm capitalize text-text-primary">
                  {d.slaBreached > 0 && (
                    <AlertTriangle className="h-3.5 w-3.5 text-danger" aria-label="SLA breached" />
                  )}
                  {deptLabel(d.department)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                  {d.slaBreached > 0 && (
                    <span className="font-semibold text-danger">{d.slaBreached} overdue</span>
                  )}
                  <span className="rounded-full bg-surface-elevated px-2 py-0.5 font-semibold">
                    {d.count}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          {tasks.top.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Needs attention
              </p>
              {tasks.top.map((t) => (
                <Link
                  key={t.id}
                  to={LINKS.tasks}
                  className="block truncate rounded px-1 py-1 text-xs text-text-secondary hover:bg-background hover:text-text-primary"
                >
                  <span
                    className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full', 'bg-danger')}
                  />
                  {t.title}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Un-settled departures ───────────────────────────────────────────────────

export function UnsettledDepartures({ data, currency, loading }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarX className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-text-primary">Un-settled Departures</h3>
          {!loading && data && data.count > 0 && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
              {data.count}
            </span>
          )}
        </div>
        <Link
          to={LINKS.billing}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          Billing <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      ) : !data || data.count === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">
          Every departure settled — folios are clean
        </p>
      ) : (
        <>
          <p className="mb-2 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
            {formatCurrency(data.totalBalance, currency)} outstanding across {data.count}{' '}
            {data.count === 1 ? 'departure' : 'departures'}
          </p>
          <div className="space-y-1.5">
            {data.items.map((r) => (
              <Link
                key={r.id}
                to={reservationUrl(r.id)}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-warning/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{r.guestName}</p>
                  <p className="text-xs text-text-secondary">
                    {r.confirmationNumber}
                    {r.roomNumber ? ` · Room ${r.roomNumber}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-warning">
                  {formatCurrency(r.balance, currency)}
                </span>
              </Link>
            ))}
          </div>
          {data.count > data.items.length && (
            <p className="mt-2 text-center text-[11px] text-text-muted">
              +{data.count - data.items.length} more in billing
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── VIP arrivals ────────────────────────────────────────────────────────────

export function VipArrivals({ items, loading }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-text-primary">VIP Arrivals Today</h3>
          {!loading && items && items.length > 0 && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
              {items.length}
            </span>
          )}
        </div>
        <Link
          to={LINKS.reservations}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">No VIP arrivals today</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((r) => (
            <Link
              key={r.id}
              to={reservationUrl(r.id)}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-accent/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {r.guestName}
                  </span>
                  <VipBadge tier={r.vipStatus} />
                  {r.notes && (
                    <Sparkles
                      className="h-3.5 w-3.5 shrink-0 text-warning"
                      aria-label="Has special requests"
                    />
                  )}
                </div>
                <p className="text-xs text-text-secondary">
                  {r.confirmationNumber}
                  {r.roomType ? ` · ${r.roomType}` : ''}
                  {r.status === 'checked_in' ? ' · in house' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Attention strip (Layer B — dashboard.today_v2) ─────────────────────────

const EXCEPTION_LINKS = {
  night_audit_open: () => LINKS.nightAudit,
  arrivals_without_room: () => LINKS.arrivalsBoard,
  sla_breached_tasks: () => LINKS.tasksOpen,
  balance_due_departures: (e) => (e.entityId ? reservationUrl(e.entityId) : LINKS.billing),
  channel_sync_failure: () => LINKS.channelManager,
};

const severityStyles = {
  critical: {
    wrap: 'border-danger/50 bg-danger/10',
    icon: 'text-danger',
    chip: 'bg-danger text-white',
  },
  warning: {
    wrap: 'border-warning/40 bg-warning/10',
    icon: 'text-warning',
    chip: 'bg-warning text-background',
  },
  info: {
    wrap: 'border-border bg-surface',
    icon: 'text-secondary',
    chip: 'bg-surface-elevated text-text-primary',
  },
};

export function AttentionStrip({ exceptions, loading }) {
  if (loading) {
    return <div className="animate-pulse rounded-xl border border-border bg-surface h-[54px]" />;
  }
  const items = exceptions ?? [];
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-5 py-3">
        <span className="h-2 w-2 rounded-full bg-success" />
        <span className="text-xs font-medium text-text-secondary">
          No critical items — operations are on track for today
        </span>
      </div>
    );
  }
  return (
    <div className="space-y-1.5" role="alert" aria-label="Items needing attention">
      {items.map((e) => {
        const st = severityStyles[e.severity] ?? severityStyles.info;
        const link = (EXCEPTION_LINKS[e.type] ?? (() => null))(e);
        const body = (
          <>
            <AlertTriangle className={`h-4 w-4 shrink-0 ${st.icon}`} />
            <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
              <span className="font-semibold">{e.title}</span>
              <span className="text-text-secondary"> — {e.detail}</span>
            </span>
            {e.count > 1 && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${st.chip}`}
              >
                {e.count}
              </span>
            )}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          </>
        );
        return link ? (
          <Link
            key={e.id}
            to={link}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors hover:bg-surface-elevated ${st.wrap}`}
          >
            {body}
          </Link>
        ) : (
          <div
            key={e.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${st.wrap}`}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}

// ─── Priority worklist (Layer B — dashboard.today_v2) ───────────────────────
// One merged, urgency-ordered worklist: balance-due departures first,
// then urgent tasks, then remaining departures, then arrivals.

const kindMeta = {
  Departure: { icon: CalendarX, chip: 'bg-info/15 text-info' },
  Arrival: { icon: CalendarCheck, chip: 'bg-accent/10 text-accent' },
  Task: { icon: AlertTriangle, chip: 'bg-warning/15 text-warning' },
};

export function PriorityWorklist({ arrivals, departures, tasksTop, currency, loading, viewAllTo }) {
  const items = [
    ...departures.map((i) => ({ ...i, kind: 'Departure', rank: i.balance > 0 ? 0 : 2 })),
    ...tasksTop.map((t) => ({
      id: t.id,
      kind: 'Task',
      title: t.title,
      department: t.department,
      rank: t.priority === 'urgent' ? 1 : 2,
      isTask: true,
    })),
    ...arrivals.map((i) => ({ ...i, kind: 'Arrival', rank: 3 })),
  ].sort((a, b) => a.rank - b.rank || a.kind.localeCompare(b.kind));

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Priority Worklist</h3>
          {!loading && (
            <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
              {items.length}
            </span>
          )}
        </div>
        <Link
          to={viewAllTo}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
        >
          Front desk <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-elevated" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          Nothing needs attention — no movements or flagged tasks right now
        </p>
      ) : (
        <div className="max-h-96 space-y-2 overflow-auto pr-1">
          {items.map((item) => {
            const meta = kindMeta[item.kind];
            const Icon = meta.icon;
            const to = item.isTask ? LINKS.tasksOpen : reservationUrl(item.id);
            return (
              <Link
                key={item.id}
                to={to}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 transition-colors hover:border-secondary/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-secondary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.isTask ? item.title : item.guestName}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {item.isTask
                        ? item.department
                        : `${item.confirmationNumber}${item.roomNumber ? ` · Room ${item.roomNumber}` : ' · No room assigned'}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!item.isTask && item.balance > 0 && (
                    <span className="text-xs font-semibold text-warning">
                      {formatCurrency(item.balance, currency)} due
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}
                  >
                    {item.kind}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
