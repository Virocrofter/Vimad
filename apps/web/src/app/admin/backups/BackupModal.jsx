/* apps/web/src/app/admin/backups/BackupModal.jsx — create a backup now */
import { useState } from 'react';
import { Database, X } from 'lucide-react';

const TYPES = [
  {
    value: 'full',
    label: 'Full — entire database',
    desc: 'Everything: all hotels, guests, folios, payments. The default for DR.',
  },
  {
    value: 'schema',
    label: 'Schema only',
    desc: 'Structure without data. Fast; useful before migrations.',
  },
  {
    value: 'incremental',
    label: 'Table subset',
    desc: 'Pick specific tables below (a logical slice, not WAL deltas).',
  },
];

export default function BackupModal({ open, onClose, onSubmit, busy }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('full');
  const [tables, setTables] = useState('');
  const [retention, setRetention] = useState(30);
  if (!open) return null;
  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      name: name || undefined,
      type,
      retentionDays: Number(retention) || 30,
      tables:
        type === 'incremental' && tables.trim()
          ? tables
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
    });
  };
  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <div className="bk-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2>
            <Database size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
            Create backup
          </h2>
          <button className="bk-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="sub">
          Runs pg_dump immediately, gzips it, stores the SHA-256 checksum, and records the run.
        </p>
        <form onSubmit={submit}>
          <div className="bk-field">
            <label>Label (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`manual-full-${new Date().toISOString().slice(0, 16)}`}
            />
          </div>
          <div className="bk-field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground,#a1a1aa)', marginTop: 6 }}>
              {TYPES.find((t) => t.value === type)?.desc}
            </div>
          </div>
          {type === 'incremental' && (
            <div className="bk-field">
              <label>Tables (comma-separated)</label>
              <textarea
                rows={3}
                value={tables}
                onChange={(e) => setTables(e.target.value)}
                placeholder="guests, reservations, folios, payments"
              />
            </div>
          )}
          <div className="bk-field">
            <label>Retention (days)</label>
            <input
              type="number"
              min={1}
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
            />
          </div>
          <div className="bk-modal-actions">
            <button type="button" className="bk-btn bk-btn-soft" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bk-btn bk-btn-primary" disabled={busy}>
              {busy ? 'Starting…' : 'Start backup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
