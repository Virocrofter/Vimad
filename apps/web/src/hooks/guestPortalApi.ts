/* apps/web/src/hooks/guestPortalApi.ts — full guest-portal client (P0-G4). */

const API_BASE: string = (import.meta as any).env?.VITE_API_URL ?? '/api/v1';

const TOKEN_KEY = 'gp_token';

export function getGuestToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setGuestToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

export function clearGuestToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export class GuestPortalError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function raw(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}/guest-portal${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
}

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const res = await raw(path, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = body?.error?.code ?? 'REQUEST_FAILED';
    // P6 sliding session: transparent single refresh + retry on expiry.
    if (res.status === 401 && code === 'PORTAL_TOKEN_INVALID' && !retried) {
      const current = getGuestToken();
      if (current) {
        try {
          const r = await raw('/refresh', {
            method: 'POST',
            body: JSON.stringify({ token: current }),
          });
          const rb = await r.json();
          if (r.ok && rb?.data?.token) {
            setGuestToken(rb.data.token);
            return request<T>(path, init, true);
          }
        } catch {
          /* fall through to the error below */
        }
      }
    }
    throw new GuestPortalError(
      res.status,
      code,
      body?.error?.message ?? `Request failed (${res.status})`
    );
  }
  return body.data as T;
}

/* ─── Types: auth & stay ─── */
export interface LookupResult {
  found: boolean;
  confirmationNumber: string;
  guestName: string;
  arrivalDate: string;
  departureDate: string;
}

export interface VerifyResult {
  verified: boolean;
  token: string;
}

export interface StayDetails {
  token: string;
  guestName: string;
  roomNumber: string;
  arrivalDate: string;
  departureDate: string;
  checkedIn: boolean;
  digitalKeyReady: boolean;
  status: string;
  confirmationNumber: string;
  propertyName: string;
  roomTypeName: string | null;
  nights: number;
  adults: number;
  children: number;
  totalAmount: number;
  balance: number;
  currency: string;
}

export interface DigitalKey {
  token: string;
  keyCode: string;
  activeFrom: string;
  activeUntil: string;
}

export interface CheckInResult {
  success: boolean;
  token: string;
  checkedIn: boolean;
  estimatedArrivalTime?: string;
}

export interface ServiceRequestResult {
  id: string;
  token: string;
  type: 'housekeeping' | 'maintenance' | 'concierge' | 'amenity';
  message: string;
  status: string;
  createdAt: string;
}

export interface PreferencesResult {
  token: string;
  preferences: Record<string, string>;
  updatedAt: string;
}

/* ─── Types: G1 booking ─── */
export interface CancelQuote {
  token: string;
  confirmationNumber: string;
  status: string;
  policy: {
    type: 'free' | 'partial' | 'non-refundable';
    fee: number;
    feePercent: number;
    label: string;
    description: string;
  };
  paid: number;
  refund: number;
  arrivalDate: string;
  departureDate: string;
}

export interface ModifyBookingResult {
  token: string;
  confirmationNumber: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  previousTotal: number;
  totalAmount: number;
  delta: number;
  balance: number;
  currency: string;
}

export interface CancelBookingResult {
  token: string;
  confirmationNumber: string;
  status: string;
  policy: CancelQuote['policy'];
  cancelledAt: string;
}

/* ─── Types: G1 billing ─── */
export interface GuestFolioItem {
  id: string;
  type: string;
  description: string;
  amount: number;
  quantity: number;
  postedAt: string;
}

export interface GuestPayment {
  id: string;
  reference: string;
  channel: string;
  cardLast4: string | null;
  cardBrand: string | null;
  amount: number;
  currency: string;
  type: string;
  createdAt: string;
}

export interface GuestInvoice {
  id: string;
  number: string;
  type: string;
  status: string;
  currency: string;
  totalInclVat: number;
  createdAt: string;
}

