/* src/app/guest-portal/messages/page.jsx — G5: real two-way chat */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, Send, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { getGuestToken } from '../../../hooks/guestPortalApi';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  useChatThread,
  useSendChatMessage,
  useCloseChatThread,
} from '../../../hooks/useGuestComms';
import { formatDate } from '../../../lib/guest-utils';

function newClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data, isLoading, isError, refetch } = useChatThread();
  const send = useSendChatMessage();
  const closeThread = useCloseChatThread();

  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState([]);
  const bottomRef = useRef(null);

  const qc = useQueryClient();

  useEffect(() => {
    const token = getGuestToken();
    if (!token) return undefined;
    const base = String(import.meta.env?.VITE_API_URL ?? `${window.location.origin}/api`).replace(
      /\/api\/?$/,
      ''
    );
    const socket = io(base, { auth: { token } });
    socket.on('chat:message', () => {
      qc.invalidateQueries({ queryKey: ['gp-chat'] });
    });
    return () => {
      socket.disconnect();
    };
  }, [qc]);

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages?.length, pending.length]);

  const messages = useMemo(() => {
    const confirmed = (data?.messages ?? []).map((m) => ({ ...m, optimistic: false }));
    const merged = [...confirmed];
    for (const p of pending) {
      if (!confirmed.some((m) => m.clientId === p.clientId)) merged.push(p);
    }
    return merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [data?.messages, pending]);

  if (!hasToken) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Opening conversation…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't open the conversation.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const closed = data.thread.status === 'closed';

  const handleSend = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    const clientId = newClientId();
    setPending((p) => [
      ...p,
      {
        id: `pending-${clientId}`,
        clientId,
        authorType: 'guest',
        authorName: 'You',
        body,
        createdAt: new Date().toISOString(),
        optimistic: true,
      },
    ]);
    setDraft('');
    send.mutate(
      { body, clientId },
      {
        onSettled: () => setPending((p) => p.filter((m) => m.clientId !== clientId)),
      }
    );
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] pb-20">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/guest-portal')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Chat with us</h1>
          <p className="text-xs text-text-muted">
            {closed ? 'Conversation closed' : 'Front desk · replies typically within minutes'}
          </p>
        </div>
        {!closed && messages.length > 0 && (
          <button
            onClick={() => closeThread.mutate()}
            className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-danger"
          >
            <X className="h-3.5 w-3.5" /> End chat
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <CheckCircle2 className="h-7 w-7 text-secondary mx-auto mb-2" />
            <p className="text-sm text-text-muted">
              Say hello — the front desk sees your messages here.
            </p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.authorType === 'guest';
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                  mine
                    ? 'bg-secondary text-white rounded-br-sm'
                    : 'bg-surface border border-border text-text-primary rounded-bl-sm',
                  m.optimistic && 'opacity-60'
                )}
              >
                {!mine && (
                  <p className="text-[10px] font-semibold text-secondary mb-0.5">{m.authorName}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn('text-[9px] mt-1', mine ? 'text-white/60' : 'text-text-muted')}>
                  {formatDate(m.createdAt)}
                  {m.optimistic && ' · sending…'}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!closed ? (
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || send.isPending}
            className="h-[46px]"
          >
            {send.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <p className="text-center text-xs text-text-muted">
          This conversation has ended. Open a support ticket for anything further.
        </p>
      )}
      {send.isError && <p className="text-xs text-danger mt-2">{send.error?.message}</p>}
    </div>
  );
}
