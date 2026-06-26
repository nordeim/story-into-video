'use client';

import { type ElementType, type ReactNode } from 'react';

import { useReveal } from '@/lib/hooks/use-reveal';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: ReactNode;
  /** Stagger delay in milliseconds (sets the `--reveal-delay` CSS var). */
  delay?: number;
  className?: string;
  /** Element type to render. Defaults to 'div'. */
  as?: 'div' | 'section' | 'article' | 'li' | 'span';
}

/**
 * Wraps children with a `data-reveal` / `data-revealed` attribute pair
 * driven by the `useReveal` IntersectionObserver hook. The actual opacity
 * + translateY transition is defined in globals.css:
 *
 *   [data-reveal] { opacity: 0; transform: translateY(20px); ... }
 *   [data-reveal][data-revealed='true'] { opacity: 1; transform: none; }
 *
 * Client component — requires IntersectionObserver (browser API).
 */
export function ScrollReveal({ children, delay = 0, className, as = 'div' }: ScrollRevealProps) {
  const { ref, revealed } = useReveal<HTMLElement>();
  const Tag = as as ElementType;

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-revealed={revealed ? 'true' : 'false'}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
