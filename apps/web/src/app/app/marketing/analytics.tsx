import { useEffect, useMemo, useState } from 'react';
import { getMarketingOverview, type AnalyticsOverview } from '../../../api/marketing';

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: undefined },
];

const CHANNEL_COLORS: Record<string, string> = {
  email: 'bg-sky-100 text-sky-700',
  sms: 'bg-emerald-100 text-emerald-700',
  whatsapp: 'bg-green-100 text-green-700',
  social: 'bg-violet-100 text-violet-700',
  display: 'bg-amber-100 text-amber-700',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
  draft: 'bg-slate-100 text-slate-600',
};

const fmtMoney = (n: number) =>
  `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n: number) => n.toLocaleString('en-ZA');

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Bar({ pct, color = 'bg-emerald-500' }: { pct: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState<number | undefined>(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getMarketingOverview(days)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e?.response?.data?.error?.message ?? e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [days]);

  const maxDevice = useMemo(
    () => Math.max(1, ...(data?.deviceBreakdown.map((d) => d.count) ?? [1])),
    [data]
  );
  const maxChannelConv = useMemo(
    () => Math.max(1, ...(data?.channelBreakdown.map((c) => c.conversions) ?? [1])),
    [data]
  );

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      [
        'Campaign',
        'Channel',
        'Status',
        'Impressions',
        'Clicks',
        'Conversions',
        'CTR %',
        'CVR %',
        'Spend',
        'Revenue',
        'ROI %',
      ],
      ...data.campaignPerformance.map((c) => [
        c.name,
        c.channel,
        c.status,
        c.impressions,
        c.clicks,
        c.conversions,
        c.ctr,
        c.cvr,
        c.spend,
        c.revenue,
        c.roi,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `marketing-campaigns-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Marketing analytics</h1>
          <p className="text-sm text-gray-500">
            Campaign performance across all channels and segments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setDays(r.days)}
                className={`px-3 py-1.5 text-sm ${days === r.days ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            disabled={!data}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load analytics: {error}
        </div>
      )}

      {loading && !data ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading analytics…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
            <KpiCard label="Impressions" value={fmtNum(data.kpis.impressions)} />
            <KpiCard
              label="Clicks"
              value={fmtNum(data.kpis.clicks)}
              sub={`CTR ${data.kpis.ctr}%`}
            />
            <KpiCard
              label="Conversions"
              value={fmtNum(data.kpis.conversions)}
              sub={`CVR ${data.kpis.cvr}%`}
            />
            <KpiCard
              label="Spend"
              value={fmtMoney(data.kpis.spend)}
              sub={`Budget ${fmtMoney(data.kpis.budget)}`}
            />
            <KpiCard label="Revenue" value={fmtMoney(data.kpis.revenue)} />
            <KpiCard
              label="ROI"
              value={`${data.kpis.roi}%`}
              accent={data.kpis.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />
            <KpiCard
              label="Active campaigns"
              value={String(data.kpis.activeCampaigns)}
              sub={`of ${data.kpis.campaigns} total`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Campaign performance */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">Campaign performance</h2>
              </div>
              {data.campaignPerformance.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-400">
                  No campaigns in this period. Create a campaign from a template to get started.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-2">Campaign</th>
                      <th className="px-2 py-2 text-right">Impr.</th>
                      <th className="px-2 py-2 text-right">Clicks</th>
                      <th className="px-2 py-2 text-right">Conv.</th>
                      <th className="px-2 py-2 text-right">Spend</th>
                      <th className="px-2 py-2 text-right">Revenue</th>
                      <th className="px-4 py-2 text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaignPerformance.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-900">{c.name}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CHANNEL_COLORS[c.channel] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                              {c.channel}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[c.status] ?? ''}`}
                            >
                              {c.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right text-gray-600">
                          {fmtNum(c.impressions)}
                        </td>
                        <td className="px-2 py-2.5 text-right text-gray-600">{fmtNum(c.clicks)}</td>
                        <td className="px-2 py-2.5 text-right text-gray-600">
                          {fmtNum(c.conversions)}
                        </td>
                        <td className="px-2 py-2.5 text-right text-gray-600">
                          {fmtMoney(c.spend)}
                        </td>
                        <td className="px-2 py-2.5 text-right text-gray-600">
                          {fmtMoney(c.revenue)}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold ${c.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          {c.roi}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="space-y-4">
              {/* Device breakdown */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">Device breakdown</h2>
                {data.deviceBreakdown.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">
                    No events in this period.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {data.deviceBreakdown.map((d) => (
                      <div key={d.device}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium capitalize text-gray-700">{d.device}</span>
                          <span className="text-gray-400">
                            {fmtNum(d.count)} · {d.pct}%
                          </span>
                        </div>
                        <Bar pct={(d.count / maxDevice) * 100} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top segments */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">Top converting segments</h2>
                {data.topSegments.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">
                    No segment conversions in this period.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {data.topSegments.map((s, i) => (
                      <div key={s.id ?? i} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">
                            {fmtNum(s.conversions)} conversions · {s.cvr}% CVR
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Channel breakdown */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">Conversions by channel</h2>
                {data.channelBreakdown.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">No data.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {data.channelBreakdown.map((c) => (
                      <div key={c.channel}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium capitalize text-gray-700">{c.channel}</span>
                          <span className="text-gray-400">
                            {fmtNum(c.conversions)} conv. · ROI {c.roi}%
                          </span>
                        </div>
                        <Bar pct={(c.conversions / maxChannelConv) * 100} color="bg-sky-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
