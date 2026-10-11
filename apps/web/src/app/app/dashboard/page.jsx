/* apps/web/src/app/app/dashboard/page.jsx */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  CalendarCheck,
  CalendarX,
  DollarSign,
  LogIn,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  useActivityFeed,
  useDashboardAlerts,
  useDashboardStats,
  useFrontDeskSnapshot,
} from '../../../hooks/useDashboard';
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
import { ErrorState } from '../../../components/ui/ErrorState';

export default function AppDashboard() {
  const [dismissed, setDismissed] = useState([]);

  const stats = useDashboardStats();
  const frontDesk = useFrontDeskSnapshot();
  const activity = useActivityFeed(undefined, 15);
  const alerts = useDashboardAlerts();

  const data = stats.data;
  const currency = data?.property.currency ?? 'ZAR';
  const loading = stats.isLoading;
  const alertsList = (alerts.data ?? []).filter((a) => !dismissed.includes(a.id));

  const dismiss = (id) => setDismissed((prev) => [...prev, id]);
  const dismissAll = () => setDismissed((prev) => [...prev, ...alertsList.map((a) => a.id)]);

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
        <div className="flex items-center gap-2">
          {data && <NightAuditChip nightAudit={data.nightAudit} businessDate={data.businessDate} />}
          <button
            onClick={() => {
              stats.refetch();
              frontDesk.refetch();
              activity.refetch();
              alerts.refetch();
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
        />
        <KpiCard
          label="ADR"
          value={loading ? '—' : `${currency} ${data.adr.toFixed(0)}`}
          sub="Average daily rate tonight"
          icon={DollarSign}
          iconClass="text-accent"
          loading={loading}
        />
        <KpiCard
          label="RevPAR"
          value={loading ? '—' : `${currency} ${data.revpar.toFixed(0)}`}
          sub="Revenue per available room"
          icon={TrendingUp}
          iconClass="text-info"
          loading={loading}
        />
        <KpiCard
          label="Revenue Today"
          value={loading ? '—' : `${currency} ${data.totalRevenue.toFixed(0)}`}
          sub={loading ? '' : `${currency} ${data.monthToDateRevenue.toFixed(0)} MTD`}
          icon={DollarSign}
          iconClass="text-warning"
          loading={loading}
        />
        <KpiCard
          label="Arrivals Today"
          value={loading ? '—' : data.arrivalsToday}
          sub={loading ? '' : `${data.inHouseGuests} guests in house`}
          icon={CalendarCheck}
          iconClass="text-secondary"
          loading={loading}
        />
        <KpiCard
          label="Departures Today"
          value={loading ? '—' : data.departuresToday}
          sub={loading ? '' : `${data.pendingTasks} pending tasks`}
          icon={CalendarX}
          iconClass="text-danger"
          loading={loading}
        />
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

      {/* Arrivals + departures */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MovementsPanel
          title="Arrivals Today"
          icon={LogIn}
          items={frontDesk.data?.arrivals ?? []}
          type="arrival"
          currency={currency}
          loading={frontDesk.isLoading}
          viewAllTo="/app/reservations/front-desk"
        />
        <MovementsPanel
          title="Departures Today"
          icon={CalendarX}
          items={frontDesk.data?.departures ?? []}
          type="departure"
          currency={currency}
          loading={frontDesk.isLoading}
          viewAllTo="/app/reservations/front-desk"
        />
      </div>

      {/* Room board + activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RoomBoard rooms={frontDesk.data?.rooms ?? []} loading={frontDesk.isLoading} />
        </div>
        <ActivityFeed items={activity.data ?? []} loading={activity.isLoading} />
      </div>

      {/* Latest reservations */}
      <RecentReservations
        reservations={data?.recentReservations ?? []}
        currency={currency}
        loading={loading}
      />

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
          <Link to="/app/reports" className="ml-auto font-medium text-secondary hover:underline">
            Full reports →
          </Link>
        </div>
      )}

      <QuickActionsFab />
    </div>
  );
}
