// Billing API adapter - all platform-billing calls go through here.
// Bulk 3 reconciles the backend to these routes; pages never change.

import { getAccessToken } from '../../../stores/authStores';

const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001';

async function req(path, { method = 'GET', body } = {}) {
  const token = getAccessToken();
  const res = await fetch(API_BASE + '/admin/billing' + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const raw = (data && (data.error || data.message)) || res.statusText;
    throw new Error(typeof raw === 'string' ? raw : JSON.stringify(raw));
  }
  return data;
}

export const getSummary = () => req('/summary');

export const listInvoices = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const s = qs.toString();
  return req('/invoices' + (s ? '?' + s : ''));
};

export const getInvoice = (id) => req('/invoices/' + encodeURIComponent(id));
export const createInvoice = (payload) => req('/invoices', { method: 'POST', body: payload });
export const sendInvoice = (id) =>
  req('/invoices/' + encodeURIComponent(id) + '/send', { method: 'POST' });
export const recordPayment = (id, payload) =>
  req('/invoices/' + encodeURIComponent(id) + '/payments', { method: 'POST', body: payload });
export const createCreditNote = (id, payload) =>
  req('/invoices/' + encodeURIComponent(id) + '/credit-note', { method: 'POST', body: payload });

export const listTenants = () => req('/tenants');

// ─── Subscriptions ───
export const pauseSubscription = (id, reason) =>
  req('/subscriptions/' + encodeURIComponent(id) + '/pause', { method: 'POST', body: { reason } });
export const resumeSubscription = (id) =>
  req('/subscriptions/' + encodeURIComponent(id) + '/resume', { method: 'POST' });

// ─── Dunning ───
export const listDunning = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const s = qs.toString();
  return req('/dunning' + (s ? '?' + s : ''));
};
export const sendReminder = (id) =>
  req('/dunning/' + encodeURIComponent(id) + '/remind', { method: 'POST' });
export const resolveDunning = (id, note) =>
  req('/dunning/' + encodeURIComponent(id) + '/resolve', { method: 'POST', body: { note } });
export const getRevenue = () => req('/revenue');

// ─── Contracts ───
export const listContracts = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const s = qs.toString();
  return req('/contracts' + (s ? '?' + s : ''));
};
export const getContract = (id) => req('/contracts/' + encodeURIComponent(id));
export const createContract = (payload) => req('/contracts', { method: 'POST', body: payload });
export const contractAction = (id, action, payload) =>
  req('/contracts/' + encodeURIComponent(id) + '/' + action, {
    method: 'POST',
    body: payload ?? {},
  });
export const getAnalytics = () => req('/analytics');
export const getFinances = () => req('/finances');
