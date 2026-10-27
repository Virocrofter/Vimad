/* apps/web/src/app/app/housekeeping/rules/page.jsx — T2+ rules-as-rows UI */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { LoadingSkeleton } from '../../../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { toast } from '../../../../hooks/use-toast';
import { Play, SlidersHorizontal, Save } from 'lucide-react';

const fetchRules = async () => (await apiClient.get('/housekeeping/rules')).data.data;

export default function HkRulesPage() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState({});
  const {
    data: rules,
    isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['hk-rules'], queryFn: fetchRules, refetchInterval: 30000 });

  const save = useMutation({
    mutationFn: ({ key, body }) => apiClient.patch(`/housekeeping/rules/${key}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hk-rules'] });
      toast({ title: 'Rule updated' });
    },
    onError: (e) =>
      toast({
        title: 'Save failed',
        description: e?.response?.data?.error?.message ?? e.message,
        variant: 'destructive',
      }),
  });
  const runNow = useMutation({
    mutationFn: (key) => apiClient.post(`/housekeeping/rules/${key}/run`),
    onSuccess: (r) => toast({ title: `Rule ran — ${r.data.data.flipped} room(s) flipped` }),
    onError: (e) => toast({ title: 'Run failed', description: e.message, variant: 'destructive' }),
  });

  if (error) return <ErrorState title="Rules failed to load" onRetry={() => refetch()} />;
  if (isLoading || !rules) return <LoadingSkeleton className="h-32" count={2} />;

  const draftFor = (key, field, fallback) => drafts[`${key}:${field}`] ?? fallback;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <SlidersHorizontal className="h-6 w-6 text-secondary" /> Housekeeping auto-status rules
        </h1>
        <p className="text-sm text-text-secondary">
          Rules are rows — edit here, no deploy. Changes apply on the next rule tick.
        </p>
      </div>
      {rules.map((rule) => (
        <Card key={rule.key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">{rule.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                {rule.isActive ? 'Active' : 'Paused'}
              </Badge>
              <Switch
                checked={rule.isActive}
                onCheckedChange={(v) => save.mutate({ key: rule.key, body: { isActive: v } })}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">{rule.description}</p>
            <div className="flex flex-wrap items-end gap-4">
              {rule.action?.kind === 'hk_status_stagnant' && (
                <div className="space-y-1">
                  <Label className="text-xs">Vacant days threshold</Label>
                  <Input
                    type="number"
                    className="w-28"
                    value={draftFor(rule.key, 'vacantGteDays', rule.conditions?.vacantGteDays ?? 7)}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [`${rule.key}:vacantGteDays`]: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    save.mutate({
                      key: rule.key,
                      body: {
                        conditions: {
                          vacantGteDays: draftFor(
                            rule.key,
                            'vacantGteDays',
                            rule.conditions?.vacantGteDays ?? 7
                          ),
                        },
                      },
                    })
                  }
                  disabled={save.isPending}
                >
                  <Save className="mr-1 h-4 w-4" /> Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => runNow.mutate(rule.key)}
                  disabled={runNow.isPending}
                >
                  <Play className="mr-1 h-4 w-4" /> Run now
                </Button>
              </div>
              <span className="ml-auto text-xs text-text-muted">
                {rule.lastRunAt
                  ? `Last run ${new Date(rule.lastRunAt).toLocaleString('en-ZA')}`
                  : 'Never run'}
                {rule.lastRunCount != null
                  ? ` · ${rule.lastRunCount} tasks raised historically`
                  : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
