/* apps/web/src/app/admin/backups/RestoreModal.jsx — restore job (scratch only by design) */
import { useState } from 'react';
import { Play, ShieldAlert, X } from 'lucide-react';
import { fmtBytes, fmtDate } from './components.jsx';

export default function RestoreModal({ open, onClose, backup, onSubmit, busy, result }) {
  const [verify, setVerify] = useState(true);
  if (!open || !backup) return null;
  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <div className="bk-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2>
            <Play size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
            Restore backup
          </h2>
          <button className="bk-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="sub">
          {backup.name || backup.kind} · {fmtBytes(backup.sizeBytes)} · taken{' '}
          {fmtDate(backup.startedAt)}
        </p>
        <div className="bk-banner warn">
          <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            This restores into an isolated scratch database and verifies integrity. Restoring over
            production is deliberately a manual DBA operation — verify here first, then promote via
            psql.
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={verify} onChange={(e) => setVerify(e.target.checked)} />
          Run integrity verification after restore
        </label>
        {result && (
          <div className={`bk-banner ${result.passed ? 'ok' : 'warn'}`} style={{ marginTop: 14 }}>
            {result.passed
              ? `Restore verified — ${result.checks.length} checks passed.`
              : 'Restore finished with failures — see Test Restore for details.'}
          </div>
        )}
        <div className="bk-modal-actions">
          <button className="bk-btn bk-btn-soft" onClick={onClose}>
            Close
          </button>
          <button
            className="bk-btn bk-btn-primary"
            disabled={busy}
            onClick={() => onSubmit(backup, { target: 'scratch', verify })}
          >
            {busy ? 'Restoring…' : 'Restore to scratch'}
          </button>
        </div>
      </div>
    </div>
  );
}
