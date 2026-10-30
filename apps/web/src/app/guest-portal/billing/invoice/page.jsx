/* src/app/guest-portal/billing/invoice/page.jsx */
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Clock, Receipt, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { useGuestFolio, useStayDetails, getGuestToken } from '../../../../hooks/useGuestPortalData';
import { formatCurrency, formatDate } from '../../../../lib/guest-utils';

const typeLabel = {
  deposit: 'Deposit Receipt',
  final: 'Final Invoice',
  tax_invoice: 'Tax Invoice',
  credit_note: 'Credit Note',
  interim: 'Interim Invoice',
  receipt: 'Receipt',
};

export default function InvoicePage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data: stay } = useStayDetails();
  const { data: folioData, isLoading, isError, error, refetch } = useGuestFolio();

  if (!hasToken) {
    navigate('/guest-portal/auth/login', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your invoices…</p>
      </div>
    );
  }

  if (isError || !folioData) {
    const expired = error?.status === 401 || error?.status === 403;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">
          {expired
            ? 'Your session has expired. Please verify your reservation again.'
            : 'We couldn’t load your invoices.'}
        </p>
        <div className="mt-4 flex gap-2">
          {expired ? (
            <Button onClick={() => navigate('/guest-portal/auth/login')}>Verify again</Button>
          ) : (
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  const invoices = folioData.invoices;
  const folio = folioData.folio;
  const inStay = stay && !stay.checkedIn ? false : stay?.checkedIn;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/billing')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invoices & Receipts</h1>
          <p className="text-sm text-text-secondary">
            Invoices for reservation {folioData.confirmationNumber}
          </p>
        </div>
      </div>

      {/* Current Stay — In Progress */}
      {inStay && folio && (
        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-secondary" />
            <h3 className="text-sm font-semibold text-secondary">Current Stay — In Progress</h3>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold text-text-primary">{stay.propertyName}</p>
              <p className="text-sm text-text-muted">
                {formatDate(stay.arrivalDate)} – {formatDate(stay.departureDate)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Confirmation: {stay.confirmationNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-text-primary">
                {formatCurrency(folio.totalCharges)}
              </p>
              <p className="text-xs text-text-muted">Running total</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
              Pending Checkout
            </span>
            <span className="text-xs text-text-muted">Final invoice available after checkout</span>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Receipt className="h-4 w-4 text-secondary" /> All Invoices
          </h3>
        </div>
        {invoices.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No invoices yet</p>
            <p className="text-xs text-text-secondary mt-1">
              Invoices are issued as payments are recorded and at checkout.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      inv.type === 'credit_note' ? 'bg-danger/10' : 'bg-accent/10'
                    )}
                  >
                    <FileText
                      className={cn(
                        'h-5 w-5',
                        inv.type === 'credit_note' ? 'text-danger' : 'text-accent'
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {typeLabel[inv.type] ?? 'Invoice'}
                    </p>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">{inv.number}</p>
                    <p className="text-[10px] text-text-muted">
                      Issued {formatDate(inv.createdAt)} · {inv.status}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-bold font-mono text-text-primary">
                    {formatCurrency(inv.totalInclVat ?? 0, inv.currency ?? 'ZAR')}
                  </p>
                  <p className="text-[10px] text-text-muted">{formatDate(inv.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Running Folio Preview */}
      {inStay && folio && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Running Folio Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">
                Room Charges ({folioData.roomRate.nights} nights)
              </span>
              <span className="font-mono text-text-primary">
                {formatCurrency(folioData.roomRate.total)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Additional Charges</span>
              <span className="font-mono text-text-primary">
                {formatCurrency(Math.max(0, folio.totalCharges - folioData.roomRate.total))}
              </span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="font-medium text-text-primary">Current Total</span>
              <span className="text-lg font-bold font-mono text-text-primary">
                {formatCurrency(folio.totalCharges)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Paid</span>
              <span className="font-mono text-accent">-{formatCurrency(folio.totalPayments)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text-primary">Balance</span>
              <span
                className={cn(
                  'font-bold font-mono',
                  folio.balance > 0 ? 'text-danger' : 'text-accent'
                )}
              >
                {formatCurrency(folio.balance)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
