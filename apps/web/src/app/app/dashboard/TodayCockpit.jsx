/* apps/web/src/app/app/dashboard/TodayCockpit.jsx
 * Today dashboard v2 (roadmap addendum F) — operational cockpit on the
 * frozen P6 contract. Hierarchy: critical attention → today at a glance →
 * front-desk worklist (lifecycle-derived validActions) → revenue snapshot →
 * activity. Addendum rules honored:
 *  - loading/error never masquerade as zero (skeletons + explicit retry);
 *  - color always paired with a text label; red only for genuine failures;
 *  - glass on exactly two focal surfaces (critical strip, revenue insight);
 *  - due-out is a view over checked_in stays — never equated with check-out;
 *  - dayUse renders as an explicit reserved tile (UX-02 vocabulary).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BedDouble,
  CalendarCheck,
  CalendarX,
  ClipboardList,
  DollarSign,
  LogIn,
  LogOut,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTodayDashboard } from '../../../hooks/useTodayDashboard';
import { checkInReservation, checkOutReservation } from '../../../api/api-reservations';
import { LINKS } from '../../../lib/dashLinks';
import { cn } from '../../../lib/utils';

const TYPE_LABELS = {
  channel_sync_failure: 'Channel sync failure',
  payment_failure: 'Payment failure',
  due_out_unsettled: 'Unsettled due-outs',
  overdue_task: 'Overdue tasks',
  room_readiness: 'Room readiness',
};

const money = (value, currency) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency ?? 'ZAR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const relTime = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

function Skeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-surface p-5">
          <div className="h-3 w-24 rounded bg-surface-elevated" />
          <div className="mt-3 h-6 w-32 rounded bg-surface-elevated" />
          <div className="mt-3 h-3 w-40 rounded bg-surface-elevated" />
        </div>
      ))}
    </div>
  );
}

function CriticalStrip({ critical }) {
  const active = (critical ?? []).filter((c) => c.count > 0);
  if (active.length === 0) {
    return (
      <div className="glass flex items-center gap-2.5 rounded-xl px-5 py-3.5">
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span className="text-xs font-medium text-text-secondary">
          No critical items — operations are on track for today
        </span>
      </div>
    );
  }
  return (
    <div className="glass rounded-xl px-5 py-4" role="alert" aria-label="Critical attention">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-danger" />
        <h3 className="text-sm font-semibold text-text-primary">Needs attention</h3>
        <span className="text-xs text-text-muted">— recommended next safe action per item</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {active.map((c) => {
          const isRed = c.severity === 'critical';
          return (
            <div
              key={c.type}
              className={cn(
                'rounded-lg border bg-surface/80 p-3',
                isRed ? 'border-danger/30' : 'border-warning/40'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-text-primary">
                  {TYPE_LABELS[c.type] ?? c.type}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-bold',
                    isRed ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                  )}
                >
                  {c.count}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {c.items.slice(0, 3).map((it) => (
                  <li key={it.id}>
                    <Link
                      to={it.link}
                      className="truncate block text-xs text-text-secondary underline-offset-2 hover:underline"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-text-muted">{c.recommendedAction}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GlanceTile({ icon: Icon, label, value, hint, to }) {
  const body = (
    <div className="rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-1 truncate text-2xl font-bold text-text-primary">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-text-secondary">{hint}</p>}
        </div>
        <div className="rounded-lg bg-surface-elevated p-2">
          <Icon className="h-4 w-4 text-secondary" />
        </div>
      </div>
    </div>
  );
  return to ? (
    <Link
      to={to}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

function WorklistColumn({ title, icon: Icon, items, busyId, actionError, onAction }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-secondary" />
          <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
        </div>
        <span className="text-xs text-text-muted">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-text-muted">
          Nothing here for the business date.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={r.link}
                    className="truncate text-sm font-medium text-text-primary underline-offset-2 hover:underline"
                  >
                    {r.guestName}
                  </Link>
                  <span className="truncate text-[11px] text-text-muted">
                    {r.confirmationNumber}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                  {r.eta && <span>ETA {r.eta}</span>}
                  {typeof r.balance === 'number' && r.balance > 0 && (
                    <span className="rounded-full bg-warning/10 px-1.5 py-0.5 font-medium text-warning">
                      balance {r.balance}
                    </span>
                  )}
                  {(r.flags ?? []).map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-surface-elevated px-1.5 py-0.5 text-text-muted"
                    >
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                {actionError?.id === r.id && (
                  <p className="mt-1 text-[11px] text-danger">{actionError.message}</p>
                )}
              </div>
              {(r.validActions ?? []).map((a) => (
                <button
                  key={a}
                  disabled={busyId === r.id}
                  onClick={() => onAction(r, a)}
                  className={cn(
                    'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                    a === 'check-in' && 'bg-primary text-primary-foreground hover:opacity-90',
                    a === 'check-out' && 'bg-secondary text-secondary-foreground hover:opacity-90'
                  )}
                >
                  {busyId === r.id ? '…' : a}
                </button>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TodayCockpit({ propertyId, onMutated }) {
  const today = useTodayDashboard(propertyId);
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const runAction = async (item, action) => {
    setBusyId(item.id);
    setActionError(null);
    try {
      if (action === 'check-in') await checkInReservation(item.id);
      else if (action === 'check-out') await checkOutReservation(item.id);
      await queryClient.invalidateQueries({ queryKey: ['dashboard', 'today'] });
      onMutated?.();
    } catch (e) {
      setActionError({
        id: item.id,
        message: e?.response?.data?.error?.message ?? e.message ?? 'Action failed',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (today.isLoading) return <Skeleton />;
  if (today.isError) {
    return (
      <div className="rounded-xl border border-danger/30 bg-surface p-6 text-center">
        <p className="text-sm font-medium text-text-primary">Today&apos;s cockpit failed to load</p>
        <p className="mt-1 text-xs text-text-secondary">
          {today.error?.response?.data?.error?.message ?? today.error?.message ?? 'Unknown error'}
        </p>
        <button
          onClick={() => today.refetch()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-elevated"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const d = today.data;
  const currency = d.property.currency;
  const revenueFresh = new Date(d.revenue.computedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section aria-label="Today cockpit" className="space-y-4">
      <CriticalStrip critical={d.critical} />

      {/* Today at a glance — every tile drills to its worklist */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <GlanceTile
          icon={CalendarCheck}
          label="Arrivals"
          value={d.today.arrivals}
          hint="expected today"
          to={LINKS.arrivalsBoard}
        />
        <GlanceTile
          icon={CalendarX}
          label="Due out"
          value={d.today.dueOut}
          hint="departing today"
          to={LINKS.reservations}
        />
        <GlanceTile
          icon={BedDouble}
          label="In house"
          value={d.today.inHouse}
          hint={`${d.today.checkedOutToday} checked out`}
          to={LINKS.roomPlan}
        />
        <GlanceTile icon={Users} label="Day use" value={d.today.dayUse} hint="reserved (UX-02)" />
        <GlanceTile
          icon={ClipboardList}
          label="Rooms ready"
          value={`${d.today.roomsReady}/${d.today.roomsTotal}`}
          hint="sellable tonight"
          to={LINKS.housekeeping}
        />
        <GlanceTile
          icon={LogIn}
          label="Open tasks"
          value={d.today.openTasks}
          hint={`${d.today.overdueTasks} overdue`}
          to={LINKS.tasksOpen}
        />
        <GlanceTile
          icon={TrendingUp}
          label="Occupancy"
          value={`${d.revenue.occupancyPct}%`}
          hint={`${d.revenue.occupiedTonight}/${d.revenue.roomsTotal} rooms`}
        />
        <GlanceTile
          icon={DollarSign}
          label="Room revenue"
          value={money(d.revenue.roomRevenueToday, currency)}
          hint={`ADR ${money(d.revenue.adr, currency)}`}
          to={LINKS.reports}
        />
      </div>

      {/* Front-desk worklist — validActions come from the lifecycle matrix */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WorklistColumn
          title="Arrivals"
          icon={LogIn}
          items={d.frontDesk.arrivals}
          busyId={busyId}
          actionError={actionError}
          onAction={runAction}
        />
        <WorklistColumn
          title="Due out"
          icon={LogOut}
          items={d.frontDesk.dueOut}
          busyId={busyId}
          actionError={actionError}
          onAction={runAction}
        />
      </div>

      {/* Revenue insight — glass focal surface with definitions + freshness */}
      <div className="glass rounded-xl px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Revenue snapshot</h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Room revenue {money(d.revenue.roomRevenueToday, currency)} · ADR{' '}
              {money(d.revenue.adr, currency)} · RevPAR {money(d.revenue.revpar, currency)} ·
              occupancy {d.revenue.occupancyPct}%
            </p>
          </div>
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[11px] text-text-muted">
            updated {revenueFresh}
          </span>
        </div>
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-text-muted hover:text-text-secondary">
            Metric definitions & inclusion rules
          </summary>
          <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
            {d.revenue.definitions}
          </p>
        </details>
      </div>

      {/* Activity timeline */}
      <div className="rounded-xl border border-border bg-surface px-5 py-4">
        <h3 className="text-sm font-semibold text-text-primary">Latest activity</h3>
        <ul className="mt-2 space-y-1.5">
          {d.activity.slice(0, 8).map((a, i) => (
            <li key={`${a.at}-${i}`} className="flex items-baseline gap-2 text-xs">
              <span className="shrink-0 text-text-muted">{relTime(a.at)}</span>
              <span className="shrink-0 font-medium text-text-primary">{a.action}</span>
              <span className="truncate text-text-secondary">
                {a.entity}
                {a.entityId ? ` · ${a.entityId.slice(0, 8)}…` : ''}
              </span>
            </li>
          ))}
          {d.activity.length === 0 && (
            <li className="text-xs text-text-muted">No activity recorded yet today.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
