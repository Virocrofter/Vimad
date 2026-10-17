/* apps/web/src/app/app/billing/dashboard/components/FolioOverview.jsx
 * Wired folio-billing overview for the billing dashboard.
 * Data: /v1/folios (open balances) + /v1/dashboard/stats (revenue KPIs).
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Receipt,
  ArrowRightLeft,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '@/components/ui/button';
import { listFolios } from '../../../../api/folio';
import { apiGet } from '../../../../api/client';

const fmt = (n, currency = 'ZAR') =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(Number(n) || 0);

export default function FolioOverview() {
  const [folios, setFolios] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [folioRes, statsData] = await Promise.all([
        listFolios({ page: 1, pageSize: 6, status: 'open' }),
        apiGet('/dashboard/stats'),
      ]);
      setFolios(folioRes.data || []);
      setStats(statsData);
    } catch (e) {
      setError(e?.response?.data?.error?.message || e.message || 'Failed to load billing overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currency = stats?.property?.currency || 'ZAR';
  const outstanding = folios.reduce((s, f) => s + (Number(f.balance) || 0), 0);
  const overdue = folios.filter((f) => Number(f.balance) > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Folio Overview</h2>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Open Folios</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold font-mono text-text-primary">
            <Receipt className="h-4 w-4 text-secondary" /> {folios.length}
          </p>
          <p className="text-[10px] text-text-muted">{overdue} with balance due</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Outstanding Balance</p>
          <p
            className={cn(
              'mt-1 text-xl font-bold font-mono',
              outstanding > 0 ? 'text-danger' : 'text-accent'
            )}
          >
            {fmt(outstanding, currency)}
          </p>
          <p className="text-[10px] text-text-muted">across open folios</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">
            Revenue (Business Date)
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold font-mono text-text-primary">
            <TrendingUp className="h-4 w-4 text-accent" /> {fmt(stats?.totalRevenue, currency)}
          </p>
          <p className="text-[10px] text-text-muted">
            MTD {fmt(stats?.monthToDateRevenue, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">ADR / RevPAR</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold font-mono text-text-primary">
            <Percent className="h-4 w-4 text-info" /> {fmt(stats?.adr, currency)}
          </p>
          <p className="text-[10px] text-text-muted">RevPAR {fmt(stats?.revpar, currency)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Open Folios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                  Reservation
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-secondary uppercase">
                  Guest
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                  Charges
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                  Payments
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-secondary uppercase">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-text-muted">
                    Loading…
                  </td>
                </tr>
              ) : folios.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-text-muted">
                    No open folios.
                  </td>
                </tr>
              ) : (
                folios.map((f) => (
                  <tr key={f.id} className="hover:bg-surface/50">
                    <td className="px-4 py-2 font-mono text-xs text-text-secondary">
                      {f.reservation?.confirmationNumber || f.reservationId}
                    </td>
                    <td className="px-4 py-2 text-text-primary">
                      {f.reservation?.guest
                        ? `${f.reservation.guest.firstName} ${f.reservation.guest.lastName}`
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-text-primary">
                      {fmt(f.totalCharges, currency)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-accent">
                      {fmt(f.totalPayments, currency)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-2 text-right font-mono font-medium',
                        Number(f.balance) > 0 ? 'text-danger' : 'text-text-primary'
                      )}
                    >
                      {fmt(f.balance, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
