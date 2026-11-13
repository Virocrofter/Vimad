import { useMemo } from 'react';

interface TimeAgoProps {
  date: string | Date;
  className?: string;
}

const rtf =
  typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl
    ? new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    : null;

function diffParts(from: Date, to: Date): [number, Intl.RelativeTimeFormatUnit] {
  const s = Math.round((from.getTime() - to.getTime()) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return [s, 'second'];
  if (abs < 3600) return [Math.round(s / 60), 'minute'];
  if (abs < 86400) return [Math.round(s / 3600), 'hour'];
  return [Math.round(s / 86400), 'day'];
}

export function TimeAgo({ date, className }: TimeAgoProps) {
  const d = useMemo(() => {
    if (date instanceof Date) return date;
    return new Date(date as string | number);
  }, [date]);
  const now = new Date();
  const [value, unit] = diffParts(d, now);
  const relative = rtf ? rtf.format(value, unit) : d.toLocaleString();
  const absolute = d.toLocaleString();
  return (
    <time dateTime={d.toISOString()} title={absolute} className={className ?? ''}>
      {relative}
    </time>
  );
}
