import React, { useState, useEffect } from 'react';
import * as api from '../../../api/feature-flag';
import { FlagsTable, TracePanel, StatCards, ConfirmReason, FlagDrawer } from './components';
import FeatureFlagModal from './FeatureFlagModal';
import './feature-flags.css';

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [env, setEnv] = useState('all');
  const [tab, setTab] = useState('flags');
  const [modalOpen, setModalOpen] = useState(false);
  const [editFlag, setEditFlag] = useState(null);
  const [drawerFlagId, setDrawerFlagId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.listFlags();
      setFlags(r.flags || r.data?.flags || []);
    } catch (e) {
      setError(e?.message || 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = flags.filter(
    (f) =>
      (env === 'all' || f.environment === env) &&
      (!q ||
        f.key.includes(q.toLowerCase()) ||
        (f.description || '').toLowerCase().includes(q.toLowerCase()))
  );

  const stats = {
    total: flags.length,
    active: flags.filter((f) => f.status === 'active').length,
    killed: flags.filter((f) => f.status === 'killed').length,
    protected: flags.filter((f) => f.protected).length,
  };

  const ask = (cfg) => setConfirm(cfg);

  return (
    <div className="ff-root">
      <div className="ff-hero">
        <h1>🚩 Feature Flags</h1>
        <p>
          Typed values · tenant-hash rollouts · segment targeting · kill switch with declared fail
          mode · evaluation trace · impression analytics
        </p>
      </div>

      <StatCards stats={stats} />

      <div className="ff-tabs">
        <button
          className={'ff-tab' + (tab === 'flags' ? ' on' : '')}
          onClick={() => setTab('flags')}
        >
          Flags
        </button>
        <button
          className={'ff-tab' + (tab === 'trace' ? ' on' : '')}
          onClick={() => setTab('trace')}
        >
          Evaluation Trace
        </button>
      </div>

      {tab === 'flags' && (
        <>
          <div className="ff-toolbar">
            <input
              className="ff-input"
              style={{ minWidth: 260 }}
              placeholder="Search key or description…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="ff-select" value={env} onChange={(e) => setEnv(e.target.value)}>
              <option value="all">All environments</option>
              <option value="production">production</option>
              <option value="staging">staging</option>
              <option value="development">development</option>
            </select>
            <div style={{ flex: 1 }} />
            <button
              className="ff-btn primary"
              onClick={() => {
                setEditFlag(null);
                setModalOpen(true);
              }}
            >
              + New flag
            </button>
          </div>
          {error && <div className="ff-error">{error}</div>}
          {loading ? (
            <div className="ff-empty">Loading flags…</div>
          ) : (
            <FlagsTable
              flags={filtered}
              onOpen={(f) => setDrawerFlagId(f.id)}
              onEdit={(f) => {
                setEditFlag(f);
                setModalOpen(true);
              }}
              onAsk={ask}
              onChanged={load}
            />
          )}
        </>
      )}

      {tab === 'trace' && <TracePanel flags={flags} />}

      {modalOpen && (
        <FeatureFlagModal
          flag={editFlag}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}

      {drawerFlagId && (
        <FlagDrawer
          flagId={drawerFlagId}
          flags={flags}
          onClose={() => setDrawerFlagId(null)}
          onChanged={load}
          onAsk={ask}
        />
      )}

      {confirm && (
        <ConfirmReason
          title={confirm.title}
          message={confirm.message}
          requireReason={confirm.requireReason !== false}
          danger={confirm.danger}
          confirmLabel={confirm.confirmLabel}
          onCancel={() => setConfirm(null)}
          onConfirm={async (reason) => {
            try {
              await confirm.action(reason);
              setConfirm(null);
              load();
            } catch (e) {
              alert(e?.message || 'Action failed');
            }
          }}
        />
      )}
    </div>
  );
}
