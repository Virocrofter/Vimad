// apps/web/src/app/admin/data-export/components.jsx
import { useState } from 'react';
import {
  Download,
  FileText,
  UserX,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Eye,
  Calendar,
  Filter,
} from 'lucide-react';

// ─── Export Jobs Table ───
export function ExportJobsTable({
  jobs,
  meta,
  isLoading,
  page,
  onPageChange,
  filterStatus,
  onFilterStatus,
  filterType,
  onFilterType,
  onSelectJob,
  onDownload,
  isDownloading,
}) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const typeIcons = {
    export: FileText,
    anonymize: Shield,
    delete: UserX,
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => onFilterType(e.target.value)}
            className="text-sm border rounded-md px-3 py-1.5 bg-background"
          >
            <option value="">All Types</option>
            <option value="export">Export</option>
            <option value="anonymize">Anonymize</option>
            <option value="delete">Delete</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatus(e.target.value)}
            className="text-sm border rounded-md px-3 py-1.5 bg-background"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Target</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Progress</th>
              <th className="px-4 py-3 text-left font-medium">Requested By</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading export jobs...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No export jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job) => {
                const TypeIcon = typeIcons[job.type] || FileText;
                return (
                  <tr key={job.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{job.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground uppercase">
                        {job.targetType}
                      </span>
                      <div className="font-mono text-xs">{job.targetId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || 'bg-gray-100'}`}
                      >
                        {job.status === 'processing' && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full max-w-[120px]">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{job.requestedBy}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectJob(job)}
                          className="p-1.5 hover:bg-muted rounded-md"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {job.status === 'completed' && job.resultUrl && (
                          <button
                            onClick={() => onDownload(job.id)}
                            disabled={isDownloading}
                            className="p-1.5 hover:bg-muted rounded-md disabled:opacity-50"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * meta.pageSize + 1} - {Math.min(page * meta.pageSize, meta.total)}{' '}
            of {meta.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-accent"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-accent"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Retention Policy Card ───
export function RetentionPolicyCard({ policy, isLoading }) {
  if (isLoading) {
    return (
      <div className="border rounded-lg p-6">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!policy) return null;

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Current Retention Policy</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold">{policy.guestDataMonths}</div>
          <div className="text-sm text-muted-foreground">Guest Data (months)</div>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold">{policy.auditLogMonths}</div>
          <div className="text-sm text-muted-foreground">Audit Logs (months)</div>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold">{policy.reservationArchiveYears}</div>
          <div className="text-sm text-muted-foreground">Reservation Archive (years)</div>
        </div>
      </div>
      {policy.autoAnonymize && (
        <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600">
          <AlertTriangle className="w-4 h-4" />
          Auto-anonymization is enabled
        </div>
      )}
      {policy.nextRunAt && (
        <div className="mt-2 text-sm text-muted-foreground">
          Next scheduled run: {new Date(policy.nextRunAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ─── Erasure Requests Table ───
export function ErasureRequestsTable({
  requests,
  meta,
  isLoading,
  page,
  onPageChange,
  onApprove,
  onReject,
  isProcessing,
}) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Guest</th>
              <th className="px-4 py-3 text-left font-medium">Reason</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Requested</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No erasure requests
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{req.guestName}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {req.guestId.slice(0, 8)}...
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[300px] truncate">{req.reason}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(req.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onApprove(req.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) onReject(req.id, reason);
                          }}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New Export Modal ───
export function NewExportModal({ onClose, onSubmit, isSubmitting }) {
  const [type, setType] = useState('export');
  const [targetType, setTargetType] = useState('guest');
  const [targetId, setTargetId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ type, targetType, targetId });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">New Data Export Job</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operation Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="export">Export (downloadable)</option>
              <option value="anonymize">Anonymize (in-place)</option>
              <option value="delete">Delete (GDPR erasure)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target Type</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="guest">Guest</option>
              <option value="user">User</option>
              <option value="tenant">Tenant (all data)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target ID</label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter ID..."
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Retention Modal ───
export function RetentionModal({ policy, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    guestDataMonths: policy.guestDataMonths,
    auditLogMonths: policy.auditLogMonths,
    reservationArchiveYears: policy.reservationArchiveYears,
    autoAnonymize: policy.autoAnonymize,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Retention Policy</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Guest Data Retention (months)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={formData.guestDataMonths}
              onChange={(e) =>
                setFormData({ ...formData, guestDataMonths: parseInt(e.target.value) })
              }
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Audit Log Retention (months)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={formData.auditLogMonths}
              onChange={(e) =>
                setFormData({ ...formData, auditLogMonths: parseInt(e.target.value) })
              }
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reservation Archive (years)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.reservationArchiveYears}
              onChange={(e) =>
                setFormData({ ...formData, reservationArchiveYears: parseInt(e.target.value) })
              }
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoAnonymize"
              checked={formData.autoAnonymize}
              onChange={(e) => setFormData({ ...formData, autoAnonymize: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="autoAnonymize" className="text-sm">
              Enable auto-anonymization
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Anonymize Modal ───
export function AnonymizeModal({ onClose, onPreview }) {
  const [targetType, setTargetType] = useState('guest');
  const [targetId, setTargetId] = useState('');
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const result = await onPreview(targetType, targetId);
      setPreview(result);
    } catch (err) {
      alert('Preview failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Anonymization Preview</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="guest">Guest</option>
              <option value="user">User</option>
            </select>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Target ID"
              className="flex-1 border rounded-md px-3 py-2"
            />
            <button
              onClick={handlePreview}
              disabled={isLoading || !targetId}
              className="px-4 py-2 text-sm bg-secondary rounded-md hover:bg-secondary/80 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Preview'}
            </button>
          </div>

          {preview && (
            <div className="border rounded-lg p-4 bg-muted space-y-3">
              <div className="text-sm font-medium">Fields to be anonymized:</div>
              <div className="space-y-2">
                {preview.fields.map((field) => (
                  <div key={field.field} className="flex justify-between text-sm">
                    <span className="font-mono">{field.field}</span>
                    <span className="text-muted-foreground">{field.willBecome}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {preview.relatedRecords} related records will be affected
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Erasure Modal ───
export function ErasureModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-2">Data Erasure</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Erasure requests are managed through the Erasure Requests tab. Use the table actions to
          approve or reject incoming requests.
        </p>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Export Detail Drawer ───
export function ExportDetailDrawer({ job, onClose, onDownload }) {
  const statusColors = {
    pending: 'text-yellow-600',
    processing: 'text-blue-600',
    completed: 'text-green-600',
    failed: 'text-red-600',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Export Job Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-bold ${statusColors[job.status]}`}>{job.status}</div>
            {job.status === 'processing' && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">ID</span>
              <span className="text-sm font-mono">{job.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm capitalize">{job.type}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Target</span>
              <span className="text-sm">
                {job.targetType}: {job.targetId}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Requested By</span>
              <span className="text-sm">{job.requestedBy}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{new Date(job.createdAt).toLocaleString()}</span>
            </div>
            {job.completedAt && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="text-sm">{new Date(job.completedAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Progress</div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            <div className="text-right text-sm text-muted-foreground mt-1">{job.progress}%</div>
          </div>

          {job.errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                <AlertTriangle className="w-4 h-4" />
                Error
              </div>
              <p className="text-sm text-red-700">{job.errorMessage}</p>
            </div>
          )}

          {job.status === 'completed' && (
            <button
              onClick={onDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
            >
              <Download className="w-4 h-4" />
              Download Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
