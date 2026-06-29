import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CtaGhostProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

/**
 * Tier-1 CTA: ghost link with animated arrow. The most restrained CTA —
 * just amber text that brightens on hover, with an arrow that translates
 * right. Used by Workflow steps, Features, Testimonials, UseCases sections.
 *
 * Server component — pure presentation, hover handled by CSS group utility.
 */
export function CtaGhost({ children, href, className }: CtaGhostProps) {
  return (
    <a
      href={href}
      className={cn(
        'group inline-flex items-center gap-2',
        'text-primary hover:text-primary',
        'text-sm font-medium transition-colors duration-200',
        'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
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
