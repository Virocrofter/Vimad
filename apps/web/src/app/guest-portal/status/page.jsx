/* src/app/guest-portal/status/page.jsx */
import { FlagGate } from '@/components/FlagGate';

/**
 * Service status & announcements — no guest-facing status endpoint exists
 * (the notifications module is staff-authed; guest tokens can't call it).
 * Gated behind flags.guestStatus (NEXT_PUBLIC_FLAG_GUEST_STATUS).
 * Rebuild against a real guest announcements/status endpoint when it lands.
 */
export default function StatusPage() {
  return <FlagGate flag="guestStatus">{null}</FlagGate>;
}
