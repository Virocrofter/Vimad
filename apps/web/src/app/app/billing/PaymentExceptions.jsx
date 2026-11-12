/* apps/web/src/app/app/billing/PaymentExceptions.jsx
 * Payment exception worklist (roadmap addendum 5.3, Phase 3 slice #4).
 * Failed charges + stale pendings, each with the SERVER's validActions:
 *   verify  -> re-query the provider (never trust the browser redirect)
 *   retry   -> new hosted checkout for the same reservation (failed only —
 *              a fresh reference is minted server-side; no double charge)
 *   send link -> payment-request to the guest (failed only)
 *   dismiss -> reason REQUIRED, audited (P11 contract)
 * Stale pendings deliberately offer NO retry: re-charging a charge that may
 * be in flight risks a double charge. Loading/error never masquerade as
 * zero; color always paired with text.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, CreditCard, Link2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { usePaymentExceptions } from '../../../hooks/usePaymentExceptions';
import { dismissPaymentException, initializePayment, verifyPayment } from '../../../api/payments';
import { paymentRequestsApi } from '../../../api/payment-requests';
import { cn } from '../../../lib/utils';

const money = (minor, c = 'ZAR') =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: 2,
  }).format((minor ?? 0) / 100);

function DismissPrompt({ item, onConfirm, onCancel, busy }) {
  const [reason, setReason] = useState('');
  return (
    <div className="mt-2 rounded-md border border-warning/40 bg-surface p-2">
      <p className="text-[11px] font-medium text-text-primary">
        Dismiss {item.reference} — reason required (audited)
      </p>
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. guest settling on arrival"
        className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs"
      />
      <div className="mt-1.5 flex gap-1.5">
        <button
          disabled={busy || !reason.trim()}
          onClick={() => onConfirm(reason.trim())}
          className="rounded bg-danger px-2 py-0.5 text-[11px] font-medium text-white disabled:opacity-40"
        >
          {busy ? '…' : 'Confirm'}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-border px-2 py-0.5 text-[11px] text-text-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PaymentExceptions() {
  const q = usePaymentExceptions();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState(null);
  const [dismissFor, setDismissFor] = useState(null);
  const [notice, setNotice] = useState(null); // {kind, text}
  const invalidate = () => qc.invalidateQueries({ queryKey: ['payment-exceptions'] });

  const run = async (item, kind, fn) => {
    setBusyId(item.id + kind);
    setNotice(null);
    try {
      await fn();
      await invalidate();
    } catch (e) {
      setNotice({ kind: 'error', text: e?.response?.data?.error?.message ?? e.message });
    } finally {
      setBusyId(null);
    }
  };

  const verify = (item) =>
    run(item, 'verify', async () => {
      await verifyPayment(item.reference);
      setNotice({ kind: 'ok', text: `Re-queried provider for ${item.reference}.` });
    });

  const retry = (item) =>
    run(item, 'retry', async () => {
      const { data } = await initializePayment({
        reservationId: item.reservationId,
        amountMinor: item.amountMinor,
      });
      if (data?.authorizationUrl) window.open(data.authorizationUrl, '_blank', 'noopener');
    });

  const sendLink = (item) =>
    run(item, 'link', async () => {
      const { data } = await paymentRequestsApi.create({
        reservationId: item.reservationId,
        amountMinor: item.amountMinor,
        dueDate: new Date(Date.now() + 2 * 86400_000).toISOString(),
        description: 'Balance settlement',
      });
      await paymentRequestsApi.send(data.id);
      setNotice({ kind: 'ok', text: `Payment link sent for ${item.reference}.` });
    });

  const dismiss = (item, reason) =>
    run(item, 'dismiss', async () => {
      await dismissPaymentException(item.id, reason);
      setDismissFor(null);
    });

  if (q.isLoading) return <div className="h-40 animate-pulse rounded-xl bg-surface-elevated" />;
  if (q.isError) {
    return (
      <div className="rounded-xl border border-danger/30 bg-surface p-6 text-center">
        <p className="text-sm font-medium">Payment exceptions failed to load</p>
        <p className="mt-1 text-xs text-text-secondary">
          {q.error?.response?.data?.error?.message ?? q.error?.message}
        </p>
        <button
          onClick={() => q.refetch()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  const items = q.data.items;

  return (
    <section aria-label="Payment exceptions" className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-text-primary">Payments needing attention</h2>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold',
            items.length ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent-foreground'
          )}
        >
          {items.length}
        </span>
        <span className="ml-auto text-[11px] text-text-muted">
          updated{' '}
          {new Date(q.data.generatedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {notice && (
        <p
          className={cn(
            'rounded-md border px-3 py-2 text-xs',
            notice.kind === 'error'
              ? 'border-danger/30 bg-danger/10 text-danger'
              : 'border-accent/30 bg-accent/10 text-accent-foreground'
          )}
        >
          {notice.text}
        </p>
      )}

      {items.length === 0 ? (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-6 text-xs text-text-muted">
          <ShieldCheck className="h-4 w-4 text-accent-foreground" /> No failed or unsettled
          payments. Everything reconciles.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-text-muted">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Guest</th>
                <th className="px-4 py-2.5">Reference</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Detail</th>
                <th className="px-4 py-2.5 text-right">Safe actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                        item.type === 'failed'
                          ? 'border-danger/30 bg-danger/10 text-danger'
                          : 'border-warning/40 bg-warning/10 text-warning'
                      )}
                    >
                      {item.type === 'failed' ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {item.type === 'failed' ? 'Failed' : 'Unsettled 2h+'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-primary">
                    {item.guestName ?? '—'}
                    {item.confirmationNumber && (
                      <span className="block text-[10px] text-text-muted">
                        {item.confirmationNumber}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-text-secondary">
                    {item.reference}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-text-primary">
                    {money(item.amountMinor, item.currency)}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-text-secondary">
                    {item.type === 'failed'
                      ? (item.failureReason ?? 'unknown failure')
                      : `pending ${item.ageMinutes}m — verify with provider`}
                    {item.folioBalance != null && item.folioBalance > 0 && (
                      <span className="block text-warning">
                        folio balance {money(Math.round(item.folioBalance * 100), item.currency)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {item.validActions.includes('verify') && (
                        <button
                          disabled={!!busyId}
                          onClick={() => verify(item)}
                          title="Re-query the provider"
                          className="rounded border border-border px-2 py-1 text-[11px] font-medium text-text-secondary hover:bg-surface-elevated disabled:opacity-40"
                        >
                          {busyId === item.id + 'verify' ? '…' : 'Verify'}
                        </button>
                      )}
                      {item.validActions.includes('retry') && (
                        <button
                          disabled={!!busyId}
                          onClick={() => retry(item)}
                          title="New hosted checkout (fresh reference)"
                          className="rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-40"
                        >
                          <CreditCard className="mr-1 inline h-3 w-3" />
                          {busyId === item.id + 'retry' ? '…' : 'Retry'}
                        </button>
                      )}
                      {item.validActions.includes('send-payment-link') && (
                        <button
                          disabled={!!busyId}
                          onClick={() => sendLink(item)}
                          title="Send the guest a hosted payment link"
                          className="rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground disabled:opacity-40"
                        >
                          <Link2 className="mr-1 inline h-3 w-3" />
                          {busyId === item.id + 'link' ? '…' : 'Send link'}
                        </button>
                      )}
                      {item.validActions.includes('dismiss') && (
                        <button
                          disabled={!!busyId}
                          onClick={() => setDismissFor(dismissFor?.id === item.id ? null : item)}
                          title="Acknowledge with a reason (audited)"
                          className="rounded border border-warning/40 px-2 py-1 text-[11px] font-medium text-warning disabled:opacity-40"
                        >
                          <X className="mr-1 inline h-3 w-3" />
                          Dismiss
                        </button>
                      )}
                    </div>
                    {dismissFor?.id === item.id && (
                      <DismissPrompt
                        item={item}
                        busy={busyId === item.id + 'dismiss'}
                        onConfirm={(r) => dismiss(item, r)}
                        onCancel={() => setDismissFor(null)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
