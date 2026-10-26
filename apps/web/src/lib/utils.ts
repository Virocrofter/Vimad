import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Simple className joiner (enhanced with tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as currency. */
export function formatCurrency(
  value: number | null | undefined,
  currency = 'ZAR',
  opts: Intl.NumberFormatOptions = {}
) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    ...opts,
  }).format(value);
}

/** Format a number with thousands separators. */
export function formatNumber(value: number | null | undefined) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

/** Format an ISO date string as a readable date. */
export function formatDate(
  value: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  });
}

/** Format an ISO date string as date + time. */
export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Relative time, e.g. "3h ago". */
export function timeAgo(value: string | Date | null | undefined) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

/** Convert bytes to a human-readable string. */
export function formatBytes(bytes: number | null | undefined) {
  if (bytes == null || isNaN(bytes)) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function extractList<T = unknown>(payload: unknown): T[] {
  const data = (payload as { data?: unknown } | null | undefined)?.data ?? payload;
  return Array.isArray(data) ? (data as T[]) : [];
}
