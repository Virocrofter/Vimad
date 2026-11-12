/* apps/web/src/app/admin/backups/TestRestoreModal.jsx — non-destructive validation */
import { FlaskConical, CheckCircle2, XCircle, X } from 'lucide-react';
import { fmtBytes, fmtDate } from './components.jsx';

export default function TestRestoreModal({ open, onClose, backup, result, running }) {
  if (!open || !backup) return null;
  const checks = result?.checks || [];
  return (
    <div className="bk-modal-overlay" onClick={onClose}>
      <div className="bk-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2>
            <FlaskConical size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
            Test restore
          </h2>
          <button className="bk-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="sub">
          {backup.name || backup.kind} · {fmtBytes(backup.sizeBytes)} · {fmtDate(backup.startedAt)}
        </p>
        <div className="bk-banner info">
          Restores into a throwaway <code>vimad_verify_*</code> database, runs row-parity checks
          against live data, then drops it. Production is never touched.
        </div>
        {running && <div className="bk-banner warn">Restore running — checking table parity…</div>}
        {result && !running && (
          <div className={`bk-banner ${result.passed ? 'ok' : 'warn'}`}>
            {result.passed
              ? `All ${checks.length} integrity checks passed. restoreTested* columns updated on the run.`
              : 'Some checks failed — see details below.'}
          </div>
        )}
        {checks.map((c) => (
          <div className="bk-check-row" key={c.check}>
            <span>
              {c.check}
              <div style={{ fontSize: 11, color: 'var(--muted-foreground,#a1a1aa)' }}>
                {c.detail}
              </div>
            </span>
            {c.passed ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : (
              <XCircle size={16} color="#ef4444" />
            )}
          </div>
        ))}
        <div className="bk-modal-actions">
          <button className="bk-btn bk-btn-soft" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
