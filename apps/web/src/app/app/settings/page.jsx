/* src/app/app/settings/page.jsx — Settings (staff)
 * Organisation profile / Subscription & plan (tiers, upgrade request, card
 * capture, platform invoices) / Support & diagnostics (version, tenant ID,
 * environment, copy-logs). All data live from /v1/tenant/settings/*.
 * Plan changes / card capture route to VIMAD as billing support cases —
 * there is deliberately no self-billing backend (billing.job owns invoices).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Building2,
  CreditCard,
  FileText,
  LifeBuoy,
  Copy,
  Check,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { useToast } from '../../../hooks/use-toast';
import {
  getTenantProfile,
  listMyInvoices,
  requestPlanChange,
  getDiagnostics,
  requestCardCaptureLink,
} from '../../../api/tenantSettings';
import { ensureLogCapture, buildDiagnosticsBundle, copyText } from '../../../lib/diagnostics';

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
const ENVIRONMENT = import.meta.env.MODE || 'development';

/* Mirrors billing.job PLAN_LIMITS + planRates — presentation-only; the API
 * is the source of truth. */
const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 99,
    limits: { apiCalls: 10000, sms: 100, properties: 1, storageGb: 1 },
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 299,
    limits: { apiCalls: 100000, sms: 1000, properties: 3, storageGb: 10 },
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 799,
    limits: { apiCalls: 1000000, sms: 10000, properties: 10, storageGb: 100 },
  },
];

const INVOICE_STATUS = {
  draft: 'bg-slate-500/10 text-text-muted border-border',
  sent: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  overdue: 'bg-red-500/10 text-red-600 border-red-500/30',
  void: 'bg-slate-500/10 text-text-muted border-border',
};

