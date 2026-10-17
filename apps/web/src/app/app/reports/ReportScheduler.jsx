/* src/app/app/reports/ReportScheduler.jsx — scheduled_reports demock */
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  X,
  Play,
  Pause,
  Trash2,
  Mail,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { apiClient } from '../../../api/client';

/* schedulerApi adapter — the ONLY place /admin/reports schedule shapes live */
const schedulerApi = {
  listTemplates: () =>
    apiClient.get('/admin/reports/templates').then((r) => {
      const p = r.data?.data ?? r.data ?? [];
      return Array.isArray(p) ? p : [];
    }),
  listSchedules: () =>
    apiClient.get('/admin/reports/scheduled').then((r) => {
      const p = r.data?.data ?? r.data ?? [];
      return Array.isArray(p) ? p : [];
    }),
  createSchedule: (body) => apiClient.post('/admin/reports/scheduled', body).then((r) => r.data),
  updateSchedule: (id, body) =>
    apiClient.patch(`/admin/reports/scheduled/${id}`, body).then((r) => r.data),
  deleteSchedule: (id) => apiClient.delete(`/admin/reports/scheduled/${id}`),
  runNow: (id) => apiClient.post(`/admin/reports/scheduled/${id}/run`).then((r) => r.data),
};

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];
const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
];

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function nextRunLabel(iso) {
  if (!iso) return '—';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Due now';
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `in ${h}h`;
  return `in ${Math.floor(h / 24)}d`;
}

