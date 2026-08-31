/* src/app/admin/billing/invoices/page.jsx */
import { useState, useMemo } from 'react';
import {
  Search, Filter, Plus, X, Check, ChevronDown, ChevronUp,
  Download, Send, Eye, FileText, Printer, Trash2, Copy,
  DollarSign, Receipt, AlertTriangle, CheckCircle2, Clock,
  Calendar, Mail, CreditCard
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { invoices, invoiceStatusMeta, formatCurrency, formatDate } from '../data';
import { InvoiceStatusBadge } from '../components';

/* ─── Invoice Detail Drawer ─── */
function InvoiceDrawer({ invoice, onClose }) {
  if (!invoice) return null;

  const statusMeta = invoiceStatusMeta[invoice.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <FileText className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{invoice.id}</h2>
                <p className="text-xs text-text-muted">{invoice.tenantName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <InvoiceStatusBadge status={invoice.status} />
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Amount</p>
              <p className="mt-1 text-xl font-bold font-mono text-text-primary">{formatCurrency(invoice.amount)}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Subtotal</p>
              <p className="mt-1 text-xl font-bold font-mono text-text-primary">{formatCurrency(invoice.subtotal)}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-text-muted uppercase tracking-wider">Tax</p>
              <p className="mt-1 text-xl font-bold font-mono text-text-primary">{formatCurrency(invoice.tax)}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-text-muted" />
                <span className="text-text-muted">Period:</span>
                <span className="text-text-primary">{formatDate(invoice.periodStart)} — {formatDate(invoice.periodEnd)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-text-muted" />
                <span className="text-text-muted">Due Date:</span>
                <span className={cn('text-text-primary', invoice.status === 'overdue' && 'text-danger font-medium')}>
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              {invoice.paidDate && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span className="text-text-muted">Paid:</span>
                  <span className="text-accent">{formatDate(invoice.paidDate)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-text-muted" />
                <span className="text-text-muted">Payment Method:</span>
                <span className="text-text-primary">{invoice.paymentMethod || '—'}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.lineItems.map((item, i) => (
                  <tr key={i} className="hover:bg-background/50">
                    <td className="px-4 py-3 text-text-primary">{item.description}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{formatCurrency(item.unitPrice)}</td>
                    <td className={cn(
                      'px-4 py-3 text-right font-mono font-medium',
                      item.amount < 0 ? 'text-accent' : 'text-text-primary'
                    )}>
                      {item.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-background border-t border-border">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-text-secondary">Total</td>
                  <td className="px-4 py-3 text-right text-sm font-bold font-mono text-text-primary">{formatCurrency(invoice.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm">
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download PDF
            </Button>
            {invoice.status === 'draft' && (
              <Button variant="outline" size="sm" className="text-accent border-accent/30 hover:bg-accent/10">
                <Send className="mr-1.5 h-3.5 w-3.5" /> Send Invoice
              </Button>
            )}
            {invoice.status === 'overdue' && (
              <Button variant="outline" size="sm" className="text-warning border-warning/30 hover:bg-warning/10">
                <Mail className="mr-1.5 h-3.5 w-3.5" /> Send Reminder
              </Button>
            )}
            <Button variant="outline" size="sm" className="ml-auto text-danger border-danger/30 hover:bg-danger/10">
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Void
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function InvoicesPage() {
  const [invList, setInvList] = useState(invoices);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', dir: 'desc' });

  const filteredInvoices = useMemo(() => {
    let result = invList.filter((inv) => {
      const matchesQuery = !query ||
        inv.tenantName.toLowerCase().includes(query.toLowerCase()) ||
        inv.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        return sortConfig.dir === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortConfig.key === 'dueDate') {
        const aDate = a.dueDate ? new Date(a.dueDate) : new Date(0);
        const bDate = b.dueDate ? new Date(b.dueDate) : new Date(0);
        return sortConfig.dir === 'asc' ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });

    return result;
  }, [invList, query, statusFilter, sortConfig]);

  const stats = useMemo(() => ({
    total: invList.reduce((s, i) => s + i.amount, 0),
    paid: invList.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    pending: invList.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0),
    overdue: invList.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
    count: invList.length,
    paidCount: invList.filter(i => i.status === 'paid').length,
    overdueCount: invList.filter(i => i.status === 'overdue').length,
  }), [invList]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invoices</h1>
          <p className="text-sm text-text-secondary">Generate, track, and manage all tenant invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Create Invoice
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Total Invoiced</p>
          <p className="mt-1 text-2xl font-bold font-mono text-text-primary">{formatCurrency(stats.total)}</p>
          <p className="text-xs text-text-muted">{stats.count} invoices</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Collected</p>
          <p className="mt-1 text-2xl font-bold font-mono text-accent">{formatCurrency(stats.paid)}</p>
          <p className="text-xs text-text-muted">{stats.paidCount} paid</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Pending</p>
          <p className="mt-1 text-2xl font-bold font-mono text-warning">{formatCurrency(stats.pending)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Overdue</p>
          <p className="mt-1 text-2xl font-bold font-mono text-danger">{formatCurrency(stats.overdue)}</p>
          <p className="text-xs text-text-muted">{stats.overdueCount} invoices</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search invoices by tenant, ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
              showFilters ? 'border-secondary bg-secondary/10 text-secondary' : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
            )}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-text-secondary">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Draft</option>
                <option value="failed">Failed</option>
                <option value="void">Void</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => { setStatusFilter('all'); setQuery(''); }}
              className="text-xs text-secondary hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <p className="text-sm text-text-muted">
        Showing <span className="font-medium text-text-primary">{filteredInvoices.length}</span> of {invList.length} invoices
      </p>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase w-10">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                {[
                  { key: 'id', label: 'Invoice' },
                  { key: 'tenantName', label: 'Tenant' },
                  { key: 'status', label: 'Status' },
                  { key: 'amount', label: 'Amount' },
                  { key: 'dueDate', label: 'Due Date' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase cursor-pointer hover:text-text-primary select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key && (
                        sortConfig.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-background/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-text-muted" />
                      <div>
                        <p className="text-sm font-medium text-text-primary font-mono">{inv.id}</p>
                        <p className="text-[10px] text-text-muted">{formatDate(inv.periodStart)} — {formatDate(inv.periodEnd)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-primary">{inv.tenantName}</td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono font-medium text-text-primary">{formatCurrency(inv.amount)}</p>
                    <p className="text-[10px] text-text-muted">Tax: {formatCurrency(inv.tax)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className={cn('text-xs', inv.status === 'overdue' ? 'text-danger font-medium' : 'text-text-secondary')}>
                      {formatDate(inv.dueDate)}
                    </p>
                    {inv.paidDate && (
                      <p className="text-[10px] text-accent">Paid {formatDate(inv.paidDate)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <Receipt className="mx-auto h-10 w-10 mb-3" />
                    <p>No invoices match your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selectedInvoice && (
        <InvoiceDrawer
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
