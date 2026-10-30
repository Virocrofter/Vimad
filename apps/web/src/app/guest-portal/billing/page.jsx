/* src/app/guest-portal/billing/page.jsx */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Clock,
  XCircle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { useGuestFolio, useStayDetails, getGuestToken } from '../../../hooks/useGuestPortalData';
import {
  useGuestPayPayments,
  useGuestPayRequests,
  usePayInitialize,
  usePayVerify,
  newIdempotencyKey,
} from '../../../hooks/useGuestPay';
import { formatCurrency, formatDate, folioCategoryMeta } from '../../../lib/guest-utils';

const payStatusMeta = {
  success: { label: 'Paid', chip: 'bg-accent/10 text-accent border-accent/20' },
  pending: { label: 'Pending', chip: 'bg-warning/10 text-warning border-warning/20' },
  failed: { label: 'Failed', chip: 'bg-danger/10 text-danger border-danger/20' },
};

const splitStatusMeta = {
  pending: { label: 'Awaiting response', chip: 'bg-warning/10 text-warning border-warning/20' },
  accepted: {
    label: 'Accepted — front desk notified',
    chip: 'bg-accent/10 text-accent border-accent/20',
  },
  declined: { label: 'Declined', chip: 'bg-danger/10 text-danger border-danger/20' },
  applied: { label: 'Applied to folio', chip: 'bg-accent/10 text-accent border-accent/20' },
};

function categoryForType(type) {
  const map = {
    lodging: 'room',
    room: 'room',
    dining: 'dining',
    restaurant: 'dining',
    spa: 'spa',
    payment: 'services',
  };
  return map[type] ?? 'services';
}

