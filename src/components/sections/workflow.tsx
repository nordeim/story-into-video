'use client';

import { useState } from 'react';

import { Eyebrow } from '@/components/primitives/eyebrow';
import { CtaGhost } from '@/components/primitives/cta-ghost';
import { SectionHeading } from '@/components/primitives/section-heading';
import { ScrollReveal } from '@/components/primitives/scroll-reveal';
import { WORKFLOW_STEPS } from '@/lib/data/workflow-steps';
import { cn } from '@/lib/utils';

/**
 * WorkflowVideo — inner component handling the poster→fade-in choreography.
 * Shows the WebP poster immediately, then fades in the video over 1000ms
 * when the `canplay` event fires. If the video fails to load, the poster
 * remains visible (no error UI).
 */
function WorkflowVideo({ src, poster }: { src: string; poster: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <video
      className={cn(
        'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 lg:object-contain',
        loaded ? 'opacity-100' : 'opacity-0',
      )}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      onCanPlay={() => setLoaded(true)}
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

/**
 * Workflow — client component (promoted from server for video loading state).
 * 4 alternating media/text rows. Each step wrapped in <ScrollReveal> with
 * staggered delay (step.number × 80ms).
 *
 * Performance impact is minimal — the only state is `loaded` per video
 * (4 videos × 1 boolean = negligible). The benefit is the cinematic
 * fade-in choreography that matches the live site.
 */
export function Workflow() {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950 py-16 sm:py-20 lg:py-24"
      aria-labelledby="workflow-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal className="mb-16 text-center">
          <Eyebrow className="mb-4">HOW IT WORKS</Eyebrow>
          <SectionHeading id="workflow-heading">From Story to Video in 4 Steps</SectionHeading>
        </ScrollReveal>

        <div className="space-y-16 lg:space-y-24">
          {WORKFLOW_STEPS.map((step) => (
            <ScrollReveal key={step.number} delay={step.number * 80}>
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Media side */}
                <div
                  className={cn(
                    'relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900',
                    step.mediaPosition === 'left' ? 'lg:order-1' : 'lg:order-2',
                  )}
                >
                  <WorkflowVideo src={step.videoSrc} poster={step.videoPoster} />
                </div>

                {/* Text side */}
                <div className={cn(step.mediaPosition === 'left' ? 'lg:order-2' : 'lg:order-1')}>
                  {/* Step counter + horizontal rule */}
                  <div className="mb-5 flex items-center gap-3">
                    <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                      {String(step.number).padStart(2, '0')}
                    </span>
                    <span className="h-px flex-1 bg-neutral-800" aria-hidden="true" />
                  </div>

                  <h3 className="mb-5 text-2xl leading-tight font-bold tracking-tight text-white sm:text-3xl lg:text-[2rem]">
                    {step.title}
                  </h3>
                  <p className="mb-6 leading-relaxed text-zinc-400">{step.description}</p>
                  <CtaGhost href={step.ctaHref}>{step.ctaLabel}</CtaGhost>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
