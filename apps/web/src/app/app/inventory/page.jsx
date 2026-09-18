import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter, Download, RefreshCw } from 'lucide-react';

// Generate mock inventory data
const generateInventoryData = (dates, roomTypes) => {
  const data = {};
  roomTypes.forEach((rt) => {
    data[rt.id] = {};
    dates.forEach((date) => {
      const totalRooms = rt.count;
      const occupied = Math.floor(Math.random() * (totalRooms + 1));
      data[rt.id][date] = {
        total: totalRooms,
        occupied,
        available: totalRooms - occupied,
        outOfOrder: Math.floor(Math.random() * 2),
      };
    });
  });
  return data;
};

export default function InventoryPage() {
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
      { id: 'std-q', name: 'Standard Queen', code: 'STD-Q', count: 20 },
      { id: 'dlx-k', name: 'Deluxe King', code: 'DLX-K', count: 15 },
      { id: 'ste', name: 'Suite', code: 'STE', count: 5 },
    ],
    []
  );

  // Refresh data when dates change (simulate API fetch)
  const inventoryData = useMemo(() => generateInventoryData(dates, roomTypes), [dates, roomTypes]);

  const filteredRoomTypes =
    selectedRoomType === 'all' ? roomTypes : roomTypes.filter((rt) => rt.id === selectedRoomType);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getOccupancyColor = (occupied, total) => {
    const pct = (occupied / total) * 100;
    if (pct >= 90) return 'bg-danger/20 text-danger';
    if (pct >= 70) return 'bg-warning/20 text-warning';
    return 'bg-accent/20 text-accent';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Inventory Management</h1>
          <p className="text-text-secondary mt-1">Manage room availability and occupancy</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-background-secondary">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
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
        <Filter className="h-5 w-5 text-text-secondary" />
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

      {/* Inventory Grid */}
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
                  className="border border-border px-3 py-2 text-center text-sm font-medium text-text-secondary min-w-[100px]"
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
                    <p className="text-sm text-text-secondary">
                      {rt.code} • {rt.count} rooms
                    </p>
                  </div>
                </td>
                {dates.map((date) => {
                  const data = inventoryData[rt.id]?.[date];
                  if (!data) return <td key={date} className="border border-border px-3 py-3" />;
                  const occupancyPct = Math.round((data.occupied / data.total) * 100);
                  return (
                    <td key={date} className="border border-border px-3 py-3 text-center">
                      <div
                        className={`rounded-lg p-2 ${getOccupancyColor(data.occupied, data.total)}`}
                      >
                        <p className="text-lg font-semibold">{data.available}</p>
                        <p className="text-xs">avail</p>
                        <p className="text-xs mt-1">{occupancyPct}% occ</p>
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
