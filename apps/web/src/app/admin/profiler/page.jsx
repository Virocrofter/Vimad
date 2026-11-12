import { useState, useEffect, useCallback } from 'react';
import * as api from '@/api/profiler';
import './profiler.css';

const TABS = [
  ['overview', 'Overview'],
  ['queries', 'Slow queries'],
  ['endpoints', 'Endpoints'],
  ['database', 'Database'],
  ['queues', 'Queues'],
  ['runtime', 'Runtime'],
  ['tenants', 'Tenants'],
];
const fmt = (n) =>
  n >= 1e6
    ? (n / 1e6).toFixed(1) + 'M'
    : n >= 1e3
      ? (n / 1e3).toFixed(1) + 'k'
      : String(Math.round(n * 10) / 10);
const ms = (n) => (n >= 1000 ? (n / 1000).toFixed(2) + 's' : Math.round(n) + 'ms');
const bytes = (b) =>
  b >= 1e9
    ? (b / 1e9).toFixed(2) + ' GB'
    : b >= 1e6
      ? (b / 1e6).toFixed(1) + ' MB'
      : Math.round(b / 1024) + ' KB';
const tier = (v, warn, crit) => (v >= crit ? 'crit' : v >= warn ? 'warn' : 'ok');
const Badge = ({ t, c = 'info' }) => <span className={'prf-badge ' + c}>{t}</span>;
const Bar = ({ v, max, c }) => (
  <div className="prf-bar">
    <i className={c} style={{ width: Math.min(100, max ? (v / max) * 100 : 0) + '%' }} />
  </div>
);

function useData(fn, msPoll = 15000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const out = await fn();
      setData(out && out.data ? out.data : out);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [fn]);
  useEffect(() => {
    load();
    const t = setInterval(load, msPoll);
    return () => clearInterval(t);
  }, [load]);
  return { data, error, loading, reload: load };
}
const Skel = () => <div className="prf-skel">loading…</div>;
const Err = ({ e }) => <div className="prf-err">{e?.message || String(e)}</div>;
const Empty = ({ t = 'No data yet — traffic will populate this panel.' }) => (
  <div className="prf-empty">{t}</div>
);

function ScoreRing({ score }) {
  const c = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div
      className="prf-ring"
      style={{ background: `conic-gradient(${c} ${score * 3.6}deg, #e2e8f0 0deg)` }}
    >
      <div>{score}</div>
    </div>
  );
}

