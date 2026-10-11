/* src/app/guest-portal/messages/page.jsx */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Bell,
  ChevronLeft,
  CheckCheck,
  Shield,
  Headphones,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useServiceRequest, getGuestToken } from '../../../hooks/useGuestPortalData';

function formatMessageTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * v1 messaging: guest messages are delivered to the front desk as real
 * service requests (type "concierge"). There is no two-way chat endpoint yet,
 * so: no fake staff replies, no typing simulation. Sent messages are shown
 * for the current session only.
 */
export default function MessagesPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const serviceRequest = useServiceRequest();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!hasToken) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">Please verify your reservation first</p>
        <button
          onClick={() => navigate('/guest-portal/auth/login')}
          className="mt-4 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90"
        >
          Verify Reservation
        </button>
      </div>
    );
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || serviceRequest.isPending) return;

    const id = `msg-${Date.now()}`;
    const timestamp = new Date().toISOString();
    setMessages((prev) => [...prev, { id, sender: 'guest', text, timestamp, status: 'sending' }]);
    setInput('');
    setSendError(null);

    try {
      await serviceRequest.mutateAsync({ type: 'concierge', message: text });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'delivered' } : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'failed' } : m)));
      setSendError('Message could not be delivered. Try again or call the front desk.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="border-b border-border bg-surface px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/guest-portal')}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-surface-elevated"
        >
          <ChevronLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
          <Headphones className="h-5 w-5 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary">Front Desk</h2>
          <p className="text-xs text-text-muted">Messages are delivered to the property staff</p>
        </div>
        <button
          onClick={() => navigate('/guest-portal/messages/notifications')}
          className="p-2 rounded-lg hover:bg-surface-elevated"
        >
          <Bell className="h-5 w-5 text-text-secondary" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated border border-border px-4 py-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-xs text-text-secondary">
              Messages go directly to the front desk team
            </span>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="py-12 text-center">
            <Headphones className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No messages yet</p>
            <p className="text-xs text-text-muted mt-1">
              Send a message and the front desk will be notified.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 max-w-[85%] ml-auto flex-row-reverse">
            <div className="space-y-1 items-end">
              <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-secondary text-white rounded-br-md">
                {msg.text}
              </div>
              <div className="flex items-center gap-1 justify-end mr-1 text-[10px] text-text-muted">
                <span>{formatMessageTime(msg.timestamp)}</span>
                {msg.status === 'sending' && <span>· Sending…</span>}
                {msg.status === 'delivered' && <CheckCheck className="h-3 w-3 text-accent" />}
                {msg.status === 'failed' && <span className="text-danger">· Not delivered</span>}
              </div>
            </div>
          </div>
        ))}

        {sendError && (
          <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
            <p className="text-xs text-danger">{sendError}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message to the front desk..."
              rows={1}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary resize-none max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || serviceRequest.isPending}
            className={cn(
              'p-3 rounded-xl transition-all',
              input.trim() && !serviceRequest.isPending
                ? 'bg-secondary text-white hover:bg-secondary/90 shadow-md'
                : 'bg-surface-elevated text-text-muted'
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
