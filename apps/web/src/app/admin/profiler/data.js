/* src/app/admin/profiler/data.js */

/* ─── Slow Queries ─── */
export const slowQueries = [
  {
    id: 'SQ-001',
    query: `SELECT r.*, g.name, g.email, g.phone, g.vip_status,
            p.amount, p.method, p.status as payment_status,
            i.category, i.amount as incident_amount, i.resolved_at
     FROM reservations r
     LEFT JOIN guests g ON r.guest_id = g.id
     LEFT JOIN payments p ON r.id = p.reservation_id
     LEFT JOIN incidents i ON r.room_id = i.room_id
     WHERE r.check_in BETWEEN $1 AND $2
       AND r.status IN ('confirmed', 'checked_in')
       AND (g.vip_status = 'platinum' OR g.vip_status = 'gold')
     ORDER BY r.created_at DESC
     LIMIT 500 OFFSET $3`,
    normalized:
      'SELECT r.*, g.*, p.*, i.* FROM reservations r LEFT JOIN guests g ON r.guest_id = g.id LEFT JOIN payments p ON r.id = p.reservation_id LEFT JOIN incidents i ON r.room_id = i.room_id WHERE r.check_in BETWEEN $1 AND $2 AND r.status IN (...) AND g.vip_status IN (...) ORDER BY r.created_at DESC LIMIT 500 OFFSET $3',
    avgDuration: 2840,
    maxDuration: 12450,
    p95Duration: 4200,
    callCount: 18420,
    rowsExamined: 2840000,
    rowsReturned: 500,
    tenant: 'TNT-001',
    tenantName: 'Grand Hotel Boston',
    endpoint: '/api/v2/reservations/search',
    method: 'GET',
    firstSeen: '2026-07-15',
    lastSeen: '2026-08-16 14:32:00',
    impact: 'high',
    table: 'reservations',
    indexUsed: false,
    suggestedIndex:
      "CREATE INDEX idx_reservations_checkin_status ON reservations(check_in, status) WHERE status IN ('confirmed', 'checked_in')",
    optimization:
      'Add composite index on (check_in, status). Consider materialized view for VIP guest reservations. Remove unnecessary LEFT JOINs to incidents table.',
  },
  {
    id: 'SQ-002',
    query: `SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN status = 'checked_in' THEN 1 ELSE 0 END) as checked_in,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
            AVG(total_amount) as avg_amount,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_amount) as p95_amount
     FROM reservations
     WHERE property_id = $1
       AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 year')`,
    normalized:
      'SELECT COUNT(*), SUM(CASE...), AVG(...), PERCENTILE_CONT(...) FROM reservations WHERE property_id = $1 AND created_at >= DATE_TRUNC(...)',
    avgDuration: 1520,
    maxDuration: 8900,
    p95Duration: 3100,
    callCount: 5620,
    rowsExamined: 1560000,
    rowsReturned: 1,
    tenant: 'TNT-002',
    tenantName: 'Seaside Resort Miami',
    endpoint: '/api/v2/reports/occupancy',
    method: 'GET',
    firstSeen: '2026-06-20',
    lastSeen: '2026-08-16 13:45:00',
    impact: 'medium',
    table: 'reservations',
    indexUsed: true,
    indexName: 'idx_reservations_property_created',
    suggestedIndex: null,
    optimization:
      'Cache this aggregation result for 5 minutes. Pre-compute monthly aggregates in a summary table.',
  },
  {
    id: 'SQ-003',
    query: `SELECT g.*,
            (SELECT COUNT(*) FROM reservations WHERE guest_id = g.id) as total_stays,
            (SELECT SUM(total_amount) FROM reservations WHERE guest_id = g.id) as lifetime_value,
            (SELECT MAX(check_out) FROM reservations WHERE guest_id = g.id) as last_stay,
            (SELECT ARRAY_AGG(DISTINCT room_type) FROM reservations WHERE guest_id = g.id) as preferred_rooms
     FROM guests g
     WHERE g.email LIKE $1
        OR g.phone LIKE $2
        OR g.name ILIKE $3`,
    normalized:
      'SELECT g.*, (SELECT COUNT(*)...), (SELECT SUM(...)...) FROM guests g WHERE g.email LIKE $1 OR g.phone LIKE $2 OR g.name ILIKE $3',
    avgDuration: 3200,
    maxDuration: 15600,
    p95Duration: 5800,
    callCount: 8930,
    rowsExamined: 420000,
    rowsReturned: 25,
    tenant: 'TNT-001',
    tenantName: 'Grand Hotel Boston',
    endpoint: '/api/v2/guests/search',
    method: 'POST',
    firstSeen: '2026-07-01',
    lastSeen: '2026-08-16 14:18:00',
    impact: 'high',
    table: 'guests',
    indexUsed: false,
    suggestedIndex:
      "CREATE INDEX idx_guests_search ON guests USING gin(to_tsvector('english', name || ' ' || email || ' ' || phone))",
    optimization:
      'Replace correlated subqueries with JOINs to pre-aggregated guest_stats table. Use full-text search instead of ILIKE.',
  },
  {
    id: 'SQ-004',
    query: `UPDATE room_inventory
     SET status = $1,
         updated_at = NOW(),
         updated_by = $2,
         housekeeping_status = $3,
         notes = CONCAT(notes, ' | ', $4)
     WHERE property_id = $5
       AND room_number = ANY($6)
       AND date BETWEEN $7 AND $8
     RETURNING *`,
    normalized:
      'UPDATE room_inventory SET status = $1, updated_at = NOW(), ... WHERE property_id = $5 AND room_number = ANY($6) AND date BETWEEN $7 AND $8 RETURNING *',
    avgDuration: 890,
    maxDuration: 4200,
    p95Duration: 1450,
    callCount: 28400,
    rowsExamined: 56000,
    rowsReturned: 12,
    tenant: 'TNT-003',
    tenantName: 'Mountain Lodge Aspen',
    endpoint: '/api/v2/inventory/bulk-update',
    method: 'PATCH',
    firstSeen: '2026-08-01',
    lastSeen: '2026-08-16 11:20:00',
    impact: 'medium',
    table: 'room_inventory',
    indexUsed: true,
    indexName: 'idx_inventory_property_room_date',
    suggestedIndex: null,
    optimization:
      'Batch updates into smaller chunks (max 50 rooms). Use COPY for bulk operations. Consider partitioning by date.',
  },
  {
    id: 'SQ-005',
    query: `SELECT DATE_TRUNC('hour', created_at) as hour,
            COUNT(*) as requests,
            AVG(duration_ms) as avg_latency,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99,
            COUNT(CASE WHEN status >= 500 THEN 1 END) as errors,
            COUNT(DISTINCT tenant_id) as active_tenants
     FROM api_request_logs
     WHERE created_at >= NOW() - INTERVAL '24 hours'
     GROUP BY DATE_TRUNC('hour', created_at)
     ORDER BY hour DESC`,
    normalized:
      "SELECT DATE_TRUNC(...), COUNT(*), AVG(...), PERCENTILE_CONT(...) FROM api_request_logs WHERE created_at >= NOW() - INTERVAL '24 hours' GROUP BY DATE_TRUNC(...) ORDER BY hour DESC",
    avgDuration: 2100,
    maxDuration: 6700,
    p95Duration: 3400,
    callCount: 1440,
    rowsExamined: 28400000,
    rowsReturned: 24,
    tenant: 'platform',
    tenantName: 'Platform-wide',
    endpoint: '/api/v1/admin/metrics/hourly',
    method: 'GET',
    firstSeen: '2026-01-10',
    lastSeen: '2026-08-16 14:00:00',
    impact: 'high',
    table: 'api_request_logs',
    indexUsed: true,
    indexName: 'idx_logs_created_at',
    suggestedIndex: null,
    optimization:
      'Partition api_request_logs by day. Use TimescaleDB hypertable. Pre-aggregate hourly stats into rollup table.',
  },
  {
    id: 'SQ-006',
    query: `SELECT r.room_number, r.type, r.floor,
            jsonb_agg(
              jsonb_build_object(
                'date', ri.date,
                'status', ri.status,
                'rate', ri.rate,
                'reservation_id', ri.reservation_id
              ) ORDER BY ri.date
            ) as availability
     FROM rooms r
     LEFT JOIN room_inventory ri ON r.id = ri.room_id
       AND ri.date BETWEEN $1 AND $2
     WHERE r.property_id = $3
       AND r.status = 'active'
     GROUP BY r.id, r.room_number, r.type, r.floor
     ORDER BY r.floor, r.room_number`,
    normalized:
      "SELECT r.*, jsonb_agg(jsonb_build_object(...) ORDER BY ...) FROM rooms r LEFT JOIN room_inventory ri ON r.id = ri.room_id AND ri.date BETWEEN $1 AND $2 WHERE r.property_id = $3 AND r.status = 'active' GROUP BY r.id ORDER BY r.floor, r.room_number",
    avgDuration: 1850,
    maxDuration: 5200,
    p95Duration: 2800,
    callCount: 12400,
    rowsExamined: 890000,
    rowsReturned: 142,
    tenant: 'TNT-001',
    tenantName: 'Grand Hotel Boston',
    endpoint: '/api/v2/rooms/availability',
    method: 'GET',
    firstSeen: '2026-05-15',
    lastSeen: '2026-08-16 14:25:00',
    impact: 'medium',
    table: 'rooms',
    indexUsed: true,
    indexName: 'idx_rooms_property_status',
    suggestedIndex: null,
    optimization:
      'Cache availability grid in Redis for 30 seconds. Use materialized view refreshed every minute.',
  },
  {
    id: 'SQ-007',
    query: `SELECT t.id, t.name, t.plan,
            (SELECT COUNT(*) FROM reservations WHERE tenant_id = t.id AND created_at >= NOW() - INTERVAL '30 days') as monthly_reservations,
            (SELECT SUM(total_amount) FROM reservations WHERE tenant_id = t.id AND created_at >= NOW() - INTERVAL '30 days') as monthly_revenue,
            (SELECT COUNT(DISTINCT guest_id) FROM reservations WHERE tenant_id = t.id AND created_at >= NOW() - INTERVAL '30 days') as unique_guests,
            (SELECT AVG(duration_ms) FROM api_request_logs WHERE tenant_id = t.id AND created_at >= NOW() - INTERVAL '24 hours') as avg_api_latency
     FROM tenants t
     WHERE t.status = 'active'
     ORDER BY monthly_revenue DESC
     LIMIT 50`,
    normalized:
      "SELECT t.*, (SELECT COUNT(*)...), (SELECT SUM(...)...) FROM tenants t WHERE t.status = 'active' ORDER BY monthly_revenue DESC LIMIT 50",
    avgDuration: 4500,
    maxDuration: 18200,
    p95Duration: 7800,
    callCount: 720,
    rowsExamined: 3200000,
    rowsReturned: 50,
    tenant: 'platform',
    tenantName: 'Platform-wide',
    endpoint: '/api/v1/admin/tenants/performance',
    method: 'GET',
    firstSeen: '2026-03-01',
    lastSeen: '2026-08-16 14:30:00',
    impact: 'high',
    table: 'tenants',
    indexUsed: false,
    suggestedIndex:
      'CREATE INDEX idx_reservations_tenant_created ON reservations(tenant_id, created_at) INCLUDE (total_amount, guest_id)',
    optimization:
      'Replace correlated subqueries with JOINs to pre-aggregated tenant_stats table. Cache result for 1 minute.',
  },
  {
    id: 'SQ-008',
    query: `SELECT * FROM rate_plans
     WHERE property_id = $1
       AND is_active = true
       AND (start_date IS NULL OR start_date <= $2)
       AND (end_date IS NULL OR end_date >= $2)
       AND (days_of_week IS NULL OR $3 = ANY(days_of_week))
       AND (room_types IS NULL OR $4 = ANY(room_types))
     ORDER BY priority DESC, created_at DESC`,
    normalized:
      'SELECT * FROM rate_plans WHERE property_id = $1 AND is_active = true AND (...date ranges...) AND (...arrays...) ORDER BY priority DESC, created_at DESC',
    avgDuration: 420,
    maxDuration: 2100,
    p95Duration: 780,
    callCount: 45600,
    rowsExamined: 12000,
    rowsReturned: 8,
    tenant: 'TNT-004',
    tenantName: 'Downtown Suites Chicago',
    endpoint: '/api/v2/rates/calculate',
    method: 'POST',
    firstSeen: '2026-04-10',
    lastSeen: '2026-08-16 10:05:00',
    impact: 'low',
    table: 'rate_plans',
    indexUsed: true,
    indexName: 'idx_rate_plans_property_active',
    suggestedIndex: null,
    optimization:
      'Cache active rate plans in Redis with 5-min TTL. Pre-filter by room type in application layer.',
  },
];

