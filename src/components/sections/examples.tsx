'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { CtaGradient } from '@/components/primitives/cta-gradient';
import { Eyebrow } from '@/components/primitives/eyebrow';
import { ScrollReveal } from '@/components/primitives/scroll-reveal';
import { SectionHeading } from '@/components/primitives/section-heading';
import { EXAMPLE_CARDS } from '@/lib/data/examples';

const CARD_WIDTH = 260; // px
const CARD_GAP = 16; // px (gap-4)

/**
 * Examples — client component.
 * Header row (eyebrow + H2 + carousel arrows) + horizontal flex carousel +
 * "Clone this project for free" gradient CTA below.
 *
 * Cards: 260×462px portrait (9:16), snap-x mandatory on mobile.
 * Hover: yellow→purple gradient glow (the SINGULAR purple exception in the
 * entire design system) + image scale 1.05 (500ms).
 *
 * Arrow clicks call scrollBy(2 cards worth of distance).
 */
export function Examples() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (direction: 'prev' | 'next') => {
    const container = scrollRef.current;
    if (!container) return;
    const delta = (CARD_WIDTH + CARD_GAP) * 2 * (direction === 'next' ? 1 : -1);
    container.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section
      className="relative scroll-mt-20 overflow-hidden px-6 py-16 md:py-20"
      aria-labelledby="examples-heading"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header row */}
        <ScrollReveal className="mb-12 flex items-end justify-between">
          <div>
            <Eyebrow className="mb-4">REAL EXAMPLES</Eyebrow>
            <SectionHeading id="examples-heading" className="text-3xl md:text-[40px]">
              Real Story Into Video Examples
            </SectionHeading>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCards('prev')}
              className="hover:border-primary/60 hover:text-primary focus-visible:outline-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-600/60 text-zinc-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Previous examples"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards('next')}
              className="hover:border-primary/60 hover:text-primary focus-visible:outline-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-600/60 text-zinc-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Next examples"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </ScrollReveal>

        {/* Carousel */}
        <ScrollReveal delay={100}>
          <div
            ref={scrollRef}
            className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
            role="region"
            aria-label="Example videos carousel"
          >
            {EXAMPLE_CARDS.map((card) => (
              <article
                key={card.id}
                className="group focus-within:outline-primary relative w-[260px] shrink-0 cursor-pointer snap-start focus-within:outline-2 focus-within:outline-offset-2"
              >
                {/* Hover glow — yellow→purple gradient (the singular purple exception) */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-[20px] bg-gradient-to-r from-yellow-500 to-purple-500 opacity-50 blur-md transition-opacity duration-300 group-hover:opacity-80"
                />

                {/* Card body */}
                <Link
                  href={card.href}
                  className="bg-card focus-visible:outline-primary relative block aspect-[9/16] overflow-hidden rounded-[20px] border border-white/5 transition-colors group-hover:border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Image
                    src={card.thumbnail}
                    alt={card.title}
                    fill
                    sizes="260px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Bottom gradient overlay */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                  />
                  {/* Title + meta */}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="mb-1 text-lg leading-7 font-bold text-white">{card.title}</h3>
                    <p className="text-xs text-zinc-400">{card.styleTag}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </ScrollReveal>

        {/* Below carousel CTA — hidden on mobile */}
        <ScrollReveal className="mt-12 hidden text-center sm:block" delay={200}>
          <CtaGradient href="#">Clone this project for free</CtaGradient>
        </ScrollReveal>
      </div>
    </section>
  );
}
