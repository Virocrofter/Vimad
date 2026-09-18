/* src/app/guest-portal/profile/documents/page.jsx */
import { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Shield,
  Upload,
  Camera,
  Check,
  X,
  Loader2,
  Eye,
  Trash2,
  Download,
  Lock,
  AlertTriangle,
  Info,
  BookOpen,
  Car,
  IdCard,
  Plane,
  FileCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { guestProfile, documentTypes, formatDate } from '../../data';
import { SectionHeader, FileUploadZone, DocumentCard, EmptyState } from '../../components';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(guestProfile.documents);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('passport');
  const [uploadCountry, setUploadCountry] = useState('');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const newDoc = {
      id: `DOC-${Date.now().toString(36).toUpperCase()}`,
      type: uploadType,
      country: uploadCountry || 'US',
      numberHash: `sha256:${Math.random().toString(36).substring(7)}`,
      expiryDate: uploadExpiry || '2030-01-01',
      verified: false,
      fileName: files[0].name,
      uploadedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [...prev, newDoc]);
    setUploading(false);
    setShowUploadModal(false);
    setUploadCountry('');
    setUploadExpiry('');
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const typeIcons = {
    passport: BookOpen,
    drivers_license: Car,
    national_id: IdCard,
    visa: Plane,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <a
          href="/guest-portal/profile"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Documents & IDs</h1>
          <p className="text-sm text-text-secondary">Securely store your travel documents</p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-primary">Bank-Level Encryption</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Your documents are encrypted with AES-256 both at rest and in transit. Only you and
            authorized hotel staff can access them. Documents are automatically deleted 30 days
            after checkout.
          </p>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-text-primary">{documents.length}</p>
          <p className="text-xs text-text-muted">Documents</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-accent">
            {documents.filter((d) => d.verified).length}
          </p>
          <p className="text-xs text-text-muted">Verified</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-warning">
            {documents.filter((d) => !d.verified).length}
          </p>
          <p className="text-xs text-text-muted">Pending</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold font-mono text-info">
            {documents.filter((d) => new Date(d.expiryDate) < new Date('2027-01-01')).length}
          </p>
          <p className="text-xs text-text-muted">Expiring Soon</p>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">Your Documents</h2>
        <Button size="sm" onClick={() => setShowUploadModal(true)}>
          <Upload className="mr-1.5 h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* Documents Grid */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDelete={() => handleDelete(doc.id)}
              onView={() => setPreviewDoc(doc)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Upload your passport, ID, or visa for faster check-in."
          action={
            <Button size="sm" onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-1.5 h-4 w-4" /> Upload First Document
            </Button>
          }
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
                  <Upload className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Upload Document</h3>
                  <p className="text-xs text-text-muted">Securely upload your travel document</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Document Type */}
              <div>
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Document Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {documentTypes.map((type) => {
                    const Icon = typeIcons[type.id] || FileText;
                    const active = uploadType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setUploadType(type.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                          active
                            ? 'border-secondary bg-secondary/5 text-secondary'
                            : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Country & Expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                    Issuing Country
                  </label>
                  <input
                    type="text"
                    value={uploadCountry}
                    onChange={(e) => setUploadCountry(e.target.value)}
                    placeholder="e.g. US"
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={uploadExpiry}
                    onChange={(e) => setUploadExpiry(e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Upload Zone */}
              <FileUploadZone onUpload={handleUpload} accept="image/*,.pdf" maxSize={10} />

              {/* Privacy Note */}
              <div className="rounded-lg border border-border bg-surface p-3 flex items-start gap-2">
                <Lock className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted">
                  Your document will be encrypted and stored securely. Only you and authorized hotel
                  staff can access it. We never share your documents with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-2xl">
            <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
                  <Eye className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary capitalize">
                    {previewDoc.type.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {previewDoc.country} · Expires {formatDate(previewDoc.expiryDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg border border-border bg-surface p-8 text-center">
                <Lock className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary">Document Preview</p>
                <p className="text-xs text-text-muted mt-1">
                  For security, document images are not displayed in the preview.
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  ID: {previewDoc.id} · Hash: {previewDoc.numberHash.slice(0, 20)}...
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Type</span>
                  <span className="font-medium text-text-primary capitalize">
                    {previewDoc.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Country</span>
                  <span className="font-medium text-text-primary">{previewDoc.country}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Uploaded</span>
                  <span className="font-medium text-text-primary">
                    {formatDate(previewDoc.uploadedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Status</span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                      previewDoc.verified
                        ? 'bg-accent/10 text-accent'
                        : 'bg-warning/10 text-warning'
                    )}
                  >
                    {previewDoc.verified ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {previewDoc.verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setPreviewDoc(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDelete(previewDoc.id)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
