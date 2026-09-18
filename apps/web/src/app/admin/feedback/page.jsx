// apps/web/src/app/admin/feedback/page.jsx
'use client';

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Star,
  TrendingUp,
  Lightbulb,
  ThumbsUp,
  AlertTriangle,
  RefreshCw,
  Plus,
  Reply,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useApiFetch } from '@/hooks/useApiFetch';
import { useApiMutation } from '@/hooks/useApiMutation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getFeedbackDashboard,
  getFeedback,
  getNpsSurveys,
  getNpsResponses,
  getFeatureRequests,
  updateFeedback,
  createResponse,
  createFeatureRequest,
  updateFeatureRequest,
  voteFeedback,
  voteFeatureRequest,
} from '@/api/feedback';
import {
  FeedbackStatCard,
  NpsGauge,
  NpsBreakdownBar,
  SentimentBadge,
  NpsScoreBadge,
  CategoryBadge,
  FeatureStatusBadge,
  PriorityBadge,
  VoteButton,
  SentimentMiniChart,
  KeywordTag,
  NpsScoreBar,
} from './components';
import FeatureRequestModal from './FeatureRequestModal';
import NpsDetailDrawer from './NpsDetailDrawer';
import ResponseModal from './ResponseModal';

/* ─── API → UI mappers ─── */

// NpsResponse → the shape ResponseModal / NpsDetailDrawer expect
function mapNpsResponse(r, surveyName) {
  return {
    id: r.id,
    score: r.score,
    comment: r.comment || '',
    sentiment: r.score >= 9 ? 'promoter' : r.score >= 7 ? 'passive' : 'detractor',
    sentimentScore: r.score / 10,
    keywords: [],
    user: r.userId || 'Anonymous',
    tenantName: surveyName || '',
    touchpoint: surveyName || '',
    followUp: !!r.followUp,
    responded: false,
    response: null,
    createdAt: r.createdAt ? r.createdAt.replace('T', ' ').slice(0, 19) : '',
  };
}

