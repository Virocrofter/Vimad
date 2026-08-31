/* src/app/guest-portal/checkout/page.jsx */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CreditCard,
  Receipt,
  Star,
  KeyRound,
  Clock,
  Calendar,
  ChevronRight,
  Mail,
  Download,
  Share2,
  Printer,
  Home,
  ArrowRight,
  Bell,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  Shield,
  X,
  Minus,
  Plus,
  FileText,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { guestStay, formatCurrency, formatDate, getStayPhase } from '../data';
import { CheckoutSummaryCard, CheckoutActionCard, ExpressCheckoutButton } from './components';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const stay = guestStay;
  const [step, setStep] = useState('review'); // review | processing | complete | error
  const [expressMode, setExpressMode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('default');
  const [showReceipt, setShowReceipt] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDigitalKeyRevoke, setShowDigitalKeyRevoke] = useState(false);
  const [notifications, setNotifications] = useState({
    receipt: true,
    review: true,
    survey: false,
  });

  const handleExpressCheckout = async () => {
    setStep('processing');
    setExpressMode(true);
    await new Promise((r) => setTimeout(r, 2500));
    setStep('complete');
  };

  const handleStandardCheckout = async () => {
    setStep('processing');
    setExpressMode(false);
    await new Promise((r) => setTimeout(r, 3000));
    setStep('complete');
  };

  const handlePostCheckoutAction = (action) => {
    switch (action) {
      case 'review':
        setShowReviewModal(true);
        break;
      case 'receipt':
        setShowReceipt(true);
        break;
      case 'rebook':
        navigate('/booking');
        break;
      case 'loyalty':
        navigate('/guest-portal/loyalty');
        break;
      case 'home':
        navigate('/guest-portal');
        break;
      default:
        break;
    }
  };

  // ─── COMPLETE STATE ───
  if (step === 'complete') {
    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        {/* Success Banner */}
        <div className="text-center py-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-accent/10 mb-4">
            <CheckCircle2 className="h-12 w-12 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Checked Out Successfully!</h1>
          <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
            Thank you for staying with us at {stay.property.name}. We hope to welcome you back soon.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-xs font-medium text-accent">
            <Clock className="h-3.5 w-3.5" />
            Checked out at{' '}
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Stay Summary Card */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Stay Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Property</span>
              <span className="text-text-primary font-medium">{stay.property.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Room</span>
              <span className="text-text-primary font-medium">
                {stay.room.type} ({stay.room.number})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Dates</span>
              <span className="text-text-primary font-medium">
                {formatDate(stay.dates.arrival)} – {formatDate(stay.dates.departure)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Nights</span>
              <span className="text-text-primary font-medium">{stay.dates.nights}</span>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Total Paid</span>
                <span className="text-lg font-bold font-mono text-text-primary">
                  {formatCurrency(stay.folio.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Points Earned */}
        <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
              <Star className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">Points Earned</p>
              <p className="text-xs text-text-muted">From this stay</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-secondary">
                +{Math.round(stay.folio.total * 1.5)}
              </p>
              <p className="text-xs text-text-muted">pts</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => handlePostCheckoutAction('loyalty')}
              className="text-xs text-secondary hover:underline flex items-center gap-1"
            >
              View in Loyalty <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Digital Key Revoked */}
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <KeyRound className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Digital Key Deactivated</p>
              <p className="text-xs text-text-muted">
                Your mobile key has been automatically revoked
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-accent ml-auto" />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">What's Next?</h2>
          <div className="grid grid-cols-2 gap-3">
            <CheckoutActionCard
              icon={Star}
              label="Leave a Review"
              description="Share your experience"
              color="bg-yellow-500/10 text-yellow-500"
              onClick={() => handlePostCheckoutAction('review')}
            />
            <CheckoutActionCard
              icon={Receipt}
              label="View Receipt"
              description="Download or email"
              color="bg-secondary/10 text-secondary"
              onClick={() => handlePostCheckoutAction('receipt')}
            />
            <CheckoutActionCard
              icon={Calendar}
              label="Book Again"
              description="Same property"
              color="bg-accent/10 text-accent"
              onClick={() => handlePostCheckoutAction('rebook')}
            />
            <CheckoutActionCard
              icon={Home}
              label="Go to Dashboard"
              description="Manage your account"
              color="bg-info/10 text-info"
              onClick={() => handlePostCheckoutAction('home')}
            />
          </div>
        </div>

        {/* Receipt Modal */}
        {showReceipt && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowReceipt(false)}
            />
            <div className="relative w-full max-w-lg rounded-t-xl sm:rounded-xl border border-border bg-background shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-secondary" />
                  <h3 className="text-lg font-bold text-text-primary">Receipt</h3>
                </div>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Receipt Header */}
                <div className="text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mx-auto mb-3">
                    <span className="text-lg font-bold text-white">V</span>
                  </div>
                  <h4 className="text-lg font-bold text-text-primary">{stay.property.name}</h4>
                  <p className="text-xs text-text-muted">{stay.property.address.street}</p>
                  <p className="text-xs text-text-muted">
                    {stay.property.address.city}, {stay.property.address.state}{' '}
                    {stay.property.address.zip}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Paid in Full
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Confirmation #</span>
                    <span className="font-mono text-text-primary">{stay.confirmationNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Guest</span>
                    <span className="text-text-primary">John Smith</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Room</span>
                    <span className="text-text-primary">
                      {stay.room.number} · {stay.room.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Check-in</span>
                    <span className="text-text-primary">
                      {formatDate(stay.dates.arrival)} at {stay.dates.arrivalTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Check-out</span>
                    <span className="text-text-primary">
                      {formatDate(stay.dates.departure)} at {stay.dates.departureTime}
                    </span>
                  </div>
                </div>

                {/* Charges */}
                <div className="border-t border-border pt-4">
                  <h5 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Charges
                  </h5>
                  <div className="space-y-2 text-sm">
                    {stay.folio.charges.map((charge) => (
                      <div key={charge.id} className="flex items-center justify-between">
                        <span className="text-text-secondary">{charge.description}</span>
                        <span className="font-mono text-text-primary">
                          {formatCurrency(charge.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Subtotal</span>
                        <span className="font-mono text-text-primary">
                          {formatCurrency(stay.rate.total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Taxes & Fees</span>
                        <span className="font-mono text-text-primary">
                          {formatCurrency(stay.rate.taxes + stay.rate.fees)}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-text-primary">Total</span>
                        <span className="font-mono text-lg text-text-primary">
                          {formatCurrency(stay.folio.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="border-t border-border pt-4">
                  <h5 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Payment
                  </h5>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="text-sm text-text-primary">Visa ending in 4242</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(new Date().toISOString())}
                      </p>
                    </div>
                    <span className="ml-auto text-sm font-mono text-accent">
                      -{formatCurrency(stay.folio.paid)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button variant="outline" className="w-full">
                    <Printer className="mr-1.5 h-4 w-4" /> Print
                  </Button>
                  <Button className="w-full">
                    <Download className="mr-1.5 h-4 w-4" /> Download PDF
                  </Button>
                </div>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-1.5 h-4 w-4" /> Email Receipt
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowReviewModal(false)}
            />
            <div className="relative w-full max-w-lg rounded-t-xl sm:rounded-xl border border-border bg-background shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-10">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-bold text-text-primary">Rate Your Stay</h3>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="rounded-md p-1.5 hover:bg-surface-elevated text-text-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="text-center">
                  <p className="text-sm text-text-muted mb-4">
                    How was your stay at {stay.property.name}?
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewData((p) => ({ ...p, rating: star }))}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            'h-10 w-10 transition-colors',
                            reviewData.rating >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-border'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    {reviewData.rating > 0
                      ? ['Terrible', 'Poor', 'Average', 'Very Good', 'Excellent'][
                          reviewData.rating - 1
                        ]
                      : 'Tap to rate'}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">
                    Tell us about your experience
                  </label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData((p) => ({ ...p, comment: e.target.value }))}
                    rows={4}
                    placeholder="What did you like? What could we improve?"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4 text-text-muted" />
                  <span className="text-xs text-text-muted">
                    Your review helps other guests and helps us improve
                  </span>
                </div>

                <Button
                  className="w-full"
                  disabled={reviewData.rating === 0}
                  onClick={() => {
                    setShowReviewModal(false);
                    navigate('/guest-portal/reviews');
                  }}
                >
                  <Send className="mr-2 h-4 w-4" /> Submit Review
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── PROCESSING STATE ───
  if (step === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-border border-t-secondary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <LogOut className="h-8 w-8 text-secondary" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">Processing Checkout...</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-xs mx-auto">
            {expressMode
              ? 'Finalizing your express checkout. This will only take a moment.'
              : 'Please wait while we process your checkout and update your folio.'}
          </p>
        </div>
        <div className="space-y-2 text-xs text-text-muted">
          <p className={expressMode ? 'text-accent' : ''}>✓ Verifying folio balance</p>
          <p className={expressMode ? 'text-accent' : ''}>✓ Processing final payment</p>
          <p>⟳ Deactivating digital key</p>
          <p>⟳ Sending receipt to email</p>
          <p>⟳ Updating loyalty points</p>
        </div>
      </div>
    );
  }

  // ─── REVIEW STATE (default) ───
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/guest-portal/stay')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface hover:bg-surface-elevated transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Check Out</h1>
          <p className="text-xs text-text-muted">
            Room {stay.room.number} · {stay.property.name}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-accent">Ready for Checkout</p>
          <p className="text-xs text-text-secondary">
            Your folio is settled. No additional charges pending.
          </p>
        </div>
        <span className="text-xs font-mono text-accent font-medium">
          {formatCurrency(stay.folio.balance)}
        </span>
      </div>

      {/* Folio Summary */}
      <CheckoutSummaryCard stay={stay} />

      {/* Express Checkout */}
      <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
            <ZapIcon className="h-6 w-6 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Express Checkout</p>
            <p className="text-xs text-text-muted">Skip the front desk. Check out in seconds.</p>
          </div>
        </div>
        <div className="space-y-3 text-xs text-text-muted mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>Folio balance is zero</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>Digital key will be automatically revoked</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>Receipt will be emailed to your address</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>Loyalty points will be credited automatically</span>
          </div>
        </div>
        <Button size="lg" className="w-full" onClick={handleExpressCheckout}>
          <LogOut className="mr-2 h-4 w-4" /> Express Checkout
        </Button>
      </div>

      {/* Standard Checkout */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated">
            <Receipt className="h-6 w-6 text-text-muted" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Standard Checkout</p>
            <p className="text-xs text-text-muted">Review details before checking out</p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Payment Method</p>
          {stay.paymentMethods?.map((pm) => (
            <button
              key={pm.id}
              onClick={() => setSelectedPayment(pm.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                selectedPayment === pm.id
                  ? 'border-secondary bg-secondary/5'
                  : 'border-border bg-background hover:bg-surface-elevated'
              )}
            >
              <div
                className={cn(
                  'h-4 w-4 rounded-full border flex items-center justify-center',
                  selectedPayment === pm.id ? 'border-secondary bg-secondary' : 'border-border'
                )}
              >
                {selectedPayment === pm.id && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)} ending {pm.last4}
                </p>
                <p className="text-xs text-text-muted">Expires {pm.expiry}</p>
              </div>
              {pm.isDefault && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  Default
                </span>
              )}
            </button>
          )) || (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <CreditCard className="h-5 w-5 text-text-muted" />
              <div>
                <p className="text-sm text-text-primary">Visa ending in 4242</p>
                <p className="text-xs text-text-muted">Default payment method</p>
              </div>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">Send me</p>
          <label className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.receipt}
              onChange={(e) => setNotifications((p) => ({ ...p, receipt: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-secondary"
            />
            <div className="flex-1">
              <p className="text-sm text-text-primary">Final receipt</p>
              <p className="text-xs text-text-muted">Detailed folio to your email</p>
            </div>
            <Mail className="h-4 w-4 text-text-muted" />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.review}
              onChange={(e) => setNotifications((p) => ({ ...p, review: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-secondary"
            />
            <div className="flex-1">
              <p className="text-sm text-text-primary">Review reminder</p>
              <p className="text-xs text-text-muted">Link to leave a review in 24 hours</p>
            </div>
            <Star className="h-4 w-4 text-text-muted" />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifications.survey}
              onChange={(e) => setNotifications((p) => ({ ...p, survey: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-secondary"
            />
            <div className="flex-1">
              <p className="text-sm text-text-primary">Guest satisfaction survey</p>
              <p className="text-xs text-text-muted">Help us improve your experience</p>
            </div>
            <MessageSquare className="h-4 w-4 text-text-muted" />
          </label>
        </div>

        <Button variant="outline" size="lg" className="w-full" onClick={handleStandardCheckout}>
          <FileText className="mr-2 h-4 w-4" /> Review & Checkout
        </Button>
      </div>

      {/* Late Checkout Option */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">Need More Time?</p>
            <p className="text-xs text-text-muted">Late checkout available until 2:00 PM</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Late Checkout (2:00 PM)</p>
            <p className="text-xs text-text-muted">Additional {formatCurrency(50)}</p>
          </div>
          <button className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary/90 transition-colors">
            Request
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          As a Gold member, you may be eligible for complimentary late checkout subject to
          availability.
        </p>
      </div>

      {/* Help */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Need Help?</h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/guest-portal/messages')}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-secondary" />
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">Chat with Front Desk</p>
                <p className="text-xs text-text-muted">Questions about your folio or checkout</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
          <button
            onClick={() => navigate('/guest-portal/billing')}
            className="w-full flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-surface-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-accent" />
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">Review Full Folio</p>
                <p className="text-xs text-text-muted">Detailed charges and payments</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* Zap icon helper */
function ZapIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
