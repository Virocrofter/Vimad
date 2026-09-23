/* src/app/guest-portal/billing/components.jsx */
import { cn } from '../../../lib/utils';

/* ─── Folio Line Item ─── */
export function FolioLineItem({ charge, onClick, selected }) {
  const categoryMeta = {
    room: { label: 'Room', color: 'text-secondary', bg: 'bg-secondary/10' },
    dining: { label: 'Dining', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    spa: { label: 'Spa', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    services: { label: 'Services', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  };
  const meta = categoryMeta[charge.category] || categoryMeta.services;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between py-3 px-4 rounded-lg transition-all cursor-pointer',
        selected ? 'bg-secondary/5 border border-secondary/20' : 'hover:bg-background/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', meta.bg)}>
          <span className={cn('text-xs font-bold', meta.color)}>{meta.label[0]}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{charge.description}</p>
          <p className="text-[10px] text-text-muted">{charge.date}</p>
        </div>
      </div>
      <p className="text-sm font-mono font-medium text-text-primary">${charge.amount.toFixed(2)}</p>
    </div>
  );
}

/* ─── Invoice Row ─── */
export function InvoiceRow({ invoice, onDownload, downloading, downloaded }) {
  const typeLabels = { deposit: 'Deposit', final: 'Final', interim: 'Interim' };

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-background/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
          <span className="text-xs font-bold text-accent">
            {typeLabels[invoice.type]?.[0] || 'I'}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            {typeLabels[invoice.type] || 'Invoice'} #{invoice.id}
          </p>
          <p className="text-[10px] text-text-muted">{invoice.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono font-medium text-text-primary">
          ${invoice.amount.toFixed(2)}
        </span>
        <button
          onClick={onDownload}
          disabled={downloading}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors',
            downloaded
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
          )}
        >
          {downloading ? '...' : downloaded ? '✓' : '↓'} PDF
        </button>
      </div>
    </div>
  );
}
