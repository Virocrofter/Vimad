/* src/app/guest-portal/support/tickets/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Ticket,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  Send,
  X,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { TicketCard, TicketDetail } from '../components';
import { ticketStatusMeta } from '../data';

const initialTickets = [
  {
    id: 'TKT-2026-001',
    subject: 'Late checkout request not reflected',
    category: 'Billing',
    status: 'in_progress',
    priority: 'medium',
    createdAt: 'Aug 14, 2026',
    lastUpdated: '2h ago',
    lastMessage:
      'Hi, I requested a late checkout through the app but I see a charge for an extra night on my folio. Could you please review and remove this charge?',
    messages: [
      {
        sender: 'guest',
        text: 'Hi, I requested a late checkout through the app but I see a charge for an extra night on my folio. Could you please review and remove this charge?',
        time: 'Aug 14, 10:30 AM',
      },
      {
        sender: 'staff',
        text: 'Thank you for reaching out. I apologize for the confusion. I am reviewing your request and will get back to you shortly.',
        time: 'Aug 14, 11:00 AM',
      },
      {
        sender: 'staff',
        text: 'I have reviewed your account. The charge was applied in error and has been removed. Your late checkout until 2 PM is confirmed at no charge.',
        time: '2h ago',
      },
    ],
  },
  {
    id: 'TKT-2026-002',
    subject: 'Room service order missing item',
    category: 'Room Service',
    status: 'resolved',
    priority: 'low',
    createdAt: 'Aug 13, 2026',
    lastUpdated: '1d ago',
    lastMessage: 'My breakfast order arrived but was missing the orange juice. Order #SVC-001.',
    messages: [
      {
        sender: 'guest',
        text: 'My breakfast order arrived but was missing the orange juice. Order #SVC-001.',
        time: 'Aug 13, 9:15 AM',
      },
      {
        sender: 'staff',
        text: 'We sincerely apologize for the missing item. We are sending the orange juice to your room immediately along with a complimentary pastry for the inconvenience.',
        time: 'Aug 13, 9:25 AM',
      },
      {
        sender: 'guest',
        text: 'Received, thank you for the quick response!',
        time: 'Aug 13, 9:40 AM',
      },
      {
        sender: 'staff',
        text: 'You are welcome! We hope you enjoy the rest of your stay. This ticket has been resolved.',
        time: '1d ago',
      },
    ],
  },
  {
    id: 'TKT-2026-003',
    subject: 'WiFi connection issues in room 204',
    category: 'Technology',
    status: 'closed',
    priority: 'high',
    createdAt: 'Aug 12, 2026',
    lastUpdated: '3d ago',
    lastMessage:
      'The WiFi in my room keeps disconnecting every few minutes. I have tried reconnecting multiple times.',
    messages: [
      {
        sender: 'guest',
        text: 'The WiFi in my room keeps disconnecting every few minutes. I have tried reconnecting multiple times.',
        time: 'Aug 12, 8:00 PM',
      },
      {
        sender: 'staff',
        text: 'I apologize for the inconvenience. Our IT team is investigating the issue with the access point on your floor.',
        time: 'Aug 12, 8:15 PM',
      },
      {
        sender: 'staff',
        text: 'The access point has been reset and the connection should be stable now. Please let us know if you experience any further issues.',
        time: 'Aug 12, 9:00 PM',
      },
      { sender: 'guest', text: 'Working perfectly now, thank you!', time: 'Aug 12, 9:10 PM' },
    ],
  },
];

export default function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<(typeof initialTickets)[number] | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'General',
    priority: 'medium',
    message: '',
  });

  const filteredTickets = tickets
    .filter((t) => filter === 'all' || t.status === filter)
    .filter(
      (t) =>
        !searchQuery ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleCreateTicket = () => {
    const ticket = {
      id: `TKT-${Date.now().toString(36).toUpperCase()}`,
      subject: newTicket.subject,
      category: newTicket.category,
      status: 'open',
      priority: newTicket.priority,
      createdAt: 'Just now',
      lastUpdated: 'Just now',
      lastMessage: newTicket.message,
      messages: [{ sender: 'guest', text: newTicket.message, time: 'Just now' }],
    };
    setTickets((prev) => [ticket, ...prev]);
    setShowCreateModal(false);
    setNewTicket({ subject: '', category: 'General', priority: 'medium', message: '' });
  };

  const handleReply = (ticketId: string, text: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          lastMessage: text,
          lastUpdated: 'Just now',
          messages: [...t.messages, { sender: 'guest', text, time: 'Just now' }],
        };
      })
    );
  };

  if (selectedTicket) {
    return (
      <div className="max-w-2xl mx-auto">
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onReply={(text: string) => handleReply(selectedTicket.id, text)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/support')}
          className="p-2 -ml-2 rounded-lg hover:bg-surface-elevated"
        >
          <ChevronLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Support Tickets</h1>
          <p className="text-sm text-text-secondary">{tickets.length} total tickets</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New Ticket
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {['all', 'open', 'in_progress', 'resolved'].map((status) => {
          const count =
            status === 'all' ? tickets.length : tickets.filter((t) => t.status === status).length;
          const meta = ticketStatusMeta[status as keyof typeof ticketStatusMeta] || {
            label: 'All',
            color: 'text-text-primary',
            dot: 'bg-text-muted',
          };
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'rounded-lg border px-3 py-2 text-center transition-colors',
                filter === status
                  ? 'border-secondary bg-secondary/5'
                  : 'border-border bg-surface hover:bg-surface-elevated'
              )}
            >
              <p
                className={cn(
                  'text-lg font-bold',
                  filter === status ? 'text-secondary' : 'text-text-primary'
                )}
              >
                {count}
              </p>
              <p className="text-[10px] text-text-muted">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Tickets */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />
        ))}
        {filteredTickets.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No tickets found</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Create Support Ticket</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-surface-elevated"
              >
                <X className="h-5 w-5 text-text-muted" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none"
                  >
                    <option>General</option>
                    <option>Billing</option>
                    <option>Room Service</option>
                    <option>Technology</option>
                    <option>Housekeeping</option>
                    <option>Concierge</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!newTicket.subject.trim() || !newTicket.message.trim()}
                onClick={handleCreateTicket}
              >
                <Send className="mr-1.5 h-4 w-4" /> Submit Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