export interface GuestFolio {
  token: string;
  confirmationNumber: string;
  folio: {
    id: string;
    status: string;
    totalCharges: number;
    totalPayments: number;
    balance: number;
    currency: string;
    closedAt: string | null;
  } | null;
  items: GuestFolioItem[];
  payments: GuestPayment[];
  invoices: GuestInvoice[];
  roomRate: { nights: number; total: number; currency: string };
}

export interface GuestInvoiceDetail {
  token: string;
  invoice: {
    id: string;
    number: string;
    type: string;
    status: string;
    currency: string;
    subtotalExVat: number;
    totalInclVat: number;
    vatAmount: number;
    createdAt: string;
  };
}

/* ─── Types: G2 payments ─── */
export interface PayInitializeResult {
  reference: string;
  authorizationUrl: string | null;
  amountMinor: number;
  currency: string;
  idempotentReplay: boolean;
}

export interface PayVerifyResult {
  reference: string;
  status: string;
  amountMinor: number;
  currency: string;
  postedToFolio: boolean;
  cardLast4: string | null;
  cardBrand: string | null;
  balance: number | null;
}

export interface GuestPayPaymentItem {
  id: string;
  reference: string;
  type: string;
  status: string;
  amountMinor: number;
  currency: string;
  channel: string;
  cardLast4: string | null;
  cardBrand: string | null;
  postedToFolio: boolean;
  failureReason: string | null;
  createdAt: string;
}

export interface GuestPayRequestItem {
  id: string;
  reference: string;
  amountMinor: number;
  currency: string;
  status: string;
  description: string | null;
  dueDate: string;
  hostedUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface GuestSplitItem {
  id: string;
  toName: string;
  toEmail: string | null;
  toPhone: string | null;
  amount: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
  respondedAt: string | null;
  appliedAt: string | null;
}

/* ─── Types: G3 loyalty ─── */
export interface GuestLoyaltySummary {
  token: string;
  balance: number;
  currency: string;
  tier: { name: string; minPoints: number };
  nextTier: { name: string; minPoints: number } | null;
  pointsToNext: number;
  earnRate: number;
  redeemValue: number;
  memberSince: string;
}

export interface GuestLoyaltyTransaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  source: string;
  createdAt: string;
}

export interface GuestLoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  status: string;
}

export interface GuestRedeemResult {
  id: string;
  status: string;
  rewardName: string;
  pointsCost: number;
  newBalance: number;
  conciergeItemId: string | null;
  idempotentReplay: boolean;
}

/* ─── Types: G3 profile ─── */
export interface GuestProfile {
  token: string;
  guest: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    nationality: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    dateOfBirth: string | null;
    vipStatus: string | null;
    loyaltyPoints: number;
    createdAt: string;
  };
  propertyName: string;
  confirmationNumber: string;
}

export interface GuestDocumentItem {
  id: string;
  type: string;
  number: string | null;
  issuedBy: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  fileUrl: string | null;
  verificationStatus: string;
  verifiedAt: string | null;
  createdAt: string;
}

/* ─── Types: G4 commerce ─── */
export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  availableFrom: string;
  availableTo: string;
  availableNow: boolean;
}

export interface GuestOrderLine {
  id: string;
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface GuestOrder {
  id: string;
  status: 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number;
  note: string | null;
  folioItemId: string | null;
  createdAt: string;
  items: GuestOrderLine[];
}

export interface UpsellProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  taxInclusive: boolean;
}

export interface GuestTimelineEvent {
  at: string;
  kind: string;
  title: string;
}

