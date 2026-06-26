'use client';

import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  /** Intersection ratio threshold (0-1). Default 0.15. */
  threshold?: number;
  /** Root margin string. Default '0px 0px -50px 0px' (triggers 50px before entering). */
  rootMargin?: string;
  /** If true (default), observer disconnects after first intersection. */
  once?: boolean;
}

interface UseRevealReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  revealed: boolean;
}

/**
 * Wraps `IntersectionObserver` to trigger a one-shot reveal flag when an
 * element enters the viewport. Used by the `ScrollReveal` primitive and
 * section components for cinematic staggered entrance animations.
 *
 * The `data-reveal` / `data-revealed` CSS attributes handle the actual
 * visual transition (opacity + translateY); this hook just flips the flag.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
): UseRevealReturn<T> {
  const { threshold = 0.15, rootMargin = '0px 0px -50px 0px', once = true } = options;
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, revealed };
}
