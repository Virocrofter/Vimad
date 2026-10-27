/* apps/web/src/app/app/groups/billing/page.jsx — T3+ group billing view */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../api/client';
import { usePropertyScope } from '../../../../hooks/usePropertyScope';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Input } from '../../../../components/ui/input';
import { LoadingSkeleton } from '../../../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { toast } from '../../../../hooks/use-toast';
import { cn } from '../../../../lib/utils';
import { Receipt, ArrowRightLeft, Lock, LockOpen, Send, Landmark } from 'lucide-react';

const RULE_LABEL = {
  always: 'Close anytime',
  consumed: 'Only after checkout',
  halfday: 'Checkout + 12h window',
};
const money = (n) => (n ?? 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });

export default function GroupBillingPage() {
  const [params] = useSearchParams();
  const groupId = params.get('groupId');
  const { currentPropertyId } = usePropertyScope();
  const queryClient = useQueryClient();
  const [moveTarget, setMoveTarget] = useState({});
  const [reopenReason, setReopenReason] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['group-billing', groupId],
    queryFn: async () => (await apiClient.get(`/folios/group/${groupId}/billing`)).data.data,
    enabled: !!groupId,
    refetchInterval: 30000,
  });
  const { data: rules } = useQuery({
    queryKey: ['bill-rules', currentPropertyId],
    queryFn: async () =>
      (await apiClient.get('/folios/bill-rules', { params: { propertyId: currentPropertyId } }))
        .data.data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['group-billing', groupId] });
  const move = useMutation({
    mutationFn: ({ itemId, targetFolioId }) =>
      apiClient.post(`/folios/items/${itemId}/move`, { targetFolioId }),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Item moved' });
    },
    onError: (e) =>
      toast({
        title: 'Move failed',
        description: e?.response?.data?.error?.message ?? e.message,
        variant: 'destructive',
      }),
  });
  const closeBill = useMutation({
    mutationFn: (folioId) => apiClient.post(`/folios/${folioId}/close`),
    onSuccess: (r) => {
      invalidate();
      toast({ title: `Bill closed (${r.data.data.rule ?? 'rule'})` });
    },
    onError: (e) =>
      toast({
        title: 'Close blocked',
        description: e?.response?.data?.error?.message ?? e.message,
        variant: 'destructive',
      }),
  });
  const reopen = useMutation({
    mutationFn: (folioId) => apiClient.post(`/folios/${folioId}/reopen`, { reason: reopenReason }),
    onSuccess: () => {
      invalidate();
      setReopenReason('');
      toast({ title: 'Bill reopened (audited)' });
    },
    onError: (e) =>
      toast({
        title: 'Reopen failed',
        description: e?.response?.data?.error?.message ?? e.message,
        variant: 'destructive',
      }),
  });

  if (!groupId)
    return (
      <ErrorState title="Missing groupId" description="Open via /app/groups/billing?groupId=..." />
    );
  if (error) return <ErrorState title="Billing view failed to load" onRetry={() => refetch()} />;
  if (isLoading || !data) return <LoadingSkeleton className="h-32" count={3} />;

  const allFolios = [
    ...(data.masterFolio ? [{ folio: data.masterFolio, label: 'Master / unassigned' }] : []),
    ...data.bills
      .filter((b) => b.folio)
      .map((b) => ({ folio: b.folio, label: `${b.guestName} · ${b.confirmationNumber}` })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
            <Receipt className="h-6 w-6 text-secondary" /> {data.group.name}
          </h1>
          <p className="text-sm text-text-secondary">
            {data.group.code} · {data.bills.length} bills
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-text-muted" />
          <span className="text-sm text-text-secondary">Closing rule:</span>
          <Badge variant="secondary">
            {RULE_LABEL[data.rule.billClosingRule] ?? data.rule.billClosingRule}
          </Badge>
        </div>
      </div>

      {data.masterFolio && data.masterFolio.items.length > 0 && (
        <FolioCard
          title="Master / unassigned"
          subtitle="Items not yet assigned to a guest"
          folio={data.masterFolio}
          allFolios={allFolios}
          moveTarget={moveTarget}
          setMoveTarget={setMoveTarget}
          onMove={move.mutate}
          onClose={closeBill.mutate}
          onReopen={reopen.mutate}
          reopenReason={reopenReason}
          setReopenReason={setReopenReason}
          highlight
        />
      )}

      {data.bills.map((b) =>
        b.folio ? (
          <FolioCard
            key={b.folio.id}
            title={b.guestName}
            subtitle={`${b.confirmationNumber} · ${b.reservationStatus}`}
            folio={b.folio}
            allFolios={allFolios}
            moveTarget={moveTarget}
            setMoveTarget={setMoveTarget}
            onMove={move.mutate}
            onClose={closeBill.mutate}
            onReopen={reopen.mutate}
            reopenReason={reopenReason}
            setReopenReason={setReopenReason}
          />
        ) : null
      )}
    </div>
  );
}

function FolioCard({
  title,
  subtitle,
  folio,
  allFolios,
  moveTarget,
  setMoveTarget,
  onMove,
  onClose,
  onReopen,
  reopenReason,
  setReopenReason,
  highlight,
}) {
  const closed = folio.status === 'closed';
  return (
    <Card className={cn(highlight && 'border-dashed')}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-lg font-bold text-text-primary">
            {money(folio.totalCharges)}
          </p>
          {closed ? (
            <Badge className="bg-slate-200 text-slate-700">Closed</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onClose(folio.id)}>
              <Lock className="mr-1 h-3.5 w-3.5" /> Close bill
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {folio.items.length === 0 && <p className="text-sm text-text-muted">No charges yet.</p>}
        {folio.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2 text-sm"
          >
            <div>
              <p className="text-text-primary">{item.description}</p>
              <p className="text-xs text-text-muted">
                {money(item.amount * item.quantity)}
                {item.movedAt
                  ? ` · moved ${new Date(item.movedAt).toLocaleDateString('en-ZA')}`
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={moveTarget[item.id] ?? ''}
                onValueChange={(v) => setMoveTarget((s) => ({ ...s, [item.id]: v }))}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Move to…" />
                </SelectTrigger>
                <SelectContent>
                  {allFolios
                    .filter((f) => f.folio.id !== folio.id)
                    .map((f) => (
                      <SelectItem key={f.folio.id} value={f.folio.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                disabled={!moveTarget[item.id]}
                onClick={() => onMove({ itemId: item.id, targetFolioId: moveTarget[item.id] })}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {closed && (
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <Input
              placeholder="Reason for modifying a closed bill (required)"
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={reopenReason.trim().length < 2}
              onClick={() => onReopen(folio.id)}
            >
              <LockOpen className="mr-1 h-3.5 w-3.5" /> Modify closed bill
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
