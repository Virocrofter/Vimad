/* src/app/guest-portal/messages/components.jsx */
import { useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Clock,
  CheckCircle2,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Trash2,
  Archive,
  Search,
  Filter,
  Star,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

/* ─── Notification Preference Card ─── */
export function NotificationPrefCard({ icon: Icon, label, description, enabled, onToggle }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            enabled ? 'bg-secondary/10' : 'bg-surface-elevated'
          )}
        >
          <Icon className={cn('h-5 w-5', enabled ? 'text-secondary' : 'text-text-muted')} />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
          enabled ? 'bg-secondary' : 'bg-border'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

/* ─── Notification Item ─── */
export function NotificationItem({ notification, onRead, onArchive }) {
  const [expanded, setExpanded] = useState(false);

  const icons = {
    message: MessageSquare,
    alert: Bell,
    promo: Star,
    system: CheckCircle2,
  };
  const Icon = icons[notification.type] || Bell;

  const colors = {
    message: 'text-secondary bg-secondary/10',
    alert: 'text-danger bg-danger/10',
    promo: 'text-accent bg-accent/10',
    system: 'text-info bg-info/10',
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        notification.read
          ? 'border-border bg-surface opacity-75'
          : 'border-secondary/20 bg-surface ring-1 ring-secondary/10'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            colors[notification.type]?.split(' ')[1] || 'bg-surface-elevated'
          )}
        >
          <Icon
            className={cn('h-5 w-5', colors[notification.type]?.split(' ')[0] || 'text-text-muted')}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-text-primary">{notification.title}</h4>
            <span className="text-[10px] text-text-muted shrink-0">{notification.time}</span>
          </div>
          <p className={cn('text-sm text-text-secondary mt-0.5', !expanded && 'line-clamp-2')}>
            {notification.body}
          </p>
          {notification.body.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-secondary hover:underline mt-1"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 pl-13">
        {!notification.read && (
          <button
            onClick={() => onRead?.(notification.id)}
            className="text-xs text-secondary hover:underline"
          >
            Mark as read
          </button>
        )}
        <button
          onClick={() => onArchive?.(notification.id)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Archive
        </button>
      </div>
    </div>
  );
}
