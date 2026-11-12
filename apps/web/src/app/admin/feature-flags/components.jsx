import React, { useState, useEffect } from 'react';
import * as api from '../../../api/feature-flag';

export const StatCards = ({ stats }) => (
  <div className="ff-stats">
    <div className="ff-stat violet">
      <div className="n">{stats.total}</div>
      <div className="l">Total flags</div>
    </div>
    <div className="ff-stat emerald">
      <div className="n">{stats.active}</div>
      <div className="l">Active</div>
    </div>
    <div className="ff-stat rose">
      <div className="n">{stats.killed}</div>
      <div className="l">Killed</div>
    </div>
    <div className="ff-stat amber">
      <div className="n">{stats.protected}</div>
      <div className="l">Protected</div>
    </div>
  </div>
);

export const EnvBadge = ({ env }) => (
  <span className={'ff-badge env-' + (env || 'production')}>{env || 'production'}</span>
);
export const StatusPill = ({ status }) => (
  <span className={'ff-badge ' + status}>{status === 'active' ? '● active' : '✕ killed'}</span>
);
export const SourceBadge = ({ source }) => (
  <span className={'ff-badge src-' + source}>{source}</span>
);

const fmtVal = (v) => (typeof v === 'object' ? JSON.stringify(v) : String(v));

