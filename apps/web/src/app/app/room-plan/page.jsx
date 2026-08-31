import { Calendar, LayoutGrid } from 'lucide-react';
import TapeChart  from '../../../components/room-plan/TapeChart';

export default function RoomPlanPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Room Plan</h1>
          <p className="text-sm text-text-secondary">
            Visual tape chart — drag reservations, view availability, and manage assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
            <LayoutGrid className="h-3.5 w-3.5" /> Drag to assign
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary">
            <Calendar className="h-3.5 w-3.5" /> 7-day view
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <TapeChart />
      </div>
    </div>
  );
}