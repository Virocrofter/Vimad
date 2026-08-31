/* src/app/guest-portal/messages/page.jsx */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Paperclip,
  Phone,
  Bell,
  ChevronLeft,
  Clock,
  CheckCheck,
  MoreVertical,
  Image,
  Mic,
  Smile,
  Shield,
  User,
  Headphones,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useGuestStore } from '../store';
import { mockMessages, mockStaff, formatMessageTime } from './components';

export default function MessagesPage() {
  const navigate = useNavigate();
  const { guest, addMessage } = useGuestStore();
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const staff = mockStaff;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'guest',
      text: input.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
      attachments: [],
    };

    setMessages((prev) => [...prev, newMessage]);
    addMessage(newMessage);
    setInput('');

    // Simulate staff typing
    setTimeout(() => setIsTyping(true), 800);
    setTimeout(() => {
      setIsTyping(false);
      const autoReply = {
        id: `msg-${Date.now()}-staff`,
        sender: 'staff',
        staffId: 'staff-001',
        text: 'Thank you for your message. A member of our team will assist you shortly. Is there anything specific we can help you with regarding your stay?',
        timestamp: new Date().toISOString(),
        status: 'delivered',
        attachments: [],
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

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
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
            <Headphones className="h-5 w-5 text-secondary" />
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-accent border-2 border-surface" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-text-primary">Front Desk</h2>
          <p className="text-xs text-accent flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Online
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/guest-portal/messages/notifications')}
            className="relative p-2 rounded-lg hover:bg-surface-elevated"
          >
            <Bell className="h-5 w-5 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
          </button>
          <button className="p-2 rounded-lg hover:bg-surface-elevated">
            <Phone className="h-5 w-5 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Welcome */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated border border-border px-4 py-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-xs text-text-secondary">
              Messages are encrypted and monitored for your safety
            </span>
          </div>
        </div>

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="space-y-3">
            <div className="flex items-center justify-center">
              <span className="text-[10px] text-text-muted bg-surface-elevated border border-border rounded-full px-3 py-1">
                {date}
              </span>
            </div>
            {msgs.map((msg, idx) => {
              const isGuest = msg.sender === 'guest';
              const showAvatar = idx === 0 || msgs[idx - 1].sender !== msg.sender;
              const staffMember = isGuest ? null : staff.find((s) => s.id === msg.staffId);

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2 max-w-[85%]',
                    isGuest ? 'ml-auto flex-row-reverse' : ''
                  )}
                >
                  {!isGuest && showAvatar && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                      {staffMember?.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                  )}
                  {!isGuest && !showAvatar && <div className="w-8 shrink-0" />}

                  <div className={cn('space-y-1', isGuest ? 'items-end' : 'items-start')}>
                    {!isGuest && showAvatar && (
                      <p className="text-[10px] text-text-muted ml-1">{staffMember?.name}</p>
                    )}
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                        isGuest
                          ? 'bg-secondary text-white rounded-br-md'
                          : 'bg-surface-elevated border border-border text-text-primary rounded-bl-md'
                      )}
                    >
                      {msg.text}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                                isGuest ? 'bg-white/10' : 'bg-background'
                              )}
                            >
                              {att.type === 'image' ? (
                                <Image className="h-4 w-4" />
                              ) : (
                                <Paperclip className="h-4 w-4" />
                              )}
                              <span className="truncate">{att.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[10px] text-text-muted',
                        isGuest ? 'justify-end mr-1' : 'ml-1'
                      )}
                    >
                      <span>{formatMessageTime(msg.timestamp)}</span>
                      {isGuest && (
                        <CheckCheck
                          className={cn(
                            'h-3 w-3',
                            msg.status === 'read' ? 'text-accent' : 'text-text-muted'
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10">
              <Headphones className="h-4 w-4 text-secondary" />
            </div>
            <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-text-muted animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-surface px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
              className="p-2.5 rounded-xl hover:bg-surface-elevated text-text-muted transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            {attachmentMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAttachmentMenuOpen(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-50 rounded-xl border border-border bg-surface-elevated shadow-xl p-2 space-y-1 w-48">
                  <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-background text-sm text-text-secondary">
                    <Image className="h-4 w-4 text-secondary" /> Photo
                  </button>
                  <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-background text-sm text-text-secondary">
                    <Mic className="h-4 w-4 text-secondary" /> Voice Message
                  </button>
                  <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-background text-sm text-text-secondary">
                    <Smile className="h-4 w-4 text-secondary" /> Sticker
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary resize-none max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              'p-3 rounded-xl transition-all',
              input.trim()
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
