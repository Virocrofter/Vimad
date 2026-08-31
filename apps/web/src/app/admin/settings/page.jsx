/* src/app/admin/settings/page.jsx */
import { useState, useMemo, useCallback } from 'react';
import {
  Save,
  Undo,
  Settings,
  Mail,
  Paintbrush,
  Gauge,
  Wrench,
  Bell,
  Globe,
  Clock,
  DollarSign,
  Shield,
  Database,
  Server,
  Key,
  Zap,
  AlertTriangle,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Code,
  Monitor,
  Smartphone,
  MessageSquare,
  Hash,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Upload,
  Palette,
  Lock,
  FileText,
  Activity,
  Cloud,
  HardDrive,
  Wifi,
  Layers,
  BarChart3,
  Users,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import {
  initialPlatformConfig,
  initialEmailTemplates,
  initialBranding,
  initialRateLimits,
  initialMaintenance,
  initialNotificationPrefs,
  templateCategories,
  timezones,
  currencies,
  dateFormats,
  backupFrequencies,
  ssoProviders,
  getCategoryMeta,
} from './data';
import {
  SectionCard,
  SettingRow,
  Toggle,
  ColorPicker,
  NumberStepper,
  Select,
  TextInput,
  Textarea,
  TagInput,
  TemplateEditor,
  RateLimitCard,
  ChannelToggle,
  EventRow,
  FileUploadZone,
  UnsavedBar,
  DangerZone,
} from './components';

/* ─── Tabs ─── */
const tabs = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'email', label: 'Email Templates', icon: Mail },
  { id: 'branding', label: 'Branding', icon: Paintbrush },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'rate-limits', label: 'Rate Limits', icon: Gauge },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

/* ═════════════════════════════════════════
   SUB-SECTION COMPONENTS
   ═════════════════════════════════════════ */