export default function BillingPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay } = useStayDetails();
  const { data: folioData, isLoading, isError, refetch } = useGuestFolio();

  const { data: payData } = useGuestPayPayments();
  const { data: reqData } = useGuestPayRequests();
  const payInit = usePayInitialize();
  const payVerify = usePayVerify();

  const [payMsg, setPayMsg] = useState(null); // { ok, text }
  const verifiedRef = useRef(false);

  // Paystack redirects back with ?trxref=... — settle server-side once.
  useEffect(() => {
    if (verifiedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('trxref') || params.get('reference');
    if (ref && getGuestToken()) {
      verifiedRef.current = true;
      window.history.replaceState({}, '', '/guest-portal/billing');
      payVerify.mutate(ref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (payVerify.isSuccess) {
      const v = payVerify.data;
      setPayMsg(
        v.status === 'success' && v.postedToFolio
          ? {
              ok: true,
              text: `Payment received — ${formatCurrency(v.amountMinor / 100)} posted to your folio.`,
            }
          : v.status === 'failed'
            ? { ok: false, text: 'The payment did not complete. No charge was made to your folio.' }
            : null
      );
    }
    if (payVerify.isError) {
      setPayMsg({
        ok: false,
        text:
          payVerify.error?.message ??
          'Could not confirm the payment yet — it may still be processing.',
      });
    }
  }, [payVerify.isSuccess, payVerify.isError, payVerify.data, payVerify.error]);

  if (!hasToken) {
    navigate('/guest-portal/auth/login', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your bill…</p>
      </div>
    );
  }

  if (isError || !folioData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load your bill.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const folio = folioData.folio;
  const balance = folio ? Number(folio.balance) : 0;
  const totalCharges = folio ? Number(folio.totalCharges) : 0;
  const totalPayments = folio ? Number(folio.totalPayments) : 0;
  const items = folioData.items ?? [];
  const invoices = folioData.invoices ?? [];
  const payments = payData?.payments ?? [];
  const requests = (reqData?.requests ?? []).filter((r) => !r.paidAt);

  const startCheckout = (amountMinor, paymentRequestId) => {
    setPayMsg(null);
    payInit.mutate(
      { amountMinor, paymentRequestId, idempotencyKey: newIdempotencyKey() },
      {
        onSuccess: (d) => {
          if (d.authorizationUrl) {
            window.location.href = d.authorizationUrl;
          } else {
            setPayMsg({
              ok: false,
              text: 'Could not start the payment session. Please try again.',
            });
          }
        },
        onError: (e) => setPayMsg({ ok: false, text: e.message }),
      }
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Billing</h1>
          <p className="text-xs text-text-muted">
            {stay?.propertyName ?? 'Hotel'} · {folioData.confirmationNumber}
          </p>
        </div>
      </div>

      {/* Verify-return feedback */}
      {payVerify.isPending && (
        <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-secondary shrink-0" />
          <p className="text-sm text-text-primary">Confirming your payment…</p>
        </div>
      )}
      {payMsg && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            payMsg.ok ? 'border-accent/20 bg-accent/5' : 'border-danger/20 bg-danger/5'
          )}
        >
          {payMsg.ok ? (
            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          )}
          <p className="text-sm text-text-primary">{payMsg.text}</p>
        </div>
      )}

      {/* Balance + pay */}
      {folio && balance > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-text-muted">Balance due</p>
              <p className="text-2xl font-bold font-mono text-text-primary">
                {formatCurrency(balance)}
              </p>
            </div>
            <Button
              onClick={() => startCheckout(Math.round(balance * 100))}
              disabled={payInit.isPending}
            >
              {payInit.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" /> Pay now
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-text-muted flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Secured by Paystack — your card details never touch this portal.
          </p>
        </div>
      )}
      {folio && balance <= 0 && totalCharges > 0 && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          <p className="text-sm text-text-primary">Your folio is settled — nothing to pay.</p>
        </div>
      )}

      {/* Staff payment requests (pay links) */}
      {requests.length > 0 && (
        <div className="rounded-xl border border-warning/20 bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" /> Payment requests
            </h3>
          </div>
          <div className="divide-y divide-border">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {r.description || 'Payment requested by the hotel'}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    Due {formatDate(r.dueDate)} · Ref {r.reference}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(r.amountMinor / 100)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => startCheckout(undefined, r.id)}
                    disabled={payInit.isPending}
                  >
                    Pay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">Total charges</p>
          <p className="text-lg font-bold font-mono text-text-primary">
            {formatCurrency(totalCharges)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted mb-1">Total payments</p>
          <p className="text-lg font-bold font-mono text-accent">{formatCurrency(totalPayments)}</p>
        </div>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Payments</h3>
          </div>
          <div className="divide-y divide-border">
            {payments.map((p) => {
              const meta = payStatusMeta[p.status] ?? payStatusMeta.pending;
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.status === 'failed' ? (
                      <XCircle className="h-4 w-4 text-danger shrink-0" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-secondary shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {p.cardBrand ? `${p.cardBrand} •••• ${p.cardLast4}` : 'Card payment'}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {formatDate(p.createdAt)} · {p.reference}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono font-medium text-text-primary">
                      {formatCurrency(p.amountMinor / 100)}
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

      {/* Folio line items */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Receipt className="h-4 w-4 text-secondary" /> Folio charges
          </h3>
          <span className="text-xs text-text-muted">{items.length} items</span>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-muted">No charges yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => {
              const cat = categoryForType(item.type);
              const meta = folioCategoryMeta[cat] || folioCategoryMeta.services;
              return (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn('flex h-8 w-8 items-center justify-center rounded-md', meta.bg)}
                    >
                      <span className={cn('text-xs font-bold', meta.color)}>{meta.label[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.description}</p>
                      <p className="text-[10px] text-text-muted">{formatDate(item.postedAt)}</p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      'text-sm font-mono font-medium',
                      item.type === 'payment' ? 'text-accent' : 'text-text-primary'
                    )}
                  >
                    {formatCurrency(item.amount * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Tax invoices</h3>
          </div>
          <div className="divide-y divide-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">Invoice {inv.number}</p>
                  <p className="text-[10px] text-text-muted">{formatDate(inv.createdAt)}</p>
                </div>
                <span className="text-sm font-mono font-medium text-text-primary">
                  {formatCurrency(inv.totalInclVat)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
