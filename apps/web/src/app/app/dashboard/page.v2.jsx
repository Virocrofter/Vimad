/* Today v2 (plan v3.0 section 7) - first real consumer of the HQ-0 patterns.
 * Rendered only when the live flag dash.v2 is ready and on (page.jsx gate);
 * every other state falls back to v1. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useDashboardTodayV2 } from '../../../hooks/useDashboardTodayV2';
import { usePropertyStore } from '../../../stores/propertyStore';
import { PageShell } from '../../../components/patterns/PageShell';
import { StatDial } from '../../../components/patterns/StatDial';
import { StatusDot } from '../../../components/patterns/StatusDot';
import { Money } from '../../../components/patterns/Money';
import { TimeAgo } from '../../../components/patterns/TimeAgo';
import { StatusChip } from '../../../components/ui/status-chip';
import { Worklist } from '../../../components/patterns/Worklist';
import { FilterBar } from '../../../components/patterns/FilterBar';
import { useSocket } from '../../../hooks/useSocket';
import { getAccessToken } from '../../../stores/authStores';
import { api } from '../../../api/client';
import AreaChart from '../../../components/charts/AreaChart';

function Section({ id, title, count, children, action }) {
  return (
    <section aria-labelledby={id} className="hq-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <h2 id={id} className="hq-text-section text-text-primary">
          {title}
          {typeof count === 'number' && (
            <span className="hq-tnum ml-2 text-text-muted">{count}</span>
          )}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2" aria-hidden="true">
      <div className="h-4 w-2/3 rounded bg-surface-elevated" />
      <div className="h-4 w-1/2 rounded bg-surface-elevated" />
      <div className="h-4 w-3/4 rounded bg-surface-elevated" />
    </div>
  );
}

function SectionError({ message, onRetry }) {
  return (
    <div className="hq-text-body text-danger" role="alert">
      {message ?? 'This section failed to load.'}{' '}
      <button className="underline" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function readinessTone(r) {
  if (r === 'ready' || r === 'inspected') return 'ready';
  if (r === 'dirty') return 'dirty';
  if (r === 'in_progress') return 'in_progress';
  return 'clean';
}
export default function TodayV2Screen() {
  const currentPropertyId = usePropertyStore((s) => s.currentPropertyId);
  const propertyId = currentPropertyId ?? undefined;
  const qc = useQueryClient();
  const q = useDashboardTodayV2(propertyId);
  const { isConnected, on } = useSocket(getAccessToken());

  // Socket invalidation (plan 7.3): ops:mutation events trigger debounced,
  // targeted invalidation - never a blind page reload.
  useEffect(() => {
    let t = null;
    const handler = () => {
      clearTimeout(t);
      t = setTimeout(
        () => qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('today') }),
        400
      );
    };
    on('ops:mutation', handler);
    return () => clearTimeout(t);
  }, [on, qc]);

  // Per-record mutation state (plan 7.3): busy blocks double-submit;
  // failure stays on the row; success invalidates today queries.
  const [busy, setBusy] = useState({});
  const [rowError, setRowError] = useState({});
  const runAction = async (id, fn) => {
    if (busy[id]) return;
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      await fn();
      qc.invalidateQueries({ predicate: (q) => q.queryKey.includes('today') });
    } catch (e) {
      setRowError((prev) => ({
        ...prev,
        [id]: e?.response?.data?.message || e?.message || 'Action failed',
      }));
    } finally {
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };
  const actOn = (path, id) => () => api.post(path.replace(':id', id));

  const d = q.data;
  const ctx = d?.context;
  const ent = d?.entitlements;
  const s = d?.sections ?? {};

  if (!propertyId) {
    return (
      <PageShell title="Today" context="Select a property to see the day.">
        <p className="hq-text-body text-text-secondary">
          No property selected — use the property switcher in the top bar.
        </p>
      </PageShell>
    );
  }
  if (q.isError) {
    return (
      <PageShell title="Today" context={ctx?.businessDate}>
        <SectionError message="Today failed to load." onRetry={() => q.refetch()} />
      </PageShell>
    );
  }

  const att = s.attention;
  const arr = s.arrivals;
  const dep = s.departures;
  const rd = s.readiness;
  const shift = s.myShift;
  const perf = s.performance;
  const act = s.activity;

  const pressure = []
    .concat(arr?.summary?.total ? [arr.summary.total + ' arrivals'] : [])
    .concat(
      rd?.summary?.arrivalsAwaitingReady
        ? [rd.summary.arrivalsAwaitingReady + ' awaiting rooms']
        : []
    )
    .concat(att?.summary?.critical ? [att.summary.critical + ' critical'] : [])
    .join(' · ');

  return (
    <PageShell
      breadcrumb={[{ label: 'Home', href: '/app/dashboard' }, { label: 'Today' }]}
      title={ctx ? `Today · ${ctx.property.name}` : 'Today'}
      context={
        ctx ? `Business date ${ctx.businessDate}${pressure ? ' — ' + pressure : ''}` : undefined
      }
      secondaryActions={
        <span className="flex items-center gap-2">
          <StatusDot
            status={isConnected ? 'live' : 'offline'}
            text={isConnected ? 'Live' : 'Offline'}
          />
          <button
            onClick={() => q.refetch()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 hq-text-caption font-medium text-text-secondary hover:bg-surface-elevated"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </span>
      }
    >
      <div className="space-y-6">
        {/* 3. Shift Report strip - operational dials first, financial later */}
        {(arr || dep || rd || att) && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {arr && (
              <StatDial
                label="Arrivals"
                value={arr.status === 'ready' ? arr.summary.total : '—'}
                href="/app/reservations/front-desk?view=arrivals"
              />
            )}
            {dep && (
              <StatDial
                label="Due out"
                value={dep.status === 'ready' ? dep.summary.dueOut : '—'}
                comparison={
                  dep.status === 'ready'
                    ? { label: dep.summary.checkedOutToday + ' done', direction: 'flat' }
                    : undefined
                }
                href="/app/reservations/front-desk?view=departures"
              />
            )}
            {rd && (
              <StatDial
                label="Rooms ready"
                value={rd.status === 'ready' ? rd.summary.ready : '—'}
                comparison={
                  rd.status === 'ready'
                    ? {
                        label: rd.summary.dirty + ' dirty',
                        direction: rd.summary.dirty > 0 ? 'up' : 'flat',
                        tone: 'neutral',
                      }
                    : undefined
                }
                href="/app/rooms?status=dirty"
              />
            )}
            {att && (
              <StatDial
                label="Needs attention"
                value={att.status === 'ready' ? att.summary.total : '—'}
                comparison={
                  att.status === 'ready' && att.summary.critical > 0
                    ? { label: att.summary.critical + ' critical', direction: 'up', tone: 'bad' }
                    : undefined
                }
                href="/app/exceptions"
              />
            )}
            {shift && (
              <StatDial
                label="My Shift"
                value={shift.status === 'ready' ? shift.summary.open : '—'}
                href="/app/tasks?assignee=me"
              />
            )}
          </div>
        )}

        {/* 2. Needs Attention before general metrics */}
        {ent?.sections.includes('attention') && (
          <Section
            id="sec-attention"
            title="Needs Attention"
            count={att?.summary?.total}
            action={
              <Link to="/app/exceptions" className="hq-text-caption text-secondary hover:underline">
                View all
              </Link>
            }
          >
            {q.isLoading ? (
              <Skeleton />
            ) : att?.status === 'error' ? (
              <SectionError message={att.error} onRetry={() => q.refetch()} />
            ) : !att?.items?.length ? (
              <p className="hq-text-body text-text-secondary">Everything under control.</p>
            ) : (
              <ul className="divide-y divide-border">
                {att.items.map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="hq-text-body truncate font-medium text-text-primary">
                        {x.title}
                      </p>
                      <p className="hq-text-caption text-text-muted">
                        {x.severity}
                        {x.overdue ? ' · overdue' : ''} ·{' '}
                        <TimeAgo date={new Date(Date.now() - x.ageMinutes * 60000)} />
                      </p>
                    </div>
                    <Link
                      to={x.recommendedAction}
                      className="shrink-0 rounded-md border border-border px-2 py-1 hq-text-caption text-text-secondary hover:bg-surface-elevated"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}

        {/* 4. Arrivals + Departures paired sheets */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section
            id="sec-arrivals"
            title="Arrivals"
            count={arr?.summary?.total}
            action={
              <Link
                to="/app/reservations/front-desk"
                className="hq-text-caption text-secondary hover:underline"
              >
                View all
              </Link>
            }
          >
            {q.isLoading ? (
              <Skeleton />
            ) : arr?.status === 'error' ? (
              <SectionError message={arr.error} onRetry={() => q.refetch()} />
            ) : !arr?.items?.length ? (
              <p className="hq-text-body text-text-secondary">No remaining arrivals.</p>
            ) : (
              <Worklist
                toolbar={
                  <FilterBar>
                    <span className="hq-text-caption text-text-muted">
                      {arr.summary.total} expected today
                    </span>
                  </FilterBar>
                }
              >
                {arr.items.map((r) => (
                  <div key={r.ref.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="hq-text-body truncate font-medium text-text-primary">
                        {r.guest}
                        {r.vip ? (
                          <span className="ml-1.5 hq-text-caption text-warning">VIP</span>
                        ) : null}
                      </p>
                      <p className="hq-text-caption text-text-muted">
                        {[
                          r.room ? 'Room ' + r.room : r.roomType,
                          r.party.adults +
                            (r.children ? '+' + r.children : '') +
                            (r.party.adults === 1 ? ' guest' : ' guests'),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <StatusChip status={readinessTone(r.readiness)} />
                    {r.actions?.includes('check_in') && (
                      <button
                        disabled={!!busy[r.ref.id]}
                        onClick={() =>
                          runAction(r.ref.id, actOn('/v1/reservations/:id/check-in', r.ref.id))
                        }
                        className="shrink-0 rounded-md bg-primary px-2.5 py-1 hq-text-caption font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {busy[r.ref.id] ? 'Checking in…' : 'Check in'}
                      </button>
                    )}
                    {r.status === 'checked_in' && (
                      <span className="hq-text-caption text-[var(--text-muted)]">Checked in</span>
                    )}
                    {rowError[r.ref.id] && (
                      <span className="hq-text-caption text-[var(--danger)]">
                        {rowError[r.ref.id]}
                      </span>
                    )}
                  </div>
                ))}
              </Worklist>
            )}
          </Section>

          <Section
            id="sec-departures"
            title="Departures"
            count={dep?.summary?.dueOut}
            action={
              <Link to="/app/billing" className="hq-text-caption text-secondary hover:underline">
                Billing
              </Link>
            }
          >
            {q.isLoading ? (
              <Skeleton />
            ) : dep?.status === 'error' ? (
              <SectionError message={dep.error} onRetry={() => q.refetch()} />
            ) : !dep?.items?.length ? (
              <p className="hq-text-body text-text-secondary">All departures settled.</p>
            ) : (
              <ul className="divide-y divide-border">
                {dep.items.map((r) => (
                  <li key={r.ref.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="hq-text-body truncate font-medium text-text-primary">
                        {r.guest}
                      </p>
                      <p className="hq-text-caption text-text-muted">Due out</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      {r.actions?.includes('check_out') && (
                        <button
                          disabled={!!busy[r.ref.id]}
                          onClick={() =>
                            runAction(r.ref.id, actOn('/v1/reservations/:id/check-out', r.ref.id))
                          }
                          className="rounded-md bg-primary px-2.5 py-1 hq-text-caption font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {busy[r.ref.id] ? 'Checking out…' : 'Check out'}
                        </button>
                      )}
                      {rowError[r.ref.id] && (
                        <span className="hq-text-caption text-[var(--danger)]">
                          {rowError[r.ref.id]}
                        </span>
                      )}
                      {r.actions?.includes('record_payment') && (
                        <Link
                          to={'/app/billing?reservation=' + r.ref.id}
                          className="rounded-md border border-border px-2 py-1 hq-text-caption text-text-secondary hover:bg-surface-elevated"
                        >
                          Payment
                        </Link>
                      )}
                    </span>
                    {r.balance != null && (
                      <span
                        className={
                          'hq-tnum hq-text-body ' +
                          (r.balance > 0 ? 'text-warning' : 'text-text-secondary')
                        }
                      >
                        <Money amountMinor={Math.round(r.balance * 100)} currency={ctx?.currency} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* 5-7. Readiness, My Shift, Performance, Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {rd && (
            <Section
              id="sec-readiness"
              title="Readiness"
              action={
                <Link to="/app/rooms" className="hq-text-caption text-secondary hover:underline">
                  Room board
                </Link>
              }
            >
              {q.isLoading ? (
                <Skeleton />
              ) : rd.status === 'error' ? (
                <SectionError message={rd.error} onRetry={() => q.refetch()} />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <StatusChip status="ready" label={rd.summary.ready + ' ready'} />
                  <StatusChip status="dirty" label={rd.summary.dirty + ' dirty'} />
                  <StatusChip status="in_progress" label={rd.summary.inProgress + ' in progress'} />
                  <StatusChip status="ooo" label={rd.summary.ooo + ' OoO'} />
                  <StatusChip status="oos" label={rd.summary.oos + ' OoS'} />
                </div>
              )}
            </Section>
          )}
          {shift && (
            <Section
              id="sec-myshift"
              title="My Shift"
              count={shift?.summary?.open}
              action={
                <Link to="/app/tasks" className="hq-text-caption text-secondary hover:underline">
                  Tasks
                </Link>
              }
            >
              {q.isLoading ? (
                <Skeleton />
              ) : shift.status === 'error' ? (
                <SectionError message={shift.error} onRetry={() => q.refetch()} />
              ) : !shift?.items?.length ? (
                <p className="hq-text-body text-text-secondary">Nothing assigned to you.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {shift.items.map((t) => (
                    <li key={t.ref.id} className="py-2">
                      <p
                        className={
                          'hq-text-body font-medium ' +
                          (t.overdue ? 'text-danger' : 'text-text-primary')
                        }
                      >
                        {t.title}
                      </p>
                      <p className="hq-text-caption text-text-muted">
                        {t.department}
                        {t.dueAt ? ' · due ' + new Date(t.dueAt).toLocaleTimeString() : ''}
                        {t.overdue ? ' · overdue' : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
        </div>
        {perf && (
          <Section id="sec-performance" title="Performance">
            {q.isLoading ? (
              <Skeleton />
            ) : perf.status === 'error' ? (
              <SectionError message={perf.error} onRetry={() => q.refetch()} />
            ) : (
              <>
                <dl className="space-y-2 hq-text-body">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Occupancy</dt>
                    <dd className="hq-tnum font-medium">
                      {perf.metrics.occupancyPct}% ({perf.metrics.occupiedTonight}/
                      {perf.metrics.availableRooms})
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">ADR (projected)</dt>
                    <dd className="hq-tnum font-medium">
                      <Money
                        amountMinor={Math.round(perf.metrics.adr * 100)}
                        currency={ctx?.currency}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">RevPAR (projected)</dt>
                    <dd className="hq-tnum font-medium">
                      <Money
                        amountMinor={Math.round(perf.metrics.revpar * 100)}
                        currency={ctx?.currency}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Projected room revenue</dt>
                    <dd className="hq-tnum font-medium">
                      <Money
                        amountMinor={Math.round(perf.metrics.projectedRoomRevenue * 100)}
                        currency={ctx?.currency}
                      />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Posted today</dt>
                    <dd className="hq-tnum font-medium">
                      <Money
                        amountMinor={Math.round(perf.metrics.postedRevenue * 100)}
                        currency={ctx?.currency}
                      />
                    </dd>
                  </div>
                </dl>
                <AreaChart series={perf.series} currency={ctx?.currency} height={200} />
              </>
            )}
          </Section>
        )}

        {/* 9. Activity rail */}
        {act && (
          <Section id="sec-activity" title="Activity">
            {q.isLoading ? (
              <Skeleton />
            ) : act.status === 'error' ? (
              <SectionError message={act.error} onRetry={() => q.refetch()} />
            ) : !act?.items?.length ? (
              <p className="hq-text-body text-text-secondary">No recent activity.</p>
            ) : (
              <ul className="divide-y divide-border">
                {act.items.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                    <p className="hq-text-body text-text-primary">
                      {a.actor ? <span className="font-medium">{a.actor} </span> : null}
                      <span className="text-text-secondary">
                        {a.action} {a.entity}
                      </span>
                    </p>
                    <TimeAgo date={a.at} className="hq-text-caption shrink-0 text-text-muted" />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        )}
      </div>
    </PageShell>
  );
}
