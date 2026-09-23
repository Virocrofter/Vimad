/* src/app/admin/regions/data.js — static metadata & helpers only.
   Entity data (regions, tenants, migration jobs, compliance rules, latency
   history) comes from the API via api/regions.ts. */

/* ─── Region Status Metadata ─── */
export const regionStatusMeta = {
  operational: {
    label: 'Operational',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
    iconColor: 'text-accent',
  },
  degraded: {
    label: 'Degraded',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
    iconColor: 'text-warning',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
    iconColor: 'text-danger',
  },
  maintenance: {
    label: 'Maintenance',
    dot: 'bg-info',
    class: 'bg-info/10 text-info border-info/20',
    iconColor: 'text-info',
  },
};

/* ─── Migration Status Metadata ─── */
export const migrationStatusMeta = {
  completed: {
    label: 'Completed',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  in_progress: {
    label: 'In Progress',
    dot: 'bg-secondary',
    class: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  pending: {
    label: 'Pending',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  scheduled: { label: 'Scheduled', dot: 'bg-info', class: 'bg-info/10 text-info border-info/20' },
  failed: { label: 'Failed', dot: 'bg-danger', class: 'bg-danger/10 text-danger border-danger/20' },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-text-muted',
    class: 'bg-neutral/10 text-text-muted border-border',
  },
};

/* ─── Compliance Status Metadata ─── */
export const complianceStatusMeta = {
  compliant: {
    label: 'Compliant',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
  },
  at_risk: {
    label: 'At Risk',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
  },
  non_compliant: {
    label: 'Non-Compliant',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
  },
};

/* ─── Helpers ─── */
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
