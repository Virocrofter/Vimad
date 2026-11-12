import { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Flame,
  Sun,
  Snowflake,
  Minus,
  RotateCcw,
  ArrowRightLeft,
  Ban,
  CalendarPlus,
  MailPlus,
  Trash2,
} from 'lucide-react';

export function Kpi({ cls, label, value, sub }) {
  return (
    <div className={`demo-kpi ${cls}`}>
      <div className="k-label">{label}</div>
      <div className="k-value">{value}</div>
      {sub ? <div className="k-sub">{sub}</div> : null}
    </div>
  );
}

const TEMP_META = {
  hot: { icon: Flame, label: 'Hot', cls: 'hot' },
  warm: { icon: Sun, label: 'Warm', cls: 'warm' },
  cold: { icon: Snowflake, label: 'Cold', cls: 'cold' },
  none: { icon: Minus, label: 'No activity', cls: 'none' },
};

export function TempBadge({ temp }) {
  const m = TEMP_META[temp] ?? TEMP_META.none;
  const Icon = m.icon;
  return (
    <span className={`temp ${m.cls}`}>
      <Icon size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
      {m.label}
    </span>
  );
}

export function StatusChip({ status }) {
  return <span className={`chip ${status}`}>{status}</span>;
}

export function Drawer({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="demo-drawer">
      <div className="scrim" onClick={onClose} />
      <div className="panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17 }}>{title}</h2>
          <button className="demo-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="demo-modal">
      <div className="scrim" onClick={onClose} />
      <div className="box">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button className="demo-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CopyButton({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="demo-btn"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
    >
      {ok ? <Check size={13} /> : <Copy size={13} />} {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

export function ApproveModal({ session, onClose, onSubmit, busy }) {
  const [days, setDays] = useState(14);
  const [note, setNote] = useState('');
  return (
    <Modal open onClose={onClose} title={`Approve — ${session?.requesterEmail ?? ''}`}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>
        Provisions a living demo hotel (rooms, arrivals today, in-house guests, open folio, ticket,
        task) and creates a viewer login.
      </p>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Access length (days)</label>
      <input
        className="demo-field"
        type="number"
        min={1}
        max={90}
        value={days}
        onChange={(e) => setDays(e.target.value)}
      />
      <label style={{ fontSize: 12, fontWeight: 600 }}>Internal note (optional)</label>
      <input
        className="demo-field"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Follow-up call booked Thursday"
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="demo-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="demo-btn primary"
          disabled={busy}
          onClick={() => onSubmit({ days: Number(days), note })}
        >
          Provision demo
        </button>
      </div>
    </Modal>
  );
}

export function InviteModal({ result, email, onClose }) {
  if (!result) return null;
  const full = `${window.location.origin}${result.url}`;
  return (
    <Modal open onClose={onClose} title="Magic link created">
      <p style={{ fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>
        Single-use, expires in 24h. Send it to <strong>{email}</strong> — they click and land
        straight inside the demo.
      </p>
      <div className="magic-link">{full}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <CopyButton text={full} />
        <button className="demo-btn primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

export function ExtendModal({ session, onClose, onSubmit, busy }) {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  return (
    <Modal open onClose={onClose} title="Extend demo">
      <label style={{ fontSize: 12, fontWeight: 600 }}>Extend by (days)</label>
      <input
        className="demo-field"
        type="number"
        min={1}
        max={30}
        value={days}
        onChange={(e) => setDays(e.target.value)}
      />
      <label style={{ fontSize: 12, fontWeight: 600 }}>Reason</label>
      <input
        className="demo-field"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Decision pushed to next week"
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="demo-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="demo-btn primary"
          disabled={busy}
          onClick={() => onSubmit({ days: Number(days), reason })}
        >
          Extend
        </button>
      </div>
    </Modal>
  );
}

export function RevokeModal({ session, onClose, onSubmit, busy }) {
  const [reason, setReason] = useState('');
  return (
    <Modal open onClose={onClose} title={`Revoke — ${session?.requesterEmail ?? ''}`}>
      <p style={{ fontSize: 13, color: '#be123c' }}>
        Suspends the demo tenant immediately. The tenant and its data remain until the purge sweep
        (14-day grace).
      </p>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Reason</label>
      <input
        className="demo-field"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. Abusive usage / requested removal"
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="demo-btn" onClick={onClose}>
          Cancel
        </button>
        <button className="demo-btn danger" disabled={busy} onClick={() => onSubmit({ reason })}>
          <Ban size={13} /> Revoke access
        </button>
      </div>
    </Modal>
  );
}

export function ApproveResultModal({ result, onClose }) {
  if (!result) return null;
  const { credentials, tenantSlug } = result;
  return (
    <Modal open onClose={onClose} title="Demo provisioned">
      <p style={{ fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>
        Tenant <strong>{tenantSlug}</strong> is live with a fully seeded hotel. Viewer credentials
        (shown once — invite by magic link next):
      </p>
      <div className="creds">
        URL: {window.location.origin}/auth/login
        <br />
        Tenant: {tenantSlug}
        <br />
        Email: {credentials.email}
        <br />
        Password: {credentials.password}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <CopyButton
          text={`${window.location.origin}/auth/login
tenant: ${tenantSlug}
email: ${credentials.email}
password: ${credentials.password}`}
        />
        <button className="demo-btn primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
