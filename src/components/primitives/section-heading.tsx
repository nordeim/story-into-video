import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  children: React.ReactNode;
  /** Heading level for semantic HTML. Defaults to h2. */
  as?: 'h1' | 'h2' | 'h3';
  /** Optional id for `aria-labelledby` association on the parent <section>. */
  id?: string;
  className?: string;
}

/**
 * Section H2 heading. Renders the `section-heading` @utility class
 * (Outfit font, 700 weight, -0.03em tracking, white, fluid clamp size).
 *
 * Server component — pure presentation.
 */
export function SectionHeading({ children, as: Tag = 'h2', id, className }: SectionHeadingProps) {
  return (
    <Tag id={id} className={cn('section-heading', className)}>
      {children}
    </Tag>
  );
}
