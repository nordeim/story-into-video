import { cn } from '@/lib/utils';

interface CtaGradientProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

/**
 * Tier-3 CTA: amber gradient pill (`from-amber-400 to-amber-500`). More
 * assertive than the ghost link, less than the solid amber pill. Used only
 * by the Examples section ("Clone this project for free"). Hidden on mobile
 * (where the carousel auto-scrolls).
 *
 * Server component — pure presentation.
 */
export function CtaGradient({ children, href, className }: CtaGradientProps) {
  return (
    <a
      href={href}
      className={cn(
        'group inline-flex items-center gap-2.5 rounded-full px-10 py-4',
        'text-[15px] font-semibold transition-all duration-200',
        'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950',
        'hover:shadow-lg hover:shadow-amber-400/30',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
        className,
      )}
    >
      {children}
    </a>
  );
}
