/* apps/web/src/app/app/rates/RateCodes.jsx */
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Tag } from 'lucide-react';
import { listRatePlans, deleteRatePlan, getChannelStatus } from '../../../api/rates-api';
import { listRoomTypes } from '../../../api/room-types';
import { cn } from '../../../lib/utils';

const METHOD_LABELS = {
  fixed: 'Fixed',
  percent: 'Percent off Rack',
  amount: 'Amount off Rack',
};

/* Fallback description when the plan has none stored */
function describePlan(p) {
  if (p.description) return p.description;
  const parts = [];
  if (p.advanceDays) parts.push(`${p.advanceDays}+ days ahead`);
  if (p.minStay) parts.push(`min ${p.minStay} night${p.minStay > 1 ? 's' : ''}`);
  if (p.closeToArrival) parts.push('closed to arrival');
  if (p.closeToDeparture) parts.push('closed to departure');
  return parts.length ? parts.join(' · ') : 'No restrictions';
}

/* Effective rate derived from the rack rate per calculationMethod */
function effectiveRate(plan, rack) {
  if (rack == null) return null;
  const base = Number(plan.baseRate);
  switch (plan.calculationMethod) {
    case 'percent':
      return plan.calculationValue != null
        ? Math.round(rack * (1 - Number(plan.calculationValue) / 100))
        : base;
    case 'amount':
      return plan.calculationValue != null
        ? Math.round(rack - Number(plan.calculationValue))
        : base;
    default:
      return base;
  }
}