/* ─── Endpoint Latency Heatmap Data ─── */
export const endpointLatencyData = [
  // Format: { endpoint, method, tenant, p50, p75, p90, p95, p99, rpm, errorRate }
  {
    endpoint: '/api/v2/reservations',
    method: 'GET',
    tenant: 'TNT-001',
    p50: 45,
    p75: 120,
    p90: 340,
    p95: 890,
    p99: 2400,
    rpm: 420,
    errorRate: 0.02,
  },
  {
    endpoint: '/api/v2/reservations',
    method: 'POST',
    tenant: 'TNT-001',
    p50: 120,
    p75: 280,
    p90: 650,
    p95: 1200,
    p99: 3400,
    rpm: 85,
    errorRate: 0.05,
  },
  {
    endpoint: '/api/v2/reservations',
    method: 'GET',
    tenant: 'TNT-002',
    p50: 38,
    p75: 95,
    p90: 280,
    p95: 720,
    p99: 1900,
    rpm: 310,
    errorRate: 0.01,
  },
  {
    endpoint: '/api/v2/reservations/search',
    method: 'GET',
    tenant: 'TNT-001',
    p50: 890,
    p75: 1800,
    p90: 3400,
    p95: 5200,
    p99: 12400,
    rpm: 65,
    errorRate: 0.08,
  },
  {
    endpoint: '/api/v2/reservations/search',
    method: 'GET',
    tenant: 'TNT-002',
    p50: 720,
    p75: 1500,
    p90: 2800,
    p95: 4200,
    p99: 8900,
    rpm: 48,
    errorRate: 0.06,
  },
  {
    endpoint: '/api/v2/guests',
    method: 'GET',
    tenant: 'TNT-001',
    p50: 35,
    p75: 85,
    p90: 210,
    p95: 520,
    p99: 1400,
    rpm: 280,
    errorRate: 0.01,
  },
  {
    endpoint: '/api/v2/guests/search',
    method: 'POST',
    tenant: 'TNT-001',
    p50: 1200,
    p75: 2400,
    p90: 4500,
    p95: 6800,
    p99: 15600,
    rpm: 42,
    errorRate: 0.12,
  },
  {
    endpoint: '/api/v2/rates/calculate',
    method: 'POST',
    tenant: 'TNT-004',
    p50: 28,
    p75: 65,
    p90: 150,
    p95: 380,
    p99: 950,
    rpm: 680,
    errorRate: 0.01,
  },
  {
    endpoint: '/api/v2/rates/calculate',
    method: 'POST',
    tenant: 'TNT-001',
    p50: 32,
    p75: 78,
    p90: 180,
    p95: 450,
    p99: 1100,
    rpm: 520,
    errorRate: 0.01,
  },
  {
    endpoint: '/api/v2/rooms/availability',
    method: 'GET',
    tenant: 'TNT-001',
    p50: 380,
    p75: 820,
    p90: 1600,
    p95: 2400,
    p99: 5200,
    rpm: 95,
    errorRate: 0.04,
  },
  {
    endpoint: '/api/v2/billing/invoice',
    method: 'GET',
    tenant: 'TNT-001',
    p50: 55,
    p75: 140,
    p90: 380,
    p95: 850,
    p99: 2200,
    rpm: 180,
    errorRate: 0.03,
  },
  {
    endpoint: '/api/v2/billing/invoice',
    method: 'POST',
    tenant: 'TNT-001',
    p50: 180,
    p75: 420,
    p90: 950,
    p95: 1800,
    p99: 4200,
    rpm: 45,
    errorRate: 0.07,
  },
  {
    endpoint: '/api/v2/reports/occupancy',
    method: 'GET',
    tenant: 'TNT-002',
    p50: 620,
    p75: 1200,
    p90: 2200,
    p95: 3400,
    p99: 8900,
    rpm: 28,
    errorRate: 0.05,
  },
  {
    endpoint: '/api/v2/reports/revenue',
    method: 'GET',
    tenant: 'TNT-001',
    p50: 780,
    p75: 1500,
    p90: 2800,
    p95: 4200,
    p99: 9800,
    rpm: 22,
    errorRate: 0.04,
  },
  {
    endpoint: '/api/v2/inventory/bulk-update',
    method: 'PATCH',
    tenant: 'TNT-003',
    p50: 280,
    p75: 580,
    p90: 1100,
    p95: 1800,
    p99: 4200,
    rpm: 120,
    errorRate: 0.03,
  },
  {
    endpoint: '/api/v1/admin/metrics/hourly',
    method: 'GET',
    tenant: 'platform',
    p50: 890,
    p75: 1800,
    p90: 3200,
    p95: 4800,
    p99: 6700,
    rpm: 12,
    errorRate: 0.01,
  },
  {
    endpoint: '/api/v1/admin/tenants/performance',
    method: 'GET',
    tenant: 'platform',
    p50: 2400,
    p75: 4800,
    p90: 7200,
    p95: 9800,
    p99: 18200,
    rpm: 4,
    errorRate: 0.15,
  },
  {
    endpoint: '/api/v2/channel/sync',
    method: 'POST',
    tenant: 'TNT-001',
    p50: 450,
    p75: 950,
    p90: 1800,
    p95: 2800,
    p99: 5600,
    rpm: 35,
    errorRate: 0.09,
  },
  {
    endpoint: '/api/v2/webhooks/booking',
    method: 'POST',
    tenant: 'TNT-002',
    p50: 120,
    p75: 280,
    p90: 580,
    p95: 1100,
    p99: 2800,
    rpm: 85,
    errorRate: 0.06,
  },
  {
    endpoint: '/api/v2/auth/login',
    method: 'POST',
    tenant: 'platform',
    p50: 85,
    p75: 180,
    p90: 380,
    p95: 720,
    p99: 1500,
    rpm: 240,
    errorRate: 0.08,
  },
];

