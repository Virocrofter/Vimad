// apps/web/src/app/admin/data-export/page.jsx
'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  getExportJobs,
  getRetentionPolicies,
  createRetentionPolicy,
  updateRetentionPolicy,
  getErasureRequests,
  createErasureRequest,
  createExportJob,
  createAnonymizationConfig,
  previewAnonymization,
  cancelExportJob,
  retryExportJob,
  getExportJobDownloadUrl,
} from '@/api/data-export';
import {
  ExportJobsTable,
  RetentionPolicyCard,
  ErasureRequestsTable,
  ExportDetailDrawer,
} from './components';
import ExportModal from './ExportModal';
import RetentionModal from './RetentionModal';
import AnonymizeModal from './AnonymizeModal';
import ErasureModal from './ErasureModal';

/* ─── Modal payload → API mappers ─── */

// ExportModal form → createExportJob payload
function mapExportFormToJob(form) {
  const isGdpr = form.anonymizePii || form.exportType === 'gdpr';
  return {
    tenantId: form.tenantId === 'all' ? 'all' : form.tenantId,
    name: `${isGdpr ? 'GDPR' : form.exportType === 'full' ? 'Full' : 'Partial'} export — ${new Date().toISOString().slice(0, 10)}`,
    type: isGdpr ? 'gdpr_export' : form.exportType === 'full' ? 'full' : 'partial',
    entityTypes: form.exportType === 'full' ? ['all'] : [form.exportType],
    filters: {
      dateRange: form.dateRange,
      customStart: form.customStart || undefined,
      customEnd: form.customEnd || undefined,
      includeDeleted: form.includeDeleted,
      anonymizePii: form.anonymizePii,
      notifyEmail: form.notifyEmail || undefined,
    },
    format: form.format,
    destination: 'download',
    requestedBy: 'Admin',
  };
}

// RetentionModal form → retention policy payload
function mapRetentionFormToPolicy(form) {
  const multiplier = { days: 1, weeks: 7, months: 30, years: 365 }[form.retentionUnit] || 1;
  return {
    tenantId: form.appliesTo?.[0] || 'all',
    entityType: form.category,
    retentionDays: (form.retentionPeriod || 365) * multiplier,
    action: form.action,
    autoApply: !!form.active,
  };
}

// ErasureModal form → createErasureRequest payload
function mapErasureFormToRequest(form) {
  return {
    tenantId: form.tenantId,
    type: form.scope === 'full_tenant' ? 'user' : 'guest',
    targetId: form.tenantId,
    requestedBy: 'Admin',
    reason: form.reason || '',
  };
}

// AnonymizeModal config → createAnonymizationConfig payload
function mapAnonymizeConfigToApi(config, datasetInfo) {
  const fieldStrategies = Object.entries(config.algorithms || {}).map(([field, strategy]) => ({
    field,
    strategy: ['hash', 'mask', 'randomize', 'nullify', 'tokenize'].includes(strategy)
      ? strategy
      : 'mask',
    preserveFormat: !!config.preserveStructure,
  }));
  (config.customRules || []).forEach((rule) => {
    fieldStrategies.push({
      field: rule.field,
      strategy: ['hash', 'mask', 'randomize', 'nullify', 'tokenize'].includes(rule.method)
        ? rule.method
        : 'mask',
      preserveFormat: !!config.preserveStructure,
    });
  });
  return {
    tenantId: datasetInfo?.tenantId || 'all',
    entityType: datasetInfo?.entityType || 'guests',
    fields: fieldStrategies,
  };
}

