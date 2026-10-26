/* apps/web/src/app/app/dashboard/page.jsx */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  CalendarCheck,
  CalendarX,
  DollarSign,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  useActivityFeed,
  useDashboardAlerts,
  useDashboardStats,
  useFrontDeskSnapshot,
} from '../../../hooks/useDashboard';
import { useOpsToday } from '../../../hooks/useOpsToday';
import { useDashboardDeltas } from '../../../hooks/useDashboardDeltas';
import { useSocket } from '../../../hooks/useSocket';
import { apiClient } from '../../../api/client';
import { getAccessToken, useAuthStore } from '../../../stores/authStores';
import { usePropertyStore } from '../../../stores/propertyStore';
import { usePermission } from '../../../hooks/usePermissions';
import {
  ActivityFeed,
  AlertsPanel,
  KpiCard,
  MovementsPanel,
  NightAuditChip,
  QuickActionsFab,
  RecentReservations,
  RevenueChart,
  RoomBoard,
} from './components';
import { TodayStrip, TasksMiniBoard, UnsettledDepartures, VipArrivals } from './dashWidgets';
import CommandPalette from './CommandPalette';
import { dismissAlert, filterDismissed, LINKS } from './dashLinks';
import { cn } from '../../../lib/utils';
import CrmPulse from './CrmPulse';
import { ErrorState } from '../../../components/ui/ErrorState';

