import { useRef, useState } from 'react';
import {
  useChainStandard,
  useOnboardingActions,
  useOnboardingImport,
  useOnboardingImports,
  usePropertiesList,
  usePropertyTemplates,
} from '../../../hooks/useOnboarding';
import { onboardingApi } from '../../../api/bulkOnboarding';
import './onboarding.css';

const zar = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });

const errMsg = (e) =>
  e?.response?.data?.error?.message ||
  e?.message ||
  (typeof e === 'string' ? e : 'Something went wrong');

const STATUS_LABEL = {
  pending: 'Pending',
  ready: 'Ready',
  importing: 'Importing',
  completed: 'Completed',
  created: 'Created',
  error: 'Error',
};

const TABS = [
  ['csv', 'CSV Import'],
  ['clone', 'Clone Property'],
  ['templates', 'Templates'],
  ['chain', 'Chain Standard'],
];

export default function OnboardingPage() {
  const [tab, setTab] = useState('csv');
  return (
    <div className="ob-wrap">
      <div className="ob-head">
        <div>
          <h1>Bulk Onboarding</h1>
          <p className="ob-sub">
            CSV import wizard, property clone and chain-standard config — a 4-property group goes
            live from one CSV in an afternoon.
          </p>
        </div>
      </div>
      <div className="ob-tabs">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={tab === k ? 'ob-tab ob-tab-active' : 'ob-tab'}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'csv' && <CsvTab />}
      {tab === 'clone' && <CloneTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'chain' && <ChainTab />}
    </div>
  );
}

/* ─── CSV Import wizard ─── */

