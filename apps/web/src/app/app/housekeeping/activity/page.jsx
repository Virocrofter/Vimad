/* apps/web/src/app/app/housekeeping/activity/page.jsx — T2+ activity heatmap
 * Weekly/hourly intensity of check-ins, check-outs and cleanings — the
 * ZAR labor-law break-scheduling lens from the Mews digest.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../api/client';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { LoadingSkeleton } from '../../../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { cn } from '../../../../lib/utils';
import { BarChart3, LogIn, LogOut, Brush } from 'lucide-react';

const METRICS = [
  { key: 'checkins', label: 'Check-ins', icon: LogIn, color: 'bg-blue-500' },
  { key: 'checkouts', label: 'Check-outs', icon: LogOut, color: 'bg-amber-500' },
  { key: 'cleanings', label: 'Cleanings', icon: Brush, color: 'bg-emerald-500' },
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HkActivityPage() {
  const [metric, setMetric] = useState('checkins');
  const [weeks, setWeeks] = useState(4);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hk-activity', weeks],
    queryFn: async () =>
      (await apiClient.get('/housekeeping/activity', { params: { weeks } })).data.data,
  });

  if (error) return <ErrorState title="Activity failed to load" onRetry={() => refetch()} />;
  if (isLoading || !data) return <LoadingSkeleton className="h-40" count={3} />;

  const active = METRICS.find((m) => m.key === metric);
  const grid = {};
  let max = 0;
  for (const cell of data[metric]) {
    grid[`${cell.dow}-${cell.hour}`] = cell.count;
    if (cell.count > max) max = cell.count;
  }

  const intensity = (count) => {
    if (!count) return 'bg-slate-100';
    const ratio = count / max;
    if (ratio > 0.75) return cn(active.color, 'opacity-100');
    if (ratio > 0.5) return cn(active.color, 'opacity-70');
    if (ratio > 0.25) return cn(active.color, 'opacity-40');
    return cn(active.color, 'opacity-20');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
            <BarChart3 className="h-6 w-6 text-secondary" /> Activity heatmap
          </h1>
          <p className="text-sm text-text-secondary">
            {weeks} week(s) · hour of day × day of week — plan cleaner breaks around the peaks
          </p>
        </div>
        <div className="flex gap-2">
          {[2, 4, 8].map((w) => (
            <Button
              key={w}
              variant={weeks === w ? 'default' : 'outline'}
              onClick={() => setWeeks(w)}
            >
              {w}w
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {METRICS.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={metric === key ? 'default' : 'outline'}
            onClick={() => setMetric(key)}
          >
            <Icon className="mr-1 h-4 w-4" /> {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-4">
          <div className="min-w-[900px]">
            <div className="grid" style={{ gridTemplateColumns: '56px repeat(24, 1fr)' }}>
              <div />
              {HOURS.map((h) => (
                <div key={h} className="pb-1 text-center text-[9px] text-text-muted">
                  {h % 3 === 0 ? `${h}` : ''}
                </div>
              ))}
              {data.days.map((day, dow) => (
                <>
                  <div
                    key={day}
                    className="flex items-center pr-2 text-xs font-medium text-text-secondary"
                  >
                    {day}
                  </div>
                  {HOURS.map((h) => {
                    const count = grid[`${dow}-${h}`] ?? 0;
                    return (
                      <div
                        key={`${dow}-${h}`}
                        title={`${day} ${h}:00 — ${count} ${active.label.toLowerCase()}`}
                        className={cn('m-[1px] h-6 rounded-sm', intensity(count))}
                      />
                    );
                  })}
                </>
              ))}
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Peak: {max} {active.label.toLowerCase()} in one hour-cell. Schedule staggered breaks
              in the light columns.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
