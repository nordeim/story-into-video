'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` when the user has OS-level reduced-motion preference enabled
 * (`prefers-reduced-motion: reduce`). Used to conditionally skip animations.
 *
 * The global CSS `@media (prefers-reduced-motion: reduce)` block in
 * `globals.css` handles most cases declaratively; this hook is for cases
 * where JS needs to know the preference (e.g., skipping a video autoplay,
 * disabling a JS-driven animation).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mediaQuery.matches);

    onChange(); // Initialize on mount
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
