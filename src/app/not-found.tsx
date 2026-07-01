import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';

/**
 * Custom 404 page — Server Component.
 *
 * Without this file, Next.js falls back to its default 404 page which
 * inherits the root layout's metadata — making unknown URLs look like the
 * marketing page (200 OK + marketing title in the browser tab). Bad for SEO
 * (search engines can't distinguish real pages from 404s) and bad for UX
 * (no clear "go back home" CTA).
 *
 * This page provides an on-brand 404 with proper navigation back to / and
 * /create. Uses the luxury-dark design system (bg-background, text-primary,
 * Outfit heading font).
 */

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        {/* Large 404 in Outfit (font-heading) */}
        <p
          className="font-heading mb-4 text-[8rem] leading-none font-extrabold tracking-tighter text-white sm:text-[10rem]"
          style={{ fontWeight: 820 }}
        >
          404
        </p>

        {/* Heading */}
        <h1 className="font-heading mb-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Page not found
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mb-10 max-w-sm text-sm text-zinc-400 sm:text-base">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back on track.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="hover:border-primary/40 focus-visible:outline-primary inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
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