// FeatureRequest form → API payload
function mapFeatureFormToApi(form) {
  return {
    title: form.title,
    description: form.description,
    category: form.category,
    // UI uses backlog/... — map into the API status enum
    status: [
      'submitted',
      'under_review',
      'planned',
      'in_development',
      'released',
      'declined',
    ].includes(form.status)
      ? form.status
      : 'submitted',
    targetRelease: form.estimatedDelivery || undefined,
  };
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedNpsResponse, setSelectedNpsResponse] = useState(null);
  const [respondTarget, setRespondTarget] = useState(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);

  /* ─── Queries (useApiFetch) ─── */

  const dashboard = useApiFetch(() => getFeedbackDashboard(), []);

  const feedback = useApiFetch(
    () =>
      getFeedback({
        page,
        pageSize: 20,
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      }),
    [page, typeFilter, statusFilter]
  );

  const surveys = useApiFetch(() => getNpsSurveys({ page: 1, pageSize: 10 }), []);
  const activeSurvey = useMemo(
    () => surveys.data?.data?.find((s) => s.status === 'active') || surveys.data?.data?.[0] || null,
    [surveys.data]
  );

  const npsResponses = useApiFetch(
    () =>
      activeSurvey
        ? getNpsResponses(activeSurvey.id, { page: 1, pageSize: 50 })
        : Promise.resolve(null),
    [activeSurvey?.id]
  );

  const features = useApiFetch(() => getFeatureRequests({ page: 1, pageSize: 50 }), []);

  /* ─── Mutations (useApiMutation) ─── */

  const respondMutation = useApiMutation(
    ({ feedbackId, message }) => createResponse(feedbackId, message, false),
    {
      onSuccess: () => {
        toast({ title: 'Response sent', description: 'Your reply has been recorded.' });
        feedback.refetch();
      },
    }
  );

  const voteFeedbackMutation = useApiMutation((id) => voteFeedback(id), {
    onSuccess: () => feedback.refetch(),
  });

  const voteFeatureMutation = useApiMutation((id) => voteFeatureRequest(id), {
    onSuccess: () => features.refetch(),
  });

  const saveFeatureMutation = useApiMutation(
    ({ form, existing }) =>
      existing
        ? updateFeatureRequest(existing.id, mapFeatureFormToApi(form))
        : createFeatureRequest(mapFeatureFormToApi(form)),
    {
      onSuccess: () => {
        toast({ title: 'Feature request saved' });
        features.refetch();
      },
    }
  );

  const triageMutation = useApiMutation(({ id, data }) => updateFeedback(id, data), {
    onSuccess: () => feedback.refetch(),
  });

  /* ─── Handlers ─── */

  const handleSendResponse = async (id, text) => {
    try {
      await respondMutation.mutate({ feedbackId: id, message: text });
      setRespondTarget(null);
    } catch (err) {
      toast({ title: 'Failed to send response', description: err.message, variant: 'destructive' });
    }
  };

  // NPS responses have no dedicated reply endpoint — replies are stored as feedback responses.
  const handleNpsRespond = async (id, text) => {
    try {
      await respondMutation.mutate({ feedbackId: id, message: text });
      setSelectedNpsResponse((prev) =>
        prev ? { ...prev, responded: true, response: { text, by: 'You', at: 'just now' } } : prev
      );
    } catch (err) {
      toast({ title: 'Failed to send response', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveFeature = async (form) => {
    try {
      await saveFeatureMutation.mutate({ form, existing: editingFeature });
      setShowFeatureModal(false);
      setEditingFeature(null);
    } catch (err) {
      toast({
        title: 'Failed to save feature request',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleVoteFeedback = (id) =>
    voteFeedbackMutation
      .mutate(id)
      .catch((err) =>
        toast({ title: 'Vote failed', description: err.message, variant: 'destructive' })
      );

  const handleVoteFeature = (id) =>
    voteFeatureMutation
      .mutate(id)
      .catch((err) =>
        toast({ title: 'Vote failed', description: err.message, variant: 'destructive' })
      );

  /* ─── Derived data ─── */

  const feedbackItems = useMemo(() => feedback.data?.data || [], [feedback.data]);
  const keywords = useMemo(
    () => [...new Set(feedbackItems.flatMap((f) => f.metadata?.keywords || []))].slice(0, 12),
    [feedbackItems]
  );
  const featureItems = features.data?.data || [];
  const npsList = useMemo(
    () => (npsResponses.data?.data || []).map((r) => mapNpsResponse(r, activeSurvey?.name)),
    [npsResponses.data, activeSurvey]
  );

  // NPS score distribution (0–10) for NpsScoreBar
  const npsDistribution = useMemo(() => {
    const counts = Array.from({ length: 11 }, () => 0);
    npsList.forEach((r) => {
      if (typeof r.score === 'number') counts[r.score] += 1;
    });
    const maxCount = Math.max(...counts, 1);
    return counts.map((count, score) => ({ score, count, maxCount }));
  }, [npsList]);

  // Sentiment trend for SentimentMiniChart — grouped by day from NPS responses
  const sentimentTrend = useMemo(() => {
    const byDay = new Map();
    npsList.forEach((r) => {
      const day = (r.createdAt || '').slice(0, 10) || 'unknown';
      const bucket = byDay.get(day) || { positive: 0, neutral: 0, negative: 0, scores: [] };
      if (r.score >= 9) bucket.positive += 1;
      else if (r.score >= 7) bucket.neutral += 1;
      else bucket.negative += 1;
      bucket.scores.push(r.score);
      byDay.set(day, bucket);
    });
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, b]) => ({
        positive: b.positive,
        neutral: b.neutral,
        negative: b.negative,
        nps: b.scores.length
          ? Math.round(
              ((b.scores.filter((s) => s >= 9).length - b.scores.filter((s) => s <= 6).length) /
                b.scores.length) *
                100
            )
          : 0,
      }));
  }, [npsList]);

  const dash = dashboard.data;
  const loading = dashboard.loading || feedback.loading;

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (dashboard.error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-center">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-danger" />
          <p className="text-sm text-danger">Failed to load feedback: {dashboard.error.message}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={dashboard.refetch}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Feedback & NPS</h1>
          <p className="text-sm text-text-muted">
            Tenant feedback, NPS surveys, and feature requests
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingFeature(null);
            setShowFeatureModal(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> New Feature Request
        </Button>
      </div>

      {/* Stat cards */}
      {dash && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeedbackStatCard
            label="Total Feedback"
            value={dash.totalFeedback}
            icon={MessageSquare}
            color="text-secondary"
          />
          <FeedbackStatCard
            label="Open Issues"
            value={dash.openIssues}
            icon={AlertTriangle}
            color="text-warning"
          />
          <FeedbackStatCard
            label="NPS Score"
            value={dash.npsScore}
            icon={TrendingUp}
            color="text-accent"
          />
          <FeedbackStatCard
            label="Feature Requests"
            value={dash.featureRequests}
            icon={Lightbulb}
            color="text-info"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'feedback', label: 'Feedback', count: feedback.data?.meta?.total },
            { id: 'nps', label: 'NPS Responses', count: npsList.length },
            { id: 'features', label: 'Feature Requests', count: features.data?.meta?.total },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 rounded-full bg-surface-elevated px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── Overview tab ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">NPS Score</h3>
            <div className="flex items-center justify-center">
              <NpsGauge score={activeSurvey?.npsScore ?? dash?.npsScore ?? 0} />
            </div>
            {activeSurvey && (
              <div className="mt-4">
                <NpsBreakdownBar
                  promoters={activeSurvey.promoters}
                  passives={activeSurvey.passives}
                  detractors={activeSurvey.detractors}
                  total={activeSurvey.responses}
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">Sentiment Trend</h3>
            {sentimentTrend.length > 0 ? (
              <SentimentMiniChart data={sentimentTrend} />
            ) : (
              <p className="py-8 text-center text-sm text-text-muted">No NPS responses yet.</p>
            )}
            {keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
                {keywords.map((k) => (
                  <KeywordTag key={k} keyword={k} />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-text-primary">
              Score Distribution (0–10)
            </h3>
            <div className="space-y-1.5">
              {npsDistribution
                .slice()
                .reverse()
                .map((d) => (
                  <NpsScoreBar
                    key={d.score}
                    score={d.score}
                    count={d.count}
                    maxCount={d.maxCount}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Feedback tab ─── */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">All types</option>
              <option value="bug">Bug</option>
              <option value="feature_request">Feature request</option>
              <option value="praise">Praise</option>
              <option value="complaint">Complaint</option>
              <option value="general">General</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="triaged">Triaged</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {feedbackItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">
              No feedback matches your filters.
            </p>
          ) : (
            feedbackItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <VoteButton
                  count={item.votes}
                  voted={false}
                  onVote={() => handleVoteFeedback(item.id)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-text-primary">{item.title}</span>
                    <CategoryBadge category={item.category} />
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {item.userName || item.userEmail || 'Anonymous'} ·{' '}
                    {(item.createdAt || '').replace('T', ' ').slice(0, 16)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'new' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        triageMutation
                          .mutate({ id: item.id, data: { status: 'triaged' } })
                          .catch((err) =>
                            toast({
                              title: 'Triage failed',
                              description: err.message,
                              variant: 'destructive',
                            })
                          )
                      }
                    >
                      <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Triage
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setRespondTarget(item)}>
                    <Reply className="mr-1 h-3.5 w-3.5" /> Respond
                  </Button>
                </div>
              </div>
            ))
          )}

          {(feedback.data?.meta?.totalPages || 1) > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-text-muted">
                Page {page} of {feedback.data.meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= feedback.data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── NPS tab ─── */}
      {activeTab === 'nps' && (
        <div className="space-y-3">
          {npsResponses.loading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : npsList.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">No NPS responses yet.</p>
          ) : (
            npsList.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedNpsResponse(r)}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-elevated"
              >
                <NpsScoreBadge score={r.score} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{r.user}</span>
                    <SentimentBadge sentiment={r.sentiment} />
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary">{r.comment}</p>
                </div>
                <span className="text-xs text-text-muted">{r.createdAt.slice(0, 10)}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* ─── Feature requests tab ─── */}
      {activeTab === 'features' && (
        <div className="space-y-3">
          {featureItems.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">No feature requests yet.</p>
          ) : (
            featureItems.map((f) => (
              <div
                key={f.id}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <VoteButton count={f.votes} voted={false} onVote={() => handleVoteFeature(f.id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-text-primary">{f.title}</span>
                    <FeatureStatusBadge status={f.status} />
                    <CategoryBadge category={f.category} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{f.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingFeature(f);
                    setShowFeatureModal(true);
                  }}
                >
                  Edit
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Modals / drawers ─── */}
      {showFeatureModal && (
        <FeatureRequestModal
          feature={editingFeature}
          tenants={[]}
          onClose={() => {
            setShowFeatureModal(false);
            setEditingFeature(null);
          }}
          onSave={handleSaveFeature}
        />
      )}

      {selectedNpsResponse && (
        <NpsDetailDrawer
          response={selectedNpsResponse}
          onClose={() => setSelectedNpsResponse(null)}
          onRespond={handleNpsRespond}
          onLinkToFeature={() => {
            setSelectedNpsResponse(null);
            setEditingFeature(null);
            setShowFeatureModal(true);
          }}
        />
      )}

      {respondTarget && (
        <ResponseModal
          response={{
            id: respondTarget.id,
            user: respondTarget.userName || respondTarget.userEmail || 'Anonymous',
            tenantName: respondTarget.tenantId || '',
            comment: respondTarget.description,
            score: respondTarget.metadata?.score,
            sentiment: respondTarget.type,
            category: respondTarget.category,
            keywords: respondTarget.metadata?.keywords || [],
          }}
          onClose={() => setRespondTarget(null)}
          onSend={handleSendResponse}
        />
      )}
    </div>
  );
}
