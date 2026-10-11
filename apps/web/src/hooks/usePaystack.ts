/* apps/web/src/hooks/usePaystack.ts
 * Loads the Paystack Inline script once and exposes a popup helper.
 * Card numbers go straight to Paystack — they never touch our servers (PCI shortcut).
 */
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export function usePaystack() {
  const [ready, setReady] = useState(Boolean(window.PaystackPop));
  const loadingRef = useRef(false);

  useEffect(() => {
    if (window.PaystackPop || loadingRef.current) return;
    loadingRef.current = true;
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => {
      loadingRef.current = false;
    };
    document.body.appendChild(script);
  }, []);

  function payWithPopup(input: {
    publicKey: string;
    email: string;
    amountMinor: number;
    currency: string;
    reference: string;
    onSuccess: (reference: string) => void;
    onClose: () => void;
  }) {
    if (!window.PaystackPop) {
      input.onClose();
      return;
    }
    const handler = window.PaystackPop.setup({
      key: input.publicKey,
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      ref: input.reference,
      callback: (response: { reference: string }) => input.onSuccess(response.reference),
      onClose: input.onClose,
    });
    handler.openIframe();
  }

  return { ready, payWithPopup };
}
