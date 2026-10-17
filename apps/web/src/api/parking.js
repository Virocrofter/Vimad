/* apps/web/src/api/parking.js — T4 parking board client
 * Routed through the shared axios client (api/client.ts): automatic /v1
 * prefixing, preemptive token refresh, single-flight /auth/refresh on 401,
 * and offline-interceptor support. No manual token handling here.
 */
import { apiGet, apiPost, apiPatch, apiDelete } from './client';

// Backend envelope is { data: ... } — unwrap to the payload.
const unwrap = (p) => p.then((body) => body?.data ?? body);

// ─── Board ───

export const fetchBoard = (date, propertyId) =>
  unwrap(apiGet('/v1/parking/board', { date, propertyId }));

export const runAutoAssign = (payload = {}) => unwrap(apiPost('/v1/parking/auto-assign', payload));

// ─── Bays ───

export const fetchBays = (params) => unwrap(apiGet('/v1/parking/bays', params));

export const createBay = (payload) => unwrap(apiPost('/v1/parking/bays', payload));

export const updateBay = (id, patch) => unwrap(apiPatch(`/v1/parking/bays/${id}`, patch));

export const deleteBay = (id) => unwrap(apiDelete(`/v1/parking/bays/${id}`));

export const setCharging = (id, status) =>
  unwrap(apiPost(`/v1/parking/bays/${id}/charging`, { status }));

// ─── Vehicles ───

export const fetchVehicles = (params) => unwrap(apiGet('/v1/parking/vehicles', params));

export const createVehicle = (payload) => unwrap(apiPost('/v1/parking/vehicles', payload));

export const updateVehicle = (id, patch) => unwrap(apiPatch(`/v1/parking/vehicles/${id}`, patch));

export const deactivateVehicle = (id) => unwrap(apiDelete(`/v1/parking/vehicles/${id}`));

// ─── Assignments ───

export const createAssignment = (payload) => unwrap(apiPost('/v1/parking/assignments', payload));

export const updateAssignment = (id, patch) =>
  unwrap(apiPatch(`/v1/parking/assignments/${id}`, patch));

export const checkInAssignment = (id, plate) =>
  unwrap(apiPost(`/v1/parking/assignments/${id}/check-in`, plate ? { plate } : {}));

export const checkOutAssignment = (id) =>
  unwrap(apiPost(`/v1/parking/assignments/${id}/check-out`, {}));

export const cancelAssignment = (id) => unwrap(apiPost(`/v1/parking/assignments/${id}/cancel`, {}));

// ─── Valet ───

export const fetchValetQueue = (propertyId) => unwrap(apiGet('/v1/parking/valet', { propertyId }));

// ─── Guests (for the vehicle form picker) — returns the paginated envelope ───

export const fetchGuests = () => apiGet('/v1/guests', { pageSize: 200 });

// ─── Constants ───

export const ZONES = [
  { value: 'standard', label: 'Standard' },
  { value: 'accessible', label: 'Accessible' },
  { value: 'ev', label: 'EV charging' },
  { value: 'valet', label: 'Valet' },
];

export const BAY_STATUS_STYLE = {
  available: 'bg-success/10 text-success',
  occupied: 'bg-primary/10 text-primary',
  reserved: 'bg-warning/10 text-warning',
  out_of_service: 'bg-danger/10 text-danger',
};

export const CHARGING_STYLE = {
  free: 'bg-surface-elevated text-text-secondary',
  charging: 'bg-info/10 text-info',
  full: 'bg-success/10 text-success',
};