/* ─── Resource Hogs by Tenant ─── */
export const resourceHogs = [
  {
    tenantId: 'TNT-001',
    tenantName: 'Grand Hotel Boston',
    plan: 'Enterprise',
    cpuPercent: 28.4,
    memoryMB: 1840,
    dbConnections: 45,
    storageGB: 45.2,
    apiCallsPerMin: 2840,
    slowQueries: 3,
    cacheHitRate: 87.2,
    topEndpoints: [
      { endpoint: '/api/v2/reservations/search', pct: 34.2 },
      { endpoint: '/api/v2/guests/search', pct: 22.8 },
      { endpoint: '/api/v2/rooms/availability', pct: 18.5 },
    ],
    trend: 'up',
    trendValue: 12.5,
  },
  {
    tenantId: 'TNT-002',
    tenantName: 'Seaside Resort Miami',
    plan: 'Professional',
    cpuPercent: 18.2,
    memoryMB: 1240,
    dbConnections: 32,
    storageGB: 28.5,
    apiCallsPerMin: 1560,
    slowQueries: 1,
    cacheHitRate: 92.4,
    topEndpoints: [
      { endpoint: '/api/v2/reservations', pct: 28.5 },
      { endpoint: '/api/v2/reports/occupancy', pct: 24.2 },
      { endpoint: '/api/v2/webhooks/booking', pct: 16.8 },
    ],
    trend: 'stable',
    trendValue: 1.2,
  },
  {
    tenantId: 'TNT-003',
    tenantName: 'Mountain Lodge Aspen',
    plan: 'Professional',
    cpuPercent: 8.5,
    memoryMB: 620,
    dbConnections: 18,
    storageGB: 8.2,
    apiCallsPerMin: 420,
    slowQueries: 1,
    cacheHitRate: 94.8,
    topEndpoints: [
      { endpoint: '/api/v2/inventory/bulk-update', pct: 35.2 },
      { endpoint: '/api/v2/reservations', pct: 22.5 },
      { endpoint: '/api/v2/rates/calculate', pct: 18.2 },
    ],
    trend: 'up',
    trendValue: 8.4,
  },
  {
    tenantId: 'TNT-004',
    tenantName: 'Downtown Suites Chicago',
    plan: 'Starter',
    cpuPercent: 12.8,
    memoryMB: 480,
    dbConnections: 22,
    storageGB: 12.1,
    apiCallsPerMin: 890,
    slowQueries: 1,
    cacheHitRate: 89.5,
    topEndpoints: [
      { endpoint: '/api/v2/rates/calculate', pct: 42.5 },
      { endpoint: '/api/v2/reservations', pct: 28.2 },
      { endpoint: '/api/v2/billing/invoice', pct: 15.8 },
    ],
    trend: 'down',
    trendValue: -5.2,
  },
  {
    tenantId: 'TNT-005',
    tenantName: 'Coastal Inn San Diego',
    plan: 'Starter',
    cpuPercent: 6.2,
    memoryMB: 340,
    dbConnections: 12,
    storageGB: 9.8,
    apiCallsPerMin: 670,
    slowQueries: 0,
    cacheHitRate: 96.2,
    topEndpoints: [
      { endpoint: '/api/v2/reservations', pct: 32.5 },
      { endpoint: '/api/v2/rates/calculate', pct: 28.2 },
      { endpoint: '/api/v2/guests', pct: 18.5 },
    ],
    trend: 'stable',
    trendValue: 0.8,
  },
  {
    tenantId: 'TNT-007',
    tenantName: 'Urban Hotel NYC',
    plan: 'Professional',
    cpuPercent: 22.5,
    memoryMB: 1560,
    dbConnections: 38,
    storageGB: 38.7,
    apiCallsPerMin: 2100,
    slowQueries: 2,
    cacheHitRate: 85.4,
    topEndpoints: [
      { endpoint: '/api/v2/reservations/search', pct: 30.2 },
      { endpoint: '/api/v2/reports/revenue', pct: 22.5 },
      { endpoint: '/api/v2/channel/sync', pct: 18.8 },
    ],
    trend: 'up',
    trendValue: 15.8,
  },
];

