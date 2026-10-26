/* apps/web/src/app/app/guest-identity/page.jsx — C3 shared guest profiles */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Fingerprint,
  GitMerge,
  ShieldAlert,
  Crown,
  X,
  Search,
  Users,
  Sparkles,
  BedDouble,
  StickyNote,
} from 'lucide-react';
import { apiGet } from '../../../api/client';
import {
  listGroups,
  getGroup,
  createGroup,
  removeMember,
  dedupeReport,
} from '../../../api/guestIdentity';

const VIP_STYLE = {
  bronze: 'bg-amber-600/10 text-amber-600',
  silver: 'bg-slate-400/10 text-slate-400',
  gold: 'bg-yellow-500/10 text-yellow-500',
  platinum: 'bg-indigo-500/10 text-indigo-400',
};
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-ZA') : '—');
const fmtMoney = (v) => `R ${Number(v || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;
const STATUS_STYLE = {
  confirmed: 'bg-sky-500/10 text-sky-500',
  checked_in: 'bg-emerald-500/10 text-emerald-500',
  checked_out: 'bg-surface-elevated text-text-secondary',
  cancelled: 'bg-red-500/10 text-red-500',
  no_show: 'bg-amber-500/10 text-amber-500',
};

function MergeModal({ open, onClose, onMerged }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const guestsQuery = useQuery({
    queryKey: ['guest-identity-pool'],
    queryFn: async () => {
      const res = await apiGet('/v1/guests', { pageSize: 100 });
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    enabled: open,
  });

  const mergeMutation = useMutation({
    mutationFn: (guestIds) => createGroup(guestIds),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['guest-identity'] });
      setSelected([]);
      setError('');
      onClose();
      onMerged(group.id);
    },
    onError: (e) => setError(e?.message ?? 'Merge failed'),
  });

  if (!open) return null;
  const guests = guestsQuery.data ?? [];
  const filtered = guests.filter(
    (g) =>
      !search ||
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (g.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (g.phone ?? '').includes(search)
  );
  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">Merge guest profiles</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-border px-4 py-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
            <Search className="h-4 w-4 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {guestsQuery.isLoading ? (
            <div className="p-4 text-sm text-text-muted">Loading guests…</div>
          ) : (
            filtered.map((g) => (
              <label
                key={g.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-elevated"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(g.id)}
                  onChange={() => toggle(g.id)}
                  className="accent-indigo-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text-primary">
                    {g.firstName} {g.lastName}
                  </div>
                  <div className="truncate text-xs text-text-muted">
                    {g.email ?? '—'} · {g.phone ?? '—'}
                  </div>
                </div>
                {g.vipStatus && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${VIP_STYLE[g.vipStatus] ?? 'bg-surface-elevated text-text-secondary'}`}
                  >
                    {g.vipStatus}
                  </span>
                )}
              </label>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-text-muted">{selected.length} selected</span>
          <div className="flex items-center gap-2">
            {error && <span className="text-xs text-red-500">{error}</span>}
            <button
              onClick={() => mergeMutation.mutate(selected)}
              disabled={selected.length < 2 || mergeMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              <GitMerge className="h-4 w-4" />
              Merge {selected.length >= 2 ? `${selected.length} profiles` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupDetail({ groupId }) {
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: ['guest-identity', 'group', groupId],
    queryFn: () => getGroup(groupId),
  });
  const removeMutation = useMutation({
    mutationFn: (guestId) => removeMember(groupId, guestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guest-identity'] }),
  });

  if (detailQuery.isLoading)
    return <div className="h-40 animate-pulse rounded-lg bg-surface-elevated" />;
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-text-primary">
        Failed to load merged profile.
      </div>
    );
  }
  const g = detailQuery.data;
  const p = g.profile;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-text-primary">{p.displayName}</h3>
            {p.vipStatus && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${VIP_STYLE[p.vipStatus] ?? ''}`}
              >
                <Crown className="h-3 w-3" /> {p.vipStatus}
              </span>
            )}
            {p.blacklisted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-500">
                <ShieldAlert className="h-3 w-3" /> Blacklisted
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">
            {p.stayCount} stays · lifetime {fmtMoney(p.lifetimeValue)} ·{' '}
            {p.loyaltyPoints.toLocaleString()} loyalty pts
            {p.properties.length > 0 && ` · seen at ${p.properties.join(', ')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {p.emails.map((e) => (
            <span
              key={e}
              className="rounded-full bg-surface-elevated px-2.5 py-1 text-[11px] text-text-secondary"
            >
              {e}
            </span>
          ))}
          {p.phones.map((ph) => (
            <span
              key={ph}
              className="rounded-full bg-surface-elevated px-2.5 py-1 text-[11px] text-text-secondary"
            >
              {ph}
            </span>
          ))}
          {p.passports.map((pa) => (
            <span
              key={pa}
              className="rounded-full bg-surface-elevated px-2.5 py-1 text-[11px] text-text-secondary"
            >
              ID {pa}
            </span>
          ))}
          {p.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
          <Users className="h-3.5 w-3.5" /> Merged profiles ({g.members.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {g.members.map((m) => (
            <span
              key={m.guestId}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated py-1 pl-3 pr-1.5 text-xs text-text-secondary"
            >
              {m.firstName} {m.lastName}
              <span className="text-text-muted">{m.email ?? m.phone ?? ''}</span>
              <button
                onClick={() => removeMutation.mutate(m.guestId)}
                title="Unmerge this profile"
                className="rounded-full p-0.5 text-text-muted hover:bg-red-500/10 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
          <BedDouble className="h-3.5 w-3.5" /> Stay history across properties
        </h4>
        {g.stays.length === 0 ? (
          <p className="text-xs text-text-muted">No stays recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-text-muted">
                  <th className="py-1.5 pr-3">Confirmation</th>
                  <th className="pr-3">Property</th>
                  <th className="pr-3">Guest</th>
                  <th className="pr-3">Arrival</th>
                  <th className="pr-3">Departure</th>
                  <th className="pr-3">Status</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {g.stays.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-1.5 pr-3">
                      <Link
                        to={`/app/reservations/${s.id}`}
                        className="text-primary hover:underline"
                      >
                        {s.confirmationNumber}
                      </Link>
                    </td>
                    <td className="pr-3 text-text-secondary">{s.propertyName}</td>
                    <td className="pr-3 text-text-secondary">{s.guestName}</td>
                    <td className="pr-3 text-text-secondary">{fmtDate(s.arrivalDate)}</td>
                    <td className="pr-3 text-text-secondary">{fmtDate(s.departureDate)}</td>
                    <td className="pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[s.status] ?? 'bg-surface-elevated text-text-secondary'}`}
                      >
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-right text-text-primary">{fmtMoney(s.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {g.notes.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            <StickyNote className="h-3.5 w-3.5" /> Notes from every site
          </h4>
          <div className="space-y-1.5">
            {g.notes.map((n) => (
              <div
                key={n.id}
                className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs text-text-secondary"
              >
                <span className="font-medium text-text-primary">{n.guestName}</span>
                <span className="text-text-muted"> · {fmtDate(n.createdAt)}</span>
                <p className="mt-0.5">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DedupeTab() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const dedupeQuery = useQuery({
    queryKey: ['guest-identity', 'dedupe'],
    queryFn: dedupeReport,
    refetchInterval: 60_000,
  });
  const mergeMutation = useMutation({
    mutationFn: (guestIds) => createGroup(guestIds),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['guest-identity'] });
      setSelected(group.id);
    },
  });

  if (dedupeQuery.isLoading)
    return <div className="h-48 animate-pulse rounded-lg bg-surface-elevated" />;
  if (dedupeQuery.isError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-text-primary">
        Failed to load dedupe report.
      </div>
    );
  }
  const report = dedupeQuery.data;

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">
        {report.clusterCount} duplicate cluster(s) across {report.guestCount} guest profiles ·
        matched on email, phone or ID · {new Date(report.generatedAt).toLocaleTimeString()}
      </p>
      {report.clusters.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-10 text-center">
          <Sparkles className="h-7 w-7 text-text-muted" />
          <p className="text-sm text-text-secondary">
            No duplicates detected — the identity graph is clean.
          </p>
        </div>
      ) : (
        report.clusters.map((c) => (
          <div
            key={`${c.matchKey}:${c.matchValue}`}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-primary">
                  {c.matchKey}
                </span>
                <span className="text-sm font-medium text-text-primary">{c.matchValue}</span>
                {c.sharedGroupId && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                    already merged
                  </span>
                )}
              </div>
              {!c.sharedGroupId && (
                <button
                  onClick={() => mergeMutation.mutate(c.guests.map((g) => g.id))}
                  disabled={mergeMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  <GitMerge className="h-3.5 w-3.5" /> Merge {c.guests.length} profiles
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {c.guests.map((g) => (
                <div
                  key={g.id}
                  className="rounded-md border border-border bg-surface-elevated px-3 py-2"
                >
                  <div className="text-xs font-medium text-text-primary">
                    {g.firstName} {g.lastName}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    {g.email ?? '—'} · {g.phone ?? '—'} · since {fmtDate(g.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      {selected && <GroupDetail groupId={selected} />}
    </div>
  );
}

export default function GuestIdentityPage() {
  const [tab, setTab] = useState('groups');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const groupsQuery = useQuery({
    queryKey: ['guest-identity', 'groups'],
    queryFn: listGroups,
  });
  const groups = groupsQuery.data ?? [];

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Shared Guest Profiles</h1>
          <p className="text-sm text-text-muted">
            One guest, one profile — stay history, blacklist, VIP and notes follow them across every
            site.
          </p>
        </div>
        <button
          onClick={() => setMergeOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <GitMerge className="h-4 w-4" /> Merge profiles
        </button>
      </div>

      <div className="flex rounded-lg border border-border bg-surface p-0.5 w-fit">
        {[
          { key: 'groups', label: `Merge Center (${groups.length})` },
          { key: 'dedupe', label: 'Dedupe Report' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setSelectedGroup(null);
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary/10 text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'groups' ? (
        groupsQuery.isLoading ? (
          <div className="h-48 animate-pulse rounded-lg bg-surface-elevated" />
        ) : groupsQuery.isError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-text-primary">
            Failed to load groups.
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-10 text-center">
            <Fingerprint className="h-7 w-7 text-text-muted" />
            <p className="text-sm text-text-secondary">No merged profiles yet.</p>
            <button
              onClick={() => setMergeOpen(true)}
              className="text-sm text-primary hover:underline"
            >
              Merge your first profiles →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${
                  selectedGroup === g.id
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-surface hover:bg-surface-elevated'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {g.names.join(' = ')}
                    </span>
                    {g.vipStatus && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${VIP_STYLE[g.vipStatus] ?? ''}`}
                      >
                        {g.vipStatus}
                      </span>
                    )}
                    {g.blacklisted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-500">
                        <ShieldAlert className="h-3 w-3" /> Blacklist
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">
                    {g.memberCount} profiles · {g.loyaltyPoints.toLocaleString()} pts
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {g.primaryEmail ?? 'no email'} · updated {fmtDate(g.updatedAt)}
                </p>
              </button>
            ))}
            {selectedGroup && <GroupDetail groupId={selectedGroup} />}
          </div>
        )
      ) : (
        <DedupeTab />
      )}

      <MergeModal
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        onMerged={(id) => {
          setTab('groups');
          setSelectedGroup(id);
        }}
      />
    </div>
  );
}
