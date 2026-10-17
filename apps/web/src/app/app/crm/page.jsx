import { useNavigate } from 'react-router-dom';
import { Users, Wallet, CalendarClock, Target, Play, RefreshCw, ArrowRight } from 'lucide-react';
import { useCrmOverview, useEvaluateSegment } from '../../../hooks/useCrm';
import { useToast } from '../../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard, VipBadge, RfmBadge, fmtMoney, fmtDate } from './components';

export default function CrmOverviewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading, isError, refetch, isFetching } = useCrmOverview();
  const evaluate = useEvaluateSegment();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <EmptyState
          title="Could not load CRM overview"
          description="Check that the API is running and the CRM module is mounted at /v1/crm."
          action={
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { totals, topGuests, followUpsDue, segments, vipBreakdown } = data;

  const kpis = [
    { icon: Users, label: 'Guests in CRM', value: totals.guests },
    { icon: Target, label: 'With stay history', value: totals.guestsWithStays },
    { icon: Wallet, label: 'Lifetime guest spend', value: fmtMoney(totals.totalSpend) },
    { icon: CalendarClock, label: 'Follow-ups due (7d)', value: followUpsDue.length },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-sm text-muted-foreground">
            Guest relationships, segments and follow-ups — VIP mix:{' '}
            {Object.entries(vipBreakdown)
              .filter(([k]) => k !== 'none')
              .map(([k, v]) => `${k} ${v}`)
              .join(' · ') || 'no VIPs yet'}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">{label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Top guests by lifetime spend">
          {topGuests.length === 0 ? (
            <EmptyState
              title="No stays yet"
              description="Top guests appear once reservations are checked in or out."
            />
          ) : (
            <div className="divide-y">
              {topGuests.map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate(`/app/crm/guests/${g.id}`)}
                  className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:bg-muted/50 rounded-md px-2 -mx-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{g.name}</span>
                      <VipBadge tier={g.vipStatus} />
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {g.email || 'no email'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <RfmBadge score={g.rfm.score} />
                    <span className="text-sm font-semibold">{fmtMoney(g.rfm.spend)}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Follow-ups due"
            action={
              <Badge variant="outline">
                {followUpsDue.filter((f) => !f.dueAt || new Date(f.dueAt) <= new Date()).length}{' '}
                overdue / due now
              </Badge>
            }
          >
            {followUpsDue.length === 0 ? (
              <EmptyState
                title="Inbox zero"
                description="No open follow-ups due in the next 7 days."
              />
            ) : (
              <div className="space-y-2">
                {followUpsDue.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => navigate(`/app/crm/guests/${f.guestId}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{f.title}</div>
                      <div className="text-xs text-muted-foreground">
                        due {f.dueAt ? fmtDate(f.dueAt) : 'any time'}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Segments">
            {segments.length === 0 ? (
              <EmptyState
                title="No segments yet"
                description="Build rule-based segments (RFM, tags, VIP) and evaluate them here."
                action={
                  <Button onClick={() => navigate('/app/crm/segments')}>Create segment</Button>
                }
              />
            ) : (
              <div className="space-y-2">
                {segments.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.memberCount} members · ran {s.lastRunAt ? fmtDate(s.lastRunAt) : 'never'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!s.isActive && <Badge variant="outline">inactive</Badge>}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={evaluate.isPending}
                        onClick={() =>
                          evaluate.mutate(s.id, {
                            onSuccess: (r) =>
                              toast({ title: `Segment evaluated — ${r.memberCount} members` }),
                            onError: (e) =>
                              toast({
                                title: 'Evaluate failed',
                                description: e.message,
                                variant: 'destructive',
                              }),
                          })
                        }
                      >
                        <Play className="mr-1 h-3.5 w-3.5" /> Run
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate('/app/crm/segments')}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
