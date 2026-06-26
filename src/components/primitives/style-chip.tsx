import { cn } from '@/lib/utils';

interface StyleChipProps {
  label: string;
  /** Optional smaller sublabel (only "Cyberpunk" uses this: "Futuristic neon"). */
  sublabel?: string;
  /** Active state — only relevant when `onClick` is wired (interactive chip). */
  active?: boolean;
  /** Optional click handler — presence switches the element from <div> to <button>. */
  onClick?: () => void;
  className?: string;
}

/**
 * Marquee chip for the Hero style tags ticker (Ghibli, Oil Painting, Anime,
 * Realistic, Cyberpunk, Watercolor, Comic). Inactive: white/50 text on
 * white/[0.02] bg. Hover/active: amber-300 text on amber-400/30 border.
 *
 * When `onClick` is provided, renders a `<button>` with `aria-pressed`.
 * Otherwise renders a `<div>` (decorative marquee chip).
 */
export function StyleChip({ label, sublabel, active = false, onClick, className }: StyleChipProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2',
        'border border-white/10 bg-white/[0.02]',
        'text-sm font-bold whitespace-nowrap transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
        active
          ? 'border-amber-400/30 text-amber-300'
          : 'text-white/50 hover:border-amber-400/30 hover:text-amber-300',
        className,
      )}
    >
      <span>{label}</span>
      {sublabel && <span className="text-xs text-zinc-500">{sublabel}</span>}
    </Component>
  );
}
