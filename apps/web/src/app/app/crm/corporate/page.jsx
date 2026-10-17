import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Pencil } from 'lucide-react';
import {
  useCorporateAccounts,
  useCorporateAccount,
  useCreateCorporateAccount,
  useUpdateCorporateAccount,
  useScClients,
} from '../../../../hooks/useCrm';
import { useToast } from '../../../../hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionCard, fmtMoney } from '../components';

const EMPTY = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  negotiatedRate: '',
  notes: '',
  scClientId: '',
};

export default function CrmCorporatePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: accounts, isLoading } = useCorporateAccounts();
  const createAcct = useCreateCorporateAccount();
  const updateAcct = useUpdateCorporateAccount();
  const { data: scClients } = useScClients();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | { id }
  const [form, setForm] = useState(EMPTY);
  const [detailId, setDetailId] = useState(undefined);
  const { data: detail } = useCorporateAccount(detailId);

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
    setOpen(true);
  };

  const openEdit = (a) => {
    setForm({
      name: a.name ?? '',
      contactName: a.contactName ?? '',
      email: a.email ?? '',
      phone: a.phone ?? '',
      negotiatedRate: a.negotiatedRate != null ? String(a.negotiatedRate) : '',
      notes: a.notes ?? '',
      scClientId: a.scClientId ?? '',
    });
    setEditing({ id: a.id });
    setOpen(true);
  };

  const submit = () => {
    const payload = {
      ...form,
      negotiatedRate: form.negotiatedRate === '' ? undefined : Number(form.negotiatedRate),
      scClientId: form.scClientId || null,
    };
    if (editing === 'new') {
      createAcct.mutate(payload, {
        onSuccess: () => {
          setOpen(false);
          toast({ title: 'Account created' });
        },
        onError: (e) =>
          toast({ title: 'Create failed', description: e.message, variant: 'destructive' }),
      });
    } else if (editing?.id) {
      updateAcct.mutate(
        { id: editing.id, input: payload },
        {
          onSuccess: () => {
            setOpen(false);
            toast({ title: 'Account updated' });
          },
          onError: (e) =>
            toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
        }
      );
    }
  };

  if (isLoading)
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-72" />
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Corporate accounts</h1>
          <p className="text-sm text-muted-foreground">
            Companies with negotiated rates and linked guest profiles. Link one to a Sales &
            Catering client to connect rooms business with events business.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New account
        </Button>
      </div>

      {accounts?.length === 0 ? (
        <EmptyState
          title="No corporate accounts"
          description="Link corporate guests to a company to track negotiated rates and combined spend."
          action={<Button onClick={openNew}>Add account</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts?.map((a) => (
            <div key={a.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{a.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {!a.isActive && <Badge variant="outline">inactive</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                {a.contactName && <div>{a.contactName}</div>}
                {a.email && <div>{a.email}</div>}
                {a.negotiatedRate != null && (
                  <div>Negotiated rate: {fmtMoney(a.negotiatedRate)}</div>
                )}
                {a.scClient && (
                  <div>
                    S&amp;C client:{' '}
                    <button
                      className="text-primary hover:underline"
                      onClick={() => navigate('/app/sales-catering/clients')}
                    >
                      {a.scClient.name}
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-xs text-muted-foreground">{a.guestCount} linked guests</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setDetailId(a.id);
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === 'new' ? 'New corporate account' : 'Edit account'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input
              className="col-span-2"
              placeholder="Company name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Contact name"
              value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              className="col-span-2"
              placeholder="Billing email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              placeholder="Negotiated rate (R)"
              value={form.negotiatedRate}
              onChange={(e) => setForm({ ...form, negotiatedRate: e.target.value })}
            />
            <Input
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <label className="col-span-2 text-xs text-muted-foreground">
              Linked S&amp;C client (optional)
              <select
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.scClientId}
                onChange={(e) => setForm({ ...form, scClientId: e.target.value })}
              >
                <option value="">— none —</option>
                {(scClients ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={
                (editing === 'new' ? createAcct.isPending : updateAcct.isPending) ||
                !form.name.trim()
              }
            >
              {editing === 'new' ? 'Create' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(undefined)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
          </DialogHeader>
          {!detail ? (
            <Skeleton className="h-40" />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <span>{detail.contactName || '—'}</span>
                <span>{detail.email || '—'}</span>
                <span>{detail.phone || '—'}</span>
                {detail.negotiatedRate != null && (
                  <span>Rate: {fmtMoney(detail.negotiatedRate)}</span>
                )}
                {detail.scClient && (
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={() => navigate('/app/sales-catering/clients')}
                  >
                    S&amp;C: {detail.scClient.name} →
                  </button>
                )}
              </div>
              <div className="rounded-md border p-3 text-sm flex gap-6 bg-muted/30">
                <span>
                  <strong>{detail.totals.stays}</strong> combined stays
                </span>
                <span>
                  <strong>{fmtMoney(detail.totals.spend)}</strong> combined spend
                </span>
              </div>
              <SectionCard title="Linked guests">
                {detail.guests.length === 0 ? (
                  <EmptyState
                    title="No linked guests"
                    description="Set corporateAccountId on guest profiles to link them."
                  />
                ) : (
                  <div className="divide-y">
                    {detail.guests.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => navigate(`/app/crm/guests/${g.id}`)}
                        className="flex w-full items-center justify-between py-2.5 text-left"
                      >
                        <span className="font-medium">{g.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {g.stays} stays · {fmtMoney(g.spend)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
