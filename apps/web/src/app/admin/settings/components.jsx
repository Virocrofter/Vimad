/* src/app/admin/settings/components.jsx */
import { useState, useRef, useCallback } from 'react';
import {
  Check, Copy, Eye, EyeOff, RefreshCw, Upload, X, Palette,
  Mail, Bell, Shield, Gauge, Wrench, Paintbrush, AlertTriangle,
  ChevronDown, ChevronUp, Save, Undo, Download, Trash2, Plus,
  Minus, GripVertical, ExternalLink, Code, Monitor, Smartphone,
  Globe, Clock, DollarSign, FileText, Lock, Key, Zap, Activity,
  Server, Database, Cloud, MessageSquare, MessageCircle, Hash
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

/* ─── Section Card ─── */
export function SectionCard({ title, description, icon: Icon, children, className }) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface overflow-hidden', className)}>
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <Icon className="h-5 w-5 text-secondary" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ─── Setting Row ─── */
export function SettingRow({ label, description, children, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-4', className)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ─── Toggle Switch ─── */
export function Toggle({ checked, onChange, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-13',
  };
  const knobClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-5.5 w-5.5',
  };
  const translate = checked ? 'translate-x-5' : 'translate-x-0.5';

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        sizeClasses[size],
        checked ? 'bg-secondary' : 'bg-border'
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white transition-transform shadow-sm',
          knobClasses[size],
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

/* ─── Color Picker Input ─── */
export function ColorPicker({ value, onChange, label }) {
  const inputRef = useRef(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border shadow-sm transition-transform hover:scale-105"
        style={{ backgroundColor: value }}
        title={value}
      >
        <Palette className="h-4 w-4 text-white mix-blend-difference" />
      </button>
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-28 rounded-md border border-border bg-background px-3 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {label && <span className="text-xs text-text-muted">{label}</span>}
    </div>
  );
}

/* ─── Number Stepper ─── */
export function NumberStepper({ value, onChange, min = 0, max = 99999, step = 1, unit = '' }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-8 w-20 rounded-md border border-border bg-background px-2 text-center text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-text-secondary hover:bg-surface-elevated"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Select Input ─── */
export function Select({ value, onChange, options, className }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
      className={cn(
        'h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt.value ?? 'null'} value={opt.value ?? ''}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ─── Text Input ─── */
export function TextInput({ value, onChange, placeholder, type = 'text', className }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    />
  );
}

/* ─── Textarea Input ─── */
export function Textarea({ value, onChange, placeholder, rows = 4, className }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y',
        className
      )}
    />
  );
}

/* ─── Password Input ─── */
export function PasswordInput({ value, onChange, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-border bg-background px-3 pr-10 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ─── Tag Input (for arrays like IP lists) ─── */
export function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('');

  const addTag = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  }, [input, tags, onChange]);

  const removeTag = useCallback((tag) => {
    onChange(tags.filter((t) => t !== tag));
  }, [tags, onChange]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1.5 rounded-md border border-border bg-background p-2 min-h-[42px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs font-mono text-text-secondary border border-border"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-text-muted hover:text-danger"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
            if (e.key === 'Backspace' && !input && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none"
        />
      </div>
    </div>
  );
}

/* ─── Template Editor ─── */
export function TemplateEditor({ template, onChange, onPreview }) {
  const [mode, setMode] = useState('visual'); // visual | code | preview
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertVariable = (variable) => {
    onChange({ ...template, body: template.body + `{{${variable}}}` });
  };

  return (
    <div className="space-y-4">
      {/* Subject */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Subject Line</label>
        <input
          type="text"
          value={template.subject}
          onChange={(e) => onChange({ ...template, subject: e.target.value })}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Variables */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">Available Variables</label>
        <div className="flex flex-wrap gap-1.5">
          {template.variables.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-mono text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
            >
              <Hash className="h-3 w-3" />{v}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          {[
            { id: 'visual', label: 'Visual', icon: Monitor },
            { id: 'code', label: 'HTML', icon: Code },
            { id: 'preview', label: 'Preview', icon: Eye },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                mode === m.id ? 'bg-secondary text-white' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <m.icon className="h-3.5 w-3.5" /> {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-elevated"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onPreview && (
            <button
              onClick={onPreview}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-elevated"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Test Send
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-lg border border-border overflow-hidden">
        {mode === 'visual' && (
          <textarea
            value={template.body}
            onChange={(e) => onChange({ ...template, body: e.target.value })}
            rows={16}
            className="w-full bg-background px-4 py-3 text-sm font-mono text-text-primary focus-visible:outline-none resize-y"
            spellCheck={false}
          />
        )}
        {mode === 'code' && (
          <textarea
            value={template.body}
            onChange={(e) => onChange({ ...template, body: e.target.value })}
            rows={16}
            className="w-full bg-background px-4 py-3 text-sm font-mono text-text-primary focus-visible:outline-none resize-y"
            spellCheck={false}
          />
        )}
        {mode === 'preview' && (
          <div className="bg-white">
            <iframe
              title="Preview"
              srcDoc={template.body}
              className="w-full h-96 border-0"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>Last modified: {template.lastModified}</span>
        <span>by {template.modifiedBy}</span>
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
          template.enabled ? 'bg-accent/10 text-accent border-accent/20' : 'bg-neutral/10 text-text-muted border-border'
        )}>
          {template.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </div>
  );
}

/* ─── Rate Limit Card ─── */
export function RateLimitCard({ title, icon: Icon, values, onChange, editable = true }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-text-muted" />}
        <span className="text-sm font-medium text-text-primary">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider">Req/min</label>
          {editable ? (
            <input
              type="number"
              value={values.requestsPerMinute}
              onChange={(e) => onChange({ ...values, requestsPerMinute: Number(e.target.value) })}
              className="mt-1 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : (
            <p className="mt-1 text-sm font-mono text-text-primary">{values.requestsPerMinute}</p>
          )}
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider">Burst</label>
          {editable ? (
            <input
              type="number"
              value={values.burstLimit}
              onChange={(e) => onChange({ ...values, burstLimit: Number(e.target.value) })}
              className="mt-1 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm font-mono text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : (
            <p className="mt-1 text-sm font-mono text-text-primary">{values.burstLimit}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Notification Channel Toggle ─── */
export function ChannelToggle({ channel, config, onChange }) {
  const icons = {
    email: Mail,
    sms: Smartphone,
    push: Bell,
    slack: MessageCircle,
    discord: MessageSquare,
  };
  const Icon = icons[channel] || Bell;
  const labels = {
    email: 'Email',
    sms: 'SMS',
    push: 'Push',
    slack: 'MessageCirle',
    discord: 'Discord',
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary/10">
          <Icon className="h-4 w-4 text-secondary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{labels[channel]}</p>
          {config.provider && <p className="text-[10px] text-text-muted capitalize">{config.provider}</p>}
        </div>
      </div>
      <Toggle checked={config.enabled} onChange={(v) => onChange({ ...config, enabled: v })} />
    </div>
  );
}

/* ─── Event Notification Row ─── */
export function EventRow({ event, config, channels, onChange }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary capitalize">{event.replace(/-/g, ' ')}</span>
          <span className="text-xs text-text-muted">
            {Object.values(config).filter(Boolean).length} channels
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
      </button>
      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {channels.map((ch) => (
              <label key={ch} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config[ch] || false}
                  onChange={(e) => onChange({ ...config, [ch]: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-secondary focus:ring-ring"
                />
                <span className="text-sm text-text-secondary capitalize">{ch}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── File Upload Zone ─── */
export function FileUploadZone({ onUpload, accept, label }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) onUpload(files[0]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
        dragOver ? 'border-secondary bg-secondary/5' : 'border-border bg-background hover:bg-surface-elevated'
      )}
    >
      <Upload className="mx-auto h-8 w-8 text-text-muted mb-2" />
      <p className="text-sm text-text-secondary">{label || 'Drop file here or click to upload'}</p>
      <p className="text-xs text-text-muted mt-1">{accept || 'SVG, PNG, JPG up to 5MB'}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        className="sr-only"
      />
    </div>
  );
}

/* ─── Unsaved Changes Bar ─── */
export function UnsavedBar({ visible, onSave, onDiscard, saving }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-border bg-surface px-5 py-3 shadow-xl">
      <span className="text-sm text-text-secondary">Unsaved changes</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
          <Undo className="mr-1.5 h-3.5 w-3.5" /> Discard
        </Button>
        <Button size="sm" onClick={onSave} isLoading={saving}>
          <Save className="mr-1.5 h-3.5 w-3.5" /> Save Changes
        </Button>
      </div>
    </div>
  );
}

/* ─── Danger Zone Card ─── */
export function DangerZone({ children }) {
  return (
    <div className="rounded-xl border border-danger/20 bg-danger/5 overflow-hidden">
      <div className="border-b border-danger/10 bg-danger/5 px-6 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-danger" />
          <h3 className="text-sm font-semibold text-danger">Danger Zone</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}