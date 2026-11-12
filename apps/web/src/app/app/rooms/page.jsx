/* apps/web/src/app/app/rooms/page.jsx
 * Rooms & Operations workspace (Bulk 0.5 slice 4): one workspace, three
 * lenses. Board = the P10-verified tape chart; Space Status + HK Activity
 * absorbed from housekeeping — standalone routes kept alive, nothing orphaned.
 */
import { useState } from 'react';
import { BedDouble, DoorOpen, BarChart3 } from 'lucide-react';
import RoomBoard from '../room-plan/RoomBoard';
import SpaceStatusPage from '../housekeeping/space-status/page';
import HkActivityPage from '../housekeeping/activity/page';

const TABS = [
  { key: 'board', label: 'Board', icon: BedDouble },
  { key: 'space', label: 'Space Status', icon: DoorOpen },
  { key: 'activity', label: 'HK Activity', icon: BarChart3 },
];

export default function RoomsPage() {
  const [tab, setTab] = useState('board');
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 border-b border-white/10 px-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === t.key
                ? 'border-indigo-400 text-gray-100'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'board' && <RoomBoard />}
        {tab === 'space' && <SpaceStatusPage />}
        {tab === 'activity' && <HkActivityPage />}
      </div>
    </div>
  );
}
