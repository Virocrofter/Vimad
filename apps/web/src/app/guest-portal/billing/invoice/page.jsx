/* src/app/guest-portal/billing/invoice/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Download, ArrowLeft, Calendar, CheckCircle2, Clock,
  Receipt, Hotel, CreditCard, Mail, Printer, Check
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestStay, pastStays, formatCurrency, formatDate } from '../../data';

export default function InvoicePage() {
  const navigate = useNavigate();
  const { folio, property, dates, room, confirmationNumber } = guestStay;
  const [downloading, setDownloading] = useState(null);
  const [downloaded, setDownloaded] = useState([]);

  const allInvoices = [
    ...folio.invoices.map(inv => ({
      ...inv,
      property: property.name,
      confirmationNumber,
      room: room.number,
      dates: `${formatDate(dates.arrival)} – ${formatDate(dates.departure)}`,
      status: guestStay.status === 'checked_out' ? 'final' : 'pending',
      isCurrent: true,
    })),
    ...pastStays.flatMap(stay => [
      {
        id: `INV-${stay.id}`,
        date: stay.dates.departure,
        type: 'final',
        amount: stay.folio.total,
        property: stay.property.name,
        confirmationNumber: stay.confirmationNumber,
        room: '—',
        dates: `${formatDate(stay.dates.arrival)} – ${formatDate(stay.dates.departure)}`,
        status: 'final',
        isCurrent: false,
      }
    ]),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleDownload = async (id) => {
    setDownloading(id);
    await new Promise(r => setTimeout(r, 1500));
    setDownloading(null);
    setDownloaded(prev => [...prev, id]);
  };

  const handleEmail = async (id) => {
    setDownloading(id + '-email');
    await new Promise(r => setTimeout(r, 1000));
    setDownloading(null);
  };

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
          <p className="text-sm text-text-secondary">Download or email your stay invoices</p>
        </div>
      </div>

      {/* Current Stay Invoice (if not checked out) */}
      {guestStay.status !== 'checked_out' && folio.invoices.length > 0 && (
        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-secondary" />
            <h3 className="text-sm font-semibold text-secondary">Current Stay — In Progress</h3>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold text-text-primary">{property.name}</p>
              <p className="text-sm text-text-muted">Room {room.number} · {formatDate(dates.arrival)} – {formatDate(dates.departure)}</p>
              <p className="text-xs text-text-muted mt-1">Confirmation: {confirmationNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-text-primary">{formatCurrency(folio.total)}</p>
              <p className="text-xs text-text-muted">Estimated total</p>
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
        <div className="divide-y divide-border">
          {allInvoices.map((inv) => (
            <div key={inv.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  inv.status === 'final' ? 'bg-accent/10' : 'bg-warning/10'
                )}>
                  <FileText className={cn('h-5 w-5', inv.status === 'final' ? 'text-accent' : 'text-warning')} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">
                      {inv.type === 'deposit' ? 'Deposit Receipt' : inv.type === 'final' ? 'Final Invoice' : 'Invoice'}
                    </p>
                    {inv.isCurrent && (
                      <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[9px] font-medium text-secondary">CURRENT</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">{inv.property} · {inv.dates}</p>
                  <p className="text-[10px] text-text-muted font-mono mt-0.5">{inv.id} · Conf: {inv.confirmationNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:text-right">
                <div className="sm:text-right">
                  <p className="text-sm font-bold font-mono text-text-primary">{formatCurrency(inv.amount)}</p>
                  <p className="text-[10px] text-text-muted">{formatDate(inv.date)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEmail(inv.id)}
                    disabled={downloading === inv.id + '-email'}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors"
                    title="Email invoice"
                  >
                    {downloading === inv.id + '-email' ? (
                      <Clock className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDownload(inv.id)}
                    disabled={downloading === inv.id}
                    className={cn(
                      'inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium transition-colors',
                      downloaded.includes(inv.id)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {downloading === inv.id ? (
                      <><Clock className="h-3.5 w-3.5 animate-spin" /> Downloading...</>
                    ) : downloaded.includes(inv.id) ? (
                      <><Check className="h-3.5 w-3.5" /> Downloaded</>
                    ) : (
                      <><Download className="h-3.5 w-3.5" /> PDF</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Preview Card */}
      {guestStay.status === 'checked_in' && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Running Folio Preview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Room Charges ({guestStay.dates.nights} nights)</span>
              <span className="font-mono text-text-primary">{formatCurrency(guestStay.rate.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Additional Charges</span>
              <span className="font-mono text-text-primary">{formatCurrency(folio.total - guestStay.rate.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Taxes & Fees</span>
              <span className="font-mono text-text-primary">{formatCurrency(guestStay.rate.taxes + guestStay.rate.fees)}</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="font-medium text-text-primary">Current Total</span>
              <span className="text-lg font-bold font-mono text-text-primary">{formatCurrency(folio.total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Paid</span>
              <span className="font-mono text-accent">-{formatCurrency(folio.paid)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-text-primary">Balance</span>
              <span className={cn('font-bold font-mono', folio.balance > 0 ? 'text-danger' : 'text-accent')}>
                {formatCurrency(folio.balance)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
