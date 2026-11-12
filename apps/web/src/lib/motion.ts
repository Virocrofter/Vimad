// Stage 2 Motion decision (plan v3.0 section 6.5, 2026-11-13):
// framer-motion is NOT installed. Stage 2 needs only a small FLIP + count-up
// subset; adopting a ~35-45KB-gzip library for that fails the budget math.
// This module implements the subset with the Web Animations API (zero bytes)
// using the HQ-0 motion tokens. Revisit only if a later stage needs something
// WAAPI genuinely cannot do — and measure gzip before adopting.

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const motionPresets = {
  fast: { duration: 150, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  base: { duration: 250, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  slow: { duration: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
} as const;

export function animateCount(
  el: HTMLElement,
  from: number,
  to: number,
  preset: keyof typeof motionPresets = 'base'
): void {
  if (reduced()) {
    el.textContent = String(to);
    return;
  }
  const { duration, easing } = motionPresets[preset];
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

interface FlipItem {
  el: HTMLElement;
  from: DOMRect;
}

export function flipCapture(els: HTMLElement[]): FlipItem[] {
  return els.map((el) => ({ el, from: el.getBoundingClientRect() }));
}

export function flipPlay(items: FlipItem[], preset: keyof typeof motionPresets = 'base'): void {
  if (reduced()) return;
  const { duration, easing } = motionPresets[preset];
  for (const { el, from } of items) {
    const to = el.getBoundingClientRect();
    const dx = from.left - to.left;
    const dy = from.top - to.top;
    if (dx === 0 && dy === 0) continue;
    el.animate(
      [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0, 0)' }],
      { duration, easing }
    );
  }
}

export function fadeIn(el: HTMLElement, preset: keyof typeof motionPresets = 'fast'): Animation {
  if (reduced()) {
    return el.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1 });
  }
  const { duration, easing } = motionPresets[preset];
  return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing });
}
