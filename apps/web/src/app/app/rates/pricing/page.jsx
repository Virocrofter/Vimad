/* apps/web/src/app/app/rates/pricing/page.jsx — C1' pricing console */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../api/client';
import { usePropertyScope } from '../../../../hooks/usePropertyScope';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import { LoadingSkeleton } from '../../../../components/ui/LoadingSkeleton';
import { toast } from '../../../../hooks/use-toast';
import { Calculator, Play, Plus, Link2, CheckCheck, ShieldAlert } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const plus = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const money = (n) => (n ?? 0).toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR' });

export default function PricingConsolePage() {
  const { currentPropertyId } = usePropertyScope();
  const qc = useQueryClient();
  const pid = currentPropertyId;
  const [ruleForm, setRuleForm] = useState({
    name: '',
    type: 'occupancy',
    occupancyGte: 80,
    daysWithin: 14,
    method: 'percent',
    value: 15,
    priority: 100,
  });
  const [bulk, setBulk] = useState({
    ratePlanId: '',
    method: 'percent',
    value: 10,
    from: today(),
    to: plus(6),
  });
  const [voucherPct, setVoucherPct] = useState(10);

  const inv = (k) => () => qc.invalidateQueries({ queryKey: k });
  const q = (key, fn, opts = {}) =>
    useQuery({ queryKey: key, queryFn: fn, enabled: !!pid, ...opts });

  const { data: rules } = q(
    ['c1-rules', pid],
    async () => (await apiClient.get('/rates/rules', { params: { propertyId: pid } })).data.data
  );
  const { data: plans } = q(
    ['c1-plans', pid],
    async () => (await apiClient.get('/rates/plans', { params: { propertyId: pid } })).data.data
  );
  const { data: vouchers, refetch: refetchVouchers } = q(
    ['c1-vouchers', pid],
    async () => (await apiClient.get('/rates/vouchers', { params: { propertyId: pid } })).data.data
  );
  const { data: review, refetch: refetchReview } = q(
    ['c1-review', pid],
    async () =>
      (
        await apiClient.get('/rates/restrictions-review', {
          params: { propertyId: pid, from: today(), to: plus(13) },
        })
      ).data.data
  );

  const m = (fn, okMsg, onDone) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast({ title: okMsg });
        onDone?.();
      },
      onError: (e) =>
        toast({
          title: 'Failed',
          description: e?.response?.data?.error?.message ?? e.message,
          variant: 'destructive',
        }),
    });

  const createRule = m(
    (body) => apiClient.post('/rates/rules', body, { params: { propertyId: pid } }),
    'Rule created',
    inv(['c1-rules'])
  );
  const toggleRule = m(
    ({ id, isActive }) => apiClient.post(`/rates/rules/${id}/toggle`, { isActive }),
    'Rule toggled',
    inv(['c1-rules'])
  );
  const evaluate = m(
    () =>
      apiClient.post(
        '/rates/rules/evaluate',
        { from: today(), to: plus(13) },
        { params: { propertyId: pid } }
      ),
    'Season evaluated — check effective rates',
    () => {
      refetchReview();
    }
  );
  const deleteRule = m(
    (id) => apiClient.delete(`/rates/rules/${id}`),
    'Rule deleted',
    inv(['c1-rules'])
  );
  const bulkUpdate = m(
    () => apiClient.post('/rates/bulk-update', bulk, { params: { propertyId: pid } }),
    'Bulk override written'
  );
  const clearBulk = m(
    () =>
      apiClient.post(
        '/rates/bulk-update',
        { ...bulk, method: 'clear' },
        { params: { propertyId: pid } }
      ),
    'Manual overrides cleared'
  );
  const createVoucher = m(
    () =>
      apiClient.post(
        '/rates/vouchers',
        { discountPercent: voucherPct },
        { params: { propertyId: pid } }
      ),
    'Voucher created',
    refetchVouchers
  );
  const applySuggestion = m(
    (id) => apiClient.post(`/rates/restrictions-review/${id}/apply`),
    'Stop-sell applied',
    refetchReview
  );
  const dismissSuggestion = m(
    (id) => apiClient.post(`/rates/restrictions-review/${id}/dismiss`),
    'Dismissed',
    refetchReview
  );

  if (!pid) return <LoadingSkeleton className="h-32" count={2} />;
  const fixedPlan = (plans ?? []).find((p) => p.calculationMethod === 'fixed');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <Calculator className="h-6 w-6 text-secondary" /> Pricing console
        </h1>
        <Button onClick={() => evaluate.mutate()}>
          <Play className="mr-1 h-4 w-4" /> Evaluate 14 days
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <Input
              placeholder="Rule name"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              className="col-span-2"
            />
            <Select
              value={ruleForm.type}
              onValueChange={(v) => setRuleForm({ ...ruleForm, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupancy">Occupancy</SelectItem>
                <SelectItem value="date_range">Date range</SelectItem>
                <SelectItem value="restriction">Restriction</SelectItem>
              </SelectContent>
            </Select>
            {ruleForm.type === 'occupancy' && (
              <Input
                type="number"
                value={ruleForm.occupancyGte}
                onChange={(e) => setRuleForm({ ...ruleForm, occupancyGte: Number(e.target.value) })}
                placeholder="occ ≥ %"
              />
            )}
            <Select
              value={ruleForm.method}
              onValueChange={(v) => setRuleForm({ ...ruleForm, method: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">+%</SelectItem>
                <SelectItem value="amount">+amount</SelectItem>
                <SelectItem value="fixed">fixed</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={ruleForm.value}
              onChange={(e) => setRuleForm({ ...ruleForm, value: Number(e.target.value) })}
            />
            <Button
              onClick={() =>
                createRule.mutate({
                  name: ruleForm.name,
                  type: ruleForm.type,
                  conditions:
                    ruleForm.type === 'occupancy'
                      ? { occupancyGte: ruleForm.occupancyGte, daysWithin: ruleForm.daysWithin }
                      : {},
                  adjustment:
                    ruleForm.type === 'restriction'
                      ? {}
                      : { method: ruleForm.method, value: ruleForm.value },
                  priority: ruleForm.priority,
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
          {(rules ?? []).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-text-primary">
                  {r.name}{' '}
                  <Badge variant="secondary" className="ml-2">
                    {r.type}
                  </Badge>
                </p>
                <p className="text-xs text-text-muted">
                  priority {r.priority} · {JSON.stringify(r.conditions)} →{' '}
                  {JSON.stringify(r.adjustment)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={r.isActive}
                  onCheckedChange={(v) => toggleRule.mutate({ id: r.id, isActive: v })}
                />
                <Button size="sm" variant="ghost" onClick={() => deleteRule.mutate(r.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk override (manual, survives re-evaluate)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Rate plan</Label>
            <Select
              value={bulk.ratePlanId}
              onValueChange={(v) => setBulk({ ...bulk, ratePlanId: v })}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {(plans ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {money(Number(p.baseRate))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="date"
            value={bulk.from}
            onChange={(e) => setBulk({ ...bulk, from: e.target.value })}
            className="w-36"
          />
          <Input
            type="date"
            value={bulk.to}
            onChange={(e) => setBulk({ ...bulk, to: e.target.value })}
            className="w-36"
          />
          <Input
            type="number"
            value={bulk.value}
            onChange={(e) => setBulk({ ...bulk, value: Number(e.target.value) })}
            className="w-24"
          />
          <Button onClick={() => bulkUpdate.mutate()} disabled={!bulk.ratePlanId}>
            Apply
          </Button>
          <Button variant="outline" onClick={() => clearBulk.mutate()} disabled={!bulk.ratePlanId}>
            Clear manual
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restriction review (no-exceptions queue)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(review ?? []).filter((s) => s.status === 'pending').length === 0 && (
            <p className="text-sm text-text-muted">
              No pending suggestions — evaluate rules to generate.
            </p>
          )}
          {(review ?? [])
            .filter((s) => s.status === 'pending')
            .map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
              >
                <p className="flex items-center gap-2 text-text-primary">
                  <ShieldAlert className="h-4 w-4 text-amber-500" /> {s.date.slice(0, 10)} ·
                  stop-sell · <span className="text-text-muted">{s.reason}</span>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => applySuggestion.mutate(s.id)}>
                    <CheckCheck className="mr-1 h-3.5 w-3.5" /> Apply
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dismissSuggestion.mutate(s.id)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vouchers + deep links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Discount %</Label>
              <Input
                type="number"
                value={voucherPct}
                onChange={(e) => setVoucherPct(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <Button onClick={() => createVoucher.mutate()}>
              <Link2 className="mr-1 h-4 w-4" /> Create voucher
            </Button>
          </div>
          {(vouchers ?? []).map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-mono font-medium text-text-primary">{v.code}</p>
                <p className="text-xs text-text-muted">
                  {v.discountPercent}% off · {v.uses}/{v.maxUses} uses
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `${window.location.origin}/booking?property=${pid}&voucher=${v.code}`
                  );
                  toast({ title: 'Deep link copied' });
                }}
              >
                Copy link
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
