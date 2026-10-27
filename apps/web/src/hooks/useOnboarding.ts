/* apps/web/src/hooks/useOnboarding.ts */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingApi, type ApplyPropertyInput } from '../api/bulkOnboarding';

export function useOnboardingImports() {
  return useQuery({
    queryKey: ['onboarding', 'imports'],
    queryFn: onboardingApi.listImports,
    staleTime: 15_000,
  });
}

export function useOnboardingImport(id: string | null) {
  return useQuery({
    queryKey: ['onboarding', 'imports', id],
    queryFn: () => onboardingApi.getImport(id as string),
    enabled: !!id,
  });
}

export function usePropertyTemplates() {
  return useQuery({
    queryKey: ['onboarding', 'templates'],
    queryFn: onboardingApi.listTemplates,
    staleTime: 15_000,
  });
}

export function useChainStandard() {
  return useQuery({
    queryKey: ['onboarding', 'chain-standard'],
    queryFn: onboardingApi.chainStandard,
    staleTime: 15_000,
  });
}

export function usePropertiesList() {
  return useQuery({
    queryKey: ['onboarding', 'properties'],
    queryFn: onboardingApi.properties,
    staleTime: 30_000,
  });
}

export function useOnboardingActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['onboarding'] });
    qc.invalidateQueries({ queryKey: ['properties'] });
  };

  return {
    uploadCsv: useMutation({
      mutationFn: ({ fileName, csv }: { fileName: string; csv: string }) =>
        onboardingApi.uploadCsv(fileName, csv),
      onSuccess: invalidate,
    }),
    executeImport: useMutation({
      mutationFn: (id: string) => onboardingApi.executeImport(id),
      onSuccess: invalidate,
    }),
    deleteTemplate: useMutation({
      mutationFn: (id: string) => onboardingApi.deleteTemplate(id),
      onSuccess: invalidate,
    }),
    captureTemplate: useMutation({
      mutationFn: ({ propertyId, name }: { propertyId: string; name: string }) =>
        onboardingApi.captureTemplate(propertyId, name),
      onSuccess: invalidate,
    }),
    applyTemplate: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: ApplyPropertyInput }) =>
        onboardingApi.applyTemplate(id, payload),
      onSuccess: invalidate,
    }),
    cloneProperty: useMutation({
      mutationFn: (payload: ApplyPropertyInput & { sourcePropertyId: string }) =>
        onboardingApi.cloneProperty(payload),
      onSuccess: invalidate,
    }),
    saveChainStandard: useMutation({
      mutationFn: (payload: { propertyId?: string; name?: string; config?: unknown }) =>
        onboardingApi.saveChainStandard(payload),
      onSuccess: invalidate,
    }),
  };
}
