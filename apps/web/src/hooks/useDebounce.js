'use client';

import { useState, useEffect } from 'react';

/**
 * Debounce a changing value. Returns the debounced value.
 *
 * @param {*} value - The value to debounce
 * @param {number} delay - Milliseconds to wait
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
