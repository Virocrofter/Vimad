/* src/app/admin/feedback/page.jsx */
import { useState, useMemo } from 'react';
import {
  MessageSquare, Star, Lightbulb, TrendingUp, TrendingDown, Search,
  Filter, Download, Plus, Send, ThumbsUp, ThumbsDown, Meh, ArrowUp,
  BarChart3, Smile, Frown, Hash, Clock, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, MoreHorizontal, Link2, ExternalLink
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  npsResponses, featureRequests, sentimentTrend, categoryDistribution,
  npsDistribution, npsCategoryMeta, calculateNPS, getNpsColor,
  formatNpsScore, getSentimentFromScore
} from './data';
import {
  NpsGauge, NpsBreakdownBar, SentimentBadge, NpsScoreBadge,
  CategoryBadge, FeatureStatusBadge, PriorityBadge, VoteButton,
  SentimentMiniChart, KeywordTag, ResponseCard, FeedbackStatCard,
  NpsScoreBar
} from './components';
import NpsDetailDrawer from './NpsDetailDrawer';
import ResponseModal from './ResponseModal';
import FeatureRequestModal from './FeatureRequestModal';

/* ─── Mock Tenants ─── */
const mockTenants = [
  { id: 'TNT-001', name: 'Grand Hotel Boston' },
  { id: 'TNT-002', name: 'Seaside Resort Miami' },
  { id: 'TNT-003', name: 'Mountain Lodge Aspen' },
  { id: 'TNT-004', name: 'Downtown Suites Chicago' },
  { id: 'TNT-005', name: 'Coastal Inn San Diego' },
  { id: 'TNT-006', name: 'Lakeside Resort Tahoe' },
  { id: 'TNT-007', name: 'Urban Hotel NYC' },
  { id: 'TNT-008', name: 'Desert Oasis Phoenix' },
];

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState('nps');

  /* ── NPS State ── */
  const [npsData, setNpsData] = useState(npsResponses);
  const [npsQuery, setNpsQuery] = useState('');
  const [npsCategoryFilter, setNpsCategoryFilter] = useState('all');
  const [npsSentimentFilter, setNpsSentimentFilter] = useState('all');
  const [npsScoreFilter, setNpsScoreFilter] = useState('all');
  const [npsFollowUpFilter, setNpsFollowUpFilter] = useState('all');
  const [selectedNps, setSelectedNps] = useState(null);
  const [showNpsDrawer, setShowNpsDrawer] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseTarget, setResponseTarget] = useState(null);

  /* ── Feature Requests State ── */
  const [features, setFeatures] = useState(featureRequests);
  const [featureQuery, setFeatureQuery] = useState('');
  const [featureStatusFilter, setFeatureStatusFilter] = useState('all');
  const [featureCategoryFilter, setFeatureCategoryFilter] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  /* ─── Computed: NPS Stats ─── */
  const npsStats = useMemo(() => {
    const total = npsData.length;
    const promoters = npsData.filter(r => r.score >= 9).length;
    const passives = npsData.filter(r => r.score >= 7 && r.score <= 8).length;
    const detractors = npsData.filter(r => r.score <= 6).length;
    const nps = calculateNPS(promoters, passives, detractors);
    const avgScore = total > 0 ? (npsData.reduce((s, r) => s + r.score, 0) / total).toFixed(1) : 0;
    const responded = npsData.filter(r => r.responded).length;
    const followUpNeeded = npsData.filter(r => r.followUp && !r.responded).length;

    return { total, promoters, passives, detractors, nps, avgScore, responded, followUpNeeded };
  }, [npsData]);

  /* ─── Computed: Feature Stats ─── */
  const featureStats = useMemo(() => {
    const total = features.length;
    const shipped = features.filter(f => f.status === 'shipped').length;
    const inProgress = features.filter(f => f.status === 'in-progress').length;
    const totalVotes = features.reduce((s, f) => s + f.votes, 0);
    const critical = features.filter(f => f.priority === 'critical').length;

    return { total, shipped, inProgress, totalVotes, critical };
  }, [features]);

  /* ─── Filtered NPS ─── */
  const filteredNps = useMemo(() => {
    let result = npsData.filter((r) => {
      const matchesQuery = !npsQuery ||
        r.comment.toLowerCase().includes(npsQuery.toLowerCase()) ||
        r.user.name.toLowerCase().includes(npsQuery.toLowerCase()) ||
        r.tenantName.toLowerCase().includes(npsQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(npsQuery.toLowerCase());
      const matchesCategory = npsCategoryFilter === 'all' || r.category === npsCategoryFilter;
      const matchesSentiment = npsSentimentFilter === 'all' || r.sentiment === npsSentimentFilter;
      const matchesScore = npsScoreFilter === 'all' ||
        (npsScoreFilter === 'promoter' && r.score >= 9) ||
        (npsScoreFilter === 'passive' && r.score >= 7 && r.score <= 8) ||
        (npsScoreFilter === 'detractor' && r.score <= 6);
      const matchesFollowUp = npsFollowUpFilter === 'all' ||
        (npsFollowUpFilter === 'needs-response' && r.followUp && !r.responded) ||
        (npsFollowUpFilter === 'responded' && r.responded) ||
        (npsFollowUpFilter === 'no-action' && !r.followUp);

      return matchesQuery && matchesCategory && matchesSentiment && matchesScore && matchesFollowUp;
    });

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return result;
  }, [npsData, npsQuery, npsCategoryFilter, npsSentimentFilter, npsScoreFilter, npsFollowUpFilter]);

  /* ─── Filtered Features ─── */
  const filteredFeatures = useMemo(() => {
    let result = features.filter((f) => {
      const matchesQuery = !featureQuery ||
        f.title.toLowerCase().includes(featureQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(featureQuery.toLowerCase()) ||
        f.id.toLowerCase().includes(featureQuery.toLowerCase());
      const matchesStatus = featureStatusFilter === 'all' || f.status === featureStatusFilter;
      const matchesCategory = featureCategoryFilter === 'all' || f.category === featureCategoryFilter;

      return matchesQuery && matchesStatus && matchesCategory;
    });

    result.sort((a, b) => b.votes - a.votes);
    return result;
  }, [features, featureQuery, featureStatusFilter, featureCategoryFilter]);

  /* ─── Handlers ─── */
  const handleNpsRespond = (id, text) => {
    setNpsData(prev => prev.map(r =>
      r.id === id ? {
        ...r,
        responded: true,
        response: { by: 'Admin', text, at: new Date().toISOString() }
      } : r
    ));
  };

  const handleFeatureVote = (id) => {
    setFeatures(prev => prev.map(f =>
      f.id === id ? { ...f, votes: f.votes + 1 } : f
    ));
  };

  const handleSaveFeature = (payload) => {
    setFeatures(prev => {
      const idx = prev.findIndex(f => f.id === payload.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = payload;
        return next;
      }
      return [payload, ...prev];
    });
    setSelectedFeature(null);
  };

  const handleLinkToFeature = (npsId, featureId) => {
    console.log('Linking', npsId, 'to', featureId);
  };

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'nps', label: 'NPS & Feedback', icon: MessageSquare, badge: npsStats.followUpNeeded > 0 ? npsStats.followUpNeeded : undefined },
    { id: 'features', label: 'Feature Requests', icon: Lightbulb, badge: featureStats.critical > 0 ? featureStats.critical : undefined },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Customer Feedback</h1>
          <p className="text-sm text-text-secondary">
            NPS scores, sentiment analysis, and feature request management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" /> Export
          </Button>
          {activeTab === 'features' && (
            <Button size="sm" onClick={() => { setSelectedFeature(null); setShowFeatureModal(true); }}>
              <Plus className="mr-1.5 h-4 w-4" /> New Request
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active ? 'border-secondary text-secondary' : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════
          NPS & FEEDBACK TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'nps' && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FeedbackStatCard
              label="NPS Score"
              value={formatNpsScore(npsStats.nps)}
              icon={npsStats.nps >= 0 ? TrendingUp : TrendingDown}
              color={getNpsColor(npsStats.nps)}
              subtext={`${npsStats.promoters} promoters · ${npsStats.detractors} detractors`}
            />
            <FeedbackStatCard
              label="Avg Score"
              value={npsStats.avgScore}
              icon={Star}
              color="text-secondary"
              subtext={`Out of 10 · ${npsStats.total} responses`}
            />
            <FeedbackStatCard
              label="Response Rate"
              value={`${npsStats.total > 0 ? Math.round((npsStats.responded / npsStats.total) * 100) : 0}%`}
              icon={CheckCircle2}
              color="text-accent"
              subtext={`${npsStats.responded} of ${npsStats.total} responded`}
            />
            <FeedbackStatCard
              label="Needs Follow-up"
              value={npsStats.followUpNeeded}
              icon={AlertTriangle}
              color="text-warning"
              subtext="Unresponded flagged"
            />
          </div>

          {/* NPS Overview Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* NPS Gauge */}
            <div className="rounded-xl border border-border bg-surface p-5 flex flex-col items-center justify-center">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Net Promoter Score</h3>
              <NpsGauge score={npsStats.nps} size={140} />
              <div className="mt-4 text-center">
                <p className={cn('text-lg font-bold', getNpsColor(npsStats.nps))}>
                  {npsStats.nps >= 50 ? 'Excellent' : npsStats.nps >= 30 ? 'Good' : npsStats.nps >= 0 ? 'Average' : 'Poor'}
                </p>
                <p className="text-xs text-text-muted">Based on {npsStats.total} responses</p>
              </div>
            </div>

            {/* Score Distribution */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Score Distribution</h3>
              <div className="space-y-2">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((score) => {
                  const count = npsData.filter(r => r.score === score).length;
                  const maxCount = Math.max(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => npsData.filter(r => r.score === s).length));
                  return (
                    <NpsScoreBar key={score} score={score} count={count} maxCount={maxCount} />
                  );
                })}
              </div>
            </div>

            {/* Sentiment Trend */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Sentiment Trend (30d)</h3>
              <SentimentMiniChart data={sentimentTrend} />
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-text-muted">Latest NPS: <span className="font-mono font-medium text-text-primary">{sentimentTrend[sentimentTrend.length - 1]?.nps || 0}</span></span>
                <span className="text-text-muted">Responses: <span className="font-mono font-medium text-text-primary">{sentimentTrend.reduce((s, d) => s + d.positive + d.neutral + d.negative, 0)}</span></span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Feedback by Category</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(categoryDistribution).map(([cat, data]) => (
                <div key={cat} className="rounded-lg border border-border bg-background p-3 text-center">
                  <CategoryBadge category={cat} />
                  <p className="mt-2 text-2xl font-bold font-mono text-text-primary">{data.count}</p>
                  <p className="text-[10px] text-text-muted">Avg: {data.avgScore.toFixed(1)}</p>
                  <div className="mt-2 h-1 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={cn('h-full rounded-full',
                        data.avgScore >= 8 ? 'bg-accent' : data.avgScore >= 6 ? 'bg-secondary' : data.avgScore >= 4 ? 'bg-warning' : 'bg-danger'
                      )}
                      style={{ width: `${(data.avgScore / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search feedback, users, tenants..."
                value={npsQuery}
                onChange={(e) => setNpsQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={npsCategoryFilter}
                onChange={(e) => setNpsCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Categories</option>
                <option value="product">Product</option>
                <option value="feature">Feature</option>
                <option value="support">Support</option>
                <option value="billing">Billing</option>
                <option value="performance">Performance</option>
                <option value="onboarding">Onboarding</option>
              </select>
              <select
                value={npsSentimentFilter}
                onChange={(e) => setNpsSentimentFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
              <select
                value={npsScoreFilter}
                onChange={(e) => setNpsScoreFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Scores</option>
                <option value="promoter">Promoters (9-10)</option>
                <option value="passive">Passives (7-8)</option>
                <option value="detractor">Detractors (0-6)</option>
              </select>
              <select
                value={npsFollowUpFilter}
                onChange={(e) => setNpsFollowUpFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="needs-response">Needs Response</option>
                <option value="responded">Responded</option>
                <option value="no-action">No Action Needed</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredNps.length}</span> of {npsData.length} responses
          </p>

          {/* NPS Responses Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredNps.map((response) => (
              <div
                key={response.id}
                className={cn(
                  'rounded-xl border bg-surface p-4 transition-all hover:shadow-md cursor-pointer',
                  response.followUp && !response.responded ? 'border-warning/30 ring-1 ring-warning/10' : 'border-border'
                )}
                onClick={() => { setSelectedNps(response); setShowNpsDrawer(true); }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      response.score >= 9 ? 'bg-accent/10' :
                      response.score >= 7 ? 'bg-secondary/10' :
                      response.score >= 5 ? 'bg-warning/10' : 'bg-danger/10'
                    )}>
                      {response.score >= 9 ? <Smile className="h-5 w-5 text-accent" /> :
                       response.score >= 7 ? <Smile className="h-5 w-5 text-secondary" /> :
                       response.score >= 5 ? <Meh className="h-5 w-5 text-warning" /> :
                       <Frown className="h-5 w-5 text-danger" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <NpsScoreBadge score={response.score} />
                        <CategoryBadge category={response.category} />
                        <SentimentBadge sentiment={response.sentiment} />
                        {response.followUp && !response.responded && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 border border-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning">
                            <AlertTriangle className="h-3 w-3" /> Needs Response
                          </span>
                        )}
                        {response.responded && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                            <CheckCircle2 className="h-3 w-3" /> Responded
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                        {response.comment}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {response.keywords.map((kw) => (
                          <KeywordTag key={kw} keyword={kw} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-muted">{response.createdAt}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{response.touchpoint}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {response.tenantName}
                    </span>
                    <span>·</span>
                    <span>{response.user.name}</span>
                    <span>·</span>
                    <span>{response.user.role}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setResponseTarget(response);
                        setShowResponseModal(true);
                      }}
                      className={cn(
                        'inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors',
                        response.responded
                          ? 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                          : 'border-secondary bg-secondary/10 text-secondary hover:bg-secondary/20'
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {response.responded ? 'View Response' : 'Respond'}
                    </button>
                  </div>
                </div>

                {response.response && (
                  <div className="mt-3">
                    <ResponseCard response={response.response} />
                  </div>
                )}
              </div>
            ))}

            {filteredNps.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">No feedback matches your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          FEATURE REQUESTS TAB
          ═════════════════════════════════════════ */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FeedbackStatCard
              label="Total Requests"
              value={featureStats.total}
              icon={Lightbulb}
              color="text-text-primary"
              subtext="All time"
            />
            <FeedbackStatCard
              label="Shipped"
              value={featureStats.shipped}
              icon={CheckCircle2}
              color="text-accent"
              subtext={`${Math.round((featureStats.shipped / featureStats.total) * 100)}% completion rate`}
            />
            <FeedbackStatCard
              label="In Progress"
              value={featureStats.inProgress}
              icon={Clock}
              color="text-secondary"
              subtext="Being built now"
            />
            <FeedbackStatCard
              label="Total Votes"
              value={featureStats.totalVotes}
              icon={ThumbsUp}
              color="text-purple-500"
              subtext={`${featureStats.critical} critical priority`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search feature requests..."
                value={featureQuery}
                onChange={(e) => setFeatureQuery(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={featureStatusFilter}
                onChange={(e) => setFeatureStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="backlog">Backlog</option>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="shipped">Shipped</option>
                <option value="declined">Declined</option>
              </select>
              <select
                value={featureCategoryFilter}
                onChange={(e) => setFeatureCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Categories</option>
                <option value="revenue">Revenue</option>
                <option value="operations">Operations</option>
                <option value="guest-experience">Guest Experience</option>
                <option value="reporting">Reporting</option>
                <option value="integrations">Integrations</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-text-muted">
            Showing <span className="font-medium text-text-primary">{filteredFeatures.length}</span> of {features.length} requests
          </p>

          {/* Feature Requests Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredFeatures.map((feature) => (
              <div
                key={feature.id}
                className="rounded-xl border border-border bg-surface p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <VoteButton
                    count={feature.votes}
                    voted={false}
                    onVote={() => handleFeatureVote(feature.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
                        <p className="text-[10px] text-text-muted font-mono mt-0.5">{feature.id}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <FeatureStatusBadge status={feature.status} />
                        <PriorityBadge priority={feature.priority} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {feature.tenantName || 'Multiple tenants'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {feature.comments} comments
                      </span>
                      <span>·</span>
                      <span>{feature.createdAt}</span>
                      {feature.estimatedDelivery && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-secondary">
                            <Clock className="h-3 w-3" /> ETA: {feature.estimatedDelivery}
                          </span>
                        </>
                      )}
                    </div>
                    {feature.npsLinked?.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-text-muted">
                        <Link2 className="h-3 w-3" />
                        Linked to {feature.npsLinked.length} NPS response{feature.npsLinked.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedFeature(feature); setShowFeatureModal(true); }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-elevated hover:text-text-primary shrink-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredFeatures.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-12 text-center">
                <Lightbulb className="mx-auto h-10 w-10 text-text-muted mb-3" />
                <p className="text-sm text-text-muted">No feature requests match your filters.</p>
                <Button size="sm" className="mt-4" onClick={() => { setSelectedFeature(null); setShowFeatureModal(true); }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Create Request
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════
          MODALS & DRAWERS
          ═════════════════════════════════════════ */}
      {showNpsDrawer && selectedNps && (
        <NpsDetailDrawer
          response={selectedNps}
          onClose={() => { setShowNpsDrawer(false); setSelectedNps(null); }}
          onRespond={(r) => { setResponseTarget(r); setShowResponseModal(true); }}
          onLinkToFeature={(npsId, featureId) => handleLinkToFeature(npsId, featureId)}
        />
      )}

      {showResponseModal && responseTarget && (
        <ResponseModal
          response={responseTarget}
          onClose={() => { setShowResponseModal(false); setResponseTarget(null); }}
          onSend={handleNpsRespond}
        />
      )}

      {showFeatureModal && (
        <FeatureRequestModal
          feature={selectedFeature}
          onClose={() => { setShowFeatureModal(false); setSelectedFeature(null); }}
          onSave={handleSaveFeature}
          tenants={mockTenants}
        />
      )}
    </div>
  );
}