function StatusBadge({ status }) {
  const meta = {
    active: {
      label: 'Active',
      class: 'bg-accent/10 text-accent border-accent/20',
      dot: 'bg-accent',
    },
    paused: {
      label: 'Paused',
      class: 'bg-warning/10 text-warning border-warning/20',
      dot: 'bg-warning',
    },
    error: { label: 'Error', class: 'bg-danger/10 text-danger border-danger/20', dot: 'bg-danger' },
  }[status] || {
    label: status,
    class: 'bg-neutral/10 text-text-muted border-border',
    dot: 'bg-text-muted',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Create / Edit modal ─── */
function ScheduleModal({ schedule, templates, onClose, onSaved }) {
  const isEdit = Boolean(schedule?.id);
  const [form, setForm] = useState({
    name: schedule?.name ?? '',
    templateId: schedule?.templateId ?? '',
    frequency: schedule?.frequency ?? 'weekly',
    format: schedule?.format ?? 'pdf',
    recipients: (schedule?.recipients ?? []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const recipients = form.recipients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      setError('Add at least one recipient email');
      setSaving(false);
      return;
    }
    try {
      const body = {
        name: form.name,
        templateId: form.templateId,
        frequency: form.frequency,
        format: form.format,
        recipients,
      };
      if (isEdit) await schedulerApi.updateSchedule(schedule.id, body);
      else await schedulerApi.createSchedule(body);
      onSaved();
    } catch (err) {
      setError(
        err?.response?.data?.error?.message || 'Save failed — check /admin/reports shape (Gate 3)'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">
            {isEdit ? 'Edit Schedule' : 'New Scheduled Report'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-surface-elevated text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Schedule Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Weekly occupancy to GM"
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Report Template
            </label>
            <select
              required
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Format
              </label>
              <select
                value={form.format}
                onChange={(e) => setForm({ ...form, format: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
              >
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Recipients (comma-separated)
            </label>
            <textarea
              rows={2}
              value={form.recipients}
              onChange={(e) => setForm({ ...form, recipients: e.target.value })}
              placeholder="gm@hotel.co.za, owner@hotel.co.za"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary resize-none"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={saving}>
              <CalendarClock className="mr-1.5 h-4 w-4" />{' '}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function ReportScheduler() {
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [scheds, tmpls] = await Promise.all([
        schedulerApi.listSchedules(),
        schedulerApi.listTemplates().catch(() => []),
      ]);
      setSchedules(scheds);
      setTemplates(tmpls);
    } catch (err) {
      setLoadError(
        err?.response?.data?.error?.message ||
          'Failed to load schedules — check /admin/reports shape (Gate 3)'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      schedules.filter((s) => {
        const matchesQuery = (s.name ?? '').toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [schedules, query, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: schedules.length,
      active: schedules.filter((s) => s.status === 'active').length,
      paused: schedules.filter((s) => s.status === 'paused').length,
      error: schedules.filter((s) => s.status === 'error').length,
      dueSoon: schedules.filter(
        (s) =>
          s.status === 'active' &&
          s.nextRunAt &&
          new Date(s.nextRunAt).getTime() - Date.now() < 24 * 3600000
      ).length,
    }),
    [schedules]
  );

  const togglePause = async (s) => {
    const next = s.status === 'active' ? 'paused' : 'active';
    try {
      await schedulerApi.updateSchedule(s.id, { status: next });
      setSchedules((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
      setNotice(next === 'paused' ? `"${s.name}" paused` : `"${s.name}" resumed`);
    } catch (err) {
      setNotice(err?.response?.data?.error?.message || 'Status change failed');
    }
  };

  const runNow = async (s) => {
    try {
      await schedulerApi.runNow(s.id);
      setNotice(
        `"${s.name}" queued — the report will be emailed to ${s.recipients?.length ?? 0} recipient(s)`
      );
      await load();
    } catch (err) {
      setNotice(err?.response?.data?.error?.message || 'Run failed');
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete schedule "${s.name}"?`)) return;
    try {
      await schedulerApi.deleteSchedule(s.id);
      setSchedules((prev) => prev.filter((x) => x.id !== s.id));
      setNotice(`"${s.name}" deleted`);
    } catch (err) {
      setNotice(err?.response?.data?.error?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Scheduled Reports</h2>
          <p className="text-sm text-text-secondary">
            Automated report delivery to inboxes on a cadence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Schedule
          </Button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-accent flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {notice}
          </span>
          <button onClick={() => setNotice(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {loadError && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total', value: stats.total, icon: CalendarClock, color: 'text-secondary' },
          { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'text-accent' },
          { label: 'Paused', value: stats.paused, icon: Pause, color: 'text-warning' },
          { label: 'Errors', value: stats.error, icon: AlertTriangle, color: 'text-danger' },
          { label: 'Due < 24h', value: stats.dueSoon, icon: Clock, color: 'text-info' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  {s.label}
                </p>
                <p className={cn('mt-1 text-2xl font-bold', s.color)}>{s.value}</p>
              </div>
              <s.icon className={cn('h-5 w-5', s.color)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search schedules…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Format
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Last Run
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-background/50 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{s.name}</p>
                    <p className="text-xs text-text-muted">
                      {templates.find((t) => t.id === s.templateId)?.name ??
                        s.templateId ??
                        'Custom'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary capitalize">{s.frequency}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-xs text-text-secondary uppercase">
                      <FileText className="h-3 w-3" /> {s.format}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <Mail className="h-3 w-3 text-text-muted" />
                      {s.recipients?.length ?? 0} recipient
                      {(s.recipients?.length ?? 0) !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-text-primary">{fmtDateTime(s.nextRunAt)}</p>
                    <p className="text-[10px] text-text-muted">{nextRunLabel(s.nextRunAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {s.lastRunAt ? fmtDateTime(s.lastRunAt) : 'Never run'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => runNow(s)}
                        title="Run now"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-accent/10 hover:text-accent"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => togglePause(s)}
                        title={s.status === 'active' ? 'Pause' : 'Resume'}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-warning/10 hover:text-warning"
                      >
                        {s.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(s);
                          setShowModal(true);
                        }}
                        title="Edit"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                      >
                        <CalendarClock className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(s)}
                        title="Delete"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                    <Send className="mx-auto h-8 w-8 mb-2" />
                    <p>No scheduled reports{loadError ? '' : ' yet — create one above'}.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ScheduleModal
          schedule={editing}
          templates={templates}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}
