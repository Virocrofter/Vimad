/* apps/web/src/app/admin/demo-access/data.js */
export const mockDemoRequests = [
  {
    id: 'demo-1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    company: 'Acme Hotel',
    phone: '+1 555-0100',
    propertyType: 'boutique',
    roomCount: 50,
    useCase: 'pms_migration',
    preferredDate: '2026-09-15T10:00:00Z',
    timezone: 'America/New_York',
    status: 'pending',
    assignedTo: null,
    notes: '',
    source: 'website',
    utm: { source: 'google', medium: 'cpc' },
    createdAt: '2026-09-09T10:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
  },
];

export const mockDemoMetrics = {
  totalRequests: 150,
  pendingRequests: 23,
  scheduledThisWeek: 8,
  conversionRate: 0.35,
  avgDealValue: 5000,
  pipelineValue: 125000,
};
