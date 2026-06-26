import { ArrowRight } from 'lucide-react';

import { Eyebrow } from '@/components/primitives/eyebrow';
import { ScrollReveal } from '@/components/primitives/scroll-reveal';
import { SectionHeading } from '@/components/primitives/section-heading';
import { USE_CASES } from '@/lib/data/use-cases';

/**
 * UseCases — composes ScrollReveal (client) so becomes client via composition.
 * 2×2 grid (desktop) / 1-col (mobile). Each card is an <a> with corner amber
 * glow on hover (500ms fade-in), amber-tinted icon container, title (color
 * shift to amber-300 on hover), description, "Try it now →" CTA.
 * Each card wrapped in <ScrollReveal> with staggered delay (idx × 80ms, cap 400ms).
 */
export function UseCases() {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950 py-24"
      aria-labelledby="use-cases-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal className="mb-16 text-center">
          <Eyebrow className="mb-4">USE CASES</Eyebrow>
          <SectionHeading id="use-cases-heading">Built for Storytellers</SectionHeading>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {USE_CASES.map((uc, idx) => {
            const Icon = uc.icon;
            return (
              <ScrollReveal key={uc.id} delay={Math.min(idx * 80, 400)}>
                <a
                  href={uc.href}
                  className="group relative block overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:border-amber-400/20 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  {/* Decorative corner gradient — reveals on hover */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-amber-400/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  />

                  {/* Icon container — amber-tinted */}
                  <div className="relative mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
                    <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
                  </div>

                  {/* Title — color shifts to amber-300 on hover */}
                  <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-amber-300">
                    {uc.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-6 leading-relaxed text-zinc-400">{uc.description}</p>

                  {/* CTA */}
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-400">
                    Try it now
                    <ArrowRight
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </a>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
