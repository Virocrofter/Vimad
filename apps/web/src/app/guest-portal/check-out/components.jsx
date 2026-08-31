/* src/app/guest-portal/checkout/components.jsx */
import { cn } from '../../../lib/utils';
import { CheckCircle2, CreditCard, Wallet, Receipt, ArrowRight, Star, Calendar, Hotel, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '../data';

/* ─── Checkout Summary Card ─── */
export function CheckoutSummaryCard({ stay }) {
  const { folio, rate, room, dates } = stay;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Receipt className="h-4 w-4 text-secondary" /> Folio Summary
        </h3>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-medium',
          folio.balance === 0 ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'
        )}>
          {folio.balance === 0 ? 'Paid in Full' : `Balance Due: ${formatCurrency(folio.balance)}`}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Room Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
            <Hotel className="h-5 w-5 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">{room.type} · Room {room.number}</p>
            <p className="text-xs text-text-muted">
              {formatDate(dates.arrival)} – {formatDate(dates.departure)} · {dates.nights} nights
            </p>
          </div>
        </div>

        {/* Charges */}
        <div className="space-y-2">
          {folio.charges.map((charge) => (
            <div key={charge.id} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{charge.description}</span>
              <span className="font-mono text-text-primary">{formatCurrency(charge.amount)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="font-mono text-text-primary">{formatCurrency(rate.total)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Taxes & Fees</span>
            <span className="font-mono text-text-primary">{formatCurrency(rate.taxes + rate.fees)}</span>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Total</span>
            <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(folio.total)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-text-muted">Amount Paid</span>
            <span className="text-sm font-mono text-accent">-{formatCurrency(folio.paid)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-text-muted">Balance</span>
            <span className={cn(
              'text-sm font-bold font-mono',
              folio.balance > 0 ? 'text-danger' : 'text-accent'
            )}>
              {formatCurrency(folio.balance)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Checkout Action Card ─── */
export function CheckoutActionCard({ icon: Icon, label, description, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30 active:scale-95 text-center"
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', color.split(' ')[0])}>
        <Icon className={cn('h-6 w-6', color.split(' ')[1])} />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-[10px] text-text-muted">{description}</p>
      </div>
    </button>
  );
}

/* ─── Express Checkout Button ─── */
export function ExpressCheckoutButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full rounded-xl py-4 text-sm font-bold transition-all active:scale-95',
        disabled
          ? 'bg-border text-text-muted cursor-not-allowed'
          : 'bg-secondary text-white hover:bg-secondary/90 shadow-lg shadow-secondary/20'
      )}
    >
      <span className="flex items-center justify-center gap-2">
        <LogOutIcon className="h-5 w-5" />
        Express Checkout
      </span>
    </button>
  );
}

/* LogOut icon helper */
function LogOutIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
