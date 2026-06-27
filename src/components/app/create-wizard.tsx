'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { DEFAULT_STORY_EXAMPLES, STORY_SEEDS } from '@/lib/data/story-seeds';
import { STYLE_CHIPS } from '@/lib/data/style-chips';
import type { AspectRatio } from '@/types';
import { createProjectAction } from '@/features/projects/actions';

const ASPECT_RATIOS: AspectRatio[] = [
  { label: '9:16', value: 'portrait' },
  { label: '16:9', value: 'landscape' },
];

const MAX_STORY_LENGTH = 5000;
const MIN_STORY_LENGTH = 100;
const WARNING_THRESHOLD = 4500;

/**
 * CreateWizard — client component for the /create route.
 *
 * Reuses the Hero's glass-input widget pattern (story textarea, style chips,
 * ratio toggle, character counter). On submit, calls createProjectAction.
 */
export function CreateWizard() {
  const router = useRouter();
  const [story, setStory] = useState('');
  const [style, setStyle] = useState<
    'ghibli' | 'oil-painting' | 'anime' | 'realistic' | 'cyberpunk' | 'watercolor' | 'comic'
  >('anime');
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]!);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChipClick = (label: string) => {
    const seed = STORY_SEEDS[label];
    if (seed) setStory(seed);
  };

  const canSubmit =
    story.length >= MIN_STORY_LENGTH && story.length <= MAX_STORY_LENGTH && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const result = await createProjectAction({
      story,
      style,
      aspectRatio: activeRatio.value,
    });

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    // On success, the action redirects — but if it didn't, navigate manually
    router.push(`/projects/${result.projectId}`);
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <span className="eyebrow mb-4">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Create Your Video
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Paste your story
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Our AI will analyze it and generate a cinematic video in minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-input">
            <label htmlFor="story-input" className="sr-only">
              Your story
            </label>
            <textarea
              id="story-input"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Paste your story here, or write a short idea..."
              className="min-h-[200px] w-full resize-none bg-transparent text-base text-white focus:outline-none"
              rows={8}
              maxLength={MAX_STORY_LENGTH}
            />

            {/* Character counter */}
            <div className="mt-2 flex justify-end">
              <span
                className={cn(
                  'font-mono text-[10px] tabular-nums',
                  story.length >= WARNING_THRESHOLD ? 'text-amber-400' : 'text-zinc-600',
                )}
              >
                {story.length} / {MAX_STORY_LENGTH}
              </span>
            </div>

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

            {/* Visual style selector */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-zinc-400">Visual Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() =>
                      setStyle(chip.label.toLowerCase().replace(/\s+/g, '-') as typeof style)
                    }
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
                      style === chip.label.toLowerCase().replace(/\s+/g, '-')
                        ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                        : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:text-white',
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom action row */}
            <div className="mt-6 flex items-center justify-between">
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

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-[13px] font-bold text-zinc-950 transition-all hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Generating…' : 'Generate Video'}
                {!submitting && <ArrowRight className="h-3 w-3" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {story.length > 0 && story.length < MIN_STORY_LENGTH && (
            <p className="mt-4 text-xs text-zinc-500">
              Story must be at least {MIN_STORY_LENGTH} characters (
              {MIN_STORY_LENGTH - story.length} more needed).
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
