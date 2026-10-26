/* apps/web/src/app/app/chain-billing/page.jsx — C5 chain corporate billing */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Landmark,
  FileText,
  ArrowLeftRight,
  CheckCircle2,
  X,
  ShieldCheck,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import {
  listChainAccounts,
  listChainFolios,
  listChainInvoices,
  createConsolidatedInvoice,
  transferFolio,
  recentTransfers,
} from '../../../api/chainBilling';

const fmtMoney = (v) =>
  `R ${Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-ZA') : '—');
const lastMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const f = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { start: f(start), end: f(end) };
};

function InvoiceModal({ account, onClose }) {
  const queryClient = useQueryClient();
  const def = lastMonthRange();
  const [from, setFrom] = useState(def.start);
  const [to, setTo] = useState(def.end);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const invoiceMutation = useMutation({
    mutationFn: () => createConsolidatedInvoice(account.id, { periodStart: from, periodEnd: to }),
    onSuccess: (inv) => {
      queryClient.invalidateQueries({ queryKey: ['chain-billing'] });
      setCreated(inv);
    },
    onError: (e) => setError(e?.message ?? 'Invoice failed'),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Consolidated invoice — {account.name}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        {created ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-lg font-bold tracking-wide text-text-primary">{created.number}</p>
            <p className="text-xs text-text-muted">
              {created.items.length} line(s) across {created.properties.length} propert
              {created.properties.length === 1 ? 'y' : 'ies'} · {fmtMoney(created.total)} incl. VAT
            </p>
            <button
              onClick={onClose}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            <p className="text-xs text-text-muted">
              Collects every open folio for this account's guests across all properties for the
              period, posts a matching transfer on each folio, and issues one AR invoice.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-text-muted">
                Period start
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
                />
              </label>
              <label className="text-xs text-text-muted">
                Period end
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary"
                />
              </label>
            </div>
            {account.perProperty.length > 0 && (
              <div className="rounded-md bg-surface-elevated px-3 py-2 text-xs text-text-secondary">
                {account.perProperty.map((p) => (
                  <div key={p.propertyId} className="flex justify-between py-0.5">
                    <span>{p.propertyName}</span>
                    <span className="font-medium text-text-primary">{fmtMoney(p.outstanding)}</span>
                  </div>
                ))}
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={() => invoiceMutation.mutate()}
              disabled={invoiceMutation.isPending}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              {invoiceMutation.isPending ? 'Generating…' : 'Generate invoice'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountRow({ account }) {
  const [expanded, setExpanded] = useState(false);
  const invoicesQuery = useQuery({
    queryKey: ['chain-billing', 'invoices', account.id],
    queryFn: () => listChainInvoices(account.id),
    enabled: expanded,
  });
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer border-b border-border/60 hover:bg-surface-elevated"
      >
        <td className="px-4 py-2.5">
          <div className="font-medium text-text-primary">{account.name}</div>
          <div className="text-[11px] text-text-muted">
            {account.billingEmail ?? account.email ?? '—'}
          </div>
        </td>
        <td className="pr-3 text-text-secondary">Net {account.paymentTermsDays}</td>
        <td className="pr-3 text-text-secondary">
          {account.creditLimit != null ? fmtMoney(account.creditLimit) : '—'}
        </td>
        <td className="pr-3 text-right font-semibold text-text-primary">
          {fmtMoney(account.outstanding)}
        </td>
        <td className="px-4 text-right text-text-muted">{expanded ? '▲' : '▼'}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/60 bg-surface-elevated/40">
          <td colSpan={5} className="px-6 py-3">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {account.perProperty.length === 0 && (
                <span className="text-xs text-text-muted">No open exposure at any property.</span>
              )}
              {account.perProperty.map((p) => (
                <span
                  key={p.propertyId}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-text-secondary"
                >
                  <Building2 className="h-3 w-3 text-text-muted" />
                  {p.propertyName}
                  <span className="font-medium text-text-primary">{fmtMoney(p.outstanding)}</span>
                  <span className="text-text-muted">
                    ({p.folioCount} folio{p.folioCount === 1 ? '' : 's'})
                  </span>
                </span>
              ))}
            </div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Consolidated invoices
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInvoiceOpen(true);
                }}
                disabled={account.outstanding <= 0}
                className="rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-30"
              >
                + Generate month-end invoice
              </button>
            </div>
            {invoicesQuery.isLoading ? (
              <p className="text-xs text-text-muted">Loading…</p>
            ) : (invoicesQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-text-muted">No consolidated invoices yet.</p>
            ) : (
              <div className="space-y-1.5">
                {invoicesQuery.data.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-md border border-border bg-surface px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-text-primary">{inv.number}</span>
                      <span className="text-xs text-text-muted">
                        {fmtDate(inv.issueDate)} → due {fmtDate(inv.dueDate)} ·{' '}
                        {inv.properties.join(', ')}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {fmtMoney(inv.total)}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {inv.items.map((i) => (
                        <div
                          key={i.id}
                          className="flex justify-between text-[11px] text-text-secondary"
                        >
                          <span>{i.description}</span>
                          <span>{fmtMoney(i.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
      {invoiceOpen && <InvoiceModal account={account} onClose={() => setInvoiceOpen(false)} />}
    </>
  );
}

function TransfersTab() {
  const queryClient = useQueryClient();
  const foliosQuery = useQuery({ queryKey: ['chain-billing', 'folios'], queryFn: listChainFolios });
  const transfersQuery = useQuery({
    queryKey: ['chain-billing', 'transfers'],
    queryFn: recentTransfers,
    refetchInterval: 30_000,
  });
  const folios = foliosQuery.data ?? [];
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const from = folios.find((f) => f.id === fromId);
  const to = folios.find((f) => f.id === toId);

  const transferMutation = useMutation({
    mutationFn: () =>
      transferFolio({
        fromFolioId: fromId,
        toFolioId: toId,
        amount: Number(amount),
        reason: reason || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chain-billing'] });
      setDone(res);
      setAmount('');
      setReason('');
      setError('');
    },
    onError: (e) => setError(e?.message ?? 'Transfer failed'),
  });

  const folioLabel = (f) =>
    `${f.property.name} — ${f.guest.firstName} ${f.guest.lastName} — ${f.confirmationNumber} — ${fmtMoney(f.balance)}`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
          <ArrowLeftRight className="h-4 w-4" /> Inter-property folio transfer
        </h3>
        <p className="text-xs text-text-muted">
          Moves an open balance between folios at different properties — e.g. a bill that must land
          on the conference property. Posts mirrored transfer lines on both folios; the balance ==
          charges − payments invariant holds on each side.
        </p>
        <select
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        >
          <option value="">From folio (source)…</option>
          {folios
            .filter((f) => f.balance > 0)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {folioLabel(f)}
              </option>
            ))}
        </select>
        <select
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary"
        >
          <option value="">To folio (target)…</option>
          {folios
            .filter((f) => f.id !== fromId)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {folioLabel(f)}
              </option>
            ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount${from ? ` (max ${fmtMoney(from.balance)})` : ''}`}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {done && (
          <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-text-secondary">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span>
              Transferred {fmtMoney(done.from.balance + Number(amount))} → new balances:{' '}
              <span className="font-medium text-text-primary">
                {done.from.property.name} {fmtMoney(done.from.balance)}
              </span>{' '}
              ·{' '}
              <span className="font-medium text-text-primary">
                {done.to.property.name} {fmtMoney(done.to.balance)}
              </span>
              {done.from.invariantOk && done.to.invariantOk && ' — both folios audit-clean.'}
            </span>
          </div>
        )}
        <button
          onClick={() => transferMutation.mutate()}
          disabled={!fromId || !toId || !amount || transferMutation.isPending}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {transferMutation.isPending ? 'Posting…' : 'Post transfer'}
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold text-text-primary">
            Recent transfers & AR postings
          </h3>
        </div>
        <div className="divide-y divide-border/60">
          {(transfersQuery.data ?? []).map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs text-text-secondary">{t.description}</p>
                <p className="text-[11px] text-text-muted">
                  {t.propertyName} · {t.guestName} · {t.confirmationNumber} · {fmtDate(t.postedAt)}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${t.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}
              >
                {t.amount < 0 ? '−' : '+'}
                {fmtMoney(Math.abs(t.amount))}
              </span>
            </div>
          ))}
          {(transfersQuery.data ?? []).length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-text-muted">
              No transfers posted yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChainBillingPage() {
  const [tab, setTab] = useState('accounts');
  const accountsQuery = useQuery({
    queryKey: ['chain-billing', 'accounts'],
    queryFn: listChainAccounts,
  });
  const accounts = accountsQuery.data ?? [];

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Chain Corporate Billing</h1>
        <p className="text-sm text-text-muted">
          One corporate contract across every property — consolidated month-end invoicing and
          inter-property folio transfers.
        </p>
      </div>

      <div className="flex w-fit rounded-lg border border-border bg-surface p-0.5">
        {[
          { key: 'accounts', label: 'Corporate Accounts' },
          { key: 'transfers', label: 'Folio Transfers' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' ? (
        accountsQuery.isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-surface-elevated" />
        ) : accountsQuery.isError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-text-primary">
            Failed to load accounts.
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-10 text-center">
            <Landmark className="h-7 w-7 text-text-muted" />
            <p className="text-sm text-text-secondary">No corporate accounts yet.</p>
            <Link to="/app/crm/corporate" className="text-sm text-primary hover:underline">
              Create one under CRM → Corporate →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-2.5">Account</th>
                  <th className="pr-3">Terms</th>
                  <th className="pr-3">Credit limit</th>
                  <th className="pr-3 text-right">Outstanding (all properties)</th>
                  <th className="px-4" />
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <AccountRow key={a.id} account={a} />
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <TransfersTab />
      )}
    </div>
  );
}
