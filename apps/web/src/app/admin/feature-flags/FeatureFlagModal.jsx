import React, { useState, useEffect } from 'react';
import * as api from '../../../api/feature-flag';

const EMPTY = {
  key: '',
  description: '',
  owner: 'platform',
  environment: 'production',
  valueType: 'boolean',
  defaultValue: 'true',
  variants: '[]',
  segmentRules: '[]',
  failMode: 'closed',
  protected: false,
  rolloutPct: 0,
};

export default function FeatureFlagModal({ flag, onClose, onSaved }) {
  const editing = !!flag;
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (flag) {
      setF({
        key: flag.key,
        description: flag.description || '',
        owner: flag.owner || 'platform',
        environment: flag.environment || 'production',
        valueType: flag.valueType || 'boolean',
        defaultValue:
          typeof flag.defaultValue === 'object'
            ? JSON.stringify(flag.defaultValue)
            : String(flag.defaultValue),
        variants: JSON.stringify(flag.variants || [], null, 2),
        segmentRules: JSON.stringify(flag.segmentRules || [], null, 2),
        failMode: flag.failMode || 'closed',
        protected: !!flag.protected,
        rolloutPct: flag.rolloutPct || 0,
      });
    }
  }, [flag]);

  const parseDefault = () => {
    if (f.valueType === 'boolean') return f.defaultValue === 'true';
    if (f.valueType === 'number') {
      const n = Number(f.defaultValue);
      if (Number.isNaN(n)) throw new Error('Default must be a number');
      return n;
    }
    if (f.valueType === 'string') return f.defaultValue;
    return JSON.parse(f.defaultValue || 'null');
  };

  const save = async () => {
    setErr('');
    setBusy(true);
    let defaultValue, variants, segmentRules;
    try {
      defaultValue = parseDefault();
      variants = f.variants.trim() ? JSON.parse(f.variants) : [];
      if (!Array.isArray(variants)) throw new Error('variants must be a JSON array');
      segmentRules = f.segmentRules.trim() ? JSON.parse(f.segmentRules) : [];
      if (!Array.isArray(segmentRules)) throw new Error('segmentRules must be a JSON array');
    } catch (e) {
      setErr('JSON parse: ' + e.message);
      setBusy(false);
      return;
    }

    const payload = {
      description: f.description,
      owner: f.owner,
      environment: f.environment,
      valueType: f.valueType,
      defaultValue,
      variants,
      segmentRules,
      failMode: f.failMode,
      protected: f.protected,
      rolloutPct: Number(f.rolloutPct) || 0,
    };
    try {
      if (editing) await api.updateFlag(flag.id, payload);
      else await api.createFlag({ ...payload, key: f.key.trim() });
      onSaved();
    } catch (e) {
      setErr(e?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ff-modal-bg" onClick={onClose}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editing ? `Edit — ${flag.key}` : 'New feature flag'}</h2>
        {err && <div className="ff-error">{err}</div>}
        <div className="ff-row">
          <div className="ff-field">
            <label>Key *</label>
            <input
              value={f.key}
              disabled={editing}
              onChange={(e) => set('key', e.target.value)}
              placeholder="new-checkin-flow"
            />
          </div>
          <div className="ff-field">
            <label>Owner</label>
            <input value={f.owner} onChange={(e) => set('owner', e.target.value)} />
          </div>
        </div>
        <div className="ff-field">
          <label>Description</label>
          <textarea
            value={f.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What does this flag control? What breaks if it's wrong?"
          />
        </div>
        <div className="ff-row">
          <div className="ff-field">
            <label>Environment</label>
            <select value={f.environment} onChange={(e) => set('environment', e.target.value)}>
              <option value="development">development</option>
              <option value="staging">staging</option>
              <option value="production">production</option>
            </select>
          </div>
          <div className="ff-field">
            <label>Value type</label>
            <select
              value={f.valueType}
              disabled={editing}
              onChange={(e) => {
                set('valueType', e.target.value);
                set(
                  'defaultValue',
                  e.target.value === 'boolean'
                    ? 'true'
                    : e.target.value === 'number'
                      ? '0'
                      : e.target.value === 'string'
                        ? ''
                        : 'null'
                );
              }}
            >
              <option value="boolean">boolean</option>
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="json">json</option>
            </select>
          </div>
        </div>
        <div className="ff-row">
          <div className="ff-field">
            <label>Default value</label>
            <input value={f.defaultValue} onChange={(e) => set('defaultValue', e.target.value)} />
          </div>
          <div className="ff-field">
            <label>Initial rollout %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={f.rolloutPct}
              onChange={(e) => set('rolloutPct', e.target.value)}
            />
          </div>
        </div>
        <div className="ff-field">
          <label>
            Variants (JSON array of {'{'}"name","value"{'}'})
          </label>
          <textarea value={f.variants} onChange={(e) => set('variants', e.target.value)} />
        </div>
        <div className="ff-field">
          <label>Segment rules (JSON — first match wins after overrides)</label>
          <textarea
            value={f.segmentRules}
            onChange={(e) => set('segmentRules', e.target.value)}
            placeholder='[{"name":"Enterprise","all":[{"field":"plan","op":"in","value":["enterprise"]}],"value":true}]'
          />
        </div>
        <div className="ff-row">
          <div className="ff-field">
            <label>Fail mode</label>
            <select value={f.failMode} onChange={(e) => set('failMode', e.target.value)}>
              <option value="closed">closed — feature OFF if evaluation fails</option>
              <option value="open">open — feature ON if evaluation fails</option>
            </select>
          </div>
          <div className="ff-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label className="ff-switch-row" style={{ textTransform: 'none', letterSpacing: 0 }}>
              <input
                type="checkbox"
                checked={f.protected}
                onChange={(e) => set('protected', e.target.checked)}
              />
              🔒 Protected (money / permissions / guest data / check-in mechanics)
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button className="ff-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ff-btn primary"
            disabled={busy || (!editing && !/^[a-z0-9][a-z0-9-]{1,63}$/.test(f.key.trim()))}
            onClick={save}
          >
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create flag'}
          </button>
        </div>
      </div>
    </div>
  );
}