export default function AppDashboard() {
  // D1.3 — respect the chain-admin sticky property (C1 property switcher)
  const { currentPropertyId, clear: clearStickyProperty } = usePropertyStore();
  const propertyId = currentPropertyId ?? undefined;

  // D1.4 — permission-aware sections (owner bypasses inside the hook)
  const canReadFolios = usePermission('folio', 'read');
  const canReadReservations = usePermission('reservation', 'read');
  const canReadHousekeeping = usePermission('housekeeping', 'read');
  const canReadReports = usePermission('report', 'read');
  const canReadTasks = usePermission('task', 'read');

  const stats = useDashboardStats(propertyId);
  const frontDesk = useFrontDeskSnapshot(propertyId);
  const activity = useActivityFeed(propertyId, 15);
  const alerts = useDashboardAlerts(propertyId);
  const ops = useOpsToday(propertyId);
  const deltas = useDashboardDeltas(propertyId);

  // D3 — command palette
  const [paletteOpen, setPaletteOpen] = useState(false);

  // D3 fix — the auth store's permissions array is never populated at login
  // (platform gap: no endpoint exposed them). Hydrate it once per session so
  // usePermission() gating works for non-owner roles. Server still enforces.
  const sessionUser = useAuthStore((s) => s.user);
  const sessionPermissions = useAuthStore((s) => s.permissions);
  const setSessionPermissions = useAuthStore((s) => s.setPermissions);
  useEffect(() => {
    if (!sessionUser || sessionUser.role === 'owner' || sessionPermissions.length > 0) return;
    let cancelled = false;
    apiClient
      .get('/auth/permissions')
      .then((r) => {
        if (!cancelled) setSessionPermissions(r.data?.data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionUser, sessionPermissions.length, setSessionPermissions]);

  // D2 heal — stale sticky property 404s every query; clear and fall back.
  useEffect(() => {
    if (!propertyId || !stats.isError) return;
    const status = stats.error?.response?.status;
    const message = String(stats.error?.message ?? stats.error ?? '');
    if (status === 404 || /property not found/i.test(message)) {
      clearStickyProperty();
    }
  }, [propertyId, stats.isError, stats.error, clearStickyProperty]);

  const data = stats.data;
  const businessDate = data?.businessDate;
  const currency = data?.property.currency ?? 'ZAR';
  const loading = stats.isLoading;

  // D3 — delta helpers (today from stats, yesterday/7d from /dashboard/deltas)
  const d = deltas.data;
  const occupancyDelta =
    !loading && d?.yesterday.occupancyRate != null
      ? Math.round((data.occupancyRate - d.yesterday.occupancyRate) * 10) / 10
      : null;
  const revenueDeltaPct =
    !loading && d && d.yesterday.revenue > 0
      ? Math.round(((data.totalRevenue - d.yesterday.revenue) / d.yesterday.revenue) * 1000) / 10
      : null;

  // D1.2 — dismissal persists per business date.
  const [tick, setTick] = useState(0);
  const alertsList = useMemo(
    () => filterDismissed(alerts.data ?? [], businessDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alerts.data, businessDate, tick]
  );

  const dismiss = (id) => {
    dismissAlert(id, businessDate);
    setTick((t) => t + 1);
  };
  const dismissAll = () => {
    alertsList.forEach((a) => dismissAlert(a.id, businessDate));
    setTick((t) => t + 1);
  };

  // D2 — live updates via ops:mutation (debounced refetch of the board)
  const { isConnected, on } = useSocket(getAccessToken());
  const [liveAt, setLiveAt] = useState(null);
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!isConnected) return undefined;
    const handler = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setLiveAt(new Date());
        stats.refetch();
        frontDesk.refetch();
        activity.refetch();
        alerts.refetch();
        ops.refetch();
        deltas.refetch();
      }, 1200);
    };
    on('ops:mutation', handler);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, on]);

  if (stats.isError) {
    return (
      <ErrorState
        title="Couldn't load the command center"
        error={stats.error ?? 'The dashboard service is unreachable.'}
        onRetry={stats.refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Command Center</h2>
          <p className="text-sm text-text-secondary">
            {data
              ? `${data.property.name} · Business date ${data.businessDate}`
              : 'Loading property…'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="flex items-center gap-1.5"
            title={
              isConnected
                ? 'Live updates connected'
                : 'Live updates disconnected — is the API restarted?'
            }
          >
            <span
              className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-accent' : 'bg-text-muted')}
            />
            <span className="text-[11px] text-text-muted">
              {isConnected
                ? liveAt
                  ? `Live · ${liveAt.toLocaleTimeString()}`
                  : 'Live'
                : 'Offline'}
            </span>
          </span>
          {data && <NightAuditChip nightAudit={data.nightAudit} businessDate={data.businessDate} />}
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary md:inline-flex"
          >
            <Search className="h-3.5 w-3.5" />
            Search
            <kbd className="rounded border border-border bg-surface-elevated px-1 text-[10px]">
              ⌘K
            </kbd>
          </button>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to={LINKS.newReservation}
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              New reservation
            </Link>
            <Link
              to={LINKS.billing}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Take payment
            </Link>
          </div>
          <button
            onClick={() => {
              stats.refetch();
              frontDesk.refetch();
              activity.refetch();
              alerts.refetch();
              ops.refetch();
              deltas.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Occupancy"
          value={loading ? '—' : `${data.occupancyRate}%`}
          sub={
            loading ? '' : `${data.occupiedRooms}/${data.totalRooms - data.outOfOrderRooms} rooms`
          }
          icon={BedDouble}
          iconClass="text-secondary"
          loading={loading}
          to={LINKS.roomPlan}
          delta={
            occupancyDelta == null
              ? undefined
              : {
                  trend: occupancyDelta > 0 ? 'up' : occupancyDelta < 0 ? 'down' : 'flat',
                  good: occupancyDelta >= 0,
                  text: `${occupancyDelta >= 0 ? '+' : ''}${occupancyDelta}pp vs yesterday`,
                }
          }
        />
        {canReadFolios && (
          <>
            <KpiCard
              label="ADR"
              value={loading ? '—' : `${currency} ${data.adr.toFixed(0)}`}
              sub="Average daily rate tonight"
              icon={DollarSign}
              iconClass="text-accent"
              loading={loading}
              to={LINKS.reports}
            />
            <KpiCard
              label="RevPAR"
              value={loading ? '—' : `${currency} ${data.revpar.toFixed(0)}`}
              sub="Revenue per available room"
              icon={TrendingUp}
              iconClass="text-info"
              loading={loading}
              to={LINKS.reports}
            />
            <KpiCard
              label="Revenue Today"
              value={loading ? '—' : `${currency} ${data.totalRevenue.toFixed(0)}`}
              sub={
                loading
                  ? ''
                  : `${currency} ${data.monthToDateRevenue.toFixed(0)} MTD${
                      d?.averages.revenue7d != null
                        ? ` · 7d avg ${currency} ${d.averages.revenue7d.toFixed(0)}`
                        : ''
                    }`
              }
              icon={DollarSign}
              iconClass="text-warning"
              loading={loading}
              to={LINKS.reports}
              delta={
                revenueDeltaPct == null
                  ? undefined
                  : {
                      trend: revenueDeltaPct > 0 ? 'up' : revenueDeltaPct < 0 ? 'down' : 'flat',
                      good: revenueDeltaPct >= 0,
                      text: `${revenueDeltaPct >= 0 ? '+' : ''}${revenueDeltaPct}% vs yesterday`,
                    }
              }
            />
          </>
        )}
        {canReadReservations && (
          <>
            <KpiCard
              label="Arrivals Today"
              value={loading ? '—' : data.arrivalsToday}
              sub={loading ? '' : `${data.inHouseGuests} guests in house`}
              icon={CalendarCheck}
              iconClass="text-secondary"
              loading={loading}
              to={LINKS.arrivalsBoard}
            />
            <KpiCard
              label="Departures Today"
              value={loading ? '—' : data.departuresToday}
              sub={loading ? '' : `${data.pendingTasks} pending tasks`}
              icon={CalendarX}
              iconClass="text-danger"
              loading={loading}
              to={LINKS.arrivalsBoard}
            />
          </>
        )}
      </div>

      {/* Today strip */}
      <TodayStrip ops={ops.data} loading={ops.isLoading} />

      {/* Ops core: arrivals + departures */}
      {canReadReservations && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MovementsPanel
            title="Arrivals Today"
            icon={LogIn}
            items={frontDesk.data?.arrivals ?? []}
            type="arrival"
            currency={currency}
            loading={frontDesk.isLoading}
            viewAllTo={LINKS.arrivalsBoard}
          />
          <MovementsPanel
            title="Departures Today"
            icon={CalendarX}
            items={frontDesk.data?.departures ?? []}
            type="departure"
            currency={currency}
            loading={frontDesk.isLoading}
            viewAllTo={LINKS.arrivalsBoard}
          />
        </div>
      )}

      {/* Ops widgets */}
      {(canReadTasks || canReadFolios || canReadReservations) && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {canReadTasks && <TasksMiniBoard tasks={ops.data?.tasks} loading={ops.isLoading} />}
          {canReadFolios && (
            <UnsettledDepartures
              data={ops.data?.unsettledDepartures}
              currency={currency}
              loading={ops.isLoading}
            />
          )}
          {canReadReservations && (
            <VipArrivals items={ops.data?.vipArrivals} loading={ops.isLoading} />
          )}
        </div>
      )}

      {/* Room board + activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {canReadHousekeeping && (
          <div className="lg:col-span-2">
            <RoomBoard rooms={frontDesk.data?.rooms ?? []} loading={frontDesk.isLoading} />
          </div>
        )}
        <div className={canReadHousekeeping ? '' : 'lg:col-span-3'}>
          <ActivityFeed items={activity.data ?? []} loading={activity.isLoading} />
        </div>
      </div>

      {/* Chart + alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={data?.revenueByDay ?? []} currency={currency} loading={loading} />
        </div>
        <AlertsPanel
          alerts={alertsList}
          loading={alerts.isLoading}
          onDismiss={dismiss}
          onDismissAll={dismissAll}
        />
      </div>

      {/* Latest reservations */}
      {canReadReservations && (
        <RecentReservations
          reservations={data?.recentReservations ?? []}
          currency={currency}
          loading={loading}
        />
      )}

      {/* Secondary strip */}
      {!loading && data && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-surface px-5 py-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-text-muted" />
            <strong className="font-semibold text-text-primary">{data.inHouseGuests}</strong> in
            house
          </span>
          <span>
            <strong className="font-semibold text-text-primary">{data.availableRooms}</strong> rooms
            available
          </span>
          <span>
            <strong className="font-semibold text-text-primary">{data.dirtyRooms}</strong> dirty
          </span>
          <span>
            <strong className="font-semibold text-text-primary">{data.outOfOrderRooms}</strong> out
            of order
          </span>
          <span>
            <strong className="font-semibold text-text-primary">{data.newReservationsToday}</strong>{' '}
            new bookings today
          </span>
          {canReadReports && (
            <Link to={LINKS.reports} className="ml-auto font-medium text-secondary hover:underline">
              Full reports →
            </Link>
          )}
        </div>
      )}

      <CrmPulse />

      <QuickActionsFab />

      <CommandPalette
        open={paletteOpen}
        onOpen={() => setPaletteOpen(true)}
        onClose={() => setPaletteOpen(false)}
      />
    </div>
  );
}