/* ─── Optimization Recommendations ─── */
export const recommendations = [
  {
    id: 'REC-001',
    type: 'index',
    severity: 'critical',
    title: 'Missing index on reservations(check_in, status)',
    description:
      'The reservations search endpoint is performing full table scans on 2.8M rows. Adding a composite index would reduce query time from 2.8s to ~45ms.',
    impact: 'Reduces avg latency by 98%',
    effort: 'low',
    affectedQueries: ['SQ-001'],
    affectedTenants: ['TNT-001'],
    sql: "CREATE INDEX CONCURRENTLY idx_reservations_checkin_status ON reservations(check_in, status) WHERE status IN ('confirmed', 'checked_in');",
    estimatedImprovement: { metric: 'latency', before: 2840, after: 45, unit: 'ms' },
    autoApplicable: true,
  },
  {
    id: 'REC-002',
    type: 'caching',
    severity: 'high',
    title: 'Cache rate plan calculations in Redis',
    description:
      'Rate calculation endpoint is called 680 RPM but results change infrequently. Caching with 5-min TTL would eliminate 95% of DB hits.',
    impact: 'Eliminates 32,400 DB queries/hour',
    effort: 'low',
    affectedQueries: ['SQ-008'],
    affectedTenants: ['TNT-001', 'TNT-004'],
    sql: null,
    estimatedImprovement: { metric: 'db_queries', before: 32400, after: 1620, unit: '/hour' },
    autoApplicable: true,
  },
  {
    id: 'REC-003',
    type: 'query_rewrite',
    severity: 'critical',
    title: 'Replace correlated subqueries in guest search',
    description:
      'Guest search uses 4 correlated subqueries causing N+1 pattern. Pre-aggregated guest_stats table reduces complexity from O(n²) to O(n).',
    impact: 'Reduces query time from 3.2s to ~120ms',
    effort: 'medium',
    affectedQueries: ['SQ-003'],
    affectedTenants: ['TNT-001'],
    sql: 'CREATE MATERIALIZED VIEW guest_stats AS SELECT guest_id, COUNT(*) as total_stays, SUM(total_amount) as lifetime_value, MAX(check_out) as last_stay FROM reservations GROUP BY guest_id;',
    estimatedImprovement: { metric: 'latency', before: 3200, after: 120, unit: 'ms' },
    autoApplicable: false,
  },
  {
    id: 'REC-004',
    type: 'partitioning',
    severity: 'high',
    title: 'Partition api_request_logs by date',
    description:
      'The logs table has 28.4M rows and growing. Time-based partitioning would make queries 10x faster and enable efficient archival.',
    impact: '10x faster analytics queries',
    effort: 'high',
    affectedQueries: ['SQ-005'],
    affectedTenants: ['platform'],
    sql: 'CREATE TABLE api_request_logs_partitioned (LIKE api_request_logs) PARTITION BY RANGE (created_at);',
    estimatedImprovement: { metric: 'latency', before: 2100, after: 210, unit: 'ms' },
    autoApplicable: false,
  },
  {
    id: 'REC-005',
    type: 'materialized_view',
    severity: 'medium',
    title: 'Pre-compute tenant performance aggregates',
    description:
      'Admin tenant performance endpoint runs 7 correlated aggregations on large tables. A materialized view refreshed every minute would serve this instantly.',
    impact: 'Reduces query time from 4.5s to ~15ms',
    effort: 'medium',
    affectedQueries: ['SQ-007'],
    affectedTenants: ['platform'],
    sql: "CREATE MATERIALIZED VIEW tenant_performance_stats AS SELECT tenant_id, COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as monthly_reservations, SUM(total_amount) FILTER (...) as monthly_revenue FROM reservations GROUP BY tenant_id;",
    estimatedImprovement: { metric: 'latency', before: 4500, after: 15, unit: 'ms' },
    autoApplicable: false,
  },
  {
    id: 'REC-006',
    type: 'connection_pool',
    severity: 'medium',
    title: 'Increase connection pool for TNT-001',
    description:
      'Grand Hotel Boston is using 45/50 DB connections during peak hours. Increasing pool size to 80 would prevent connection wait timeouts.',
    impact: 'Eliminates connection wait timeouts',
    effort: 'low',
    affectedQueries: [],
    affectedTenants: ['TNT-001'],
    sql: null,
    estimatedImprovement: { metric: 'timeout_rate', before: 2.4, after: 0, unit: '%' },
    autoApplicable: true,
  },
  {
    id: 'REC-007',
    type: 'cache_warming',
    severity: 'medium',
    title: 'Warm Redis cache for room availability',
    description:
      'Room availability grid is computed on every request. Pre-warming cache every 30 seconds would serve 95% of requests from cache.',
    impact: '95% cache hit rate for availability',
    effort: 'low',
    affectedQueries: ['SQ-006'],
    affectedTenants: ['TNT-001'],
    sql: null,
    estimatedImprovement: { metric: 'cache_hit_rate', before: 62, after: 95, unit: '%' },
    autoApplicable: true,
  },
  {
    id: 'REC-008',
    type: 'batch_optimization',
    severity: 'low',
    title: 'Chunk bulk inventory updates',
    description:
      'Bulk inventory updates currently process all rooms in one transaction. Chunking into 50-room batches reduces lock contention.',
    impact: 'Reduces lock wait time by 60%',
    effort: 'low',
    affectedQueries: ['SQ-004'],
    affectedTenants: ['TNT-003'],
    sql: null,
    estimatedImprovement: { metric: 'lock_wait', before: 180, after: 72, unit: 'ms' },
    autoApplicable: true,
  },
];

