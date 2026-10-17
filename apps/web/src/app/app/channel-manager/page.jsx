import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Plus,
  X,
  Check,
  AlertCircle,
  Globe,
  Unplug,
  CalendarCheck,
  Tag,
  ArrowLeftRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '../../../components/ui/input';
import { channelApi, CHANNEL_PROVIDERS } from '../../../api/channel';
import { apiGet } from '../../../api/client';

const STATUS_STYLES = {
  active: 'bg-accent/10 text-accent border-accent/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-danger/10 text-danger border-danger/20',
  disconnected: 'bg-surface-elevated text-text-secondary border-border',
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('en-GB') : '—');
const errMsg = (e) => e?.response?.data?.error?.message || e?.message || 'Request failed';

export default function ChannelManagerPage() {
  const [status, setStatus] = useState(null);
  const [connections, setConnections] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(''); // connection id + action, disables dup clicks

  const [showConnect, setShowConnect] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState(null);

  const flash = (kind, text) => {
    setNotice({ kind, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, list, propsRes] = await Promise.all([
        channelApi.status(),
        channelApi.list(),
        apiGet('/properties?pageSize=100'),
      ]);
      setStatus(s);
      setConnections(list || []);
      setProperties(propsRes?.data || propsRes || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key, fn, successText) => {
    setBusy(key);
    try {
      await fn();
      if (successText) flash('success', successText);
      await load();
    } catch (e) {
      flash('error', errMsg(e));
    } finally {
      setBusy('');
    }
  };

  const stats = status?.stats || { totalConnections: 0, active: 0, syncing: 0, failed: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Channel Manager</h1>
          <p className="text-sm text-text-secondary">
            Connect OTAs and push availability, rates and reservations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAvailability(true)}
            disabled={properties.length === 0}
          >
            <CalendarCheck className="mr-1.5 h-4 w-4" /> Push Availability
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRates(true)}
            disabled={properties.length === 0}
          >
            <Tag className="mr-1.5 h-4 w-4" /> Push Rates
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              run('sync-all', () => channelApi.syncReservations(), 'Reservation sync started')
            }
            disabled={Boolean(busy)}
          >
            <ArrowLeftRight className="mr-1.5 h-4 w-4" /> Sync Reservations
          </Button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm',
            notice.kind === 'success'
              ? 'border-accent/20 bg-accent/5 text-accent'
              : 'border-danger/20 bg-danger/5 text-danger'
          )}
        >
          {notice.kind === 'success' ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {notice.text}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Connections</p>
          <p className="mt-1 text-xl font-bold font-mono text-text-primary">
            {stats.totalConnections}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Active</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold font-mono text-accent">
            <Wifi className="h-4 w-4" /> {stats.active}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Syncing</p>
          <p className="mt-1 text-xl font-bold font-mono text-warning">{stats.syncing}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Failed / Error</p>
          <p className="mt-1 flex items-center gap-1.5 text-xl font-bold font-mono text-danger">
            <WifiOff className="h-4 w-4" /> {stats.failed}
          </p>
        </div>
      </div>

      {/* Connections table */}
      <div className="rounded-xl border border-border bg-background shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text-primary">Connected Channels</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowConnect(true)}
            disabled={properties.length === 0}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Connect Channel
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Hotel ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
                  Last Sync
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-text-muted">
                    Loading channels…
                  </td>
                </tr>
              ) : connections.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-text-muted">
                    <Globe className="mx-auto h-10 w-10 mb-3" />
                    <p>No channel connections yet. Connect your first OTA.</p>
                  </td>
                </tr>
              ) : (
                connections.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary capitalize">{c.provider}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{c.hotelId}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {c.property?.name || c.propertyId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                          STATUS_STYLES[c.status] || STATUS_STYLES.pending
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      <div>{fmtDate(c.lastSyncAt)}</div>
                      {c.lastSyncStatus && (
                        <div
                          className={cn(
                            'text-[10px]',
                            c.lastSyncStatus === 'success' ? 'text-accent' : 'text-danger'
                          )}
                        >
                          {c.lastSyncStatus}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={Boolean(busy)}
                          onClick={() =>
                            run(
                              `sync-${c.id}`,
                              () => channelApi.syncReservations(c.id),
                              `Sync started for ${c.provider}`
                            )
                          }
                        >
                          <ArrowLeftRight className="mr-1 h-3.5 w-3.5" /> Sync
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-danger"
                          disabled={Boolean(busy)}
                          onClick={() => setDisconnectTarget(c)}
                        >
                          <Unplug className="mr-1 h-3.5 w-3.5" /> Disconnect
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showConnect && (
        <ConnectModal
          properties={properties}
          onClose={() => setShowConnect(false)}
          onConnect={async (input) => {
            await run('connect', () => channelApi.connect(input), 'Channel connected');
            setShowConnect(false);
          }}
          busy={Boolean(busy)}
        />
      )}
      {showAvailability && (
        <PushModal
          kind="availability"
          properties={properties}
          onClose={() => setShowAvailability(false)}
          onPush={async (input) => {
            await run(
              'push-avail',
              () => channelApi.pushAvailability(input),
              'Availability pushed'
            );
            setShowAvailability(false);
          }}
          busy={Boolean(busy)}
        />
      )}
      {showRates && (
        <PushModal
          kind="rates"
          properties={properties}
          onClose={() => setShowRates(false)}
          onPush={async (input) => {
            await run('push-rates', () => channelApi.pushRates(input), 'Rates pushed');
            setShowRates(false);
          }}
          busy={Boolean(busy)}
        />
      )}
      {disconnectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl">
            <h3 className="text-lg font-bold text-text-primary">
              Disconnect {disconnectTarget.provider}?
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Availability and rates will stop syncing. Reservations already imported are kept.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDisconnectTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-danger border-danger/30 hover:bg-danger/10"
                disabled={Boolean(busy)}
                onClick={async () => {
                  const target = disconnectTarget;
                  setDisconnectTarget(null);
                  await run(
                    `disc-${target.id}`,
                    () => channelApi.disconnect(target.id),
                    'Channel disconnected'
                  );
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Connect Modal — payload matches channelConnectSchema ─── */
function ConnectModal({ properties, onClose, onConnect, busy }) {
  const [provider, setProvider] = useState('bookingcom');
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [hotelId, setHotelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Connect Channel</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await onConnect({
                propertyId,
                provider,
                credentials: {
                  apiKey: apiKey.trim(),
                  apiSecret: apiSecret.trim() || undefined,
                  hotelId: hotelId.trim(),
                  endpoint: endpoint.trim() || undefined,
                },
              });
            } catch (err) {
              setError(errMsg(err));
            }
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Property *
            </label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select a property
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CHANNEL_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Hotel ID *
            </label>
            <Input
              required
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              placeholder="e.g. DEMO-HOTEL-001"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              API Key *
            </label>
            <Input
              required
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              API Secret
            </label>
            <Input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Endpoint URL
            </label>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://…"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={busy}>
              <Check className="mr-1.5 h-4 w-4" /> Connect
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Push Modal — payload matches availabilityPushSchema / ratesPushSchema ─── */
function PushModal({ kind, properties, onClose, onPush, busy }) {
  const today = new Date().toISOString().slice(0, 10);
  const defEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(defEnd);
  const [codes, setCodes] = useState(''); // comma-separated roomTypeIds or ratePlanIds
  const [error, setError] = useState('');
  const isAvailability = kind === 'availability';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">
            {isAvailability ? 'Push Availability' : 'Push Rates'}
          </h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            const list = codes
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            try {
              await onPush({
                propertyId,
                dateFrom,
                dateTo,
                ...(list.length > 0
                  ? isAvailability
                    ? { roomTypes: list }
                    : { ratePlans: list }
                  : {}),
              });
            } catch (err) {
              setError(errMsg(err));
            }
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Property *
            </label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select a property
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                From *
              </label>
              <input
                type="date"
                required
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
                To *
              </label>
              <input
                type="date"
                required
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">
              {isAvailability ? 'Room Type IDs' : 'Rate Plan IDs'} (optional)
            </label>
            <Input
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              placeholder="Comma-separated; blank = all"
            />
            <p className="mt-1 text-[10px] text-text-muted">
              Blank pushes everything for the date range to all connected channels.
            </p>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" disabled={busy}>
              <Check className="mr-1.5 h-4 w-4" /> Push
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
