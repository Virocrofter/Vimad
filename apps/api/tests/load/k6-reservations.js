/* apps/api/tests/load/k6-reservations.js
 *
 * k6 load test: reservation create/cancel, folio posting, night audit.
 *
 * Setup (from repo root, with the stack running):
 *   docker compose up -d postgres redis
 *   cd apps/api && npx tsx src/index.ts   # API on :3001
 *
 * Run:
 *   k6 run apps/api/tests/load/k6-reservations.js
 *   k6 run -e VUS=50 -e DURATION=5m apps/api/tests/load/k6-reservations.js
 *
 * Gate: p95 < 300ms on reads, p95 < 800ms on writes, error rate < 1%.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TENANT_SLUG = __ENV.TENANT_SLUG || 'demo-hotel';
const EMAIL = __ENV.EMAIL || 'admin@demo.com';
const PASSWORD = __ENV.PASSWORD || 'admin123';

export const errorRate = new Rate('errors');
export const readLatency = new Trend('read_latency', true);
export const writeLatency = new Trend('write_latency', true);

export const options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS, 10) : 10,
  duration: __ENV.DURATION || '2m',
  thresholds: {
    // Gate requirements
    read_latency: ['p(95)<300'],
    write_latency: ['p(95)<800'],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.01'],
  },
};

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function login() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ tenantSlug: TENANT_SLUG, email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const ok = check(res, { 'login 200': (r) => r.status === 200 });
  if (!ok) {
    console.error(`Login failed: ${res.status} ${res.body}`);
    return null;
  }
  return res.json('data.token');
}

function trackRead(res) {
  readLatency.add(res.timings.duration);
  errorRate.add(res.status >= 400);
  return res;
}

function trackWrite(res) {
  writeLatency.add(res.timings.duration);
  errorRate.add(res.status >= 400);
  return res;
}

export function setup() {
  const token = login();
  if (!token) throw new Error('Setup login failed — is the API running and seeded?');

  // Resolve REAL ids from seeded data — property/guest ids are cuids, not codes
  const propsRes = http.get(`${BASE_URL}/v1/properties`, { headers: authHeaders(token) });
  const propertyId = propsRes.json('data.0.id');
  if (!propertyId) throw new Error(`No property found — run the seed. Response: ${propsRes.body}`);

  const guestsRes = http.get(`${BASE_URL}/v1/guests?page=1&pageSize=1`, {
    headers: authHeaders(token),
  });
  const guestId = guestsRes.json('data.0.id');
  if (!guestId) throw new Error(`No guest found — run the seed. Response: ${guestsRes.body}`);

  return { token, propertyId, guestId };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // ─── Core reads (p95 < 300ms gate) ───
  trackRead(http.get(`${BASE_URL}/v1/properties`, { headers }));
  trackRead(http.get(`${BASE_URL}/v1/reservations?page=1&pageSize=20`, { headers }));
  trackRead(http.get(`${BASE_URL}/v1/rooms`, { headers }));
  trackRead(http.get(`${BASE_URL}/v1/guests?page=1&pageSize=20`, { headers }));

  // ─── Reservation create (write path) ───
  const createRes = trackWrite(
    http.post(
      `${BASE_URL}/v1/reservations`,
      JSON.stringify({
        propertyId: data.propertyId,
        guestId: data.guestId,
        arrivalDate: '2026-10-01',
        departureDate: '2026-10-03',
        nights: 2,
        adults: 2,
        totalAmount: 378,
      }),
      { headers: { ...headers, 'idempotency-key': `k6-${__VU}-${__ITER}-${Date.now()}` } }
    )
  );
  check(createRes, { 'reservation created': (r) => r.status === 201 || r.status === 400 });

  // ─── Reservation cancel ───
  if (createRes.status === 201) {
    const id = createRes.json('data.id');
    if (id) {
      const cancelRes = trackWrite(
        http.post(
          `${BASE_URL}/v1/reservations/${id}/cancel`,
          JSON.stringify({ reason: 'k6 load test' }),
          { headers }
        )
      );
      check(cancelRes, { 'reservation cancelled': (r) => r.status === 200 || r.status === 409 });
    }
  }

  // ─── Folio posting (create may 409 if folio exists — that is a real write-path round-trip) ───
  const folioRes = trackWrite(
    http.post(
      `${BASE_URL}/v1/folios`,
      JSON.stringify({
        reservationId: createRes.status === 201 ? createRes.json('data.id') : 'nonexistent',
        type: 'guest',
      }),
      { headers: { ...headers, 'idempotency-key': `k6-folio-${__VU}-${__ITER}-${Date.now()}` } }
    )
  );
  check(folioRes, { 'folio ok': (r) => r.status === 201 || r.status === 404 || r.status === 409 });

  // ─── Night audit trigger (1 in 20 VU iterations — it's heavy) ───
  if (__ITER % 20 === 0) {
    const auditRes = trackWrite(
      http.post(
        `${BASE_URL}/v1/night-audit/run`,
        JSON.stringify({
          propertyId: data.propertyId,
          auditDate: '2026-09-22',
          autoPostRoomCharges: false,
          verifyBalances: true,
          generateReports: false,
          closeDay: false,
        }),
        { headers }
      )
    );
    check(auditRes, { 'night audit accepted': (r) => r.status === 200 || r.status === 409 });
  }

  sleep(1);
}
