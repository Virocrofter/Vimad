import { useState } from 'react';
import {
  useChainBoard,
  useChainGuestView,
  useChainGuests,
  useChainLoyaltyActions,
  useChainLoyaltyConfig,
  useChainProperties,
} from '../../../hooks/useChainLoyalty';
import './chain-loyalty.css';

const zar = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });

const errMsg = (e) =>
  e?.response?.data?.error?.message ||
  e?.message ||
  (typeof e === 'string' ? e : 'Something went wrong');

const TABS = [
  ['board', 'Chain Board'],
  ['post', 'Earn / Redeem'],
  ['guest', 'Guest View'],
  ['config', 'Config'],
];

export default function ChainLoyaltyPage() {
  const [tab, setTab] = useState('board');
  return (
    <div className="cl-wrap">
      <div className="cl-head">
        <div>
          <h1>Chain Loyalty</h1>
          <p className="cl-sub">
            Points and status are valid at any chain property — earn at Umhlanga, redeem at Ballito.
          </p>
        </div>
      </div>
      <div className="cl-tabs">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={tab === k ? 'cl-tab cl-tab-active' : 'cl-tab'}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'board' && <BoardTab />}
      {tab === 'post' && <PostTab />}
      {tab === 'guest' && <GuestTab />}
      {tab === 'config' && <ConfigTab />}
    </div>
  );
}

/* ─── Board ─── */

