/* src/app/guest-portal/profile/page.jsx — G3: real guest profile */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { getGuestToken } from '../../../hooks/guestPortalApi';
import { getGuestLocale, setGuestLocale } from '../../../i18n/guestI18n';
import {
  useGuestProfile,
  useUpdateGuestProfile,
  useGuestGdprRequest,
} from '../../../hooks/useGuestProfile';
import { formatDate } from '../../../lib/guest-utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data, isLoading, isError, refetch } = useGuestProfile();
  const update = useUpdateGuestProfile();
  const gdpr = useGuestGdprRequest();
  const [gdprMsg, setGdprMsg] = useState(null);

  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  useEffect(() => {
    if (data?.guest && form === null) {
      setForm({
        email: data.guest.email ?? '',
        phone: data.guest.phone ?? '',
        nationality: data.guest.nationality ?? '',
        city: data.guest.city ?? '',
        country: data.guest.country ?? '',
      });
    }
  }, [data, form]);

  if (!hasToken) return null;

  if (isLoading || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your profile…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load your profile.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const g = data.guest;
  const dirty =
    form.email !== (g.email ?? '') ||
    form.phone !== (g.phone ?? '') ||
    form.nationality !== (g.nationality ?? '') ||
    form.city !== (g.city ?? '') ||
    form.country !== (g.country ?? '');

  const handleSave = () => {
    setSaved(false);
    const payload = {};
    for (const k of ['email', 'phone', 'nationality', 'city', 'country']) {
      if (form[k] !== (g[k] ?? '')) payload[k] = form[k] || undefined;
    }
    update.mutate(payload, {
      onSuccess: () => setSaved(true),
    });
  };

  const field = (label, key, type = 'text') => (
    <div>
      <label className="text-xs text-text-muted block mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Profile</h1>
          <p className="text-xs text-text-muted">
            {data.propertyName} · {data.confirmationNumber}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {g.firstName} {g.lastName}
            </p>
            <p className="text-xs text-text-muted">Guest since {formatDate(g.createdAt)}</p>
          </div>
          {g.vipStatus && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 border border-secondary/20 px-2.5 py-0.5 text-[10px] font-medium text-secondary capitalize">
              <Award className="h-3 w-3" /> {g.vipStatus}
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-muted flex items-center gap-1">
          <BadgeCheck className="h-3 w-3" /> Name and date of birth are verified at check-in and
          can't be changed here.
        </p>
      </div>

      {saved && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          <p className="text-sm text-text-primary">Profile updated.</p>
        </div>
      )}
      {update.isError && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm text-text-primary">
            {update.error?.message ?? 'Could not save changes.'}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Contact details</h3>
        {field('Email', 'email', 'email')}
        {field('Phone', 'phone', 'tel')}
        {field('Nationality', 'nationality')}
        {field('City', 'city')}
        {field('Country', 'country')}
        <Button className="w-full" disabled={!dirty || update.isPending} onClick={handleSave}>
          {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Your data</h3>
        <p className="text-xs text-text-muted">
          Download everything we hold about you, or request erasure. We confirm by email within 30
          days.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={gdpr.isPending}
            onClick={() =>
              gdpr.mutate(
                { request: 'export' },
                {
                  onSuccess: () =>
                    setGdprMsg('Export requested — check your email within 30 days.'),
                  onError: (e) => setGdprMsg(e.message),
                }
              )
            }
          >
            Download my data
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={gdpr.isPending}
            onClick={() =>
              gdpr.mutate(
                { request: 'erasure' },
                {
                  onSuccess: () => setGdprMsg('Erasure requested — we will confirm by email.'),
                  onError: (e) => setGdprMsg(e.message),
                }
              )
            }
          >
            Delete my data
          </Button>
        </div>
        {gdprMsg && <p className="text-xs text-text-muted">{gdprMsg}</p>}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary">Language / Ulimi / Taal</h3>
        <div className="flex gap-2">
          {[
            { code: 'en', label: 'English' },
            { code: 'zu', label: 'isiZulu' },
            { code: 'af', label: 'Afrikaans' },
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setGuestLocale(l.code)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                getGuestLocale() === l.code
                  ? 'border-secondary bg-secondary/10 text-secondary'
                  : 'border-border text-text-secondary hover:bg-surface-elevated'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/guest-portal/profile/documents')}
        className="w-full rounded-xl border border-border bg-surface p-4 flex items-center justify-between hover:bg-surface-elevated transition-colors"
      >
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-secondary" />
          <div className="text-left">
            <p className="text-sm font-medium text-text-primary">Travel documents</p>
            <p className="text-xs text-text-muted">Passport, ID, driver's licence</p>
          </div>
        </div>
        <ArrowLeft className="h-4 w-4 text-text-muted rotate-180" />
      </button>
    </div>
  );
}
