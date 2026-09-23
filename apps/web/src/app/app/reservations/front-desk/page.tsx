/* apps/web/src/app/app/reservations/front-desk/page.tsx */
import { useState, useEffect } from 'react';
import { listReservations } from '../../../../api/reservations';
import type { Reservation } from '../../../../types';

export default function FrontDeskPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await listReservations();
        if (!cancelled) {
          setReservations(
            response.data.map((r) => ({
              ...r,
              guestName:
                r.guestName ??
                `${(r as unknown as { guest?: { firstName?: string; lastName?: string } }).guest?.firstName ?? ''} ${(r as unknown as { guest?: { firstName?: string; lastName?: string } }).guest?.lastName ?? ''}`.trim(),
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load reservations');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <div className="page-loading">Loading front desk…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div className="front-desk">
      <h1>Front Desk</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>Confirmation</th>
            <th>Guest</th>
            <th>Arrival</th>
            <th>Departure</th>
            <th>Status</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id}>
              <td>{r.confirmationNumber}</td>
              <td>{r.guestName}</td>
              <td>{r.arrivalDate}</td>
              <td>{r.departureDate}</td>
              <td>{r.status}</td>
              <td>{r.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
