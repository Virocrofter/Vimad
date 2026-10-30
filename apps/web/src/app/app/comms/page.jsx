/* src/app/app/comms/page.jsx — staff comms desk: chat inbox + review moderation */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Star, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { commsApi } from '../../../api/comms';

export default function CommsDeskPage() {
  const [tab, setTab] = useState('chat');
  const qc = useQueryClient();

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Comms Desk</h1>
          <p className="text-xs text-muted-foreground">Guest chat inbox and review moderation</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ['comms-inbox'] });
            qc.invalidateQueries({ queryKey: ['comms-reviews'] });
          }}
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        {['chat', 'reviews'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
              tab === t
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground'
            }`}
          >
            {t === 'chat' ? 'Chat inbox' : 'Reviews'}
          </button>
        ))}
      </div>

      {tab === 'chat' ? <ChatInbox /> : <ReviewQueue />}
    </div>
  );
}

function ChatInbox() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');

  const { data: inboxData } = useQuery({
    queryKey: ['comms-inbox'],
    queryFn: () => commsApi.inbox('all'),
    refetchInterval: 2500,
  });

  const threads = inboxData?.threads ?? [];
  const active = threads.find((t) => t.id === activeId) ?? null;

  const { data: threadData } = useQuery({
    queryKey: ['comms-thread', activeId],
    queryFn: () => commsApi.messages(activeId),
    enabled: Boolean(activeId),
    refetchInterval: 2500,
  });

  const reply = useMutation({
    mutationFn: () => commsApi.reply(activeId, draft.trim()),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['comms-thread', activeId] });
      qc.invalidateQueries({ queryKey: ['comms-inbox'] });
    },
  });

  const setStatus = useMutation({
    mutationFn: (status) => commsApi.setStatus(activeId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comms-inbox'] }),
  });

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <div className="rounded-lg border divide-y max-h-[70vh] overflow-y-auto">
        {threads.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`w-full text-left p-3 hover:bg-muted/50 ${activeId === t.id ? 'bg-muted' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{t.guestName}</p>
              {t.unreadForStaff > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                  {t.unreadForStaff}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {t.lastMessage ? t.lastMessage.body : 'No messages'}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t.confirmationNumber} · {t.status}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-lg border flex flex-col max-h-[70vh]">
        {!active ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Select a conversation.</p>
        ) : (
          <>
            <div className="flex items-center justify-between border-b p-3">
              <p className="text-sm font-medium">
                {active.guestName}{' '}
                <span className="text-xs text-muted-foreground">· {active.confirmationNumber}</span>
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus.mutate(active.status === 'open' ? 'closed' : 'open')}
              >
                {active.status === 'open' ? 'Close thread' : 'Reopen'}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {(threadData?.messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.authorType === 'staff' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.authorType === 'staff' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {m.authorType === 'guest' && (
                      <p className="text-[10px] font-semibold">{m.authorName}</p>
                    )}
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2 border-t p-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                placeholder="Reply…"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button disabled={!draft.trim() || reply.isPending} onClick={() => reply.mutate()}>
                {reply.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewQueue() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data } = useQuery({
    queryKey: ['comms-reviews', filter],
    queryFn: () => commsApi.reviews(filter),
    refetchInterval: 5000,
  });

  const moderate = useMutation({
    mutationFn: ({ id, status }) => commsApi.moderateReview(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comms-reviews'] }),
  });

  const reviews = data?.reviews ?? [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium border ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      {reviews.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
      {reviews.map((r) => (
        <div key={r.id} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
                  />
                ))}
              </div>
              <p className="text-sm font-medium">{r.guestName}</p>
              <span className="text-xs text-muted-foreground">{r.status}</span>
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => moderate.mutate({ id: r.id, status: 'approved' })}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moderate.mutate({ id: r.id, status: 'rejected' })}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            )}
          </div>
          {r.title && <p className="text-sm font-medium">{r.title}</p>}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>
        </div>
      ))}
    </div>
  );
}