export default function DataExportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('exports');
  const [page, setPage] = useState(1);
  const [erasurePage, setErasurePage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showNewExport, setShowNewExport] = useState(false);
  const [showRetention, setShowRetention] = useState(false);
  const [showAnonymize, setShowAnonymize] = useState(false);
  const [showErasure, setShowErasure] = useState(false);
  const [editingErasure, setEditingErasure] = useState(null);

  /* ─── Queries ─── */

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['export-jobs', page, filterStatus, filterType],
    queryFn: () =>
      getExportJobs({
        page,
        pageSize: 20,
        ...(filterStatus && { status: filterStatus }),
        ...(filterType && { type: filterType }),
      }),
  });

  const { data: policies, isLoading: policyLoading } = useQuery({
    queryKey: ['retention-policies'],
    queryFn: getRetentionPolicies,
  });

  const { data: erasureData, isLoading: erasureLoading } = useQuery({
    queryKey: ['erasure-requests', erasurePage],
    queryFn: () => getErasureRequests({ page: erasurePage, pageSize: 20 }),
  });

  const primaryPolicy = Array.isArray(policies) ? policies[0] : null;

  /* ─── Mutations ─── */

  const createJobMutation = useMutation({
    mutationFn: (form) => createExportJob(mapExportFormToJob(form)),
    onSuccess: () => {
      toast({
        title: 'Export job created',
        description: 'The job has been queued for processing.',
      });
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: (err) => {
      toast({ title: 'Failed to create export', description: err.message, variant: 'destructive' });
    },
  });

  const savePolicyMutation = useMutation({
    mutationFn: (form) => {
      const payload = mapRetentionFormToPolicy(form);
      return primaryPolicy?.id
        ? updateRetentionPolicy(primaryPolicy.id, payload)
        : createRetentionPolicy(payload);
    },
    onSuccess: () => {
      toast({ title: 'Retention policy saved' });
      queryClient.invalidateQueries({ queryKey: ['retention-policies'] });
    },
    onError: (err) => {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    },
  });

  const createErasureMutation = useMutation({
    mutationFn: (form) => createErasureRequest(mapErasureFormToRequest(form)),
    onSuccess: () => {
      toast({ title: 'Erasure request created', description: 'The request is pending review.' });
      queryClient.invalidateQueries({ queryKey: ['erasure-requests'] });
    },
    onError: (err) => {
      toast({
        title: 'Failed to create erasure request',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const anonymizeMutation = useMutation({
    mutationFn: async ({ config, datasetInfo }) => {
      const created = await createAnonymizationConfig(mapAnonymizeConfigToApi(config, datasetInfo));
      if (config.previewMode) {
        const preview = await previewAnonymization(created.entityType, created.id, 10);
        return { config: created, preview };
      }
      return { config: created, preview: null };
    },
    onSuccess: ({ preview }) => {
      toast({
        title: 'Anonymization complete',
        description: preview
          ? `Preview generated for ${preview.fields?.length ?? 0} fields.`
          : 'Anonymization config applied.',
      });
    },
    onError: (err) => {
      toast({ title: 'Anonymization failed', description: err.message, variant: 'destructive' });
      throw err; // let the modal stay on its config tab
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (id) => getExportJobDownloadUrl(id),
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (err) => {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    },
  });

  const cancelJobMutation = useMutation({
    mutationFn: (id) => cancelExportJob(id),
    onSuccess: () => {
      toast({ title: 'Export job cancelled' });
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: (err) => {
      toast({ title: 'Cancel failed', description: err.message, variant: 'destructive' });
    },
  });

  const retryJobMutation = useMutation({
    mutationFn: (id) => retryExportJob(id),
    onSuccess: () => {
      toast({ title: 'Export job retried' });
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: (err) => {
      toast({ title: 'Retry failed', description: err.message, variant: 'destructive' });
    },
  });

  /* ─── Handlers ─── */

  const handleCreateExport = useCallback(
    async (form) => {
      await createJobMutation.mutateAsync(form);
      setShowNewExport(false);
    },
    [createJobMutation]
  );

  const handleSaveRetention = useCallback(
    async (form) => {
      await savePolicyMutation.mutateAsync(form);
      setShowRetention(false);
    },
    [savePolicyMutation]
  );

  const handleSaveErasure = useCallback(
    async (form) => {
      await createErasureMutation.mutateAsync(form);
      setShowErasure(false);
      setEditingErasure(null);
    },
    [createErasureMutation]
  );

  const handleRunAnonymize = useCallback(
    (config) => anonymizeMutation.mutateAsync({ config, datasetInfo: null }),
    [anonymizeMutation]
  );

  const handleDownload = useCallback((id) => downloadMutation.mutate(id), [downloadMutation]);

  // NOTE: the data-export API does not expose erasure approve/reject endpoints yet.
  // These handlers surface a clear message instead of silently mutating local state.
  const handleApproveErasure = useCallback(() => {
    toast({
      title: 'Not available',
      description:
        'Erasure approval requires the POST /admin/data-export/erasure/:id/approve endpoint (backend pending).',
      variant: 'destructive',
    });
  }, [toast]);

  const handleRejectErasure = useCallback(() => {
    toast({
      title: 'Not available',
      description:
        'Erasure rejection requires the POST /admin/data-export/erasure/:id/reject endpoint (backend pending).',
      variant: 'destructive',
    });
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Export & GDPR</h1>
          <p className="text-muted-foreground">
            Manage data exports, retention policies, and erasure requests
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnonymize(true)}
            className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
          >
            Anonymize Data
          </button>
          <button
            onClick={() => {
              setEditingErasure(null);
              setShowErasure(true);
            }}
            className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
          >
            New Erasure Request
          </button>
          <button
            onClick={() => setShowRetention(true)}
            className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent"
          >
            Retention Policy
          </button>
          <button
            onClick={() => setShowNewExport(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            New Export
          </button>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex gap-6">
          {[
            { id: 'exports', label: 'Export Jobs', count: jobsData?.meta?.total },
            { id: 'erasure', label: 'Erasure Requests', count: erasureData?.meta?.total },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted">{tab.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'exports' && (
        <ExportJobsTable
          jobs={jobsData?.data || []}
          meta={jobsData?.meta}
          isLoading={jobsLoading}
          page={page}
          onPageChange={setPage}
          filterStatus={filterStatus}
          onFilterStatus={setFilterStatus}
          filterType={filterType}
          onFilterType={setFilterType}
          onSelectJob={setSelectedJob}
          onDownload={handleDownload}
          isDownloading={downloadMutation.isPending}
        />
      )}

      {activeTab === 'erasure' && (
        <ErasureRequestsTable
          requests={erasureData?.data || []}
          meta={erasureData?.meta}
          isLoading={erasureLoading}
          page={erasurePage}
          onPageChange={setErasurePage}
          onApprove={handleApproveErasure}
          onReject={handleRejectErasure}
          isProcessing={false}
        />
      )}

      <RetentionPolicyCard policy={primaryPolicy} isLoading={policyLoading} />

      {showNewExport && (
        <ExportModal onClose={() => setShowNewExport(false)} onCreate={handleCreateExport} />
      )}

      {showRetention && (
        <RetentionModal
          policy={primaryPolicy}
          onClose={() => setShowRetention(false)}
          onSave={handleSaveRetention}
        />
      )}

      {showAnonymize && (
        <AnonymizeModal
          isOpen={showAnonymize}
          onClose={() => setShowAnonymize(false)}
          onRun={handleRunAnonymize}
        />
      )}

      {showErasure && (
        <ErasureModal
          request={editingErasure}
          onClose={() => {
            setShowErasure(false);
            setEditingErasure(null);
          }}
          onSave={handleSaveErasure}
        />
      )}

      {selectedJob && (
        <ExportDetailDrawer
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onDownload={() => handleDownload(selectedJob.id)}
        />
      )}
    </div>
  );
}
