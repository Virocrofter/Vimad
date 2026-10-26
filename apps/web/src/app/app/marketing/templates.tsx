import { useEffect, useMemo, useState } from 'react';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  applyTemplate,
  type Template,
} from '../../../api/marketing';

const CATEGORIES = ['all', 'email', 'sms', 'whatsapp', 'social'] as const;

const CAT_STYLES: Record<string, string> = {
  email: 'bg-sky-100 text-sky-700',
  sms: 'bg-emerald-100 text-emerald-700',
  whatsapp: 'bg-green-100 text-green-700',
  social: 'bg-violet-100 text-violet-700',
};

const SAMPLE_VARS: Record<string, string> = {
  guestName: 'Thandi Nkosi',
  hotelName: 'Ocean Breeze Hotel',
  bookingRef: 'OB-48213',
  checkIn: '2026-11-02',
  city: 'Durban',
};

const renderBody = (body: string) =>
  body.replace(/\{\{(\w+)\}\}/g, (_, k) => SAMPLE_VARS[k] ?? `{{${k}}}`);

interface Draft {
  id?: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  tags: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('all');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setError(null);
    listTemplates()
      .then(setTemplates)
      .catch((e) => setError(e?.response?.data?.error?.message ?? e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return templates.filter(
      (t) =>
        (cat === 'all' || t.category === cat) &&
        (!q ||
          t.name.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  }, [templates, cat, query]);

  const openNew = () =>
    setEditing({ name: '', category: 'email', subject: '', body: '', tags: '' });
  const openEdit = (t: Template) =>
    setEditing({
      id: t.id,
      name: t.name,
      category: t.category,
      subject: t.subject ?? '',
      body: t.body,
      tags: t.tags.join(', '),
    });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: editing.name,
        category: editing.category,
        subject: editing.subject || undefined,
        body: editing.body,
        tags: editing.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editing.id) await updateTemplate(editing.id, payload);
      else await createTemplate(payload);
      setEditing(null);
      setNotice(editing.id ? 'Template updated.' : 'Template created.');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e.message);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (t: Template) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try {
      await deleteTemplate(t.id);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e.message);
    }
  };

  const doDuplicate = async (t: Template) => {
    try {
      await duplicateTemplate(t.id);
      setNotice(`Duplicated "${t.name}".`);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e.message);
    }
  };

  const doApply = async (t: Template) => {
    try {
      const campaign = await applyTemplate(t.id);
      setNotice(
        `Draft campaign "${campaign.name}" created. Assign a segment and activate it from Analytics.`
      );
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e.message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500">Reusable messages for campaigns and automations.</p>
        </div>
        <button
          onClick={openNew}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          New template
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${cat === c ? 'bg-gray-900 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {c}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          className="ml-auto w-64 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-900 focus:outline-none"
        />
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
        <div className="py-20 text-center text-sm text-gray-400">Loading templates…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-gray-700">No templates found</p>
          <p className="mt-1 text-sm text-gray-400">
            Create a reusable email, SMS or WhatsApp message.
          </p>
          <button
            onClick={openNew}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Create a template
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{t.name}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CAT_STYLES[t.category] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {t.category}
                    </span>
                    {t.tenantId === null && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        system
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-gray-400">{t.usageCount} uses</span>
              </div>
              {t.subject && (
                <p className="mt-2 truncate text-xs font-medium text-gray-600">
                  Subject: {t.subject}
                </p>
              )}
              <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-wrap text-xs text-gray-500">
                {t.body}
              </p>
              {t.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setPreview(t)}
                  className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Preview
                </button>
                <button
                  onClick={() => doApply(t)}
                  className="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700"
                >
                  Use
                </button>
                {t.tenantId !== null ? (
                  <>
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => doDelete(t)}
                      className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => doDuplicate(t)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Duplicate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{preview.name}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${CAT_STYLES[preview.category] ?? ''}`}
              >
                {preview.category}
              </span>
            </div>
            {preview.category === 'email' ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Subject:</span>{' '}
                  {renderBody(preview.subject ?? '')}
                </div>
                <div className="whitespace-pre-wrap px-4 py-3 text-sm text-gray-700">
                  {renderBody(preview.body)}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3">
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                  {renderBody(preview.body)}
                </p>
                <p className="mt-2 text-right text-[10px] text-gray-400">
                  Delivered via {preview.category}
                </p>
              </div>
            )}
            <p className="mt-3 text-xs text-gray-400">
              Variables: {'{{guestName}}'}, {'{{hotelName}}'}, {'{{bookingRef}}'}, {'{{checkIn}}'},{' '}
              {'{{city}}'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPreview(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  doApply(preview);
                  setPreview(null);
                }}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
              >
                Use this template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / edit modal */}
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
              {editing.id ? 'Edit template' : 'New template'}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
                  <select
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Tags (comma separated)
                  </label>
                  <input
                    value={editing.tags}
                    onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
                    placeholder="winback, offer"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  />
                </div>
              </div>
              {editing.category === 'email' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Subject</label>
                  <input
                    value={editing.subject}
                    onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Body</label>
                <textarea
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  rows={6}
                  placeholder={'Dear {{guestName}},\n\n…'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Variables: {'{{guestName}}'}, {'{{hotelName}}'}, {'{{bookingRef}}'},{' '}
                  {'{{checkIn}}'}, {'{{city}}'}
                </p>
              </div>
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
                disabled={saving || !editing.name.trim() || !editing.body.trim()}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40"
              >
                {saving ? 'Saving…' : editing.id ? 'Save changes' : 'Create template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
