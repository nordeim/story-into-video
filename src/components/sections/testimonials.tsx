import { Eyebrow } from '@/components/primitives/eyebrow';
import { CtaGhost } from '@/components/primitives/cta-ghost';
import { ScrollReveal } from '@/components/primitives/scroll-reveal';
import { SectionHeading } from '@/components/primitives/section-heading';
import { TESTIMONIALS } from '@/lib/data/testimonials';

/**
 * Testimonials — composes ScrollReveal (client) so becomes client via composition.
 * 3×2 grid (desktop) / 2-col (tablet) / 1-col (mobile). Card = quote + avatar
 * (initials in amber gradient circle) + name + role. Border lightens on hover
 * (zinc-800/60 → zinc-700/60, 300ms). Each card wrapped in <ScrollReveal>
 * with staggered delay (idx × 80ms, cap 400ms).
 */
export function Testimonials() {
  return (
    <section className="bg-zinc-950 py-16 sm:py-20 lg:py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal className="mb-16 text-center">
          <Eyebrow className="mb-4">TESTIMONIALS</Eyebrow>
          <SectionHeading id="testimonials-heading">Loved by Creators</SectionHeading>
          <p className="mx-auto mt-4 max-w-[45ch] text-base text-zinc-400 sm:text-lg">
            Hear from creators who use StoryIntoVideo to turn their stories into videos every day.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <ScrollReveal key={t.id} delay={Math.min(idx * 80, 400)}>
              <figure className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 transition-colors duration-300 hover:border-zinc-700/60 sm:p-6">
                <blockquote>
                  <p className="mb-5 text-sm leading-relaxed text-zinc-300">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-zinc-950"
                    style={{
                      background: 'linear-gradient(to bottom right, #fbbf24, #d97706)',
                    }}
                    aria-hidden="true"
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.authorName}</p>
                    <p className="text-xs text-zinc-500">{t.authorRole}</p>
                  </div>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-12 text-center" delay={400}>
          <CtaGhost href="#">Join Creators — Start Free</CtaGhost>
        </ScrollReveal>
      </div>
    </section>
  );
}
