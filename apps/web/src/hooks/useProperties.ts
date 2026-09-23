/* apps/web/src/hooks/useProperties.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  type Property,
  type CreatePropertyInput,
  type UpdatePropertyInput,
} from '../api/properties';

export function useProperties() {
  const query = useQuery({
    queryKey: ['properties'],
    queryFn: () => listProperties(),
  });

  return {
    properties: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () => getProperty(id),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePropertyInput) => createProperty(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePropertyInput }) =>
      updateProperty(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export type { Property };
