/* src/app/guest-portal/billing/split/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Plus,
  CheckCircle2,
  Receipt,
  Mail,
  Loader2,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useGuestFolio, useStayDetails, getGuestToken } from '../../../../hooks/useGuestPortalData';
import { useGuestSplits, useSplitCreate, newIdempotencyKey } from '../../../../hooks/useGuestPay';
import { formatCurrency, formatDate, folioCategoryMeta } from '../../../../lib/guest-utils';

const splitStatusMeta = {
  pending: { label: 'Sent to front desk', chip: 'bg-warning/10 text-warning border-warning/20' },
  accepted: { label: 'Accepted — being set up', chip: 'bg-accent/10 text-accent border-accent/20' },
  declined: { label: 'Declined', chip: 'bg-danger/10 text-danger border-danger/20' },
  applied: { label: 'Applied', chip: 'bg-accent/10 text-accent border-accent/20' },
  cancelled: { label: 'Cancelled', chip: 'bg-danger/10 text-danger border-danger/20' },
};

function categoryForType(type) {
  const map = { lodging: 'room', room: 'room', dining: 'dining', restaurant: 'dining', spa: 'spa' };
  return map[type] ?? 'services';
}

export default function SplitBillPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay } = useStayDetails();
  const { data: folioData, isLoading, isError, refetch } = useGuestFolio();
  const { data: splitsData } = useGuestSplits();
  const splitCreate = useSplitCreate();

  const [participants, setParticipants] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok, text }

  const items = folioData?.items ?? [];
  const splits = splitsData?.splits ?? [];

  const participantTotals = useMemo(() => {
    const totals = {};
    participants.forEach((p) => {
      totals[p.id] = 0;
    });
    Object.entries(assignments).forEach(([chargeId, participantId]) => {
      const charge = items.find((c) => c.id === chargeId);
      if (charge && totals[participantId] !== undefined) {
        totals[participantId] += charge.amount * charge.quantity;
      }
    });
    return totals;
  }, [assignments, participants, items]);

  const unassignedTotal = useMemo(() => {
    return items.filter((c) => !assignments[c.id]).reduce((s, c) => s + c.amount * c.quantity, 0);
  }, [assignments, items]);

  if (!hasToken) {
    navigate('/guest-portal/auth/login', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your folio…</p>
      </div>
    );
  }

  if (isError || !folioData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load your folio.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const handleAddGuest = () => {
    if (!newGuestName.trim()) return;
    if (!newGuestEmail.trim() && !newGuestPhone.trim()) return;
    const newId = `P-${Date.now()}`;
    setParticipants((prev) => [
      ...prev,
      {
        id: newId,
        name: newGuestName.trim(),
        email: newGuestEmail.trim() || null,
        phone: newGuestPhone.trim() || null,
        avatar: newGuestName
          .trim()
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
      },
    ]);
    setNewGuestName('');
    setNewGuestEmail('');
    setNewGuestPhone('');
    setShowAddGuest(false);
  };

  const handleAssign = (chargeId, participantId) => {
    setAssignments((prev) => ({ ...prev, [chargeId]: participantId }));
  };

  const handleUnassign = (chargeId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[chargeId];
      return next;
    });
  };

  const handleSendRequests = async () => {
    setFeedback(null);
    const targets = participants.filter((p) => participantTotals[p.id] > 0);
    try {
      await Promise.all(
        targets.map((p) =>
          splitCreate.mutateAsync({
            toName: p.name,
            toEmail: p.email ?? undefined,
            toPhone: p.phone ?? undefined,
            amount: Math.round(participantTotals[p.id] * 100) / 100,
            note: `Split for reservation ${folioData.confirmationNumber}`,
          })
        )
      );
      setFeedback({
        ok: true,
        text: `Split request${targets.length > 1 ? 's' : ''} sent — the front desk will send ${
          targets.length > 1 ? 'pay links to your guests' : 'a pay link to your guest'
        }.`,
      });
    } catch (err) {
      setFeedback({
        ok: false,
        text: err?.message ?? 'Could not send the split request. Please try again.',
      });
    }
  };

  const assignedCount = Object.keys(assignments).length;
  const pendingSplits = splits.filter((s) => s.status === 'pending' || s.status === 'accepted');

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/billing')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Split Bill</h1>
          <p className="text-xs text-text-muted">
            Assign charges — the front desk sends each guest a secure pay link
          </p>
        </div>
      </div>

      {/* Participants */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Guests</h3>
        {participants.length === 0 && (
          <p className="text-xs text-text-muted">
            Add the guests you'd like to split charges with (email or phone required).
          </p>
        )}
        <div className="space-y-2">
          {participants.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                  {p.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted">
                    {participantTotals[p.id] > 0
                      ? `Assigned ${formatCurrency(Math.round(participantTotals[p.id] * 100) / 100)}`
                      : 'No charges assigned'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAddGuest ? (
          <div className="space-y-2">
            <input
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              placeholder="Guest name"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              value={newGuestEmail}
              onChange={(e) => setNewGuestEmail(e.target.value)}
              placeholder="Email (or phone below)"
              type="email"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex items-center gap-2">
              <input
                value={newGuestPhone}
                onChange={(e) => setNewGuestPhone(e.target.value)}
                placeholder="Phone (if no email)"
                className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                size="sm"
                onClick={handleAddGuest}
                disabled={!newGuestName.trim() || (!newGuestEmail.trim() && !newGuestPhone.trim())}
              >
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowAddGuest(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Guest
          </Button>
        )}
      </div>

      {/* Folio Charges */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Receipt className="h-4 w-4 text-secondary" /> Folio Charges
          </h3>
          <span className="text-xs text-text-muted">
            {assignedCount} of {items.length} assigned
          </span>
        </div>
        <div className="divide-y divide-border">
          {items.map((charge) => {
            const cat = categoryForType(charge.type);
            const meta = folioCategoryMeta[cat] || folioCategoryMeta.services;
            const assignedTo = assignments[charge.id]
              ? participants.find((p) => p.id === assignments[charge.id])
              : null;
            return (
              <div key={charge.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {charge.description}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {meta.label} · {formatDate(charge.postedAt)}
                    </p>
                  </div>
                  <p className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(charge.amount * charge.quantity)}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {assignedTo ? (
                    <button
                      onClick={() => handleUnassign(charge.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-medium text-secondary hover:bg-secondary/20"
                    >
                      {assignedTo.name} ×
                    </button>
                  ) : (
                    <>
                      <span className="text-[10px] text-text-muted mr-1">Assign:</span>
                      {participants.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleAssign(charge.id, p.id)}
                          className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-medium text-text-secondary hover:border-secondary/40 hover:text-secondary"
                        >
                          {p.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
        <h3 className="text-sm font-semibold text-text-primary">Summary</h3>
        {participants
          .filter((p) => participantTotals[p.id] > 0)
          .map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{p.name}</span>
              <span className="font-mono font-medium text-text-primary">
                {formatCurrency(Math.round(participantTotals[p.id] * 100) / 100)}
              </span>
            </div>
          ))}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
          <span className="text-text-secondary">{stay?.guestName ?? 'My folio'} (remaining)</span>
          <span className="font-mono font-medium text-text-primary">
            {formatCurrency(Math.round(unassignedTotal * 100) / 100)}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            feedback.ok ? 'border-accent/20 bg-accent/5' : 'border-danger/20 bg-danger/5'
          )}
        >
          {feedback.ok ? (
            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          )}
          <p className="text-sm text-text-primary">{feedback.text}</p>
        </div>
      )}

      {/* Send */}
      <Button
        className="w-full"
        disabled={participants.length === 0 || assignedCount === 0 || splitCreate.isPending}
        onClick={handleSendRequests}
      >
        {splitCreate.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" /> Send Split Requests to Front Desk
          </>
        )}
      </Button>

      {/* Existing split requests */}
      {splits.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" /> Your split requests
            </h3>
          </div>
          <div className="divide-y divide-border">
            {splits.map((s) => {
              const meta = splitStatusMeta[s.status] ?? splitStatusMeta.pending;
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {s.toName}
                      {s.toEmail && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-text-muted">
                          <Mail className="h-3 w-3" /> {s.toEmail}
                        </span>
                      )}
                      {s.toPhone && !s.toEmail && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-text-muted">
                          <Phone className="h-3 w-3" /> {s.toPhone}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-text-muted">{formatDate(s.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono font-medium text-text-primary">
                      {formatCurrency(s.amount)}
                    </span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        meta.chip
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-text-muted flex items-center justify-center gap-1">
        <Users className="h-3 w-3" />
        {pendingSplits.length > 0
          ? 'The front desk is setting up your pending splits.'
          : 'Guests pay via a secure Paystack link sent by the hotel.'}
      </p>
    </div>
  );
}
