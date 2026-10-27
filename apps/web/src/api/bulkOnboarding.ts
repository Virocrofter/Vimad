/* apps/web/src/api/onboarding.ts */
import { apiClient } from './client';

export interface ApplyPropertyInput {
  name: string;
  code: string;
  city?: string;
  country?: string;
}

export const onboardingApi = {
  templateCsv: () =>
    apiClient.get('/v1/onboarding/template.csv', {
      responseType: 'text',
      transformResponse: [(d: string) => d],
    }),

  listImports: () => apiClient.get('/v1/onboarding/imports').then((r) => r.data),
  getImport: (id: string) => apiClient.get(`/v1/onboarding/imports/${id}`).then((r) => r.data),
  uploadCsv: (fileName: string, csv: string) =>
    apiClient.post('/v1/onboarding/imports', { fileName, csv }).then((r) => r.data),
  executeImport: (id: string) =>
    apiClient.post(`/v1/onboarding/imports/${id}/execute`, {}).then((r) => r.data),

  listTemplates: () => apiClient.get('/v1/onboarding/templates').then((r) => r.data),
  deleteTemplate: (id: string) =>
    apiClient.delete(`/v1/onboarding/templates/${id}`).then((r) => r.data),
  captureTemplate: (propertyId: string, name: string) =>
    apiClient
      .post(`/v1/onboarding/templates/from-property/${propertyId}`, { name })
      .then((r) => r.data),
  applyTemplate: (id: string, payload: ApplyPropertyInput) =>
    apiClient.post(`/v1/onboarding/templates/${id}/apply`, payload).then((r) => r.data),

  cloneProperty: (payload: ApplyPropertyInput & { sourcePropertyId: string }) =>
    apiClient.post('/v1/onboarding/clone', payload).then((r) => r.data),

  chainStandard: () => apiClient.get('/v1/onboarding/chain-standard').then((r) => r.data),
  saveChainStandard: (payload: { propertyId?: string; name?: string; config?: unknown }) =>
    apiClient.put('/v1/onboarding/chain-standard', payload).then((r) => r.data),

  properties: () =>
    apiClient.get('/v1/properties').then((r) => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.data ?? []);
    }),
};

export default onboardingApi;
