// apps/web/src/app/admin/onboarding/page.jsx
'use client';

import { useState, useMemo } from 'react';
import { PlayCircle, Users, TrendingUp, Clock, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getOnboardingDashboard,
  getFlows,
  getSessions,
  getInterventions,
  getMetrics,
  triggerIntervention,
  resolveIntervention,
} from '@/api/onboarding';
import {
  OnboardingStatCard,
  OnboardingStatusBadge,
  HealthScoreBadge,
  FunnelVisualization,
  TenantProgressRow,
  InterventionCard,
  CsmPerformanceCard,
  MiniSparkline,
} from './components';
import InterventionModal from './InterventionModal';

/* ─── API → UI mappers ─── */

// OnboardingSession → the tenant-shaped object TenantProgressRow / InterventionModal expect
function mapSessionToTenant(session) {
  const lastActivity = session.lastActivityAt ? new Date(session.lastActivityAt) : null;
  const daysSinceActivity = lastActivity
    ? Math.floor((Date.now() - lastActivity.getTime()) / 86400000)
    : null;
  return {
    id: session.id,
    _sessionId: session.id,
    name: session.userName || 'Unknown user',
    subdomain: session.flowId || '',
    status: session.status, // in_progress | completed | abandoned | overdue
    healthScore: session.progress ?? 0,
    progress: session.progress ?? 0,
    daysRemaining: daysSinceActivity,
    dropOffStage:
      session.status === 'abandoned' || session.status === 'overdue' ? session.currentStepId : null,
    dropOffReason:
      session.status === 'abandoned'
        ? 'Abandoned'
        : session.status === 'overdue'
          ? 'Overdue'
          : null,
    assignedCSM: null,
    revenueAtRisk: 0,
    interventions: (session.interventions || []).map((i) => ({
      type: i.type,
      subject: i.type,
      notes: '',
      sentAt: i.sentAt ? i.sentAt.replace('T', ' ').slice(0, 19) : '',
      scheduledAt: null,
      status: i.resolved ? 'resolved' : 'sent',
    })),
  };
}

// OnboardingIntervention → InterventionCard shape
function mapIntervention(i, sessionById) {
  return {
    id: i.id,
    type: i.type,
    subject: (i.message || '').slice(0, 60) || i.type,
    notes: i.message || '',
    sentAt: i.sentAt ? i.sentAt.replace('T', ' ').slice(0, 19) : '',
    scheduledAt: null,
    status: i.resolvedAt ? 'resolved' : 'sent',
    tenantName: sessionById.get(i.sessionId)?.userName || '',
    _raw: i,
  };
}

