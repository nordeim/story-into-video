import { CtaAmber } from '@/components/primitives/cta-amber';
import { ScrollReveal } from '@/components/primitives/scroll-reveal';

/**
 * FinalCTA — server component.
 * The page's conversion crescendo. 4 decorative layers (dot-grid, radial amber
 * halo, top fade, bottom fade) + H2 + subtitle + solid amber pill CTA + footnote.
 * This is the only place `bg-primary` is used as a solid fill on a button.
 */
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-32" aria-labelledby="final-cta-heading">
      {/* Decorative layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(rgba(234,179,8,0.1) 0%, rgba(234,179,8,0.03) 40%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent"
      />

      {/* Content */}
      <ScrollReveal className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <h2
          id="final-cta-heading"
          className="font-heading mb-6 text-3xl font-extrabold tracking-tighter text-white sm:text-5xl md:text-7xl"
        >
          Your Story Deserves to Be Seen
        </h2>
        <p className="mx-auto mb-10 max-w-[52ch] text-base leading-relaxed text-zinc-400 sm:text-lg">
          Join thousands of creators turning their stories into cinematic videos with AI. No editing
          skills required — just paste your story and watch it come alive.
        </p>
        <CtaAmber href="/create">Start Creating — It&apos;s Free</CtaAmber>
        <p className="mt-6 text-xs text-zinc-500">No credit card required · Free forever plan</p>
      </ScrollReveal>
    </section>
  );
}