/* ─── Time-series performance data (last 24h) ─── */
export const performanceTimeline = [
  { hour: '00:00', cpu: 22, memory: 45, dbConnections: 85, slowQueries: 1, avgLatency: 120 },
  { hour: '01:00', cpu: 18, memory: 42, dbConnections: 72, slowQueries: 0, avgLatency: 95 },
  { hour: '02:00', cpu: 15, memory: 40, dbConnections: 65, slowQueries: 0, avgLatency: 82 },
  { hour: '03:00', cpu: 20, memory: 43, dbConnections: 78, slowQueries: 1, avgLatency: 105 },
  { hour: '04:00', cpu: 25, memory: 46, dbConnections: 82, slowQueries: 1, avgLatency: 118 },
  { hour: '05:00', cpu: 32, memory: 50, dbConnections: 95, slowQueries: 2, avgLatency: 145 },
  { hour: '06:00', cpu: 45, memory: 55, dbConnections: 120, slowQueries: 3, avgLatency: 210 },
  { hour: '07:00', cpu: 58, memory: 62, dbConnections: 145, slowQueries: 4, avgLatency: 280 },
  { hour: '08:00', cpu: 72, memory: 70, dbConnections: 168, slowQueries: 5, avgLatency: 380 },
  { hour: '09:00', cpu: 78, memory: 74, dbConnections: 185, slowQueries: 6, avgLatency: 450 },
  { hour: '10:00', cpu: 65, memory: 68, dbConnections: 162, slowQueries: 4, avgLatency: 340 },
  { hour: '11:00', cpu: 55, memory: 60, dbConnections: 140, slowQueries: 3, avgLatency: 260 },
  { hour: '12:00', cpu: 60, memory: 64, dbConnections: 148, slowQueries: 3, avgLatency: 290 },
  { hour: '13:00', cpu: 70, memory: 72, dbConnections: 172, slowQueries: 5, avgLatency: 380 },
  { hour: '14:00', cpu: 68, memory: 70, dbConnections: 168, slowQueries: 4, avgLatency: 360 },
];

