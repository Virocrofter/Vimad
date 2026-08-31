/* src/app/guest-portal/stay/issues/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wrench, Sparkles, Wifi, Volume2, Shield, HelpCircle,
  CheckCircle2, AlertTriangle, X, Send, Loader2, Camera, Upload,
  ChevronRight, Clock, MessageSquare, FileText, Image, Plus
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { issueCategories } from '../../data';

export default function IssuesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([
    {
      id: 'TIX-001',
      category: 'tech',
      description: 'WiFi keeps disconnecting in room 204',
      urgency: 'normal',
      status: 'resolved',
      createdAt: '2026-08-13T10:00:00Z',
      updatedAt: '2026-08-13T14:30:00Z',
      response: 'We have reset the access point for your floor. Please try reconnecting.',
    },
  ]);

  const handleSubmit = () => {
    if (!selectedCategory || !description.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const newTicket = {
        id: `TIX-${Date.now().toString(36).toUpperCase()}`,
        category: selectedCategory.type,
        description: description.trim(),
        urgency,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTickets(prev => [newTicket, ...prev]);
      setLoading(false);
      setSubmitted(true);
      setSelectedCategory(null);
      setDescription('');
      setUrgency('normal');
      setTimeout(() => setSubmitted(false), 4000);
    }, 1000);
  };

  const urgencyOptions = [
    { id: 'low', label: 'Low', description: 'Not urgent, can wait', color: 'text-accent' },
    { id: 'normal', label: 'Normal', description: 'Standard priority', color: 'text-info' },
    { id: 'high', label: 'High', description: 'Needs attention soon', color: 'text-warning' },
    { id: 'urgent', label: 'Urgent', description: 'Immediate attention needed', color: 'text-danger' },
  ];

  const statusColors = {
    open: 'bg-warning/10 text-warning',
    in_progress: 'bg-info/10 text-info',
    resolved: 'bg-accent/10 text-accent',
    closed: 'bg-text-muted/10 text-text-muted',
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/stay')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Report an Issue</h1>
          <p className="text-xs text-text-muted">Room 204 · We\'re here to help</p>
        </div>
      </div>

      {/* Success Toast */}
      {submitted && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">Issue Reported!</p>
            <p className="text-xs text-text-secondary">Our team will address it as soon as possible.</p>
          </div>
        </div>
      )}

      {/* New Ticket Form */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary">New Report</h2>

        {/* Category Selection */}
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">Category</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {issueCategories.map((category) => {
              const icons = {
                Wrench: Wrench,
                Sparkles: Sparkles,
                Wifi: Wifi,
                Volume2: Volume2,
                Shield: Shield,
                HelpCircle: HelpCircle,
              };
              const Icon = icons[category.icon] || HelpCircle;
              const isSelected = selectedCategory?.id === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3 transition-all',
                    isSelected
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border bg-background hover:bg-surface-elevated'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    isSelected ? 'bg-secondary/10' : 'bg-border'
                  )}>
                    <Icon className={cn('h-5 w-5', isSelected ? 'text-secondary' : 'text-text-muted')} />
                  </div>
                  <span className={cn('text-xs font-medium', isSelected ? 'text-secondary' : 'text-text-primary')}>
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the issue in detail..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        {/* Urgency */}
        <div>
          <label className="text-xs font-medium text-text-secondary uppercase mb-2 block">Urgency</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {urgencyOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setUrgency(opt.id)}
                className={cn(
                  'rounded-lg border p-2.5 text-left transition-all',
                  urgency === opt.id
                    ? 'border-secondary bg-secondary/5'
                    : 'border-border bg-background hover:bg-surface-elevated'
                )}
              >
                <p className={cn('text-sm font-medium', urgency === opt.id ? 'text-secondary' : opt.color)}>
                  {opt.label}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedCategory || !description.trim() || loading}
          className="w-full rounded-lg bg-secondary py-2.5 text-sm font-medium text-white hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Report
            </>
          )}
        </button>
      </div>

      {/* Ticket History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">Your Reports</h2>
        {tickets.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-border bg-surface">
            <HelpCircle className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-sm text-text-muted">No issues reported yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-medium capitalize', statusColors[ticket.status])}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={cn(
                      'text-[10px] font-medium',
                      ticket.urgency === 'urgent' ? 'text-danger' :
                      ticket.urgency === 'high' ? 'text-warning' :
                      ticket.urgency === 'normal' ? 'text-info' : 'text-accent'
                    )}>
                      {ticket.urgency}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted font-mono">{ticket.id}</span>
                </div>
                <p className="text-sm text-text-primary">{ticket.description}</p>
                {ticket.response && (
                  <div className="rounded-lg bg-accent/5 border border-accent/10 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs font-medium text-accent">Staff Response</span>
                    </div>
                    <p className="text-xs text-text-secondary">{ticket.response}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />
                  {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

