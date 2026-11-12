// Feature Flags v2 — 13 live gates, single process.
import { execFileSync } from 'node:child_process';

const API = process.env.API_URL || 'http://localhost:3001';

async function jfetch(method, path, body, token) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, json, text };
}

function findToken(o) {
  if (!o || typeof o !== 'object') return null;
  for (const k of Object.keys(o)) {
    if (/token/i.test(k) && typeof o[k] === 'string') return o[k];
    const t = findToken(o[k]);
    if (t) return t;
  }
  return null;
}

const ctx = execFileSync('npx', ['tsx', 'scripts/derive-flag-context.ts'], { cwd: 'apps/api', encoding: 'utf8' }).trim().split('\n');
const EMAIL = (ctx[0] || '').trim();
const TID = (ctx[1] || '').trim();
if (!TID) { console.log('FATAL: could not derive demo tenant id'); process.exit(1); }

let token = '';
for (const body of [{ email: EMAIL, password: 'Vimad#2026' }, { email: EMAIL, password: 'Vimad#2026', tenantSlug: 'vimad-internal' }]) {
  const r = await jfetch('POST', '/auth/login', body);
  token = findToken(r.json) || '';
  if (token) { console.log('auth: login endpoint'); break; }
}
if (!token && EMAIL) {
  const out = execFileSync('npx', ['tsx', 'scripts/flag-gate-sign.ts', EMAIL], { cwd: 'apps/api', encoding: 'utf8' });
  token = (out.trim().split('\n').pop() || '').trim();
  if (token) console.log('auth: signed platform JWT (fallback)');
}
if (!token) { console.log('FATAL: no auth token'); process.exit(1); }

let pass = 0, total = 0;
function gate(n, name, ok, detail) {
  total++;
  if (ok) { pass++; console.log('GATE ' + n + ': PASS'); }
  else { console.log('GATE ' + n + ': FAIL — ' + name); if (detail) console.log('  body: ' + String(detail).slice(0, 400).replace(/\n/g, ' ')); }
}
const R = (m, p, b) => jfetch(m, p, b, token);

// cleanup any leftover gate flag from earlier runs
const list0 = await R('GET', '/admin/feature-flags');
const old = (list0.json?.flags || []).find((f) => f.key === 'gate-test-flag');
if (old) await R('DELETE', '/admin/feature-flags/' + old.id);

// 1
const g1 = await R('GET', '/admin/feature-flags');
gate(1, 'list >= 8 flags', g1.status === 200 && (g1.json?.flags || []).length >= 8, g1.text);

// 2
const g2 = await R('POST', '/admin/feature-flags', { key: 'gate-test-flag', description: 'Gate verification flag', owner: 'gates', valueType: 'boolean', defaultValue: false, rolloutPct: 0 });
const FID = g2.json?.flag?.id || '';
gate(2, 'create -> 201', (g2.status === 201 || g2.status === 200) && !!FID, g2.text);

// helper for flag-scoped gates when FID missing
const nofid = !FID;

// 3
const g3 = await R('GET', '/admin/feature-flags/evaluate/' + TID);
const r3 = (g3.json?.results || []).find((x) => x.key === 'gate-test-flag');
gate(3, 'new flag resolves default(off)', !nofid && g3.status === 200 && r3?.source === 'default', g3.text);

// 4
const g4 = nofid ? { status: 0, text: 'no FID' } : await R('POST', `/admin/feature-flags/${FID}/overrides`, { tenantId: TID, value: true, reason: 'gate test override' });
const g4b = await R('GET', '/admin/feature-flags/evaluate/' + TID);
const r4 = (g4b.json?.results || []).find((x) => x.key === 'gate-test-flag');
gate(4, 'override flips to override/true', g4.status === 200 && r4?.source === 'override' && r4?.value === true, g4.text || g4b.text);

// 5
const det = nofid ? { status: 0, json: null, text: 'no FID' } : await R('GET', '/admin/feature-flags/' + FID);
const OV = det.json?.overrides?.[0]?.id || '';
const g5 = OV ? await R('DELETE', '/admin/feature-flags/overrides/' + OV) : { status: 0, text: 'no override id; detail body: ' + det.text };
gate(5, 'override delete -> 200', g5.status === 200, g5.text);

// 6
await R('POST', `/admin/feature-flags/${FID}/rollout`, { rolloutPct: 100, reason: 'gate ramp' });
const g6b = await R('GET', '/admin/feature-flags/evaluate/' + TID);
const r6 = (g6b.json?.results || []).find((x) => x.key === 'gate-test-flag');
gate(6, 'rollout 100% -> source rollout', !nofid && r6?.source === 'rollout', g6b.text);

// 7
await R('POST', `/admin/feature-flags/${FID}/kill`, { reason: 'gate kill test' });
const g7b = await R('GET', '/admin/feature-flags/evaluate/' + TID);
const r7 = (g7b.json?.results || []).find((x) => x.key === 'gate-test-flag');
gate(7, 'kill -> source kill', !nofid && r7?.source === 'kill', g7b.text);

// 8
const g8 = nofid ? { status: 0, text: 'no FID' } : await R('POST', `/admin/feature-flags/${FID}/restore`, { reason: 'gate restore' });
gate(8, 'restore -> 200', g8.status === 200, g8.text);

// 9
const g9 = nofid ? { status: 0, text: 'no FID' } : await R('GET', `/admin/feature-flags/${FID}/trace/${TID}`);
gate(9, 'trace verdict + hash', g9.status === 200 && g9.json?.verdict && g9.json?.hashPct !== undefined, g9.text);

// 10
const g10 = nofid ? { status: 0, text: 'no FID' } : await R('GET', '/admin/feature-flags/' + FID);
gate(10, 'detail analytics + history', g10.status === 200 && g10.json?.analytics && g10.json?.changes, g10.text);

// 11
const g11 = await R('POST', '/admin/feature-flags/impressions', { items: [{ flagKey: 'gate-test-flag', tenantId: TID, on: true, error: false }] });
gate(11, 'impressions accepted', g11.status === 200, g11.text);

// 12
const g12 = await R('GET', '/admin/feature-flags/bootstrap/' + TID);
gate(12, 'bootstrap demo override true', g12.status === 200 && g12.json?.values?.['new-checkin-flow'] === true, g12.text);

// 13
const g13 = nofid ? { status: 0, text: 'no FID' } : await R('DELETE', '/admin/feature-flags/' + FID);
gate(13, 'cleanup delete', g13.status === 200, g13.text);

// 14
const g14 = await R('GET', '/v1/flags/evaluate');
gate(14, 'tenant evaluate returns full catalog', g14.status === 200 && typeof g14.json?.values === 'object' && Object.keys(g14.json.values).length >= 80, JSON.stringify(g14.json?.values || {}).slice(0, 200));

// 15
const g15 = await R('GET', '/v1/flags/evaluate/guest-portal-commerce');
gate(15, 'single-key evaluate true (rollout 100)', g15.status === 200 && g15.json?.value === true, g15.text);

// 16
const g16 = await R('POST', '/v1/flags/impressions', { items: [{ flagKey: 'guest-portal-commerce', on: true }] });
gate(16, 'tenant impressions accepted', g16.status === 200, g16.text);


console.log('');
console.log('FEATURE FLAGS GATES: ' + pass + '/' + total + ' passed');
process.exit(pass === total ? 0 : 1);
