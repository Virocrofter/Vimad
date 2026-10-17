import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/crm';
import type { SegmentRule } from '../api/crm';

const CRM_KEY = 'crm' as const;
const SEGMENTS_KEY = 'crm-segments' as const;
const CORPORATE_KEY = 'crm-corporate' as const;

export function useCrmOverview(options: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: [CRM_KEY, 'overview'],
    queryFn: api.getCrmOverview,
    staleTime: 30_000,
    ...options,
  });
}

export function useCrmAssignees() {
  return useQuery({
    queryKey: [CRM_KEY, 'assignees'],
    queryFn: api.getCrmAssignees,
    staleTime: 60_000,
  });
}

export function useGuest360(guestId: string | undefined) {
  return useQuery({
    queryKey: [CRM_KEY, '360', guestId],
    queryFn: () => api.getGuest360(guestId as string),
    enabled: !!guestId,
  });
}

export function useGuestTimeline(guestId: string | undefined) {
  return useQuery({
    queryKey: [CRM_KEY, 'timeline', guestId],
    queryFn: () => api.getGuestTimeline(guestId as string),
    enabled: !!guestId,
  });
}

export function useUpdateGuestCrm(guestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { tags?: string[]; vipStatus?: string }) =>
      api.updateGuestCrm(guestId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CRM_KEY, '360', guestId] });
      qc.invalidateQueries({ queryKey: [CRM_KEY, 'overview'] });
    },
  });
}

export function useCreateCrmNote(guestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; pinned?: boolean }) => api.createCrmNote(guestId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CRM_KEY, '360', guestId] });
      qc.invalidateQueries({ queryKey: [CRM_KEY, 'timeline', guestId] });
    },
  });
}

export function useUpdateCrmNote(guestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { body?: string; pinned?: boolean } }) =>
      api.updateCrmNote(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRM_KEY, '360', guestId] }),
  });
}

export function useDeleteCrmNote(guestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => api.deleteCrmNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CRM_KEY, '360', guestId] }),
  });
}

export function useSegments() {
  return useQuery({ queryKey: [SEGMENTS_KEY], queryFn: api.listSegments });
}

export function useSegmentMembers(segmentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [SEGMENTS_KEY, 'members', segmentId],
    queryFn: () => api.listSegmentMembers(segmentId as string),
    enabled: !!segmentId && enabled,
  });
}

export function useCreateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; rule: SegmentRule }) =>
      api.createSegment(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SEGMENTS_KEY] }),
  });
}

export function useUpdateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateSegment>[1] }) =>
      api.updateSegment(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SEGMENTS_KEY] }),
  });
}

export function useDeleteSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSegment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SEGMENTS_KEY] }),
  });
}

export function useEvaluateSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.evaluateSegment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SEGMENTS_KEY] });
      qc.invalidateQueries({ queryKey: [CRM_KEY, 'overview'] });
    },
  });
}

export function useEmailSegment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { subject: string; body: string } }) =>
      api.emailSegment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SEGMENTS_KEY] });
      qc.invalidateQueries({ queryKey: [CRM_KEY, 'overview'] });
    },
  });
}

export function useCreateFollowUp(guestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { assigneeId: string; title: string; dueAt?: string }) =>
      api.createFollowUp({ ...input, guestId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CRM_KEY, '360', guestId] });
      qc.invalidateQueries({ queryKey: [CRM_KEY, 'timeline', guestId] });
      qc.invalidateQueries({ queryKey: [CRM_KEY, 'overview'] });
    },
  });
}

export function useUpdateFollowUp(guestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateFollowUp>[1] }) =>
      api.updateFollowUp(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CRM_KEY, '360', guestId] });
      qc.invalidateQueries({ queryKey: [CRM_KEY, 'overview'] });
    },
  });
}

export function useCorporateAccounts() {
  return useQuery({ queryKey: [CORPORATE_KEY], queryFn: api.listCorporateAccounts });
}

export function useCorporateAccount(id: string | undefined) {
  return useQuery({
    queryKey: [CORPORATE_KEY, id],
    queryFn: () => api.getCorporateAccount(id as string),
    enabled: !!id,
  });
}

export function useCreateCorporateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createCorporateAccount>[0]) =>
      api.createCorporateAccount(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CORPORATE_KEY] }),
  });
}

export function useUpdateCorporateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof api.updateCorporateAccount>[1];
    }) => api.updateCorporateAccount(id, input),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [CORPORATE_KEY] });
      qc.invalidateQueries({ queryKey: [CORPORATE_KEY, vars.id] });
    },
  });
}

export function useScClients() {
  return useQuery({ queryKey: ['crm-sc-clients'], queryFn: api.listScClients, staleTime: 60_000 });
}
