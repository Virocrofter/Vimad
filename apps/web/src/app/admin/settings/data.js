/* src/app/admin/settings/data.js */

/* ─── Platform Config ─── */
export const initialPlatformConfig = {
  platformName: 'Vimad',
  supportEmail: 'support@vimad.io',
  senderName: 'Vimad Platform',
  replyToEmail: 'noreply@vimad.io',
  defaultTimezone: 'America/New_York',
  defaultCurrency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  language: 'en',
  maxFileUploadSize: 50, // MB
  allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'],
  sessionTimeout: 30, // minutes
  maxLoginAttempts: 5,
  lockoutDuration: 30, // minutes
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  passwordRequireUppercase: true,
  mfaEnabled: true,
  mfaRequiredForAdmins: true,
  ssoEnabled: false,
  ssoProvider: null,
  apiRateLimit: 1000, // requests per minute
  webhookTimeout: 30, // seconds
  dataRetentionDays: 2555, // 7 years
  autoBackupEnabled: true,
  backupFrequency: 'daily',
  backupRetentionCount: 30,
};

/* ─── Email Templates ─── */
export const initialEmailTemplates = [
  {
    id: 'welcome-tenant',
    name: 'Welcome New Tenant',
    subject: 'Welcome to {{platformName}} — Your property is ready!',
    category: 'onboarding',
    enabled: true,
    lastModified: '2026-08-10',
    modifiedBy: 'Robert Chen',
    variables: ['tenantName', 'subdomain', 'loginUrl', 'platformName'],
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Welcome</title></head>
<body style="font-family: Inter, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
  <div style="padding: 40px 24px;">
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Welcome to {{platformName}}, {{tenantName}}!</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Your property management system is now live at <a href="https://{{subdomain}}.vimad.io" style="color: #3b82f6;">{{subdomain}}.vimad.io</a>.
    </p>
    <a href="{{loginUrl}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Access Your Dashboard</a>
    <p style="font-size: 14px; color: #94a3b8; margin-top: 32px;">Need help? Reply to this email or contact support.</p>
  </div>
</body>
</html>`,
  },
  {
    id: 'invoice-reminder',
    name: 'Invoice Reminder',
    subject: 'Invoice {{invoiceNumber}} — Payment Due {{dueDate}}',
    category: 'billing',
    enabled: true,
    lastModified: '2026-08-12',
    modifiedBy: 'Sarah J.',
    variables: ['tenantName', 'invoiceNumber', 'dueDate', 'amount', 'paymentUrl'],
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice Reminder</title></head>
<body style="font-family: Inter, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
  <div style="padding: 40px 24px;">
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Payment Reminder</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #475569;">Hi {{tenantName}},</p>
    <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      This is a friendly reminder that invoice <strong>{{invoiceNumber}}</strong> for <strong>{{amount}}</strong> is due on <strong>{{dueDate}}</strong>.
    </p>
    <a href="{{paymentUrl}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Pay Now</a>
  </div>
</body>
</html>`,
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset your {{platformName}} password',
    category: 'security',
    enabled: true,
    lastModified: '2026-07-20',
    modifiedBy: 'System',
    variables: ['userName', 'resetUrl', 'expiryHours', 'platformName'],
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Password Reset</title></head>
<body style="font-family: Inter, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
  <div style="padding: 40px 24px;">
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Password Reset Requested</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Hi {{userName}}, we received a request to reset your password. Click below to set a new one. This link expires in {{expiryHours}} hours.
    </p>
    <a href="{{resetUrl}}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Reset Password</a>
    <p style="font-size: 14px; color: #94a3b8; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
  },
  {
    id: 'trial-expiring',
    name: 'Trial Expiring Soon',
    subject: 'Your {{platformName}} trial expires in {{daysLeft}} days',
    category: 'billing',
    enabled: true,
    lastModified: '2026-08-05',
    modifiedBy: 'Maria Garcia',
    variables: ['tenantName', 'daysLeft', 'upgradeUrl', 'platformName'],
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Trial Expiring</title></head>
<body style="font-family: Inter, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
  <div style="padding: 40px 24px;">
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Don't Lose Access</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Hi {{tenantName}}, your free trial expires in <strong>{{daysLeft}} days</strong>. Upgrade now to keep your data and continue using {{platformName}}.
    </p>
    <a href="{{upgradeUrl}}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Upgrade Now</a>
  </div>
</body>
</html>`,
  },
  {
    id: 'maintenance-notice',
    name: 'Scheduled Maintenance',
    subject: 'Scheduled Maintenance — {{platformName}} on {{date}}',
    category: 'system',
    enabled: false,
    lastModified: '2026-08-01',
    modifiedBy: 'DevOps Team',
    variables: ['date', 'startTime', 'endTime', 'timezone', 'affectedServices', 'platformName'],
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Maintenance</title></head>
<body style="font-family: Inter, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
  <div style="padding: 40px 24px;">
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Scheduled Maintenance</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      We'll be performing scheduled maintenance on <strong>{{date}}</strong> from <strong>{{startTime}} to {{endTime}} {{timezone}}</strong>.
      Affected services: {{affectedServices}}.
    </p>
    <p style="font-size: 14px; color: #94a3b8;">We apologize for any inconvenience.</p>
  </div>
</body>
</html>`,
  },
  {
    id: 'security-alert',
    name: 'Security Alert',
    subject: 'Security Alert: New login from {{location}}',
    category: 'security',
    enabled: true,
    lastModified: '2026-07-15',
    modifiedBy: 'Security Team',
    variables: ['userName', 'location', 'device', 'ipAddress', 'time', 'reviewUrl'],
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Security Alert</title></head>
<body style="font-family: Inter, sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto;">
  <div style="padding: 40px 24px;">
    <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #ef4444;">New Login Detected</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
      Hi {{userName}}, we detected a new login to your account from {{location}} on {{device}} (IP: {{ipAddress}}) at {{time}}.
    </p>
    <a href="{{reviewUrl}}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Review Activity</a>
    <p style="font-size: 14px; color: #94a3b8; margin-top: 32px;">If this was you, no action is needed.</p>
  </div>
</body>
</html>`,
  },
];

/* ─── Branding Config ─── */
export const initialBranding = {
  logoUrl: '/logo.svg',
  logoDarkUrl: '/logo-dark.svg',
  favicon: '/favicon.svg',
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
  dangerColor: '#ef4444',
  warningColor: '#f59e0b',
  fontFamily: 'Inter',
  customCss: '',
  loginBackground: '/auth-bg.jpg',
  emailHeaderImage: '/email-header.png',
  emailFooterText: '© 2026 Vimad Platform. All rights reserved.',
  poweredByBadge: true,
  customDomain: null,
  sslEnabled: true,
};

/* ─── Rate Limits ─── */
export const initialRateLimits = {
  global: { requestsPerMinute: 1000, burstLimit: 1500 },
  auth: { requestsPerMinute: 10, burstLimit: 20 },
  api: { requestsPerMinute: 500, burstLimit: 750 },
  webhook: { requestsPerMinute: 100, burstLimit: 200 },
  fileUpload: { requestsPerMinute: 30, burstLimit: 50 },
  search: { requestsPerMinute: 200, burstLimit: 300 },
  export: { requestsPerMinute: 10, burstLimit: 20 },
  perTenant: {
    enabled: true,
    requestsPerMinute: 300,
    burstLimit: 500,
    concurrentConnections: 50,
  },
  perUser: {
    enabled: true,
    requestsPerMinute: 120,
    burstLimit: 200,
  },
  ipBlocklist: ['192.168.1.100', '10.0.0.50'],
  whitelist: ['127.0.0.1'],
};

/* ─── Maintenance Mode ─── */
export const initialMaintenance = {
  enabled: false,
  message: "Vimad is currently undergoing scheduled maintenance. We'll be back shortly.",
  allowedIps: ['127.0.0.1'],
  estimatedDuration: 30, // minutes
  startTime: null,
  endTime: null,
  showCountdown: true,
  allowAdminAccess: true,
  customPageHtml: '',
};

/* ─── Notification Preferences ─── */
export const initialNotificationPrefs = {
  channels: {
    email: { enabled: true, provider: 'sendgrid' },
    sms: { enabled: false, provider: 'twilio' },
    push: { enabled: true, provider: 'firebase' },
    slack: { enabled: false, webhookUrl: '' },
    discord: { enabled: false, webhookUrl: '' },
  },
  events: {
    newTenant: { email: true, sms: false, push: true, slack: false },
    tenantSuspended: { email: true, sms: false, push: true, slack: true },
    paymentFailed: { email: true, sms: true, push: true, slack: true },
    highErrorRate: { email: true, sms: false, push: true, slack: true },
    securityAlert: { email: true, sms: true, push: true, slack: true },
    featureFlagChanged: { email: false, sms: false, push: false, slack: true },
    backupCompleted: { email: true, sms: false, push: false, slack: false },
    trialExpiring: { email: true, sms: false, push: false, slack: false },
  },
  digest: {
    enabled: true,
    frequency: 'daily', // daily, weekly
    time: '09:00',
    timezone: 'America/New_York',
    includeMetrics: true,
    includeErrors: true,
    includeNewTenants: true,
  },
  escalation: {
    enabled: true,
    levels: [
      { afterMinutes: 15, channel: 'email', recipients: ['oncall@vimad.io'] },
      { afterMinutes: 60, channel: 'sms', recipients: ['+1-555-0199'] },
      { afterMinutes: 240, channel: 'slack', recipients: ['#incidents'] },
    ],
  },
};

/* ─── Metadata ─── */
export const templateCategories = [
  { key: 'onboarding', label: 'Onboarding', color: 'text-accent', bg: 'bg-accent/10' },
  { key: 'billing', label: 'Billing', color: 'text-secondary', bg: 'bg-secondary/10' },
  { key: 'security', label: 'Security', color: 'text-danger', bg: 'bg-danger/10' },
  { key: 'system', label: 'System', color: 'text-info', bg: 'bg-info/10' },
];

export const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Zurich',
  'Europe/Dublin',
  'Europe/Rome',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Mumbai',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
];

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

export const dateFormats = [
  { value: 'MM/DD/YYYY', label: '08/16/2026 (US)' },
  { value: 'DD/MM/YYYY', label: '16/08/2026 (EU)' },
  { value: 'YYYY-MM-DD', label: '2026-08-16 (ISO)' },
  { value: 'MMM DD, YYYY', label: 'Aug 16, 2026' },
];

export const backupFrequencies = [
  { value: 'hourly', label: 'Every Hour' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const ssoProviders = [
  { value: null, label: 'None' },
  { value: 'google', label: 'Google Workspace' },
  { value: 'microsoft', label: 'Microsoft Entra ID' },
  { value: 'okta', label: 'Okta' },
  { value: 'auth0', label: 'Auth0' },
];

/* ─── Helpers ─── */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

export function getCategoryMeta(key) {
  return templateCategories.find((c) => c.key === key) || templateCategories[0];
}
