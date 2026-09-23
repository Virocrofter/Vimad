/* apps/web/src/app/app/room-plan/page.tsx */
import { useReservations } from '../../../hooks/useReservations';
import TapeChart from '../../../components/room-plan/TapeChart';

export default function RoomPlanPage() {
  const {
    reservations: reservationsData,
    isLoading: reservationsLoading,
    error: reservationsError,
    refetch: refetchReservations,
  } = useReservations();

  if (reservationsLoading) return <div className="page-loading">Loading room plan…</div>;
  if (reservationsError)
    return (
      <div className="page-error">
        {reservationsError.message}
        <button type="button" onClick={() => refetchReservations()}>
          Retry
        </button>
      </div>
    );

  return (
    <div className="room-plan">
      <h1>Room Plan</h1>
      <TapeChart reservations={reservationsData} rooms={undefined} />
    </div>
  );
}
