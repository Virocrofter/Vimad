/* src/app/guest-portal/loyalty/history/page.jsx — G3: real points history */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { getGuestToken } from '../../../../hooks/guestPortalApi';
import { useGuestLoyaltyTransactions } from '../../../../hooks/useGuestLoyalty';
import { formatDate } from '../../../../lib/guest-utils';

export default function LoyaltyHistoryPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data, isLoading, isError, refetch } = useGuestLoyaltyTransactions();

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your points history…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load your points history.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const transactions = data.transactions ?? [];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/loyalty')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Points History</h1>
          <p className="text-xs text-text-muted">{transactions.length} transactions</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <History className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            No points activity yet — points appear after your first eligible stay.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="divide-y divide-border">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{t.description}</p>
                  <p className="text-[10px] text-text-muted">
                    {formatDate(t.createdAt)} · {t.source}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'text-sm font-mono font-medium',
                      t.type === 'redemption' ? 'text-danger' : 'text-accent'
                    )}
                  >
                    {t.type === 'redemption' ? '-' : '+'}
                    {t.amount}
                  </p>
                  <p className="text-[10px] text-text-muted font-mono">bal {t.balance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
