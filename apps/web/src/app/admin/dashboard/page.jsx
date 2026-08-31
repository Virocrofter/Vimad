/* src/app/admin/dashboard/page.jsx */
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import KpiCards from './KpiCards';
import SystemHealth from './SystemHealth';
import RecentAlerts from './RecentAlerts';
import QuickActions from './QuickActions';
import RevenueChart from './RevenueChart';
import TenantActivity from './TenantActivity';
import PlanDistribution from './PlanDistribution';
import {
  kpiData,
  systemHealth,
  recentAlerts,
  quickActions,
  tenantActivity,
  planDistribution,
} from './data';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary">
            Platform overview, key metrics, and system status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/analytics')}>
            <BarChart3 className="mr-1.5 h-4 w-4" /> Analytics
          </Button>
          <Button size="sm" onClick={() => navigate('/admin?action=new-tenant')}>
            <ArrowRight className="mr-1.5 h-4 w-4" /> New Tenant
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <KpiCards data={kpiData} />

      {/* Middle Row: System Health + Alerts + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SystemHealth data={systemHealth} />
        </div>
        <div className="lg:col-span-1">
          <RecentAlerts alerts={recentAlerts} />
        </div>
        <div className="lg:col-span-1">
          <QuickActions actions={quickActions} />
        </div>
      </div>

      {/* Bottom Row: Revenue Chart + Activity + Plan Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <RevenueChart mrrData={kpiData.mrr.trend} />
        </div>
        <div className="lg:col-span-1">
          <TenantActivity activities={tenantActivity} />
        </div>
        <div className="lg:col-span-1">
          <PlanDistribution data={planDistribution} />
        </div>
      </div>
    </div>
  );
}
