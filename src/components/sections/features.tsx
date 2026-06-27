import { Eyebrow } from '@/components/primitives/eyebrow';
import { CtaGhost } from '@/components/primitives/cta-ghost';
import { ScrollReveal } from '@/components/primitives/scroll-reveal';
import { SectionHeading } from '@/components/primitives/section-heading';
import { FEATURES } from '@/lib/data/features';
import { cn } from '@/lib/utils';

/**
 * Features — composes ScrollReveal (client) so becomes client via composition.
 * 4×2 grid (desktop) / 2-col (tablet) / 1-col (mobile) with continuous hairline
 * borders (NOT boxed cards). Three coordinated hover effects per card:
 *   1. Left accent bar: neutral-800 → amber-400 (300ms)
 *   2. Title: translate-x-0 → translate-x-2 (300ms)
 *   3. Bottom gradient sheen: opacity 0 → 1 (300ms)
 * Anti-generic: continuous surface separated by hairlines, not generic card grid.
 * Each card wrapped in <ScrollReveal> with staggered delay (idx × 80ms, cap 400ms).
 */
export function Features() {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950 py-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal className="mb-16 text-center">
          <Eyebrow className="mb-4">FEATURES</Eyebrow>
          <SectionHeading id="features-heading">
            Creating AI Videos Has Never Been So Easy
          </SectionHeading>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            // Edge cleanup: rightmost column + bottom row have no outer border
            const isLgRightColumn = (idx + 1) % 4 === 0;
            const isLgBottomRow = idx >= 4;
            const isMdRightColumn = (idx + 1) % 2 === 0;
            return (
              <ScrollReveal
                key={feature.id}
                delay={Math.min(idx * 80, 400)}
                className={cn(
                  'group relative border-r border-b border-neutral-800 px-8 py-10',
                  'transition-colors duration-300',
                  isLgRightColumn && 'lg:border-r-0',
                  isLgBottomRow && 'lg:border-b-0',
                  isMdRightColumn && 'md:border-r-0',
                )}
              >
                {/* Left accent bar — neutral→amber on hover */}
                <div
                  aria-hidden="true"
                  className="absolute start-0 top-8 bottom-8 w-[3px] rounded-e-full bg-neutral-800 transition-colors duration-300 group-hover:bg-amber-400"
                />

                {/* Icon — zinc→amber on hover */}
                <div className="mb-5 text-zinc-400 transition-colors duration-300 group-hover:text-amber-400">
                  <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                </div>

                {/* Title — slides 8px right on hover */}
                <h3 className="mb-2.5 text-[17px] font-bold text-white transition-transform duration-300 group-hover:translate-x-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-zinc-400">{feature.description}</p>

                {/* Bottom gradient sheen on hover */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal className="mt-12 text-center" delay={400}>
          <CtaGhost href="/create">Start Creating Your Video</CtaGhost>
        </ScrollReveal>
      </div>
    </section>
  );
}
