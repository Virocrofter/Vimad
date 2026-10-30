/* src/app/guest-portal/profile/documents/page.jsx — G3: documents vault */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  BadgeCheck,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { getGuestToken } from '../../../../hooks/guestPortalApi';
import {
  useGuestDocuments,
  useAddGuestDocument,
  useUploadGuestDocument,
} from '../../../../hooks/useGuestProfile';
import { formatDate } from '../../../../lib/guest-utils';

const verifyMeta = {
  pending: {
    label: 'Pending verification',
    chip: 'bg-warning/10 text-warning border-warning/20',
    icon: Clock,
  },
  verified: {
    label: 'Verified',
    chip: 'bg-accent/10 text-accent border-accent/20',
    icon: BadgeCheck,
  },
  rejected: {
    label: 'Rejected — see front desk',
    chip: 'bg-danger/10 text-danger border-danger/20',
    icon: XCircle,
  },
};

const typeLabels = {
  passport: 'Passport',
  national_id: 'National ID',
  driver_license: "Driver's Licence",
  other: 'Other',
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const hasToken = Boolean(getGuestToken());
  const { data, isLoading, isError, refetch } = useGuestDocuments();
  const addDoc = useAddGuestDocument();
  const upload = useUploadGuestDocument();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'passport', number: '', issuedBy: '', expiryDate: '' });
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);
  const pendingUploadIdRef = useRef(null);

  useEffect(() => {
    if (!hasToken) navigate('/guest-portal/auth/login', { replace: true });
  }, [hasToken, navigate]);

  if (!hasToken) return null;

  const handleAdd = () => {
    setFeedback(null);
    addDoc.mutate(
      {
        type: form.type,
        number: form.number.trim() || undefined,
        issuedBy: form.issuedBy.trim() || undefined,
        expiryDate: form.expiryDate || undefined,
      },
      {
        onSuccess: (d) => {
          setFeedback({
            ok: true,
            text: 'Document added — now attach a scan or photo to speed up verification.',
          });
          setShowForm(false);
          setForm({ type: 'passport', number: '', issuedBy: '', expiryDate: '' });
          pendingUploadIdRef.current = d.document.id;
          setTimeout(() => fileInputRef.current?.click(), 250);
        },
        onError: (e) => setFeedback({ ok: false, text: e.message }),
      }
    );
  };

  const handleFile = (e, docId) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFeedback(null);
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ ok: false, text: 'File exceeds the 5MB limit.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const base64 = dataUrl.split(',')[1] ?? '';
      upload.mutate(
        {
          docId,
          fileName: file.name,
          contentBase64: base64,
          contentType: file.type || 'application/octet-stream',
        },
        {
          onSuccess: () =>
            setFeedback({
              ok: true,
              text: 'File uploaded — the front desk will verify it shortly.',
            }),
          onError: (err) => setFeedback({ ok: false, text: err.message }),
        }
      );
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary mb-3" />
        <p className="text-sm text-text-muted">Loading your documents…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-warning mb-3" />
        <p className="text-sm text-text-muted">We couldn't load your documents.</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const documents = data.documents ?? [];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/profile')}
          className="rounded-lg border border-border bg-surface p-2 hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Travel Documents</h1>
          <p className="text-xs text-text-muted">Upload once — pre-check-in is faster next time</p>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            feedback.ok ? 'border-accent/20 bg-accent/5' : 'border-danger/20 bg-danger/5'
          )}
        >
          {feedback.ok ? (
            <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
          )}
          <p className="text-sm text-text-primary">{feedback.text}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => pendingUploadIdRef.current && handleFile(e, pendingUploadIdRef.current)}
      />

      {documents.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <FileText className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No documents on file yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((d) => {
            const meta = verifyMeta[d.verificationStatus] ?? verifyMeta.pending;
            const Icon = meta.icon;
            return (
              <div key={d.id} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary">
                    {typeLabels[d.type] ?? d.type}
                  </p>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      meta.chip
                    )}
                  >
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                </div>
                <div className="text-xs text-text-muted space-y-0.5">
                  {d.number && <p>No. {d.number}</p>}
                  {d.issuedBy && <p>Issued by {d.issuedBy}</p>}
                  {d.expiryDate && <p>Expires {formatDate(d.expiryDate)}</p>}
                  <p>Added {formatDate(d.createdAt)}</p>
                </div>
                <div className="pt-1">
                  {d.fileUrl ? (
                    <p className="text-[11px] text-accent flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> File attached
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={upload.isPending}
                      onClick={() => {
                        pendingUploadIdRef.current = d.id;
                        fileInputRef.current?.click();
                      }}
                    >
                      {upload.isPending ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="mr-1 h-3.5 w-3.5" />
                      )}
                      Attach file
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Add a document</h3>
          <div>
            <label className="text-xs text-text-muted block mb-1">Document type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="passport">Passport</option>
              <option value="national_id">National ID</option>
              <option value="driver_license">Driver's Licence</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Document number</label>
            <input
              value={form.number}
              onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Issued by</label>
            <input
              value={form.issuedBy}
              onChange={(e) => setForm((f) => ({ ...f, issuedBy: e.target.value }))}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">Expiry date</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={addDoc.isPending} onClick={handleAdd}>
              {addDoc.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Add document
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full" variant="outline" onClick={() => setShowForm(true)}>
          <FileText className="mr-2 h-4 w-4" /> Add a document
        </Button>
      )}
    </div>
  );
}
