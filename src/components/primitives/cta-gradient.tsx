import Link from 'next/link';

import { cn } from '@/lib/utils';

interface CtaGradientProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

/**
 * Tier-3 CTA: amber gradient pill (`from-primary to-primary`). More
 * assertive than the ghost link, less than the solid amber pill. Used only
 * by the Examples section ("Clone this project for free"). Hidden on mobile
 * (where the carousel auto-scrolls).
 *
 * Server component — pure presentation.
 */
export function CtaGradient({ children, href, className }: CtaGradientProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group inline-flex items-center gap-2.5 rounded-full px-10 py-4',
        'text-[15px] font-semibold transition-all duration-200',
        'from-primary to-primary bg-gradient-to-r text-zinc-950',
        'hover:shadow-primary/30 hover:shadow-lg',
        'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
        className,
      )}
    >
      {children}
    </Link>
  );
}
