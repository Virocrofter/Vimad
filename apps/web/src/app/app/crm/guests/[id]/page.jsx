import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  BedDouble,
  Wallet,
  CalendarDays,
  Star,
  Pin,
  PinOff,
  Trash2,
  CheckCircle2,
  Plus,
  Send,
  Ban,
  BellOff,
} from 'lucide-react';
import {
  useGuest360,
  useGuestTimeline,
  useUpdateGuestCrm,
  useCreateCrmNote,
  useUpdateCrmNote,
  useDeleteCrmNote,
  useCreateFollowUp,
  useUpdateFollowUp,
  useCrmAssignees,
} from '../../../../../hooks/useCrm';
import { useToast } from '../../../../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  SectionCard,
  VipBadge,
  RfmBadge,
  TIMELINE_KIND,
  fmtMoney,
  fmtDate,
} from '../../components';

export default function CrmGuest360Page() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: g, isLoading, isError, refetch } = useGuest360(id);
  const { data: timeline } = useGuestTimeline(id);
  const { data: assignees } = useCrmAssignees();

  const updateCrm = useUpdateGuestCrm(id);
  const createNote = useCreateCrmNote(id);
  const updateNote = useUpdateCrmNote(id);
  const deleteNote = useDeleteCrmNote(id);
  const createFollowUp = useCreateFollowUp(id);
  const updateFollowUp = useUpdateFollowUp(id);

  const [tagInput, setTagInput] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [fuOpen, setFuOpen] = useState(false);
  const [fuTitle, setFuTitle] = useState('');
  const [fuAssignee, setFuAssignee] = useState('');
  const [fuDue, setFuDue] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !g) {
    return (
      <div className="p-6">
        <EmptyState
          title="Guest not found"
          action={<Button onClick={() => navigate('/app/guests')}>Back to guests</Button>}
        />
      </div>
    );
  }

  const name = `${g.firstName} ${g.lastName}`;

  const saveTags = () => {
    const tags = [
      ...new Set(
        tagInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    ].slice(0, 30);
    updateCrm.mutate(
      { tags },
      {
        onSuccess: () => {
          setTagInput('');
          toast({ title: 'Tags saved' });
        },
        onError: (e) =>
          toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
      }
    );
  };

  const submitNote = () => {
    if (!noteBody.trim()) return;
    createNote.mutate(
      { body: noteBody.trim() },
      {
        onSuccess: () => setNoteBody(''),
        onError: (e) =>
          toast({ title: 'Note failed', description: e.message, variant: 'destructive' }),
      }
    );
  };

  const submitFollowUp = () => {
    if (!fuTitle.trim() || !fuAssignee) return;
    createFollowUp.mutate(
      {
        title: fuTitle.trim(),
        assigneeId: fuAssignee,
        dueAt: fuDue ? new Date(fuDue).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          setFuOpen(false);
          setFuTitle('');
          setFuAssignee('');
          setFuDue('');
          toast({ title: 'Follow-up created' });
        },
        onError: (e) => toast({ title: 'Failed', description: e.message, variant: 'destructive' }),
      }
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{name}</h1>
            <VipBadge tier={g.vipStatus} />
            <RfmBadge score={g.rfm.score} />
            {g.blacklisted && (
              <Badge className="bg-red-500/15 text-red-700">
                <Ban className="mr-1 h-3 w-3" /> Blacklisted
              </Badge>
            )}
            {g.doNotDisturb && (
              <Badge variant="outline">
                <BellOff className="mr-1 h-3 w-3" /> DND
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {g.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {g.email}
              </span>
            )}
            {g.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {g.phone}
              </span>
            )}
            {g.corporateAccount && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {g.corporateAccount.name}
              </span>
            )}
            <span>{g.loyaltyPoints.toLocaleString()} loyalty pts</span>
          </div>
        </div>
        <Button onClick={() => navigate(`/app/guests/detail?id=${g.id}`)} variant="outline">
          Full guest profile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: BedDouble, label: 'Stays', value: g.stats.stays },
          { icon: Wallet, label: 'Lifetime spend', value: fmtMoney(g.stats.spend) },
          { icon: CalendarDays, label: 'Last stay', value: fmtDate(g.stats.lastStayAt) },
          {
            icon: Star,
            label: 'Recency',
            value: g.rfm.recencyDays !== null ? `${g.rfm.recencyDays}d ago` : 'never',
          },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">{label}</span>
            </div>
            <div className="mt-2 text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <SectionCard title="Timeline" className="lg:col-span-2">
          {!timeline || timeline.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Reservations, payments, emails and notes will appear here."
            />
          ) : (
            <div className="relative space-y-4 pl-4 before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-px before:bg-border">
              {timeline.map((e, i) => (
                <div key={i} className="relative">
                  <span
                    className={`absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full ${TIMELINE_KIND[e.kind]?.dot ?? 'bg-muted'}`}
                  />
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.at).toLocaleString('en-ZA')}
                  </div>
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="text-sm text-muted-foreground break-words">{e.detail}</div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          {/* Tags + VIP */}
          <SectionCard title="Tags & VIP">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {g.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
              {g.tags.length === 0 && (
                <span className="text-xs text-muted-foreground">No tags</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="add tags, comma separated"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <Button
                size="sm"
                disabled={updateCrm.isPending || !tagInput.trim()}
                onClick={saveTags}
              >
                Save
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">VIP tier</span>
              <select
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
                value={g.vipStatus ?? ''}
                onChange={(e) => updateCrm.mutate({ vipStatus: e.target.value || null })}
              >
                <option value="">none</option>
                {['bronze', 'silver', 'gold', 'platinum', 'diamond'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </SectionCard>

          {/* Segments */}
          <SectionCard title="Segments">
            {g.segments.length === 0 ? (
              <span className="text-xs text-muted-foreground">Not in any segment yet.</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {g.segments.map((s) => (
                  <Badge key={s.id} variant={s.isActive ? 'default' : 'outline'}>
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Follow-ups */}
          <SectionCard
            title="Open follow-ups"
            action={
              <Button size="sm" variant="outline" onClick={() => setFuOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            }
          >
            {g.openFollowUps.length === 0 ? (
              <span className="text-xs text-muted-foreground">Nothing open.</span>
            ) : (
              <div className="space-y-2">
                {g.openFollowUps.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{f.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.dueAt ? `due ${fmtDate(f.dueAt)}` : 'no due date'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={updateFollowUp.isPending}
                      onClick={() => updateFollowUp.mutate({ id: f.id, input: { done: true } })}
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Reviews */}
          <SectionCard title="Reviews">
            {g.reviews?.length ? (
              <div className="space-y-2">
                {g.reviews.map((r) => (
                  <div key={r.id} className="rounded-md border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
                          />
                        ))}
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${
                          r.status === 'approved'
                            ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400'
                            : r.status === 'rejected'
                              ? 'border-red-300 text-red-600'
                              : 'border-amber-300 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    {r.title && <p className="mt-1 text-sm font-medium">{r.title}</p>}
                    <p className="mt-1 whitespace-pre-wrap text-sm">{r.body}</p>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {fmtDate(r.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No reviews yet.</span>
            )}
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes">
            <div className="space-y-2">
              {g.recentNotes.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-md border p-2.5 ${n.pinned ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{fmtDate(n.createdAt)}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateNote.mutate({ id: n.id, input: { pinned: !n.pinned } })
                        }
                      >
                        {n.pinned ? (
                          <PinOff className="h-3.5 w-3.5" />
                        ) : (
                          <Pin className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm('Delete this note?')) deleteNote.mutate(n.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
                </div>
              ))}
              {g.recentNotes.length === 0 && (
                <span className="text-xs text-muted-foreground">No notes yet.</span>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Add a note…"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={3}
              />
              <Button
                size="sm"
                disabled={createNote.isPending || !noteBody.trim()}
                onClick={submitNote}
              >
                <Send className="mr-1 h-3.5 w-3.5" /> Add note
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Follow-up dialog */}
      <Dialog open={fuOpen} onOpenChange={setFuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Title (e.g. Call back about corporate rates)"
              value={fuTitle}
              onChange={(e) => setFuTitle(e.target.value)}
            />
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={fuAssignee}
              onChange={(e) => setFuAssignee(e.target.value)}
            >
              <option value="">Assign to…</option>
              {(assignees ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Input type="datetime-local" value={fuDue} onChange={(e) => setFuDue(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFuOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitFollowUp}
                disabled={createFollowUp.isPending || !fuTitle.trim() || !fuAssignee}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
