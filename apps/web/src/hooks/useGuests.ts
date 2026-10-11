import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listGuests,
  getGuest,
  getGuestStats,
  createGuest,
  updateGuest,
  deleteGuest,
  mergeGuest,
  listGuestNotes,
  createGuestNote,
  deleteGuestNote,
  createGuestPreference,
  deleteGuestPreference,
  createGuestDocument,
  deleteGuestDocument,
} from '../api/guests';
import type { CreateGuestInput, UpdateGuestInput, GuestListParams } from '../api/guests';

const GUESTS_KEY = 'guests' as const;
const GUEST_STATS_KEY = 'guest-stats' as const;
const GUEST_NOTES_KEY = 'guest-notes' as const;

export function useGuestsList(params?: GuestListParams) {
  return useQuery({
    queryKey: [GUESTS_KEY, 'list', params],
    queryFn: () => listGuests(params),
    staleTime: 1000 * 30,
  });
}

export function useGuestStats() {
  return useQuery({
    queryKey: [GUEST_STATS_KEY],
    queryFn: () => getGuestStats(),
    staleTime: 1000 * 60,
  });
}

export function useGuest(id: string | undefined) {
  return useQuery({
    queryKey: [GUESTS_KEY, 'detail', id],
    queryFn: () => getGuest(id as string),
    enabled: !!id,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGuestInput) => createGuest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [GUEST_STATS_KEY] });
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGuestInput }) => updateGuest(id, input),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'detail', vars.id] });
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [GUEST_STATS_KEY] });
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [GUEST_STATS_KEY] });
    },
  });
}

export function useMergeGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetGuestId }: { id: string; targetGuestId: string }) =>
      mergeGuest(id, targetGuestId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'list'] });
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'detail', vars.targetGuestId] });
      queryClient.invalidateQueries({ queryKey: [GUEST_STATS_KEY] });
      queryClient.removeQueries({ queryKey: [GUESTS_KEY, 'detail', vars.id] });
    },
  });
}

// ─── Notes ───

export function useGuestNotes(guestId: string | undefined) {
  return useQuery({
    queryKey: [GUEST_NOTES_KEY, guestId],
    queryFn: () => listGuestNotes(guestId as string),
    enabled: !!guestId,
  });
}

export function useCreateGuestNote(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => createGuestNote(guestId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUEST_NOTES_KEY, guestId] });
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'detail', guestId] });
    },
  });
}

export function useDeleteGuestNote(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => deleteGuestNote(guestId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUEST_NOTES_KEY, guestId] });
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'detail', guestId] });
    },
  });
}

// ─── Preferences ───

export function useCreateGuestPreference(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { category: string; key: string; value: string }) =>
      createGuestPreference(guestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'detail', guestId] });
    },
  });
}

export function useDeleteGuestPreference(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefId: string) => deleteGuestPreference(guestId, prefId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'detail', guestId] });
    },
  });
}

// ─── Documents ───

export function useCreateGuestDocument(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      type: string;
      number?: string;
      issuedBy?: string;
      issueDate?: string;
      expiryDate?: string;
      fileUrl?: string;
    }) => createGuestDocument(guestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'detail', guestId] });
    },
  });
}

export function useDeleteGuestDocument(guestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => deleteGuestDocument(guestId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GUESTS_KEY, 'detail', guestId] });
    },
  });
}
