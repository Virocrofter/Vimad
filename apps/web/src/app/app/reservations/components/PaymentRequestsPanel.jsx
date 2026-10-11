/* apps/web/src/app/app/reservations/components/PaymentRequestsPanel.jsx
 * Deposit requests visible on the reservation folio — pay-now links,
 * reminder status, auto-cancel outcome.
 */
import { useState } from 'react';
import { Plus, Mail, Ban, Copy, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  usePaymentRequests,
  usePaymentRequestMutations,
} from '../../../../hooks/usePaymentRequests';
import { paymentRequestsApi } from '../../../../api/payment-requests';

const fmtMoney = (minor, currency) => {
  const sym = currency === 'ZAR' ? 'R' : '$';
  return `${sym} ${((minor ?? 0) / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function PaymentRequestsPanel({ reservationId }) {
  const { data, loading, refetch } = usePaymentRequests({ reservationId, pageSize: 10 });
  const mutations = usePaymentRequestMutations(refetch);
  const [copied, setCopied] = useState(null);
  const [creating, setCreating] = useState(false);
  const [percent, setPercent] = useState(50);
  const [error, setError] = useState(null);

  const copy = (row) => {
    navigator.clipboard.writeText(row.hostedUrl);
    setCopied(row.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const quickCreate = async () => {
    setError(null);
    try {
      await paymentRequestsApi.create({ reservationId, depositPercent: Number(percent) });
      setCreating(false);
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create request');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Deposit Requests
        </h3>
        {!creating ? (
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Request deposit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-sm text-text-muted">%</span>
            <Button size="sm" onClick={quickCreate}>
              Send
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
              ×
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-text-muted">
          No deposit requests. Send the guest a pay-now link to secure this booking.
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium text-text-primary">
                  {fmtMoney(row.amountMinor, row.currency)}{' '}
                  <span className="text-text-muted">({row.depositPercent}%)</span>
                </div>
                <div className="text-xs text-text-muted capitalize">
                  {row.status}
                  {row.paidAt && ` · paid ${new Date(row.paidAt).toLocaleDateString()}`}
                  {['pending', 'sent'].includes(row.status) &&
                    ` · due ${new Date(row.dueDate).toLocaleDateString()}`}
                  {row.reservationCancelled && ' · reservation auto-cancelled'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {row.hostedUrl && (
                  <button
                    onClick={() => copy(row)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                    title="Copy pay link"
                  >
                    {copied === row.id ? (
                      <Check className="h-4 w-4 text-accent" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
                {['pending', 'sent'].includes(row.status) && (
                  <>
                    <button
                      onClick={() => mutations.send(row.id)}
                      disabled={mutations.busy === `send-${row.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary disabled:opacity-50"
                      title="Send reminder"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => mutations.cancel(row.id)}
                      disabled={mutations.busy === `cancel-${row.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-danger disabled:opacity-50"
                      title="Cancel request"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