/* ─── Calls ─── */
export const guestPortalApi = {
  lookup: (confirmationNumber: string, lastName: string) =>
    request<LookupResult>('/lookup', {
      method: 'POST',
      body: JSON.stringify({ confirmationNumber, lastName }),
    }),

  verify: (confirmationNumber: string, lastName: string, documentNumber?: string) =>
    request<VerifyResult>('/verify', {
      method: 'POST',
      body: JSON.stringify({ confirmationNumber, lastName, documentNumber }),
    }),

  stay: (token: string) => request<StayDetails>(`/stay/${encodeURIComponent(token)}`),

  checkIn: (input: {
    token: string;
    estimatedArrivalTime?: string;
    idDocument?: string;
    signature?: string;
  }) => request<CheckInResult>('/check-in', { method: 'POST', body: JSON.stringify(input) }),

  digitalKey: (token: string) => request<DigitalKey>(`/digital-key/${encodeURIComponent(token)}`),

  serviceRequest: (input: {
    token: string;
    type: ServiceRequestResult['type'];
    message: string;
    requestedAt?: string;
  }) =>
    request<ServiceRequestResult>('/service-request', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updatePreferences: (token: string, preferences: Record<string, string>) =>
    request<PreferencesResult>(`/preferences/${encodeURIComponent(token)}`, {
      method: 'PATCH',
      body: JSON.stringify({ preferences }),
    }),

  getPreferences: (token: string) =>
    request<PreferencesResult>(`/preferences/${encodeURIComponent(token)}`),

  cancelQuote: (token: string) =>
    request<CancelQuote>(`/cancel-quote/${encodeURIComponent(token)}`),

  modifyBooking: (input: {
    token: string;
    arrivalDate: string;
    departureDate: string;
    adults?: number;
    children?: number;
  }) => request<ModifyBookingResult>('/modify', { method: 'POST', body: JSON.stringify(input) }),

  cancelBooking: (token: string, reason?: string) =>
    request<CancelBookingResult>('/cancel', {
      method: 'POST',
      body: JSON.stringify({ token, reason }),
    }),

  folio: (token: string) => request<GuestFolio>(`/folio/${encodeURIComponent(token)}`),

  invoice: (token: string, invoiceId: string) =>
    request<GuestInvoiceDetail>(
      `/invoice/${encodeURIComponent(token)}/${encodeURIComponent(invoiceId)}`
    ),

  payInitialize: (
    token: string,
    input: { amountMinor?: number; idempotencyKey: string; paymentRequestId?: string }
  ) =>
    request<PayInitializeResult>(`/pay/${encodeURIComponent(token)}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  payVerify: (token: string, reference: string) =>
    request<PayVerifyResult>(
      `/pay/${encodeURIComponent(token)}/verify/${encodeURIComponent(reference)}`
    ),

  payPayments: (token: string) =>
    request<{ token: string; payments: GuestPayPaymentItem[] }>(
      `/pay/${encodeURIComponent(token)}/payments`
    ),

  payRequests: (token: string) =>
    request<{ token: string; requests: GuestPayRequestItem[] }>(
      `/pay/${encodeURIComponent(token)}/requests`
    ),

  splitCreate: (
    token: string,
    input: {
      toName: string;
      toEmail?: string;
      toPhone?: string;
      amount: number;
      note?: string;
    }
  ) =>
    request<{ id: string; status: string; amount: number; currency: string }>(
      `/pay/${encodeURIComponent(token)}/split`,
      { method: 'POST', body: JSON.stringify(input) }
    ),

  splits: (token: string) =>
    request<{ token: string; splits: GuestSplitItem[] }>(
      `/pay/${encodeURIComponent(token)}/splits`
    ),

  splitRespond: (token: string, splitId: string, action: 'accept' | 'decline', note?: string) =>
    request<{ id: string; status: string }>(
      `/pay/${encodeURIComponent(token)}/split/${encodeURIComponent(splitId)}/respond`,
      { method: 'POST', body: JSON.stringify({ action, note }) }
    ),

  loyalty: (token: string) => request<GuestLoyaltySummary>(`/loyalty/${encodeURIComponent(token)}`),

  loyaltyTransactions: (token: string) =>
    request<{ token: string; transactions: GuestLoyaltyTransaction[] }>(
      `/loyalty/${encodeURIComponent(token)}/transactions`
    ),

  loyaltyRewards: (token: string) =>
    request<{ token: string; rewards: GuestLoyaltyReward[] }>(
      `/loyalty/${encodeURIComponent(token)}/rewards`
    ),

  loyaltyRedeem: (
    token: string,
    input: { rewardId: string; idempotencyKey: string; note?: string }
  ) =>
    request<GuestRedeemResult>(`/loyalty/${encodeURIComponent(token)}/redeem`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  profile: (token: string) => request<GuestProfile>(`/profile/${encodeURIComponent(token)}`),

  updateProfile: (
    token: string,
    input: {
      email?: string;
      phone?: string;
      nationality?: string;
      address?: string;
      city?: string;
      country?: string;
    }
  ) =>
    request<GuestProfile>(`/profile/${encodeURIComponent(token)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  documents: (token: string) =>
    request<{ token: string; documents: GuestDocumentItem[] }>(
      `/profile/${encodeURIComponent(token)}/documents`
    ),

  addDocument: (
    token: string,
    input: {
      type: 'passport' | 'national_id' | 'driver_license' | 'other';
      number?: string;
      issuedBy?: string;
      issueDate?: string;
      expiryDate?: string;
    }
  ) =>
    request<{ token: string; document: GuestDocumentItem }>(
      `/profile/${encodeURIComponent(token)}/documents`,
      { method: 'POST', body: JSON.stringify(input) }
    ),

  uploadDocument: (
    token: string,
    docId: string,
    input: {
      fileName: string;
      contentBase64: string;
      contentType: string;
    }
  ) =>
    request<{ token: string; document: GuestDocumentItem; size: number }>(
      `/profile/${encodeURIComponent(token)}/documents/${encodeURIComponent(docId)}/upload`,
      { method: 'POST', body: JSON.stringify(input) }
    ),

  /* ─── P6 · GDPR + telemetry ─── */

  gdprRequest: (token: string, kind: 'export' | 'erasure') =>
    request<{ request: string; queued: boolean }>(`/profile/${encodeURIComponent(token)}/gdpr`, {
      method: 'POST',
      body: JSON.stringify({ request: kind }),
    }),

  track: (token: string, event: string, meta?: Record<string, unknown>) => {
    // Fire-and-forget guest analytics; failures are swallowed by design.
    fetch(`${API_BASE}/guest-portal/comms/telemetry/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, meta }),
    }).catch(() => {});
  },

  /* ─── G4 · Commerce ─── */

  commerceMenu: (token: string) =>
    request<{ token: string; now: string; timezone: string; menu: MenuItem[] }>(
      `/commerce/${encodeURIComponent(token)}/menu`
    ),

  commerceOrder: (
    token: string,
    input: {
      items: { menuItemId: string; quantity: number }[];
      note?: string;
      idempotencyKey: string;
    }
  ) =>
    request<{ order: GuestOrder; idempotentReplay: boolean }>(
      `/commerce/${encodeURIComponent(token)}/order`,
      { method: 'POST', body: JSON.stringify(input) }
    ),

  commerceOrders: (token: string) =>
    request<{ token: string; orders: GuestOrder[] }>(
      `/commerce/${encodeURIComponent(token)}/orders`
    ),

  commerceCancelOrder: (token: string, orderId: string) =>
    request<{ id: string; status: string }>(
      `/commerce/${encodeURIComponent(token)}/orders/${encodeURIComponent(orderId)}/cancel`,
      { method: 'POST' }
    ),

  commerceUpsells: (token: string) =>
    request<{ token: string; products: UpsellProductItem[] }>(
      `/commerce/${encodeURIComponent(token)}/upsells`
    ),

  commercePurchaseUpsell: (token: string, productId: string, quantity = 1) =>
    request<{ id: string; folioItemId: string; total: number }>(
      `/commerce/${encodeURIComponent(token)}/upsells/${encodeURIComponent(productId)}/purchase`,
      { method: 'POST', body: JSON.stringify({ quantity }) }
    ),

  guestTimeline: (token: string) =>
    request<{ token: string; events: GuestTimelineEvent[] }>(
      `/commerce/${encodeURIComponent(token)}/timeline`
    ),
};
