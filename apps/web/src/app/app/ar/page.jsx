/* apps/web/src/app/app/ar/page.jsx
 * Accounts Receivable — corporate ledger.
 * Replaces the fully-mocked page with live data from /v1/ar.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  X,
  Send,
  Ban,
  RotateCcw,
  Building2,
  FileText,
  Wallet,
  Download,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { getArStatementCsvUrl, getArStatement } from '../../../api/ar';
import {
  useArSummary,
  useArAccounts,
  useArAccount,
  useArInvoices,
  useArInvoice,
  useArPayments,
  useCreateArAccount,
  useUpdateArAccount,
  useCreateArInvoice,
  useSendArInvoice,
  useCancelArInvoice,
  useRecordArPayment,
  useReverseArPayment,
} from '../../../hooks/useAr';

// ─── Helpers ───

const fmtMoney = (n) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(n ?? 0));

const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');

const STATUS_STYLE = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  partially_paid: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-400 line-through',
};

const STATUS_LABEL = {
  draft: 'Draft',
  sent: 'Sent',
  partially_paid: 'Partial',
  overdue: 'Overdue',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300';
const thCls = 'px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
const tdCls = 'px-4 py-2.5 text-sm text-slate-700';

// ─── Small building blocks ───

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, alert }) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        alert ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${alert ? 'text-red-600' : 'text-slate-900'}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function AgingBar({ buckets }) {
  const entries = [
    ['Not due', buckets?.not_due ?? 0, 'bg-slate-300'],
    ['1–30', buckets?.['1-30'] ?? 0, 'bg-amber-400'],
    ['31–60', buckets?.['31-60'] ?? 0, 'bg-orange-500'],
    ['61–90', buckets?.['61-90'] ?? 0, 'bg-red-500'],
    ['90+', buckets?.['90+'] ?? 0, 'bg-red-700'],
  ];
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Aging — outstanding by bucket
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-md">
        {entries.map(([label, v, cls]) => (
          <div
            key={label}
            title={`${label}: ${fmtMoney(v)}`}
            style={{ width: `${(v / total) * 100}%` }}
            className={`${cls} h-full border-r border-white last:border-0`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-4">
        {entries.map(([label, v, cls]) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cls}`} />
            {label}: <span className="font-medium">{fmtMoney(v)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <Badge className={`${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-700'} hover:bg-none`}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

// ─── New account modal ───

function NewAccountModal({ onClose }) {
  const { toast } = useToast();
  const createAccount = useCreateArAccount();
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    taxNumber: '',
    billingEmail: '',
    paymentTermsDays: 30,
    creditLimit: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    createAccount.mutate(
      {
        name: form.name,
        contactName: form.contactName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        taxNumber: form.taxNumber || undefined,
        billingEmail: form.billingEmail || undefined,
        paymentTermsDays: Number(form.paymentTermsDays) || 30,
        creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Account created' });
          onClose();
        },
        onError: (err) =>
          toast({
            title: 'Failed to create account',
            description: err.message,
            variant: 'destructive',
          }),
      }
    );
  };

  return (
    <Modal title="New corporate account" onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <label className="col-span-2 text-xs font-medium text-slate-600">
          Company name *
          <input className={inputCls} value={form.name} onChange={set('name')} required />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Contact
          <input className={inputCls} value={form.contactName} onChange={set('contactName')} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Phone
          <input className={inputCls} value={form.phone} onChange={set('phone')} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          AP email
          <input className={inputCls} type="email" value={form.email} onChange={set('email')} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Billing email
          <input
            className={inputCls}
            type="email"
            value={form.billingEmail}
            onChange={set('billingEmail')}
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          VAT / tax number
          <input className={inputCls} value={form.taxNumber} onChange={set('taxNumber')} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Credit limit (R)
          <input
            className={inputCls}
            type="number"
            min="0"
            value={form.creditLimit}
            onChange={set('creditLimit')}
          />
        </label>
        <label className="col-span-2 text-xs font-medium text-slate-600">
          Payment terms (days)
          <input
            className={inputCls}
            type="number"
            min="0"
            max="365"
            value={form.paymentTermsDays}
            onChange={set('paymentTermsDays')}
          />
        </label>
        <div className="col-span-2 flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createAccount.isPending}>
            {createAccount.isPending ? 'Saving…' : 'Create account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── New invoice modal ───

function NewInvoiceModal({ accounts, onClose }) {
  const { toast } = useToast();
  const createInvoice = useCreateArInvoice();
  const [form, setForm] = useState({
    corporateAccountId: '',
    vatRate: 15,
    dueDate: '',
    notes: '',
  });
  const [items, setItems] = useState([{ description: '', amount: '' }]);

  const total = useMemo(() => items.reduce((s, i) => s + (Number(i.amount) || 0), 0), [items]);
  const vat = (total * (Number(form.vatRate) || 0)) / 100;

  const setItem = (idx, k) => (e) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [k]: e.target.value } : it)));

  const submit = (e) => {
    e.preventDefault();
    createInvoice.mutate(
      {
        corporateAccountId: form.corporateAccountId,
        vatRate: Number(form.vatRate),
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        items: items
          .filter((i) => i.description && Number(i.amount) > 0)
          .map((i) => ({ description: i.description, amount: Number(i.amount) })),
      },
      {
        onSuccess: () => {
          toast({ title: 'Invoice created as draft' });
          onClose();
        },
        onError: (err) =>
          toast({
            title: 'Failed to create invoice',
            description: err.message,
            variant: 'destructive',
          }),
      }
    );
  };

  return (
    <Modal title="New AR invoice" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <label className="col-span-2 text-xs font-medium text-slate-600">
            Corporate account *
            <select
              className={inputCls}
              value={form.corporateAccountId}
              onChange={(e) => setForm((f) => ({ ...f, corporateAccountId: e.target.value }))}
              required
            >
              <option value="">Select account…</option>
              {(accounts?.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            VAT %
            <input
              className={inputCls}
              type="number"
              min="0"
              max="100"
              value={form.vatRate}
              onChange={(e) => setForm((f) => ({ ...f, vatRate: e.target.value }))}
            />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Due date (blank = account terms)
            <input
              className={inputCls}
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </label>
          <label className="col-span-2 text-xs font-medium text-slate-600">
            Notes
            <input
              className={inputCls}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Line items
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="mb-2 flex gap-2">
              <input
                className={inputCls}
                placeholder="Description (e.g. Room block — Oct, folio F-1029)"
                value={it.description}
                onChange={setItem(idx, 'description')}
              />
              <input
                className={`${inputCls} w-32`}
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={it.amount}
                onChange={setItem(idx, 'amount')}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}
                disabled={items.length === 1}
              >
                <X size={14} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((arr) => [...arr, { description: '', amount: '' }])}
          >
            <Plus size={14} className="mr-1" /> Add line
          </Button>
        </div>

        <div className="flex items-end justify-between border-t border-slate-100 pt-3">
          <div className="text-sm text-slate-600">
            Subtotal: <span className="font-medium">{fmtMoney(total)}</span>
            <span className="mx-2">·</span>
            VAT: <span className="font-medium">{fmtMoney(vat)}</span>
            <span className="mx-2">·</span>
            Total: <span className="font-bold text-slate-900">{fmtMoney(total + vat)}</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? 'Creating…' : 'Create draft'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── Record payment modal ───

function PaymentModal({ accounts, preselected, onClose }) {
  const { toast } = useToast();
  const recordPayment = useRecordArPayment();
  const [accountId, setAccountId] = useState(preselected?.accountId ?? '');
  const [form, setForm] = useState({
    invoiceId: preselected?.invoiceId ?? '',
    amount: '',
    method: 'bank_transfer',
    reference: '',
    note: '',
  });

  const { data: accountInvoices } = useArInvoices(
    accountId ? { accountId, status: 'open', pageSize: 100 } : undefined
  );

  const submit = (e) => {
    e.preventDefault();
    recordPayment.mutate(
      {
        corporateAccountId: accountId,
        invoiceId: form.invoiceId || undefined,
        amount: Number(form.amount),
        method: form.method,
        reference: form.reference || undefined,
        note: form.note || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Payment recorded' });
          onClose();
        },
        onError: (err) =>
          toast({
            title: 'Failed to record payment',
            description: err.message,
            variant: 'destructive',
          }),
      }
    );
  };

  return (
    <Modal title="Record payment" onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <label className="col-span-2 text-xs font-medium text-slate-600">
          Corporate account *
          <select
            className={inputCls}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="">Select account…</option>
            {(accounts?.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 text-xs font-medium text-slate-600">
          Apply to invoice (blank = on-account)
          <select
            className={inputCls}
            value={form.invoiceId}
            onChange={(e) => setForm((f) => ({ ...f, invoiceId: e.target.value }))}
            disabled={!accountId}
          >
            <option value="">On-account payment</option>
            {(accountInvoices?.data ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.number} — balance {fmtMoney(i.balance)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Amount (R) *
          <input
            className={inputCls}
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Method
          <select
            className={inputCls}
            value={form.method}
            onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
          >
            <option value="bank_transfer">Bank transfer</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Reference (idempotency guard)
          <input
            className={inputCls}
            value={form.reference}
            onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            placeholder="Bank ref / EFT no."
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Note
          <input
            className={inputCls}
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </label>
        <div className="col-span-2 flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={recordPayment.isPending || !accountId}>
            {recordPayment.isPending ? 'Recording…' : 'Record payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Invoice detail modal ───

function InvoiceModal({ invoiceId, onClose }) {
  const { toast } = useToast();
  const { data: inv, isLoading } = useArInvoice(invoiceId);
  const sendInvoice = useSendArInvoice();
  const cancelInvoice = useCancelArInvoice();
  const recordPayment = useRecordArPayment();
  const [payAmount, setPayAmount] = useState('');

  if (isLoading || !inv)
    return (
      <Modal title="Invoice" onClose={onClose}>
        Loading…
      </Modal>
    );

  const canPay = ['sent', 'partially_paid', 'overdue'].includes(inv.status);
  const quickPay = () => {
    recordPayment.mutate(
      {
        corporateAccountId: inv.corporateAccount.id,
        invoiceId: inv.id,
        amount: Number(payAmount),
        method: 'bank_transfer',
      },
      {
        onSuccess: () => {
          toast({ title: 'Payment applied' });
          setPayAmount('');
        },
        onError: (err) =>
          toast({ title: 'Payment failed', description: err.message, variant: 'destructive' }),
      }
    );
  };

  return (
    <Modal title={`${inv.number} — ${inv.corporateAccount.name}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={inv.status} />
          {inv.daysOverdue > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle size={13} /> {inv.daysOverdue} days overdue
            </span>
          )}
          <div className="ml-auto flex gap-2">
            {inv.status === 'draft' && (
              <Button
                size="sm"
                onClick={() =>
                  sendInvoice.mutate(inv.id, {
                    onSuccess: () => toast({ title: 'Invoice marked as sent' }),
                    onError: (err) =>
                      toast({
                        title: 'Send failed',
                        description: err.message,
                        variant: 'destructive',
                      }),
                  })
                }
                disabled={sendInvoice.isPending}
              >
                <Send size={14} className="mr-1" /> Mark sent
              </Button>
            )}
            {inv.status !== 'cancelled' && inv.status !== 'paid' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const reason = window.prompt('Cancellation reason (optional)') ?? undefined;
                  cancelInvoice.mutate(
                    { id: inv.id, reason },
                    {
                      onSuccess: () => toast({ title: 'Invoice cancelled' }),
                      onError: (err) =>
                        toast({
                          title: 'Cancel failed',
                          description: err.message,
                          variant: 'destructive',
                        }),
                    }
                  );
                }}
              >
                <Ban size={14} className="mr-1" /> Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">Issued</div>
            {fmtDate(inv.issueDate)}
          </div>
          <div>
            <div className="text-xs text-slate-500">Due</div>
            {fmtDate(inv.dueDate)}
          </div>
          <div>
            <div className="text-xs text-slate-500">Total</div>
            {fmtMoney(inv.total)}
          </div>
          <div>
            <div className="text-xs text-slate-500">Balance</div>
            <span className="font-semibold">{fmtMoney(inv.balance)}</span>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className={thCls}>Date</th>
              <th className={thCls}>Description</th>
              <th className={`${thCls} text-right`}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it) => (
              <tr key={it.id} className="border-b border-slate-50">
                <td className={tdCls}>{fmtDate(it.date)}</td>
                <td className={tdCls}>
                  {it.description}
                  {it.folioId && (
                    <span className="ml-2 text-xs text-slate-400">folio {it.folioId}</span>
                  )}
                </td>
                <td className={`${tdCls} text-right`}>{fmtMoney(it.amount)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} className={`${tdCls} text-right text-slate-500`}>
                Subtotal / VAT ({inv.vatRate}%)
              </td>
              <td className={`${tdCls} text-right text-slate-500`}>
                {fmtMoney(inv.subtotal)} / {fmtMoney(inv.vatAmount)}
              </td>
            </tr>
          </tbody>
        </table>

        {inv.payments.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payments
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {inv.payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className={tdCls}>{fmtDate(p.receivedAt)}</td>
                    <td className={tdCls}>
                      {p.method}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </td>
                    <td className={`${tdCls} text-right`}>{fmtMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canPay && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
            <input
              className={`${inputCls} w-44`}
              type="number"
              min="0.01"
              step="0.01"
              placeholder={`Max ${inv.balance.toFixed(2)}`}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <Button
              size="sm"
              onClick={quickPay}
              disabled={recordPayment.isPending || !Number(payAmount)}
            >
              {recordPayment.isPending ? 'Applying…' : 'Apply payment'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Account drawer ───

function AccountDrawer({ accountId, onClose }) {
  const { data: account } = useArAccount(accountId);
  const { data: invoices } = useArInvoices({ accountId, pageSize: 50 });
  const { data: payments } = useArPayments({ accountId, pageSize: 50 });
  const updateAccount = useUpdateArAccount();
  const [stmtRange, setStmtRange] = useState({ from: '', to: '' });
  const { data: statement } = useQuery({
    queryKey: ['ar', 'statement', accountId, stmtRange],
    queryFn: () =>
      getArStatement(accountId, {
        from: stmtRange.from || undefined,
        to: stmtRange.to || undefined,
      }),
    enabled: !!accountId,
  });

  if (!account) return null;
  const creditLimit =
    account.creditLimit === null || account.creditLimit === undefined
      ? null
      : Number(account.creditLimit);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{account.name}</h3>
          <div className="text-xs text-slate-500">
            Terms {account.paymentTermsDays ?? 30} days
            {account.taxNumber ? ` · VAT ${account.taxNumber}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={account.isActive ? 'outline' : 'default'}
            onClick={() =>
              updateAccount.mutate({ id: account.id, input: { isActive: !account.isActive } })
            }
          >
            {account.isActive ? 'Place on hold' : 'Reactivate'}
          </Button>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        <StatCard label="Outstanding" value={fmtMoney(account.outstanding)} />
        <StatCard label="Credit limit" value={creditLimit === null ? '—' : fmtMoney(creditLimit)} />
        <StatCard
          label="Available credit"
          value={
            account.availableCredit === null || account.availableCredit === undefined
              ? '—'
              : fmtMoney(account.availableCredit)
          }
          alert={account.availableCredit !== null && account.availableCredit < 0}
        />
      </div>

      <div className="px-5">
        <div className="mb-2 flex items-center gap-2">
          <input
            type="date"
            className={inputCls}
            value={stmtRange.from}
            onChange={(e) => setStmtRange((r) => ({ ...r, from: e.target.value }))}
          />
          <input
            type="date"
            className={inputCls}
            value={stmtRange.to}
            onChange={(e) => setStmtRange((r) => ({ ...r, to: e.target.value }))}
          />
          <a
            href={getArStatementCsvUrl(accountId, stmtRange)}
            download
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={13} /> CSV
          </a>
        </div>
        {statement && (
          <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            Opening balance:{' '}
            <span className="font-medium">{fmtMoney(statement.openingBalance)}</span>
            <span className="mx-2">·</span>
            Closing balance:{' '}
            <span className="font-semibold">{fmtMoney(statement.closingBalance)}</span>
          </div>
        )}

        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Invoices
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {(invoices?.data ?? []).map((i) => (
              <tr key={i.id} className="border-b border-slate-50">
                <td className={tdCls}>{i.number}</td>
                <td className={tdCls}>{fmtDate(i.issueDate)}</td>
                <td className={tdCls}>
                  <StatusBadge status={i.status} />
                </td>
                <td className={`${tdCls} text-right`}>{fmtMoney(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Payments
        </div>
        <table className="w-full border-collapse">
          <tbody>
            {(payments?.data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-slate-50">
                <td className={tdCls}>{fmtDate(p.receivedAt)}</td>
                <td className={tdCls}>
                  {p.method}
                  {p.reference ? ` · ${p.reference}` : ''}
                </td>
                <td className={`${tdCls} text-right`}>{fmtMoney(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="h-8" />
      </div>
    </div>
  );
}

// ─── Main page ───

export default function ArPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('invoices');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [agingFilter, setAgingFilter] = useState('');
  const [modal, setModal] = useState(null); // 'account' | 'invoice' | 'payment'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [paymentPreset, setPaymentPreset] = useState(null);
  const reversePayment = useReverseArPayment();

  const { data: summary } = useArSummary();
  const accountParams = useMemo(
    () => ({ search: search || undefined, includeInactive: true, pageSize: 100 }),
    [search]
  );
  const { data: accounts } = useArAccounts(accountParams);
  const invoiceParams = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      aging: agingFilter || undefined,
      pageSize: 100,
    }),
    [search, statusFilter, agingFilter]
  );
  const { data: invoices, isLoading: invoicesLoading } = useArInvoices(invoiceParams);
  const { data: payments } = useArPayments({ pageSize: 100 });

  const exportInvoicesCsv = () => {
    const rows = [
      ['Number', 'Account', 'Issued', 'Due', 'Status', 'Total', 'Paid', 'Balance'].join(','),
      ...(invoices?.data ?? []).map((i) =>
        [
          i.number,
          `"${i.corporateAccount?.name ?? ''}"`,
          fmtDate(i.issueDate),
          fmtDate(i.dueDate),
          i.status,
          i.total.toFixed(2),
          i.amountPaid.toFixed(2),
          i.balance.toFixed(2),
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ar-invoices.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Wallet size={20} className="text-slate-500" />
            Accounts Receivable
          </h1>
          <p className="text-sm text-slate-500">Corporate ledger — invoices, remittances, aging.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModal('account')}>
            <Building2 size={14} className="mr-1" /> New account
          </Button>
          <Button variant="outline" onClick={() => setModal('invoice')}>
            <FileText size={14} className="mr-1" /> New invoice
          </Button>
          <Button
            onClick={() => {
              setPaymentPreset(null);
              setModal('payment');
            }}
          >
            <Plus size={14} className="mr-1" /> Record payment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total outstanding"
          value={fmtMoney(summary?.outstanding)}
          sub={`${summary?.openInvoiceCount ?? 0} open invoices`}
        />
        <StatCard
          label="Overdue"
          value={fmtMoney(summary?.overdue)}
          sub={`${summary?.overdueCount ?? 0} invoices past due`}
          alert={Number(summary?.overdue) > 0}
        />
        <StatCard
          label="Collected this month"
          value={fmtMoney(summary?.collectedThisMonth)}
          sub={`Billed ${fmtMoney(summary?.billedThisMonth)}`}
        />
        <StatCard
          label="DSO"
          value={summary?.dso != null ? `${summary.dso} days` : '—'}
          sub={`${summary?.activeAccounts ?? 0} active accounts`}
        />
      </div>

      <AgingBar buckets={summary?.buckets} />

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          {[
            ['invoices', 'Invoices'],
            ['accounts', 'Accounts'],
            ['payments', 'Payments'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputCls} w-56 pl-8`}
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {tab === 'invoices' && (
          <>
            <select
              className={`${inputCls} w-36`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partially_paid">Partially paid</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className={`${inputCls} w-36`}
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
            >
              <option value="">All aging</option>
              <option value="not_due">Not due</option>
              <option value="1-30">1–30 days</option>
              <option value="31-60">31–60 days</option>
              <option value="61-90">61–90 days</option>
              <option value="90+">90+ days</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportInvoicesCsv}>
              <Download size={14} className="mr-1" /> CSV
            </Button>
          </>
        )}
      </div>

      {/* Invoices tab */}
      {tab === 'invoices' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className={thCls}>Invoice</th>
                <th className={thCls}>Account</th>
                <th className={thCls}>Issued</th>
                <th className={thCls}>Due</th>
                <th className={thCls}>Status</th>
                <th className={`${thCls} text-right`}>Total</th>
                <th className={`${thCls} text-right`}>Balance</th>
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {(invoices?.data ?? []).map((i) => (
                <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className={`${tdCls} font-medium`}>{i.number}</td>
                  <td className={tdCls}>{i.corporateAccount?.name}</td>
                  <td className={tdCls}>{fmtDate(i.issueDate)}</td>
                  <td
                    className={`${tdCls} ${i.status === 'overdue' ? 'font-medium text-red-600' : ''}`}
                  >
                    {fmtDate(i.dueDate)}
                  </td>
                  <td className={tdCls}>
                    <StatusBadge status={i.status} />
                  </td>
                  <td className={`${tdCls} text-right`}>{fmtMoney(i.total)}</td>
                  <td className={`${tdCls} text-right font-medium`}>{fmtMoney(i.balance)}</td>
                  <td className={`${tdCls} text-right`}>
                    <button
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setSelectedInvoice(i.id)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!invoicesLoading && (invoices?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                    No invoices match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Accounts tab */}
      {tab === 'accounts' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className={thCls}>Account</th>
                <th className={thCls}>Contact</th>
                <th className={thCls}>Terms</th>
                <th className={`${thCls} text-right`}>Credit limit</th>
                <th className={`${thCls} text-right`}>Outstanding</th>
                <th className={`${thCls} text-right`}>Available</th>
                <th className={thCls}>Status</th>
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {(accounts?.data ?? []).map((a) => {
                const limit =
                  a.creditLimit === null || a.creditLimit === undefined
                    ? null
                    : Number(a.creditLimit);
                const available =
                  a.availableCredit === null || a.availableCredit === undefined
                    ? null
                    : Number(a.availableCredit);
                const over = available !== null && available < 0;
                return (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className={`${tdCls} font-medium`}>{a.name}</td>
                    <td className={tdCls}>
                      {a.contactName}
                      {a.email && <div className="text-xs text-slate-400">{a.email}</div>}
                    </td>
                    <td className={tdCls}>{a.paymentTermsDays ?? 30}d</td>
                    <td className={`${tdCls} text-right`}>
                      {limit === null ? '—' : fmtMoney(limit)}
                    </td>
                    <td className={`${tdCls} text-right font-medium`}>
                      {fmtMoney(a.outstanding ?? 0)}
                    </td>
                    <td
                      className={`${tdCls} text-right ${over ? 'font-semibold text-red-600' : ''}`}
                    >
                      {available === null ? '—' : fmtMoney(available)}
                    </td>
                    <td className={tdCls}>
                      <Badge
                        className={
                          a.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }
                      >
                        {a.isActive ? 'Active' : 'On hold'}
                      </Badge>
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <button
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => setSelectedAccount(a.id)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Payments tab */}
      {tab === 'payments' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className={thCls}>Date</th>
                <th className={thCls}>Account</th>
                <th className={thCls}>Invoice</th>
                <th className={thCls}>Method</th>
                <th className={thCls}>Reference</th>
                <th className={`${thCls} text-right`}>Amount</th>
                <th className={thCls}>Status</th>
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {(payments?.data ?? []).map((p) => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className={tdCls}>{fmtDate(p.receivedAt)}</td>
                  <td className={tdCls}>{p.corporateAccount?.name}</td>
                  <td className={tdCls}>{p.invoice?.number ?? 'On account'}</td>
                  <td className={tdCls}>{p.method}</td>
                  <td className={tdCls}>{p.reference ?? '—'}</td>
                  <td className={`${tdCls} text-right`}>{fmtMoney(p.amount)}</td>
                  <td className={tdCls}>
                    <Badge
                      className={
                        p.status === 'applied'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }
                    >
                      {p.status === 'applied' ? 'Applied' : 'Reversed'}
                    </Badge>
                  </td>
                  <td className={`${tdCls} text-right`}>
                    {p.status === 'applied' && (
                      <button
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        title="Reverse payment"
                        onClick={() => {
                          const reason = window.prompt('Reversal reason (optional)') ?? undefined;
                          reversePayment.mutate(
                            { id: p.id, reason },
                            {
                              onSuccess: () => toast({ title: 'Payment reversed' }),
                              onError: (err) =>
                                toast({
                                  title: 'Reversal failed',
                                  description: err.message,
                                  variant: 'destructive',
                                }),
                            }
                          );
                        }}
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals & drawers */}
      {modal === 'account' && <NewAccountModal onClose={() => setModal(null)} />}
      {modal === 'invoice' && (
        <NewInvoiceModal accounts={accounts} onClose={() => setModal(null)} />
      )}
      {modal === 'payment' && (
        <PaymentModal
          accounts={accounts}
          preselected={paymentPreset}
          onClose={() => setModal(null)}
        />
      )}
      {selectedInvoice && (
        <InvoiceModal invoiceId={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}
      {selectedAccount && (
        <AccountDrawer accountId={selectedAccount} onClose={() => setSelectedAccount(null)} />
      )}
    </div>
  );
}
