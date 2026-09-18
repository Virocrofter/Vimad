/* apps/web/src/app/admin/profiler/data.js */
export const mockSlowQueries = [
  {
    id: 'sq-1',
    query: 'SELECT * FROM reservations WHERE status = ?',
    durationMs: 2500,
    rowsAffected: 15000,
    source: 'reservations.list',
    userId: 'user-1',
    tenantId: 'tenant-1',
    createdAt: '2026-09-09T10:00:00Z',
    stackTrace: 'at listReservations (reservations.service.ts:45)',
    optimizationSuggestion: 'Add index on status column',
  },
];

export const mockEndpointPerformance = [
  {
    path: '/v1/reservations',
    method: 'GET',
    avgResponseTime: 120,
    p95ResponseTime: 350,
    p99ResponseTime: 800,
    requestCount: 15000,
    errorRate: 0.02,
    lastAccessed: '2026-09-09T10:00:00Z',
  },
];

export const mockDatabaseStats = [
  {
    tableName: 'reservations',
    rowCount: 150000,
    tableSize: '45 MB',
    indexSize: '12 MB',
    lastVacuum: '2026-09-08T00:00:00Z',
    lastAnalyze: '2026-09-08T00:00:00Z',
    bloatRatio: 0.15,
  },
];
