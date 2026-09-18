/* src/app/guest-portal/support/data.js */

export const ticketStatusMeta = {
  open: {
    label: 'Open',
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/20',
    dot: 'bg-info',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
    dot: 'bg-warning',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    dot: 'bg-accent',
  },
  closed: {
    label: 'Closed',
    color: 'text-text-muted',
    bg: 'bg-neutral/10',
    border: 'border-border',
    dot: 'bg-text-muted',
  },
};

export const ticketPriorityMeta = {
  low: { label: 'Low', color: 'text-text-muted' },
  medium: { label: 'Medium', color: 'text-warning' },
  high: { label: 'High', color: 'text-danger' },
  urgent: { label: 'Urgent', color: 'text-danger' },
};
