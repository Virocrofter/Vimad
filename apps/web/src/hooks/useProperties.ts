import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../api/properties';
import type { CreatePropertyInput, UpdatePropertyInput } from '../api/properties';
import type { PaginationParams } from '../api/types';

const PROPERTIES_KEY = 'properties' as const;

export function usePropertiesList(params?: PaginationParams) {
  return useQuery({
    queryKey: [PROPERTIES_KEY, 'list', params],
    queryFn: () => listProperties(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: [PROPERTIES_KEY, id],
    queryFn: () => getProperty(id),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePropertyInput) => createProperty(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_KEY, 'list'] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePropertyInput }) =>
      updateProperty(id, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_KEY, vars.id] });
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_KEY, 'list'] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_KEY, 'list'] });
    },
  });
}
