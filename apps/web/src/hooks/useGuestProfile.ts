/* apps/web/src/hooks/useGuestProfile.ts — G3 profile + documents vault */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  guestPortalApi,
  getGuestToken,
  type GuestDocumentItem,
  type GuestProfile,
} from './guestPortalApi';

const tk = () => getGuestToken() ?? '';

export function useGuestProfile() {
  return useQuery<GuestProfile>({
    queryKey: ['gp-profile'],
    queryFn: () => guestPortalApi.profile(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useUpdateGuestProfile() {
  const queryClient = useQueryClient();
  return useMutation<
    GuestProfile,
    Error,
    {
      email?: string;
      phone?: string;
      nationality?: string;
      address?: string;
      city?: string;
      country?: string;
    }
  >({
    mutationFn: (input) => guestPortalApi.updateProfile(tk(), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp-profile'] });
    },
  });
}

export function useGuestGdprRequest() {
  return useMutation<
    { request: string; queued: boolean },
    Error,
    { request: 'export' | 'erasure' }
  >({
    mutationFn: (input) => guestPortalApi.gdprRequest(tk(), input.request),
  });
}

export function useGuestDocuments() {
  return useQuery<{ token: string; documents: GuestDocumentItem[] }>({
    queryKey: ['gp-documents'],
    queryFn: () => guestPortalApi.documents(tk()),
    enabled: Boolean(getGuestToken()),
  });
}

export function useAddGuestDocument() {
  const queryClient = useQueryClient();
  return useMutation<
    { token: string; document: GuestDocumentItem },
    Error,
    {
      type: 'passport' | 'national_id' | 'driver_license' | 'other';
      number?: string;
      issuedBy?: string;
      issueDate?: string;
      expiryDate?: string;
    }
  >({
    mutationFn: (input) => guestPortalApi.addDocument(tk(), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp-documents'] });
    },
  });
}

export function useUploadGuestDocument() {
  const queryClient = useQueryClient();
  return useMutation<
    { token: string; document: GuestDocumentItem; size: number },
    Error,
    { docId: string; fileName: string; contentBase64: string; contentType: string }
  >({
    mutationFn: ({ docId, ...input }) => guestPortalApi.uploadDocument(tk(), docId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp-documents'] });
    },
  });
}