const fmtZAR = (n) =>
  `R${Number(n ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
const fmtNum = (n) => Number(n ?? 0).toLocaleString('en-ZA');

function Section({ icon: Icon, title, desc, children, action }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
            <Icon className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            {desc && <p className="text-xs text-text-muted">{desc}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function UsageBar({ label, used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted">
          {fmtNum(used)} / {fmtNum(limit)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
        <div
          className={cn(
            'h-full rounded-full',
            pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-secondary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function UpgradeModal({ currentPlan, onClose }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await requestPlanChange(selected, note.trim() || undefined);
      toast({
        title: 'Plan request sent',
        description: 'VIMAD billing will confirm the change and any proration by support case.',
      });
      onClose();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Request failed',
        description: e?.response?.data?.error?.message ?? e.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Change plan</h3>
            <p className="text-xs text-text-muted">
              Plan changes are confirmed by VIMAD billing — nothing bills automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-elevated"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.key === currentPlan;
            return (
              <button
                key={p.key}
                disabled={isCurrent}
                onClick={() => setSelected(p.key)}
                className={cn(
                  'rounded-lg border p-4 text-left transition',
                  isCurrent && 'border-border opacity-50 cursor-default',
                  !isCurrent && selected === p.key && 'border-secondary bg-secondary/10',
                  !isCurrent && selected !== p.key && 'border-border hover:border-secondary/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text-primary">{p.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-medium uppercase text-text-muted">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xl font-bold text-text-primary">
                  {fmtZAR(p.price)}
                  <span className="text-xs font-normal text-text-muted">/mo</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                  <li>{fmtNum(p.limits.apiCalls)} API calls/mo</li>
                  <li>
                    {p.limits.properties} propert{p.limits.properties > 1 ? 'ies' : 'y'}
                  </li>
                  <li>{fmtNum(p.limits.sms)} SMS/mo</li>
                  <li>{p.limits.storageGb} GB storage</li>
                </ul>
              </button>
            );
          })}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note for VIMAD billing (optional)"
          className="mt-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-secondary"
          rows={2}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!selected || sending}>
            {sending ? 'Sending…' : 'Send request'} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddCardModal({ onClose }) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const submit = async () => {
    setSending(true);
    try {
      await requestCardCaptureLink();
      toast({
        title: 'Request sent',
        description:
          'VIMAD billing will email a secure card capture link — card numbers are never typed into the app.',
      });
      onClose();
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Request failed',
        description: e?.response?.data?.error?.message ?? e.message,
      });
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Add payment method</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-elevated"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          For security, cards are captured by VIMAD billing through a Paystack secure link — never
          typed into the app. Send yourself the capture link?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={sending}>
            {sending ? 'Sending…' : 'Email me the link'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [diag, setDiag] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    ensureLogCapture();
  }, []);

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const [prof, inv, dg] = await Promise.all([
        getTenantProfile(),
        listMyInvoices(p),
        getDiagnostics(),
      ]);
      setProfile(prof.data);
      setInvoices(inv);
      setDiag(dg.data);
      setPage(p);
    } catch (e) {
      setError(e?.response?.data?.error?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copyLogs = async () => {
    const bundle = buildDiagnosticsBundle({
      appVersion: APP_VERSION,
      environment: ENVIRONMENT,
      tenantId: profile?.tenant?.id ?? diag?.tenantId ?? null,
      userEmail: profile?.user?.email ?? null,
      url: window.location.href,
      userAgent: navigator.userAgent,
      api: diag ?? null,
      capturedAt: new Date().toISOString(),
    });
    const okCopied = await copyText(bundle);
    if (okCopied) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Diagnostics copied', description: 'Paste it into your VIMAD support case.' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Clipboard unavailable in this browser.',
      });
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading settings…
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-600">
          {error} — Settings requires the <code>setting:read</code> permission
          (Owner/Admin/Manager).{' '}
          <button className="underline" onClick={() => load(1)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const planKey = (profile?.tenant?.plan ?? 'starter').toLowerCase();
  const currentPlan = PLANS.find((p) => p.key === planKey) ?? PLANS[0];
  const usage = profile?.usage ?? {};
  const apiCalls = usage.api_calls ?? 0;
  const smsSent = usage.sms_sent ?? 0;
  const propertyCount = profile?.properties ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary">
          <SettingsIcon className="h-6 w-6 text-secondary" /> Settings
        </h1>
        <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading}>
          <RefreshCw className={cn('mr-1 h-4 w-4', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      <Section icon={Building2} title="Organisation" desc="Your hotel account on VIMAD">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-text-muted">Hotel</p>
            <p className="font-medium text-text-primary">{profile?.tenant?.name}</p>
            <p className="text-xs text-text-muted">{profile?.tenant?.slug}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-text-muted">Plan</p>
            <p className="font-medium capitalize text-text-primary">{profile?.tenant?.plan}</p>
            <p className="text-xs text-text-muted">Status: {profile?.tenant?.status}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-text-muted">Properties / Members</p>
            <p className="font-medium text-text-primary">
              {profile?.properties} · {profile?.members}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-text-muted">Signed in as</p>
            <p className="font-medium text-text-primary">{profile?.user?.email}</p>
            <p className="text-xs capitalize text-text-muted">{profile?.user?.role}</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          Property configuration lives in{' '}
          <Link to="/app/properties" className="text-secondary underline">
            Properties
          </Link>
          , user management in{' '}
          <Link to="/app/users" className="text-secondary underline">
            Users and Roles
          </Link>
          .
        </p>
      </Section>

      <Section
        icon={CreditCard}
        title="Subscription & plan"
        desc="Billing is handled by VIMAD — plan changes are confirmed by support case"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCard(true)}>
              Add payment method
            </Button>
            <Button size="sm" onClick={() => setShowUpgrade(true)}>
              Change plan
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-secondary/40 bg-secondary/5 p-4">
            <p className="text-xs uppercase text-text-muted">Current plan</p>
            <p className="text-xl font-bold text-text-primary">{currentPlan.name}</p>
            <p className="text-sm text-text-secondary">{fmtZAR(currentPlan.price)}/month</p>
          </div>
          <div className="rounded-lg border border-border p-4 lg:col-span-2">
            <p className="mb-3 text-xs uppercase text-text-muted">This month&rsquo;s usage</p>
            <div className="space-y-3">
              <UsageBar label="API calls" used={apiCalls} limit={currentPlan.limits.apiCalls} />
              <UsageBar label="SMS sent" used={smsSent} limit={currentPlan.limits.sms} />
              <UsageBar
                label="Properties"
                used={propertyCount}
                limit={currentPlan.limits.properties}
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-muted" />
            <h3 className="text-sm font-semibold text-text-primary">Invoices</h3>
          </div>
          {!invoices?.data?.length ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">
              No platform invoices yet — they are generated monthly by VIMAD billing.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-text-muted">
                      <th className="py-2 pr-4">Period</th>
                      <th className="py-2 pr-4">Plan</th>
                      <th className="py-2 pr-4 text-right">Base</th>
                      <th className="py-2 pr-4 text-right">Overage</th>
                      <th className="py-2 pr-4 text-right">Total</th>
                      <th className="py-2 pr-4">Due</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.data.map((inv) => (
                      <tr key={inv.id} className="border-b border-border/50">
                        <td className="py-2 pr-4 text-text-primary">
                          {fmtDate(inv.periodStart)} – {fmtDate(inv.periodEnd)}
                        </td>
                        <td className="py-2 pr-4 capitalize text-text-secondary">{inv.plan}</td>
                        <td className="py-2 pr-4 text-right text-text-secondary">
                          {fmtZAR(inv.baseAmount)}
                        </td>
                        <td className="py-2 pr-4 text-right text-text-secondary">
                          {fmtZAR(inv.overageAmount)}
                        </td>
                        <td className="py-2 pr-4 text-right font-medium text-text-primary">
                          {fmtZAR(inv.totalAmount)}
                        </td>
                        <td className="py-2 pr-4 text-text-secondary">{fmtDate(inv.dueDate)}</td>
                        <td className="py-2">
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-xs capitalize',
                              INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.draft
                            )}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {invoices.meta.totalPages > 1 && (
                <div className="mt-2 flex items-center justify-end gap-2 text-xs text-text-muted">
                  <button
                    className="rounded border border-border px-2 py-1 disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => load(page - 1)}
                  >
                    Prev
                  </button>
                  <span>
                    {page} / {invoices.meta.totalPages}
                  </span>
                  <button
                    className="rounded border border-border px-2 py-1 disabled:opacity-40"
                    disabled={page >= invoices.meta.totalPages}
                    onClick={() => load(page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      <Section
        icon={Server}
        title="Support & diagnostics"
        desc="For VIMAD to debug an issue on your account — hotel-facing tickets live under Help & Support"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'App version', value: APP_VERSION },
            { label: 'Tenant ID', value: profile?.tenant?.id ?? diag?.tenantId ?? '—', mono: true },
            { label: 'Environment', value: ENVIRONMENT },
            {
              label: 'API / DB / Redis',
              value: diag ? `${diag.db === 'up' ? 'ok' : 'down'} · ${diag.redis}` : '…',
            },
          ].map((row) => (
            <div key={row.label} className="rounded-lg border border-border p-3">
              <p className="text-[11px] uppercase text-text-muted">{row.label}</p>
              <p
                className={cn(
                  'truncate text-sm font-medium text-text-primary',
                  row.mono && 'font-mono text-xs'
                )}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={copyLogs}>
            {copied ? (
              <Check className="mr-1 h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="mr-1 h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy logs & diagnostics'}
          </Button>
          <Link to="/app/support/vimad">
            <Button variant="outline" size="sm">
              <LifeBuoy className="mr-1 h-4 w-4" /> Help &amp; Support
            </Button>
          </Link>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Log buffer starts on first Settings visit this
            session.
          </span>
        </div>
      </Section>

      {showUpgrade && <UpgradeModal currentPlan={planKey} onClose={() => setShowUpgrade(false)} />}
      {showCard && <AddCardModal onClose={() => setShowCard(false)} />}
    </div>
  );
}
