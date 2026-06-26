'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

import { StyleChip as StyleChipComponent } from '@/components/primitives/style-chip';
import { DEFAULT_STORY_EXAMPLES, STORY_SEEDS } from '@/lib/data/story-seeds';
import { STYLE_CHIPS } from '@/lib/data/style-chips';
import type { AspectRatio } from '@/types';
import { cn } from '@/lib/utils';

const ASPECT_RATIOS: AspectRatio[] = [
  { label: '9:16', value: 'portrait' },
  { label: '16:9', value: 'landscape' },
];

/**
 * Hero — client component.
 * 4 layers: (1) background video with vertical scrim + radial amber glow,
 * (2) content (eyebrow + H1 in Outfit 820 + subtitle + glass input widget),
 * (3) style tags marquee, (4) bottom fade into next section.
 *
 * Interactions: textarea state, 4 story chips that populate the textarea,
 * aspect ratio toggle (9:16 default active, 16:9 alternate).
 */
export function Hero() {
  const [story, setStory] = useState('');
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]!);

  const handleChipClick = (label: string) => {
    const seed = STORY_SEEDS[label];
    if (seed) setStory(seed);
  };

  return (
    <section className="relative flex flex-col overflow-hidden bg-zinc-950">
      {/* Layer 1: Background video + overlays */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <video
          className="h-full w-full object-cover opacity-100 transition-opacity duration-1000"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-poster.webp"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Vertical scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80" />
        {/* Radial amber glow */}
        <div
          className="absolute top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-[60px]"
          style={{
            background: 'radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0) 65%)',
          }}
        />
      </div>

      {/* Layer 2: Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-32 pb-6 text-center sm:pt-40 sm:pb-8">
        {/* Eyebrow */}
        <span className="eyebrow mb-8 animate-[fade-in-up_0.6s_ease-out_0.05s_both]">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          AI-Powered Story Into Video
        </span>

        {/* H1 — Outfit weight 820 via inline style */}
        <h1
          className="font-heading mb-6 animate-[fade-in-up_0.6s_ease-out_0.1s_both] text-4xl leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl lg:text-[4.5rem]"
          style={{ fontWeight: 820 }}
        >
          Turn Story Into Video
          <br className="hidden sm:block" /> with AI Magic
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-[52ch] animate-[fade-in-up_0.6s_ease-out_0.15s_both] text-base leading-relaxed text-zinc-300/80 drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)] sm:text-lg">
          Paste your story and AI handles the rest — characters, storyboards, voiceover, and
          subtitles, all generated in minutes.
        </p>

        {/* Glass input widget */}
        <div className="w-full max-w-2xl animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
          <div className="glass-input">
            <label htmlFor="story-input" className="sr-only">
              Your story
            </label>
            <textarea
              id="story-input"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Paste your story here, or write a short idea..."
              className="min-h-[78px] w-full resize-none bg-transparent text-base text-white focus:outline-none"
              rows={3}
            />

            {/* Story example chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {DEFAULT_STORY_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => handleChipClick(ex.label)}
                  className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-zinc-400 transition-colors duration-200 hover:bg-white/[0.1] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Bottom action row */}
            <div className="mt-5 flex items-center justify-between">
              {/* Aspect ratio toggle — 44×44px touch targets (WCAG 2.5.5) */}
              <div className="flex items-center gap-1" role="group" aria-label="Aspect ratio">
                {ASPECT_RATIOS.map((ratio) => {
                  const isActive = ratio.label === activeRatio.label;
                  return (
                    <button
                      key={ratio.label}
                      type="button"
                      onClick={() => setActiveRatio(ratio)}
                      aria-pressed={isActive}
                      className={cn(
                        'flex min-h-[44px] min-w-[44px] items-center justify-center px-2 py-1 font-mono text-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
                        isActive
                          ? 'bg-white/[0.1] text-amber-400'
                          : 'text-zinc-600 hover:text-zinc-400',
                      )}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>

              {/* Start Creating CTA — glass pill with amber text */}
              <a
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-zinc-800 to-zinc-900 px-5 py-2.5 text-[13px] font-bold text-amber-300 transition-all hover:from-zinc-700 hover:to-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:py-2"
              >
                Start Creating
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 3: Style tags marquee */}
      <div className="relative z-10 mt-10 animate-[fade-in-up_0.6s_ease-out_0.35s_both] sm:mt-16">
        <div className="marquee-mask overflow-hidden py-4">
          <div className="marquee-track">
            {/* Render chips twice for seamless infinite loop (translateX -50%) */}
            {[...STYLE_CHIPS, ...STYLE_CHIPS].map((chip, idx) => (
              <StyleChipComponent
                key={`${chip.label}-${idx}`}
                label={chip.label}
                sublabel={chip.sublabel}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Layer 4: Bottom fade into next section */}
      <div
        className="relative z-0 h-8 bg-gradient-to-b from-transparent to-zinc-950 sm:h-12"
        aria-hidden="true"
      />
    </section>
  );
}
