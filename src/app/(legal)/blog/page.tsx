import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog — StoryIntoVideo',
  description:
    'Stories from the team behind StoryIntoVideo — production techniques, AI pipeline deep-dives, and creator showcases.',
};

/**
 * Blog index page — Server Component.
 *
 * The blog is not yet launched. This page provides a proper metadata-bearing
 * placeholder (no 404, no fake content) with a newsletter signup CTA pointing
 * to the support email (mailto: — no form backend wired yet).
 */

export default function BlogPage() {
  return (
    <main className="bg-background min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-heading mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Stories from the team
          </h1>
          <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
            Production techniques, AI pipeline deep-dives, and creator showcases. We&apos;re writing
            our first posts now — subscribe to get notified when we publish.
          </p>
        </div>

        {/* Coming soon card */}
        <div className="bg-card rounded-2xl border border-white/[0.06] p-8 text-center sm:p-12">
          <h2 className="font-heading mb-3 text-2xl font-bold text-white">Coming soon</h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-zinc-400">
            We&apos;re documenting the build of StoryIntoVideo itself — the architecture decisions,
            the AI pipeline tradeoffs, and the production incidents. If that sounds interesting,
            drop us a line and we&apos;ll let you know when the first post goes live.
          </p>

          {/* Newsletter CTA (mailto — no form backend yet) */}
          <a
            href="mailto:support@storyintovideo.com?subject=Blog%20newsletter%20signup"
            className="hover:border-primary/40 focus-visible:outline-primary inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Notify me when you publish
          </a>
        </div>

        {/* Conversion CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-sm text-zinc-500">In the meantime, try the product:</p>
          <Link
            href="/create"
            className="bg-primary hover:bg-primary focus-visible:outline-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Start creating
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}
