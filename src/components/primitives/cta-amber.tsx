import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CtaAmberProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  /** Optional click handler — presence implies client usage context. */
  onClick?: () => void;
}

/**
 * Tier-4 CTA: solid amber pill — the page's conversion crescendo. The only
 * place `bg-amber-400` is used as a solid fill on a button. Used only by
 * FinalCTA ("Start Creating — It's Free"). Hover brightens to amber-300,
 * adds glow shadow, and scales 1.02.
 *
 * Renders the `cta-amber` @utility class (defined in globals.css).
 * Server component by default; becomes client when `onClick` is wired.
 */
export function CtaAmber({ children, href, className, onClick }: CtaAmberProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        'cta-amber group inline-flex items-center gap-2.5',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
        className,
      )}
    >
      {children}
      <ArrowRight
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
        aria-hidden="true"
      />
    </a>
  );
}
