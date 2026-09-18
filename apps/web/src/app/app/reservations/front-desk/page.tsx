import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReservations } from '../../../../hooks/useReservations';

interface Reservation {
  id: string;
  confirmationNumber: string;
  guestName: string;
  roomNumber: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
}

export default function FrontDeskPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'arrivals' | 'departures' | 'in-house'>('all');

  const { fetchReservations } = useReservations();

  useEffect(() => {
    const loadReservations = async () => {
      setIsLoading(true);
      try {
        const data = await fetchReservations();
        setReservations(data);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReservations();
  }, [fetchReservations]);

  const filteredReservations = reservations.filter((r) => {
    switch (filter) {
      case 'arrivals':
        return r.status === 'confirmed';
      case 'departures':
        return r.status === 'checked_in';
      case 'in-house':
        return r.status === 'checked_in';
      default:
        return true;
    }
  });

  const handleCheckIn = (id: string) => {
    navigate(`/app/reservations/${id}/check-in`);
  };

  const handleCheckOut = (id: string) => {
    navigate(`/app/reservations/${id}/check-out`);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/app/reservations/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading reservations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Front Desk</h1>
        <div className="flex gap-2">
          {(['all', 'arrivals', 'departures', 'in-house'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Confirmation</th>
              <th className="px-4 py-3 text-left">Guest</th>
              <th className="px-4 py-3 text-left">Room</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map((reservation) => (
              <tr key={reservation.id} className="border-t">
                <td className="px-4 py-3">{reservation.confirmationNumber}</td>
                <td className="px-4 py-3">{reservation.guestName}</td>
                <td className="px-4 py-3">{reservation.roomNumber || 'Unassigned'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      reservation.status === 'checked_in'
                        ? 'bg-green-100 text-green-800'
                        : reservation.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {reservation.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {reservation.status === 'confirmed' && (
                      <button
                        onClick={() => handleCheckIn(reservation.id)}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                      >
                        Check In
                      </button>
                    )}
                    {reservation.status === 'checked_in' && (
                      <button
                        onClick={() => handleCheckOut(reservation.id)}
                        className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
                      >
                        Check Out
                      </button>
                    )}
                    <button
                      onClick={() => handleViewDetails(reservation.id)}
                      className="px-3 py-1 bg-muted rounded text-sm"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
