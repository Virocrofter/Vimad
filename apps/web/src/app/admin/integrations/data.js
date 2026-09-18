/* apps/web/src/app/admin/integrations/data.js */
export const mockIntegrations = [
  {
    id: 'int-1',
    provider: 'stripe',
    name: 'Stripe',
    description: 'Payment processing',
    category: 'payment',
    status: 'connected',
    config: { apiKey: 'sk_***' },
    webhooks: [{ url: 'https://api.example.com/webhooks/stripe', events: ['payment.success'] }],
    lastSyncAt: '2026-09-09T10:00:00Z',
    lastSyncStatus: 'success',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
  },
];

export const mockProviders = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing for hotels',
    category: 'payment',
    authType: 'api_key',
    requiredConfig: [
      { key: 'apiKey', label: 'API Key', type: 'string', required: true, sensitive: true },
    ],
    supportedOperations: ['charge', 'refund', 'subscription'],
    webhookSupport: true,
  },
];
