'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` when `window.scrollY` exceeds the given threshold.
 * Used by the Navbar to toggle its scroll-aware background.
 *
 * @param threshold - pixels scrolled before activating (default 10)
 */
export function useScrolled(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll(); // Initialize on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
