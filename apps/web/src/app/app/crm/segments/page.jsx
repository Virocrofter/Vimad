import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, Trash2, Users, X } from 'lucide-react';
import {
  useSegments,
  useCreateSegment,
  useEvaluateSegment,
  useDeleteSegment,
  useSegmentMembers,
} from '../../../../hooks/useCrm';
import { useToast } from '../../../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard, VipBadge, fmtMoney, fmtDate } from '../components';

const EMPTY_RULE = { minStays: '', minSpend: '', maxRecencyDays: '', vipOnly: false, tagAny: '' };

export default function CrmSegmentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: segments, isLoading } = useSegments();
  const createSeg = useCreateSegment();
  const evaluate = useEvaluateSegment();
  const deleteSeg = useDeleteSegment();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rule, setRule] = useState(EMPTY_RULE);
  const [membersOf, setMembersOf] = useState(undefined);
  const { data: membersData } = useSegmentMembers(membersOf, !!membersOf);

  const num = (v) => (v === '' ? undefined : Number(v));

  const submit = () => {
    const built = {
      minStays: num(rule.minStays),
      minSpend: num(rule.minSpend),
      maxRecencyDays: num(rule.maxRecencyDays),
      vipOnly: rule.vipOnly || undefined,
      tagAny: rule.tagAny
        ? rule.tagAny
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined,
    };
    Object.keys(built).forEach((k) => built[k] === undefined && delete built[k]);
    if (!Object.keys(built).length) {
      toast({ title: 'Add at least one rule condition', variant: 'destructive' });
      return;
    }
    createSeg.mutate(
      { name: name.trim(), description: description.trim() || undefined, rule: built },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setDescription('');
          setRule(EMPTY_RULE);
          toast({ title: 'Segment created — run it to fill members' });
        },
        onError: (e) =>
          toast({ title: 'Create failed', description: e.message, variant: 'destructive' }),
      }
    );
  };

  if (isLoading)
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-72" />
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Segments</h1>
          <p className="text-sm text-muted-foreground">
            Rule-based guest segments — RFM, spend, recency, VIP, tags. Feed these into marketing
            automation.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New segment
        </Button>
      </div>

      {segments?.length === 0 ? (
        <EmptyState
          title="No segments yet"
          description="Example: 'At-risk VIPs' = VIP tier set AND not stayed in 180 days."
          action={<Button onClick={() => setOpen(true)}>Create your first segment</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {segments?.map((s) => (
            <div key={s.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    {!s.isActive && <Badge variant="outline">inactive</Badge>}
                  </div>
                  {s.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete segment "${s.name}"? Members are removed, guests are untouched.`
                      )
                    )
                      deleteSeg.mutate(s.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {Object.entries(s.rule).map(([k, v]) => (
                  <Badge key={k} variant="secondary">
                    {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
                  </Badge>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-xs text-muted-foreground">
                  {s.memberCount} members · ran {s.lastRunAt ? fmtDate(s.lastRunAt) : 'never'}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setMembersOf(s.id)}>
                    <Users className="mr-1 h-3.5 w-3.5" /> Members
                  </Button>
                  <Button
                    size="sm"
                    disabled={evaluate.isPending}
                    onClick={() =>
                      evaluate.mutate(s.id, {
                        onSuccess: (r) => toast({ title: `${r.memberCount} members matched` }),
                        onError: (e) =>
                          toast({
                            title: 'Run failed',
                            description: e.message,
                            variant: 'destructive',
                          }),
                      })
                    }
                  >
                    <Play className="mr-1 h-3.5 w-3.5" /> Run
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New segment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Segment name (e.g. At-risk VIPs)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-muted-foreground">
                Min stays
                <Input
                  type="number"
                  min="0"
                  value={rule.minStays}
                  onChange={(e) => setRule({ ...rule, minStays: e.target.value })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Min spend (R)
                <Input
                  type="number"
                  min="0"
                  value={rule.minSpend}
                  onChange={(e) => setRule({ ...rule, minSpend: e.target.value })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Recency ≤ days
                <Input
                  type="number"
                  min="1"
                  value={rule.maxRecencyDays}
                  onChange={(e) => setRule({ ...rule, maxRecencyDays: e.target.value })}
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rule.vipOnly}
                onChange={(e) => setRule({ ...rule, vipOnly: e.target.checked })}
              />
              VIP guests only
            </label>
            <Input
              placeholder="Has any tag (comma separated)"
              value={rule.tagAny}
              onChange={(e) => setRule({ ...rule, tagAny: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={createSeg.isPending || !name.trim()}>
                Create segment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members dialog */}
      <Dialog open={!!membersOf} onOpenChange={() => setMembersOf(undefined)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {membersData?.segment.name ?? 'Members'} · {membersData?.total ?? 0} members
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {!membersData || membersData.members.length === 0 ? (
              <EmptyState
                title="No members"
                description="Run the segment to evaluate membership."
              />
            ) : (
              <div className="divide-y">
                {membersData.members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMembersOf(undefined);
                      navigate(`/app/crm/guests/${m.id}`);
                    }}
                    className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.name}</span>
                        <VipBadge tier={m.vipStatus} />
                        {m.tags.map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {m.stays} stays · last {fmtDate(m.lastStayAt)}
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{fmtMoney(m.spend)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
