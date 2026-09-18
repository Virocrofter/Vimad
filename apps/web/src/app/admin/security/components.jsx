/* src/app/admin/security/components.jsx */
import { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Globe,
  Server,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Ban,
  Play,
  Pause,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Smartphone,
  Plane,
  Moon,
  ArrowUp,
  Download,
  Hammer,
  Key,
  Wifi,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  X,
  UserCheck,
  UserX,
  Settings,
  Info,
  Zap,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '@/components/ui/button';
import {
  threatSeverityMeta,
  alertStatusMeta,
  threatLevelMeta,
  activityTypeMeta,
  countryMeta,
  timeAgo,
  formatNumber,
} from './data';

/* ─── Security Stat Card ─── */
export function SecurityStatCard({ label, value, subtext, icon: Icon, color, trend, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-border bg-surface p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-secondary/30'
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
          <p className={cn('mt-1 text-2xl font-bold font-mono', color)}>{value}</p>
          {subtext && <p className="mt-0.5 text-xs text-text-muted">{subtext}</p>}
          {trend !== undefined && (
            <p
              className={cn('mt-1 text-xs font-medium', trend >= 0 ? 'text-accent' : 'text-danger')}
            >
              {trend >= 0 ? '+' : ''}
              {trend}% vs last week
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5',
            color
              .replace('text-', 'bg-')
              .replace('danger', 'danger/10')
              .replace('accent', 'accent/10')
              .replace('warning', 'warning/10')
              .replace('info', 'info/10')
              .replace('secondary', 'secondary/10')
          )}
        >
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Threat Level Indicator ─── */
export function ThreatLevelIndicator({ level }) {
  const meta = threatLevelMeta[level] || threatLevelMeta.normal;
  const icons = {
    low: ShieldCheck,
    normal: Shield,
    elevated: AlertTriangle,
    critical: ShieldAlert,
  };
  const Icon = icons[level] || Shield;

  return (
    <div className={cn('rounded-xl border p-4 flex items-center gap-4', meta.bg, meta.border)}>
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full bg-background',
          meta.color
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className={cn('text-lg font-bold', meta.color)}>{meta.label}</p>
        <p className="text-xs text-text-secondary">
          {level === 'critical'
            ? 'Immediate action required. Multiple active threats detected.'
            : level === 'elevated'
              ? 'Increased vigilance recommended. Review open alerts.'
              : level === 'normal'
                ? 'Standard security posture. No immediate concerns.'
                : 'Minimal threat activity. All systems nominal.'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-text-muted">Last Scan</p>
        <p className="text-sm font-mono text-text-primary">{timeAgo('2026-08-16 23:00:00')}</p>
      </div>
    </div>
  );
}

/* ─── Severity Badge ─── */
export function SeverityBadge({ severity }) {
  const meta = threatSeverityMeta[severity] || threatSeverityMeta.info;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        meta.class
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ─── Alert Status Badge ─── */
export function AlertStatusBadge({ status }) {
  const meta = alertStatusMeta[status] || alertStatusMeta.open;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
        meta.class
      )}
    >
      {status === 'open' && <AlertTriangle className="h-3 w-3" />}
      {status === 'investigating' && <Clock className="h-3 w-3" />}
      {status === 'resolved' && <CheckCircle2 className="h-3 w-3" />}
      {meta.label}
    </span>
  );
}

/* ─── Activity Type Badge ─── */
export function ActivityTypeBadge({ type }) {
  const meta = activityTypeMeta[type] || { label: type, icon: Activity };
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary capitalize">
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

/* ─── Country Badge ─── */
export function CountryBadge({ code }) {
  const meta = countryMeta[code] || { flag: '🌐', name: code };
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
      <span>{meta.flag}</span>
      {meta.name}
    </span>
  );
}

/* ─── Failed Login Row ─── */
export function FailedLoginRow({ entry, expanded, onToggle, onBlock }) {
  const meta = threatSeverityMeta[entry.risk] || threatSeverityMeta.info;

  return (
    <>
      <tr
        className={cn(
          'hover:bg-background/50 transition-colors cursor-pointer',
          entry.risk === 'critical' && 'bg-danger/5'
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="font-mono text-xs text-text-muted">{entry.id}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <CountryBadge code={entry.country} />
            <span className="text-sm text-text-primary">{entry.location}</span>
          </div>
        </td>
        <td className="px-4 py-3 font-mono text-xs text-text-secondary">{entry.ip}</td>
        <td className="px-4 py-3">
          <SeverityBadge severity={entry.risk} />
        </td>
        <td className="px-4 py-3 text-sm font-mono font-medium text-text-primary">
          {entry.attempts}
        </td>
        <td className="px-4 py-3 text-xs text-text-secondary">{timeAgo(entry.lastAttempt)}</td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBlock(entry.ip);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
            title="Block IP"
          >
            <Ban className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 py-4 bg-background/50">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-muted">Attack Type</p>
                  <p className="font-medium text-text-primary capitalize">
                    {entry.type.replace('-', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Target Account</p>
                  <p className="font-mono text-text-primary">{entry.target}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">User Agent</p>
                  <p className="text-xs text-text-secondary truncate">{entry.userAgent}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => onBlock(entry.ip)}>
                  <Ban className="mr-1.5 h-3.5 w-3.5" /> Block IP
                </Button>
                <Button size="sm" variant="outline">
                  <Shield className="mr-1.5 h-3.5 w-3.5" /> Add to Watchlist
                </Button>
                <Button size="sm" variant="ghost" className="text-text-muted">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> WHOIS Lookup
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── Suspicious Activity Row ─── */
export function SuspiciousActivityRow({ entry, expanded, onToggle, onAcknowledge, onInvestigate }) {
  const isOpen = entry.status === 'open';

  return (
    <>
      <tr
        className={cn(
          'hover:bg-background/50 transition-colors cursor-pointer',
          isOpen && 'bg-danger/5'
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button className="text-text-muted hover:text-text-primary">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="font-mono text-xs text-text-muted">{entry.id}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <ActivityTypeBadge type={entry.type} />
        </td>
        <td className="px-4 py-3">
          <SeverityBadge severity={entry.severity} />
        </td>
        <td className="px-4 py-3 text-sm font-medium text-text-primary">{entry.title}</td>
        <td className="px-4 py-3 text-xs text-text-secondary">{entry.user}</td>
        <td className="px-4 py-3 text-xs text-text-secondary">{timeAgo(entry.timestamp)}</td>
        <td className="px-4 py-3">
          <AlertStatusBadge status={entry.status} />
        </td>
        <td className="px-4 py-3 text-right">
          {entry.status === 'open' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInvestigate(entry.id);
              }}
              className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-white hover:bg-secondary/90"
            >
              Investigate
            </button>
          )}
          {entry.status === 'investigating' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(entry.id);
              }}
              className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent/90"
            >
              Resolve
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="px-4 py-4 bg-background/50">
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <p className="text-sm text-text-secondary">{entry.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-muted">IP Address(es)</p>
                  <p className="font-mono text-text-primary">{entry.ip}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Location(s)</p>
                  <div className="flex flex-wrap gap-1">
                    {entry.locations.map((loc) => (
                      <span
                        key={loc}
                        className="inline-flex items-center gap-1 text-xs text-text-secondary"
                      >
                        <MapPin className="h-3 w-3" /> {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {entry.resolution && (
                <div className="rounded-md bg-accent/5 border border-accent/20 p-2">
                  <p className="text-xs text-accent">
                    <CheckCircle2 className="inline h-3 w-3 mr-1" />
                    {entry.resolution}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                {entry.status === 'open' && (
                  <>
                    <Button size="sm" onClick={() => onInvestigate(entry.id)}>
                      <Shield className="mr-1.5 h-3.5 w-3.5" /> Start Investigation
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onAcknowledge(entry.id)}>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Mark Resolved
                    </Button>
                  </>
                )}
                {entry.status === 'investigating' && (
                  <Button size="sm" onClick={() => onAcknowledge(entry.id)}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Confirm Resolved
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10">
                  <Ban className="mr-1.5 h-3.5 w-3.5" /> Dismiss
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ─── 2FA Policy Card ─── */
export function TwoFAPolicyCard({ policy, onToggle, onEdit }) {
  const complianceColor =
    policy.complianceRate >= 95
      ? 'text-accent'
      : policy.complianceRate >= 80
        ? 'text-warning'
        : 'text-danger';
  const complianceBar =
    policy.complianceRate >= 95
      ? 'bg-accent'
      : policy.complianceRate >= 80
        ? 'bg-warning'
        : 'bg-danger';

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              policy.enforced ? 'bg-accent/10' : 'bg-neutral/10'
            )}
          >
            {policy.enforced ? (
              <Lock className="h-4 w-4 text-accent" />
            ) : (
              <Unlock className="h-4 w-4 text-text-muted" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{policy.name}</h3>
            <p className="text-[10px] text-text-muted">
              {policy.id} · {policy.scope} scope
            </p>
          </div>
        </div>
        <button
          onClick={() => onToggle(policy.id)}
          className={cn(
            'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
            policy.enforced ? 'bg-accent' : 'bg-border'
          )}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
              policy.enforced ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Target</span>
          <span className="text-text-secondary capitalize">
            {Array.isArray(policy.target) ? policy.target.join(', ') : policy.target}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Method</span>
          <span className="text-text-secondary uppercase">{policy.method}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Grace Period</span>
          <span className="text-text-secondary">{policy.gracePeriodDays} days</span>
        </div>
      </div>

      {/* Compliance Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">Compliance</span>
          <span className={cn('text-xs font-mono font-medium', complianceColor)}>
            {policy.complianceRate}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', complianceBar)}
            style={{ width: `${policy.complianceRate}%` }}
          />
        </div>
      </div>

      {policy.exemptUsers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-text-muted mb-1">
            Exemptions ({policy.exemptUsers.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {policy.exemptUsers.map((u) => (
              <span
                key={u}
                className="rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary truncate max-w-[150px]"
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(policy)}>
          <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Enroll Users
        </Button>
      </div>
    </div>
  );
}

/* ─── IP Allowlist Card ─── */
export function IPAllowlistCard({ entry, onToggle, onDelete }) {
  const isActive = entry.status === 'active';

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all hover:shadow-md',
        isActive ? 'border-border bg-surface' : 'border-dashed border-border bg-background/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              isActive ? 'bg-secondary/10' : 'bg-neutral/10'
            )}
          >
            <Server className={cn('h-4 w-4', isActive ? 'text-secondary' : 'text-text-muted')} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">{entry.name}</h3>
            <p className="font-mono text-[10px] text-text-muted">{entry.ip}</p>
            <p className="text-[10px] text-text-muted">{entry.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(entry.id)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              isActive ? 'bg-accent' : 'bg-border'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                isActive ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-text-muted">Type</p>
          <p className="text-text-secondary capitalize">{entry.type}</p>
        </div>
        <div>
          <p className="text-text-muted">Hits</p>
          <p className="font-mono text-text-primary">{formatNumber(entry.hitCount)}</p>
        </div>
        <div>
          <p className="text-text-muted">Last Used</p>
          <p className="text-text-secondary">{timeAgo(entry.lastUsed)}</p>
        </div>
      </div>

      {entry.tenant && (
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-background border border-border px-2 py-0.5 text-[10px] text-text-secondary">
            Tenant: {entry.tenant}
          </span>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-text-muted hover:text-text-primary flex-1"
        >
          <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-danger hover:bg-danger/10 flex-1"
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
        </Button>
      </div>
    </div>
  );
}

/* ─── Simple World Map (SVG-based, no external deps) ─── */
export function SimpleWorldMap({ markers, onMarkerClick }) {
  // Simplified world map using a basic projection
  // This is a stylized representation for the security dashboard
  const width = 800;
  const height = 400;

  // Simple equirectangular projection
  const project = (lat, lng) => ({
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  });

  // World map outline (simplified continents as paths)
  const continents = [
    // North America
    'M120,80 L180,60 L220,70 L240,100 L230,140 L200,150 L160,140 L130,120 L110,100 Z',
    // South America
    'M200,180 L230,170 L250,200 L240,260 L220,300 L200,280 L190,240 L195,200 Z',
    // Europe
    'M380,70 L420,60 L450,70 L460,100 L440,110 L410,105 L390,95 L380,80 Z',
    // Africa
    'M380,130 L420,120 L450,140 L460,180 L450,230 L420,250 L390,240 L380,200 L375,160 Z',
    // Asia
    'M460,60 L520,50 L580,60 L620,80 L640,120 L620,150 L580,160 L540,150 L500,140 L480,120 L470,90 Z',
    // Australia
    'M580,240 L620,230 L640,250 L630,280 L600,290 L580,270 Z',
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border bg-surface">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        {/* Ocean background */}
        <rect width={width} height={height} fill="#0f172a" />

        {/* Grid lines */}
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 50}
            x2={width}
            y2={i * 50}
            stroke="#1e293b"
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: 17 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 50}
            y1="0"
            x2={i * 50}
            y2={height}
            stroke="#1e293b"
            strokeWidth="0.5"
          />
        ))}

        {/* Continents */}
        {continents.map((d, i) => (
          <path key={i} d={d} fill="#1e293b" stroke="#334155" strokeWidth="1" />
        ))}

        {/* Markers */}
        {markers.map((marker, i) => {
          const pos = project(marker.lat, marker.lng);
          const meta = threatSeverityMeta[marker.risk] || threatSeverityMeta.info;
          const radius = Math.min(20, 4 + marker.attempts / 5);

          return (
            <g key={marker.id} className="cursor-pointer" onClick={() => onMarkerClick?.(marker)}>
              {/* Pulse effect for critical/high */}
              {(marker.risk === 'critical' || marker.risk === 'high') && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 8}
                  fill="none"
                  stroke={meta.dot.replace('bg-', '') === 'danger' ? '#ef4444' : '#f59e0b'}
                  strokeWidth="1"
                  opacity="0.3"
                >
                  <animate
                    attributeName="r"
                    values={`${radius + 4};${radius + 12};${radius + 4}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={
                  meta.dot.replace('bg-', '') === 'danger'
                    ? '#ef4444'
                    : meta.dot.replace('bg-', '') === 'warning'
                      ? '#f59e0b'
                      : '#3b82f6'
                }
                opacity="0.8"
              />
              <circle cx={pos.x} cy={pos.y} r={3} fill="white" />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-border bg-surface/90 backdrop-blur-sm px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" />
          <span className="text-[10px] text-text-muted">Critical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" />
          <span className="text-[10px] text-text-muted">High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-info" />
          <span className="text-[10px] text-text-muted">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="text-[10px] text-text-muted">Low</span>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-3 right-3 rounded-lg border border-border bg-surface/90 backdrop-blur-sm px-3 py-2">
        <p className="text-[10px] text-text-muted">Active Threats</p>
        <p className="text-lg font-bold font-mono text-danger">
          {markers.filter((m) => m.risk === 'critical' || m.risk === 'high').length}
        </p>
      </div>
    </div>
  );
}

/* ─── Password Policy Display ─── */
export function PasswordPolicyDisplay({ policy }) {
  const requirements = [
    {
      label: 'Minimum Length',
      value: `${policy.minLength} characters`,
      met: policy.minLength >= 12,
    },
    {
      label: 'Uppercase Required',
      value: policy.requireUppercase ? 'Yes' : 'No',
      met: policy.requireUppercase,
    },
    {
      label: 'Numbers Required',
      value: policy.requireNumbers ? 'Yes' : 'No',
      met: policy.requireNumbers,
    },
    {
      label: 'Special Characters',
      value: policy.requireSpecial ? 'Yes' : 'No',
      met: policy.requireSpecial,
    },
    { label: 'Max Age', value: `${policy.maxAge} days`, met: policy.maxAge <= 90 },
    { label: 'Prevent Reuse', value: `Last ${policy.preventReuse}`, met: policy.preventReuse >= 8 },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Lock className="h-4 w-4 text-secondary" /> Password Policy
      </h3>
      <div className="space-y-3">
        {requirements.map((req) => (
          <div key={req.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {req.met ? (
                <CheckCircle2 className="h-4 w-4 text-accent" />
              ) : (
                <XCircle className="h-4 w-4 text-danger" />
              )}
              <span className="text-sm text-text-secondary">{req.label}</span>
            </div>
            <span className="text-sm font-mono text-text-primary">{req.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <Button size="sm" variant="outline" className="w-full">
          <Settings className="mr-1.5 h-3.5 w-3.5" /> Edit Policy
        </Button>
      </div>
    </div>
  );
}
