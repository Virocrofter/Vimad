import { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  Gift,
  Clock,
  Zap,
  Shield,
  Sparkles,
  ArrowUpDown,
  Coffee,
  CheckCircle2,
  History,
  Crown,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { tierMeta, benefitIcons } from './data';
import { TierBadge, TierProgressBar } from './components';

const iconComponents = {
  Clock,
  ArrowUpDown,
  Sparkles,
  Coffee,
  Gift,
  Zap,
  Shield,
  Wifi: Shield,
  Mail: Shield,
  Phone: Shield,
};

export function MemberDetailDrawer({ member, transactions, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const meta = tierMeta[member.tier];
  const nextTier = Object.entries(tierMeta).find(([_, m]) => m.req > member.points);
  const nextTierName = nextTier ? nextTier[1].label : 'Max Tier';
  const nextTierReq = nextTier ? nextTier[1].req : member.points;
  const progress = Math.min(100, (member.points / nextTierReq) * 100);

  const memberTxns = transactions.filter((t) => t.memberId === member.id);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'points', label: 'Points History', icon: History },
    { id: 'benefits', label: 'Benefits', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background shadow-2xl overflow-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-xl font-bold text-secondary">
                {member.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary">{member.name}</h2>
                  <TierBadge tier={member.tier} size="sm" />
                </div>
                <p className="text-xs text-text-muted">
                  ID: {member.id} • Member since {member.joined}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
                    active
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Points Card */}
              <div
                className={cn(
                  'rounded-xl border p-6 bg-gradient-to-br',
                  meta.gradient,
                  meta.border
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">Current Balance</p>
                    <p className={cn('text-4xl font-bold font-mono mt-1', meta.color)}>
                      {member.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-text-muted mt-1">Loyalty Points</p>
                  </div>
                  <div className={cn('rounded-full p-4', meta.bg)}>
                    <Crown className={cn('h-8 w-8', meta.color)} />
                  </div>
                </div>
                {nextTier && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-text-secondary">Progress to {nextTierName}</span>
                      <span className="font-medium text-text-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-background/50 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', meta.dot)}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-text-muted">
                      {nextTierReq - member.points} points needed
                    </p>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Lifetime Value</p>
                  <p className="mt-1 text-2xl font-bold font-mono text-text-primary">
                    ${member.lifetimeValue.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Total Stays</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">
                    {member.totalStays}{' '}
                    <span className="text-sm font-normal text-text-muted">
                      ({member.totalNights} nights)
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Last Stay</p>
                  <p className="mt-1 text-lg font-bold text-text-primary">{member.lastStay}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wider">Member Since</p>
                  <p className="mt-1 text-lg font-bold text-text-primary">{member.joined}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                  Contact
                </h3>
                <div className="flex items-center gap-3 text-sm text-text-primary">
                  <Mail className="h-4 w-4 text-text-muted" /> {member.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-text-primary">
                  <Phone className="h-4 w-4 text-text-muted" /> {member.phone}
                </div>
              </div>
            </div>
          )}

          {/* Points History Tab */}
          {activeTab === 'points' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Transaction History</h3>
                <span className="text-xs text-text-muted">{memberTxns.length} transactions</span>
              </div>
              <div className="space-y-3">
                {memberTxns.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                          tx.type === 'accrual'
                            ? 'bg-accent/10'
                            : tx.type === 'bonus'
                              ? 'bg-secondary/10'
                              : 'bg-danger/10'
                        )}
                      >
                        {tx.type === 'accrual' ? (
                          <TrendingUp className="h-4 w-4 text-accent" />
                        ) : tx.type === 'bonus' ? (
                          <Gift className="h-4 w-4 text-secondary" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-danger" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{tx.description}</p>
                        <p className="text-xs text-text-muted">
                          {tx.date} • {tx.source}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-bold font-mono',
                        tx.type === 'redemption' ? 'text-danger' : 'text-accent'
                      )}
                    >
                      {tx.type === 'redemption' ? '' : '+'}
                      {tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                {memberTxns.length === 0 && (
                  <div className="text-center py-8 text-text-muted text-sm">
                    No transactions yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Benefits Tab */}
          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">Active Benefits</h3>
              <div className="space-y-2">
                {meta.benefits.map((benefit) => {
                  const iconKey = Object.keys(benefitIcons).find((k) => benefit.includes(k));
                  const BenefitIcon = iconComponents[iconKey] || CheckCircle2;
                  return (
                    <div
                      key={benefit}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          meta.bg
                        )}
                      >
                        <BenefitIcon className={cn('h-4 w-4', meta.color)} />
                      </div>
                      <span className="text-sm text-text-primary">{benefit}</span>
                      <CheckCircle2 className="ml-auto h-4 w-4 text-accent" />
                    </div>
                  );
                })}
              </div>

              {nextTier && (
                <>
                  <h3 className="text-sm font-semibold text-text-primary mt-6">
                    Next Tier Benefits ({nextTierName})
                  </h3>
                  <div className="space-y-2 opacity-60">
                    {nextTier[1].benefits
                      .filter((b) => !meta.benefits.includes(b))
                      .map((benefit) => {
                        const iconKey = Object.keys(benefitIcons).find((k) => benefit.includes(k));
                        const BenefitIcon = iconComponents[iconKey] || CheckCircle2;
                        return (
                          <div
                            key={benefit}
                            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated">
                              <BenefitIcon className="h-4 w-4 text-text-muted" />
                            </div>
                            <span className="text-sm text-text-muted">{benefit}</span>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