export default function RateCodes() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);

  const { data: ratePlans = [], isLoading } = useQuery({
    queryKey: ['rate-plans'],
    queryFn: () => listRatePlans({ pageSize: 100 }),
  });

  const { data: roomTypes = [] } = useQuery({
    queryKey: ['room-types'],
    queryFn: () => listRoomTypes(),
  });

  const { data: channelStatus } = useQuery({
    queryKey: ['channel-status'],
    queryFn: () => getChannelStatus(),
  });

  const rackRate = useMemo(() => {
    const active = ratePlans.filter((p) => p.status !== 'inactive');
    if (!active.length) return null;
    return Math.max(...active.map((p) => Number(p.baseRate)));
  }, [ratePlans]);

  const selected = ratePlans.find((p) => p.id === selectedId) ?? ratePlans[0] ?? null;

  const roomTypeName = (plan) =>
    plan.roomType?.name ??
    roomTypes.find((rt) => rt.id === plan.roomTypeId)?.name ??
    'All room types';

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete rate plan ${plan.code}?`)) return;
    await deleteRatePlan(plan.id);
    queryClient.invalidateQueries({ queryKey: ['rate-plans'] });
  };

  const valueLabel = (plan) => {
    if (plan.calculationMethod === 'percent' && plan.calculationValue != null)
      return `-${plan.calculationValue}%`;
    if (plan.calculationMethod === 'amount' && plan.calculationValue != null)
      return `-$${Number(plan.calculationValue).toFixed(0)}`;
    return '—';
  };

  const detailTiles = selected
    ? [
        { label: 'Base Rate', value: `$${Number(selected.baseRate).toFixed(0)}` },
        {
          label: 'Min Stay',
          value: selected.minStay
            ? `${selected.minStay} night${selected.minStay > 1 ? 's' : ''}`
            : 'None',
        },
        {
          label: 'Advance',
          value: selected.advanceDays ? `${selected.advanceDays}+ days ahead` : 'None',
        },
        { label: 'Channels', value: channelStatus?.active ?? 0 },
      ]
    : [];

  const derivationRows = selected
    ? [
        {
          label: 'Calculation Method',
          value: METHOD_LABELS[selected.calculationMethod] ?? 'Fixed',
        },
        { label: 'Value', value: valueLabel(selected) },
        {
          label: 'Effective Rate (from Rack)',
          value:
            effectiveRate(selected, rackRate) != null
              ? `$${effectiveRate(selected, rackRate)}`
              : '—',
          accent: 'text-accent',
        },
        { label: 'Max Stay', value: selected.maxStay ? `${selected.maxStay} nights` : 'Unlimited' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Rate Codes</h2>
          <p className="text-sm text-text-secondary">
            Manage pricing strategies and derivation rules
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Rate Code
        </button>
      </div>

      {isLoading && <p className="text-sm text-text-muted py-8 text-center">Loading rate codes…</p>}
      {!isLoading && ratePlans.length === 0 && (
        <p className="text-sm text-text-muted py-8 text-center">
          No rate plans found. Create one with the Add Rate Code button.
        </p>
      )}

      {!isLoading && ratePlans.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ─── Left: plan cards (2/5) ─── */}
          <div className="lg:col-span-2 space-y-3">
            {ratePlans.map((p) => {
              const isActive = selected?.id === p.id;
              const eff = effectiveRate(p, rackRate);
              const delta =
                eff != null && rackRate != null && rackRate > 0
                  ? Math.round(((eff - rackRate) / rackRate) * 100)
                  : 0;
              const isRack = eff != null && rackRate != null && eff === rackRate;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    'w-full text-left rounded-xl border p-4 transition-colors',
                    isActive
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border bg-surface hover:bg-surface-elevated/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Tag className="h-4 w-4 text-text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">{p.name}</p>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                          {describePlan(p)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono shrink-0',
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : p.status === 'inactive'
                            ? 'border-border bg-surface-elevated text-text-muted'
                            : 'border-accent/30 bg-accent/10 text-accent'
                      )}
                    >
                      {p.code}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-text-primary">
                      ${eff != null ? eff : Number(p.baseRate).toFixed(0)}
                    </span>
                    {!isRack && delta !== 0 && (
                      <span
                        className={cn(
                          'text-xs font-medium',
                          delta < 0 ? 'text-accent' : 'text-danger'
                        )}
                      >
                        {delta}%
                      </span>
                    )}
                    <span className="text-xs text-text-muted">
                      {isRack ? 'Rack' : (METHOD_LABELS[p.calculationMethod] ?? 'Fixed')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── Right: detail panel (3/5) ─── */}
          {selected && (
            <div className="lg:col-span-3 rounded-xl border border-border bg-surface p-6 space-y-6 lg:sticky lg:top-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-text-primary truncate">
                      {selected.name}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs',
                        selected.status === 'inactive'
                          ? 'border-border bg-surface-elevated text-text-muted'
                          : 'border-accent/30 bg-accent/10 text-accent'
                      )}
                    >
                      {selected.status === 'inactive' ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{describePlan(selected)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface-elevated"
                    title="Edit (form coming soon)"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selected)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger border border-danger/20 rounded-lg text-sm hover:bg-danger/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Stat tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {detailTiles.map((t) => (
                  <div key={t.label} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-text-secondary">{t.label}</p>
                    <p className="text-sm font-semibold text-text-primary mt-1 truncate">
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Derivation rules */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-3">Derivation Rules</h4>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {derivationRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="text-text-secondary">{row.label}</span>
                      <span className={cn('font-medium text-text-primary', row.accent)}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restrictions */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-3">
                  Restrictions &amp; Policies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selected.closeToArrival && (
                    <span className="inline-flex items-center rounded-full bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 text-xs">
                      Closed to Arrival
                    </span>
                  )}
                  {selected.closeToDeparture && (
                    <span className="inline-flex items-center rounded-full bg-warning/10 text-warning border border-warning/20 px-2.5 py-1 text-xs">
                      Closed to Departure
                    </span>
                  )}
                  {selected.minStay && (
                    <span className="inline-flex items-center rounded-full bg-surface-elevated text-text-secondary border border-border px-2.5 py-1 text-xs">
                      Min {selected.minStay} night{selected.minStay > 1 ? 's' : ''}
                    </span>
                  )}
                  {selected.maxStay && (
                    <span className="inline-flex items-center rounded-full bg-surface-elevated text-text-secondary border border-border px-2.5 py-1 text-xs">
                      Max {selected.maxStay} nights
                    </span>
                  )}
                  {selected.advanceDays && (
                    <span className="inline-flex items-center rounded-full bg-surface-elevated text-text-secondary border border-border px-2.5 py-1 text-xs">
                      Book {selected.advanceDays}+ days ahead
                    </span>
                  )}
                  {!selected.closeToArrival &&
                    !selected.closeToDeparture &&
                    !selected.minStay &&
                    !selected.maxStay &&
                    !selected.advanceDays && (
                      <span className="text-sm text-text-muted">No restrictions applied.</span>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