function BoardTab() {
  const { data } = useChainBoard();
  if (!data) return <div className="cl-card">Loading…</div>;

  const maxTier = Math.max(1, ...data.tierDistribution.map((t) => t.count));
  const maxProp = Math.max(1, ...data.byProperty.map((p) => p.earned));

  return (
    <div className="cl-grid">
      <div className="cl-stats">
        <div className="cl-stat">
          <div className="cl-stat-num">{data.members}</div>
          <div className="cl-stat-label">Members with points</div>
        </div>
        <div className="cl-stat">
          <div className="cl-stat-num">{data.liability.toLocaleString()}</div>
          <div className="cl-stat-label">Points liability</div>
        </div>
        <div className="cl-stat">
          <div className="cl-stat-num">{zar.format(data.earned30d)}</div>
          <div className="cl-stat-label">Earned · 30d</div>
        </div>
        <div className="cl-stat">
          <div className="cl-stat-num">{zar.format(data.redeemed30d)}</div>
          <div className="cl-stat-label">Redeemed · 30d</div>
        </div>
      </div>

      <div className="cl-card">
        <div className="cl-card-title">Tier distribution (chain-wide)</div>
        {data.tierDistribution.map((t) => (
          <div key={t.tier} className="cl-bar-row">
            <span className="cl-bar-label">{t.tier}</span>
            <div className="cl-bar-track">
              <div
                className={`cl-bar-fill ${t.tier === 'member' ? 'cl-bar-muted' : ''}`}
                style={{ width: `${(t.count / maxTier) * 100}%` }}
              />
            </div>
            <span className="cl-bar-count">{t.count}</span>
          </div>
        ))}
        <p className="cl-hint">
          A guest&apos;s tier follows them to every property — front desk sees the same status at
          any site.
        </p>
      </div>

      <div className="cl-card">
        <div className="cl-card-title">Activity by property</div>
        {data.byProperty.length === 0 && (
          <p className="cl-hint">No property-stamped activity yet.</p>
        )}
        {data.byProperty.length > 0 && (
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Points earned</th>
                  <th>Points redeemed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.byProperty.map((p) => (
                  <tr key={p.property}>
                    <td>{p.property}</td>
                    <td>{p.earned.toLocaleString()}</td>
                    <td>{p.redeemed.toLocaleString()}</td>
                    <td>
                      <div className="cl-mini-track">
                        <div
                          className="cl-mini-fill"
                          style={{ width: `${(p.earned / maxProp) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="cl-card">
        <div className="cl-card-title">Top members</div>
        <div className="cl-table-wrap">
          <table className="cl-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Tier</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {data.topGuests.map((g) => (
                <tr key={g.id}>
                  <td>
                    {g.firstName} {g.lastName}
                  </td>
                  <td>
                    <span className={`cl-tier cl-tier-${g.tier}`}>{g.tier}</span>
                  </td>
                  <td>{g.loyaltyPoints.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Earn / Redeem ─── */

function PostTab() {
  const { data: guests } = useChainGuests();
  const { data: properties } = useChainProperties();
  const { data: config } = useChainLoyaltyConfig();
  const { earn, redeem } = useChainLoyaltyActions();

  const [mode, setMode] = useState('earn');
  const [guestId, setGuestId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);

  const num = Number(amount);
  const preview =
    mode === 'earn'
      ? config && num > 0
        ? Math.floor(num * config.earnRate)
        : null
      : num > 0
        ? Math.floor(num)
        : null;

  const run = async () => {
    setResult(null);
    try {
      const base = {
        guestId,
        propertyId: propertyId || undefined,
        description: description || undefined,
      };
      const r =
        mode === 'earn'
          ? await earn.mutateAsync({ ...base, amount: num })
          : await redeem.mutateAsync({ ...base, points: num });
      setResult(r);
      setAmount('');
      setDescription('');
    } catch (e) {
      alert(errMsg(e));
    }
  };

  return (
    <div className="cl-grid">
      <div className="cl-card">
        <div className="cl-card-title">Post at any chain property</div>
        <div className="cl-mode">
          <button
            type="button"
            className={mode === 'earn' ? 'cl-tab cl-tab-active' : 'cl-tab'}
            onClick={() => setMode('earn')}
          >
            Earn
          </button>
          <button
            type="button"
            className={mode === 'redeem' ? 'cl-tab cl-tab-active' : 'cl-tab'}
            onClick={() => setMode('redeem')}
          >
            Redeem
          </button>
        </div>
        <label className="cl-label">Guest</label>
        <select className="cl-input" value={guestId} onChange={(e) => setGuestId(e.target.value)}>
          <option value="">Select…</option>
          {(guests ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.firstName} {g.lastName}
              {g.email ? ` · ${g.email}` : ''}
            </option>
          ))}
        </select>
        <label className="cl-label">Property (optional — stamps the transaction)</label>
        <select
          className="cl-input"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          <option value="">Chain-wide</option>
          {(properties ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
        <label className="cl-label">
          {mode === 'earn' ? 'Spend amount (ZAR)' : 'Points to redeem'}
        </label>
        <input
          className="cl-input"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={mode === 'earn' ? 'e.g. 1890.00' : 'e.g. 500'}
        />
        {preview !== null && (
          <p className="cl-hint">
            {mode === 'earn'
              ? `≈ ${preview} points at ${config?.earnRate} pt per R1`
              : config
                ? `≈ ${zar.format(preview * config.redeemValue)} value at ${zar.format(config.redeemValue)} per point`
                : ''}
          </p>
        )}
        <label className="cl-label">Description (optional)</label>
        <input
          className="cl-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={mode === 'earn' ? 'e.g. Spa + dinner folio' : 'e.g. Room upgrade'}
        />
        <div className="cl-row">
          <button
            type="button"
            className="cl-btn cl-btn-primary"
            disabled={!guestId || !(num > 0) || earn.isPending || redeem.isPending}
            onClick={run}
          >
            {earn.isPending || redeem.isPending
              ? 'Posting…'
              : mode === 'earn'
                ? 'Post earn'
                : 'Post redeem'}
          </button>
        </div>
      </div>

      {result && (
        <div className="cl-card">
          <div className="cl-card-title">Posted</div>
          <div className="cl-banner cl-banner-ok">
            {result.transaction.amount > 0 ? '+' : ''}
            {result.transaction.amount} pts · new balance {result.balance.toLocaleString()} · tier{' '}
            <span className={`cl-tier cl-tier-${result.tier}`}>{result.tier}</span>
            {result.valueRedeemed ? ` · ${zar.format(result.valueRedeemed)} value redeemed` : ''}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Guest view ─── */

function GuestTab() {
  const { data: guests } = useChainGuests();
  const [guestId, setGuestId] = useState('');
  const { data } = useChainGuestView(guestId);

  return (
    <div className="cl-grid">
      <div className="cl-card">
        <div className="cl-card-title">Guest chain profile</div>
        <label className="cl-label">Guest</label>
        <select className="cl-input" value={guestId} onChange={(e) => setGuestId(e.target.value)}>
          <option value="">Select…</option>
          {(guests ?? []).map((g) => (
            <option key={g.id} value={g.id}>
              {g.firstName} {g.lastName}
            </option>
          ))}
        </select>
      </div>

      {data && (
        <div className="cl-card">
          <div className="cl-hero">
            <div>
              <div className="cl-hero-name">{data.guest.name}</div>
              <div className="cl-hint">{data.guest.email}</div>
            </div>
            <div className="cl-hero-side">
              <span className={`cl-tier cl-tier-${data.guest.tier}`}>{data.guest.tier}</span>
              <div className="cl-hero-points">{data.guest.points.toLocaleString()} pts</div>
              <div className="cl-hint">≈ {zar.format(data.guest.tierValue)} redeemable</div>
            </div>
          </div>
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Balance</th>
                  <th>Property</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`cl-badge-${t.type}`}>{t.type}</span>
                    </td>
                    <td className={t.points < 0 ? 'cl-neg' : 'cl-pos'}>
                      {t.points > 0 ? `+${t.points}` : t.points}
                    </td>
                    <td>{t.balance.toLocaleString()}</td>
                    <td>{t.property ?? 'Chain-wide'}</td>
                    <td>{t.description}</td>
                  </tr>
                ))}
                {data.transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="cl-hint">
                      No chain transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Config ─── */

function ConfigTab() {
  const { data: config } = useChainLoyaltyConfig();
  const { saveConfig } = useChainLoyaltyActions();
  const [earnRate, setEarnRate] = useState('');
  const [redeemValue, setRedeemValue] = useState('');
  const [tiers, setTiers] = useState([]);
  const [saved, setSaved] = useState(false);

  // hydrate from server once
  const [hydrated, setHydrated] = useState(false);
  if (config && !hydrated) {
    setEarnRate(String(config.earnRate));
    setRedeemValue(String(config.redeemValue));
    setTiers(config.tiers.map((t) => ({ ...t })));
    setHydrated(true);
  }

  const run = async () => {
    setSaved(false);
    try {
      await saveConfig.mutateAsync({
        earnRate: Number(earnRate),
        redeemValue: Number(redeemValue),
        tiers: tiers.map((t) => ({ name: t.name, threshold: Number(t.threshold) })),
      });
      setSaved(true);
    } catch (e) {
      alert(errMsg(e));
    }
  };

  return (
    <div className="cl-grid">
      <div className="cl-card">
        <div className="cl-card-title">Chain loyalty config</div>
        <label className="cl-label">Earn rate — points per R1 spent</label>
        <input
          className="cl-input"
          inputMode="decimal"
          value={earnRate}
          onChange={(e) => setEarnRate(e.target.value)}
        />
        <label className="cl-label">Redeem value — rand per point</label>
        <input
          className="cl-input"
          inputMode="decimal"
          value={redeemValue}
          onChange={(e) => setRedeemValue(e.target.value)}
        />
        <label className="cl-label">Tiers (threshold = lifetime points)</label>
        {tiers.map((t, i) => (
          <div key={i} className="cl-row">
            <input
              className="cl-input cl-input-sm"
              value={t.name}
              onChange={(e) =>
                setTiers(tiers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
              }
            />
            <input
              className="cl-input cl-input-sm"
              inputMode="numeric"
              value={t.threshold}
              onChange={(e) =>
                setTiers(tiers.map((x, j) => (j === i ? { ...x, threshold: e.target.value } : x)))
              }
            />
            <button
              type="button"
              className="cl-btn cl-btn-danger cl-btn-xs"
              onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          </div>
        ))}
        <div className="cl-row">
          <button
            type="button"
            className="cl-btn cl-btn-ghost"
            onClick={() => setTiers([...tiers, { name: `tier${tiers.length + 1}`, threshold: 0 }])}
          >
            Add tier
          </button>
        </div>
        <div className="cl-row">
          <button
            type="button"
            className="cl-btn cl-btn-primary"
            disabled={saveConfig.isPending}
            onClick={run}
          >
            {saveConfig.isPending ? 'Saving…' : 'Save config'}
          </button>
        </div>
        {saved && <div className="cl-banner cl-banner-ok">Config saved — applies chain-wide.</div>}
      </div>
    </div>
  );
}
