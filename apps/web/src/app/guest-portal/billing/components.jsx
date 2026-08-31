/* src/app/guest-portal/billing/components.jsx */
import { useState } from 'react';
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

/* ─── Payment Method Card ─── */
export function PaymentMethodCard({ method, selected, onSelect }) {
  const brandIcons = {
    visa: 'VISA',
    mastercard: 'MC',
    amex: 'AMEX',
  };

  return (
    <button
      onClick={() => onSelect(method.id)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-secondary bg-secondary/5'
          : 'border-border bg-surface hover:border-secondary/30'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-14 items-center justify-center rounded-md font-bold text-xs',
          method.brand === 'visa'
            ? 'bg-blue-600 text-white'
            : method.brand === 'mastercard'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-600 text-white'
        )}
      >
        {brandIcons[method.brand] || method.brand.toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">
          {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} ending {method.last4}
        </p>
        <p className="text-xs text-text-muted">Expires {method.expiry}</p>
      </div>
      {method.isDefault && (
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
          Default
        </span>
      )}
      <div
        className={cn(
          'h-4 w-4 rounded-full border-2 flex items-center justify-center',
          selected ? 'border-secondary bg-secondary' : 'border-border'
        )}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>
    </button>
  );
}

/* ─── Invoice Row ─── */
export function InvoiceRow({ invoice, onDownload, onEmail, downloading, downloaded }) {
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
