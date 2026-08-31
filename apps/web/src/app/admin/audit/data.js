/* src/app/admin/audit/data.js */

/* ─── Audit Action Categories ─── */
export const actionCategories = {
  auth: { label: 'Authentication', icon: 'KeyRound', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  tenant: { label: 'Tenant Management', icon: 'Building2', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  user: { label: 'User Management', icon: 'Users', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  billing: { label: 'Billing', icon: 'CreditCard', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  data: { label: 'Data Access', icon: 'Database', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  config: { label: 'Configuration', icon: 'Settings', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  security: { label: 'Security', icon: 'Shield', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  api: { label: 'API', icon: 'Globe', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
};

/* ─── Severity Levels ─── */
export const severityMeta = {
  critical: { label: 'Critical', dot: 'bg-rose-500', class: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  high: { label: 'High', dot: 'bg-orange-500', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  medium: { label: 'Medium', dot: 'bg-amber-500', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  low: { label: 'Low', dot: 'bg-blue-500', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  info: { label: 'Info', dot: 'bg-slate-400', class: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
};

/* ─── Status Meta ─── */
export const statusMeta = {
  verified: { label: 'Verified', dot: 'bg-emerald-500', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  flagged: { label: 'Flagged', dot: 'bg-rose-500', class: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  pending_review: { label: 'Pending Review', dot: 'bg-amber-500', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  archived: { label: 'Archived', dot: 'bg-slate-400', class: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
};

/* ─── Compliance Frameworks ─── */
export const complianceFrameworks = [
  { id: 'gdpr', label: 'GDPR', description: 'General Data Protection Regulation (EU)' },
  { id: 'hipaa', label: 'HIPAA', description: 'Health Insurance Portability and Accountability Act (US)' },
  { id: 'pci-dss', label: 'PCI DSS', description: 'Payment Card Industry Data Security Standard' },
  { id: 'sox', label: 'SOX', description: 'Sarbanes-Oxley Act' },
  { id: 'iso27001', label: 'ISO 27001', description: 'Information Security Management' },
  { id: 'soc2', label: 'SOC 2', description: 'Service Organization Control 2' },
];

/* ─── Export Formats ─── */
export const exportFormats = [
  { id: 'csv', label: 'CSV', ext: '.csv', mime: 'text/csv' },
  { id: 'json', label: 'JSON', ext: '.json', mime: 'application/json' },
  { id: 'pdf', label: 'PDF Report', ext: '.pdf', mime: 'application/pdf' },
  { id: 'syslog', label: 'Syslog RFC 5424', ext: '.log', mime: 'text/plain' },
];

/* ─── Mock Audit Logs ─── */
export const initialAuditLogs = [
  {
    id: 'AUD-2026-0816-001',
    timestamp: '2026-08-16 23:45:12',
    actor: { id: 'USR-001', name: 'Alex Morgan', email: 'alex@admin.com', role: 'super_admin', ip: '192.168.1.45', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    action: { type: 'tenant.suspend', category: 'tenant', label: 'Tenant Suspended', description: 'Suspended tenant TNT-004 (Downtown Suites Chicago) due to overdue payment' },
    target: { type: 'tenant', id: 'TNT-004', name: 'Downtown Suites Chicago' },
    severity: 'high',
    status: 'verified',
    tamperProof: { hash: 'a3f7c9...e2d1', signature: 'SHA-256-RSA', previousHash: 'b8e2d1...a4c5' },
    sessionId: 'sess_abc123',
    shadowSession: false,
    metadata: { reason: 'Payment overdue 3x', previousStatus: 'active' },
  },
  {
    id: 'AUD-2026-0816-002',
    timestamp: '2026-08-16 23:30:08',
    actor: { id: 'USR-001', name: 'Alex Morgan', email: 'alex@admin.com', role: 'super_admin', ip: '192.168.1.45', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    action: { type: 'user.create', category: 'user', label: 'User Created', description: 'Created new admin user for tenant TNT-001' },
    target: { type: 'user', id: 'USR-042', name: 'Sarah Johnson', tenantId: 'TNT-001' },
    severity: 'medium',
    status: 'verified',
    tamperProof: { hash: 'c5d8e2...f1a3', signature: 'SHA-256-RSA', previousHash: 'a3f7c9...e2d1' },
    sessionId: 'sess_abc123',
    shadowSession: false,
    metadata: { role: 'manager', invitedBy: 'Alex Morgan' },
  },
  {
    id: 'AUD-2026-0816-003',
    timestamp: '2026-08-16 22:15:33',
    actor: { id: 'SYS', name: 'System', email: 'system@vimad.io', role: 'system', ip: '127.0.0.1', userAgent: 'Vimad-Worker/3.1.0' },
    action: { type: 'security.anomaly_detected', category: 'security', label: 'Anomaly Detected', description: 'Unusual login pattern detected: 47 failed attempts from IP 203.0.113.45' },
    target: { type: 'ip', id: '203.0.113.45', name: '203.0.113.45' },
    severity: 'critical',
    status: 'flagged',
    tamperProof: { hash: 'e1b4a7...d9c2', signature: 'SHA-256-RSA', previousHash: 'c5d8e2...f1a3' },
    sessionId: 'system',
    shadowSession: false,
    metadata: { failedAttempts: 47, timeWindow: '5m', geoLocation: 'Unknown', actionTaken: 'IP blocked for 24h' },
  },
  {
    id: 'AUD-2026-0816-004',
    timestamp: '2026-08-16 21:50:19',
    actor: { id: 'USR-015', name: 'Robert Chen', email: 'robert@admin.com', role: 'admin', ip: '10.0.0.22', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    action: { type: 'billing.invoice_generated', category: 'billing', label: 'Invoice Generated', description: 'Generated monthly invoice for tenant TNT-002' },
    target: { type: 'invoice', id: 'INV-2026-0816-002', name: 'Invoice #INV-2026-0816-002', tenantId: 'TNT-002' },
    severity: 'low',
    status: 'verified',
    tamperProof: { hash: 'f2c5b8...e0d3', signature: 'SHA-256-RSA', previousHash: 'e1b4a7...d9c2' },
    sessionId: 'sess_def456',
    shadowSession: false,
    metadata: { amount: 499.0, currency: 'USD', items: ['Professional Plan', 'API Overage'] },
  },
  {
    id: 'AUD-2026-0816-005',
    timestamp: '2026-08-16 20:12:44',
    actor: { id: 'USR-001', name: 'Alex Morgan', email: 'alex@admin.com', role: 'super_admin', ip: '192.168.1.45', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    action: { type: 'config.feature_flag_toggle', category: 'config', label: 'Feature Flag Toggled', description: 'Enabled feature flag "ai-revenue-manager" for all Enterprise tenants' },
    target: { type: 'feature_flag', id: 'FF-001', name: 'AI Revenue Manager' },
    severity: 'medium',
    status: 'verified',
    tamperProof: { hash: 'd4e7f1...c8b2', signature: 'SHA-256-RSA', previousHash: 'f2c5b8...e0d3' },
    sessionId: 'sess_abc123',
    shadowSession: false,
    metadata: { previousValue: '35%', newValue: '100%', rolloutType: 'percentage' },
  },
  {
    id: 'AUD-2026-0816-006',
    timestamp: '2026-08-16 19:38:27',
    actor: { id: 'USR-023', name: 'Lisa Wong', email: 'lisa@admin.com', role: 'admin', ip: '172.16.0.8', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
    action: { type: 'data.export', category: 'data', label: 'Data Export', description: 'Exported guest data for tenant TNT-007' },
    target: { type: 'data_export', id: 'EXP-2026-0816-001', name: 'Guest Data Export', tenantId: 'TNT-007' },
    severity: 'high',
    status: 'verified',
    tamperProof: { hash: 'b9a3d6...f5e1', signature: 'SHA-256-RSA', previousHash: 'd4e7f1...c8b2' },
    sessionId: 'sess_ghi789',
    shadowSession: false,
    metadata: { recordCount: 15420, format: 'CSV', gdprCompliant: true, retentionDays: 30 },
  },
  {
    id: 'AUD-2026-0816-007',
    timestamp: '2026-08-16 18:05:11',
    actor: { id: 'USR-001', name: 'Alex Morgan', email: 'alex@admin.com', role: 'super_admin', ip: '192.168.1.45', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    action: { type: 'tenant.plan_change', category: 'tenant', label: 'Plan Changed', description: 'Upgraded tenant TNT-005 from Starter to Professional' },
    target: { type: 'tenant', id: 'TNT-005', name: 'Coastal Inn San Diego' },
    severity: 'medium',
    status: 'verified',
    tamperProof: { hash: 'c8f2e5...a4d7', signature: 'SHA-256-RSA', previousHash: 'b9a3d6...f5e1' },
    sessionId: 'sess_abc123',
    shadowSession: false,
    metadata: { previousPlan: 'Starter', newPlan: 'Professional', effectiveDate: '2026-09-01' },
  },
  {
    id: 'AUD-2026-0816-008',
    timestamp: '2026-08-16 16:22:55',
    actor: { id: 'USR-042', name: 'Sarah Johnson', email: 'sarah@grandhotel.com', role: 'manager', ip: '203.0.113.88', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' },
    action: { type: 'auth.login_failed', category: 'auth', label: 'Login Failed', description: 'Failed login attempt — invalid credentials' },
    target: { type: 'user', id: 'USR-042', name: 'Sarah Johnson' },
    severity: 'medium',
    status: 'flagged',
    tamperProof: { hash: 'e7d4a1...b6c3', signature: 'SHA-256-RSA', previousHash: 'c8f2e5...a4d7' },
    sessionId: 'sess_jkl012',
    shadowSession: false,
    metadata: { failureReason: 'invalid_password', attemptCount: 3, mfaRequired: false },
  },
  {
    id: 'AUD-2026-0816-009',
    timestamp: '2026-08-16 15:10:03',
    actor: { id: 'SYS', name: 'System', email: 'system@vimad.io', role: 'system', ip: '127.0.0.1', userAgent: 'Vimad-Scheduler/2.4.1' },
    action: { type: 'security.cert_rotation', category: 'security', label: 'Certificate Rotated', description: 'Automatic TLS certificate rotation completed' },
    target: { type: 'certificate', id: 'cert_api_gateway', name: 'API Gateway TLS Certificate' },
    severity: 'low',
    status: 'verified',
    tamperProof: { hash: 'a5c8e3...d7f2', signature: 'SHA-256-RSA', previousHash: 'e7d4a1...b6c3' },
    sessionId: 'system',
    shadowSession: false,
    metadata: { previousExpiry: '2026-09-15', newExpiry: '2026-11-15', issuer: "Let's Encrypt" },
  },
  {
    id: 'AUD-2026-0816-010',
    timestamp: '2026-08-16 14:48:37',
    actor: { id: 'USR-001', name: 'Alex Morgan', email: 'alex@admin.com', role: 'super_admin', ip: '192.168.1.45', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    action: { type: 'api.key_revoked', category: 'api', label: 'API Key Revoked', description: 'Revoked compromised API key for tenant TNT-003' },
    target: { type: 'api_key', id: 'key_mountainlodge_001', name: 'Production API Key', tenantId: 'TNT-003' },
    severity: 'high',
    status: 'verified',
    tamperProof: { hash: 'f6b9d2...e5a4', signature: 'SHA-256-RSA', previousHash: 'a5c8e3...d7f2' },
    sessionId: 'sess_abc123',
    shadowSession: false,
    metadata: { reason: 'suspected_exposure', rotationTriggered: true, newKeyIssued: true },
  },
  {
    id: 'AUD-2026-0816-011',
    timestamp: '2026-08-16 13:25:19',
    actor: { id: 'USR-015', name: 'Robert Chen', email: 'robert@admin.com', role: 'admin', ip: '10.0.0.22', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    action: { type: 'billing.refund_processed', category: 'billing', label: 'Refund Processed', description: 'Processed partial refund for tenant TNT-004' },
    target: { type: 'transaction', id: 'TXN-2026-0816-003', name: 'Refund Transaction', tenantId: 'TNT-004' },
    severity: 'medium',
    status: 'verified',
    tamperProof: { hash: 'd3a7f5...c9e2', signature: 'SHA-256-RSA', previousHash: 'f6b9d2...e5a4' },
    sessionId: 'sess_def456',
    shadowSession: false,
    metadata: { amount: 199.0, currency: 'USD', reason: 'service_interruption', approvedBy: 'Robert Chen' },
  },
  {
    id: 'AUD-2026-0816-012',
    timestamp: '2026-08-16 12:00:00',
    actor: { id: 'SYS', name: 'System', email: 'system@vimad.io', role: 'system', ip: '127.0.0.1', userAgent: 'Vimad-Audit/1.0.0' },
    action: { type: 'security.integrity_check', category: 'security', label: 'Integrity Check', description: 'Daily audit log integrity verification completed' },
    target: { type: 'audit_log', id: 'all', name: 'Complete Audit Log' },
    severity: 'info',
    status: 'verified',
    tamperProof: { hash: 'b2e6d4...a8f1', signature: 'SHA-256-RSA', previousHash: 'd3a7f5...c9e2' },
    sessionId: 'system',
    shadowSession: false,
    metadata: { logsVerified: 1247, chainValid: true, anomaliesFound: 0 },
  },
  {
    id: 'AUD-2026-0816-013',
    timestamp: '2026-08-16 11:34:52',
    actor: { id: 'USR-001', name: 'Alex Morgan', email: 'alex@admin.com', role: 'super_admin', ip: '192.168.1.45', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    action: { type: 'tenant.data_deletion', category: 'tenant', label: 'Data Deletion Request', description: 'Initiated GDPR data deletion for tenant TNT-008 (Desert Oasis Phoenix)' },
    target: { type: 'tenant', id: 'TNT-008', name: 'Desert Oasis Phoenix' },
    severity: 'critical',
    status: 'pending_review',
    tamperProof: { hash: 'e9c3a6...f4d8', signature: 'SHA-256-RSA', previousHash: 'b2e6d4...a8f1' },
    sessionId: 'sess_abc123',
    shadowSession: false,
    metadata: { gdprArticle: '17', deletionType: 'full', retentionOverride: false, legalHold: false },
  },
  {
    id: 'AUD-2026-0816-014',
    timestamp: '2026-08-16 10:15:28',
    actor: { id: 'USR-023', name: 'Lisa Wong', email: 'lisa@admin.com', role: 'admin', ip: '172.16.0.8', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
    action: { type: 'config.sso_configured', category: 'config', label: 'SSO Configured', description: 'Configured SAML 2.0 SSO for tenant TNT-001' },
    target: { type: 'tenant', id: 'TNT-001', name: 'Grand Hotel Boston' },
    severity: 'medium',
    status: 'verified',
    tamperProof: { hash: 'c4f8e1...b7a5', signature: 'SHA-256-RSA', previousHash: 'e9c3a6...f4d8' },
    sessionId: 'sess_ghi789',
    shadowSession: false,
    metadata: { provider: 'Okta', protocol: 'SAML 2.0', enforceMfa: true },
  },
  {
    id: 'AUD-2026-0816-015',
    timestamp: '2026-08-16 09:42:17',
    actor: { id: 'USR-015', name: 'Robert Chen', email: 'robert@admin.com', role: 'admin', ip: '10.0.0.22', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    action: { type: 'api.rate_limit_hit', category: 'api', label: 'Rate Limit Exceeded', description: 'Tenant TNT-007 exceeded API rate limit (100,000 req/hr)' },
    target: { type: 'tenant', id: 'TNT-007', name: 'Urban Hotel NYC' },
    severity: 'medium',
    status: 'flagged',
    tamperProof: { hash: 'a7d5f3...e2b9', signature: 'SHA-256-RSA', previousHash: 'c4f8e1...b7a5' },
    sessionId: 'sess_def456',
    shadowSession: false,
    metadata: { limit: 100000, actual: 124832, window: '1h', actionTaken: 'throttled' },
  },
];

/* ─── Mock Anomalies ─── */
export const initialAnomalies = [
  {
    id: 'ANM-001',
    detectedAt: '2026-08-16 22:15:33',
    severity: 'critical',
    type: 'brute_force',
    title: 'Brute Force Attack Detected',
    description: '47 failed login attempts from IP 203.0.113.45 within 5 minutes. IP automatically blocked.',
    sourceIp: '203.0.113.45',
    affectedTargets: ['auth-service', 'tenant-TNT-003'],
    relatedLogs: ['AUD-2026-0816-003', 'AUD-2026-0816-008'],
    status: 'active',
    confidence: 0.97,
    recommendedAction: 'Review IP block list, notify tenant admin, consider 2FA enforcement',
  },
  {
    id: 'ANM-002',
    detectedAt: '2026-08-16 15:10:03',
    severity: 'high',
    type: 'api_abuse',
    title: 'API Rate Limit Abuse Pattern',
    description: 'Tenant TNT-007 consistently exceeds rate limits during off-peak hours. Possible scraping activity.',
    sourceIp: '198.51.100.22',
    affectedTargets: ['api-gateway', 'tenant-TNT-007'],
    relatedLogs: ['AUD-2026-0816-015'],
    status: 'investigating',
    confidence: 0.84,
    recommendedAction: 'Contact tenant admin, review API usage patterns, consider plan upgrade',
  },
  {
    id: 'ANM-003',
    detectedAt: '2026-08-16 09:42:17',
    severity: 'medium',
    type: 'privilege_escalation',
    title: 'Suspicious Privilege Escalation',
    description: 'Admin user Robert Chen granted super_admin role to themselves outside normal change window.',
    sourceIp: '10.0.0.22',
    affectedTargets: ['user-USR-015'],
    relatedLogs: ['AUD-2026-0816-015'],
    status: 'resolved',
    confidence: 0.91,
    recommendedAction: 'Role change reverted, user notified, additional approval workflow implemented',
  },
  {
    id: 'ANM-004',
    detectedAt: '2026-08-16 08:30:00',
    severity: 'medium',
    type: 'unusual_access',
    title: 'Unusual Data Access Pattern',
    description: 'User Lisa Wong exported 15,420 guest records — 10x above daily average for this user.',
    sourceIp: '172.16.0.8',
    affectedTargets: ['data-export-service', 'tenant-TNT-007'],
    relatedLogs: ['AUD-2026-0816-006'],
    status: 'investigating',
    confidence: 0.78,
    recommendedAction: 'Verify business justification, check for data exfiltration indicators',
  },
  {
    id: 'ANM-005',
    detectedAt: '2026-08-16 03:14:00',
    severity: 'low',
    type: 'off_hours_access',
    title: 'Off-Hours Administrative Access',
    description: 'Super admin Alex Morgan accessed tenant management at 03:14 UTC — outside typical access window.',
    sourceIp: '192.168.1.45',
    affectedTargets: ['admin-panel'],
    relatedLogs: ['AUD-2026-0816-001'],
    status: 'resolved',
    confidence: 0.65,
    recommendedAction: 'Confirmed: scheduled maintenance window. No action required.',
  },
];

/* ─── Mock Compliance Reports ─── */
export const complianceReports = [
  { id: 'RPT-001', framework: 'gdpr', period: '2026-08-01 to 2026-08-16', generatedAt: '2026-08-16 12:00:00', generatedBy: 'System', recordCount: 1247, status: 'complete', downloadUrl: '#' },
  { id: 'RPT-002', framework: 'pci-dss', period: '2026-08-01 to 2026-08-16', generatedAt: '2026-08-16 12:00:00', generatedBy: 'System', recordCount: 89, status: 'complete', downloadUrl: '#' },
  { id: 'RPT-003', framework: 'iso27001', period: '2026-07-01 to 2026-08-16', generatedAt: '2026-08-01 00:00:00', generatedBy: 'Alex Morgan', recordCount: 3847, status: 'complete', downloadUrl: '#' },
];

/* ─── Helpers ─── */
export function timeAgo(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T'));
  const now = new Date('2026-08-16T23:59:59');
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatDateTime(timestamp) {
  const date = new Date(timestamp.replace(' ', 'T'));
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function generateChainHash(logs) {
  // Simulate blockchain-style hash chain verification
  return logs.map((log, idx) => ({
    ...log,
    chainValid: idx === 0 ? true : log.tamperProof.previousHash === logs[idx - 1].tamperProof.hash,
  }));
}

export function verifyLogIntegrity(log) {
  return {
    hashValid: log.tamperProof.hash.length === 14, // Simulated validation
    signatureValid: log.tamperProof.signature === 'SHA-256-RSA',
    chainLinked: !!log.tamperProof.previousHash,
    shadowExcluded: !log.shadowSession,
  };
}
