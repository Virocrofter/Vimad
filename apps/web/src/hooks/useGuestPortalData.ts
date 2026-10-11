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
  });
}

/** Update guest preferences (string map). */
export function useUpdatePreferences() {
  return useMutation({
    mutationFn: (preferences: Record<string, string>) => {
      const token = getGuestToken();
      if (!token) return Promise.reject(new Error('Not verified'));
      return guestPortalApi.updatePreferences(token, preferences);
    },
  });
}

/* ─── Removed mock hooks ───
 * useGuestProfile / useGuestStays / useGuestAnnouncements returned mock objects
 * with no real API equivalent in v1. Pages that need them:
 *   - profile  → use StayDetails.guestName + useUpdatePreferences
 *   - stays    → useStayDetails (single active stay)
 *   - announcements / billing → feature-flagged (flags.guestBilling)
 */