/* ─── General Settings ─── */
function GeneralSettings({ config, onChange }) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Platform Identity"
        icon={Globe}
        description="Core platform identifiers and defaults"
      >
        <div className="space-y-1">
          <SettingRow label="Platform Name" description="Displayed in emails, UI, and browser tab">
            <TextInput
              value={config.platformName}
              onChange={(v) => onChange({ ...config, platformName: v })}
              className="w-64"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Support Email" description="Reply-to address for all platform emails">
            <TextInput
              value={config.supportEmail}
              onChange={(v) => onChange({ ...config, supportEmail: v })}
              type="email"
              className="w-64"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Sender Name" description="Display name for transactional emails">
            <TextInput
              value={config.senderName}
              onChange={(v) => onChange({ ...config, senderName: v })}
              className="w-64"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Reply-To Email" description="Where replies to system emails go">
            <TextInput
              value={config.replyToEmail}
              onChange={(v) => onChange({ ...config, replyToEmail: v })}
              type="email"
              className="w-64"
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard
        title="Regional Defaults"
        icon={Clock}
        description="Default timezone, currency, and formatting"
      >
        <div className="space-y-1">
          <SettingRow label="Default Timezone">
            <Select
              value={config.defaultTimezone}
              onChange={(v) => onChange({ ...config, defaultTimezone: v })}
              options={timezones.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
              className="w-64"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Default Currency">
            <Select
              value={config.defaultCurrency}
              onChange={(v) => onChange({ ...config, defaultCurrency: v })}
              options={currencies.map((c) => ({
                value: c.code,
                label: `${c.code} (${c.symbol}) — ${c.name}`,
              }))}
              className="w-64"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Date Format">
            <Select
              value={config.dateFormat}
              onChange={(v) => onChange({ ...config, dateFormat: v })}
              options={dateFormats}
              className="w-64"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Time Format">
            <div className="flex items-center gap-2">
              {['12h', '24h'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onChange({ ...config, timeFormat: fmt })}
                  className={cn(
                    'h-10 rounded-md border px-4 text-sm font-medium transition-colors',
                    config.timeFormat === fmt
                      ? 'border-secondary bg-secondary/5 text-secondary'
                      : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                  )}
                >
                  {fmt === '12h' ? '12-hour' : '24-hour'}
                </button>
              ))}
            </div>
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Default Language">
            <Select
              value={config.language}
              onChange={(v) => onChange({ ...config, language: v })}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
                { value: 'de', label: 'German' },
                { value: 'pt', label: 'Portuguese' },
                { value: 'it', label: 'Italian' },
                { value: 'ja', label: 'Japanese' },
                { value: 'zh', label: 'Chinese (Simplified)' },
              ]}
              className="w-64"
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard
        title="File Uploads"
        icon={HardDrive}
        description="Limits and restrictions for file uploads"
      >
        <div className="space-y-1">
          <SettingRow label="Max File Size" description="Maximum upload size per file">
            <NumberStepper
              value={config.maxFileUploadSize}
              onChange={(v) => onChange({ ...config, maxFileUploadSize: v })}
              unit="MB"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow
            label="Allowed File Types"
            description="Comma-separated list of permitted extensions"
          >
            <TagInput
              tags={config.allowedFileTypes}
              onChange={(v) => onChange({ ...config, allowedFileTypes: v })}
              placeholder="Add extension (e.g. pdf)"
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard
        title="Data & Backups"
        icon={Database}
        description="Retention policies and backup configuration"
      >
        <div className="space-y-1">
          <SettingRow
            label="Data Retention"
            description="How long to keep activity logs and deleted data"
          >
            <NumberStepper
              value={config.dataRetentionDays}
              onChange={(v) => onChange({ ...config, dataRetentionDays: v })}
              unit="days"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Auto Backup">
            <Toggle
              checked={config.autoBackupEnabled}
              onChange={(v) => onChange({ ...config, autoBackupEnabled: v })}
            />
          </SettingRow>
          {config.autoBackupEnabled && (
            <>
              <div className="border-t border-border" />
              <SettingRow label="Backup Frequency">
                <Select
                  value={config.backupFrequency}
                  onChange={(v) => onChange({ ...config, backupFrequency: v })}
                  options={backupFrequencies}
                  className="w-48"
                />
              </SettingRow>
              <div className="border-t border-border" />
              <SettingRow label="Retention Count" description="Number of backups to keep">
                <NumberStepper
                  value={config.backupRetentionCount}
                  onChange={(v) => onChange({ ...config, backupRetentionCount: v })}
                />
              </SettingRow>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Email Templates ─── */
function EmailTemplates({ templates, onChange }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selected = templates.find((t) => t.id === selectedId);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, categoryFilter, searchQuery]);

  const handleUpdate = (updated) => {
    onChange(templates.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleToggle = (id) => {
    onChange(templates.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Sidebar */}
      <div className="w-80 shrink-0 flex flex-col rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border p-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCategoryFilter('all')}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors',
                categoryFilter === 'all'
                  ? 'border-secondary bg-secondary/10 text-secondary'
                  : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
              )}
            >
              All
            </button>
            {templateCategories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategoryFilter(c.key)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[10px] font-medium transition-colors',
                  categoryFilter === c.key
                    ? cn(c.bg, c.color, 'border-current/30')
                    : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((t) => {
            const catMeta = getCategoryMeta(t.category);
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors',
                  selectedId === t.id ? 'bg-secondary/5' : 'hover:bg-background/50'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 h-2 w-2 rounded-full shrink-0',
                    t.enabled ? 'bg-accent' : 'bg-border'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      selectedId === t.id ? 'text-secondary' : 'text-text-primary'
                    )}
                  >
                    {t.name}
                  </p>
                  <p className="text-xs text-text-muted truncate mt-0.5">{t.subject}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-medium',
                        catMeta.bg,
                        catMeta.color,
                        'border-current/20'
                      )}
                    >
                      {catMeta.label}
                    </span>
                    <span className="text-[10px] text-text-muted">{t.lastModified}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{selected.name}</h2>
                <p className="text-xs text-text-muted font-mono mt-0.5">{selected.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted mr-2">Enabled</span>
                <Toggle checked={selected.enabled} onChange={() => handleToggle(selected.id)} />
              </div>
            </div>
            <TemplateEditor
              template={selected}
              onChange={handleUpdate}
              onPreview={() => console.log('Preview:', selected.id)}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-text-muted">
            <Mail className="h-12 w-12 mb-3" />
            <p>Select a template to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Branding ─── */
function BrandingSettings({ branding, onChange }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Logo & Assets" icon={Upload} description="Upload your brand assets">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Light Mode Logo
            </label>
            <FileUploadZone
              onUpload={(file) => console.log('Upload:', file.name)}
              accept=".svg,.png,.jpg,.jpeg"
              label="Drop logo for light backgrounds"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Dark Mode Logo
            </label>
            <FileUploadZone
              onUpload={(file) => console.log('Upload dark:', file.name)}
              accept=".svg,.png,.jpg,.jpeg"
              label="Drop logo for dark backgrounds"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Favicon
            </label>
            <FileUploadZone
              onUpload={(file) => console.log('Upload favicon:', file.name)}
              accept=".svg,.png,.ico"
              label="Drop favicon (.svg, .png, .ico)"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Login Background
            </label>
            <FileUploadZone
              onUpload={(file) => console.log('Upload bg:', file.name)}
              accept=".jpg,.jpeg,.png"
              label="Drop background image"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Colors" icon={Palette} description="Customize the platform color scheme">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Primary
            </label>
            <ColorPicker
              value={branding.primaryColor}
              onChange={(v) => onChange({ ...branding, primaryColor: v })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Accent
            </label>
            <ColorPicker
              value={branding.accentColor}
              onChange={(v) => onChange({ ...branding, accentColor: v })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Danger
            </label>
            <ColorPicker
              value={branding.dangerColor}
              onChange={(v) => onChange({ ...branding, dangerColor: v })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Warning
            </label>
            <ColorPicker
              value={branding.warningColor}
              onChange={(v) => onChange({ ...branding, warningColor: v })}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Typography" icon={FileText} description="Font and text styling">
        <div className="space-y-1">
          <SettingRow label="Font Family">
            <Select
              value={branding.fontFamily}
              onChange={(v) => onChange({ ...branding, fontFamily: v })}
              options={[
                { value: 'Inter', label: 'Inter (Default)' },
                { value: 'Roboto', label: 'Roboto' },
                { value: 'Open Sans', label: 'Open Sans' },
                { value: 'Lato', label: 'Lato' },
                { value: 'Poppins', label: 'Poppins' },
                { value: 'Nunito', label: 'Nunito' },
              ]}
              className="w-48"
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard title="Email Branding" icon={Mail} description="Customize transactional emails">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Email Header Image
            </label>
            <FileUploadZone
              onUpload={(file) => console.log('Upload header:', file.name)}
              accept=".png,.jpg,.jpeg"
              label="Drop email header image (600×120px recommended)"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Email Footer Text
            </label>
            <Textarea
              value={branding.emailFooterText}
              onChange={(v) => onChange({ ...branding, emailFooterText: v })}
              rows={2}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Platform Badge"
        icon={Zap}
        description="Show or hide the powered-by badge"
      >
        <SettingRow
          label='Show "Powered by Vimad" Badge'
          description="Displayed on login and footer for free plans"
        >
          <Toggle
            checked={branding.poweredByBadge}
            onChange={(v) => onChange({ ...branding, poweredByBadge: v })}
          />
        </SettingRow>
      </SectionCard>

      <DangerZone>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-danger">Reset to Defaults</p>
            <p className="text-xs text-text-muted mt-0.5">
              This will erase all custom branding and restore factory settings
            </p>
          </div>
          <Button variant="outline" className="text-danger border-danger/30 hover:bg-danger/10">
            <RefreshCw className="mr-1.5 h-4 w-4" /> Reset
          </Button>
        </div>
      </DangerZone>
    </div>
  );
}

/* ─── Security Settings ─── */
function SecuritySettings({ config, onChange }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Authentication" icon={Lock} description="Login and session policies">
        <div className="space-y-1">
          <SettingRow label="Session Timeout" description="Auto-logout after inactivity">
            <NumberStepper
              value={config.sessionTimeout}
              onChange={(v) => onChange({ ...config, sessionTimeout: v })}
              unit="min"
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Max Login Attempts" description="Before account lockout">
            <NumberStepper
              value={config.maxLoginAttempts}
              onChange={(v) => onChange({ ...config, maxLoginAttempts: v })}
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Lockout Duration" description="How long accounts stay locked">
            <NumberStepper
              value={config.lockoutDuration}
              onChange={(v) => onChange({ ...config, lockoutDuration: v })}
              unit="min"
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard
        title="Password Policy"
        icon={Key}
        description="Minimum requirements for user passwords"
      >
        <div className="space-y-1">
          <SettingRow label="Minimum Length">
            <NumberStepper
              value={config.passwordMinLength}
              onChange={(v) => onChange({ ...config, passwordMinLength: v })}
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Require Special Character">
            <Toggle
              checked={config.passwordRequireSpecialChar}
              onChange={(v) => onChange({ ...config, passwordRequireSpecialChar: v })}
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Require Number">
            <Toggle
              checked={config.passwordRequireNumber}
              onChange={(v) => onChange({ ...config, passwordRequireNumber: v })}
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Require Uppercase Letter">
            <Toggle
              checked={config.passwordRequireUppercase}
              onChange={(v) => onChange({ ...config, passwordRequireUppercase: v })}
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard
        title="Multi-Factor Authentication"
        icon={Shield}
        description="2FA and MFA settings"
      >
        <div className="space-y-1">
          <SettingRow label="Enable MFA Globally" description="Allow users to set up MFA">
            <Toggle
              checked={config.mfaEnabled}
              onChange={(v) => onChange({ ...config, mfaEnabled: v })}
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow label="Require MFA for Admins" description="Force 2FA for all admin accounts">
            <Toggle
              checked={config.mfaRequiredForAdmins}
              onChange={(v) => onChange({ ...config, mfaRequiredForAdmins: v })}
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard title="Single Sign-On" icon={Globe} description="Enterprise SSO configuration">
        <div className="space-y-1">
          <SettingRow label="Enable SSO">
            <Toggle
              checked={config.ssoEnabled}
              onChange={(v) => onChange({ ...config, ssoEnabled: v })}
            />
          </SettingRow>
          {config.ssoEnabled && (
            <>
              <div className="border-t border-border" />
              <SettingRow label="SSO Provider">
                <Select
                  value={config.ssoProvider}
                  onChange={(v) => onChange({ ...config, ssoProvider: v })}
                  options={ssoProviders}
                  className="w-48"
                />
              </SettingRow>
            </>
          )}
        </div>
      </SectionCard>

      <SectionCard title="API Security" icon={Server} description="API-level protections">
        <div className="space-y-1">
          <SettingRow label="API Rate Limit" description="Global requests per minute">
            <NumberStepper
              value={config.apiRateLimit}
              onChange={(v) => onChange({ ...config, apiRateLimit: v })}
            />
          </SettingRow>
          <div className="border-t border-border" />
          <SettingRow
            label="Webhook Timeout"
            description="Max seconds to wait for webhook response"
          >
            <NumberStepper
              value={config.webhookTimeout}
              onChange={(v) => onChange({ ...config, webhookTimeout: v })}
              unit="s"
            />
          </SettingRow>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Rate Limits ─── */
function RateLimitSettings({ limits, onChange }) {
  const updateSection = (key, value) => {
    onChange({ ...limits, [key]: value });
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Global Limits" icon={Globe} description="Platform-wide rate limiting">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RateLimitCard
            title="Global"
            icon={Activity}
            values={limits.global}
            onChange={(v) => updateSection('global', v)}
          />
          <RateLimitCard
            title="Authentication"
            icon={Lock}
            values={limits.auth}
            onChange={(v) => updateSection('auth', v)}
          />
          <RateLimitCard
            title="API"
            icon={Server}
            values={limits.api}
            onChange={(v) => updateSection('api', v)}
          />
          <RateLimitCard
            title="Webhooks"
            icon={Wifi}
            values={limits.webhook}
            onChange={(v) => updateSection('webhook', v)}
          />
          <RateLimitCard
            title="File Uploads"
            icon={HardDrive}
            values={limits.fileUpload}
            onChange={(v) => updateSection('fileUpload', v)}
          />
          <RateLimitCard
            title="Search"
            icon={Zap}
            values={limits.search}
            onChange={(v) => updateSection('search', v)}
          />
          <RateLimitCard
            title="Exports"
            icon={Database}
            values={limits.export}
            onChange={(v) => updateSection('export', v)}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Per-Tenant Limits"
        icon={Layers}
        description="Rate limits applied per tenant"
      >
        <div className="space-y-4">
          <SettingRow label="Enable Per-Tenant Limits">
            <Toggle
              checked={limits.perTenant.enabled}
              onChange={(v) => updateSection('perTenant', { ...limits.perTenant, enabled: v })}
            />
          </SettingRow>
          {limits.perTenant.enabled && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider">
                  Req/min
                </label>
                <input
                  type="number"
                  value={limits.perTenant.requestsPerMinute}
                  onChange={(e) =>
                    updateSection('perTenant', {
                      ...limits.perTenant,
                      requestsPerMinute: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider">
                  Burst
                </label>
                <input
                  type="number"
                  value={limits.perTenant.burstLimit}
                  onChange={(e) =>
                    updateSection('perTenant', {
                      ...limits.perTenant,
                      burstLimit: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider">
                  Max Connections
                </label>
                <input
                  type="number"
                  value={limits.perTenant.concurrentConnections}
                  onChange={(e) =>
                    updateSection('perTenant', {
                      ...limits.perTenant,
                      concurrentConnections: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Per-User Limits" icon={Users} description="Rate limits applied per user">
        <div className="space-y-4">
          <SettingRow label="Enable Per-User Limits">
            <Toggle
              checked={limits.perUser.enabled}
              onChange={(v) => updateSection('perUser', { ...limits.perUser, enabled: v })}
            />
          </SettingRow>
          {limits.perUser.enabled && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider">
                  Req/min
                </label>
                <input
                  type="number"
                  value={limits.perUser.requestsPerMinute}
                  onChange={(e) =>
                    updateSection('perUser', {
                      ...limits.perUser,
                      requestsPerMinute: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider">
                  Burst
                </label>
                <input
                  type="number"
                  value={limits.perUser.burstLimit}
                  onChange={(e) =>
                    updateSection('perUser', {
                      ...limits.perUser,
                      burstLimit: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="IP Management" icon={Shield} description="Blocklist and whitelist IPs">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Blocklist
            </label>
            <TagInput
              tags={limits.ipBlocklist}
              onChange={(v) => updateSection('ipBlocklist', v)}
              placeholder="Add IP to block..."
            />
            <p className="text-xs text-text-muted">
              Requests from these IPs will be rejected immediately
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Whitelist
            </label>
            <TagInput
              tags={limits.whitelist}
              onChange={(v) => updateSection('whitelist', v)}
              placeholder="Add IP to whitelist..."
            />
            <p className="text-xs text-text-muted">
              These IPs bypass rate limiting (use with caution)
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Maintenance Mode ─── */
function MaintenanceSettings({ maintenance, onChange }) {
  return (
    <div className="space-y-6">
      <div
        className={cn(
          'rounded-xl border p-4 flex items-center gap-4',
          maintenance.enabled ? 'bg-warning/10 border-warning/20' : 'bg-accent/10 border-accent/20'
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-background',
            maintenance.enabled ? 'text-warning' : 'text-accent'
          )}
        >
          <Wrench className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p
            className={cn(
              'text-lg font-bold',
              maintenance.enabled ? 'text-warning' : 'text-accent'
            )}
          >
            {maintenance.enabled ? 'Maintenance Mode is ACTIVE' : 'All Systems Operational'}
          </p>
          <p className="text-xs text-text-secondary">
            {maintenance.enabled
              ? 'Users will see the maintenance page. Admins can still access the platform.'
              : 'The platform is accessible to all users.'}
          </p>
        </div>
        <Toggle
          checked={maintenance.enabled}
          onChange={(v) => onChange({ ...maintenance, enabled: v })}
        />
      </div>

      <SectionCard
        title="Maintenance Page"
        icon={Monitor}
        description="What users see during maintenance"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Message
            </label>
            <Textarea
              value={maintenance.message}
              onChange={(v) => onChange({ ...maintenance, message: v })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={maintenance.startTime || ''}
                onChange={(e) => onChange({ ...maintenance, startTime: e.target.value || null })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                End Time
              </label>
              <input
                type="datetime-local"
                value={maintenance.endTime || ''}
                onChange={(e) => onChange({ ...maintenance, endTime: e.target.value || null })}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <SettingRow label="Show Countdown Timer">
            <Toggle
              checked={maintenance.showCountdown}
              onChange={(v) => onChange({ ...maintenance, showCountdown: v })}
            />
          </SettingRow>
          <SettingRow label="Allow Admin Access" description="Super admins can bypass maintenance">
            <Toggle
              checked={maintenance.allowAdminAccess}
              onChange={(v) => onChange({ ...maintenance, allowAdminAccess: v })}
            />
          </SettingRow>
        </div>
      </SectionCard>

      <SectionCard
        title="Allowed IPs"
        icon={Shield}
        description="IPs that can access during maintenance"
      >
        <TagInput
          tags={maintenance.allowedIps}
          onChange={(v) => onChange({ ...maintenance, allowedIps: v })}
          placeholder="Add allowed IP..."
        />
      </SectionCard>

      <SectionCard
        title="Custom HTML"
        icon={Code}
        description="Override the default maintenance page"
      >
        <div className="space-y-2">
          <Textarea
            value={maintenance.customPageHtml}
            onChange={(v) => onChange({ ...maintenance, customPageHtml: v })}
            rows={10}
            placeholder="<!DOCTYPE html>..."
          />
          <p className="text-xs text-text-muted">Leave empty to use the default maintenance page</p>
        </div>
      </SectionCard>

      <DangerZone>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-danger">Force Maintenance Page</p>
            <p className="text-xs text-text-muted mt-0.5">
              Immediately redirect all traffic to maintenance (bypasses scheduled time)
            </p>
          </div>
          <Button variant="outline" className="text-danger border-danger/30 hover:bg-danger/10">
            <AlertTriangle className="mr-1.5 h-4 w-4" /> Force Now
          </Button>
        </div>
      </DangerZone>
    </div>
  );
}

/* ─── Notification Preferences ─── */
function NotificationSettings({ prefs, onChange }) {
  const updateChannel = (channel, config) => {
    onChange({ ...prefs, channels: { ...prefs.channels, [channel]: config } });
  };

  const updateEvent = (event, config) => {
    onChange({ ...prefs, events: { ...prefs.events, [event]: config } });
  };

  const updateDigest = (updates) => {
    onChange({ ...prefs, digest: { ...prefs.digest, ...updates } });
  };

  const updateEscalation = (updates) => {
    onChange({ ...prefs, escalation: { ...prefs.escalation, ...updates } });
  };

  const channelKeys = Object.keys(prefs.channels);
  const eventKeys = Object.keys(prefs.events);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Channels"
        icon={Wifi}
        description="Configure notification delivery methods"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {channelKeys.map((ch) => (
            <ChannelToggle
              key={ch}
              channel={ch}
              config={prefs.channels[ch]}
              onChange={(v) => updateChannel(ch, v)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Event Routing"
        icon={Bell}
        description="Choose which channels notify for each event"
      >
        <div className="space-y-2">
          {eventKeys.map((event) => (
            <EventRow
              key={event}
              event={event}
              config={prefs.events[event]}
              channels={channelKeys}
              onChange={(v) => updateEvent(event, v)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Daily Digest" icon={FileText} description="Consolidated summary emails">
        <div className="space-y-1">
          <SettingRow label="Enable Digest">
            <Toggle checked={prefs.digest.enabled} onChange={(v) => updateDigest({ enabled: v })} />
          </SettingRow>
          {prefs.digest.enabled && (
            <>
              <div className="border-t border-border" />
              <SettingRow label="Frequency">
                <div className="flex items-center gap-2">
                  {['daily', 'weekly'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => updateDigest({ frequency: freq })}
                      className={cn(
                        'h-10 rounded-md border px-4 text-sm font-medium transition-colors capitalize',
                        prefs.digest.frequency === freq
                          ? 'border-secondary bg-secondary/5 text-secondary'
                          : 'border-border bg-background text-text-secondary hover:bg-surface-elevated'
                      )}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </SettingRow>
              <div className="border-t border-border" />
              <SettingRow label="Delivery Time">
                <input
                  type="time"
                  value={prefs.digest.time}
                  onChange={(e) => updateDigest({ time: e.target.value })}
                  className="h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </SettingRow>
              <div className="border-t border-border" />
              <SettingRow label="Timezone">
                <Select
                  value={prefs.digest.timezone}
                  onChange={(v) => updateDigest({ timezone: v })}
                  options={timezones.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
                  className="w-56"
                />
              </SettingRow>
              <div className="border-t border-border" />
              <SettingRow label="Include Metrics">
                <Toggle
                  checked={prefs.digest.includeMetrics}
                  onChange={(v) => updateDigest({ includeMetrics: v })}
                />
              </SettingRow>
              <div className="border-t border-border" />
              <SettingRow label="Include Errors">
                <Toggle
                  checked={prefs.digest.includeErrors}
                  onChange={(v) => updateDigest({ includeErrors: v })}
                />
              </SettingRow>
              <div className="border-t border-border" />
              <SettingRow label="Include New Tenants">
                <Toggle
                  checked={prefs.digest.includeNewTenants}
                  onChange={(v) => updateDigest({ includeNewTenants: v })}
                />
              </SettingRow>
            </>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Escalation Policy"
        icon={AlertTriangle}
        description="Auto-escalate unacknowledged alerts"
      >
        <div className="space-y-4">
          <SettingRow label="Enable Escalation">
            <Toggle
              checked={prefs.escalation.enabled}
              onChange={(v) => updateEscalation({ enabled: v })}
            />
          </SettingRow>
          {prefs.escalation.enabled && (
            <div className="space-y-3">
              {prefs.escalation.levels.map((level, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                    {idx + 1}
                  </div>
                  <div className="grid grid-cols-3 gap-3 flex-1">
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">
                        After
                      </label>
                      <NumberStepper
                        value={level.afterMinutes}
                        onChange={(v) => {
                          const newLevels = [...prefs.escalation.levels];
                          newLevels[idx] = { ...level, afterMinutes: v };
                          updateEscalation({ levels: newLevels });
                        }}
                        unit="min"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">
                        Channel
                      </label>
                      <Select
                        value={level.channel}
                        onChange={(v) => {
                          const newLevels = [...prefs.escalation.levels];
                          newLevels[idx] = { ...level, channel: v };
                          updateEscalation({ levels: newLevels });
                        }}
                        options={channelKeys.map((c) => ({
                          value: c,
                          label: c.charAt(0).toUpperCase() + c.slice(1),
                        }))}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted uppercase tracking-wider">
                        Recipients
                      </label>
                      <TagInput
                        tags={level.recipients}
                        onChange={(v) => {
                          const newLevels = [...prefs.escalation.levels];
                          newLevels[idx] = { ...level, recipients: v };
                          updateEscalation({ levels: newLevels });
                        }}
                        placeholder="Add recipient..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/* ═════════════════════════════════════════
   MAIN PAGE
   ═════════════════════════════════════════ */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /* ─── State ─── */
  const [platformConfig, setPlatformConfig] = useState(initialPlatformConfig);
  const [emailTemplates, setEmailTemplates] = useState(initialEmailTemplates);
  const [branding, setBranding] = useState(initialBranding);
  const [rateLimits, setRateLimits] = useState(initialRateLimits);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [notificationPrefs, setNotificationPrefs] = useState(initialNotificationPrefs);

  /* ─── Track changes ─── */
  const markChanged = () => setHasChanges(true);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setHasChanges(false);
    console.log('Saved all settings');
  };

  const handleDiscard = () => {
    setPlatformConfig(initialPlatformConfig);
    setEmailTemplates(initialEmailTemplates);
    setBranding(initialBranding);
    setRateLimits(initialRateLimits);
    setMaintenance(initialMaintenance);
    setNotificationPrefs(initialNotificationPrefs);
    setHasChanges(false);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            config={platformConfig}
            onChange={(v) => {
              setPlatformConfig(v);
              markChanged();
            }}
          />
        );
      case 'email':
        return (
          <EmailTemplates
            templates={emailTemplates}
            onChange={(v) => {
              setEmailTemplates(v);
              markChanged();
            }}
          />
        );
      case 'branding':
        return (
          <BrandingSettings
            branding={branding}
            onChange={(v) => {
              setBranding(v);
              markChanged();
            }}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            config={platformConfig}
            onChange={(v) => {
              setPlatformConfig(v);
              markChanged();
            }}
          />
        );
      case 'rate-limits':
        return (
          <RateLimitSettings
            limits={rateLimits}
            onChange={(v) => {
              setRateLimits(v);
              markChanged();
            }}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceSettings
            maintenance={maintenance}
            onChange={(v) => {
              setMaintenance(v);
              markChanged();
            }}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            prefs={notificationPrefs}
            onChange={(v) => {
              setNotificationPrefs(v);
              markChanged();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Platform Settings</h1>
          <p className="text-sm text-text-secondary">
            Configure global platform behavior, branding, and policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={!hasChanges || saving}
          >
            <Undo className="mr-1.5 h-4 w-4" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={saving} disabled={!hasChanges}>
            <Save className="mr-1.5 h-4 w-4" /> Save All Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  active
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">{renderTab()}</div>

      {/* Unsaved Bar */}
      <UnsavedBar
        visible={hasChanges}
        onSave={handleSave}
        onDiscard={handleDiscard}
        saving={saving}
      />
    </div>
  );
}
