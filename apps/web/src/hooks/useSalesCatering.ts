/* apps/web/src/hooks/useSalesCatering.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scApi } from '../api/salesCatering';

export const useScStats = () =>
  useQuery({ queryKey: ['sc', 'stats'], queryFn: () => scApi.stats() });

export const useScCatalog = (kind: string) =>
  useQuery({ queryKey: ['sc', 'catalog', kind], queryFn: () => scApi.catalog(kind) });

export const useScClients = (q = '') =>
  useQuery({ queryKey: ['sc', 'clients', q], queryFn: () => scApi.clients(q) });

export const useScClient = (id: string | null) =>
  useQuery({ queryKey: ['sc', 'client', id], queryFn: () => scApi.client(id!), enabled: !!id });

export const useScEvents = (params: Record<string, string> = {}) =>
  useQuery({ queryKey: ['sc', 'events', params], queryFn: () => scApi.events(params) });

export const useScEvent = (id: string | null) =>
  useQuery({ queryKey: ['sc', 'event', id], queryFn: () => scApi.event(id!), enabled: !!id });

export const useScBeos = (params: Record<string, string> = {}) =>
  useQuery({ queryKey: ['sc', 'beos', params], queryFn: () => scApi.beos(params) });

export const useScBeo = (id: string | null) =>
  useQuery({ queryKey: ['sc', 'beo', id], queryFn: () => scApi.beo(id!), enabled: !!id });

export function useScMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sc'] });
  };
  return {
    saveClient: useMutation({
      mutationFn: ({ id, data }: any) =>
        id ? scApi.updateClient(id, data) : scApi.createClient(data),
      onSuccess: invalidate,
    }),
    deleteClient: useMutation({
      mutationFn: (id: string) => scApi.deleteClient(id),
      onSuccess: invalidate,
    }),
    saveEvent: useMutation({
      mutationFn: ({ id, data }: any) =>
        id ? scApi.updateEvent(id, data) : scApi.createEvent(data),
      onSuccess: invalidate,
    }),
    deleteEvent: useMutation({
      mutationFn: (id: string) => scApi.deleteEvent(id),
      onSuccess: invalidate,
    }),
    saveBeo: useMutation({ mutationFn: (data: any) => scApi.saveBeo(data), onSuccess: invalidate }),
    submitBeo: useMutation({
      mutationFn: (id: string) => scApi.submitBeo(id),
      onSuccess: invalidate,
    }),
    approveBeo: useMutation({
      mutationFn: (id: string) => scApi.approveBeo(id),
      onSuccess: invalidate,
    }),
    requestChanges: useMutation({
      mutationFn: (id: string) => scApi.requestChanges(id),
      onSuccess: invalidate,
    }),
    signBeo: useMutation({
      mutationFn: ({ id, signer }: any) => scApi.signBeo(id, signer),
      onSuccess: invalidate,
    }),
    addActivity: useMutation({
      mutationFn: (data: any) => scApi.addActivity(data),
      onSuccess: invalidate,
    }),
    saveCatalogItem: useMutation({
      mutationFn: ({ kind, id, data }: any) =>
        id ? scApi.updateCatalogItem(kind, id, data) : scApi.createCatalogItem(kind, data),
      onSuccess: invalidate,
    }),
    deleteCatalogItem: useMutation({
      mutationFn: ({ kind, id }: any) => scApi.deleteCatalogItem(kind, id),
      onSuccess: invalidate,
    }),
  };
}
