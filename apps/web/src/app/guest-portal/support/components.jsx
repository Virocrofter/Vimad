/* src/app/guest-portal/support/components.jsx */
import { useState } from 'react';
import {
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User,
  Calendar,
  Tag,
  FileText,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

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

/* ─── Ticket Card ─── */
export function TicketCard({ ticket, onClick }) {
  const status = ticketStatusMeta[ticket.status];
  const priority = ticketPriorityMeta[ticket.priority];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md hover:border-secondary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text-primary truncate">{ticket.subject}</h3>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                status.bg,
                status.color,
                status.border
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {ticket.id} - {ticket.category}
          </p>
          <p className={cn('text-sm text-text-secondary mt-2', 'line-clamp-2')}>
            {ticket.lastMessage}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-text-muted shrink-0 mt-1" />
      </div>
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {ticket.lastUpdated}
        </span>
        <span className={cn('font-medium', priority.color)}>{priority.label} Priority</span>
      </div>
    </button>
  );
}

/* ─── Ticket Detail ─── */
export function TicketDetail({ ticket, onClose, onReply }) {
  const [reply, setReply] = useState('');
  const status = ticketStatusMeta[ticket.status];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 -ml-2 rounded-lg hover:bg-surface-elevated">
          <ChevronRight className="h-5 w-5 text-text-secondary rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-text-primary">{ticket.subject}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                status.bg,
                status.color,
                status.border
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
            <span className="text-xs text-text-muted">{ticket.id}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {ticket.messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn('flex gap-3', msg.sender === 'guest' ? 'flex-row-reverse' : '')}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                msg.sender === 'guest'
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-accent/10 text-accent'
              )}
            >
              {msg.sender === 'guest' ? 'You' : 'ST'}
            </div>
            <div
              className={cn(
                'rounded-xl px-4 py-3 max-w-[80%]',
                msg.sender === 'guest'
                  ? 'bg-secondary text-white rounded-br-md'
                  : 'bg-surface-elevated border border-border rounded-bl-md'
              )}
            >
              <p className="text-sm">{msg.text}</p>
              <span
                className={cn(
                  'text-[10px] mt-1 block',
                  msg.sender === 'guest' ? 'text-white/70' : 'text-text-muted'
                )}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <div className="flex gap-2 pt-4 border-t border-border">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type a reply..."
            className="flex-1 h-10 rounded-lg border border-border bg-background px-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          />
          <button
            onClick={() => {
              onReply?.(reply);
              setReply('');
            }}
            disabled={!reply.trim()}
            className={cn(
              'px-4 rounded-lg text-sm font-medium transition-colors',
              reply.trim()
                ? 'bg-secondary text-white hover:bg-secondary/90'
                : 'bg-surface-elevated text-text-muted'
            )}
          >
            Reply
          </button>
        </div>
      )}
    </div>
  );
}
