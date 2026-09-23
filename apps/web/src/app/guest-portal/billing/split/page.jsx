/* src/app/guest-portal/billing/split/page.jsx */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Plus,
  Minus,
  CheckCircle2,
  Receipt,
  Trash2,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestStay, splitParticipants, formatCurrency, folioCategoryMeta } from '../../data';

export default function SplitBillPage() {
  const navigate = useNavigate();
  const { folio } = guestStay;
  const [participants, setParticipants] = useState(splitParticipants);
  const [assignments, setAssignments] = useState({});
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [sentTo, setSentTo] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Calculate totals per participant
  const participantTotals = useMemo(() => {
    const totals = {};
    participants.forEach((p) => {
      totals[p.id] = 0;
    });

    Object.entries(assignments).forEach(([chargeId, participantId]) => {
      const charge = folio.charges.find((c) => c.id === chargeId);
      if (charge && totals[participantId] !== undefined) {
        totals[participantId] += charge.amount;
      }
    });
    return totals;
  }, [assignments, participants, folio.charges]);

  // Unassigned charges
  const unassignedTotal = useMemo(() => {
    return folio.charges.filter((c) => !assignments[c.id]).reduce((s, c) => s + c.amount, 0);
  }, [assignments, folio.charges]);

  const handleAssign = (chargeId, participantId) => {
    setAssignments((prev) => ({ ...prev, [chargeId]: participantId }));
  };

  const handleUnassign = (chargeId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[chargeId];
      return next;
    });
  };

  const handleAddGuest = () => {
    if (!newGuestName.trim() || !newGuestEmail.trim()) return;
    const newId = `P-${Date.now()}`;
    setParticipants((prev) => [
      ...prev,
      {
        id: newId,
        name: newGuestName.trim(),
        email: newGuestEmail.trim(),
        avatar: newGuestName
          .trim()
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
        isPrimary: false,
        share: 0,
      },
    ]);
    setNewGuestName('');
    setNewGuestEmail('');
    setShowAddGuest(false);
  };

  const handleRemoveGuest = (id) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k] === id) delete next[k];
      });
      return next;
    });
  };

  const handleSendRequest = (participantId) => {
    setSentTo((prev) => [...prev, participantId]);
    setTimeout(() => {
      setSentTo((prev) => prev.filter((id) => id !== participantId));
    }, 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://vimad.io/split/${guestStay.confirmationNumber}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const splitLink = `https://vimad.io/split/${guestStay.confirmationNumber}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/billing')}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Split Bill</h1>
          <p className="text-sm text-text-secondary">Assign charges to guests and share the bill</p>
        </div>
      </div>

      {/* Share Link */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
              <LinkIcon className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Share Split Link</p>
              <p className="text-xs text-text-muted">Guests can view their assigned charges</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono text-text-muted truncate max-w-50">
              {splitLink}
            </code>
            <button
              onClick={handleCopyLink}
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium transition-colors',
                copiedLink
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
              )}
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Guests ({participants.length})
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowAddGuest(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Guest
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {participants.map((p) => (
            <div
              key={p.id}
              className={cn(
                'rounded-xl border bg-surface p-4 transition-all',
                p.isPrimary ? 'border-secondary/30 ring-1 ring-secondary/10' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold',
                      p.isPrimary ? 'bg-secondary text-white' : 'bg-border text-text-muted'
                    )}
                  >
                    {p.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.email}</p>
                    {p.isPrimary && (
                      <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[9px] font-medium text-secondary mt-0.5 inline-block">
                        Primary Guest
                      </span>
                    )}
                  </div>
                </div>
                {!p.isPrimary && (
                  <button
                    onClick={() => handleRemoveGuest(p.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Their Charges */}
              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  Assigned Charges
                </p>
                {folio.charges
                  .filter((c) => assignments[c.id] === p.id)
                  .map((c) => (
                    <div key={c.id} className="flex items-center justify-between py-1">
                      <span className="text-xs text-text-secondary truncate">{c.description}</span>
                      <span className="text-xs font-mono text-text-primary">
                        {formatCurrency(c.amount)}
                      </span>
                    </div>
                  ))}
                {folio.charges.filter((c) => assignments[c.id] === p.id).length === 0 && (
                  <p className="text-xs text-text-muted italic">No charges assigned</p>
                )}
              </div>

              {/* Total & Actions */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Total</span>
                  <span className="text-sm font-bold font-mono text-text-primary">
                    {formatCurrency(participantTotals[p.id])}
                  </span>
                </div>
                {participantTotals[p.id] > 0 && !p.isPrimary && (
                  <button
                    onClick={() => handleSendRequest(p.id)}
                    disabled={sentTo.includes(p.id)}
                    className={cn(
                      'mt-2 w-full inline-flex h-8 items-center justify-center gap-1 rounded-md border text-xs font-medium transition-colors',
                      sentTo.includes(p.id)
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                    )}
                  >
                    {sentTo.includes(p.id) ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Request Sent
                      </>
                    ) : (
                      <>
                        <Mail className="h-3.5 w-3.5" /> Send Summary
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Guest Form */}
        {showAddGuest && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <h4 className="text-sm font-medium text-text-primary mb-3">Add Guest</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Full name"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <input
                type="email"
                placeholder="Email address"
                value={newGuestEmail}
                onChange={(e) => setNewGuestEmail(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleAddGuest}
                disabled={!newGuestName.trim() || !newGuestEmail.trim()}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddGuest(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Charges to Assign */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border bg-background px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Receipt className="h-4 w-4 text-secondary" /> Assign Charges
          </h3>
          <span className="text-xs text-text-muted">
            {Object.keys(assignments).length} of {folio.charges.length} assigned
          </span>
        </div>
        <div className="divide-y divide-border">
          {folio.charges.map((charge) => {
            const assignedTo = assignments[charge.id];
            const assignee = participants.find((p) => p.id === assignedTo);
            const meta = folioCategoryMeta[charge.category] || folioCategoryMeta.services;
            return (
              <div
                key={charge.id}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{meta.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{charge.description}</p>
                    <p className="text-xs text-text-muted">
                      {meta.label} · {charge.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono font-medium text-text-primary">
                    {formatCurrency(charge.amount)}
                  </span>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        <CheckCircle2 className="h-3 w-3" /> {assignee.name}
                      </span>
                      <button
                        onClick={() => handleUnassign(charge.id)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {participants.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleAssign(charge.id, p.id)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[10px] font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
                          title={`Assign to ${p.name}`}
                        >
                          {p.avatar}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {unassignedTotal > 0 && (
          <div className="border-t border-border bg-background px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Unassigned charges</span>
              <span className="text-sm font-bold font-mono text-warning">
                {formatCurrency(unassignedTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Split Summary</h3>
        <div className="space-y-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-secondary">{p.name}</span>
                {p.isPrimary && <span className="text-[10px] text-secondary">(You)</span>}
              </div>
              <span className="text-sm font-mono font-medium text-text-primary">
                {formatCurrency(participantTotals[p.id])}
              </span>
            </div>
          ))}
          {unassignedTotal > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-warning">Unassigned</span>
              <span className="text-sm font-mono font-medium text-warning">
                {formatCurrency(unassignedTotal)}
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Total</span>
            <span className="text-lg font-bold font-mono text-text-primary">
              {formatCurrency(folio.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
