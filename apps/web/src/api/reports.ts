import { api } from './client';

export interface ReportColumn {
  key: string;
  label: string;
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date';
}
export interface ReportParamDef {
  key: string;
  label: string;
  type: 'date' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  dynamicOptions?: 'properties';
}
export interface ReportDefinition {
  key: string;
  name: string;
  description: string;
  category: string;
  params: ReportParamDef[];
  columns: ReportColumn[];
}
export interface ReportRunItem {
  id: string;
  definitionKey: string;
  name: string;
  params: Record<string, string>;
  rowCount: number;
  status: string;
  error: string | null;
  createdAt: string;
  result?: {
    columns: ReportColumn[];
    rows: Record<string, unknown>[];
    summary: { label: string; value: number; format: string }[];
    truncated: boolean;
  };
}
export interface ScheduledReportItem {
  id: string;
  definitionKey: string;
  name: string;
  params: Record<string, string>;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  timeOfDay: string;
  recipients: string[];
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

const unwrap = (r: any) =>
  r && typeof r === 'object' && 'data' in r && r.data !== undefined ? (r.data?.data ?? r.data) : r;

export const getDefinitions = () =>
  api.get('/v1/reports/definitions').then((r: any) => unwrap(r) as ReportDefinition[]);
export const runReport = (definitionKey: string, params: Record<string, string>) =>
  api
    .post('/v1/reports/run', { definitionKey, params })
    .then((r: any) => unwrap(r) as ReportRunItem);
export const getRuns = (page = 1, definitionKey?: string) =>
  api
    .get('/v1/reports/runs', { params: { page, limit: 20, definitionKey } })
    .then((r: any) => unwrap(r) as { items: ReportRunItem[]; total: number; page: number });
export const getRun = (id: string) =>
  api.get(`/v1/reports/runs/${id}`).then((r: any) => unwrap(r) as ReportRunItem);
export const getSchedules = () =>
  api.get('/v1/reports/schedules').then((r: any) => unwrap(r) as ScheduledReportItem[]);
export const createSchedule = (body: Partial<ScheduledReportItem>) =>
  api.post('/v1/reports/schedules', body).then((r: any) => unwrap(r) as ScheduledReportItem);
export const updateSchedule = (id: string, body: Partial<ScheduledReportItem>) =>
  api.patch(`/v1/reports/schedules/${id}`, body).then((r: any) => unwrap(r) as ScheduledReportItem);
export const deleteSchedule = (id: string) => api.delete(`/v1/reports/schedules/${id}`);
export const getProperties = () =>
  api
    .get('/v1/properties')
    .then((r: any) => unwrap(r) as { id: string; name: string }[])
    .catch(() => [] as { id: string; name: string }[]);

async function downloadBlob(id: string, ext: string) {
  const out: any = await api.get(`/v1/reports/runs/${id}/export?as=json`);
  const payload = unwrap(out) as { filename?: string; content?: string };
  if (!payload?.content) throw new Error('Export failed: empty response');
  const blob = new Blob([payload.content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = payload.filename ?? `report-${id}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const downloadRunCsv = (id: string) => downloadBlob(id, 'csv');

// ─── Admin reports surface (template-centric aliases) ───
// The admin Reports & Analytics page speaks in "templates"; the backend speaks
// in "definitions + runs + schedules". These aliases bridge the two vocabularies
// so both surfaces share one set of real endpoints.

export const getReportDashboard = () =>
  api.get('/v1/reports/dashboard').then((r: any) => unwrap(r) as Record<string, number>);

export const getTemplates = () => getDefinitions().then((defs) => ({ items: defs }));

export const getScheduledReports = () =>
  getSchedules().then((list) => ({
    items: list.map((s) => ({
      id: s.id,
      templateId: s.definitionKey,
      name: s.name,
      params: s.params,
      frequency: s.frequency,
      format: 'csv',
      recipients: s.recipients ?? [],
      status: s.isActive ? 'active' : 'paused',
      nextRunAt: s.nextRunAt,
      lastRunAt: s.lastRunAt,
    })),
  }));

export const getReportRuns = (page = 1, templateId?: string) =>
  getRuns(page, templateId).then((r) => ({
    items: r.items.map((run) => ({
      id: run.id,
      templateId: run.definitionKey,
      name: run.name,
      status: run.status,
      rows: run.result?.rows ?? [],
      rowCount: run.rowCount,
      createdAt: run.createdAt,
      error: run.error,
    })),
    total: r.total,
    page: r.page,
  }));

export const createTemplate = (body: {
  name: string;
  description?: string;
  category?: string;
  fields?: { name: string; label: string }[];
  config?: Record<string, unknown>;
}) => api.post('/v1/reports/definitions', body).then((r: any) => unwrap(r) as ReportDefinition);

export const buildCustomReport = (report: {
  id?: string;
  definitionKey?: string;
  params?: Record<string, string>;
}) => {
  const key = report?.definitionKey ?? report?.id;
  if (!key) return Promise.reject(new Error('Save the template before running a custom report'));
  return runReport(key, report?.params ?? {});
};

export const createScheduledReport = ({ report, schedule }: any) =>
  createSchedule({
    definitionKey: report?.id ?? report?.definitionKey,
    name: schedule?.name ?? report?.name,
    params: report?.params ?? {},
    frequency: schedule?.frequency ?? 'DAILY',
    dayOfWeek: schedule?.dayOfWeek,
    dayOfMonth: schedule?.dayOfMonth,
    timeOfDay: schedule?.timeOfDay ?? '06:00',
    recipients: schedule?.recipients ?? [],
    isActive: schedule?.enabled ?? true,
  } as Partial<ScheduledReportItem>);

export const updateScheduledReport = (id: string, { report, schedule }: any) =>
  updateSchedule(id, {
    definitionKey: report?.id ?? report?.definitionKey,
    name: schedule?.name ?? report?.name,
    params: report?.params ?? {},
    frequency: schedule?.frequency,
    dayOfWeek: schedule?.dayOfWeek,
    dayOfMonth: schedule?.dayOfMonth,
    timeOfDay: schedule?.timeOfDay,
    recipients: schedule?.recipients,
    isActive: schedule?.enabled,
  } as Partial<ScheduledReportItem>);

export const deleteScheduledReport = (id: string) => deleteSchedule(id);

export const runScheduledReport = (id: string) =>
  api.post(`/v1/reports/schedules/${id}/run`).then((r: any) => unwrap(r) as ReportRunItem);

export const executeReport = (templateId: string, params: Record<string, string> = {}) =>
  runReport(templateId, params).then((run) => ({ ...run, rows: run.result?.rows ?? [] }));

export const exportReport = (runId: string, _format = 'csv') =>
  downloadBlob(runId, 'csv').then(() => ({}));
