/* src/app/app/keys/constants.js */
import {
  Key,
  Shield,
  Smartphone,
  Lock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  DoorOpen,
} from 'lucide-react';

/* ─── Status Metadata ─── */
export const keyStatusMeta = {
  active: {
    label: 'Active',
    class: 'bg-accent/10 text-accent border-accent/20',
    dot: 'bg-accent',
    icon: CheckCircle2,
  },
  issued: {
    label: 'Issued',
    class: 'bg-info/10 text-info border-info/20',
    dot: 'bg-info',
    icon: Key,
  },
  returned: {
    label: 'Returned',
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
    icon: Lock,
  },
  expired: {
    label: 'Expired',
    class: 'bg-warning/10 text-warning border-warning/20',
    dot: 'bg-warning',
    icon: Clock,
  },
  revoked: {
    label: 'Revoked',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: AlertTriangle,
  },
  lost: {
    label: 'Lost',
    class: 'bg-danger/10 text-danger border-danger/20',
    dot: 'bg-danger',
    icon: AlertTriangle,
  },
};

export const keyTypeMeta = {
  physical: { label: 'Physical', icon: Key, color: 'text-secondary' },
  digital: { label: 'Digital', icon: Smartphone, color: 'text-info' },
  master: { label: 'Master', icon: Shield, color: 'text-warning' },
  emergency: { label: 'Emergency', icon: DoorOpen, color: 'text-danger' },
};

export const accessLevelMeta = {
  guest: { label: 'Guest', class: 'bg-accent/10 text-accent border-accent/20' },
  staff: { label: 'Staff', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  manager: { label: 'Manager', class: 'bg-warning/10 text-warning border-warning/20' },
  admin: { label: 'Admin', class: 'bg-danger/10 text-danger border-danger/20' },
};