function Overview() {
  const { data, error, loading } = useData(api.getProfilerSummary);
  if (loading) return <Skel />;
  if (error) return <Err e={error} />;
  if (!data) return <Empty />;
  const L = data.layers;
  return (
    <>
      <div className="prf-card prf-score">
        <ScoreRing score={data.score} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
            Platform performance score
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--mut)' }}>
            Composite of database, HTTP, queue and runtime signals · updated{' '}
            {new Date(data.generatedAt).toLocaleTimeString()}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge
              c={tier(100 - L.database.cacheHitPct, 5, 15)}
              t={`cache ${L.database.cacheHitPct.toFixed(1)}%`}
            />
            <Badge
              c={
                L.database.slowQueries24h > 25
                  ? 'crit'
                  : L.database.slowQueries24h > 5
                    ? 'warn'
                    : 'ok'
              }
              t={`${L.database.slowQueries24h} slow q/24h`}
            />
            <Badge
              c={L.queues.failedUnresolved > 5 ? 'crit' : 'ok'}
              t={`${L.queues.failedUnresolved} failed jobs`}
            />
            <Badge
              c={tier(L.http.errorRate, 0.2, 1)}
              t={`${L.http.errorRate.toFixed(2)}% errors`}
            />
            <Badge
              c={tier(L.runtime.eventLoopP99Ms, 25, 100)}
              t={`loop p99 ${ms(L.runtime.eventLoopP99Ms)}`}
            />
          </div>
        </div>
      </div>
      <div className="prf-grid c3">
        <div className="prf-card">
          <h3>Top slow queries (24h)</h3>
          {data.offenders.slowQueries.length === 0 ? (
            <Empty t="No slow queries captured — the API is healthy or quiet." />
          ) : (
            data.offenders.slowQueries.map((q, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="prf-mono prf-q" style={{ maxWidth: '100%' }} title={q.query}>
                  {q.query}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--mut)' }}>
                  {q.count}× · avg {ms(q.avgMs)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="prf-card">
          <h3>Slowest endpoints (p95)</h3>
          {data.offenders.endpoints.length === 0 ? (
            <Empty t="Not enough traffic yet." />
          ) : (
            data.offenders.endpoints.map((e, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge c="info" t={e.key.split(' ')[0]} />
                  <span className="prf-mono">{e.key.split(' ').slice(1).join(' ')}</span>
                </div>
                <Bar
                  v={e.p95}
                  max={Math.max(...data.offenders.endpoints.map((x) => x.p95))}
                  c={tier(e.p95, 300, 1000)}
                />
                <div style={{ fontSize: 11.5, color: 'var(--mut)' }}>
                  p95 {ms(e.p95)} · avg {ms(e.avgMs)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="prf-card">
          <h3>Heaviest tenants (7d)</h3>
          {data.offenders.tenants.length === 0 ? (
            <Empty t="Tenant traffic will appear here." />
          ) : (
            data.offenders.tenants.map((t, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <b>{t.name}</b>
                  <span style={{ color: 'var(--mut)' }}>
                    {fmt(t.apiCalls7d)} calls · {t.sharePct.toFixed(1)}%
                  </span>
                </div>
                <Bar v={t.apiCalls7d} max={data.offenders.tenants[0]?.apiCalls7d || 1} c="info" />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function Queries() {
  const [range, setRange] = useState(24);
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const [explain, setExplain] = useState(null);
  const fn = useCallback(() => api.getProfilerSlowQueries(range, applied), [range, applied]);
  const { data, error, loading } = useData(fn);
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="prf-select"
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
        >
          {[1, 6, 24, 72, 168].map((r) => (
            <option key={r} value={r}>
              {r}h
            </option>
          ))}
        </select>
        <input
          className="prf-search"
          placeholder="Filter captured events…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setApplied(search)}
        />
        <button className="prf-btn" onClick={() => setApplied(search)}>
          Search
        </button>
      </div>
      {loading ? (
        <Skel />
      ) : error ? (
        <Err e={error} />
      ) : !data ? (
        <Empty />
      ) : (
        <>
          {!data.pgAvailable && (
            <div className="prf-err">
              pg_stat_statements is not enabled — showing captured events only. Enable with: CREATE
              EXTENSION IF NOT EXISTS pg_stat_statements;
            </div>
          )}
          {data.fingerprints.length > 0 && (
            <div className="prf-card">
              <h3>Query fingerprints (pg_stat_statements)</h3>
              <table className="prf-table">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Calls</th>
                    <th>Mean</th>
                    <th>Total</th>
                    <th>Rows</th>
                    <th>Δ vs baseline</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.fingerprints.map((f) => (
                    <tr key={f.fingerprint}>
                      <td className="prf-mono prf-q" title={f.query} style={{ maxWidth: 420 }}>
                        {f.query}
                      </td>
                      <td>{fmt(f.calls)}</td>
                      <td>{ms(f.meanMs)}</td>
                      <td>{ms(f.totalMs)}</td>
                      <td>{fmt(f.rows)}</td>
                      <td>
                        {f.deltaPct == null ? (
                          <Badge t="new" c="vio" />
                        ) : (
                          <Badge
                            c={f.deltaPct > 20 ? 'crit' : f.deltaPct > 5 ? 'warn' : 'ok'}
                            t={(f.deltaPct > 0 ? '+' : '') + f.deltaPct.toFixed(0) + '%'}
                          />
                        )}
                      </td>
                      <td>
                        <button className="prf-btn" onClick={() => setExplain(f.query)}>
                          Explain
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="prf-card">
            <h3>Captured slow events (&gt;300ms)</h3>
            {data.events.length === 0 ? (
              <Empty t="No slow queries in this window." />
            ) : (
              <table className="prf-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Query</th>
                    <th>Duration</th>
                    <th>Tenant</th>
                    <th>Route</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((e) => (
                    <tr key={e.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(e.createdAt).toLocaleString()}
                      </td>
                      <td className="prf-mono prf-q" style={{ maxWidth: 480 }} title={e.query}>
                        {e.query}
                      </td>
                      <td>
                        <Badge c={tier(e.durationMs, 500, 1000)} t={ms(e.durationMs)} />
                      </td>
                      <td className="prf-mono">
                        {e.tenantId ? e.tenantId.slice(0, 8) + '…' : '—'}
                      </td>
                      <td
                        className="prf-mono"
                        style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {e.route || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      {explain && <ExplainModal query={explain} onClose={() => setExplain(null)} />}
    </>
  );
}

function PlanNode({ n, d = 0 }) {
  return (
    <span className={'node' + (n.seqScan ? ' bad' : '')} style={{ ['--d']: d }}>
      <span className="nt">{n.nodeType}</span>
      {n.relation && <span className="meta"> on {n.relation}</span>}
      <span className="meta">
        {' '}
        · cost {fmt(n.totalCost)} · rows {fmt(n.actualRows)}
        {n.planRows > 0
          ? ` (est ${fmt(n.planRows)}${n.misestimate > 10 ? ' ⚠ ' + fmt(n.misestimate) + '× off' : ''})`
          : ''}{' '}
        · hit {fmt(n.sharedHit)} read {fmt(n.sharedRead)}
      </span>
      {n.filter && <span className="meta"> · filter: {n.filter}</span>}
      {n.seqScan && (
        <span className="prf-badge crit" style={{ marginLeft: 6 }}>
          SEQ SCAN
        </span>
      )}
      {(n.children || []).map((c, i) => (
        <PlanNode key={i} n={c} d={d + 1} />
      ))}
    </span>
  );
}
function ExplainModal({ query, onClose }) {
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const r = await api.explainQuery(query);
        setRes(r && r.data ? r.data : r);
      } catch (e) {
        setErr(e);
      } finally {
        setBusy(false);
      }
    })();
  }, [query]);
  return (
    <div className="prf-modal" onClick={onClose}>
      <div className="prf-modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h3>Query plan</h3>
          <button className="prf-x" onClick={onClose}>
            ✕
          </button>
        </div>
        <div
          className="prf-mono"
          style={{
            fontSize: 11,
            color: 'var(--mut)',
            margin: '6px 0 10px',
            wordBreak: 'break-all',
          }}
        >
          {query}
        </div>
        {busy ? (
          <Skel />
        ) : err ? (
          <Err e={err} />
        ) : (
          <>
            <div className="prf-row2">
              <div className="prf-tile">
                <div className="l">Planning time</div>
                <div className="v">{ms(res.planningTimeMs)}</div>
              </div>
              <div className="prf-tile">
                <div className="l">Execution time</div>
                <div className="v">{ms(res.executionTimeMs)}</div>
              </div>
            </div>
            {res.warnings.map((w, i) => (
              <div key={i} className="prf-err" style={{ marginBottom: 8 }}>
                {w}
              </div>
            ))}
            <div className="prf-plan">
              <PlanNode n={res.plan} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 10 }}>
              Ran inside a rolled-back transaction with statement_timeout = 5s. EXPLAIN ANALYZE
              executes the query — SELECT-only whitelist applied.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Endpoints() {
  const { data, error, loading } = useData(api.getProfilerEndpoints);
  if (loading) return <Skel />;
  if (error) return <Err e={error} />;
  const eps = data?.endpoints || [];
  if (!eps.length) return <Empty t="No HTTP traffic recorded yet — make a few API calls." />;
  const max95 = Math.max(...eps.map((e) => e.p95Ms), 1);
  return (
    <div className="prf-card">
      <h3>Endpoint performance (prometheus histogram, process lifetime)</h3>
      <table className="prf-table">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th style={{ width: 180 }}>p95 latency</th>
            <th>p50</th>
            <th>p99</th>
            <th>Avg</th>
            <th>Requests</th>
            <th>Error rate</th>
            <th>Queries/req</th>
          </tr>
        </thead>
        <tbody>
          {eps.map((e, i) => (
            <tr key={i}>
              <td>
                <Badge c="info" t={e.method} /> <span className="prf-mono">{e.route}</span>
                {e.nplus1 && (
                  <span className="prf-badge crit" style={{ marginLeft: 6 }}>
                    N+1
                  </span>
                )}
              </td>
              <td>
                <Bar v={e.p95Ms} max={max95} c={tier(e.p95Ms, 300, 1000)} />
                <span style={{ fontSize: 11 }}>{ms(e.p95Ms)}</span>
              </td>
              <td>{ms(e.p50Ms)}</td>
              <td>{ms(e.p99Ms)}</td>
              <td>{ms(e.avgMs)}</td>
              <td>{fmt(e.requestCount)}</td>
              <td>
                <Badge c={tier(e.errorRate, 0.2, 1)} t={e.errorRate.toFixed(2) + '%'} />
              </td>
              <td>{e.queryCountAvg ? e.queryCountAvg.toFixed(1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Database() {
  const { data, error, loading } = useData(api.getProfilerDatabase, 30000);
  if (loading) return <Skel />;
  if (error) return <Err e={error} />;
  if (!data) return <Empty />;
  const hitTier = tier(100 - data.cacheHitPct, 5, 15);
  return (
    <>
      <div className="prf-grid c4">
        <div className={'prf-card prf-kpi ' + hitTier}>
          <i className="stripe" />
          <div className="lbl">Cache hit ratio</div>
          <div className="val">{data.cacheHitPct.toFixed(1)}%</div>
          <div className="sub">
            {hitTier === 'ok' ? 'Healthy' : 'Check shared_buffers / indexes'}
          </div>
        </div>
        <div className="prf-card prf-kpi">
          <i className="stripe" />
          <div className="lbl">Database size</div>
          <div className="val">{bytes(data.dbSizeBytes)}</div>
          <div className="sub">{data.tables.length} largest tables tracked</div>
        </div>
        <div className="prf-card prf-kpi">
          <i className="stripe" />
          <div className="lbl">Connections</div>
          <div className="val">{data.connections.reduce((a, c) => a + c.count, 0)}</div>
          <div className="sub">
            {data.connections.map((c) => `${c.state}: ${c.count}`).join(' · ')}
          </div>
        </div>
        {data.wraparound.map((w, i) => (
          <div key={i} className={'prf-card prf-kpi ' + tier(w.pct, 50, 75)}>
            <i className="stripe" />
            <div className="lbl">XID wraparound</div>
            <div className="val">{w.pct.toFixed(1)}%</div>
            <div className="sub">
              age {fmt(w.xidAge)} / {fmt(w.maxAge)} — must never reach 100%
            </div>
          </div>
        ))}
      </div>
      {data.blocking.length > 0 && (
        <div className="prf-card">
          <h3>Blocking chains (live)</h3>
          {data.blocking.map((b, i) => (
            <div key={i} className="prf-adv amber">
              <div className="t">
                PID {b.blockedPid} blocked by {b.blockerPid} for {b.blockedFor}
              </div>
              <div className="s prf-mono">blocked: {b.blockedQuery}</div>
              <div className="s prf-mono">blocker: {b.blockerQuery}</div>
            </div>
          ))}
        </div>
      )}
      <div className="prf-grid c2">
        <div className="prf-card">
          <h3>Table health (size · live/dead tuples · vacuum)</h3>
          <table className="prf-table">
            <thead>
              <tr>
                <th>Table</th>
                <th>Size</th>
                <th>Live</th>
                <th>Dead</th>
                <th>Autovacuum</th>
                <th>Seq/Idx scans</th>
              </tr>
            </thead>
            <tbody>
              {data.tables.map((t, i) => (
                <tr key={i}>
                  <td className="prf-mono">
                    {t.schema}.{t.table}
                  </td>
                  <td>{bytes(t.bytes)}</td>
                  <td>{fmt(t.live)}</td>
                  <td>
                    <Badge c={t.dead > t.live && t.dead > 10000 ? 'warn' : 'ok'} t={fmt(t.dead)} />
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {t.lastAutovacuum
                      ? new Date(t.lastAutovacuum).toLocaleDateString()
                      : t.lastVacuum
                        ? 'manual ' + new Date(t.lastVacuum).toLocaleDateString()
                        : 'never'}
                  </td>
                  <td className="prf-mono">
                    {fmt(t.seqScan)} / {fmt(t.idxScan)}
                    {t.seqScan > Math.max(100, t.idxScan) && (
                      <span className="prf-badge warn" style={{ marginLeft: 4 }}>
                        seq-heavy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prf-card">
          <h3>Index advisor</h3>
          {data.indexAdvisor.seqScanTables.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--mut)',
                  margin: '4px 0 8px',
                }}
              >
                SEQ-SCAN HEAVY TABLES
              </div>
              {data.indexAdvisor.seqScanTables.map((s, i) => (
                <div key={i} className="prf-adv amber">
                  <div className="t">
                    {s.table} — {fmt(s.seqScans)} seq scans reading {fmt(s.seqTupRead)} rows
                  </div>
                  <div className="s">
                    Only {fmt(s.idxScans)} index scans — a filtered index will pay off here.
                  </div>
                  <code>{s.suggestion}</code>
                </div>
              ))}
            </>
          )}
          {data.indexAdvisor.missingFkIndexes.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--mut)',
                  margin: '12px 0 8px',
                }}
              >
                FOREIGN KEYS WITHOUT INDEXES (join + cascade cost)
              </div>
              {data.indexAdvisor.missingFkIndexes.map((f, i) => (
                <div key={i} className="prf-adv">
                  <div className="t">
                    {f.table}.{f.column}
                  </div>
                  <code>{f.suggestion}</code>
                </div>
              ))}
            </>
          )}
          {data.indexAdvisor.unusedIndexes.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--mut)',
                  margin: '12px 0 8px',
                }}
              >
                UNUSED INDEXES (pure write overhead)
              </div>
              {data.indexAdvisor.unusedIndexes.map((u, i) => (
                <div key={i} className="prf-adv">
                  <div className="t">{u.index}</div>
                  <div className="s">
                    {u.schema}.{u.table} · {bytes(u.bytes)} never scanned since stats reset
                  </div>
                </div>
              ))}
            </>
          )}
          {data.indexAdvisor.seqScanTables.length +
            data.indexAdvisor.missingFkIndexes.length +
            data.indexAdvisor.unusedIndexes.length ===
            0 && <Empty t="No index issues detected." />}
        </div>
      </div>
    </>
  );
}

function Queues() {
  const { data, error, loading } = useData(api.getProfilerQueues);
  if (loading) return <Skel />;
  if (error) return <Err e={error} />;
  if (!data) return <Empty />;
  const maxFail = Math.max(...data.queues.map((q) => q.failed || 0), 1);
  return (
    <>
      <div className="prf-grid c4">
        {data.queues.map((q) => {
          const t = q.available && (q.failedUnresolved > 0 || (q.failed || 0) > 0) ? 'warn' : 'ok';
          return (
            <div key={q.name} className={'prf-card prf-kpi ' + (q.available ? t : 'crit')}>
              <i className="stripe" />
              <div className="lbl">{q.name}</div>
              <div className="val">{q.available ? (q.waiting ?? 0) + (q.active ?? 0) : 'DOWN'}</div>
              <div className="sub">
                {q.available
                  ? `waiting ${q.waiting ?? 0} · active ${q.active ?? 0} · delayed ${q.delayed ?? 0} · completed ${fmt(q.completed ?? 0)}`
                  : 'queue unreachable — is Redis up?'}
              </div>
              {q.available && (
                <div style={{ marginTop: 6 }}>
                  <Bar v={q.failed || 0} max={maxFail} c={(q.failed || 0) > 0 ? 'crit' : 'ok'} />
                  <span style={{ fontSize: 11, color: 'var(--mut)' }}>
                    {q.failed ?? 0} failed · {q.failedUnresolved} unresolved
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="prf-card">
        <h3>Scheduler heartbeats (dead-man's switch)</h3>
        {data.heartbeats.length === 0 ? (
          <Empty t="No heartbeats yet — schedulers register on first run." />
        ) : (
          <table className="prf-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Last ran</th>
                <th>Duration</th>
                <th>Items</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.heartbeats.map((h, i) => (
                <tr key={i}>
                  <td className="prf-mono">{h.name}</td>
                  <td>{new Date(h.ranAt).toLocaleString()}</td>
                  <td>{ms(h.durationMs)}</td>
                  <td>{fmt(h.items)}</td>
                  <td>
                    <Badge
                      c={
                        h.error
                          ? 'crit'
                          : Date.now() - new Date(h.ranAt).getTime() > 6 * 36e5
                            ? 'warn'
                            : 'ok'
                      }
                      t={h.error ? 'error' : 'ok'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ fontSize: 11.5, color: 'var(--mut)', marginTop: 8 }}>
          Workers connected: {data.workers}
        </div>
      </div>
    </>
  );
}

function Runtime() {
  const { data, error, loading } = useData(api.getProfilerRuntime, 5000);
  if (loading) return <Skel />;
  if (error) return <Err e={error} />;
  if (!data) return <Empty />;
  const el = data.eventLoopMs || { p50: 0, p95: 0, p99: 0, max: 0 };
  const cpuTotal = (data.cpuUs.user + data.cpuUs.system) / 1e6;
  return (
    <>
      <div className="prf-grid c4">
        <div className={'prf-card prf-kpi ' + tier(el.p99, 25, 100)}>
          <i className="stripe" />
          <div className="lbl">Event loop p99</div>
          <div className="val">{ms(el.p99)}</div>
          <div className="sub">
            p50 {ms(el.p50)} · p95 {ms(el.p95)} · max {ms(el.max)}
          </div>
        </div>
        <div className="prf-card prf-kpi">
          <i className="stripe" />
          <div className="lbl">Heap used</div>
          <div className="val">{data.memoryMb.heapUsed.toFixed(0)} MB</div>
          <div className="sub">
            RSS {data.memoryMb.rss.toFixed(0)} MB · external {data.memoryMb.external.toFixed(0)} MB
          </div>
        </div>
        <div className="prf-card prf-kpi">
          <i className="stripe" />
          <div className="lbl">CPU (process)</div>
          <div className="val">{cpuTotal.toFixed(1)}s</div>
          <div className="sub">
            user {(data.cpuUs.user / 1e6).toFixed(1)}s · system{' '}
            {(data.cpuUs.system / 1e6).toFixed(1)}s
          </div>
        </div>
        <div className="prf-card prf-kpi">
          <i className="stripe" />
          <div className="lbl">Uptime</div>
          <div className="val">{(data.uptimeSec / 3600).toFixed(1)}h</div>
          <div className="sub">
            node {data.node} · pid {data.pid} · handles {data.activeHandles} · load{' '}
            {data.loadAvg.map((l) => l.toFixed(2)).join(' / ')}
          </div>
        </div>
      </div>
      <div className="prf-card">
        <h3>Event loop delay distribution (ms)</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 120 }}>
          {[
            ['p50', el.p50],
            ['p95', el.p95],
            ['p99', el.p99],
            ['max', el.max],
          ].map(([l, v]) => (
            <div key={l} style={{ flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  height: Math.max(4, Math.min(110, v)),
                  background: 'linear-gradient(180deg,#8b5cf6,#3b82f6)',
                  borderRadius: '6px 6px 0 0',
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 4 }}>
                {l}
                <br />
                <b style={{ color: 'var(--ink)' }}>{ms(v)}</b>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Tenants() {
  const { data, error, loading } = useData(api.getProfilerTenants, 30000);
  if (loading) return <Skel />;
  if (error) return <Err e={error} />;
  const ts = data?.tenants || [];
  if (!ts.length)
    return <Empty t="Tenant traffic will appear once the platform serves requests." />;
  const max = ts[0].apiCalls7d || 1;
  return (
    <div className="prf-card">
      <h3>Noisy-neighbor leaderboard (7 days, from real usage metering)</h3>
      <table className="prf-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Hotel</th>
            <th>Plan</th>
            <th style={{ width: 220 }}>API calls</th>
            <th>Share</th>
            <th>Query time</th>
            <th>Slow q</th>
          </tr>
        </thead>
        <tbody>
          {ts.map((t, i) => (
            <tr key={t.tenantId}>
              <td>
                <Badge c={i === 0 ? 'vio' : 'info'} t={String(i + 1)} />
              </td>
              <td>
                <b>{t.name}</b>
                <div className="prf-mono" style={{ fontSize: 10.5, color: 'var(--mut)' }}>
                  {t.slug}
                </div>
              </td>
              <td>
                <Badge
                  c={t.plan === 'enterprise' ? 'vio' : t.plan === 'pro' ? 'info' : 'ok'}
                  t={t.plan}
                />
              </td>
              <td>
                <Bar v={t.apiCalls7d} max={max} c={t.sharePct > 40 ? 'warn' : 'info'} />
              </td>
              <td>{t.sharePct.toFixed(1)}%</td>
              <td>{ms(t.queryTimeMs)}</td>
              <td>{t.slowQueries}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 11.5, color: 'var(--mut)', marginTop: 8 }}>
        Cross-reference with the quotas page before confronting a tenant — high share with an
        enterprise plan is fine; high share on trial is a conversation.
      </div>
    </div>
  );
}

export default function ProfilerPage() {
  const [tab, setTab] = useState('overview');
  return (
    <div className="prf">
      <div className="prf-top">
        <div className="prf-title">
          System Profiler
          <small>
            Queries · endpoints · database · queues · runtime · tenants — real telemetry, no
            fixtures
          </small>
        </div>
      </div>
      <div className="prf-tabs">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            className={'prf-tab' + (tab === k ? ' on' : '')}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="prf-body">
        {tab === 'overview' && <Overview />}
        {tab === 'queries' && <Queries />}
        {tab === 'endpoints' && <Endpoints />}
        {tab === 'database' && <Database />}
        {tab === 'queues' && <Queues />}
        {tab === 'runtime' && <Runtime />}
        {tab === 'tenants' && <Tenants />}
      </div>
    </div>
  );
}
