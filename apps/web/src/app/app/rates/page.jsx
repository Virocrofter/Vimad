import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Copy } from 'lucide-react';

// Generate mock rate data
const generateRateData = (dates, roomTypes) => {
  const data = {};
  roomTypes.forEach((rt) => {
    data[rt.id] = {};
    dates.forEach((date) => {
      const baseRate = rt.baseRate || 150;
      const isWeekend = new Date(date).getDay() % 6 === 0;
      data[rt.id][date] = {
        rate: isWeekend ? Math.round(baseRate * 1.2) : baseRate,
        currency: 'USD',
        restrictions: {
          minStay: isWeekend ? 2 : 1,
          closedToArrival: false,
          closedToDeparture: false,
        },
      };
    });
  });
  return data;
};

export default function RatesPage() {
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedRoomType, setSelectedRoomType] = useState('all');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate dates for the grid
  const dates = useMemo(() => {
    const result = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i + dateOffset);
      result.push(date.toISOString().split('T')[0]);
    }
    return result;
  }, [today, dateOffset]);

  const roomTypes = useMemo(
    () => [
      { id: 'std-q', name: 'Standard Queen', code: 'STD-Q', baseRate: 145 },
      { id: 'dlx-k', name: 'Deluxe King', code: 'DLX-K', baseRate: 189 },
      { id: 'ste', name: 'Suite', code: 'STE', baseRate: 320 },
    ],
    []
  );

  // Refresh rate data when dates change
  const rateData = useMemo(() => generateRateData(dates, roomTypes), [dates, roomTypes]);

  const filteredRoomTypes =
    selectedRoomType === 'all' ? roomTypes : roomTypes.filter((rt) => rt.id === selectedRoomType);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatRate = (rate) => `$${rate}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Rate Management</h1>
          <p className="text-text-secondary mt-1">Manage pricing and rate restrictions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Rate Plan
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-background-secondary rounded-lg p-4">
        <button
          onClick={() => setDateOffset((prev) => prev - 14)}
          className="flex items-center gap-1 px-3 py-1.5 border border-border rounded hover:bg-background"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous 2 weeks
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-text-secondary" />
          <span className="font-medium text-text-primary">
            {formatDate(dates[0])} - {formatDate(dates[dates.length - 1])}
          </span>
        </div>
        <button
          onClick={() => setDateOffset((prev) => prev + 14)}
          className="flex items-center gap-1 px-3 py-1.5 border border-border rounded hover:bg-background"
        >
          Next 2 weeks
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Room Type Filter */}
      <div className="flex items-center gap-4">
        <select
          value={selectedRoomType}
          onChange={(e) => setSelectedRoomType(e.target.value)}
          className="px-3 py-2 border border-border rounded-lg bg-background"
        >
          <option value="all">All Room Types</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rates Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background border border-border px-4 py-2 text-left text-sm font-medium text-text-secondary">
                Room Type
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="border border-border px-3 py-2 text-center text-sm font-medium text-text-secondary min-w-25"
                >
                  {formatDate(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRoomTypes.map((rt) => (
              <tr key={rt.id}>
                <td className="sticky left-0 bg-background border border-border px-4 py-3">
                  <div>
                    <p className="font-medium text-text-primary">{rt.name}</p>
                    <p className="text-sm text-text-secondary">{rt.code}</p>
                  </div>
                </td>
                {dates.map((date) => {
                  const data = rateData[rt.id]?.[date];
                  if (!data) return <td key={date} className="border border-border px-3 py-3" />;
                  const isWeekend = new Date(date).getDay() % 6 === 0;
                  return (
                    <td key={date} className="border border-border px-3 py-3 text-center">
                      <div
                        className={`rounded-lg p-2 ${isWeekend ? 'bg-warning/10' : 'bg-background-secondary'}`}
                      >
                        <p className="text-lg font-semibold text-text-primary">
                          {formatRate(data.rate)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          min {data.restrictions.minStay} night
                        </p>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
