/* src/app/admin/reports/ReportScheduler.jsx */
import { useState } from 'react';
import {
  Plus, Clock, Calendar, FileText, Mail, Play, Edit3, Trash2, X, Save
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { libraryReports, frequencyMeta, formatMeta, initialSchedules } from './data';

export default function ReportScheduler() {
  const [schedules, setSchedules] = useState(initialSchedules);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    reportId: '',
    frequency: 'daily',
    time: '08:00',
    format: 'pdf',
    recipients: '',
    active: true,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ reportId: '', frequency: 'daily', time: '08:00', format: 'pdf', recipients: '', active: true });
    setShowModal(true);
  };

  const openEdit = (schedule) => {
    setEditing(schedule);
    setForm({
      reportId: schedule.reportId,
      frequency: schedule.frequency,
      time: schedule.time,
      format: schedule.format,
      recipients: schedule.recipients.join(', '),
      active: schedule.active,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const report = libraryReports.find((r) => r.id === form.reportId);
    if (!report) return;

    const recipientList = form.recipients.split(',').map((e) => e.trim()).filter(Boolean);
    const newSchedule = {
      id: editing ? editing.id : `S${Date.now()}`,
      reportId: form.reportId,
      reportTitle: report.title,
      frequency: form.frequency,
      time: form.time,
      format: form.format,
      recipients: recipientList,
      active: form.active,
      lastRun: editing ? editing.lastRun : 'Never',
      nextRun: form.active ? `2026-08-13 ${form.time}` : '—',
    };

    setSchedules((prev) => {
      if (editing) return prev.map((s) => (s.id === editing.id ? newSchedule : s));
      return [newSchedule, ...prev];
    });
    setShowModal(false);
  };

  const toggleActive = (id) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active, nextRun: !s.active ? `2026-08-13 ${s.time}` : '—' } : s))
    );
  };

  const handleDelete = (id) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRunNow = (schedule) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === schedule.id
          ? { ...s, lastRun: new Date().toLocaleString() }
          : s
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Scheduled Reports</h3>
          <p className="text-xs text-text-muted">Automated delivery to your inbox</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" /> New Schedule
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Report</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Frequency</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Time</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Format</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Recipients</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Last Run</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Next Run</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedules.map((schedule) => {
                const FreqIcon = schedule.frequency === 'daily' ? Clock : Calendar;
                const fmt = formatMeta[schedule.format];
                return (
                  <tr key={schedule.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                          <FileText className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{schedule.reportTitle}</p>
                          <p className="text-xs text-text-muted">{schedule.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary border border-border">
                        <FreqIcon className="h-3 w-3" />
                        {frequencyMeta[schedule.frequency]?.label || schedule.frequency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary font-mono text-xs">{schedule.time}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', fmt.class)}>
                        {fmt.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {schedule.recipients.map((email) => (
                          <span key={email} className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-text-secondary border border-border">
                            <Mail className="h-3 w-3" />
                            {email}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{schedule.lastRun}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{schedule.nextRun}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(schedule.id)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          schedule.active ? 'bg-secondary' : 'bg-border'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                            schedule.active ? 'translate-x-[18px]' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRunNow(schedule)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="Run now"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEdit(schedule)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-danger/10 hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                    <Clock className="mx-auto h-10 w-10 mb-3" />
                    <p>No scheduled reports yet.</p>
                    <button onClick={openNew} className="mt-2 text-sm text-secondary hover:underline">
                      Create your first schedule
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                {editing ? 'Edit Schedule' : 'New Scheduled Report'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Report</label>
                <select
                  value={form.reportId}
                  onChange={(e) => setForm({ ...form, reportId: e.target.value })}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select a report...</option>
                  {libraryReports.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-primary">Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'pdf', label: 'PDF Document' },
                    { key: 'csv', label: 'CSV Spreadsheet' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setForm({ ...form, format: f.key })}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                        form.format === f.key
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-primary">Recipients</label>
                <textarea
                  value={form.recipients}
                  onChange={(e) => setForm({ ...form, recipients: e.target.value })}
                  placeholder="gm@hotel.com, revenue@hotel.com"
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
                <p className="text-xs text-text-muted">Separate multiple emails with commas</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <span className="text-sm text-text-primary">Active</span>
                <button
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                    form.active ? 'bg-secondary' : 'bg-border'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                      form.active ? 'translate-x-[18px]' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={!form.reportId}>
                  <Save className="mr-1.5 h-4 w-4" /> {editing ? 'Save Changes' : 'Create Schedule'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}