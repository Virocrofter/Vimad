import { useEffect, useState } from 'react';
import {
  listWorkflows,
  createWorkflow,
  updateWorkflow,
  toggleWorkflow,
  runWorkflow,
  deleteWorkflow,
  type Workflow,
  type WorkflowAction,
} from '../../../api/marketing';

const TRIGGERS = [
  { value: 'booking.created', label: 'Booking created' },
  { value: 'guest.checked_in', label: 'Guest checked in' },
  { value: 'guest.checked_out', label: 'Guest checked out' },
  { value: 'booking.no_show', label: 'No-show' },
  { value: 'guest.birthday', label: 'Guest birthday' },
  { value: 'guest.idle_14d', label: 'Guest idle 14 days' },
  { value: 'manual', label: 'Manual only' },
];

const ACTION_TYPES: { value: WorkflowAction['type']; label: string }[] = [
  { value: 'send_email', label: 'Send email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'send_whatsapp', label: 'Send WhatsApp' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'delay', label: 'Delay' },
];

const ACTION_DEFAULTS: Record<WorkflowAction['type'], Partial<WorkflowAction>> = {
  send_email: { type: 'send_email' },
  send_sms: { type: 'send_sms' },
  send_whatsapp: { type: 'send_whatsapp' },
  webhook: { type: 'webhook', url: '' },
  delay: { type: 'delay', minutes: 60 },
};

const triggerLabel = (v: string) => TRIGGERS.find((t) => t.value === v)?.label ?? v;

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative h-5 w-10 rounded-full transition-colors disabled:opacity-40 ${on ? 'bg-emerald-500' : 'bg-gray-300'}`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  );
}

interface Draft {
  id?: string;
  name: string;
  description: string;
  trigger: string;
  active: boolean;
  actions: WorkflowAction[];
}

const EMPTY: Draft = {
  name: '',
  description: '',
  trigger: 'guest.checked_out',
  active: false,
  actions: [{ type: 'send_email' }],
};

export default function AutomationListPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => {
    setError(null);
    listWorkflows()
      .then(setWorkflows)
      .catch((e) => setError(e?.response?.data?.error?.message ?? e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => setEditing({ ...EMPTY, actions: [{ type: 'send_email' }] });
  const openEdit = (w: Workflow) =>
    setEditing({
      id: w.id,
      name: w.name,
      description: w.description ?? '',
      trigger: w.trigger,
      active: w.active,
      actions: w.actions,
    });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: editing.name,
        description: editing.description || undefined,
        trigger: editing.trigger,
        actions: editing.actions,
        active: editing.active,
      };
      if (editing.id) await updateWorkflow(editing.id, payload);
      else await createWorkflow(payload);
      setEditing(null);
      setNotice(editing.id ? 'Workflow updated.' : 'Workflow created.');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e.message);
    } finally {
      setSaving(false);
    }
  };

  const doToggle = async (w: Workflow) => {
    try {
      await toggleWorkflow(w.id);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e.message);
    }
  };

  const doRun = async (w: Workflow) => {
    setRunningId(w.id);
    setError(null);
    try {
      await runWorkflow(w.id);
      setNotice(`"${w.name}" executed — see run history.`);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e.message);
    } finally {
      setRunningId(null);
    }
  };

  const doDelete = async (w: Workflow) => {
    if (!window.confirm(`Delete workflow "${w.name}"? This cannot be undone.`)) return;
    try {
      await deleteWorkflow(w.id);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e.message);
    }
  };

  const updateAction = (i: number, patch: Partial<WorkflowAction>) =>
    setEditing(
      (d) => d && { ...d, actions: d.actions.map((a, j) => (j === i ? { ...a, ...patch } : a)) }
    );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Automation</h1>
          <p className="text-sm text-gray-500">Trigger-based workflows for guest communication.</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New workflow
        </button>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
          <button
            onClick={() => setNotice(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            ✕
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading workflows…</div>
      ) : workflows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-gray-700">No workflows yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Automate birthday emails, post-stay thank-yous, win-back campaigns and more.
          </p>
          <button
            onClick={openNew}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Create your first workflow
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <div key={w.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center gap-4 px-4 py-3">
                <Toggle on={w.active} onChange={() => doToggle(w)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{w.name}</p>
                  <p className="truncate text-xs text-gray-400">
                    {triggerLabel(w.trigger)} · {w.actions.length} action
                    {w.actions.length === 1 ? '' : 's'}
                    {w.description ? ` · ${w.description}` : ''}
                  </p>
                </div>
                <div className="hidden text-right text-xs text-gray-400 md:block">
                  <p>
                    {w.runCount} run{w.runCount === 1 ? '' : 's'}
                  </p>
                  <p>Last: {fmtTime(w.lastRunAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => doRun(w)}
                    disabled={runningId === w.id}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    {runningId === w.id ? 'Running…' : 'Run now'}
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    History
                  </button>
                  <button
                    onClick={() => openEdit(w)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => doDelete(w)}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {expanded === w.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  {(w.runs ?? []).length === 0 ? (
                    <p className="py-2 text-xs text-gray-400">No runs yet.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-400">
                          <th className="py-1">Status</th>
                          <th className="py-1">Detail</th>
                          <th className="py-1 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(w.runs ?? []).map((r) => (
                          <tr key={r.id} className="border-t border-gray-50">
                            <td className="py-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 font-medium ${r.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="py-1.5 text-gray-600">{r.detail}</td>
                            <td className="py-1.5 text-right text-gray-400">
                              {fmtTime(r.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {editing.id ? 'Edit workflow' : 'New workflow'}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Birthday surprise"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                <input
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="What does this workflow do?"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Trigger</label>
                <select
                  value={editing.trigger}
                  onChange={(e) => setEditing({ ...editing, trigger: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Actions</label>
                  <button
                    onClick={() =>
                      setEditing({
                        ...editing,
                        actions: [...editing.actions, { type: 'send_email' }],
                      })
                    }
                    className="text-xs font-medium text-gray-900 hover:underline"
                  >
                    + Add action
                  </button>
                </div>
                <div className="space-y-2">
                  {editing.actions.map((a, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={a.type}
                          onChange={(e) =>
                            updateAction(i, {
                              ...ACTION_DEFAULTS[e.target.value as WorkflowAction['type']],
                            } as WorkflowAction)
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
                        >
                          {ACTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            setEditing({
                              ...editing,
                              actions: editing.actions.filter((_, j) => j !== i),
                            })
                          }
                          disabled={editing.actions.length === 1}
                          className="text-xs text-red-500 hover:underline disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </div>
                      {a.type === 'webhook' && (
                        <input
                          value={a.url ?? ''}
                          onChange={(e) => updateAction(i, { url: e.target.value })}
                          placeholder="https://…"
                          className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
                        />
                      )}
                      {(a.type === 'send_sms' || a.type === 'send_whatsapp') && (
                        <input
                          value={a.message ?? ''}
                          onChange={(e) => updateAction(i, { message: e.target.value })}
                          placeholder="Message (leave empty to use a template)"
                          className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
                        />
                      )}
                      {a.type === 'delay' && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                          <input
                            type="number"
                            min={0}
                            value={a.minutes ?? 60}
                            onChange={(e) => updateAction(i, { minutes: Number(e.target.value) })}
                            className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
                          />
                          minutes
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Activate immediately
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.name.trim() || editing.actions.length === 0}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
              >
                {saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create workflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
