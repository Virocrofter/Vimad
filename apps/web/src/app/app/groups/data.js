/* src/app/app/groups/data.js — metadata only (G1: all data now from the API) */

export const roomingListTemplate = [
  [
    'Last Name',
    'First Name',
    'Email',
    'Phone',
    'Room Type',
    'Arrival',
    'Departure',
    'Special Requests',
  ],
  [
    'Smith',
    'John',
    'john@email.com',
    '+15550101',
    'Deluxe King',
    '2026-11-20',
    '2026-11-22',
    'High floor',
  ],
  [
    'Smith',
    'Jane',
    'jane@email.com',
    '+15550102',
    'Deluxe King',
    '2026-11-20',
    '2026-11-22',
    'Adjoining to John',
  ],
];

export const statusMeta = {
  definite: { label: 'Definite', class: 'bg-accent/10 text-accent border-accent/20' },
  tentative: { label: 'Tentative', class: 'bg-warning/10 text-warning border-warning/20' },
  prospect: { label: 'Prospect', class: 'bg-info/10 text-info border-info/20' },
  cancelled: { label: 'Cancelled', class: 'bg-danger/10 text-danger border-danger/20' },
  completed: { label: 'Completed', class: 'bg-neutral/10 text-text-muted border-border' },
};

export const blockTypeMeta = {
  courtesy: { label: 'Courtesy', class: 'bg-secondary/10 text-secondary border-secondary/20' },
  negotiated: { label: 'Negotiated', class: 'bg-info/10 text-info border-info/20' },
  contract: { label: 'Contract', class: 'bg-accent/10 text-accent border-accent/20' },
};

export const groupColor = (blockType) =>
  ({
    courtesy: { color: 'bg-secondary/20 border-secondary/30', textColor: 'text-secondary' },
    negotiated: { color: 'bg-info/20 border-info/30', textColor: 'text-info' },
    contract: { color: 'bg-accent/20 border-accent/30', textColor: 'text-accent' },
  })[blockType] ?? { color: 'bg-secondary/20 border-secondary/30', textColor: 'text-secondary' };

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount ?? 0);
}

export function fmtDate(d) {
  return d ? String(d).slice(0, 10) : '—';
}

export function downloadTemplate() {
  const csv = roomingListTemplate.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rooming-list-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Minimal CSV parser for the rooming-list import (handles quoted commas).
export function parseRoomingCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const pick = (r, ...names) => {
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i >= 0 && r[i]) return r[i].trim();
    }
    return undefined;
  };
  return rows.slice(1).map((r) => ({
    firstName: pick(r, 'first name', 'firstname') || '',
    lastName: pick(r, 'last name', 'lastname') || '',
    email: pick(r, 'email'),
    phone: pick(r, 'phone'),
    roomTypeName: pick(r, 'room type', 'roomtype'),
    arrivalDate: pick(r, 'arrival', 'arrivaldate'),
    departureDate: pick(r, 'departure', 'departuredate'),
    notes: pick(r, 'special requests', 'requests', 'notes'),
  }));
}
