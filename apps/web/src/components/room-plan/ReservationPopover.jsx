import { X } from 'lucide-react';
import { formatMoney } from './TapeChart';

export default function ReservationPopover({ reservation: r, currency, x, y }) {
  const W = 280;
  const left = Math.min(x + 12, window.innerWidth - W - 12);
  const top = Math.min(y + 12, window.innerHeight - 260);
  const row = 'flex justify-between gap-3 text-[11px]';
  return (
    <div
      className="fixed z-50 rounded-lg border bg-popover p-3 text-popover-foreground shadow-xl"
      style={{ left, top, width: W }}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">{r.guestName}</div>
          <div className="text-[11px] text-muted-foreground">{r.confirmationNumber}</div>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
          {r.status.replace('_', ' ')}
        </span>
      </div>
      <div className="space-y-1">
        <div className={row}>
          <span className="text-muted-foreground">Dates</span>
          <span>
            {r.arrivalDate} → {r.departureDate} ({r.nights}n)
          </span>
        </div>
        <div className={row}>
          <span className="text-muted-foreground">Party</span>
          <span>
            {r.adults} adult{r.adults > 1 ? 's' : ''}
            {r.children > 0 ? `, ${r.children} child` : ''}
          </span>
        </div>
        <div className={row}>
          <span className="text-muted-foreground">Source</span>
          <span>{r.source}</span>
        </div>
        {r.vipStatus && (
          <div className={row}>
            <span className="text-muted-foreground">VIP</span>
            <span className="font-medium text-amber-600">{r.vipStatus}</span>
          </div>
        )}
        {r.corporateAccountName && (
          <div className={row}>
            <span className="text-muted-foreground">Corporate</span>
            <span>{r.corporateAccountName}</span>
          </div>
        )}
        {r.groupCode && (
          <div className={row}>
            <span className="text-muted-foreground">Group</span>
            <span>{r.groupCode}</span>
          </div>
        )}
        {r.eta && (
          <div className={row}>
            <span className="text-muted-foreground">ETA</span>
            <span>{r.eta}</span>
          </div>
        )}
        <div className={row}>
          <span className="text-muted-foreground">Total</span>
          <span>{formatMoney(r.totalAmount, currency)}</span>
        </div>
        <div className={row}>
          <span className="text-muted-foreground">Balance</span>
          <span
            className={Number(r.balance) > 0 ? 'font-semibold text-rose-600' : 'text-emerald-600'}
          >
            {formatMoney(r.balance, currency)}
          </span>
        </div>
        {Number(r.depositPaid) > 0 && (
          <div className={row}>
            <span className="text-muted-foreground">Deposit paid</span>
            <span>{formatMoney(r.depositPaid, currency)}</span>
          </div>
        )}
        {(r.openTraces > 0 || r.pendingTasks > 0) && (
          <div className="mt-1 flex flex-wrap gap-1 border-t pt-1">
            {r.openTraces > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {r.openTraces} trace{r.openTraces > 1 ? 's' : ''}
              </span>
            )}
            {r.pendingTasks > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {r.pendingTasks} task{r.pendingTasks > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
        {r.specialRequests && (
          <div className="mt-1 border-t pt-1 text-[10px] italic text-muted-foreground">
            “{r.specialRequests}”
          </div>
        )}
      </div>
    </div>
  );
}
