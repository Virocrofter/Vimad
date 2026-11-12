/* apps/web/src/app/admin/backups/ScheduleModal.jsx — create/edit schedule */
import { useState, useEffect } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { FREQS } from './components.jsx';

export default function ScheduleModal({ open, onClose, onSubmit, busy, editing }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('full');
  const [cron, setCron] = useState('0 2 * * *');
  const [retention, setRetention] = useState(30);
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '');
      setType(editing?.type ?? 'full');
      setCron(editing?.cron ?? '0 2 * * *');
      setRetention(editing?.retentionDays ?? 30);
      setIsActive(editing?.isActive ?? true);
    }
  }, [open, editing]);
  if (!open) return null;
  const submit = (e) => {
    e.preventDefault();
    onSubmit({ name, type, cron, retentionDays: Number(retention) || 30, isActive }, editing?.id);
  };
  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <div className="bk-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2>
            <CalendarClock size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
            {editing ? 'Edit schedule' : 'New backup schedule'}
          </h2>
          <button className="bk-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="sub">
          The API sweeps due schedules every 30 seconds and runs pg_dump automatically.
        </p>
        <form onSubmit={submit}>
          <div className="bk-field">
            <label>Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nightly full backup"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="bk-field">
              <label>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="full">Full</option>
                <option value="schema">Schema only</option>
                <option value="incremental">Table subset</option>
              </select>
            </div>
            <div className="bk-field">
              <label>Retention (days)</label>
              <input
                type="number"
                min={1}
                value={retention}
                onChange={(e) => setRetention(e.target.value)}
              />
            </div>
          </div>
          <div className="bk-field">
            <label>Frequency preset</label>
            <select
              value={FREQS.find((f) => f.cron === cron)?.cron ?? 'custom'}
              onChange={(e) => setCron(e.target.value)}
            >
              {FREQS.map((f) => (
                <option key={f.cron} value={f.cron}>
                  {f.label}
                </option>
              ))}
              <option value="custom">Custom…</option>
            </select>
          </div>
          <div className="bk-field">
            <label>Cron expression (min hour day-of-month month day-of-week)</label>
            <input value={cron} onChange={(e) => setCron(e.target.value)} placeholder="0 2 * * *" />
          </div>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 4 }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />{' '}
            Active
          </label>
          <div className="bk-modal-actions">
            <button type="button" className="bk-btn bk-btn-soft" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bk-btn bk-btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
