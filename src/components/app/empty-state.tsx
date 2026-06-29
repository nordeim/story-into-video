import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

/**
 * EmptyState — reusable presentational component for empty list states.
 * Renders an icon, title, description, and optional CTA link.
 * Uses the luxury-dark design system.
 */
export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center',
        className,
      )}
    >
      {icon && (
        <div className="border-primary/20 bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-full border">
          {icon}
        </div>
      )}
      <h3 className="font-heading mb-2 text-xl font-bold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-zinc-400">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="bg-primary hover:bg-primary focus-visible:outline-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
