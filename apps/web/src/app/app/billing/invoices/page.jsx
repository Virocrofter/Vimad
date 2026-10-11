/* apps/web/src/app/app/billing/invoices/page.jsx — [A5] invoice & receipt list */
import { useCallback, useEffect, useState } from 'react';
import { FileText, Mail, Plus, Receipt } from 'lucide-react';
import { invoicesApi } from '../../../../api/invoices';

const fmtMoney = (n) =>
  `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issueFolio, setIssueFolio] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvoices(await invoicesApi.list());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    invoicesApi
      .list()
      .then((data) => {
        if (!cancelled) setInvoices(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const issue = async () => {
    setIssuing(true);
    setError(null);
    try {
      await invoicesApi.issue(issueFolio.trim(), true);
      setIssueFolio('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setIssuing(false);
    }
  };

  const download = async (id) => {
    setDownloadingId(id);
    setError(null);
    try {
      await invoicesApi.downloadPdf(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices & Receipts</h1>
          <p className="mt-1 text-sm text-text-muted">
            SARS-compliant tax invoices — sequential, VAT-numbered, immutable.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
        <input
          value={issueFolio}
          onChange={(e) => setIssueFolio(e.target.value)}
          placeholder="Paste folio ID to issue a tax invoice…"
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          onClick={issue}
          disabled={issuing || !issueFolio.trim()}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-secondary px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {issuing ? 'Issuing…' : 'Issue & send'}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-text-muted">Loading…</div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-text-muted">
          No invoices yet — issue one from a folio above, or take a payment and the receipt fires
          automatically.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-text-muted">
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Issued</th>
                <th className="px-4 py-3 text-right">Total (incl VAT)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-medium">{inv.number}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                        inv.type === 'receipt'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-secondary/10 text-secondary'
                      }`}
                    >
                      {inv.type === 'receipt' ? (
                        <Receipt className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {inv.type === 'receipt' ? 'Receipt' : 'Tax invoice'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{inv.guestName}</td>
                  <td className="px-4 py-3 text-text-muted">{inv.issueDate?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {fmtMoney(inv.totalInclVat)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => download(inv.id)}
                        disabled={downloadingId === inv.id}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs hover:bg-surface-elevated disabled:opacity-50"
                      >
                        <FileText className="h-3.5 w-3.5" />{' '}
                        {downloadingId === inv.id ? 'Downloading…' : 'PDF'}
                      </button>
                      <button
                        onClick={() => invoicesApi.send(inv.id).then(load)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs hover:bg-surface-elevated"
                      >
                        <Mail className="h-3.5 w-3.5" /> {inv.sentAt ? 'Resend' : 'Send'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