function CsvTab() {
  const fileRef = useRef(null);
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('properties.csv');
  const [stagedId, setStagedId] = useState(null);
  const [executed, setExecuted] = useState(null);

  const { data: recent } = useOnboardingImports();
  const { data: staged, isFetching: staging } = useOnboardingImport(stagedId);
  const { uploadCsv, executeImport } = useOnboardingActions();

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result ?? ''));
    reader.readAsText(f);
  };

  const downloadTemplate = async () => {
    const res = await onboardingApi.templateCsv();
    const blob = new Blob([res.data], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'vimad-onboarding-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const stage = async () => {
    setExecuted(null);
    try {
      const imp = await uploadCsv.mutateAsync({ fileName, csv });
      setStagedId(imp.id);
    } catch (e) {
      uploadCsv.reset();
      alert(errMsg(e));
    }
  };

  const run = async () => {
    try {
      const done = await executeImport.mutateAsync(stagedId);
      setExecuted(done?.stats?.executed ?? null);
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const stats = staged?.stats;
  const validRows = (staged?.rows ?? []).filter((r) => r.status !== 'error');
  const errorRows = (staged?.rows ?? []).filter((r) => r.status === 'error');

  return (
    <div className="ob-grid">
      <div className="ob-card">
        <div className="ob-card-title">1. Upload CSV</div>
        <p className="ob-hint">
          One row per room. Columns: propertyCode, propertyName, city, country, timezone, currency,
          roomTypeCode, roomTypeName, baseOccupancy, maxOccupancy, roomNumber, floor, ratePlanCode,
          ratePlanName, baseRate.
        </p>
        <div className="ob-row">
          <button type="button" className="ob-btn ob-btn-ghost" onClick={downloadTemplate}>
            Download sample CSV
          </button>
          <button
            type="button"
            className="ob-btn ob-btn-ghost"
            onClick={() => fileRef.current?.click()}
          >
            Choose file
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={pickFile} />
          <span className="ob-file">{fileName}</span>
        </div>
        <textarea
          className="ob-textarea"
          rows={8}
          placeholder="…or paste the CSV here"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="ob-row">
          <button
            type="button"
            className="ob-btn ob-btn-primary"
            disabled={!csv.trim() || uploadCsv.isPending}
            onClick={stage}
          >
            {uploadCsv.isPending || staging ? 'Validating…' : 'Upload & validate'}
          </button>
        </div>
        {uploadCsv.isError && (
          <div className="ob-banner ob-banner-error">{errMsg(uploadCsv.error)}</div>
        )}
      </div>

      {staged && (
        <div className="ob-card">
          <div className="ob-card-title">2. Preview &amp; validate</div>
          <div className="ob-chips">
            <span className="ob-chip">{stats?.properties ?? 0} properties</span>
            <span className="ob-chip">{stats?.roomTypes ?? 0} room types</span>
            <span className="ob-chip">{stats?.rooms ?? 0} rooms</span>
            <span className="ob-chip">{stats?.ratePlans ?? 0} rate plans</span>
            <span className={errorRows.length ? 'ob-chip ob-chip-danger' : 'ob-chip ob-chip-ok'}>
              {errorRows.length} error rows
            </span>
          </div>

          {errorRows.length > 0 && (
            <div className="ob-table-wrap ob-table-errors">
              <table className="ob-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Problem</th>
                  </tr>
                </thead>
                <tbody>
                  {errorRows.slice(0, 20).map((r) => (
                    <tr key={r.id}>
                      <td>{r.rowNumber}</td>
                      <td className="ob-error-text">{r.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {errorRows.length > 20 && (
                <div className="ob-hint">…and {errorRows.length - 20} more</div>
              )}
            </div>
          )}

          <div className="ob-table-wrap">
            <table className="ob-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Property</th>
                  <th>Room type</th>
                  <th>Room</th>
                  <th>Rate plan</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {validRows.slice(0, 100).map((r) => {
                  const d = r.data || {};
                  return (
                    <tr key={r.id}>
                      <td>{r.rowNumber}</td>
                      <td>
                        <span className="ob-code">{d.propertyCode}</span> {d.propertyName}
                      </td>
                      <td>{d.roomTypeCode}</td>
                      <td>{d.roomNumber}</td>
                      <td>{d.ratePlanCode || '—'}</td>
                      <td>{d.baseRate != null ? zar.format(Number(d.baseRate)) : '—'}</td>
                      <td>
                        <span className={`ob-badge ob-badge-${r.status}`}>
                          {STATUS_LABEL[r.status] || r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {validRows.length > 100 && (
              <div className="ob-hint">Showing 100 of {validRows.length} rows</div>
            )}
          </div>

          <div className="ob-row">
            <button
              type="button"
              className="ob-btn ob-btn-primary"
              disabled={
                !validRows.length || executeImport.isPending || staged.status === 'completed'
              }
              onClick={run}
            >
              {staged.status === 'completed'
                ? 'Imported'
                : executeImport.isPending
                  ? 'Importing…'
                  : `Import ${stats?.properties ?? 0} propert${(stats?.properties ?? 0) === 1 ? 'y' : 'ies'}`}
            </button>
          </div>

          {executed && (
            <div className="ob-banner ob-banner-ok">
              Done — {executed.properties} properties, {executed.roomTypes} room types,{' '}
              {executed.rooms} rooms, {executed.ratePlans} rate plans created
              {executed.errors ? ` (${executed.errors} rows failed)` : ''}. They are live on the
              room plan now.
            </div>
          )}
        </div>
      )}

      <div className="ob-card">
        <div className="ob-card-title">Recent imports</div>
        {!recent?.length && <p className="ob-hint">No imports yet.</p>}
        {recent?.length > 0 && (
          <div className="ob-table-wrap">
            <table className="ob-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Status</th>
                  <th>Rows</th>
                  <th>When</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((imp) => (
                  <tr key={imp.id}>
                    <td>{imp.fileName}</td>
                    <td>
                      <span className={`ob-badge ob-badge-${imp.status}`}>
                        {STATUS_LABEL[imp.status] || imp.status}
                      </span>
                    </td>
                    <td>
                      {imp.stats?.errorRows ? `${imp.stats.errorRows} errors · ` : ''}
                      {imp.stats?.rooms ?? 0} rooms
                    </td>
                    <td>{new Date(imp.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className="ob-btn ob-btn-ghost ob-btn-xs"
                        onClick={() => setStagedId(imp.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Clone ─── */

function CloneTab() {
  const { data: properties } = usePropertiesList();
  const { cloneProperty } = useOnboardingActions();
  const [sourceId, setSourceId] = useState('');
  const [form, setForm] = useState({ name: '', code: '', city: '' });
  const [result, setResult] = useState(null);

  const run = async () => {
    setResult(null);
    try {
      const r = await cloneProperty.mutateAsync({
        sourcePropertyId: sourceId,
        name: form.name,
        code: form.code,
        city: form.city || undefined,
      });
      setResult(r);
    } catch (e) {
      alert(errMsg(e));
    }
  };

  return (
    <div className="ob-grid">
      <div className="ob-card">
        <div className="ob-card-title">Clone a property</div>
        <p className="ob-hint">
          Copies room types, rooms and rate plans. Guests, reservations, folios and history are
          never copied.
        </p>
        <label className="ob-label">Source property</label>
        <select className="ob-input" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="">Select…</option>
          {(properties ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
        <label className="ob-label">New property name</label>
        <input
          className="ob-input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Umhlanga Sands Hotel"
        />
        <label className="ob-label">Property code</label>
        <input
          className="ob-input"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="e.g. DEMO-06"
        />
        <label className="ob-label">City (optional)</label>
        <input
          className="ob-input"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <div className="ob-row">
          <button
            type="button"
            className="ob-btn ob-btn-primary"
            disabled={
              !sourceId || !form.name.trim() || !form.code.trim() || cloneProperty.isPending
            }
            onClick={run}
          >
            {cloneProperty.isPending ? 'Cloning…' : 'Clone property'}
          </button>
        </div>
      </div>
      {result && (
        <div className="ob-card">
          <div className="ob-card-title">Clone complete</div>
          <div className="ob-banner ob-banner-ok">
            <span className="ob-code">{result.property.code}</span> {result.property.name} is live —{' '}
            {result.roomTypes} room types, {result.rooms} rooms, {result.ratePlans} rate plans.
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Templates ─── */

function TemplatesTab() {
  const { data: templates } = usePropertyTemplates();
  const { data: properties } = usePropertiesList();
  const { deleteTemplate, captureTemplate, applyTemplate } = useOnboardingActions();
  const [capture, setCapture] = useState({ propertyId: '', name: '' });
  const [applying, setApplying] = useState(null);
  const [applyForm, setApplyForm] = useState({ name: '', code: '', city: '' });
  const [applied, setApplied] = useState(null);

  const doCapture = async () => {
    try {
      await captureTemplate.mutateAsync(capture);
      setCapture({ propertyId: '', name: '' });
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const doApply = async (id) => {
    try {
      const r = await applyTemplate.mutateAsync({ id, payload: applyForm });
      setApplied(r);
      setApplying(null);
      setApplyForm({ name: '', code: '', city: '' });
    } catch (e) {
      alert(errMsg(e));
    }
  };

  return (
    <div className="ob-grid">
      <div className="ob-card">
        <div className="ob-card-title">Capture template from property</div>
        <p className="ob-hint">
          Save a property&apos;s room types, rooms and rate plans as a reusable template.
        </p>
        <label className="ob-label">Property</label>
        <select
          className="ob-input"
          value={capture.propertyId}
          onChange={(e) => setCapture({ ...capture, propertyId: e.target.value })}
        >
          <option value="">Select…</option>
          {(properties ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
        <label className="ob-label">Template name</label>
        <input
          className="ob-input"
          value={capture.name}
          onChange={(e) => setCapture({ ...capture, name: e.target.value })}
          placeholder="e.g. Boutique 20-key standard"
        />
        <div className="ob-row">
          <button
            type="button"
            className="ob-btn ob-btn-primary"
            disabled={!capture.propertyId || !capture.name.trim() || captureTemplate.isPending}
            onClick={doCapture}
          >
            {captureTemplate.isPending ? 'Saving…' : 'Save template'}
          </button>
        </div>
      </div>

      <div className="ob-card">
        <div className="ob-card-title">Templates</div>
        {!templates?.length && (
          <p className="ob-hint">No templates yet — capture one from a property above.</p>
        )}
        {templates?.length > 0 && (
          <div className="ob-table-wrap">
            <table className="ob-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Room types</th>
                  <th>Rooms</th>
                  <th>Rate plans</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => {
                  const cfg = t.config || {};
                  const roomTypes = cfg.roomTypes ?? [];
                  const rooms = roomTypes.reduce((n, rt) => n + (rt.rooms?.length ?? 0), 0);
                  const ratePlans = roomTypes.reduce((n, rt) => n + (rt.ratePlans?.length ?? 0), 0);
                  return (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{roomTypes.length}</td>
                      <td>{rooms}</td>
                      <td>{ratePlans}</td>
                      <td className="ob-actions">
                        <button
                          type="button"
                          className="ob-btn ob-btn-ghost ob-btn-xs"
                          onClick={() => {
                            setApplying(applying === t.id ? null : t.id);
                            setApplyForm({ name: '', code: '', city: '' });
                          }}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="ob-btn ob-btn-danger ob-btn-xs"
                          onClick={() => {
                            if (window.confirm(`Delete template "${t.name}"?`))
                              deleteTemplate.mutate(t.id);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {applying && (
          <div className="ob-apply-box">
            <label className="ob-label">New property name</label>
            <input
              className="ob-input"
              value={applyForm.name}
              onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
            />
            <label className="ob-label">Property code</label>
            <input
              className="ob-input"
              value={applyForm.code}
              onChange={(e) => setApplyForm({ ...applyForm, code: e.target.value.toUpperCase() })}
            />
            <label className="ob-label">City (optional)</label>
            <input
              className="ob-input"
              value={applyForm.city}
              onChange={(e) => setApplyForm({ ...applyForm, city: e.target.value })}
            />
            <div className="ob-row">
              <button
                type="button"
                className="ob-btn ob-btn-primary"
                disabled={
                  !applyForm.name.trim() || !applyForm.code.trim() || applyTemplate.isPending
                }
                onClick={() => doApply(applying)}
              >
                {applyTemplate.isPending ? 'Creating…' : 'Create property from template'}
              </button>
            </div>
          </div>
        )}

        {applied && (
          <div className="ob-banner ob-banner-ok">
            <span className="ob-code">{applied.property.code}</span> {applied.property.name} created
            — {applied.rooms} rooms, {applied.ratePlans} rate plans.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Chain standard ─── */

function ChainTab() {
  const { data: chain } = useChainStandard();
  const { data: properties } = usePropertiesList();
  const { saveChainStandard } = useOnboardingActions();
  const [sourceId, setSourceId] = useState('');
  const [name, setName] = useState('Chain Standard');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaved(false);
    try {
      await saveChainStandard.mutateAsync({ propertyId: sourceId, name });
      setSaved(true);
      setSourceId('');
    } catch (e) {
      alert(errMsg(e));
    }
  };

  const cfg = chain?.config || null;
  const roomTypes = cfg?.roomTypes ?? [];
  const rooms = roomTypes.reduce((n, rt) => n + (rt.rooms?.length ?? 0), 0);
  const ratePlans = roomTypes.reduce((n, rt) => n + (rt.ratePlans?.length ?? 0), 0);

  return (
    <div className="ob-grid">
      <div className="ob-card">
        <div className="ob-card-title">Current chain standard</div>
        {!chain && (
          <p className="ob-hint">
            No chain standard set. Capture one from your best-configured property — every new
            property in the group then starts from the same room types, rates and config.
          </p>
        )}
        {chain && (
          <>
            <div className="ob-chips">
              <span className="ob-chip">{chain.name}</span>
              <span className="ob-chip">{roomTypes.length} room types</span>
              <span className="ob-chip">{rooms} rooms</span>
              <span className="ob-chip">{ratePlans} rate plans</span>
              <span className="ob-chip ob-chip-ok">{cfg?.property?.currency || 'ZAR'}</span>
            </div>
            <div className="ob-table-wrap">
              <table className="ob-table">
                <thead>
                  <tr>
                    <th>Room type</th>
                    <th>Rooms</th>
                    <th>Rate plans</th>
                    <th>Rack rate</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.map((rt) => (
                    <tr key={rt.code}>
                      <td>
                        <span className="ob-code">{rt.code}</span> {rt.name}
                      </td>
                      <td>{rt.rooms?.length ?? 0}</td>
                      <td>{rt.ratePlans?.length ?? 0}</td>
                      <td>
                        {rt.ratePlans?.length
                          ? zar.format(Number(rt.ratePlans[0].baseRate ?? 0))
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="ob-card">
        <div className="ob-card-title">Set chain standard</div>
        <p className="ob-hint">
          Overwrite the chain standard with a copy of an existing property&apos;s structure.
        </p>
        <label className="ob-label">Copy from property</label>
        <select className="ob-input" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="">Select…</option>
          {(properties ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
        <label className="ob-label">Standard name</label>
        <input className="ob-input" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="ob-row">
          <button
            type="button"
            className="ob-btn ob-btn-primary"
            disabled={!sourceId || saveChainStandard.isPending}
            onClick={save}
          >
            {saveChainStandard.isPending ? 'Saving…' : 'Save as chain standard'}
          </button>
        </div>
        {saved && <div className="ob-banner ob-banner-ok">Chain standard updated.</div>}
      </div>
    </div>
  );
}
