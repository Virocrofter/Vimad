/* apps/web/src/app/app/rates/page.jsx */
import { useState } from 'react';
import { Calendar, Plus, Tag, LayoutGrid } from 'lucide-react';
import RateCalendar from './RateCalendar';
import RateCodes from './RateCodes';
import AvailabilityGrid from './AvailabilityGrid';
import RateGridManager from './RateGridManager';

const tabs = [
  { key: 'calendar', label: 'Rate Calendar', icon: Calendar },
  { key: 'codes', label: 'Rate Codes', icon: Tag },
  { key: 'availability', label: 'Availability', icon: LayoutGrid },

  { key: 'grids', label: 'Grid Pricing', icon: LayoutGrid },
];

export default function RatesPage() {
  const [tab, setTab] = useState('calendar');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rates &amp; Inventory</h1>
          <p className="text-text-secondary mt-1">
            Manage pricing, rate codes, and room availability
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Rate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'calendar' && <RateCalendar />}
      {tab === 'codes' && <RateCodes />}
      {tab === 'availability' && <AvailabilityGrid />}
      {tab === 'grids' && <RateGridManager />}
    </div>
  );
}