export function FlagsTable({ flags, onOpen, onEdit, onAsk, onChanged }) {
  if (!flags.length)
    return <div className="ff-empty">No flags match. Create your first flag →</div>;
  return (
    <table className="ff-table">
      <thead>
        <tr>
          <th>Flag</th>
          <th>Status</th>
          <th>Env</th>
          <th>Type</th>
          <th>Default</th>
          <th>Rollout</th>
          <th>Overrides</th>
          <th>Last change</th>
          <th style={{ width: 210 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {flags.map((f) => (
          <tr key={f.id} onClick={() => onOpen(f)}>
            <td>
              <div className="ff-key">
                {f.protected ? '🔒 ' : ''}
                {f.key}
              </div>
              <div style={{ color: '#8b8aa3', fontSize: 12, marginTop: 2 }}>{f.description}</div>
            </td>
            <td>
              <StatusPill status={f.status} />
            </td>
            <td>
              <EnvBadge env={f.environment} />
            </td>
            <td>
              <span className="ff-badge vt">{f.valueType}</span>
            </td>
            <td>
              <span className="ff-trace-verdict" title={fmtVal(f.defaultValue)}>
                {fmtVal(f.defaultValue)}
              </span>
            </td>
            <td>
              <div className="ff-rollbar">
                <div style={{ width: (f.rolloutPct || 0) + '%' }} />
              </div>
              <div style={{ fontSize: 11, color: '#8b8aa3', marginTop: 3 }}>
                {f.rolloutPct || 0}%
              </div>
            </td>
            <td style={{ textAlign: 'center' }}>{f.overridesCount}</td>
            <td style={{ fontSize: 12, color: '#8b8aa3' }}>
              {f.lastChangeAt ? new Date(f.lastChangeAt).toLocaleString() : '—'}
              <br />
              {f.lastChangeBy || ''}
            </td>
            <td onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {f.valueType === 'boolean' && f.status === 'active' && (
                  <button
                    className="ff-btn ghost small"
                    onClick={() =>
                      onAsk({
                        title: `Flip default — ${f.key}`,
                        message: `Turn default ${f.defaultValue ? 'OFF' : 'ON'} for ${f.key}?`,
                        confirmLabel: 'Flip',
                        action: (reason) => api.setFlagDefault(f.id, !f.defaultValue, reason),
                      })
                    }
                  >
                    {f.defaultValue ? 'Turn off' : 'Turn on'}
                  </button>
                )}
                <button className="ff-btn ghost small" onClick={() => onEdit(f)}>
                  Edit
                </button>
                {f.status === 'active' ? (
                  <button
                    className="ff-btn danger small"
                    onClick={() =>
                      onAsk({
                        title: `KILL ${f.key}`,
                        message:
                          'Instantly off for every tenant. Fail mode: ' +
                          f.failMode +
                          '. This writes an audit event.',
                        confirmLabel: '☠ Kill switch',
                        danger: true,
                        action: (reason) => api.killFlag(f.id, reason),
                      })
                    }
                  >
                    Kill
                  </button>
                ) : (
                  <button
                    className="ff-btn ghost small"
                    onClick={() =>
                      onAsk({
                        title: `Restore ${f.key}`,
                        message: 'Restores as active with rollout 0% — ramp up deliberately.',
                        confirmLabel: 'Restore',
                        action: (reason) => api.restoreFlag(f.id, reason),
                      })
                    }
                  >
                    Restore
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ConfirmReason({
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  requireReason = true,
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="ff-modal-bg" onClick={onCancel}>
      <div
        className="ff-modal"
        style={{ width: 'min(440px, 94vw)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        <p style={{ color: '#6b7280', fontSize: 13.5 }}>{message}</p>
        {requireReason && (
          <div className="ff-field">
            <label>Reason (required, audited)</label>
            <input
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this change?"
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="ff-btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={'ff-btn ' + (danger ? 'danger' : 'primary')}
            disabled={requireReason && reason.trim().length < 3}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TracePanel({ flags }) {
  const [tenant, setTenant] = useState('');
  const [results, setResults] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!tenant.trim()) return;
    setBusy(true);
    setErr('');
    setResults(null);
    try {
      const r = await api.evaluateTenant(tenant.trim());
      setResults(r.results || []);
      setTenantInfo(r.tenant || null);
    } catch (e) {
      setErr(e?.message || 'Evaluation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="ff-card">
        <h3>Why does a tenant see what it sees?</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="ff-input"
            style={{ flex: 1 }}
            placeholder="Tenant id or slug — e.g. demo-hotel"
            value={tenant}
            onChange={(e) => setTenant(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
          />
          <button className="ff-btn primary" onClick={run} disabled={busy}>
            {busy ? 'Evaluating…' : 'Evaluate all flags'}
          </button>
        </div>
        {err && (
          <div className="ff-error" style={{ marginTop: 10 }}>
            {err}
          </div>
        )}
        {tenantInfo && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
            <b style={{ color: '#1e1b4b' }}>{tenantInfo.slug}</b> · plan {tenantInfo.plan} ·{' '}
            {tenantInfo.propertyCount} properties · stable hash{' '}
            <b>{results?.[0]?.hashPct ?? '—'}%</b>
          </div>
        )}
      </div>
      {results && (
        <table className="ff-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Verdict</th>
              <th>Source</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.flagId} style={{ cursor: 'default' }}>
                <td className="ff-key">{r.key}</td>
                <td>
                  <span className="ff-trace-verdict" title={fmtVal(r.value)}>
                    {fmtVal(r.value)}
                  </span>
                </td>
                <td>
                  <SourceBadge source={r.source} />
                </td>
                <td style={{ color: '#6b7280', fontSize: 12.5 }}>{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!results && flags.length > 0 && (
        <div className="ff-empty">
          Run an evaluation to see the verdict + reasoning for every flag.
        </div>
      )}
    </div>
  );
}

export function FlagDrawer({ flagId, flags, onClose, onChanged, onAsk }) {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const flag = data?.flag || flags.find((f) => f.id === flagId);

  const load = async () => {
    try {
      setData(await api.getFlag(flagId));
    } catch (e) {
      setErr(e?.message || 'Load failed');
    }
  };
  useEffect(() => {
    load();
  }, [flagId]);

  const [ovTenant, setOvTenant] = useState('');
  const [ovValue, setOvValue] = useState('');
  const [ovReason, setOvReason] = useState('');
  const [traceTenant, setTraceTenant] = useState('demo-hotel');
  const [trace, setTrace] = useState(null);

  const addOverride = async () => {
    let value;
    try {
      value = ovValue === '' ? flag.defaultValue : JSON.parse(ovValue);
    } catch {
      alert('Override value must be JSON — e.g. true, 50, "calm-premium"');
      return;
    }
    try {
      await api.setOverride(flagId, { tenantId: ovTenant.trim(), value, reason: ovReason.trim() });
      setOvTenant('');
      setOvValue('');
      setOvReason('');
      load();
      onChanged();
    } catch (e) {
      alert(e?.message || 'Override failed');
    }
  };

  const runTrace = async () => {
    try {
      setTrace(await api.traceFlag(flagId, traceTenant.trim()));
    } catch (e) {
      alert(e?.message || 'Trace failed');
    }
  };

  return (
    <div className="ff-drawer-wrap">
      <div className="ff-drawer-bg" onClick={onClose} />
      <div className="ff-drawer">
        {!flag ? (
          <div className="ff-empty">Loading…</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <h2>
                  {flag.protected ? '🔒 ' : ''}
                  {flag.key}
                </h2>
                <div style={{ color: '#6b7280', fontSize: 13 }}>{flag.description}</div>
              </div>
              <button className="ff-btn ghost small" onClick={onClose}>
                ✕ Close
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <StatusPill status={flag.status} />
              <EnvBadge env={flag.environment} />
              <span className="ff-badge vt">{flag.valueType}</span>
              {flag.protected && <span className="ff-badge protected">🔒 protected</span>}
            </div>

            <div className="ff-dtabs">
              {[
                ['overview', 'Overview'],
                ['overrides', `Overrides (${data?.overrides?.length ?? flag.overridesCount ?? 0})`],
                ['trace', 'Trace'],
                ['analytics', 'Analytics'],
                ['history', 'History'],
              ].map(([k, l]) => (
                <button
                  key={k}
                  className={'ff-dtab' + (tab === k ? ' on' : '')}
                  onClick={() => setTab(k)}
                >
                  {l}
                </button>
              ))}
            </div>

            {err && <div className="ff-error">{err}</div>}

            {tab === 'overview' && (
              <>
                <div className="ff-card">
                  <h3>Flag definition</h3>
                  <div className="ff-kv">
                    <span className="k">Default value</span>
                    <span className="v">{fmtVal(flag.defaultValue)}</span>
                  </div>
                  <div className="ff-kv">
                    <span className="k">Variants</span>
                    <span className="v">
                      {(flag.variants || []).map((v) => v.name).join(', ') || '—'}
                    </span>
                  </div>
                  <div className="ff-kv">
                    <span className="k">Rollout</span>
                    <span className="v">{flag.rolloutPct || 0}%</span>
                  </div>
                  <div className="ff-kv">
                    <span className="k">Fail mode</span>
                    <span className="v">
                      {flag.failMode}{' '}
                      {flag.failMode === 'closed'
                        ? '(feature off on failure)'
                        : '(feature on on failure)'}
                    </span>
                  </div>
                  <div className="ff-kv">
                    <span className="k">Owner</span>
                    <span className="v">{flag.owner}</span>
                  </div>
                  <div className="ff-kv">
                    <span className="k">Segment rules</span>
                    <span className="v">{(flag.segmentRules || []).length}</span>
                  </div>
                  {flag.status === 'killed' && (
                    <div className="ff-kv">
                      <span className="k">Kill reason</span>
                      <span className="v">{flag.killReason}</span>
                    </div>
                  )}
                </div>
                <div className="ff-card">
                  <h3>Rollout ramp</h3>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={flag.rolloutPct || 0}
                    style={{ width: '100%' }}
                    onMouseUp={(e) =>
                      onAsk({
                        title: `Set rollout — ${flag.key}`,
                        message: `Ramp ${flag.key} to ${e.target.value}%? Tenants keep a stable hash position, so ramps only ever add tenants — nobody flips back and forth.`,
                        confirmLabel: `Ramp to ${e.target.value}%`,
                        action: (reason) =>
                          api.setRollout(flagId, Number(e.target.value), reason).then(() => {
                            load();
                            onChanged();
                          }),
                      })
                    }
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#8b8aa3',
                    }}
                  >
                    <span>0%</span>
                    <b style={{ color: '#7c3aed' }}>{flag.rolloutPct || 0}%</b>
                    <span>100%</span>
                  </div>
                </div>
              </>
            )}

            {tab === 'overrides' && (
              <div className="ff-card">
                <h3>Tenant overrides</h3>
                <div className="ff-scroll">
                  {(data?.overrides || []).map((o) => (
                    <div className="ff-ovrow" key={o.id}>
                      <div style={{ flex: 1 }}>
                        <b>{o.tenantSlug || o.tenantId}</b>{' '}
                        {o.tenantName ? `(${o.tenantName})` : ''}
                        <div style={{ fontSize: 12, color: '#8b8aa3' }}>
                          → <span className="ff-trace-verdict">{fmtVal(o.value)}</span> · {o.reason}{' '}
                          · by {o.createdBy}
                        </div>
                      </div>
                      <button
                        className="ff-btn ghost small"
                        onClick={async () => {
                          try {
                            await api.deleteOverride(o.id, 'Removed from flag drawer');
                            load();
                            onChanged();
                          } catch (e) {
                            alert(e?.message || 'Delete failed');
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {!(data?.overrides || []).length && (
                    <div style={{ color: '#8b8aa3', fontSize: 13, padding: '8px 0' }}>
                      No overrides yet.
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 14, borderTop: '1px dashed #eeedf6', paddingTop: 14 }}>
                  <div className="ff-field">
                    <label>Tenant id or slug</label>
                    <input
                      value={ovTenant}
                      onChange={(e) => setOvTenant(e.target.value)}
                      placeholder="demo-hotel"
                    />
                  </div>
                  <div className="ff-row">
                    <div className="ff-field">
                      <label>Value (JSON — blank = default)</label>
                      <input
                        value={ovValue}
                        onChange={(e) => setOvValue(e.target.value)}
                        placeholder="true"
                      />
                    </div>
                    <div className="ff-field">
                      <label>Reason (audited)</label>
                      <input
                        value={ovReason}
                        onChange={(e) => setOvReason(e.target.value)}
                        placeholder="Why this override?"
                      />
                    </div>
                  </div>
                  <button
                    className="ff-btn primary"
                    disabled={!ovTenant.trim() || ovReason.trim().length < 3}
                    onClick={addOverride}
                  >
                    Save override
                  </button>
                </div>
              </div>
            )}

            {tab === 'trace' && (
              <div className="ff-card">
                <h3>Single-flag trace</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    className="ff-input"
                    style={{ flex: 1 }}
                    value={traceTenant}
                    onChange={(e) => setTraceTenant(e.target.value)}
                    placeholder="tenant id or slug"
                  />
                  <button className="ff-btn primary" onClick={runTrace}>
                    Trace
                  </button>
                </div>
                {trace && (
                  <div style={{ marginTop: 14 }}>
                    <div className="ff-kv">
                      <span className="k">Tenant</span>
                      <span className="v">
                        {trace.tenant.slug} · plan {trace.tenant.plan} ·{' '}
                        {trace.tenant.propertyCount} properties
                      </span>
                    </div>
                    <div className="ff-kv">
                      <span className="k">Hash position</span>
                      <span className="v">{trace.hashPct}%</span>
                    </div>
                    <div className="ff-kv">
                      <span className="k">Verdict</span>
                      <span className="v">{fmtVal(trace.verdict.value)}</span>
                    </div>
                    <div className="ff-kv">
                      <span className="k">Source</span>
                      <span className="v">
                        <SourceBadge source={trace.verdict.source} />
                      </span>
                    </div>
                    <div className="ff-kv">
                      <span className="k">Why</span>
                      <span className="v">{trace.verdict.detail}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'analytics' && (
              <div className="ff-card">
                <h3>Last 24 hours</h3>
                <div className="ff-stats" style={{ marginBottom: 0 }}>
                  <div className="ff-stat violet">
                    <div className="n">{data?.analytics?.impressions24h ?? 0}</div>
                    <div className="l">Impressions</div>
                  </div>
                  <div className="ff-stat emerald">
                    <div className="n">{data?.analytics?.tenants24h ?? 0}</div>
                    <div className="l">Tenants seen</div>
                  </div>
                  <div className="ff-stat rose">
                    <div className="n">{data?.analytics?.errors24h ?? 0}</div>
                    <div className="l">Errors</div>
                  </div>
                  <div className="ff-stat amber">
                    <div className="n">{data?.analytics?.adoptionPct ?? 0}%</div>
                    <div className="l">Adoption</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#8b8aa3', marginTop: 12 }}>
                  Impressions are deterministically sampled at 10%. Wire{' '}
                  <code>pushImpressions()</code> from hotel/guest clients to fill this live.
                </p>
              </div>
            )}

            {tab === 'history' && (
              <div className="ff-card">
                <h3>Change history (audit trail)</h3>
                <div className="ff-scroll">
                  {(data?.changes || []).map((c, i) => (
                    <div className="ff-hist-row" key={i}>
                      <span className="what">{c.action}</span> ·{' '}
                      <span className="who">{c.actorEmail}</span>
                      <div style={{ color: '#8b8aa3' }}>
                        {new Date(c.createdAt).toLocaleString()}
                        {c.reason ? ` — ${c.reason}` : ''}
                      </div>
                    </div>
                  ))}
                  {!(data?.changes || []).length && (
                    <div style={{ color: '#8b8aa3', fontSize: 13 }}>No changes recorded yet.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
