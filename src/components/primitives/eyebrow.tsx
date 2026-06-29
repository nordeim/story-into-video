import { cn } from '@/lib/utils';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Amber eyebrow badge used in every section header. Renders the `eyebrow`
 * @utility class (defined in globals.css): primary/10 bg, primary/25 border,
 * 11px uppercase tracking-widest text, ambient glow shadow.
 *
 * Server component — pure presentation, no client interactivity.
 */
export function Eyebrow({ children, className }: EyebrowProps) {
  return <span className={cn('eyebrow', className)}>{children}</span>;
}
