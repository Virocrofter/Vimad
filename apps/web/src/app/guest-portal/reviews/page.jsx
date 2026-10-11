/* src/app/guest-portal/reviews/page.jsx */
import { FlagGate } from '@/components/FlagGate';

/**
 * Guest reviews — no reviews endpoint exists in v1.
 * Gated behind flags.guestReviews (NEXT_PUBLIC_FLAG_GUEST_REVIEWS).
 * The original mock-driven page is superseded by this gate; rebuild it
 * against the real reviews API when that module lands.
 */
export default function ReviewsPage() {
  return <FlagGate flag="guestReviews">{null}</FlagGate>;
}
