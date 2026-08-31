/* src/app/admin/reports/ReportBuilderModal.jsx */
import { useState, useMemo } from 'react';
import {
  X, Plus, Save, Eye, GripVertical, ChevronRight, ChevronDown,
  BarChart3, TrendingUp, Activity, PieChart, Table, Hash,
  ScatterChart, Grid3x3, Filter, Layers, FilePlus, ArrowLeft,
  Check, AlertTriangle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  chartTypes, dataSources, aggregations, timeGranularities,
  reportTemplates, mockChartData, getDataSourceFields, getApplicableAggregations
} from './data';
import { ChartTypeIcon, TemplateIcon, ChartRenderer, FieldChip } from './components';

/* ─── Widget Builder Sub-Modal ─── */
function WidgetBuilder({ isOpen, onClose, onSave, dataSource, existingWidget }) {
  const [step, setStep] = useState(1); // 1: chart type, 2: configure
  const [chartType, setChartType] = useState(existingWidget?.type || 'bar');
  const [config, setConfig] = useState({
    xAxis: existingWidget?.xAxis || '',
    yAxis: existingWidget?.yAxis || [],
    aggregation: existingWidget?.aggregation || 'sum',
    granularity: existingWidget?.granularity || 'month',
    columns: existingWidget?.columns || [],
    ...existingWidget,
  });

  const fields = useMemo(() => getDataSourceFields(dataSource), [dataSource]);
  const numericFields = fields.filter(f => ['number', 'currency', 'percent'].includes(f.type));
  const allFields = fields;

  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  const toggleYAxis = (fieldKey) => {
    setConfig(prev => ({
      ...prev,
      yAxis: prev.yAxis.includes(fieldKey)
        ? prev.yAxis.filter(k => k !== fieldKey)
        : [...prev.yAxis, fieldKey],
    }));
  };

  const toggleColumn = (fieldKey) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.includes(fieldKey)
        ? prev.columns.filter(k => k !== fieldKey)
        : [...prev.columns, fieldKey],
    }));
  };

  const handleSave = () => {
    onSave({ type: chartType, ...config });
    onClose();
  };

  const needsYAxis = !['table', 'metric'].includes(chartType);
  const needsXAxis = !['table', 'metric', 'heatmap'].includes(chartType);
  const needsColumns = chartType === 'table';
  const needsAggregation = !['table', 'metric', 'scatter', 'heatmap'].includes(chartType);
  const needsGranularity = ['bar', 'line', 'area', 'combo'].includes(chartType);

  const canProceed = () => {
    if (needsColumns && config.columns.length === 0) return false;
    if (needsXAxis && !config.xAxis) return false;
    if (needsYAxis && config.yAxis.length === 0) return false;
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Configure Widget</h3>
              <p className="text-xs text-text-muted">{dataSources.find(s => s.key === dataSource)?.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Chart Type */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Select Chart Type</h4>
              <div className="grid grid-cols-3 gap-3">
                {chartTypes.map((ct) => (
                  <button
                    key={ct.key}
                    onClick={() => setChartType(ct.key)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                      chartType === ct.key
                        ? 'border-secondary bg-secondary/5 text-secondary'
                        : 'border-border bg-surface text-text-secondary hover:border-secondary/30'
                    )}
                  >
                    <ChartTypeIcon type={ct.key} className={cn('h-6 w-6', chartType === ct.key ? 'text-secondary' : 'text-text-muted')} />
                    <span className="text-sm font-medium">{ct.label}</span>
                    <span className="text-[10px] text-text-muted capitalize">{ct.category}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && (
            <div className="space-y-6">
              {/* X-Axis */}
              {needsXAxis && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">X-Axis / Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {allFields.map(field => (
                      <FieldChip
                        key={field.key}
                        field={field}
                        isSelected={config.xAxis === field.key}
                        onClick={() => updateConfig('xAxis', field.key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Y-Axis */}
              {needsYAxis && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Y-Axis / Values</h4>
                  <div className="flex flex-wrap gap-2">
                    {numericFields.map(field => (
                      <FieldChip
                        key={field.key}
                        field={field}
                        isSelected={config.yAxis.includes(field.key)}
                        onClick={() => toggleYAxis(field.key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Columns (for table) */}
              {needsColumns && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Table Columns</h4>
                  <div className="flex flex-wrap gap-2">
                    {allFields.map(field => (
                      <FieldChip
                        key={field.key}
                        field={field}
                        isSelected={config.columns.includes(field.key)}
                        onClick={() => toggleColumn(field.key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Aggregation */}
              {needsAggregation && config.yAxis.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Aggregation</h4>
                  <div className="flex flex-wrap gap-2">
                    {getApplicableAggregations(numericFields.find(f => f.key === config.yAxis[0])?.type || 'number').map(agg => (
                      <button
                        key={agg.key}
                        onClick={() => updateConfig('aggregation', agg.key)}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          config.aggregation === agg.key
                            ? 'border-secondary bg-secondary/10 text-secondary'
                            : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                        )}
                      >
                        {agg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Granularity */}
              {needsGranularity && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Time Granularity</h4>
                  <div className="flex flex-wrap gap-2">
                    {timeGranularities.map(g => (
                      <button
                        key={g.key}
                        onClick={() => updateConfig('granularity', g.key)}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          config.granularity === g.key
                            ? 'border-secondary bg-secondary/10 text-secondary'
                            : 'border-border bg-surface text-text-secondary hover:bg-surface-elevated'
                        )}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Preview</h4>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <ChartRenderer
                    type={chartType}
                    data={mockChartData[dataSource] || []}
                    config={config}
                  />
                </div>
              </div>

              {!canProceed() && (
                <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3 text-xs text-warning">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Please select all required fields before saving.
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSave} disabled={!canProceed()}>
                  <Check className="mr-1.5 h-4 w-4" /> Add Widget
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Report Builder Modal ─── */
export default function ReportBuilderModal({ report, onClose, onSave }) {
  const isEditing = !!report;
  const [step, setStep] = useState(1); // 1: template, 2: basic info, 3: builder, 4: review
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState({
    name: report?.name || '',
    description: report?.description || '',
    dataSource: report?.dataSource || 'tenants',
    chartType: report?.chartType || 'bar',
    isShared: report?.isShared ?? true,
    tenantScope: report?.tenantScope || 'all',
    tags: report?.tags || [],
    widgets: report?.widgets || [],
  });
  const [showWidgetBuilder, setShowWidgetBuilder] = useState(false);
  const [editingWidgetIndex, setEditingWidgetIndex] = useState(null);
  const [tagInput, setTagInput] = useState('');

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (template.key === 'blank') {
      setStep(2);
    } else {
      // Pre-fill based on template
      const presets = {
        'revenue-dashboard': { dataSource: 'revenue', chartType: 'combo', tags: ['revenue'] },
        'tenant-overview': { dataSource: 'tenants', chartType: 'table', tags: ['operations'] },
        'usage-analytics': { dataSource: 'usage', chartType: 'area', tags: ['performance'] },
        'health-monitor': { dataSource: 'health', chartType: 'line', tags: ['infrastructure'] },
        'support-metrics': { dataSource: 'support', chartType: 'bar', tags: ['support'] },
      };
      const preset = presets[template.key] || {};
      setForm(prev => ({
        ...prev,
        name: template.label,
        description: template.description,
        ...preset,
      }));
      setStep(2);
    }
  };

  const addWidget = (widget) => {
    if (editingWidgetIndex !== null) {
      setForm(prev => ({
        ...prev,
        widgets: prev.widgets.map((w, i) => i === editingWidgetIndex ? widget : w),
      }));
      setEditingWidgetIndex(null);
    } else {
      setForm(prev => ({ ...prev, widgets: [...prev.widgets, widget] }));
    }
  };

  const removeWidget = (index) => {
    setForm(prev => ({ ...prev, widgets: prev.widgets.filter((_, i) => i !== index) }));
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSave = () => {
    onSave({
      ...form,
      id: report?.id || `RPT-${Date.now().toString(36).toUpperCase()}`,
      createdBy: report?.createdBy || 'You',
      createdAt: report?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      lastRun: report?.lastRun || null,
      schedule: report?.schedule || null,
    });
    onClose();
  };

  const canProceed = () => {
    if (step === 2) return form.name.trim().length > 0;
    if (step === 3) return form.widgets.length > 0;
    return true;
  };

  const previewData = mockChartData[form.dataSource] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-auto rounded-xl border border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10">
              <BarChart3 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {isEditing ? 'Edit Report' : 'Create Custom Report'}
              </h3>
              <p className="text-xs text-text-muted">
                Step {step} of 4 · {step === 1 ? 'Choose Template' : step === 2 ? 'Basic Info' : step === 3 ? 'Build Report' : 'Review & Save'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ─── STEP 1: Template Selection ─── */}
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Start from a Template</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {reportTemplates.map((template) => (
                  <button
                    key={template.key}
                    onClick={() => handleTemplateSelect(template)}
                    className={cn(
                      'flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all',
                      selectedTemplate?.key === template.key
                        ? 'border-secondary bg-secondary/5'
                        : 'border-border bg-surface hover:border-secondary/30'
                    )}
                  >
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg',
                      selectedTemplate?.key === template.key ? 'bg-secondary/10' : 'bg-neutral/10'
                    )}>
                      <TemplateIcon template={template.key} className={cn('h-5 w-5', selectedTemplate?.key === template.key ? 'text-secondary' : 'text-text-muted')} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-semibold', selectedTemplate?.key === template.key ? 'text-secondary' : 'text-text-primary')}>
                        {template.label}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} variant="outline">
                  Skip Template <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Basic Info ─── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Report Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="e.g. Monthly Revenue Dashboard"
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    rows={2}
                    placeholder="What does this report show?"
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Data Source</label>
                  <select
                    value={form.dataSource}
                    onChange={(e) => updateForm('dataSource', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {dataSources.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Tenant Scope</label>
                  <select
                    value={form.tenantScope}
                    onChange={(e) => updateForm('tenantScope', e.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Tenants</option>
                    <option value="TNT-001">Grand Hotel Boston</option>
                    <option value="TNT-002">Seaside Resort Miami</option>
                    <option value="TNT-003">Mountain Lodge Aspen</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary/10 border border-secondary/20 px-2.5 py-0.5 text-xs font-medium text-secondary">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-danger"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
                </div>
              </div>

              {/* Sharing */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">Share with Team</p>
                  <p className="text-xs text-text-muted">Make this report visible to other admins</p>
                </div>
                <button
                  onClick={() => updateForm('isShared', !form.isShared)}
                  className={cn(
                    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
                    form.isShared ? 'bg-accent' : 'bg-border'
                  )}
                >
                  <span className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm',
                    form.isShared ? 'translate-x-6' : 'translate-x-1'
                  )} />
                </button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceed()}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Builder ─── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Report Widgets</h4>
                <Button size="sm" onClick={() => { setEditingWidgetIndex(null); setShowWidgetBuilder(true); }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Widget
                </Button>
              </div>

              {form.widgets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
                  <BarChart3 className="mx-auto h-10 w-10 text-text-muted mb-3" />
                  <p className="text-sm text-text-muted">No widgets yet. Add your first widget to get started.</p>
                  <Button size="sm" className="mt-3" onClick={() => { setEditingWidgetIndex(null); setShowWidgetBuilder(true); }}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add Widget
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.widgets.map((widget, i) => (
                    <div key={i} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ChartTypeIcon type={widget.type} className="h-4 w-4 text-secondary" />
                          <span className="text-sm font-medium text-text-primary capitalize">{widget.type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingWidgetIndex(i); setShowWidgetBuilder(true); }}
                            className="p-1 text-text-muted hover:text-text-primary"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => removeWidget(i)}
                            className="p-1 text-text-muted hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-3">
                        <ChartRenderer
                          type={widget.type}
                          data={previewData}
                          config={widget}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={!canProceed()}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Review ─── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Report Name</p>
                  <p className="text-lg font-bold text-text-primary">{form.name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">Description</p>
                  <p className="text-sm text-text-secondary">{form.description || 'No description'}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">Data Source</p>
                    <p className="text-text-primary">{dataSources.find(s => s.key === form.dataSource)?.label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">Tenant Scope</p>
                    <p className="text-text-primary">{form.tenantScope === 'all' ? 'All Tenants' : form.tenantScope}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wider">Widgets</p>
                    <p className="text-text-primary">{form.widgets.length}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {form.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-secondary/10 border border-secondary/20 px-2 py-0.5 text-xs font-medium text-secondary">
                        {tag}
                      </span>
                    ))}
                    {form.tags.length === 0 && <span className="text-xs text-text-muted">No tags</span>}
                  </div>
                </div>
              </div>

              {/* Widget Previews */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Widget Previews</h4>
                {form.widgets.map((widget, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ChartTypeIcon type={widget.type} className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-medium text-text-primary capitalize">Widget {i + 1}: {widget.type}</span>
                    </div>
                    <ChartRenderer
                      type={widget.type}
                      data={previewData}
                      config={widget}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-1.5 h-4 w-4" /> {isEditing ? 'Save Changes' : 'Create Report'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Widget Builder Modal */}
      {showWidgetBuilder && (
        <WidgetBuilder
          isOpen={showWidgetBuilder}
          onClose={() => { setShowWidgetBuilder(false); setEditingWidgetIndex(null); }}
          onSave={addWidget}
          dataSource={form.dataSource}
          existingWidget={editingWidgetIndex !== null ? form.widgets[editingWidgetIndex] : null}
        />
      )}
    </div>
  );
}
