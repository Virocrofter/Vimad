/* apps/web/src/hooks/useGuestPortalData.ts
 * Guest portal data hooks — REAL API (no mocks).
 * Token flow: verifyIdentity() returns a JWT; we persist it in sessionStorage
 * and all stay-scoped hooks read it from there.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  guestPortalApi,
  getGuestToken,
  setGuestToken,
  clearGuestToken,
  type StayDetails,
  type ServiceRequestResult,
  type GuestFolio,
  type GuestDocumentItem,
} from './guestPortalApi';

export { getGuestToken, setGuestToken, clearGuestToken };

/* ─── Identity ─── */

/** Look up a reservation by confirmation number + last name (step 1). */
export function useGuestLookup() {
  return useMutation({
    mutationFn: ({
      confirmationNumber,
      lastName,
    }: {
      confirmationNumber: string;
      lastName: string;
    }) => guestPortalApi.lookup(confirmationNumber, lastName),
  });
}

/** Verify identity → returns and persists the guest-portal JWT (step 2). */
export function useGuestVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      confirmationNumber,
      lastName,
      documentNumber,
    }: {
      confirmationNumber: string;
      lastName: string;
      documentNumber?: string;
    }) => guestPortalApi.verify(confirmationNumber, lastName, documentNumber),
    onSuccess: (data) => {
      if (data.verified && data.token) {
        setGuestToken(data.token);
        qc.invalidateQueries({ queryKey: ['guest-stay'] });
      }
    },
  });
}

/** Sign out of the guest portal (clears the token + cached stay). */
export function useGuestSignOut() {
  const qc = useQueryClient();
  return () => {
    clearGuestToken();
    qc.removeQueries({ queryKey: ['guest-stay'] });
    qc.removeQueries({ queryKey: ['guest-digital-key'] });
    qc.removeQueries({ queryKey: ['guest-folio'] });
    qc.removeQueries({ queryKey: ['guest-documents'] });
  };
}

/* ─── Stay ─── */

/** Current stay details. Disabled until a token exists. */
export function useStayDetails() {
  const token = getGuestToken();
  return useQuery<StayDetails, Error>({
    queryKey: ['guest-stay', token],
    queryFn: () => guestPortalApi.stay(token as string),
    enabled: Boolean(token),
    staleTime: 30_000,
    retry: (count, err: any) => err?.status !== 401 && err?.status !== 403 && count < 2,
  });
}

/** Submit check-in. */
export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      estimatedArrivalTime?: string;
      idDocument?: string;
      signature?: string;
    }) => {
      const token = getGuestToken();
      if (!token) return Promise.reject(new Error('Not verified'));
      return guestPortalApi.checkIn({ token, ...input });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guest-stay'] }),
  });
}

/** Digital key (only when the stay says it's ready). */
export function useDigitalKey() {
  const token = getGuestToken();
  return useQuery({
    queryKey: ['guest-digital-key', token],
    queryFn: () => guestPortalApi.digitalKey(token as string),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  });
}

/** Service request (housekeeping / maintenance / concierge / amenity). */
export function useServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      type: ServiceRequestResult['type'];
      message: string;
      requestedAt?: string;
    }) => {
      const token = getGuestToken();
      if (!token) return Promise.reject(new Error('Not verified'));
      return guestPortalApi.serviceRequest({ token, ...input });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guest-requests'] }),
  });
}

/** Update guest preferences (string map). */
export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preferences: Record<string, string>) => {
      const token = getGuestToken();
      if (!token) return Promise.reject(new Error('Not verified'));
      return guestPortalApi.updatePreferences(token, preferences);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guest-preferences'] }),
  });
}

/** Read guest preferences (string map). */
export function useGuestPreferences() {
  const token = getGuestToken();
  return useQuery({
    queryKey: ['guest-preferences', token],
    queryFn: () => guestPortalApi.getPreferences(token as string),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  });
}

/* ─── G1 · Booking ─── */

export function useCancelQuote(enabled = true) {
  const token = getGuestToken();
  return useQuery({
    queryKey: ['guest-cancel-quote', token],
    queryFn: () => guestPortalApi.cancelQuote(token as string),
    enabled: Boolean(token) && enabled,
    retry: false,
  });
}

export function useModifyBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      arrivalDate: string;
      departureDate: string;
      adults?: number;
      children?: number;
    }) => {
      const token = getGuestToken();
      if (!token) return Promise.reject(new Error('Not verified'));
      return guestPortalApi.modifyBooking({ token, ...input });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guest-stay'] });
      qc.invalidateQueries({ queryKey: ['guest-folio'] });
    },
  });
}

export function useCancelBooking() {
  return useMutation({
    mutationFn: (reason?: string) => {
      const token = getGuestToken();
      if (!token) return Promise.reject(new Error('Not verified'));
      return guestPortalApi.cancelBooking(token, reason);
    },
  });
}

/* ─── G1 · Billing ─── */

export function useGuestFolio() {
  const token = getGuestToken();
  return useQuery<GuestFolio, Error>({
    queryKey: ['guest-folio', token],
    queryFn: () => guestPortalApi.folio(token as string),
    enabled: Boolean(token),
    staleTime: 30_000,
    retry: (count, err: any) => err?.status !== 401 && err?.status !== 403 && count < 2,
  });
}

export function useGuestInvoice(invoiceId: string | null) {
  const token = getGuestToken();
  return useQuery({
    queryKey: ['guest-invoice', token, invoiceId],
    queryFn: () => guestPortalApi.invoice(token as string, invoiceId as string),
    enabled: Boolean(token) && Boolean(invoiceId),
    retry: false,
  });
}

/* ─── G1 · Documents ─── */

export function useGuestDocuments() {
  const token = getGuestToken();
  return useQuery<{ token: string; documents: GuestDocumentItem[] }, Error>({
    queryKey: ['guest-documents', token],
    queryFn: () => guestPortalApi.documents(token as string),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: (count, err: any) => err?.status !== 401 && err?.status !== 403 && count < 2,
  });
}

export function useAddGuestDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      type: 'passport' | 'national_id' | 'driver_license' | 'other';
      number: string;
    }) => {
      const token = getGuestToken();
      if (!token) return Promise.reject(new Error('Not verified'));
      return guestPortalApi.addDocument(token, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['guest-documents'] }),
  });
}