/* ─── Metadata ─── */
export const impactMeta = {
  high: {
    label: 'High Impact',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
    color: 'text-danger',
  },
  medium: {
    label: 'Medium Impact',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
    color: 'text-warning',
  },
  low: {
    label: 'Low Impact',
    dot: 'bg-info',
    class: 'bg-info/10 text-info border-info/20',
    color: 'text-info',
  },
};

export const severityMeta = {
  critical: {
    label: 'Critical',
    dot: 'bg-danger',
    class: 'bg-danger/10 text-danger border-danger/20',
    color: 'text-danger',
  },
  high: {
    label: 'High',
    dot: 'bg-warning',
    class: 'bg-warning/10 text-warning border-warning/20',
    color: 'text-warning',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-info',
    class: 'bg-info/10 text-info border-info/20',
    color: 'text-info',
  },
  low: {
    label: 'Low',
    dot: 'bg-accent',
    class: 'bg-accent/10 text-accent border-accent/20',
    color: 'text-accent',
  },
};

export const effortMeta = {
  low: {
    label: 'Low Effort',
    class: 'bg-accent/10 text-accent border-accent/20',
    color: 'text-accent',
  },
  medium: {
    label: 'Medium Effort',
    class: 'bg-warning/10 text-warning border-warning/20',
    color: 'text-warning',
  },
  high: {
    label: 'High Effort',
    class: 'bg-danger/10 text-danger border-danger/20',
    color: 'text-danger',
  },
};

export const typeMeta = {
  index: { label: 'Index', icon: 'Database', color: 'text-secondary', bg: 'bg-secondary/10' },
  caching: { label: 'Caching', icon: 'Zap', color: 'text-accent', bg: 'bg-accent/10' },
  query_rewrite: { label: 'Query Rewrite', icon: 'Code', color: 'text-info', bg: 'bg-info/10' },
  partitioning: {
    label: 'Partitioning',
    icon: 'Layers',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  materialized_view: {
    label: 'Materialized View',
    icon: 'Eye',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  connection_pool: {
    label: 'Connection Pool',
    icon: 'Link',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  cache_warming: {
    label: 'Cache Warming',
    icon: 'Flame',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  batch_optimization: {
    label: 'Batch Optimization',
    icon: 'Package',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
};

export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}