export default function OnboardingPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState('30d');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [interveneTarget, setInterveneTarget] = useState(null);

  /* ─── Queries (useApiFetch) ─── */

  const dashboard = useApiFetch(() => getOnboardingDashboard(), []);
  const flows = useApiFetch(() => getFlows({ page: 1, pageSize: 50 }), []);
  const sessions = useApiFetch(
    () => getSessions({ page: 1, pageSize: 50, ...(statusFilter && { status: statusFilter }) }),
    [statusFilter]
  );
  const interventions = useApiFetch(
    () => getInterventions(undefined, { page: 1, pageSize: 50 }),
    []
  );
  const metrics = useApiFetch(() => getMetrics(period), [period]);

  /* ─── Mutations (useApiMutation) ─── */

  const interveneMutation = useApiMutation(
    ({ sessionId, type, message }) => triggerIntervention(sessionId, type, message),
    {
      onSuccess: () => {
        toast({ title: 'Intervention sent', description: 'The tenant has been notified.' });
        sessions.refetch();
        interventions.refetch();
        dashboard.refetch();
      },
    }
  );

  const resolveMutation = useApiMutation((id) => resolveIntervention(id, 'Admin'), {
    onSuccess: () => {
      toast({ title: 'Intervention resolved' });
      interventions.refetch();
    },
  });

  /* ─── Handlers ─── */

  const handleSaveIntervention = async (payload) => {
    if (!interveneTarget) return;
    try {
      await interveneMutation.mutate({
        sessionId: interveneTarget._sessionId,
        type:
          payload.type === 'in_app'
            ? 'notification'
            : payload.type === 'call' || payload.type === 'demo'
              ? 'manual'
              : 'email',
        message: payload.body || payload.subject,
      });
      setInterveneTarget(null);
    } catch (err) {
      toast({
        title: 'Failed to send intervention',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleResolve = (id) =>
    resolveMutation
      .mutate(id)
      .catch((err) =>
        toast({ title: 'Failed to resolve', description: err.message, variant: 'destructive' })
      );

  /* ─── Derived data ─── */

  const sessionList = useMemo(() => sessions.data?.data || [], [sessions.data]);
  const flowList = useMemo(() => flows.data?.data || [], [flows.data]);
  const tenants = useMemo(() => sessionList.map(mapSessionToTenant), [sessionList]);

  const sessionById = useMemo(() => new Map(sessionList.map((s) => [s.id, s])), [sessionList]);
  const interventionCards = useMemo(
    () => (interventions.data?.data || []).map((i) => mapIntervention(i, sessionById)),
    [interventions.data, sessionById]
  );

  // Funnel: one stage per flow, entered = sessions started, completed = completed sessions
  const funnelData = useMemo(
    () =>
      flowList.map((flow) => {
        const flowSessions = sessionList.filter((s) => s.flowId === flow.id);
        const completed = flowSessions.filter((s) => s.status === 'completed').length;
        const abandoned = flowSessions.filter(
          (s) => s.status === 'abandoned' || s.status === 'overdue'
        ).length;
        const entered = flowSessions.length;
        return {
          stage: flow.name,
          entered,
          completed,
          dropOffRate: entered > 0 ? Math.round((abandoned / entered) * 100) : 0,
        };
      }),
    [flowList, sessionList]
  );

  // Completion-rate trend for MiniSparkline
  const completionTrend = useMemo(() => {
    const data = metrics.data || [];
    return data.map((m) => (m.started > 0 ? Math.round((m.completed / m.started) * 100) : 0));
  }, [metrics.data]);

  // CSM performance derived from interventions grouped by resolver
  const csmList = useMemo(() => {
    const grouped = new Map();
    (interventions.data?.data || []).forEach((i) => {
      if (!i.resolvedBy) return;
      const entry = grouped.get(i.resolvedBy) || { name: i.resolvedBy, resolved: 0, total: 0 };
      entry.resolved += 1;
      grouped.set(i.resolvedBy, entry);
    });
    (interventions.data?.data || []).forEach((i) => {
      const key = i.resolvedBy;
      if (key && grouped.has(key)) grouped.get(key).total += 1;
    });
    return Array.from(grouped.values()).map((g) => ({
      name: g.name,
      activeCases: Math.max(g.total - g.resolved, 0),
      conversionRate: g.total > 0 ? Math.round((g.resolved / g.total) * 100) : 0,
    }));
  }, [interventions.data]);

  const dash = dashboard.data;

  if (dashboard.loading) {
    return (
      <div className="space-y-4 p-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (dashboard.error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-danger" />
          <p className="text-sm text-danger">
            Failed to load onboarding data: {dashboard.error.message}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={dashboard.refetch}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Onboarding Management</h1>
          <p className="text-sm text-text-muted">
            Track tenant onboarding progress and run interventions
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stat cards */}
      {dash && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <OnboardingStatCard
            label="Active Flows"
            value={dash.activeFlows}
            icon={PlayCircle}
            color="text-secondary"
          />
          <OnboardingStatCard
            label="Active Sessions"
            value={dash.activeSessions}
            icon={Users}
            color="text-info"
          />
          <OnboardingStatCard
            label="Completion Rate"
            value={`${dash.completionRate}%`}
            icon={TrendingUp}
            color="text-accent"
          />
          <OnboardingStatCard
            label="Avg. Time"
            value={`${dash.averageTimeMinutes}m`}
            icon={Clock}
            color="text-secondary"
          />
          <OnboardingStatCard
            label="At Risk"
            value={dash.atRiskSessions}
            icon={AlertTriangle}
            color="text-warning"
          />
          <OnboardingStatCard
            label="Interventions Today"
            value={dash.interventionsToday}
            icon={Zap}
            color="text-danger"
          />
        </div>
      )}

      {/* Funnel + trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Onboarding Funnel</h3>
          {funnelData.length > 0 ? (
            <FunnelVisualization stageData={funnelData} />
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">No flows configured yet.</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Completion Trend</h3>
          <MiniSparkline data={completionTrend} width={260} height={80} />
          <p className="mt-2 text-xs text-text-muted">Completion % per day ({period})</p>
        </div>
      </div>

      {/* Flows */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Flows</h3>
        {flowList.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">No onboarding flows yet.</p>
        ) : (
          <div className="space-y-2">
            {flowList.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{flow.name}</p>
                  <p className="text-xs text-text-muted">
                    {flow.steps?.length || 0} steps · {flow.completionRate}% completion
                  </p>
                </div>
                <OnboardingStatusBadge status={flow.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sessions (tenant progress) */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Active Sessions</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
          >
            <option value="">All statuses</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        {sessions.loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">No sessions found.</p>
        ) : (
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <TenantProgressRow
                key={tenant.id}
                tenant={tenant}
                expanded={expandedId === tenant.id}
                onToggle={() => setExpandedId((prev) => (prev === tenant.id ? null : tenant.id))}
                onIntervene={(t) => setInterveneTarget(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interventions + CSM */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Recent Interventions</h3>
          {interventionCards.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">No interventions yet.</p>
          ) : (
            <div className="space-y-3">
              {interventionCards.slice(0, 8).map((intervention) => (
                <div key={intervention.id} className="relative">
                  <InterventionCard
                    intervention={intervention}
                    tenantName={intervention.tenantName}
                  />
                  {intervention.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(intervention.id)}
                      className="absolute right-3 top-3 text-xs text-secondary hover:underline"
                    >
                      Mark resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">CSM Performance</h3>
          {csmList.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              No resolved interventions yet — CSM stats appear once interventions are resolved.
            </p>
          ) : (
            <div className="space-y-3">
              {csmList.map((csm) => (
                <CsmPerformanceCard key={csm.name} csm={csm} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health score summary of at-risk sessions */}
      {tenants.some((t) => t.status === 'abandoned' || t.status === 'overdue') && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" /> At-risk sessions
          </h3>
          <div className="flex flex-wrap gap-3">
            {tenants
              .filter((t) => t.status === 'abandoned' || t.status === 'overdue')
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <HealthScoreBadge score={t.healthScore} />
                  <span className="text-sm text-text-primary">{t.name}</span>
                  <Button variant="outline" size="sm" onClick={() => setInterveneTarget(t)}>
                    Intervene
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Intervention modal */}
      {interveneTarget && (
        <InterventionModal
          tenant={interveneTarget}
          onClose={() => setInterveneTarget(null)}
          onSave={handleSaveIntervention}
        />
      )}
    </div>
  );
}
